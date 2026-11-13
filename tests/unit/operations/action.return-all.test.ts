import { IExecuteFunctions } from 'n8n-workflow';
import {
  actionOperations,
  ACTION_MAX_PAGES,
  ACTION_PAGE_SIZE,
  compareDecimalIds,
} from '../../../nodes/Planka/operations/action.operations';
import * as requestHelper from '../../../nodes/Planka/helpers/request';
import { actionFields } from '../../../nodes/Planka/descriptions/action.description';

jest.mock('../../../nodes/Planka/helpers/request');

// Planka ids are bigint strings above 2^53. Base chosen so Number() would collide
// neighbouring ids - the pager must not depend on Number precision.
const BASE = '1357158568008091';

/** n actions, id DESC, ids BASE+NNN (all same length). */
function makeActions(n: number, userCount = 3): any[] {
  const out: any[] = [];
  for (let k = n; k >= 1; k--) {
    out.push({
      id: `${BASE}${String(k).padStart(3, '0')}`,
      type: 'moveCard',
      userId: `u${k % userCount}`,
    });
  }
  return out;
}

/**
 * Fake Planka: serves `all` (id DESC) 50 per page honouring `beforeId` as `id <`,
 * and returns the users referenced on that page in `included.users`.
 */
function fakePlanka(all: any[]) {
  return jest.fn(async (_m: string, url: string) => {
    const m = /[?&]beforeId=([^&]+)/.exec(url);
    const before = m ? decodeURIComponent(m[1]) : null;
    const eligible = before ? all.filter((a) => compareDecimalIds(a.id, before) < 0) : all;
    const items = eligible.slice(0, ACTION_PAGE_SIZE);
    const users = Array.from(new Set(items.map((a) => a.userId))).map((id) => ({ id, name: id }));
    return { items, included: { users } };
  });
}

describe('action:getCardActions / getBoardActions - returnAll paging', () => {
  let ctx: jest.Mocked<IExecuteFunctions>;
  const baseUrl = 'http://planka.example.com:3333';
  const token = 't';
  const mr = requestHelper.makeRequest as jest.Mock;

  const params = (given: Record<string, any>) =>
    jest.fn((name: string, _i: number, fallback?: any) =>
      Object.prototype.hasOwnProperty.call(given, name) ? given[name] : fallback,
    );

  const run = (op: string, given: Record<string, any>) => {
    ctx.getNodeParameter = params(given) as any;
    return actionOperations.execute.call(ctx, op, 0, baseUrl, token);
  };

  beforeEach(() => {
    jest.clearAllMocks();
    ctx = {
      getNodeParameter: jest.fn(),
      getNode: jest.fn().mockReturnValue({ name: 'Planka', type: 'kanban.planka' }),
    } as any;
  });

  it('declares returnAll: boolean, default false, on both action operations', () => {
    const p = actionFields.find((f) => f.name === 'returnAll');
    expect(p).toBeDefined();
    expect(p!.type).toBe('boolean');
    expect(p!.default).toBe(false);
    expect(p!.displayOptions!.show!.operation).toEqual(['getBoardActions', 'getCardActions']);
  });

  it('page size matches the Planka server LIMIT (50)', () => {
    expect(ACTION_PAGE_SIZE).toBe(50);
    expect(ACTION_MAX_PAGES).toBe(200);
  });

  it('returnAll=false: one request, response returned unchanged (card)', async () => {
    const response = { items: makeActions(50), included: { users: [{ id: 'u1' }] } };
    mr.mockResolvedValue(response);
    const out = await run('getCardActions', { cardId: 'c1' });
    expect(mr).toHaveBeenCalledTimes(1);
    expect(mr).toHaveBeenCalledWith('GET', `${baseUrl}/api/cards/c1/actions`, null, token);
    expect(out).toBe(response);
  });

  it('returnAll=false with beforeId: same single URL as before (board)', async () => {
    const response = { items: [], included: { users: [] } };
    mr.mockResolvedValue(response);
    const out = await run('getBoardActions', {
      boardId: 'b1',
      returnAll: false,
      additionalFields: { beforeId: '123' },
    });
    expect(mr).toHaveBeenCalledTimes(1);
    expect(mr).toHaveBeenCalledWith('GET', `${baseUrl}/api/boards/b1/actions?beforeId=123`, null, token);
    expect(out).toBe(response);
  });

  it.each([
    [0, 1],
    [50, 2],
    [51, 2],
    [91, 2],
    [100, 3],
  ])('returnAll=true with %i actions: all returned id DESC in %i request(s)', async (n, reqs) => {
    const all = makeActions(n);
    mr.mockImplementation(fakePlanka(all));
    const out = await run('getCardActions', { cardId: 'c1', returnAll: true });

    expect(mr).toHaveBeenCalledTimes(reqs);
    expect(out.pages).toBe(reqs);
    expect(out.items).toHaveLength(n);
    expect(out.items.map((a: any) => a.id)).toEqual(all.map((a) => a.id));
    // first request has no cursor; each next cursor is the previous page's min id
    expect(mr.mock.calls[0][1]).toBe(`${baseUrl}/api/cards/c1/actions`);
    for (let p = 1; p < reqs; p++) {
      const prevMin = all[p * ACTION_PAGE_SIZE - 1].id;
      expect(mr.mock.calls[p][1]).toBe(`${baseUrl}/api/cards/c1/actions?beforeId=${prevMin}`);
    }
  });

  it('50 actions: requests a 2nd page, which returns 0', async () => {
    mr.mockImplementation(fakePlanka(makeActions(50)));
    const out = await run('getBoardActions', { boardId: 'b1', returnAll: true });
    expect(mr).toHaveBeenCalledTimes(2);
    const second = await mr.mock.results[1].value;
    expect(second.items).toHaveLength(0);
    expect(out.items).toHaveLength(50);
  });

  it('dedupes included.users by id across pages', async () => {
    mr.mockImplementation(fakePlanka(makeActions(91, 3)));
    const out = await run('getCardActions', { cardId: 'c1', returnAll: true });
    // every page references u0,u1,u2; merged result must hold each once
    expect(out.included.users.map((u: any) => u.id).sort()).toEqual(['u0', 'u1', 'u2']);
    expect(Object.keys(out)).toEqual(['items', 'included', 'pages']);
  });

  it('honours additionalFields.beforeId as the starting cursor', async () => {
    const all = makeActions(91);
    mr.mockImplementation(fakePlanka(all));
    const start = all[10].id; // actions strictly below it: 80
    const out = await run('getCardActions', {
      cardId: 'c1',
      returnAll: true,
      additionalFields: { beforeId: start },
    });
    expect(mr.mock.calls[0][1]).toBe(`${baseUrl}/api/cards/c1/actions?beforeId=${start}`);
    expect(out.items).toHaveLength(80);
    expect(out.items[0].id).toBe(all[11].id);
  });

  it(`throws pagination_ceiling after ${ACTION_MAX_PAGES} full pages instead of truncating`, async () => {
    // an endless descending history: every page is full
    let next = 10n ** 18n;
    mr.mockImplementation(async () => {
      const items = [];
      for (let k = 0; k < ACTION_PAGE_SIZE; k++) {
        items.push({ id: (next--).toString(), userId: 'u0' });
      }
      return { items, included: { users: [{ id: 'u0' }] } };
    });
    await expect(run('getCardActions', { cardId: 'c1', returnAll: true })).rejects.toThrow(
      /pagination_ceiling/,
    );
    expect(mr).toHaveBeenCalledTimes(ACTION_MAX_PAGES);
  });

  it('199 full pages + a short last page is NOT a ceiling error', async () => {
    let next = 10n ** 18n;
    let call = 0;
    mr.mockImplementation(async () => {
      call += 1;
      const size = call < ACTION_MAX_PAGES ? ACTION_PAGE_SIZE : 7;
      const items = [];
      for (let k = 0; k < size; k++) items.push({ id: (next--).toString(), userId: 'u0' });
      return { items, included: { users: [{ id: 'u0' }] } };
    });
    const out = await run('getCardActions', { cardId: 'c1', returnAll: true });
    expect(out.pages).toBe(ACTION_MAX_PAGES);
    expect(out.items).toHaveLength((ACTION_MAX_PAGES - 1) * ACTION_PAGE_SIZE + 7);
  });

  it('throws if the server ignores beforeId (cursor does not advance)', async () => {
    const page = makeActions(50);
    mr.mockResolvedValue({ items: page, included: { users: [] } });
    await expect(run('getCardActions', { cardId: 'c1', returnAll: true })).rejects.toThrow(
      /cursor did not advance/,
    );
    expect(mr).toHaveBeenCalledTimes(2);
  });

  it('compareDecimalIds orders bigint strings beyond 2^53 correctly', () => {
    expect(compareDecimalIds('9007199254740993', '9007199254740992')).toBe(1);
    expect(compareDecimalIds('999', '1000')).toBe(-1);
    expect(compareDecimalIds('42', '42')).toBe(0);
  });
});
