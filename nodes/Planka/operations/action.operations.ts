import {
  IExecuteFunctions,
  NodeOperationError,
} from 'n8n-workflow';

import { makeRequest } from '../helpers/request';
import { pathSegment } from '../helpers/pathSegment';

export const actionOperations = {
  /**
   * Execute action operations
   * @param operation Operation to execute (getBoardActions, getCardActions)
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
      case 'getBoardActions':
        return await getBoardActions.call(this, itemIndex, baseUrl, accessToken);

      case 'getCardActions':
        return await getCardActions.call(this, itemIndex, baseUrl, accessToken);

      default:
        throw new NodeOperationError(
          this.getNode(),
          `Unknown operation: ${operation}`,
        );
    }
  },
};

/**
 * Planka's page size for action listings. Server-side constant `LIMIT = 50` in
 * planka-private `server/api/hooks/query-methods/models/Action.js` (getByBoardId /
 * getByCardId: `sort('id DESC').limit(LIMIT)`, `beforeId` => `id < beforeId`).
 * A page shorter than this is the last page.
 */
export const ACTION_PAGE_SIZE = 50;

/**
 * Hard ceiling on pages fetched by `returnAll`. Reaching it with a still-full page
 * THROWS (`pagination_ceiling`) - a count built on a silently truncated history is
 * wrong, so we never return a partial list as if it were complete.
 */
export const ACTION_MAX_PAGES = 200;

function withBeforeId(url: string, beforeId: unknown): string {
  if (beforeId === undefined || beforeId === null || beforeId === '') {
    return url;
  }
  return `${url}?beforeId=${encodeURIComponent(String(beforeId))}`;
}

/**
 * Planka ids are bigint strings (e.g. "1357158568008091264", > 2^53), so they are
 * compared as canonical decimal strings (length, then lexical) - Number() would lose
 * precision and could produce a cursor that skips or repeats actions. (No bigint at
 * this package's ES2019 target.)
 */
function toDecimalId(this: IExecuteFunctions, id: unknown): string {
  const s = id === undefined || id === null ? '' : String(id);
  if (!/^\d+$/.test(s)) {
    throw new NodeOperationError(
      this.getNode(),
      `returnAll: action id ${JSON.stringify(id)} is not an integer id; cannot page`,
    );
  }
  return s.replace(/^0+(?=\d)/, '');
}

/** -1 / 0 / 1 for canonical decimal id strings. */
export function compareDecimalIds(a: string, b: string): number {
  if (a.length !== b.length) return a.length < b.length ? -1 : 1;
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

/**
 * Fetch every page of an actions endpoint and return ONE item
 * `{ items, included, pages }`: items concatenated in server order (id DESC),
 * `included` arrays merged and deduplicated by `id` (first occurrence wins), and
 * `pages` = number of requests made.
 */
async function fetchAllActionPages(
  this: IExecuteFunctions,
  baseEndpoint: string,
  startBeforeId: unknown,
  accessToken: string,
): Promise<{ items: any[]; included: Record<string, any[]>; pages: number }> {
  const items: any[] = [];
  const included: Record<string, any[]> = { users: [] };
  const seen: Record<string, Set<string>> = { users: new Set() };

  let cursor: unknown = startBeforeId;
  let pages = 0;

  for (;;) {
    if (pages >= ACTION_MAX_PAGES) {
      throw new NodeOperationError(
        this.getNode(),
        `pagination_ceiling: returnAll fetched ${ACTION_MAX_PAGES} full pages of ` +
          `${ACTION_PAGE_SIZE} actions from ${baseEndpoint} and more remain; ` +
          'refusing to return a truncated history',
      );
    }

    const response = await makeRequest.call(
      this,
      'GET',
      withBeforeId(baseEndpoint, cursor),
      null,
      accessToken,
    );
    pages += 1;

    const pageItems = response?.items;
    if (!Array.isArray(pageItems)) {
      throw new NodeOperationError(
        this.getNode(),
        `returnAll: page ${pages} from ${baseEndpoint} has no items array`,
      );
    }

    items.push(...pageItems);

    const pageIncluded = response?.included ?? {};
    for (const [key, value] of Object.entries(pageIncluded)) {
      if (!Array.isArray(value)) continue;
      if (!included[key]) {
        included[key] = [];
        seen[key] = new Set();
      }
      for (const entry of value) {
        const id = entry?.id;
        if (id === undefined || id === null) {
          included[key].push(entry);
          continue;
        }
        const k = String(id);
        if (seen[key].has(k)) continue;
        seen[key].add(k);
        included[key].push(entry);
      }
    }

    if (pageItems.length < ACTION_PAGE_SIZE) {
      return { items, included, pages };
    }

    // Full page: the next cursor is the smallest id on this page (`id < beforeId`).
    let min = toDecimalId.call(this, pageItems[0]?.id);
    for (const a of pageItems) {
      const v = toDecimalId.call(this, a?.id);
      if (compareDecimalIds(v, min) < 0) min = v;
    }
    if (cursor !== undefined && cursor !== null && cursor !== '') {
      const prev = toDecimalId.call(this, cursor);
      if (compareDecimalIds(min, prev) >= 0) {
        throw new NodeOperationError(
          this.getNode(),
          `returnAll: cursor did not advance on ${baseEndpoint} (beforeId=${String(cursor)}, ` +
            `page min id=${min}); the server may be ignoring beforeId`,
        );
      }
    }
    cursor = min;
  }
}

/**
 * Get actions for a board
 * @param i Index of the current item
 * @param baseUrl Planka base URL
 * @param accessToken JWT access token
 * @returns `{items, included}` (one page) or, with returnAll, `{items, included, pages}`
 */
async function getBoardActions(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  const boardId = this.getNodeParameter('boardId', i) as string;
  const additionalFields = this.getNodeParameter('additionalFields', i, {}) as any;
  const returnAll = this.getNodeParameter('returnAll', i, false) as boolean;

  const endpoint = `${baseUrl}/api/boards/${pathSegment(this, 'boardId', boardId)}/actions`;

  if (returnAll === true) {
    return await fetchAllActionPages.call(this, endpoint, additionalFields.beforeId, accessToken);
  }

  return await makeRequest.call(
    this,
    'GET',
    additionalFields.beforeId ? withBeforeId(endpoint, additionalFields.beforeId) : endpoint,
    null,
    accessToken,
  );
}

/**
 * Get actions for a card
 * @param i Index of the current item
 * @param baseUrl Planka base URL
 * @param accessToken JWT access token
 * @returns `{items, included}` (one page) or, with returnAll, `{items, included, pages}`
 */
async function getCardActions(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  const cardId = this.getNodeParameter('cardId', i) as string;
  const additionalFields = this.getNodeParameter('additionalFields', i, {}) as any;
  const returnAll = this.getNodeParameter('returnAll', i, false) as boolean;

  const endpoint = `${baseUrl}/api/cards/${pathSegment(this, 'cardId', cardId)}/actions`;

  if (returnAll === true) {
    return await fetchAllActionPages.call(this, endpoint, additionalFields.beforeId, accessToken);
  }

  return await makeRequest.call(
    this,
    'GET',
    additionalFields.beforeId ? withBeforeId(endpoint, additionalFields.beforeId) : endpoint,
    null,
    accessToken,
  );
}
