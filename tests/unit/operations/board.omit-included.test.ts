import { IExecuteFunctions } from 'n8n-workflow';
import { boardOperations } from '../../../nodes/Planka/operations/board.operations';
import * as requestHelper from '../../../nodes/Planka/helpers/request';
import { boardFields } from '../../../nodes/Planka/descriptions/board.description';

jest.mock('../../../nodes/Planka/helpers/request');

// Same shape as board.lean-included.test.ts. `labels` and `boardMemberships` are the control
// group: they are never named in any omit list below, so if they ever vanish the filter has
// turned from a BLACKLIST into a whitelist -- the exact regression this suite exists to catch.
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
    labels: [{ id: 'label-1', name: 'bug' }],
    boardMemberships: [{ id: 'bm-1', userId: 'user-1' }],
    // A key that is NOT one of the 14 the parameter offers, and not one Planka returns today.
    // It is here so the blacklist/whitelist distinction is testable in MORE than one place: with
    // only known keys in the fixture, `removes exactly those two` passes even under a whitelist
    // implementation, because every fixture key is on the allowed list. An adversarial battery
    // found exactly that hole -- one test stood between this node and the `included.labels`
    // regression the blacklist exists to prevent.
    futureKeyPlankaAddedLater: [{ id: 'future-1' }],
  },
});

// The 14 keys measured on a live production board:get payload. Order is load-bearing only in
// the declaration test below; every other test asserts on membership.
const EXPECTED_OPTION_VALUES = [
  'boardMemberships',
  'labels',
  'lists',
  'cards',
  'cardMemberships',
  'cardLabels',
  'taskLists',
  'tasks',
  'customFieldGroups',
  'customFields',
  'customFieldValues',
  'users',
  'projects',
  'attachments',
];

/**
 * MUTATION BATTERY -- each mutant and the test that kills it.
 *
 *  (a) delete the `included` WRAPPER instead of its keys
 *      -> killed by 'keeps the `included` wrapper as an own property even when every key is
 *         omitted' (toEqual({}) passes on an absent key, so that test uses `in` + hasOwnProperty)
 *         and by 'omitting ["cards","tasks"] ...' which reads r.included.lists.
 *  (b) switch the blacklist to a whitelist (drop the keys NOT named)
 *      -> killed by 'an unnamed key (labels / boardMemberships / an unknown key) always
 *         survives' AND by 'omitting ["cards","tasks"] removes exactly those two and leaves the
 *         rest intact'.
 *         ⚠️ The second of those did NOT kill it until 2026-09-02. An adversarial battery found
 *         that every key in the fixture was one of the 14 the parameter offers, so a whitelist
 *         implementation passed it -- exactly ONE test stood between this node and the
 *         `router.json :: included.labels` regression the blacklist exists to prevent. The
 *         fixture now carries `futureKeyPlankaAddedLater`, a key outside the 14, so the
 *         distinction is observable in both.
 *  (c) change the default from [] to a non-empty list
 *      -> killed by 'declares omitIncluded, multiOptions, default [], with the 14 measured keys'
 *         (the DESCRIPTION default) and by 'is a strict no-op when the parameter is absent'
 *         (the getNodeParameter fallback default inside getBoard).
 *  (d) accept a truthy string as `leanIncluded`
 *      -> killed by 'a truthy non-true leanIncluded does not lean, even alongside omitIncluded'.
 *  (e) mutate the caller's `included` object in place rather than copying
 *      -> killed by 'does not mutate the response object it was handed'.
 */
describe('board:get - omitIncluded blacklist projection', () => {
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

  // -- Declaration ----------------------------------------------------------------------------
  // MUTANT (c): a non-empty default would silently shrink every board:get in the estate.
  it('declares omitIncluded, multiOptions, default [], with the 14 measured keys', () => {
    const p = (boardFields as any[]).find((f) => f.name === 'omitIncluded');
    expect(p).toBeDefined();
    expect(p.type).toBe('multiOptions');
    expect(p.default).toEqual([]);
    expect(p.displayOptions.show.resource).toEqual(['board']);
    expect(p.displayOptions.show.operation).toEqual(['get']);
    expect(p.options.map((o: any) => o.value)).toEqual(EXPECTED_OPTION_VALUES);
    expect(p.options).toHaveLength(14);
    // Every option must carry a human-readable name, or the n8n UI shows a blank row.
    expect(p.options.every((o: any) => typeof o.name === 'string' && o.name.length > 0)).toBe(true);
  });

  // `leanIncluded` must survive this change untouched: n8n normalises stored node parameters
  // against the node description and DROPS keys it does not declare, so removing it would
  // silently revert every live opt-in back to the 14 MB payload.
  it('leaves leanIncluded declared, boolean, default false', () => {
    const p = (boardFields as any[]).find((f) => f.name === 'leanIncluded');
    expect(p).toBeDefined();
    expect(p.type).toBe('boolean');
    expect(p.default).toBe(false);
  });

  // -- Default is a strict no-op --------------------------------------------------------------
  // MUTANT (c), caller side: a non-[] fallback inside getBoard is caught here.
  it('is a strict no-op when the parameter is absent', async () => {
    mockExecuteFunctions.getNodeParameter = params({ boardId: 'board-123' });
    expect(await run()).toEqual(fullResponse());
  });

  // MUTANT (f) -- and this test exists because an adversarial battery proved the guard it
  // covers was UNFALSIFIABLE. Deleting `if (!lean && omit.length === 0) return response;` from
  // getBoard left all 151 tests passing: without it the default path returns
  // `{...response, included:{...original}}`, a fresh shallow copy whose CONTENT and key order
  // are identical, so `toEqual` cannot see the difference. The only observable is IDENTITY.
  //
  // Not a style point. board:get is the hottest call in the estate (AA Router - Global alone
  // ran 3232 times in six hours), and the parameter's own description promises the default is
  // "byte-for-byte what the API returned". An unproven promise about the default path of a
  // projection that exists to save memory is exactly the claim that should carry a test.
  it('returns the API response OBJECT ITSELF on the default path (mutant f: the short-circuit)', async () => {
    const shared = fullResponse();
    (requestHelper.makeRequest as jest.Mock).mockResolvedValue(shared);
    mockExecuteFunctions.getNodeParameter = params({ boardId: 'board-123' });
    const r: any = await run();
    // Identity, not equality: `toBe` is the only assertion that can see the short-circuit removed.
    expect(r).toBe(shared);
    expect(r.included).toBe(shared.included);
  });

  // The counterpart: once EITHER filter is active the response must be a COPY, so the caller's
  // object is never mutated. Pins the direction of the test above -- without this pair, "always
  // return a copy" and "never return a copy" would each satisfy one of them alone.
  it('returns a COPY, never the original object, once a filter is active', async () => {
    const shared = fullResponse();
    (requestHelper.makeRequest as jest.Mock).mockResolvedValue(shared);
    mockExecuteFunctions.getNodeParameter = params({
      boardId: 'board-123',
      omitIncluded: ['cards'],
    });
    const r: any = await run();
    expect(r).not.toBe(shared);
    expect(r.included).not.toBe(shared.included);
    // ...and the caller's object is intact (MUTANT (e), in-place mutation).
    expect(shared.included.cards).toBeDefined();
  });

  // MUTANT (j): the `!original` half of the `included` guard was untested. Weakening it to
  // `typeof original !== 'object'` left all 151 passing, because no test ever handed it a FALSY
  // non-undefined `included`. `null` is the one that matters -- `typeof null === 'object'`, so
  // without the truthiness check the code would spread null into `{}` and hand the caller an
  // `included: {}` where the API said `null`. That is a shape change on a fail-safe path.
  it('passes a falsy `included` through untouched (mutant j: the !original guard)', async () => {
    for (const falsy of [null, 0, '', false]) {
      const payload: any = { item: { id: 'b' }, included: falsy };
      (requestHelper.makeRequest as jest.Mock).mockResolvedValue(payload);
      mockExecuteFunctions.getNodeParameter = params({
        boardId: 'board-123',
        omitIncluded: ['cards', 'tasks'],
      });
      const r: any = await run();
      expect(r).toBe(payload);
      expect(r.included).toBe(falsy);
    }
  });

  it('is a strict no-op on an explicit empty list', async () => {
    mockExecuteFunctions.getNodeParameter = params({ boardId: 'board-123', omitIncluded: [] });
    expect(await run()).toEqual(fullResponse());
  });

  // -- The blacklist proper -------------------------------------------------------------------
  // MUTANTS (a) and (b).
  it('omitting ["cards","tasks"] removes exactly those two and leaves the rest intact', async () => {
    mockExecuteFunctions.getNodeParameter = params({
      boardId: 'board-123',
      omitIncluded: ['cards', 'tasks'],
    });
    const r: any = await run();
    expect(r.included.cards).toBeUndefined();
    expect(r.included.tasks).toBeUndefined();
    expect('cards' in r.included).toBe(false);
    expect('tasks' in r.included).toBe(false);

    const full = fullResponse().included;
    expect(r.included.lists).toEqual(full.lists);
    expect(r.included.labels).toEqual(full.labels);
    expect(r.included.boardMemberships).toEqual(full.boardMemberships);
    expect(r.included.customFieldGroups).toEqual(full.customFieldGroups);
    expect(r.included.customFields).toEqual(full.customFields);
    expect(r.included.customFieldValues).toEqual(full.customFieldValues);
    // `futureKeyPlankaAddedLater` is the load-bearing entry: it is NOT one of the 14 options, so
    // a whitelist implementation would drop it and this assertion would fail. Without it, every
    // fixture key is on the allowed list and this test cannot tell a blacklist from a whitelist.
    expect(r.included.futureKeyPlankaAddedLater).toEqual(full.futureKeyPlankaAddedLater);
    expect(Object.keys(r.included).sort()).toEqual(
      [
        'boardMemberships',
        'customFieldGroups',
        'customFieldValues',
        'customFields',
        'futureKeyPlankaAddedLater',
        'labels',
        'lists',
      ].sort(),
    );
    // `item` is outside `included` and must never be touched.
    expect(r.item).toEqual({ id: 'board-123', name: 'Test Board' });
  });

  // The Card Update call site's real set: it reads the board-level customField DEFINITIONS
  // (customFieldGroups + customFields), which card:get cannot supply, so leanIncluded is not an
  // option for it -- but the VALUES, cards and tasks are dead weight.
  it('omitting ["cards","tasks","customFieldValues"] keeps the customField DEFINITIONS', async () => {
    mockExecuteFunctions.getNodeParameter = params({
      boardId: 'board-123',
      omitIncluded: ['cards', 'tasks', 'customFieldValues'],
    });
    const r: any = await run();
    expect(r.included.cards).toBeUndefined();
    expect(r.included.tasks).toBeUndefined();
    expect(r.included.customFieldValues).toBeUndefined();

    const full = fullResponse().included;
    expect(r.included.customFieldGroups).toEqual(full.customFieldGroups);
    expect(r.included.customFields).toEqual(full.customFields);
    expect(r.included.lists).toEqual(full.lists);
    expect(r.included.labels).toEqual(full.labels);
    expect(r.included.boardMemberships).toEqual(full.boardMemberships);
    expect(r.included.futureKeyPlankaAddedLater).toEqual(full.futureKeyPlankaAddedLater);
  });

  // MUTANT (b): the whole point of the blacklist. An unnamed key -- including one that is not
  // even in the 14 options -- must come through byte-identical.
  it('an unnamed key (labels / boardMemberships / an unknown key) always survives', async () => {
    (requestHelper.makeRequest as jest.Mock).mockResolvedValue({
      item: { id: 'b' },
      included: {
        cards: [{ id: 'c1' }],
        labels: [{ id: 'label-1', name: 'bug' }],
        boardMemberships: [{ id: 'bm-1' }],
        // Not one of the 14 options: a key a future Planka might add.
        somethingPlankaAddedLater: [{ id: 'x1' }],
      },
    });
    mockExecuteFunctions.getNodeParameter = params({
      boardId: 'board-123',
      omitIncluded: ['cards'],
    });
    const r: any = await run();
    expect(r.included).toEqual({
      labels: [{ id: 'label-1', name: 'bug' }],
      boardMemberships: [{ id: 'bm-1' }],
      somethingPlankaAddedLater: [{ id: 'x1' }],
    });
  });

  // MUTANT (a): a downstream consumer guards on
  // `if (!boardData.included && !boardData.item && !boardData.id)`. Deleting the wrapper flips
  // that guard and aborts the branch. `toEqual({})` would pass on an ABSENT key, so this test
  // asserts ownership explicitly.
  it('keeps the `included` wrapper as an own property even when every key is omitted', async () => {
    mockExecuteFunctions.getNodeParameter = params({
      boardId: 'board-123',
      // The 14 offered keys are not the whole payload: the fixture also carries
      // `futureKeyPlankaAddedLater`, deliberately outside the options, and a blacklist keeps
      // what it was not told about. Emptying `included` therefore means naming that key too --
      // which is itself a small proof of the blacklist semantics.
      omitIncluded: [...EXPECTED_OPTION_VALUES, 'futureKeyPlankaAddedLater'],
    });
    const r: any = await run();
    expect(Object.prototype.hasOwnProperty.call(r, 'included')).toBe(true);
    expect('included' in r).toBe(true);
    expect(r.included).not.toBeUndefined();
    expect(r.included).not.toBeNull();
    expect(r.included).toEqual({});
    expect(Object.keys(r.included)).toEqual([]);
    expect(r.item).toEqual({ id: 'board-123', name: 'Test Board' });
  });

  // MUTANT (e): the response object may be shared with another reader; a `delete` on it would
  // corrupt them. Hold the exact object makeRequest resolved and check it afterwards.
  it('does not mutate the response object it was handed', async () => {
    const shared = fullResponse();
    (requestHelper.makeRequest as jest.Mock).mockResolvedValue(shared);
    mockExecuteFunctions.getNodeParameter = params({
      boardId: 'board-123',
      omitIncluded: ['cards', 'tasks', 'customFieldValues'],
    });
    const r: any = await run();
    expect(r.included.cards).toBeUndefined();
    // The original is untouched: same keys, same values.
    expect(shared).toEqual(fullResponse());
    expect(Object.keys(shared.included).sort()).toEqual(
      Object.keys(fullResponse().included).sort(),
    );
    expect(r.included).not.toBe(shared.included);
  });

  // -- Degenerate shapes ----------------------------------------------------------------------
  it('passes a null / non-object / array response through untouched', async () => {
    for (const body of [null, undefined, 'a string', 42, [{ id: 'a' }, { id: 'b' }]]) {
      (requestHelper.makeRequest as jest.Mock).mockResolvedValue(body);
      mockExecuteFunctions.getNodeParameter = params({
        boardId: 'board-123',
        omitIncluded: ['cards', 'tasks'],
      });
      expect(await run()).toEqual(body);
    }
  });

  it('passes an error item through untouched', async () => {
    (requestHelper.makeRequest as jest.Mock).mockResolvedValue({ error: 'Board not found' });
    mockExecuteFunctions.getNodeParameter = params({
      boardId: 'board-123',
      omitIncluded: ['cards', 'tasks'],
    });
    expect(await run()).toEqual({ error: 'Board not found' });
  });

  it('is a no-op on a response with no `included`, and does not invent the key', async () => {
    (requestHelper.makeRequest as jest.Mock).mockResolvedValue({ item: { id: 'b' } });
    mockExecuteFunctions.getNodeParameter = params({
      boardId: 'board-123',
      omitIncluded: ['cards'],
    });
    const r: any = await run();
    expect(r).toEqual({ item: { id: 'b' } });
    expect('included' in r).toBe(false);
  });

  it('is a no-op when `included` is an array rather than an object', async () => {
    (requestHelper.makeRequest as jest.Mock).mockResolvedValue({ included: [1, 2, 3] });
    mockExecuteFunctions.getNodeParameter = params({
      boardId: 'board-123',
      omitIncluded: ['cards'],
    });
    expect(await run()).toEqual({ included: [1, 2, 3] });
  });

  // -- Garbage parameter values: fail-safe toward MORE data ------------------------------------
  it('treats a non-array / garbage omitIncluded as a no-op rather than crashing', async () => {
    for (const v of [undefined, null, 'cards', 0, 1, true, false, {}, { cards: true }, NaN]) {
      mockExecuteFunctions.getNodeParameter = params({ boardId: 'board-123', omitIncluded: v });
      expect(await run()).toEqual(fullResponse());
    }
  });

  it('ignores non-string entries inside the array and honours the string ones', async () => {
    mockExecuteFunctions.getNodeParameter = params({
      boardId: 'board-123',
      omitIncluded: [null, 42, { cards: true }, ['tasks'], 'cards', undefined],
    });
    const r: any = await run();
    expect(r.included.cards).toBeUndefined();
    // The array-wrapped 'tasks' is NOT a string, so tasks survives -- fail-safe toward more data.
    expect(r.included.tasks).toEqual(fullResponse().included.tasks);
    expect(r.included.labels).toEqual(fullResponse().included.labels);
  });

  it('ignores an omitted key that is not present in the payload', async () => {
    mockExecuteFunctions.getNodeParameter = params({
      boardId: 'board-123',
      omitIncluded: ['attachments', 'users', 'projects'],
    });
    expect(await run()).toEqual(fullResponse());
  });

  // -- Composition with leanIncluded -----------------------------------------------------------
  it('composes with leanIncluded: lean whitelists first, then omit deletes from the survivors', async () => {
    mockExecuteFunctions.getNodeParameter = params({
      boardId: 'board-123',
      leanIncluded: true,
      omitIncluded: ['cards'],
    });
    const r: any = await run();
    // lean leaves {lists, cards}; omit then removes cards.
    expect(Object.keys(r.included)).toEqual(['lists']);
    expect(r.included.lists).toEqual(fullResponse().included.lists);
    expect(Object.prototype.hasOwnProperty.call(r, 'included')).toBe(true);
  });

  it('composes to an empty-but-present included when lean and omit cover everything', async () => {
    mockExecuteFunctions.getNodeParameter = params({
      boardId: 'board-123',
      leanIncluded: true,
      omitIncluded: ['lists', 'cards'],
    });
    const r: any = await run();
    expect(Object.prototype.hasOwnProperty.call(r, 'included')).toBe(true);
    expect(r.included).toEqual({});
  });

  it('omitIncluded alone does NOT reduce cards to {id,listId,name} - that is lean only', async () => {
    mockExecuteFunctions.getNodeParameter = params({
      boardId: 'board-123',
      omitIncluded: ['tasks'],
    });
    const r: any = await run();
    expect(r.included.cards).toEqual(fullResponse().included.cards);
    expect(r.included.cards[0].description).toBe('x'.repeat(200));
  });

  // MUTANT (d): a truthy string must not enable the whitelist. If it did, the customField
  // DEFINITIONS would vanish from a call site that only asked to drop `tasks`.
  it('a truthy non-true leanIncluded does not lean, even alongside omitIncluded', async () => {
    for (const v of ['true', 1, 'yes', {}, []]) {
      mockExecuteFunctions.getNodeParameter = params({
        boardId: 'board-123',
        leanIncluded: v,
        omitIncluded: ['tasks'],
      });
      const r: any = await run();
      const full = fullResponse().included;
      // Not leaned: customField definitions and labels are all still here.
      expect(r.included.customFieldGroups).toEqual(full.customFieldGroups);
      expect(r.included.customFields).toEqual(full.customFields);
      expect(r.included.customFieldValues).toEqual(full.customFieldValues);
      expect(r.included.labels).toEqual(full.labels);
      // Cards NOT reduced.
      expect(r.included.cards).toEqual(full.cards);
      // Only the blacklisted key is gone.
      expect(r.included.tasks).toBeUndefined();
    }
  });

  // -- The request itself is unaffected --------------------------------------------------------
  it('still issues the same GET regardless of the parameters', async () => {
    mockExecuteFunctions.getNodeParameter = params({
      boardId: 'board-123',
      omitIncluded: ['cards', 'tasks'],
    });
    await run();
    expect(requestHelper.makeRequest).toHaveBeenCalledWith(
      'GET',
      `${baseUrl}/api/boards/board-123`,
      null,
      accessToken,
    );
  });

  it('actually reduces the serialized size', async () => {
    mockExecuteFunctions.getNodeParameter = params({ boardId: 'board-123' });
    const before = JSON.stringify(await run()).length;
    mockExecuteFunctions.getNodeParameter = params({
      boardId: 'board-123',
      omitIncluded: ['cards', 'tasks', 'customFieldValues'],
    });
    const after = JSON.stringify(await run()).length;
    expect(after).toBeLessThan(before);
  });
});
