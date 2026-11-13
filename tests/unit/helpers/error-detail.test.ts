import { NodeApiError } from 'n8n-workflow';
import { handleAPIError } from '../../../helpers/errorHandling';
import { RetryingRequest, withDetail, upstreamDetail } from '../../../helpers/requestExecution';

/**
 * THE DEFECT THIS PINS.
 *
 * Every 401/403/402/429 branch used to pass a FIXED string as NodeApiError's
 * `message`, discarding the service's own body. n8n serialises ONLY `.message`
 * into a continueOnFail item and onto the canvas badge, so the operator saw a
 * constant where the diagnosis should have been.
 *
 * Measured cost: an upstream 400 read as "API token invalid or expired" when
 * the service had said `must be a UUID`; a Planka 422 read as "Validation error"
 * when the service had said "Must not have boards" — which hid a six-month leak.
 *
 * These assertions run against the CONSTRUCTED NodeApiError, not against the
 * options object, because n8n's constructor can still rewrite `.message` after
 * it is set (setDescriptiveErrorMessage). Asserting the input would be vacuous.
 */
const node = { name: 'T', type: 't', typeVersion: 1, position: [0, 0] as [number, number], parameters: {} };
const ctx = { getNode: () => node } as any;

const err = (status: number, body: any) => ({ statusCode: status, response: { status, body } });

describe('upstream error body survives into NodeApiError.message', () => {
  const auth = new RetryingRequest();
  const run = (e: any) => auth.executeWithRetry(() => Promise.reject(e), ctx);

  /**
   * ⛔ THE SHAPE n8n ACTUALLY THROWS — every other case in this file uses
   * `{statusCode, response:{status, body}}`, which n8n NEVER produces.
   * `ctx.helpers.request` -> proxyRequestToAxios throws
   *   Object.assign(err, { statusCode, status, error: responseData,
   *                        response: pick(response, ['headers','status','statusText']) })
   * so the body is on `.error` and `response` carries NO body and NO data.
   * From 2026-08-26 until 2026-08-28 this whole suite was green while the fix
   * was INERT in production, because the fixture could not occur.
   */
  const realN8n = (status: number, body: any) =>
    Object.assign(new Error(`${status} - ${JSON.stringify(body)}`), {
      statusCode: status,
      status,
      error: body,
      response: { headers: {}, status, statusText: 'Unauthorized' },
    });

  it('the REAL n8n error shape (body on .error) reaches .message', async () => {
    await expect(run(realN8n(401, { message: 'Unauthorized' })))
      .rejects.toMatchObject({ message: expect.stringContaining('Unauthorized') });
  });

  it('and the fixture the rest of this file uses genuinely lacks a body — that is why it was inert', () => {
    const e: any = realN8n(401, { message: 'Unauthorized' });
    expect(Object.keys(e.response).sort()).toEqual(['headers', 'status', 'statusText']);
    expect(e.response.body).toBeUndefined();
    expect(e.response.data).toBeUndefined();
    expect(e.body).toBeUndefined();
  });

  it('403: the service reason reaches .message, not just the fixed hint', async () => {
    await expect(run(err(403, { detail: "Role 'board-admin' required" })))
      .rejects.toMatchObject({ message: "Access denied: Role 'board-admin' required" });
  });

  it('401: ditto, and this is the exact string that cost two sessions', async () => {
    await expect(run(err(401, { detail: 'must be a UUID' })))
      .rejects.toMatchObject({ message: 'API token invalid or expired: must be a UUID' });
  });

  it('429 and 402 are enriched too — the fix is not 401/403-only', async () => {
    await expect(run(err(429, { message: 'quota exhausted for tenant X' })))
      .rejects.toMatchObject({ message: 'Rate limit exceeded: quota exhausted for tenant X' });
  });

  it('the thrown object really is a NodeApiError (not a plain Error)', async () => {
    await expect(run(err(403, { detail: 'nope' }))).rejects.toBeInstanceOf(NodeApiError);
  });

  it('NO body: falls back to the bare hint, never "hint: undefined"', async () => {
    await expect(run(err(403, undefined)))
      .rejects.toMatchObject({ message: 'Access denied' });
  });

  it('body REPEATS the hint: renders once, never "X: X"', async () => {
    expect(withDetail('Access denied', err(403, { message: 'Access denied' }))).toBe('Access denied');
  });

  it('body is a superset of the hint: prefer the service wording', () => {
    expect(withDetail('Access denied', err(403, { message: 'Access denied by policy P7' })))
      .toBe('Access denied by policy P7');
  });

  it('reads a JSON string body, and a non-JSON string body', () => {
    expect(upstreamDetail({ response: { body: '{"detail":"parsed"}' } })).toBe('parsed');
    expect(upstreamDetail({ response: { body: 'plain text refusal' } })).toBe('plain text refusal');
  });

  it('empty / whitespace body is treated as absent', () => {
    expect(upstreamDetail({ response: { body: '   ' } })).toBeUndefined();
    expect(upstreamDetail({ response: { body: { detail: '' } } })).toBeUndefined();
  });

  it('a non-string detail is stringified rather than dropped', () => {
    expect(upstreamDetail({ response: { body: { detail: { field: 'x' } } } })).toBe('{"field":"x"}');
  });

  it('caps a hostile body so an error message cannot become a log bomb', () => {
    // Must contain whitespace, or the redactor classifies it as an opaque
    // credential and replaces it before the cap is ever reached. Both guards
    // are real; this one asserts the cap specifically.
    const wordy = ('lorem ipsum ').repeat(500);
    const d = upstreamDetail({ response: { body: { detail: wordy } } })!;
    expect(d.length).toBe(500);
  });

  it('a long OPAQUE run is redacted rather than capped', () => {
    expect(upstreamDetail({ response: { body: { detail: 'z'.repeat(5000) } } })).toBe('<redacted>');
  });
});

describe('errorHandling chokepoint: every status branch carries the body', () => {
  const call = (status: number, body: any) => () =>
    handleAPIError(ctx, { statusCode: status, response: { status, body } });

  // THE MEASURED CASE: this 422 read as a bare "Validation error" for six months
  // while Planka was saying exactly why, and the demos leaked a project per run.
  it('422 surfaces Planka\'s real refusal', () => {
    expect(call(422, { message: 'Must not have boards' }))
      .toThrow('Validation error: Must not have boards');
  });

  it('403 surfaces the real reason', () => {
    expect(call(403, { message: 'Not enough rights' })).toThrow('Access denied: Not enough rights');
  });

  it('400 surfaces the real reason', () => {
    expect(call(400, { message: 'Invalid idInput' })).toThrow('Invalid request: Invalid idInput');
  });

  it('500 surfaces the real reason — the attachments demo case', () => {
    expect(call(500, { message: 'Input Buffer is empty' }))
      .toThrow('Server error: Input Buffer is empty');
  });

  it('no body still yields the bare hint', () => {
    expect(call(404, undefined)).toThrow('Resource not found');
  });
});

describe('withDetail can never throw — it runs INSIDE an error handler', () => {
  // A throw here would replace a clean, typed failure (a 403 the caller can act
  // on) with an unhandled crash. All three of these DID throw before the guard:
  // circular -> JSON.stringify throws; Symbol -> JSON.stringify returns undefined
  // and then .length throws; a throwing accessor propagates.
  const circular: any = { detail: {} };
  circular.detail.self = circular.detail;
  const throwingGetter: any = { response: {} };
  Object.defineProperty(throwingGetter.response, 'body', {
    get() { throw new Error('boom'); },
  });

  const hostile: Array<[string, any]> = [
    ['array body', { response: { body: ['a', 'b'] } }],
    ['number body', { response: { body: 42 } }],
    ['boolean body', { response: { body: true } }],
    ['null body', { response: { body: null } }],
    ['undefined error', undefined],
    ['null error', null],
    ['string error', 'plain string'],
    ['circular detail', { response: { body: circular } }],
    ['Symbol detail', { response: { body: { detail: Symbol('s') } } }],
    ['throwing accessor', throwingGetter],
    ['null-prototype body', { response: { body: Object.assign(Object.create(null), { detail: 'np' }) } }],
    ['frozen body', { response: { body: Object.freeze({ detail: 'fz' }) } }],
  ];

  it.each(hostile)('%s does not throw and still yields a usable string', (_name, e) => {
    let out: string | undefined;
    expect(() => { out = withDetail('Access denied', e); }).not.toThrow();
    expect(typeof out).toBe('string');
    expect((out as string).startsWith('Access denied')).toBe(true);
  });

  it('a hostile body still cannot exceed the 500-char cap', () => {
    const wordy = ('alpha beta ').repeat(900);
    const d = upstreamDetail({ response: { body: { detail: wordy } } })!;
    expect(d.length).toBe(500);
  });
});

describe('a 4xx body can echo what we sent — redact before surfacing it', () => {
  // FastAPI/pydantic-v2 puts the offending value in `input`, and these demos do
  // post token values (an expiration service posts one to revoke a token). Without
  // this, the fix would write a live credential into n8n execution data and into
  // committed smoke artifacts — a NEW leak introduced by a diagnostics change.
  const TOKEN = 'ipYyvV_RuxcGsgE8A6k9FzJme9bMb4D-h1zWGsNKhdQxxxxxxxxxxxxxxxx';

  it('redacts a token echoed back in a FastAPI validation error', () => {
    const out = withDetail('Access denied', {
      response: { body: { detail: [{ type: 'string_type', loc: ['body', 'token'], msg: 'bad', input: TOKEN }] } },
    });
    expect(out).not.toContain(TOKEN);
    expect(out).toContain('<redacted>');
  });

  it('redacts by key name', () => {
    const out = withDetail('Access denied', {
      response: { body: { detail: { authorization: 'Bearer ' + TOKEN, why: 'nope' } } },
    });
    expect(out).not.toContain(TOKEN);
    expect(out).toContain('why');
  });

  it('redacts a bare long opaque string', () => {
    expect(upstreamDetail({ response: { body: { detail: TOKEN } } })).toBe('<redacted>');
  });

  // The whole point is to keep the diagnosis. If redaction ate these, the change
  // would be self-defeating — these are the two cases that motivated it.
  it('KEEPS an upstream role refusal verbatim', () => {
    expect(upstreamDetail({ response: { body: { detail: "Role 'board-admin' required" } } }))
      .toBe("Role 'board-admin' required");
  });

  it('KEEPS the Planka refusal verbatim — the six-month-leak case', () => {
    expect(upstreamDetail({ response: { body: { message: 'Must not have boards' } } }))
      .toBe('Must not have boards');
  });
});

describe('redaction: measured false-positives must survive, false-negatives must not', () => {
  // An earlier revision used "length >= 40 and no whitespace" as the credential
  // test. An adversarial review measured it wrong in BOTH directions. These are
  // that reviewer's exact cases, kept as the regression battery.
  const MUST_SURVIVE: Array<[string, string]> = [
    ['neo4j exception name', 'neo4j.exceptions.ClientError:Schema.ConstraintValidationFailed'],
    ['a URL', 'https://api.example.com:8900/v1/nodes?tenant=abc'],
    ['a file path', '/data/uploads/2026/08/attachment-9f3a2b7c8d4e.pdf'],
    ['a tenant id', 'tenant_id=3fa85f64-5717-4562-b3fc-2c963f66afa6'],
    ['a bare uuid', '3fa85f64-5717-4562-b3fc-2c963f66afa6'],
  ];
  it.each(MUST_SURVIVE)('keeps %s', (_n, v) => {
    expect(upstreamDetail({ response: { body: { detail: v } } })).toBe(v);
  });

  const MUST_REDACT: Array<[string, string]> = [
    ['a DSN password inside a sentence', 'could not connect to postgresql://kag:S3cretPassw0rd@db.example.com:5432/app'],
    ['a bearer token inside a sentence', 'rejected header Authorization: Bearer abcdefghijklmnop12345 for tenant x'],
    ['a JWT inside a sentence', "Invalid X-Tenant-Id 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.SsEcRetSiGnAtUrE': must be a UUID"],
    ['an sk- provider key', 'provider rejected sk-abcdefghijklmnopqrstuvwx'],
  ];
  it.each(MUST_REDACT)('redacts %s', (_n, v) => {
    const out = upstreamDetail({ response: { body: { detail: v } } })!;
    expect(out).toContain('<redacted>');
    expect(out).not.toMatch(/S3cretPassw0rd|abcdefghijklmnop12345|SsEcRetSiGnAtUrE|sk-abcdefghijklmnopqrstuvwx/);
  });

  it('scrubs a NON-JSON string body too — that branch used to return raw', () => {
    const out = upstreamDetail({ response: { body: 'upstream said Bearer abcdefghijklmnop12345 nope' } })!;
    expect(out).toContain('<redacted>');
    expect(out).not.toContain('abcdefghijklmnop12345');
  });

  it('redacts a FastAPI input ONLY when its own loc names a sensitive field', () => {
    const sensitive = withDetail('Bad request', {
      response: { body: { detail: [{ loc: ['body', 'token'], msg: 'bad', input: 'ipYyvV_RuxcGsgE8A6k9FzJme9bMb4D' }] } },
    });
    expect(sensitive).toContain('<redacted>');
    // ...and NOT otherwise: blanket-redacting `input` would destroy ordinary
    // validation diagnostics, which are exactly what we are trying to surface.
    const ordinary = withDetail('Bad request', {
      response: { body: { detail: [{ loc: ['body', 'name'], msg: 'too short', input: 'ab' }] } },
    });
    expect(ordinary).toContain('too short');
    expect(ordinary).toContain('ab');
  });
});
