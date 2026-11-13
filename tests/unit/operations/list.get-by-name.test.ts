import { IExecuteFunctions, NodeOperationError } from 'n8n-workflow';
import { listOperations, LIST_BY_NAME_ERRORS } from '../../../nodes/Planka/operations/list.operations';
import * as requestHelper from '../../../nodes/Planka/helpers/request';

jest.mock('../../../nodes/Planka/helpers/request');

const baseUrl = 'http://planka.test';
const token = 't';

function ctx(params: Record<string, unknown>): IExecuteFunctions {
  return {
    getNodeParameter: jest.fn((name: string, _i: number, dflt?: unknown) =>
      name in params ? params[name] : dflt,
    ),
    getNode: jest.fn().mockReturnValue({ name: 'Planka', type: 'kanban.planka' }),
  } as any;
}

const board = {
  item: { id: 'b1' },
  included: {
    lists: [
      { id: 'l0', name: null, type: 'archive' },
      { id: 'l1', name: 'TODO', type: 'active' },
      { id: 'l2', name: ' QA ', type: 'active' },
      { id: 'l3', name: 'Done', type: 'closed' },
    ],
  },
};

async function run(params: Record<string, unknown>) {
  return listOperations.execute.call(ctx(params), 'getByName', 0, baseUrl, token);
}

describe('list.getByName', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (requestHelper.makeRequest as jest.Mock).mockResolvedValue(board);
  });

  it('returns the one list, trimmed and case-insensitive by default', async () => {
    await expect(run({ boardId: 'b1', listName: 'qa' })).resolves.toEqual(board.included.lists[2]);
    expect(requestHelper.makeRequest).toHaveBeenCalledTimes(1);
    expect(requestHelper.makeRequest).toHaveBeenCalledWith('GET', `${baseUrl}/api/boards/b1`, null, token);
    await expect(run({ boardId: 'b1', listName: '  DONE ' })).resolves.toEqual(board.included.lists[3]);
  });

  it('caseSensitive=true refuses a case mismatch', async () => {
    await expect(run({ boardId: 'b1', listName: 'done', caseSensitive: true })).rejects.toThrow(
      LIST_BY_NAME_ERRORS.NOT_FOUND,
    );
    await expect(run({ boardId: 'b1', listName: 'Done', caseSensitive: true })).resolves.toEqual(
      board.included.lists[3],
    );
  });

  it('not found -> list_not_found naming the board, the name and the available lists', async () => {
    const p = run({ boardId: 'b1', listName: 'BLOCKED' });
    await expect(p).rejects.toBeInstanceOf(NodeOperationError);
    await expect(run({ boardId: 'b1', listName: 'BLOCKED' })).rejects.toThrow(
      /^list_not_found: board b1 has no list named "BLOCKED"; lists: \[TODO,  QA , Done\]$/,
    );
    try {
      await run({ boardId: 'b1', listName: 'BLOCKED' });
    } catch (e: any) {
      expect(e.context.code).toBe('list_not_found');
      expect(e.context.available).toEqual(['TODO', ' QA ', 'Done']);
    }
  });

  it('a board with no included lists is not-found, not a crash', async () => {
    (requestHelper.makeRequest as jest.Mock).mockResolvedValue({ item: { id: 'b1' } });
    await expect(run({ boardId: 'b1', listName: 'QA' })).rejects.toThrow(LIST_BY_NAME_ERRORS.NOT_FOUND);
  });

  it('two lists with the same name -> list_name_ambiguous, never picks one', async () => {
    (requestHelper.makeRequest as jest.Mock).mockResolvedValue({
      included: { lists: [{ id: 'a', name: 'QA' }, { id: 'b', name: 'qa' }] },
    });
    await expect(run({ boardId: 'b1', listName: 'QA' })).rejects.toThrow(
      /^list_name_ambiguous: board b1 has 2 lists named "QA" \(ids a, b\)/,
    );
  });

  it('empty list name is refused before any request', async () => {
    await expect(run({ boardId: 'b1', listName: '   ' })).rejects.toThrow(LIST_BY_NAME_ERRORS.INVALID_INPUT);
    expect(requestHelper.makeRequest).not.toHaveBeenCalled();
  });

  it.each([['..'], ['.'], [''], ['   ']])('refuses boardId %p before any request', async (boardId) => {
    await expect(run({ boardId, listName: 'QA' })).rejects.toThrow(/Path parameter "boardId"/);
    expect(requestHelper.makeRequest).not.toHaveBeenCalled();
  });

  it('encodes a traversal-shaped boardId into ONE segment', async () => {
    await expect(run({ boardId: '../x', listName: 'QA' })).resolves.toBeDefined();
    expect(requestHelper.makeRequest).toHaveBeenCalledWith('GET', `${baseUrl}/api/boards/..%2Fx`, null, token);
  });
});
