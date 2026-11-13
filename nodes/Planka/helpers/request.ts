import { createHash } from 'node:crypto';
import {
  IExecuteFunctions,
  NodeOperationError,
} from 'n8n-workflow';
import { handleAPIError } from '../../../helpers/errorHandling';

// Module-level token cache, ONE ENTRY PER CREDENTIAL (issue #27).
//
// It used to be a single slot keyed on baseUrl alone, so two plankaApi
// credentials for different users on the same Planka shared whichever token
// logged in first (writes attributed to the wrong user), and a changed
// password was ignored until the 30-minute expiry. The key is now
// baseUrl + emailOrUsername + sha256(password); the plaintext password is
// never part of the key and never logged.
interface CachedToken {
  token: string;
  expiresAt: number;
}

const tokenCache = new Map<string, CachedToken>();

// Token valid for 30 minutes before refresh
const TOKEN_LIFETIME_MS = 30 * 60 * 1000;

function normalizeBaseUrl(credentials: any): string {
  return (credentials.baseUrl as string).replace(/\/$/, '');
}

/**
 * Cache key for one credential. JSON-encoded so no field value can collide
 * with another by containing a separator; the password enters only as its
 * sha256 hex digest.
 */
function tokenCacheKey(credentials: any): string {
  const passwordHash = createHash('sha256')
    .update(String(credentials.password ?? ''), 'utf8')
    .digest('hex');
  return JSON.stringify([
    normalizeBaseUrl(credentials),
    String(credentials.emailOrUsername ?? ''),
    passwordHash,
  ]);
}

/**
 * Get access token using native Planka email/password login
 * Caches the token per credential to avoid repeated logins
 * Auto-refreshes when token is about to expire
 *
 * @param credentials Planka credentials with emailOrUsername and password
 * @returns JWT access token for Planka API
 */
export async function getAccessToken(
  this: IExecuteFunctions,
  credentials: any,
): Promise<string> {
  const baseUrl = normalizeBaseUrl(credentials);
  const key = tokenCacheKey(credentials);
  const now = Date.now();

  // Return cached token if valid and not expired
  const cached = tokenCache.get(key);
  if (cached && now < cached.expiresAt) {
    return cached.token;
  }
  if (cached) {
    tokenCache.delete(key);
  }

  // Login with email/password to get JWT token. A failure throws before the
  // cache is written, so a failed login never leaves an entry behind.
  const token = await loginAndGetToken.call(
    this,
    baseUrl,
    credentials.emailOrUsername as string,
    credentials.password as string,
    credentials.sslOptions,
  );

  // Sweep: an expired entry is otherwise only removed when ITS key is asked
  // for again, so credentials that are never reused would accumulate. The map
  // holds one entry per credential, so an O(n) pass per login is cheap.
  for (const [k, v] of tokenCache) {
    if (now >= v.expiresAt) {
      tokenCache.delete(k);
    }
  }

  // Cache for this credential with expiry
  tokenCache.set(key, { token, expiresAt: now + TOKEN_LIFETIME_MS });

  return token;
}

/**
 * Drop the cached token for ONE credential, but only while it still holds the
 * token that was rejected: if another request already re-logged in, the
 * fresher token is kept.
 */
function invalidateToken(credentials: any, rejectedToken: string): void {
  const key = tokenCacheKey(credentials);
  const cached = tokenCache.get(key);
  if (cached && cached.token === rejectedToken) {
    tokenCache.delete(key);
  }
}

/**
 * Number of cached entries (test hook: lets a test observe the expiry sweep).
 */
export function tokenCacheSize(): number {
  return tokenCache.size;
}

/**
 * Clear every cached token (useful for tests or a forced refresh)
 */
export function clearTokenCache(): void {
  tokenCache.clear();
}

/**
 * Make HTTP request to Planka API with comprehensive error handling
 * Auto-retries on 401 by refreshing the token once
 *
 * The single re-send after a 401 is safe for every method: every Planka route
 * except login runs the `is-authenticated` policy before the controller, so a
 * 401 proves the action did not run (see #23 / 21e97fd). Nothing is re-sent on
 * a 5xx or a timeout.
 *
 * @param method HTTP method (GET, POST, PUT, DELETE, PATCH)
 * @param url Full URL to request
 * @param body Request body (null for GET/DELETE)
 * @param accessToken JWT Bearer token from Planka login
 * @returns Response data
 */
export async function makeRequest(
  this: IExecuteFunctions,
  method: string,
  url: string,
  body: any,
  accessToken: string,
): Promise<any> {

  // Get credentials to access SSL options
  const credentials = await this.getCredentials('plankaApi') as any;

  const options: any = {
    method,
    url,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    json: true,
    rejectUnauthorized: credentials.sslOptions?.ignoreSSL !== true,
  };

  if (body) {
    options.body = body;
  }

  try {
    return await this.helpers.request(options);
  } catch (error: any) {
    // If 401, drop THIS credential's token, re-login and retry once
    if (error.statusCode === 401) {
      invalidateToken(credentials, accessToken);
      const newToken = await getAccessToken.call(this, credentials);
      options.headers['Authorization'] = `Bearer ${newToken}`;

      try {
        return await this.helpers.request(options);
      } catch (retryError: any) {
        if (retryError?.statusCode === 401) {
          invalidateToken(credentials, newToken);
        }
        handleAPIError(this, retryError);
      }
    }

    // Use centralized error handling for other errors
    handleAPIError(this, error);
  }
}

/**
 * Login to Planka and get access token, handling terms acceptance flow
 * @param baseUrl Planka base URL
 * @param emailOrUsername Email or username
 * @param password Password
 * @param sslOptions SSL options
 * @returns Access token
 */
export async function loginAndGetToken(
  this: IExecuteFunctions,
  baseUrl: string,
  emailOrUsername: string,
  password: string,
  sslOptions?: any,
): Promise<string> {
  const options: any = {
    method: 'POST' as const,
    url: `${baseUrl}/api/access-tokens`,
    headers: {
      'Content-Type': 'application/json',
    },
    body: {
      emailOrUsername,
      password,
    },
    json: true,
    rejectUnauthorized: sslOptions?.ignoreSSL !== true,
  };

  try {
    const response = await this.helpers.request(options);
    // Successful login returns { item: "token_string", ...}
    return response.item;
  } catch (error: any) {
    // Handle terms acceptance flow
    if (error.statusCode === 403 && error.response?.body?.code === 'E_FORBIDDEN') {
      const responseBody = error.response.body;
      if (responseBody.step === 'accept-terms' && responseBody.pendingToken) {
        // Terms acceptance required - accept automatically. Planka requires the
        // 64-char signature of the terms being accepted (GET /api/terms, no auth),
        // not a placeholder — a stock Planka rejects anything shorter with 400.
        let signature: string;
        try {
          const terms = await this.helpers.request({
            method: 'GET' as const,
            url: `${baseUrl}/api/terms`,
            json: true,
            rejectUnauthorized: sslOptions?.ignoreSSL !== true,
          });
          signature = terms?.item?.signature;
        } catch (termsFetchError) {
          throw new NodeOperationError(
            this.getNode(),
            `Failed to fetch Planka terms: ${termsFetchError instanceof Error ? termsFetchError.message : String(termsFetchError)}`,
          );
        }
        if (!signature) {
          throw new NodeOperationError(this.getNode(), 'Planka /api/terms returned no signature');
        }

        const termsAcceptOptions: any = {
          method: 'POST' as const,
          url: `${baseUrl}/api/access-tokens/accept-terms`,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            pendingToken: responseBody.pendingToken,
            signature,
          },
          json: true,
          rejectUnauthorized: sslOptions?.ignoreSSL !== true,
        };

        try {
          const termsResponse = await this.helpers.request(termsAcceptOptions);
          return termsResponse.item;
        } catch (termsError) {
          throw new NodeOperationError(
            this.getNode(),
            `Failed to accept terms: ${termsError instanceof Error ? termsError.message : String(termsError)}`,
          );
        }
      }
    }

    // Provide clear error message for auth failures
    if (error.statusCode === 401) {
      throw new NodeOperationError(
        this.getNode(),
        'Planka authentication failed: Invalid email/username or password',
        {
          description: 'Please verify your Planka credentials are correct.',
        },
      );
    }

    throw new NodeOperationError(
      this.getNode(),
      `Planka login failed: ${error.message || String(error)}`,
    );
  }
}
