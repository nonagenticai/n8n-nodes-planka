import { IExecuteFunctions, NodeApiError } from 'n8n-workflow';

// Connection-layer errors that are safe to retry for a READ-ONLY request.
const TRANSIENT_NET_CODES: ReadonlySet<string> = new Set([
  'ECONNRESET',
  'EPIPE',
  'ECONNREFUSED',
  'ETIMEDOUT',
  'EAI_AGAIN',
]);

const TRANSIENT_NET_MESSAGE_RE = /socket hang up|connection (?:reset|aborted)/i;

// Methods that are SAFE to re-send after the server may have acted: read-only
// by HTTP semantics (RFC 9110 SS9.2.1). Only these are retried on an ambiguous
// failure (a 5xx, ETIMEDOUT, ECONNRESET, socket hang-up).
//
// PUT and DELETE are deliberately ABSENT although RFC 9110 calls them
// idempotent: the handlers are not audited for it, and a re-sent DELETE after
// the first one landed turns a success into a 404. POST and PATCH are absent
// because a re-send double-applies the write.
const IDEMPOTENT_METHODS: ReadonlySet<string> = new Set(['GET', 'HEAD', 'OPTIONS']);

// Failures that happen BEFORE a single request byte reaches the server: the
// TCP connect was refused, or the name never resolved. Only these are retried
// for a non-idempotent method, because only these PROVE the server did nothing.
//
// ⛔ ETIMEDOUT, ECONNRESET, EPIPE and "socket hang up" are NOT here and must
// never be: each can fire after the request was delivered and while (or after)
// the server committed the write, so a re-send double-applies it.
const PRE_SEND_NET_CODES: ReadonlySet<string> = new Set(['ECONNREFUSED', 'ENOTFOUND', 'EAI_AGAIN']);

const PRE_SEND_MESSAGE_RE = /\bconnect ECONNREFUSED\b|\bgetaddrinfo (?:ENOTFOUND|EAI_AGAIN)\b/;

export function isIdempotentMethod(method?: string): boolean {
  if (typeof method !== 'string' || method.length === 0) return false;
  return IDEMPOTENT_METHODS.has(method.trim().toUpperCase());
}

export function isTransientNetworkError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const e = error as { code?: unknown; message?: unknown; cause?: { code?: unknown } };
  if (typeof e.code === 'string' && TRANSIENT_NET_CODES.has(e.code)) return true;
  if (e.cause && typeof e.cause.code === 'string' && TRANSIENT_NET_CODES.has(e.cause.code)) return true;
  if (typeof e.message === 'string' && TRANSIENT_NET_MESSAGE_RE.test(e.message)) return true;
  return false;
}

/** True only when the error proves the request never reached the server. */
export function isPreSendNetworkError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const e = error as { code?: unknown; message?: unknown; cause?: { code?: unknown } };
  // A code, when present, is authoritative: an ETIMEDOUT whose message happens
  // to mention a refused connect is still an ETIMEDOUT.
  const code = typeof e.code === 'string' ? e.code : undefined;
  const causeCode = e.cause && typeof e.cause.code === 'string' ? e.cause.code : undefined;
  if (code !== undefined || causeCode !== undefined) {
    return (
      (code === undefined || PRE_SEND_NET_CODES.has(code)) &&
      (causeCode === undefined || PRE_SEND_NET_CODES.has(causeCode))
    );
  }
  return typeof e.message === 'string' && PRE_SEND_MESSAGE_RE.test(e.message);
}

// ---------------------------------------------------------------------------
// Keep the service's own words.
//
// Every branch below used to pass a FIXED per-status "message:" to NodeApiError,
// which discards the upstream body entirely. n8n serialises only ".message" into
// a "continueOnFail" item ({json:{error: error.message}}) and onto the canvas
// badge, so the operator saw a constant where the diagnosis should have been.
//
// Measured cost: an upstream 400 read as "API token invalid or expired" when
// the service had said "must be a UUID" (two sessions lost), and a Planka 422
// read as "Validation error" when the service had said "Must not have boards" —
// which hid a six-month project leak.
// ---------------------------------------------------------------------------

// A 4xx body can echo what we SENT. Measured reachable leaks: an upstream API put
// the bearer token INSIDE a request header and echoed that header verbatim in its
// 400; FastAPI/pydantic-v2 services (no RequestValidationError handler) echo the
// offending value in detail[].input.
//
// An earlier revision used "length >= 40 and contains no whitespace" as the
// credential test. Measured, that was wrong in BOTH directions: it redacted
// exception names, URLs, file paths and tenant_id=<uuid> (4/4 false positives —
// i.e. it re-created the very constant-message defect this change exists to
// remove), while a DSN password, a bearer token and a JWT embedded in a SENTENCE
// all passed through verbatim (3/4 false negatives). Shape-of-the-VALUE beats
// shape-of-the-string.
const SENSITIVE_KEY = /token|secret|password|passwd|authorization|api[-_]?key|credential|cookie/i;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CREDENTIAL_PATTERNS: RegExp[] = [
  /eyJ[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]+/g,
  /Bearer\s+[A-Za-z0-9._~+/=-]{8,}/gi,
  /[a-z][a-z0-9+.-]*:\/\/[^\s:@/]+:[^\s@/]+@/gi,
  /sk-[A-Za-z0-9]{16,}/g,
  /(?:gh[pousr]|github_pat)_[A-Za-z0-9_]{20,}/g,
];

function scrubString(s: string): string {
  let out = s;
  for (const re of CREDENTIAL_PATTERNS) out = out.replace(re, "<redacted>");
  // A whole string that is ONE opaque run is an opaque credential (an API
  // token looks exactly like this). Deliberately narrow: anything carrying
  // . : / = or whitespace is a path, URL, exception name or sentence and is
  // left alone, and a bare UUID is an identifier worth seeing.
  if (/^[A-Za-z0-9_-]{32,}$/.test(out) && !UUID_RE.test(out)) return "<redacted>";
  return out;
}

function redactSecrets(value: any, depth: number): any {
  if (depth > 4) return "<depth>";
  if (typeof value === "string") return scrubString(value);
  if (Array.isArray(value)) return value.slice(0, 20).map(function (v) { return redactSecrets(v, depth + 1); });
  if (value && typeof value === "object") {
    // FastAPI validation errors carry {loc:[...], input:<what we sent>}. Redact
    // "input" only when its own "loc" names a sensitive field — blanket-redacting
    // "input" would destroy ordinary validation diagnostics.
    let locIsSensitive = false;
    try {
      const loc = (value as any).loc;
      if (Array.isArray(loc)) locIsSensitive = loc.some(function (p: any) { return typeof p === "string" && SENSITIVE_KEY.test(p); });
    } catch { locIsSensitive = false; }
    const out: Record<string, any> = {};
    for (const k of Object.keys(value).slice(0, 40)) {
      if (SENSITIVE_KEY.test(k) || (k === "input" && locIsSensitive)) out[k] = "<redacted>";
      else out[k] = redactSecrets((value as any)[k], depth + 1);
    }
    return out;
  }
  return value;
}

export function upstreamDetail(error: any): string | undefined {
  // TOTAL try/catch is load-bearing. This runs INSIDE an error handler, so
  // anything thrown here replaces a clean, typed failure (a 403 the caller can
  // act on) with an unhandled crash. Measured throwing inputs before the guard:
  // a circular body, a Symbol detail, and a body accessor that throws on read.
  try {
    // ⛔ `.error` IS WHERE n8n PUTS IT. n8n's `ctx.helpers.request` -> proxyRequestToAxios
    // throws Object.assign(error, { statusCode, status, error: responseData,
    // response: pick(response, ["headers","status","statusText"]) }) — the body lands on
    // `.error`, and `response` is picked down to three keys with NO body and NO data.
    // Reading only `.response.body`/`.response.data`/`.body` therefore found NOTHING against
    // live n8n, so this fix was INERT in production from 2026-08-26 until 2026-08-28 while
    // its tests passed against a shape n8n never emits. `.error` goes LAST so an explicit
    // body still wins where one exists.
    let body = error?.response?.body ?? error?.response?.data ?? error?.body ?? error?.error;
    // `.error` is not always a body: for a non-HTTP failure (DNS, TLS, socket) it can be the
    // Error itself, and JSON.stringify(new Error('x')) is '{}' — which would ERASE the
    // diagnosis rather than surface it. Unwrap it.
    if (body instanceof Error) body = { message: body.message };
    if (typeof body === "string") {
      const s = body.trim();
      if (!s) return undefined;
      try {
        body = JSON.parse(s);
      } catch {
        // Non-JSON bodies are scrubbed too — this branch used to return raw.
        return scrubString(s).slice(0, 500);
      }
    }
    const raw =
      body?.detail ??
      body?.message ??
      body?.error_description ??
      body?.error ??
      undefined;
    if (raw === undefined || raw === null) return undefined;
    // JSON.stringify returns undefined for a Symbol/function, so the result is
    // re-checked as a string rather than assumed to be one.
    const text = typeof raw === "string" ? scrubString(raw.trim()) : JSON.stringify(redactSecrets(raw, 0));
    if (typeof text !== "string" || text.length === 0) return undefined;
    return text.slice(0, 500);
  } catch {
    return undefined;
  }
}

export function withDetail(hint: string, error: any): string {
  try {
    const detail = upstreamDetail(error);
    if (!detail) return hint;
    if (detail === hint) return hint;
    if (detail.includes(hint)) return detail;
    return hint + ": " + detail;
  } catch {
    return hint;
  }
}

export class RetryingRequest {
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAYS = [1000, 2000, 4000];

  async executeWithRetry<T>(
    requestFn: () => Promise<T>,
    context: IExecuteFunctions,
    options?: { method?: string },
  ): Promise<T> {
    let lastError: Error;
    for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
      try {
        return await requestFn();
      } catch (error: any) {
        lastError = error;
        const statusCode = error?.statusCode || error?.response?.status;

        if (statusCode === 401) {
          throw new NodeApiError(context.getNode(), error, {
            message: withDetail('API token invalid or expired', error),
            description: 'Check the API token in your credential settings.',
          });
        }
        if (statusCode === 403) {
          throw new NodeApiError(context.getNode(), error, {
            message: withDetail('Access denied', error),
            description: 'Your credentials do not permit this operation.',
          });
        }
        if (statusCode === 429) {
          throw new NodeApiError(context.getNode(), error, {
            message: withDetail('Rate limit exceeded', error),
            description: 'Wait before retrying or upgrade your plan.',
          });
        }

        // An HTTP status means the server RESPONDED, so the request was delivered
        // and processed to some degree; ETIMEDOUT, ECONNRESET and socket hang-up
        // can likewise fire after delivery. For a non-idempotent method a re-send
        // double-applies the write, so only GET/HEAD/OPTIONS retry on an
        // ambiguous failure; every other method (and an absent one — fail SAFE)
        // retries ONLY on a pre-send failure (ECONNREFUSED, DNS).
        const retryable = isIdempotentMethod(options?.method)
          ? (typeof statusCode === 'number' && statusCode >= 500) ||
            isTransientNetworkError(error) ||
            isPreSendNetworkError(error)
          : isPreSendNetworkError(error);
        if (retryable && attempt < this.MAX_RETRIES - 1) {
          await new Promise(r => setTimeout(r, this.RETRY_DELAYS[attempt]));
          continue;
        }
        throw error;
      }
    }
    throw lastError!;
  }
}
