import {
  IExecuteFunctions,
  NodeOperationError,
} from 'n8n-workflow';

import { makeRequest } from '../helpers/request';
import { pathSegment } from '../helpers/pathSegment';

export const listOperations = {
  /**
   * Execute list operations
   * @param operation Operation to execute (create, get, update, delete, moveCards, sort)
   * @param itemIndex Index of the current item
   * @param baseUrl Planka base URL
   * @param accessToken JWT access token
   * @returns Operation result
   */
  async execute(
    this: IExecuteFunctions,
    operation: string,
    itemIndex: number,
    baseUrl: string,
    accessToken: string,
  ): Promise<any> {
    switch (operation) {
      case 'create':
        return await createList.call(this, itemIndex, baseUrl, accessToken);

      case 'get':
        return await getList.call(this, itemIndex, baseUrl, accessToken);

      case 'getByName':
        return await getListByName.call(this, itemIndex, baseUrl, accessToken);

      case 'update':
        return await updateList.call(this, itemIndex, baseUrl, accessToken);

      case 'delete':
        return await deleteList.call(this, itemIndex, baseUrl, accessToken);

      case 'moveCards':
        return await moveCards.call(this, itemIndex, baseUrl, accessToken);

      case 'sort':
        return await sortList.call(this, itemIndex, baseUrl, accessToken);

      case 'clear':
        return await clearList.call(this, itemIndex, baseUrl, accessToken);

      default:
        throw new NodeOperationError(
          this.getNode(),
          `Unknown operation: ${operation}`,
        );
    }
  },
};

/**
 * Normalise a list name for comparison.
 *
 * Mirrors the 28 hand-rolled `Resolve <X> List` Code nodes this op replaces
 * (n8n_custom_nodes workflows): every one compares `name.toUpperCase()`, and
 * most `.trim()` first. Trim is applied unconditionally here -- a leading or
 * trailing space in a Planka list name is never a distinct list anyone meant.
 */
function normaliseListName(raw: unknown, caseSensitive: boolean): string {
  const s = String(raw == null ? '' : raw).trim();
  return caseSensitive ? s : s.toUpperCase();
}

/**
 * Stable machine-readable causes. They lead the error MESSAGE because n8n
 * serialises only `.message` into a continueOnFail item, and are also set on
 * `error.context.code` for a caller that has the error object.
 */
export const LIST_BY_NAME_ERRORS = {
  NOT_FOUND: 'list_not_found',
  AMBIGUOUS: 'list_name_ambiguous',
  INVALID_INPUT: 'list_name_required',
} as const;

function typedError(
  ctx: IExecuteFunctions,
  code: string,
  message: string,
  i: number,
  context: Record<string, unknown>,
): NodeOperationError {
  const err = new NodeOperationError(ctx.getNode(), `${code}: ${message}`, { itemIndex: i });
  (err as any).context = { ...((err as any).context || {}), code, ...context };
  return err;
}

/**
 * GET /api/boards/{boardId} and return the ONE list whose name matches.
 *
 * - no match       -> `list_not_found`, naming the board, the name asked for and
 *                     every list name the board DOES have;
 * - several match  -> `list_name_ambiguous`. The Code nodes this replaces used
 *                     `lists.find()`, i.e. silently took whichever Planka
 *                     ordered first; this op refuses instead of picking.
 * Lists with no name (Planka's archive/trash system lists) never match.
 */
async function getListByName(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  const boardId = this.getNodeParameter('boardId', i) as string;
  const listName = this.getNodeParameter('listName', i, '') as string;
  const caseSensitive = this.getNodeParameter('caseSensitive', i, false) === true;

  // Path id is validated BEFORE the name, and both before any request.
  const boardSeg = pathSegment(this, 'boardId', boardId);
  const wanted = normaliseListName(listName, caseSensitive);
  if (wanted === '') {
    throw typedError(this, LIST_BY_NAME_ERRORS.INVALID_INPUT, 'listName is required and must not be empty', i, { boardId });
  }

  const board = await makeRequest.call(
    this,
    'GET',
    `${baseUrl}/api/boards/${boardSeg}`,
    null,
    accessToken,
  );

  const lists: any[] = Array.isArray(board?.included?.lists) ? board.included.lists : [];
  const matches = lists.filter(
    (l) => l && l.name != null && normaliseListName(l.name, caseSensitive) === wanted,
  );

  if (matches.length === 1) return matches[0];

  const available = lists
    .filter((l) => l && l.name != null && String(l.name).trim() !== '')
    .map((l) => String(l.name));
  if (matches.length === 0) {
    throw typedError(
      this,
      LIST_BY_NAME_ERRORS.NOT_FOUND,
      `board ${boardId} has no list named "${String(listName).trim()}"${caseSensitive ? ' (case-sensitive)' : ''}; lists: [${available.join(', ')}]`,
      i,
      { boardId, listName, available },
    );
  }
  throw typedError(
    this,
    LIST_BY_NAME_ERRORS.AMBIGUOUS,
    `board ${boardId} has ${matches.length} lists named "${String(listName).trim()}" (ids ${matches.map((l) => l.id).join(', ')}); refusing to pick one`,
    i,
    { boardId, listName, listIds: matches.map((l) => l.id) },
  );
}

async function createList(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  const boardId = this.getNodeParameter('boardId', i) as string;
  const type = this.getNodeParameter('type', i) as string;
  const position = this.getNodeParameter('position', i) as number;
  const name = this.getNodeParameter('name', i) as string;

  const body: any = {
    type,
    position,
    name,
  };

  return await makeRequest.call(
    this,
    'POST',
    `${baseUrl}/api/boards/${pathSegment(this, 'boardId', boardId)}/lists`,
    body,
    accessToken,
  );
}

async function getList(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  const listId = this.getNodeParameter('listId', i) as string;

  return await makeRequest.call(
    this,
    'GET',
    `${baseUrl}/api/lists/${pathSegment(this, 'listId', listId)}`,
    null,
    accessToken,
  );
}

async function updateList(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  const listId = this.getNodeParameter('listId', i) as string;
  const updateFields = this.getNodeParameter('updateFields', i, {}) as any;

  const body: any = {};

  if (updateFields.position !== undefined) body.position = updateFields.position;
  if (updateFields.name) body.name = updateFields.name;
  if (updateFields.boardId) body.boardId = updateFields.boardId;
  if (updateFields.type) body.type = updateFields.type;
  if (updateFields.color) body.color = updateFields.color;

  return await makeRequest.call(
    this,
    'PATCH',
    `${baseUrl}/api/lists/${pathSegment(this, 'listId', listId)}`,
    body,
    accessToken,
  );
}

async function deleteList(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  const listId = this.getNodeParameter('listId', i) as string;

  return await makeRequest.call(
    this,
    'DELETE',
    `${baseUrl}/api/lists/${pathSegment(this, 'listId', listId)}`,
    null,
    accessToken,
  );
}

async function moveCards(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  const listId = this.getNodeParameter('listId', i) as string;
  const targetListId = this.getNodeParameter('targetListId', i) as string;

  const body: any = {
    listId: targetListId,
  };

  return await makeRequest.call(
    this,
    'POST',
    `${baseUrl}/api/lists/${pathSegment(this, 'listId', listId)}/move-cards`,
    body,
    accessToken,
  );
}

async function sortList(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  const listId = this.getNodeParameter('listId', i) as string;
  const fieldName = this.getNodeParameter('fieldName', i) as string;
  const order = this.getNodeParameter('order', i, 'asc') as string;

  const body = {
    fieldName,
    order,
  };

  return await makeRequest.call(
    this,
    'POST',
    `${baseUrl}/api/lists/${pathSegment(this, 'listId', listId)}/sort`,
    body,
    accessToken,
  );
}

async function clearList(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  const listId = this.getNodeParameter('listId', i) as string;

  return await makeRequest.call(
    this,
    'POST',
    `${baseUrl}/api/lists/${pathSegment(this, 'listId', listId)}/clear`,
    null,
    accessToken,
  );
}
