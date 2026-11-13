/**
 * Default position on a card MOVE (update with listId, no position).
 *
 * Defect: the node always sent position=1. On a list whose first card already
 * sits at 1, Planka renumbered the whole list (one UPDATE + broadcast per
 * card) and the ~768-card DONE list outlived the 60s ingress timeout (504).
 * These tests pin the replacement: a clash-free, monotonic, bottom-of-list
 * position that needs no list read, while an explicit position still wins.
 */
import { IExecuteFunctions } from 'n8n-workflow';
import { cardOperations } from '../../../nodes/Planka/operations/card.operations';
import * as requestHelper from '../../../nodes/Planka/helpers/request';
import {
  nextDefaultCardPosition,
  resetDefaultCardPositionForTests,
} from '../../../nodes/Planka/helpers/position';

jest.mock('../../../nodes/Planka/helpers/request');

const baseUrl = 'http://planka.test';
const token = 't';
const NOW = 1_790_000_000_000;
// Planka's own spacing: POSITION_GAP (65536) per card. A list would need
// ~27 million GAP-spaced cards to reach NOW; the real DONE list holds ~768.
const PLANKA_GAP = 65536;
const DONE_LIST_CARDS = 768;
// Planka's MAX_POSITION (insert-to-positionables.js). Above it Planka
// renumbers the whole list unconditionally.
const PLANKA_MAX_POSITION = 2 ** 50;

function ctx(updateFields: Record<string, unknown>): jest.Mocked<IExecuteFunctions> {
  return {
    getNodeParameter: jest
      .fn()
      .mockReturnValueOnce('card-1')
      .mockReturnValueOnce(updateFields)
      .mockReturnValueOnce({}),
    getNode: jest.fn().mockReturnValue({ name: 'Move Card', type: 'kanban.planka' }),
    logger: { warn: jest.fn(), info: jest.fn(), error: jest.fn(), debug: jest.fn() },
  } as any;
}

async function move(updateFields: Record<string, unknown>): Promise<any> {
  (requestHelper.makeRequest as jest.Mock).mockImplementation(
    async (_m: string, _u: string, body: any) => ({ item: { id: 'card-1', listId: body?.listId } }),
  );
  await cardOperations.execute.call(ctx(updateFields), 'update', 0, baseUrl, token);
  const calls = (requestHelper.makeRequest as jest.Mock).mock.calls;
  return calls[calls.length - 1][2];
}

describe('card move default position', () => {
  let nowSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    resetDefaultCardPositionForTests();
    nowSpy = jest.spyOn(Date, 'now').mockReturnValue(NOW);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('places a move without position clear of every Planka-assigned position (no clash)', async () => {
    const body = await move({ listId: 'done' });
    expect(body.position).not.toBe(1);
    // Above anything Planka's GAP spacing produces on a realistic list...
    expect(body.position).toBeGreaterThan(PLANKA_GAP * DONE_LIST_CARDS * 1000);
    // ...and below the ceiling that forces Planka into a full renumber.
    expect(body.position).toBeLessThan(PLANKA_MAX_POSITION);
  });

  it('needs no list read: the move is exactly one PATCH, even for an empty list', async () => {
    await move({ listId: 'empty-list' });
    const calls = (requestHelper.makeRequest as jest.Mock).mock.calls;
    expect(calls).toHaveLength(1);
    expect(calls[0][0]).toBe('PATCH');
  });

  it('is monotonic: a later move lands strictly below the earlier one', async () => {
    const first = await move({ listId: 'done' });
    nowSpy.mockReturnValue(NOW + 5_000);
    const second = await move({ listId: 'done' });
    expect(second.position).toBeGreaterThan(first.position);
  });

  it('falls back to last+1 when two moves share a millisecond (no equal positions)', async () => {
    const a = await move({ listId: 'done' });
    const b = await move({ listId: 'done' });
    const c = await move({ listId: 'done' });
    expect([a.position, b.position, c.position]).toEqual([NOW, NOW + 1, NOW + 2]);
  });

  it('stays monotonic when the wall clock steps backwards', async () => {
    const a = await move({ listId: 'done' });
    nowSpy.mockReturnValue(NOW - 60_000);
    const b = await move({ listId: 'done' });
    expect(b.position).toBeGreaterThan(a.position);
  });

  it.each([7, 1, 0])('honours an explicit caller position (%p) unchanged', async (explicit) => {
    const body = await move({ listId: 'done', position: explicit });
    expect(body.position).toBe(explicit);
  });

  it('does not inject a position when the update is not a move', async () => {
    const body = await move({ name: 'rename only' });
    expect(body).toEqual({ name: 'rename only' });
  });

  it('helper uses the injected clock and never repeats', () => {
    expect(nextDefaultCardPosition(100)).toBe(100);
    expect(nextDefaultCardPosition(100)).toBe(101);
    expect(nextDefaultCardPosition(50)).toBe(102);
    expect(nextDefaultCardPosition(500)).toBe(500);
  });
});
