import {
  IExecuteFunctions,
  NodeOperationError,
} from 'n8n-workflow';

import { makeRequest } from '../helpers/request';
import { pathSegment } from '../helpers/pathSegment';

export const boardOperations = {
  /**
   * Execute board operations
   * @param operation Operation to execute (create, get, update, delete)
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
        return await createBoard.call(this, itemIndex, baseUrl, accessToken);

      case 'get':
        return await getBoard.call(this, itemIndex, baseUrl, accessToken);

      case 'update':
        return await updateBoard.call(this, itemIndex, baseUrl, accessToken);

      case 'delete':
        return await deleteBoard.call(this, itemIndex, baseUrl, accessToken);

      default:
        throw new NodeOperationError(
          this.getNode(),
          `Unknown operation: ${operation}`,
        );
    }
  },
};

async function createBoard(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  const projectId = this.getNodeParameter('projectId', i) as string;
  const position = this.getNodeParameter('position', i) as number;
  const name = this.getNodeParameter('name', i) as string;

  const body: any = {
    position,
    name,
  };

  return await makeRequest.call(
    this,
    'POST',
    `${baseUrl}/api/projects/${pathSegment(this, 'projectId', projectId)}/boards`,
    body,
    accessToken,
  );
}

/**
 * Project a board:get response down to the parts a caller actually reads.
 *
 * WHY THIS EXISTS -- measured 2026-09-02 on the live n8n primary. Two AA patterns carried
 * 9-23 MB execution blobs and the kernel OOM-killer destroyed ~1,051 executions in one
 * three-hour window (13 `oom-kill:constraint=CONSTRAINT_MEMCG` events on worker4, Node/V8 at
 * 3.6-3.7 GiB against a 4Gi cgroup, `memory.oom.group` set so ONE overrun wipes the whole pod).
 * Composition of `AA Pattern - Ready Prefetch` exec 700386 (18.83 MB):
 *
 *     Fetch Board (Advance)   14.25 MB   95.3%   <- this call
 *       .included.cards               9.51 MB   read by NOBODY in that workflow
 *       .included.customFieldValues   3.14 MB   read by NOBODY from a BOARD fetch
 *       .included.customFields        1.08 MB   "
 *       .included.customFieldGroups   0.56 MB   "
 *       .included.tasks               0.24 MB   "
 *       .included.lists              <0.02 MB   the only part anyone reads
 *     every other node combined ~0.05 MB
 *
 * So ~95% of the heap those executions held was a payload no node ever dereferenced.
 *
 * ### The default is OFF, and that is load-bearing -- do NOT flip it.
 * `board.get` is the ONLY source of the board-level customField GROUP/FIELD DEFINITIONS.
 * `card.get` returns customField VALUES but not the defs, which is why the AA promote path
 * (`qa-evaluate :: Read QA Evidence` and the `done-*-promote` cells) re-reads the board to
 * resolve `Runtime State` group + field ids before writing. Projecting by default would strip
 * exactly those and break promote silently -- the caller would get a well-formed response with
 * the group missing, not an error. Each call site opts in only after its consumers are traced.
 *
 * ### `lean` is a WHITELIST -- it drops far more than the keys the UI text names.
 * The lean branch does not merely "remove the customField* and tasks keys": it REBUILDS
 * `included` from `lists` + a reduced `cards` and throws everything else away. `labels`,
 * `cardLabels`, `cardMemberships`, `taskLists`, `users`, `boardMemberships`, `projects`,
 * `attachments` -- and any key a future Planka adds -- are gone too, silently. Do not read the
 * "drops customFieldValues, customFields, customFieldGroups and tasks" phrasing anywhere in
 * this repo as an exhaustive loss list; it names only the keys that were HEAVY when measured.
 *
 * ### `omit` is the BLACKLIST counterpart -- reach for it when the whitelist is too aggressive.
 * Three heavy call sites cannot use `lean` because they read the board-level customField
 * GROUP/FIELD DEFINITIONS, which only `board:get` can supply. `omit` drops exactly the named
 * keys and keeps every other key -- known or unknown -- untouched. The two compose: `lean`
 * runs first, then `omit` deletes from whatever survived it.
 *
 * ### Invariants
 * - `lean: true, omit: []` is byte-identical to the pre-`omit` behaviour.
 * - The `included` WRAPPER always survives, even as `{}`. A downstream consumer guards on
 *   `if (!boardData.included && !boardData.item && !boardData.id)`; deleting the wrapper flips
 *   that guard and aborts the branch instead of yielding a thin board.
 * - The caller's `included` object is never mutated in place. The response object may be
 *   shared, and a `delete` on it would corrupt an unrelated reader.
 * - `omit` is normalised defensively (non-array -> [], non-string entries ignored). Fail-safe
 *   direction, as with `leanIncluded`: a mis-read parameter returns MORE data, never less.
 */
/**
 * The ONE place `omitIncluded` is normalised.
 *
 * ⚠️ THIS USED TO BE TWO COPIES -- one here, one in `getBoard` -- and an adversarial mutation
 * battery proved that made each copy individually DEAD: deleting either one on its own left all
 * 151 tests passing, because the surviving copy still did the work. A guard that no test can see
 * removed is not a guard. Both call sites now route through this function, so a single test
 * (`ignores non-string entries`) kills its removal.
 *
 * Why it matters that a non-string is filtered rather than passed through: `delete obj[['tasks']]`
 * coerces the array to the key `"tasks"` and drops it. That is the WRONG fail-safe direction --
 * a malformed parameter would remove MORE data than asked, silently. Everything here fails toward
 * returning MORE data, never less.
 */
function normaliseOmit(omit: unknown): string[] {
  return Array.isArray(omit) ? omit.filter((k): k is string => typeof k === 'string') : [];
}

function projectIncluded(response: any, opts: { lean: boolean; omit: string[] }): any {
  // Not our shape (an error item, an empty body, a list response) -> untouched.
  if (!response || typeof response !== 'object' || Array.isArray(response)) return response;
  const original = (response as any).included;
  if (!original || typeof original !== 'object' || Array.isArray(original)) return response;

  let included: any;
  if (opts.lean) {
    const lean: any = {};
    // `lists` is carried WHOLE: it is the part every board caller reads, and it is <0.02 MB.
    if (original.lists !== undefined) lean.lists = original.lists;
    // `cards` is reduced, not dropped: `Compute Deps` (todo-pickup) joins on .id/.listId.
    // `name` rides along because it is small and it is what makes a failure legible.
    if (Array.isArray(original.cards)) {
      lean.cards = original.cards.map((c: any) =>
        c && typeof c === 'object' ? { id: c.id, listId: c.listId, name: c.name } : c,
      );
    }
    included = lean;
  } else {
    // Shallow COPY before any delete -- never mutate the caller's object.
    included = { ...original };
  }

  for (const key of normaliseOmit(opts.omit)) delete included[key];

  // `included` itself is NEVER deleted, even when every key has been omitted.
  return { ...response, included };
}

async function getBoard(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  const boardId = this.getNodeParameter('boardId', i) as string;
  // Third argument is the default, but a caller (or a test double) may hand back `undefined`;
  // anything other than an explicit `true` keeps the full response. Fail-safe direction: a
  // mis-read parameter returns MORE data, never less.
  const leanIncluded = this.getNodeParameter('leanIncluded', i, false);
  // Blacklist counterpart. Same fail-safe direction: anything that is not a real array of
  // strings is normalised inside projectIncluded to [], i.e. a no-op, never a wider drop.
  const omitIncluded = this.getNodeParameter('omitIncluded', i, []) as string[];

  const response = await makeRequest.call(
    this,
    'GET',
    `${baseUrl}/api/boards/${pathSegment(this, 'boardId', boardId)}`,
    null,
    accessToken,
  );

  const lean = leanIncluded === true;
  const omit = normaliseOmit(omitIncluded);

  // Neither filter active -> the untouched response, exactly as before.
  if (!lean && omit.length === 0) return response;
  return projectIncluded(response, { lean, omit });
}

async function updateBoard(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  const boardId = this.getNodeParameter('boardId', i) as string;
  const updateFields = this.getNodeParameter('updateFields', i, {}) as any;

  const body: any = {};

  if (updateFields.position !== undefined) body.position = updateFields.position;
  if (updateFields.name) body.name = updateFields.name;
  if (updateFields.defaultView) body.defaultView = updateFields.defaultView;
  if (updateFields.defaultCardType) body.defaultCardType = updateFields.defaultCardType;
  if (updateFields.limitCardTypesToDefaultOne !== undefined) body.limitCardTypesToDefaultOne = updateFields.limitCardTypesToDefaultOne;
  if (updateFields.alwaysDisplayCardCreator !== undefined) body.alwaysDisplayCardCreator = updateFields.alwaysDisplayCardCreator;
  if (updateFields.expandTaskListsByDefault !== undefined) body.expandTaskListsByDefault = updateFields.expandTaskListsByDefault;
  if (updateFields.isSubscribed !== undefined) body.isSubscribed = updateFields.isSubscribed;

  return await makeRequest.call(
    this,
    'PATCH',
    `${baseUrl}/api/boards/${pathSegment(this, 'boardId', boardId)}`,
    body,
    accessToken,
  );
}

async function deleteBoard(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  const boardId = this.getNodeParameter('boardId', i) as string;

  return await makeRequest.call(
    this,
    'DELETE',
    `${baseUrl}/api/boards/${pathSegment(this, 'boardId', boardId)}`,
    null,
    accessToken,
  );
}
