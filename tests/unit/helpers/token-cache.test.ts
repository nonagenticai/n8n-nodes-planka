import { IExecuteFunctions, NodeOperationError } from 'n8n-workflow';
import {
	getAccessToken,
	makeRequest,
	clearTokenCache,
	tokenCacheSize,
} from '../../../nodes/Planka/helpers/request';

/**
 * Issue #27: the Planka token cache is per CREDENTIAL, not per baseUrl.
 *
 * A fake Planka behind helpers.request: POST /api/access-tokens mints a token
 * that names the user and the password it was issued for, and counts logins;
 * every other request records the bearer it carried. Tokens listed in
 * `revoked` get a 401.
 */

const BASE = 'http://planka.test:3333';
const OTHER = 'http://planka-other.test:3333';

const alice = { baseUrl: BASE, emailOrUsername: 'alice', password: 'pw-a' };
const bob = { baseUrl: `${BASE}/`, emailOrUsername: 'bob', password: 'pw-b' };

let logins: Array<{ emailOrUsername: string; host?: string }>;
let bearers: string[];
let requests: Array<{ url: string; bearer: string }>;
let revoked: Set<string>;
let loginFailsFor: Set<string>;
let credentialsForCall: any;

function fakeRequest(options: any): Promise<any> {
	const host = [BASE, OTHER].find((h) => String(options.url).startsWith(`${h}/`));
	if (!host) {
		return Promise.reject(new Error(`unexpected host: ${options.url}`));
	}
	if (options.method === 'POST' && options.url === `${host}/api/access-tokens`) {
		const { emailOrUsername, password } = options.body;
		logins.push({ emailOrUsername, host });
		if (loginFailsFor.has(emailOrUsername)) {
			return Promise.reject({ statusCode: 401, message: 'Unauthorized' });
		}
		const tag = host === BASE ? 'base' : 'other';
		return Promise.resolve({ item: `tok:${emailOrUsername}:${password}:${tag}:${logins.length}` });
	}
	const bearer = String(options.headers.Authorization).replace(/^Bearer /, '');
	bearers.push(bearer);
	requests.push({ url: options.url, bearer });
	if (revoked.has(bearer)) {
		return Promise.reject({ statusCode: 401, message: 'Unauthorized' });
	}
	return Promise.resolve({ ok: true, as: bearer });
}

function ctx(): IExecuteFunctions {
	return {
		helpers: { request: jest.fn(fakeRequest) },
		getNode: jest.fn().mockReturnValue({ name: 'Planka', type: 'kanban.planka' }),
		getCredentials: jest.fn(async () => credentialsForCall),
	} as any;
}

async function requestAs(credentials: any, path: string, method = 'GET'): Promise<any> {
	const c = ctx();
	credentialsForCall = credentials;
	const token = await getAccessToken.call(c, credentials);
	const host = String(credentials.baseUrl).replace(/\/$/, '');
	return makeRequest.call(c, method, `${host}${path}`, method === 'GET' ? null : { x: 1 }, token);
}

beforeEach(() => {
	clearTokenCache();
	logins = [];
	bearers = [];
	requests = [];
	revoked = new Set();
	loginFailsFor = new Set();
	credentialsForCall = undefined;
});

afterEach(() => {
	jest.restoreAllMocks();
});

describe('Planka token cache is per credential (#27)', () => {
	it('two credentials on the same baseUrl -> two logins, two tokens, each request uses its own', async () => {
		const a = await requestAs(alice, '/api/cards/1', 'PATCH');
		const b = await requestAs(bob, '/api/cards/2', 'PATCH');

		expect(logins.map((l) => l.emailOrUsername)).toEqual(['alice', 'bob']);
		expect(a.as).toMatch(/^tok:alice:/);
		expect(b.as).toMatch(/^tok:bob:/);
		expect(a.as).not.toEqual(b.as);

		// Interleave again: still no extra logins, still each its own token.
		const a2 = await requestAs(alice, '/api/cards/3');
		const b2 = await requestAs(bob, '/api/cards/4');
		expect(logins).toHaveLength(2);
		expect(a2.as).toEqual(a.as);
		expect(b2.as).toEqual(b.as);
	});

	it('the same credential twice -> one login (the cache still works)', async () => {
		const t1 = await getAccessToken.call(ctx(), alice);
		const t2 = await getAccessToken.call(ctx(), { ...alice, baseUrl: `${BASE}/` });
		expect(t1).toEqual(t2);
		expect(logins).toHaveLength(1);
	});

	it('a changed password -> re-login, new token', async () => {
		const t1 = await getAccessToken.call(ctx(), alice);
		const t2 = await getAccessToken.call(ctx(), { ...alice, password: 'pw-a-new' });
		expect(logins).toHaveLength(2);
		expect(t1).not.toEqual(t2);
		expect(t2).toMatch(/^tok:alice:pw-a-new:/);
	});

	it('a failed login is not cached: the next call logs in again', async () => {
		loginFailsFor.add('alice');
		await expect(getAccessToken.call(ctx(), alice)).rejects.toThrow(NodeOperationError);
		expect(logins).toHaveLength(1);

		loginFailsFor.clear();
		const t = await getAccessToken.call(ctx(), alice);
		expect(t).toMatch(/^tok:alice:/);
		expect(logins).toHaveLength(2);

		// ...and the successful one IS cached.
		await getAccessToken.call(ctx(), alice);
		expect(logins).toHaveLength(2);
	});

	it('expiry is respected per entry (30 min)', async () => {
		let now = 1_000_000;
		jest.spyOn(Date, 'now').mockImplementation(() => now);

		const t1 = await getAccessToken.call(ctx(), alice);
		now += 29 * 60 * 1000;
		await getAccessToken.call(ctx(), bob); // bob's entry starts later
		expect(await getAccessToken.call(ctx(), alice)).toEqual(t1);
		expect(logins).toHaveLength(2);

		now += 2 * 60 * 1000; // alice is 31 min old, bob is 2 min old
		const t2 = await getAccessToken.call(ctx(), alice);
		expect(t2).not.toEqual(t1);
		await getAccessToken.call(ctx(), bob);
		expect(logins.map((l) => l.emailOrUsername)).toEqual(['alice', 'bob', 'alice']);
	});

	it('a 401 drops only that credential, re-logs in once and retries once with its own token', async () => {
		const aliceTok = await getAccessToken.call(ctx(), alice);
		const bobTok = await getAccessToken.call(ctx(), bob);
		revoked.add(aliceTok);

		const res = await requestAs(alice, '/api/cards/9', 'POST');
		expect(res.as).toMatch(/^tok:alice:/);
		expect(res.as).not.toEqual(aliceTok);
		expect(logins.map((l) => l.emailOrUsername)).toEqual(['alice', 'bob', 'alice']);
		// exactly one re-send of the POST
		expect(bearers).toEqual([aliceTok, res.as]);

		// bob's entry was untouched
		expect(await getAccessToken.call(ctx(), bob)).toEqual(bobTok);
		expect(logins).toHaveLength(3);
	});

	it('a stale token on a later item reuses the already-refreshed entry instead of logging in again', async () => {
		const stale = await getAccessToken.call(ctx(), alice);
		revoked.add(stale);
		const c = ctx();
		credentialsForCall = alice;
		const r1 = await makeRequest.call(c, 'GET', `${BASE}/api/a`, null, stale);
		const r2 = await makeRequest.call(c, 'GET', `${BASE}/api/b`, null, stale);
		expect(r1.as).toEqual(r2.as);
		expect(logins).toHaveLength(2);
	});

	it('same baseUrl + same password, different emailOrUsername -> two logins, two tokens, each request its own', async () => {
		const svc1 = { baseUrl: BASE, emailOrUsername: 'svc-one', password: 'shared-pw' };
		const svc2 = { baseUrl: BASE, emailOrUsername: 'svc-two', password: 'shared-pw' };

		const r1 = await requestAs(svc1, '/api/cards/1', 'PATCH');
		const r2 = await requestAs(svc2, '/api/cards/2', 'PATCH');

		expect(logins.map((l) => l.emailOrUsername)).toEqual(['svc-one', 'svc-two']);
		expect(r1.as).toMatch(/^tok:svc-one:/);
		expect(r2.as).toMatch(/^tok:svc-two:/);
		expect(r1.as).not.toEqual(r2.as);
		expect(requests).toEqual([
			{ url: `${BASE}/api/cards/1`, bearer: r1.as },
			{ url: `${BASE}/api/cards/2`, bearer: r2.as },
		]);

		// Reuse: each still gets its own cached token, no extra logins.
		expect((await requestAs(svc1, '/api/cards/3')).as).toEqual(r1.as);
		expect((await requestAs(svc2, '/api/cards/4')).as).toEqual(r2.as);
		expect(logins).toHaveLength(2);
	});

	it('same emailOrUsername + password on two baseUrls -> two logins, each request to its own host with its own token', async () => {
		const onBase = { baseUrl: BASE, emailOrUsername: 'alice', password: 'pw-a' };
		const onOther = { baseUrl: `${OTHER}/`, emailOrUsername: 'alice', password: 'pw-a' };

		const r1 = await requestAs(onBase, '/api/cards/1');
		const r2 = await requestAs(onOther, '/api/cards/2');

		expect(logins).toEqual([
			{ emailOrUsername: 'alice', host: BASE },
			{ emailOrUsername: 'alice', host: OTHER },
		]);
		expect(r1.as).toMatch(/^tok:alice:pw-a:base:/);
		expect(r2.as).toMatch(/^tok:alice:pw-a:other:/);
		expect(requests).toEqual([
			{ url: `${BASE}/api/cards/1`, bearer: r1.as },
			{ url: `${OTHER}/api/cards/2`, bearer: r2.as },
		]);

		expect((await requestAs(onBase, '/api/cards/3')).as).toEqual(r1.as);
		expect((await requestAs(onOther, '/api/cards/4')).as).toEqual(r2.as);
		expect(logins).toHaveLength(2);
	});

	it('a login sweeps expired entries of OTHER credentials', async () => {
		let now = 1_000_000;
		jest.spyOn(Date, 'now').mockImplementation(() => now);

		await getAccessToken.call(ctx(), alice);
		expect(tokenCacheSize()).toBe(1);

		now += 31 * 60 * 1000; // alice's entry has expired
		await getAccessToken.call(ctx(), bob); // a login for a different key
		expect(tokenCacheSize()).toBe(1); // alice's expired entry is gone, only bob's remains

		// A still-valid entry is NOT swept.
		now += 1000;
		await getAccessToken.call(ctx(), { ...alice, password: 'pw-a-2' });
		expect(tokenCacheSize()).toBe(2);
		expect(logins).toHaveLength(3);
	});

	it('never puts the plaintext password into an error message', async () => {
		loginFailsFor.add('alice');
		const err: any = await getAccessToken.call(ctx(), alice).catch((e) => e);
		expect(String(err?.message)).not.toContain(alice.password);
		expect(JSON.stringify(err?.description ?? '')).not.toContain(alice.password);
	});
});
