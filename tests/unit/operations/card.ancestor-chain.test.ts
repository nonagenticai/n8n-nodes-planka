import { IExecuteFunctions } from 'n8n-workflow';
import { cardOperations } from '../../../nodes/Planka/operations/card.operations';
import * as requestHelper from '../../../nodes/Planka/helpers/request';
import { PLACEHOLDER_PROJECT_ID } from '../../../nodes/Planka/helpers/ancestorChain';

jest.mock('../../../nodes/Planka/helpers/request');

const baseUrl = 'http://planka.test';
const token = 't';
const P1 = '11111111-2222-4333-8444-555555555555';
const P2 = '99999999-2222-4333-8444-555555555555';

// Board-level definitions: Metadata.project_id (f-pid) and Relations.parent_card (f-par).
const boardResp = {
  item: { id: 'B' },
  included: {
    customFieldGroups: [
      { id: 'g-meta', name: 'Metadata', boardId: 'B' },
      { id: 'g-rel', name: 'Relations', boardId: 'B' },
    ],
    customFields: [
      { id: 'f-pid', name: 'project_id', customFieldGroupId: 'g-meta' },
      { id: 'f-par', name: 'parent_card', customFieldGroupId: 'g-rel' },
    ],
  },
};

interface CardSpec {
  board?: string | null;
  pid?: string | string[];
  parent?: string | string[];
  included?: any;
}

function cardResp(id: string, spec: CardSpec) {
  const values: any[] = [];
  for (const p of ([] as string[]).concat(spec.pid ?? [])) values.push({ cardId: id, customFieldId: 'f-pid', content: p });
  for (const p of ([] as string[]).concat(spec.parent ?? [])) values.push({ cardId: id, customFieldId: 'f-par', content: p });
  const item: any = { id };
  if (spec.board !== null) item.boardId = spec.board ?? 'B';
  return { item, included: { customFieldValues: values, ...(spec.included || {}) } };
}

let cards: Record<string, any>;
let boardFails: boolean;

function install() {
  (requestHelper.makeRequest as jest.Mock).mockImplementation(async (_m: string, url: string) => {
    const b = url.match(/\/api\/boards\/(.+)$/);
    if (b) {
      if (boardFails) throw new Error('board 500');
      return boardResp;
    }
    const c = url.match(/\/api\/cards\/(.+)$/);
    const id = decodeURIComponent(c![1]);
    if (!(id in cards)) throw new Error('The resource you are requesting could not be found');
    return cards[id];
  });
}

function ctx(params: Record<string, unknown>): IExecuteFunctions {
  return {
    getNodeParameter: jest.fn((name: string, _i: number, dflt?: unknown) => (name in params ? params[name] : dflt)),
    getNode: jest.fn().mockReturnValue({ name: 'Planka', type: 'kanban.planka' }),
  } as any;
}

const run = (params: Record<string, unknown>) =>
  cardOperations.execute.call(ctx(params), 'getAncestorChain', 0, baseUrl, token);

function cardUrls(): string[] {
  return (requestHelper.makeRequest as jest.Mock).mock.calls.map((c) => c[1]).filter((u: string) => u.includes('/api/cards/'));
}

describe('card.getAncestorChain', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    boardFails = false;
    cards = {};
    install();
  });

  it('resolves the first ancestor project_id (happy path, 2 hops)', async () => {
    cards = { S: cardResp('S', { parent: 'A' }), A: cardResp('A', { parent: 'G' }), G: cardResp('G', { pid: P1 }) };
    const r = await run({ cardId: 'S' });
    expect(r).toMatchObject({ card_id: 'S', board_id: 'B', start_parents: ['A'], resolved: P1, source: 'ancestor_walk', stop: 'resolved', reason: null, chain: ['A', 'G'], visited: ['S', 'A', 'G'], hops: 2, cap: 40, rejected: [], known_source_out_of_reach: null });
    // board fetched exactly once; one card:get per hop + start
    expect((requestHelper.makeRequest as jest.Mock).mock.calls.filter((c) => c[1].includes('/api/boards/'))).toHaveLength(1);
    expect(cardUrls()).toEqual([`${baseUrl}/api/cards/S`, `${baseUrl}/api/cards/A`, `${baseUrl}/api/cards/G`]);
  });

  it('first-line normalisation recovers a UUID doubled across a newline', async () => {
    cards = { S: cardResp('S', { parent: 'A\nA' }), A: cardResp('A', { pid: `${P1}\n${P1}` }) };
    const r = await run({ cardId: 'S' });
    expect(r.resolved).toBe(P1);
    expect(r.start_parents).toEqual(['A']);
  });

  it('no parent at all -> chain_exhausted_no_project_id with zero hops', async () => {
    cards = { S: cardResp('S', {}) };
    const r = await run({ cardId: 'S' });
    expect(r).toMatchObject({ stop: 'chain_exhausted_no_project_id', hops: 0, chain: [], resolved: null });
    expect(r.reason).toMatch(/walked to its root/);
  });

  it('root without project -> chain_exhausted_no_project_id', async () => {
    cards = { S: cardResp('S', { parent: 'A' }), A: cardResp('A', {}) };
    expect(await run({ cardId: 'S' })).toMatchObject({ stop: 'chain_exhausted_no_project_id', hops: 1, chain: ['A'] });
  });

  it('cycle -> ancestor_cycle, refused not truncated', async () => {
    cards = { S: cardResp('S', { parent: 'A' }), A: cardResp('A', { parent: 'B2' }), B2: cardResp('B2', { parent: 'S' }) };
    const r = await run({ cardId: 'S' });
    expect(r).toMatchObject({ stop: 'ancestor_cycle', hops: 2, resolved: null, chain: ['A', 'B2'] });
    expect(cardUrls()).toHaveLength(3); // S never re-read
  });

  it('self-parent is a cycle with zero hops', async () => {
    cards = { S: cardResp('S', { parent: 'S' }) };
    expect(await run({ cardId: 'S' })).toMatchObject({ stop: 'ancestor_cycle', hops: 0 });
  });

  it('cap -> depth_cap_reached after exactly cap fetches, flagged out of reach', async () => {
    cards = { S: cardResp('S', { parent: 'c1' }) };
    for (let n = 1; n <= 10; n++) cards['c' + n] = cardResp('c' + n, { parent: 'c' + (n + 1) });
    const r = await run({ cardId: 'S', cap: 3 });
    expect(r).toMatchObject({ stop: 'depth_cap_reached', hops: 3, cap: 3, chain: ['c1', 'c2', 'c3'], known_source_out_of_reach: 'ancestor_walk_depth_cap_3' });
    expect(cardUrls()).toHaveLength(4);
  });

  it('an ancestor resolving ON the cap-th hop still resolves', async () => {
    cards = { S: cardResp('S', { parent: 'c1' }), c1: cardResp('c1', { parent: 'c2' }), c2: cardResp('c2', { pid: P1 }) };
    expect(await run({ cardId: 'S', cap: 2 })).toMatchObject({ stop: 'resolved', resolved: P1, hops: 2 });
  });

  it('two distinct project_ids on one ancestor -> ancestor_conflict', async () => {
    cards = { S: cardResp('S', { parent: 'A' }), A: cardResp('A', { pid: [P1, P2] }) };
    const r = await run({ cardId: 'S' });
    expect(r).toMatchObject({ stop: 'ancestor_conflict', resolved: null });
    expect(r.stop_detail).toContain(`${P1} | ${P2}`);
  });

  it('a card-scoped Metadata group disagreeing with the board-level one is a conflict, not array order', async () => {
    cards = {
      S: cardResp('S', { parent: 'A' }),
      A: {
        item: { id: 'A', boardId: 'B' },
        included: {
          customFieldGroups: [{ id: 'g-meta-card', name: 'Metadata', cardId: 'A' }],
          customFields: [{ id: 'f-pid-card', name: 'project_id', customFieldGroupId: 'g-meta-card' }],
          customFieldValues: [
            { cardId: 'A', customFieldId: 'f-pid', content: P1 },
            { cardId: 'A', customFieldId: 'f-pid-card', content: P2 },
          ],
        },
      },
    };
    expect((await run({ cardId: 'S' })).stop).toBe('ancestor_conflict');
  });

  it('forked parent on an ancestor -> ancestor_parent_ambiguous', async () => {
    cards = { S: cardResp('S', { parent: 'A' }), A: cardResp('A', { parent: ['X', 'Y'] }) };
    expect(await run({ cardId: 'S' })).toMatchObject({ stop: 'ancestor_parent_ambiguous', hops: 1 });
  });

  it('forked parent on the START card -> ancestor_parent_ambiguous before any hop', async () => {
    cards = { S: cardResp('S', { parent: ['X', 'Y'] }) };
    expect(await run({ cardId: 'S' })).toMatchObject({ stop: 'ancestor_parent_ambiguous', hops: 0, start_parents: ['X', 'Y'] });
  });

  it.each([
    [PLACEHOLDER_PROJECT_ID, 'placeholder_sentinel'],
    ['1769980520185202330', 'not_uuid_shaped'],
  ])('refuses %p (%s) and STOPS rather than walking past it', async (value, why) => {
    cards = { S: cardResp('S', { parent: 'A' }), A: cardResp('A', { pid: value, parent: 'G' }), G: cardResp('G', { pid: P1 }) };
    const r = await run({ cardId: 'S' });
    expect(r).toMatchObject({ stop: 'ancestor_value_refused', resolved: null, rejected: [{ source: 'ancestor_walk@hop1', card_id: 'A', value, why }] });
    expect(cardUrls()).not.toContain(`${baseUrl}/api/cards/G`);
  });

  it('unreadable ancestor -> ancestor_unreadable (named, not thrown)', async () => {
    cards = { S: cardResp('S', { parent: 'GONE' }) };
    const r = await run({ cardId: 'S' });
    expect(r).toMatchObject({ stop: 'ancestor_unreadable', hops: 1, chain: ['GONE'] });
    expect(r.stop_detail).toMatch(/could not be found/);
  });

  it('off-board ancestor with no readable value -> ancestor_off_board, out of reach', async () => {
    cards = { S: cardResp('S', { parent: 'A' }), A: cardResp('A', { board: 'OTHER', parent: 'G' }), G: cardResp('G', { pid: P1 }) };
    const r = await run({ cardId: 'S' });
    expect(r).toMatchObject({ stop: 'ancestor_off_board', resolved: null, known_source_out_of_reach: 'ancestor_walk_ancestor_off_board' });
    expect(cardUrls()).not.toContain(`${baseUrl}/api/cards/G`);
  });

  it('off-board ancestor whose value IS readable (card-scoped group) still resolves', async () => {
    cards = {
      S: cardResp('S', { parent: 'A' }),
      A: {
        item: { id: 'A', boardId: 'OTHER' },
        included: {
          customFieldGroups: [{ id: 'gc', name: 'Metadata', cardId: 'A' }],
          customFields: [{ id: 'fc', name: 'project_id', customFieldGroupId: 'gc' }],
          customFieldValues: [{ cardId: 'A', customFieldId: 'fc', content: P1 }],
        },
      },
    };
    expect(await run({ cardId: 'S' })).toMatchObject({ stop: 'resolved', resolved: P1 });
  });

  it('ancestor reporting no boardId -> ancestor_board_unknown', async () => {
    cards = { S: cardResp('S', { parent: 'A' }), A: cardResp('A', { board: null }) };
    expect((await run({ cardId: 'S' })).stop).toBe('ancestor_board_unknown');
  });

  it('board with no field definitions -> no_field_definitions', async () => {
    (requestHelper.makeRequest as jest.Mock).mockImplementation(async (_m: string, url: string) => {
      if (url.includes('/api/boards/')) return { item: { id: 'B' }, included: {} };
      return url.endsWith('/S') ? { item: { id: 'S', boardId: 'B' }, included: { customFieldValues: [] } } : { item: { id: 'A', boardId: 'B' }, included: {} };
    });
    // Start card reads no parent without defs -> exhausted, zero hops.
    expect((await run({ cardId: 'S' })).stop).toBe('chain_exhausted_no_project_id');
  });

  it('ancestor with no definitions anywhere -> no_field_definitions', async () => {
    cards = {
      S: {
        item: { id: 'S', boardId: 'B' },
        included: {
          customFieldGroups: [{ id: 'gr', name: 'Relations', cardId: 'S' }],
          customFields: [{ id: 'fr', name: 'parent_card', customFieldGroupId: 'gr' }],
          customFieldValues: [{ cardId: 'S', customFieldId: 'fr', content: 'A' }],
        },
      },
      A: { item: { id: 'A', boardId: 'B' }, included: {} },
    };
    (requestHelper.makeRequest as jest.Mock).mockImplementation(async (_m: string, url: string) => {
      if (url.includes('/api/boards/')) return { item: { id: 'B' }, included: {} };
      return cards[decodeURIComponent(url.split('/api/cards/')[1])];
    });
    expect(await run({ cardId: 'S' })).toMatchObject({ stop: 'no_field_definitions', hops: 1 });
  });

  it('board unreadable -> walk_board_unreadable (named)', async () => {
    boardFails = true;
    cards = { S: cardResp('S', { parent: 'A' }) };
    const r = await run({ cardId: 'S' });
    expect(r).toMatchObject({ stop: 'walk_board_unreadable', hops: 0 });
    expect(r.stop_detail).toBe('board 500');
  });

  it('unreadable START card throws', async () => {
    await expect(run({ cardId: 'MISSING' })).rejects.toThrow(/could not be found/);
  });

  it.each([['..'], ['.'], [''], ['  ']])('refuses cardId %p before any request', async (cardId) => {
    await expect(run({ cardId })).rejects.toThrow(/Path parameter "cardId"/);
    expect(requestHelper.makeRequest).not.toHaveBeenCalled();
  });

  it('encodes a traversal-shaped cardId into one segment', async () => {
    cards = { '../x': cardResp('../x', {}) };
    await run({ cardId: '../x' });
    expect(cardUrls()[0]).toBe(`${baseUrl}/api/cards/..%2Fx`);
  });

  it('a parent_card value of ".." read from Planka is a named unreadable stop, never a re-addressed request', async () => {
    cards = { S: cardResp('S', { parent: '..' }) };
    const r = await run({ cardId: 'S' });
    expect(r.stop).toBe('ancestor_unreadable');
    expect(r.stop_detail).toMatch(/dot-segment/);
    expect(cardUrls()).toEqual([`${baseUrl}/api/cards/S`]);
  });

  it.each([[0], [101], [2.5], ['x']])('refuses cap %p', async (cap) => {
    await expect(run({ cardId: 'S', cap })).rejects.toThrow(/cap must be an integer/);
  });
});
