import { IExecuteFunctions } from 'n8n-workflow';
import { boardOperations } from '../../../nodes/Planka/operations/board.operations';
import * as requestHelper from '../../../nodes/Planka/helpers/request';
import { boardFields } from '../../../nodes/Planka/descriptions/board.description';

jest.mock('../../../nodes/Planka/helpers/request');

// A board:get response shaped like the real one. The field NAMES are what matter: these are the
// five `included` keys measured at 95% of an 18.83 MB execution blob on 2026-09-02.
const fullResponse = () => ({
  item: { id: 'board-123', name: 'Test Board' },
  included: {
    lists: [
      { id: 'list-1', name: 'TODO', position: 1 },
      { id: 'list-2', name: 'DOING', position: 2 },
    ],
    cards: [
      { id: 'card-1', listId: 'list-1', name: 'A card', description: 'x'.repeat(200), position: 1 },
      { id: 'card-2', listId: 'list-2', name: 'Another', description: 'y'.repeat(200), position: 2 },
    ],
    customFieldValues: [{ id: 'cfv-1', content: 'z'.repeat(400) }],
    customFields: [{ id: 'cf-1', name: 'card_type' }],
    customFieldGroups: [{ id: 'cfg-1', name: 'Metadata' }],
    tasks: [{ id: 'task-1', name: 'a task' }],
    // Added for the omitIncluded work: keys that `leanIncluded` ALSO destroys (it is a
    // whitelist) and that `omitIncluded` must leave alone unless explicitly named.
    labels: [{ id: 'label-1', name: 'bug' }],
    boardMemberships: [{ id: 'bm-1', userId: 'user-1' }],
  },
});

describe('board:get - lean included projection', () => {
  let mockExecuteFunctions: jest.Mocked<IExecuteFunctions>;
  const baseUrl = 'http://planka.example.com:3333';
  const accessToken = 'test-token-123';
  const itemIndex = 0;

  const run = async () =>
    boardOperations.execute.call(mockExecuteFunctions, 'get', itemIndex, baseUrl, accessToken);

  // getNodeParameter(name, i, default) - mirror n8n: return the declared default when the
  // workflow did not set the parameter, so the tests exercise the real resolution path.
  const params = (given: Record<string, any>) =>
    jest.fn((name: string, _i: number, fallback?: any) =>
      Object.prototype.hasOwnProperty.call(given, name) ? given[name] : fallback,
    );

  beforeEach(() => {
    mockExecuteFunctions = {
      getNodeParameter: jest.fn(),
      getNode: jest.fn().mockReturnValue({ name: 'Planka', type: 'kanban.planka' }),
      getInputData: jest.fn(),
      helpers: { request: jest.fn() },
    } as any;
    jest.clearAllMocks();
    (requestHelper.makeRequest as jest.Mock).mockResolvedValue(fullResponse());
  });

  // -- The parameter must exist and be OFF by default -----------------------------------------
  it('declares leanIncluded, boolean, default false, scoped to board:get only', () => {
    const p = (boardFields as any[]).find((f) => f.name === 'leanIncluded');
    expect(p).toBeDefined();
    expect(p.type).toBe('boolean');
    // MUTATION TARGET: flipping this default strips the customField group/field DEFINITIONS
    // from every board:get in the estate, silently breaking the AA promote path.
    expect(p.default).toBe(false);
    expect(p.displayOptions.show.resource).toEqual(['board']);
    expect(p.displayOptions.show.operation).toEqual(['get']);
  });

  // -- Default OFF: identical to the pre-change behaviour --------------------------------------
  it('returns the FULL response when the parameter is absent', async () => {
    mockExecuteFunctions.getNodeParameter = params({ boardId: 'board-123' });
    expect(await run()).toEqual(fullResponse());
  });

  it('returns the FULL response when explicitly false', async () => {
    mockExecuteFunctions.getNodeParameter = params({ boardId: 'board-123', leanIncluded: false });
    expect(await run()).toEqual(fullResponse());
  });

  it('returns the FULL response for any non-true value (fail-safe toward MORE data)', async () => {
    for (const v of [undefined, null, 0, '', 'true', 1]) {
      mockExecuteFunctions.getNodeParameter = params({ boardId: 'board-123', leanIncluded: v });
      expect(await run()).toEqual(fullResponse());
    }
  });

  // -- ON: exactly the reduced shape, nothing more, nothing less -------------------------------
  it('drops the four unread bulk keys when true', async () => {
    mockExecuteFunctions.getNodeParameter = params({ boardId: 'board-123', leanIncluded: true });
    const r: any = await run();
    expect(Object.keys(r.included).sort()).toEqual(['cards', 'lists']);
    expect(r.included.customFieldValues).toBeUndefined();
    expect(r.included.customFields).toBeUndefined();
    expect(r.included.customFieldGroups).toBeUndefined();
    expect(r.included.tasks).toBeUndefined();
  });

  // -- REGRESSION PIN for the omitIncluded change ---------------------------------------------
  // `leanIncluded: true` with no `omitIncluded` must be byte-identical to the behaviour that
  // shipped in PR #15, whatever refactoring projectIncluded undergoes. This is the whole
  // contract that lets 12 live production opt-ins keep working.
  // MUTATION (b) "switch the blacklist to a whitelist": not this test's job, see the omit suite.
  it('leanIncluded:true alone produces exactly the pre-omitIncluded shape', async () => {
    mockExecuteFunctions.getNodeParameter = params({ boardId: 'board-123', leanIncluded: true });
    expect(await run()).toEqual({
      item: { id: 'board-123', name: 'Test Board' },
      included: {
        lists: fullResponse().included.lists,
        cards: [
          { id: 'card-1', listId: 'list-1', name: 'A card' },
          { id: 'card-2', listId: 'list-2', name: 'Another' },
        ],
      },
    });
  });

  // The whitelist also destroys keys the parameter description used not to mention. Pinned so a
  // future reader cannot mistake `leanIncluded` for a "drops the customField* keys" switch.
  it('leanIncluded is a WHITELIST: labels and boardMemberships are dropped too', async () => {
    mockExecuteFunctions.getNodeParameter = params({ boardId: 'board-123', leanIncluded: true });
    const r: any = await run();
    expect(r.included.labels).toBeUndefined();
    expect(r.included.boardMemberships).toBeUndefined();
  });

  it('carries lists WHOLE - every consumer reads them', async () => {
    mockExecuteFunctions.getNodeParameter = params({ boardId: 'board-123', leanIncluded: true });
    const r: any = await run();
    expect(r.included.lists).toEqual(fullResponse().included.lists);
  });

  it('reduces cards to id/listId/name and keeps every row', async () => {
    mockExecuteFunctions.getNodeParameter = params({ boardId: 'board-123', leanIncluded: true });
    const r: any = await run();
    expect(r.included.cards).toEqual([
      { id: 'card-1', listId: 'list-1', name: 'A card' },
      { id: 'card-2', listId: 'list-2', name: 'Another' },
    ]);
    // The join key todo-pickup's `Compute Deps` needs must survive.
    expect(r.included.cards.every((c: any) => c.id && c.listId)).toBe(true);
  });

  it('leaves `item` untouched', async () => {
    mockExecuteFunctions.getNodeParameter = params({ boardId: 'board-123', leanIncluded: true });
    const r: any = await run();
    expect(r.item).toEqual({ id: 'board-123', name: 'Test Board' });
  });

  it('actually reduces the serialized size', async () => {
    mockExecuteFunctions.getNodeParameter = params({ boardId: 'board-123', leanIncluded: false });
    const before = JSON.stringify(await run()).length;
    mockExecuteFunctions.getNodeParameter = params({ boardId: 'board-123', leanIncluded: true });
    const after = JSON.stringify(await run()).length;
    expect(after).toBeLessThan(before / 2);
  });

  // -- Degenerate shapes must not throw: this runs on every board read in production -----------
  it('is a no-op on responses with no `included`', async () => {
    (requestHelper.makeRequest as jest.Mock).mockResolvedValue({ item: { id: 'b' } });
    mockExecuteFunctions.getNodeParameter = params({ boardId: 'board-123', leanIncluded: true });
    expect(await run()).toEqual({ item: { id: 'b' } });
  });

  it('is a no-op on a null / non-object response', async () => {
    for (const body of [null, undefined, 'a string', 42]) {
      (requestHelper.makeRequest as jest.Mock).mockResolvedValue(body);
      mockExecuteFunctions.getNodeParameter = params({ boardId: 'board-123', leanIncluded: true });
      expect(await run()).toEqual(body);
    }
  });

  it('survives an included with no cards, and does not invent the key', async () => {
    (requestHelper.makeRequest as jest.Mock).mockResolvedValue({
      item: { id: 'b' },
      included: { lists: [{ id: 'l1' }] },
    });
    mockExecuteFunctions.getNodeParameter = params({ boardId: 'board-123', leanIncluded: true });
    const r: any = await run();
    expect(r.included).toEqual({ lists: [{ id: 'l1' }] });
    expect('cards' in r.included).toBe(false);
  });

  it('passes through a malformed card entry rather than crashing', async () => {
    (requestHelper.makeRequest as jest.Mock).mockResolvedValue({
      included: { cards: [null, 'nope', { id: 'c1', listId: 'l1', name: 'n' }] },
    });
    mockExecuteFunctions.getNodeParameter = params({ boardId: 'board-123', leanIncluded: true });
    const r: any = await run();
    expect(r.included.cards).toEqual([null, 'nope', { id: 'c1', listId: 'l1', name: 'n' }]);
  });

  it('still issues the same GET regardless of the flag', async () => {
    mockExecuteFunctions.getNodeParameter = params({ boardId: 'board-123', leanIncluded: true });
    await run();
    expect(requestHelper.makeRequest).toHaveBeenCalledWith(
      'GET',
      `${baseUrl}/api/boards/board-123`,
      null,
      accessToken,
    );
  });
});
