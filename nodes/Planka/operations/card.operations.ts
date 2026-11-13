import {
  IExecuteFunctions,
  NodeOperationError,
} from 'n8n-workflow';

import { makeRequest } from '../helpers/request';
import { pathSegment } from '../helpers/pathSegment';
import { nextDefaultCardPosition } from '../helpers/position';
import {
  DEFAULT_ANCESTOR_WALK_CAP,
  FetchOutcome,
  MAX_ANCESTOR_WALK_CAP,
  walkAncestorChain,
} from '../helpers/ancestorChain';

export const cardOperations = {
  async execute(
    this: IExecuteFunctions,
    operation: string,
    itemIndex: number,
    baseUrl: string,
    accessToken: string,
  ): Promise<any> {
    switch (operation) {
      case 'create':
        return await createCard.call(this, itemIndex, baseUrl, accessToken);

      case 'get':
        return await getCard.call(this, itemIndex, baseUrl, accessToken);

      case 'getAncestorChain':
        return await getAncestorChain.call(this, itemIndex, baseUrl, accessToken);

      case 'update':
        return await updateCard.call(this, itemIndex, baseUrl, accessToken);

      case 'delete':
        return await deleteCard.call(this, itemIndex, baseUrl, accessToken);

      case 'duplicate':
        return await duplicateCard.call(this, itemIndex, baseUrl, accessToken);

      case 'readNotifications':
        return await readCardNotifications.call(this, itemIndex, baseUrl, accessToken);

      case 'listInList':
        return await listCardsInList.call(this, itemIndex, baseUrl, accessToken);

      default:
        throw new NodeOperationError(
          this.getNode(),
          `Unknown operation: ${operation}`,
        );
    }
  },
};

async function createCard(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  const listId = this.getNodeParameter('listId', i) as string;
  const position = this.getNodeParameter('position', i) as number;
  const name = this.getNodeParameter('name', i) as string;
  const type = this.getNodeParameter('type', i) as string;
  const additionalFields = this.getNodeParameter('additionalFields', i, {}) as any;

  const body: any = {
    position,
    name,
    type,
  };

  if (additionalFields.description) body.description = additionalFields.description;
  if (additionalFields.dueDate) body.dueDate = additionalFields.dueDate;
  if (additionalFields.isDueCompleted !== undefined) body.isDueCompleted = additionalFields.isDueCompleted;

  // Handle stopwatch action
  const stopwatchAction = additionalFields.stopwatchAction as string;
  if (stopwatchAction === 'start') {
    body.stopwatch = { startedAt: new Date().toISOString(), total: 0 };
  } else if (stopwatchAction === 'clear') {
    body.stopwatch = null;
  }

  return await makeRequest.call(
    this,
    'POST',
    `${baseUrl}/api/lists/${pathSegment(this, 'listId', listId)}/cards`,
    body,
    accessToken,
  );
}

async function getCard(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  const cardId = this.getNodeParameter('cardId', i) as string;

  return await makeRequest.call(
    this,
    'GET',
    `${baseUrl}/api/cards/${pathSegment(this, 'cardId', cardId)}`,
    null,
    accessToken,
  );
}

function errorMessage(e: unknown): string {
  return String((e && (e as any).message) || e);
}

/**
 * Walk `Relations.parent_card` upward from a card and resolve the first
 * ancestor's `Metadata.project_id`. See helpers/ancestorChain.ts for the
 * algorithm and every named stop.
 *
 * Cost: one card:get for the start card, one board:get for its board (only the
 * customField GROUP/FIELD definitions are read from it -- card:get returns
 * values but not board-level definitions), then one card:get per ancestor, at
 * most `cap`. Only an unreadable START card (or an invalid id / cap) throws;
 * every other failure is a named `stop` in the output.
 */
async function getAncestorChain(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  const cardId = this.getNodeParameter('cardId', i) as string;
  const rawCap = this.getNodeParameter('cap', i, DEFAULT_ANCESTOR_WALK_CAP) as unknown;
  const cap = rawCap === undefined || rawCap === null || rawCap === '' ? DEFAULT_ANCESTOR_WALK_CAP : Number(rawCap);
  if (!Number.isInteger(cap) || cap < 1 || cap > MAX_ANCESTOR_WALK_CAP) {
    throw new NodeOperationError(
      this.getNode(),
      `cap must be an integer between 1 and ${MAX_ANCESTOR_WALK_CAP} (got ${JSON.stringify(rawCap)})`,
      { itemIndex: i },
    );
  }

  const startSeg = pathSegment(this, 'cardId', cardId);
  const startCard = await makeRequest.call(this, 'GET', `${baseUrl}/api/cards/${startSeg}`, null, accessToken);

  const start = startCard && startCard.item ? startCard.item : startCard;
  const boardId = String((start && start.boardId) || '');
  let board: FetchOutcome;
  if (!boardId) {
    board = { ok: false, message: `start card ${cardId} reported no boardId` };
  } else {
    try {
      board = {
        ok: true,
        response: await makeRequest.call(
          this,
          'GET',
          `${baseUrl}/api/boards/${pathSegment(this, 'boardId', boardId)}`,
          null,
          accessToken,
        ),
      };
    } catch (e) {
      board = { ok: false, message: errorMessage(e) };
    }
  }

  return await walkAncestorChain({
    cardId: String(cardId),
    startCard,
    board,
    cap,
    fetchCard: async (id: string): Promise<FetchOutcome> => {
      try {
        // A parent_card value is DATA read from Planka, so it goes through the same
        // path-segment guard as operator input: '..' must never re-address the request.
        const seg = pathSegment(this, 'parent_card', id);
        return {
          ok: true,
          response: await makeRequest.call(this, 'GET', `${baseUrl}/api/cards/${seg}`, null, accessToken),
        };
      } catch (e) {
        return { ok: false, message: errorMessage(e) };
      }
    },
  });
}

async function updateCard(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  const cardId = this.getNodeParameter('cardId', i) as string;
  // ⚠️ THIS FALLBACK DID NOT WORK IN PRODUCTION. Measured 2026-08-25 — read this
  // before trusting it, and before writing `additionalFields` into any update node.
  //
  // The intent below was to accept hand-authored workflow JSON that puts update
  // payloads in `additionalFields` (the create-time collection). n8n execution
  // 570401 disproves that it succeeds: a card:update node declaring
  // `additionalFields.listId` was handed a real, same-board target list
  // (1765233670731335577, shouldMoveCard: true); Planka recorded no moveCard row;
  // and the `listId mismatch` guard below — present in that exact image, recovered
  // from the node's containerd content store — did NOT fire. That guard is gated on
  // `body.listId !== undefined`, so its silence proves listId never reached the
  // body. Meanwhile every one of the 2651 recorded moveCard rows came from a node
  // using `updateFields`.
  //
  // The likely mechanism is that n8n resolves a node's parameters against its
  // DESCRIPTION and drops what the description does not declare for the CURRENT
  // operation, so `getNodeParameter('additionalFields')` returns the `{}` default
  // on an update and there is nothing here to fall back TO. That is an inference,
  // not a measurement — which is why the code is kept and instrumented rather than
  // deleted. The warn below settles it from production logs at zero risk: if n8n
  // strips the collection the warn can never fire; if it arrives raw, it fires and
  // names the node. Either way the next reader gets a fact instead of a guess.
  //
  // ⛔ The two unit tests covering this path (card.operations.test.ts, the
  // 'accept additionalFields as fallback' and 'resolves expression strings' cases)
  // are NON-PROBATIVE about any of it: they assign
  // `mockExecuteFunctions.getNodeParameter = jest.fn().mockReturnValueOnce({...})`,
  // hardcoding that n8n hands back the stored object — the exact behaviour in
  // question. They pass whether or not the real thing works.
  //
  // Use `updateFields`. A fleet-wide gate now enforces it
  // (n8n_custom_nodes scripts/tests/test-card-move-uses-updatefields.mjs).
  const updateFields = this.getNodeParameter('updateFields', i, {}) as any;
  const additionalFields = this.getNodeParameter('additionalFields', i, {}) as any;

  if (
    additionalFields &&
    typeof additionalFields === 'object' &&
    Object.keys(additionalFields).length > 0
  ) {
    // Reaching this line is itself the finding — see the block above.
    this.logger?.warn?.(
      `[kanban.card.update] additionalFields reached the update handler with keys ` +
        `[${Object.keys(additionalFields).join(', ')}] on node "${this.getNode().name}". ` +
        `This collection is declared create-only and did NOT reach the PATCH body in ` +
        `production (execution 570401); move these keys to updateFields.`,
    );
  }

  // n8n's expression resolver only descends into a collection's sub-keys when
  // the collection is declared in the node descriptor for the CURRENT
  // operation. Because `additionalFields` is declared with
  // `displayOptions.show.operation: ['create']`, getNodeParameter returns the
  // raw object on update operations — sub-key values like
  // "={{ $json.doing_list_id }}" come back as literal expression strings, not
  // resolved values. Resolve any leading-`=` strings manually so PATCH bodies
  // carry real values. updateFields IS declared for update ops, so its
  // sub-keys are already resolved by the time we get here.
  if (additionalFields && typeof additionalFields === 'object') {
    for (const k of Object.keys(additionalFields)) {
      const v = additionalFields[k];
      if (typeof v === 'string' && v.startsWith('=')) {
        additionalFields[k] = this.evaluateExpression(v, i);
      }
    }
  }

  const fields = { ...(additionalFields || {}), ...(updateFields || {}) };

  // ── PRE-FLIGHT customFields validation — MUST stay above the PATCH ──────
  //
  // These two rejections are decidable from the node's parameters alone: zero
  // HTTP calls are needed to know that the payload did not parse, or parsed to
  // no fields at all. Deciding them AFTER the card PATCH would manufacture the
  // exact misattribution the fail-closed design exists to prevent.
  //
  // Why the ordering is load-bearing, not cosmetic: a throw does not merely
  // red the NODE, it aborts the RUN. The downstream Assert nodes (e.g.
  // `Assert Moved BLOCKED` in decision_development/qa.json) declare neither
  // `onError` nor `continueOnFail`, so n8n's default `stopWorkflow` applies —
  // the error item reaches the Assert, the Assert throws
  // "…BLOCKED card move failed", the workflow aborts, and every node past it
  // is skipped. If the PATCH had already committed and the listId echo had
  // already been verified, that headline would be FALSE: the card *is* in
  // BLOCKED. Failing up here makes it TRUE — no PATCH is issued, the card
  // never moves, and there is no half-committed card to strand.
  //
  // ⛔ Do NOT move these below the PATCH. `tests/unit/operations/
  // card.operations.test.ts` asserts that ZERO requests were issued on both
  // paths; that assertion is the guard against exactly that regression.
  //
  // The remaining checks are intrinsically post-commit and stay below the
  // PATCH: `item.boardId` is read off the PATCH RESPONSE (the parameters carry
  // no equivalent — `fields.boardId` is an optional *move-to-board* directive
  // that the AA callers never send), and the board-schema resolution needs a
  // board fetch. The schema-miss path deliberately does NOT throw — see below.
  const hasCustomFields =
    fields.customFields !== undefined &&
    fields.customFields !== null &&
    fields.customFields !== '';

  let parsedCustomFields: Record<string, unknown> | null = null;

  if (hasCustomFields) {
    const uncommitted = fields.listId
      ? `NOTHING has been committed: no PATCH was issued, so the card was NOT moved to list ${fields.listId} and still sits where it was`
      : `NOTHING has been committed: no PATCH was issued, so the card is unchanged`;

    parsedCustomFields = parseCustomFields.call(this, fields.customFields);
    if (!parsedCustomFields) {
      throw new NodeOperationError(
        this.getNode(),
        `Planka card.update: customFields were supplied for card ${cardId} but could not be read as a name → value object (got ${typeof fields.customFields}). ${uncommitted} — fix the payload and retry the whole operation. Pass customFields as an object or a JSON-encoded object string.`,
      );
    }
    if (Object.keys(parsedCustomFields).length === 0) {
      throw new NodeOperationError(
        this.getNode(),
        `Planka card.update: customFields were supplied for card ${cardId} but parsed to zero fields. ${uncommitted} — fix the payload and retry the whole operation. If the caller genuinely has no fields to set, send an empty string; an empty object means the value computation produced nothing.`,
      );
    }
  }

  const body: any = {};

  if (fields.position !== undefined) body.position = fields.position;
  if (fields.name) body.name = fields.name;
  if (fields.description !== undefined) body.description = fields.description;
  if (fields.dueDate !== undefined) body.dueDate = fields.dueDate;
  if (fields.listId) body.listId = fields.listId;
  if (fields.boardId) body.boardId = fields.boardId;
  if (fields.coverAttachmentId !== undefined) body.coverAttachmentId = fields.coverAttachmentId;
  if (fields.type) body.type = fields.type;
  if (fields.isDueCompleted !== undefined) body.isDueCompleted = fields.isDueCompleted;
  if (fields.isSubscribed !== undefined) body.isSubscribed = fields.isSubscribed;

  // Planka rejects PATCH /api/cards/:id with {listId} alone — moving a card
  // between lists requires the new position too. When the caller gave none,
  // place the card at the BOTTOM of the destination list with a clash-free,
  // monotonic position. Never a constant: a constant clashes with the card
  // already there, and on a large list Planka renumbers every card, one
  // UPDATE + socket broadcast each, which outlived the 60s ingress timeout
  // (504 on the ~768-card DONE list). See helpers/position.ts.
  // An explicit caller-supplied position (including 0) always wins.
  if (body.listId !== undefined && body.position === undefined) {
    body.position = nextDefaultCardPosition();
  }

  // Handle stopwatch action
  const stopwatchAction = fields.stopwatchAction as string;
  if (stopwatchAction === 'start') {
    body.stopwatch = { startedAt: new Date().toISOString(), total: 0 };
  } else if (stopwatchAction === 'stop') {
    body.stopwatch = null; // API handles accumulating time when set to null
  } else if (stopwatchAction === 'clear') {
    body.stopwatch = null;
  }

  const cardResponse = await makeRequest.call(
    this,
    'PATCH',
    `${baseUrl}/api/cards/${pathSegment(this, 'cardId', cardId)}`,
    body,
    accessToken,
  );

  // Guard: Planka returns 200 + the pre-edit card item when a PATCH listId
  // is silently rejected (wrong board, schema-rejected value, NetworkPolicy
  // stripping the field). Workflows then see "success" while the move never
  // happened. Compare the echoed listId for any move request and throw on
  // mismatch so callers surface the failure instead of stalling silently.
  // Plan 7 → "kanban listId regression" (2026-05-08) for full context.
  if (body.listId !== undefined) {
    const echoListId = (cardResponse?.item?.listId ?? null) as string | null;
    if (echoListId !== body.listId) {
      throw new NodeOperationError(
        this.getNode(),
        `Planka card.update: listId mismatch — requested ${body.listId} but server echoed ${echoListId}. The card did NOT move; check that listId belongs to the same board as the card and that no Planka NetworkPolicy is dropping the field.`,
      );
    }
  }

  // After the standard PATCH succeeds, persist customFields if the caller
  // supplied them. Workflow JSON commonly carries customFields as a
  // name → value map (string-encoded JSON or a parsed object) under
  // additionalFields/updateFields. Resolve names to (groupId, fieldId) via
  // GET /api/boards/{boardId} ?subscribe=false (whose included payload
  // already carries customFieldGroups + customFields), then PATCH each
  // value via the custom-field-values endpoint.
  // The card PATCH above is already COMMITTED by the time we get here, and the
  // listId echo guard has already thrown on a failed move. So every path below
  // describes a card that is ALREADY in its new state. Silently skipping the
  // custom-field write here is what parked 102 cards in BLOCKED with no
  // block_reason on 2026-09-02: the caller saw a success response, so nothing
  // could escalate, re-drive or diagnose them.
  //
  // The parameter-decidable failures (payload does not parse / parses to zero
  // fields) were already rejected ABOVE the PATCH, so nothing that reaches
  // here can be blamed on the payload's shape. Two classes remain, treated
  // deliberately differently:
  //   (1) The write is not ADDRESSABLE because the PATCH echo carried no
  //       boardId. This is intrinsically post-commit — the value comes from
  //       the response, not the parameters — and cannot happen on a
  //       correctly-configured caller, so it throws, symmetric with the
  //       listId guard.
  //   (2) The board's SCHEMA does not carry the named field (or its group is
  //       not addressable). ⛔ This MUST stay non-fatal: measured 2026-09-11,
  //       711 of 778 boards have no addressable `block_reason` field at all
  //       (only 67 do), so throwing here would break the overwhelming
  //       majority of boards. It is escalated from warn to error and reported
  //       back in `customFieldsNotPersisted` so a caller or log monitor can
  //       see the loss instead of reading a clean success.
  if (hasCustomFields && parsedCustomFields) {
    const parsed = parsedCustomFields;
    const committed =
      body.listId !== undefined
        ? `The card WAS already moved to list ${body.listId}`
        : `The card update was already committed`;

    const boardId = cardResponse?.item?.boardId as string | undefined;
    if (!boardId) {
      throw new NodeOperationError(
        this.getNode(),
        `Planka card.update: customFields [${Object.keys(parsed).join(', ')}] were supplied for card ${cardId} but the PATCH response carried no item.boardId, so the fields could not be addressed. ${committed}, so it now sits in its new state with NO custom field values written.`,
      );
    }

    const report = await applyCustomFields.call(
      this,
      baseUrl,
      accessToken,
      cardId,
      boardId,
      parsed,
    );

    if (report.unresolved.length > 0) {
      this.logger?.error?.(
        `[kanban.card.update] customFields NOT persisted on card ${cardId}: ` +
          `${report.unresolved.map((u) => `${u.name} (${u.reason})`).join(', ')}. ` +
          `${committed}. Board ${boardId} does not expose these fields — add them to the board ` +
          `template, or stop sending them. Persisted: [${report.persisted.join(', ')}].`,
      );
      return { ...cardResponse, customFieldsNotPersisted: report.unresolved };
    }
  }

  return cardResponse;
}

/**
 * Parse a customFields payload that may arrive as either a JSON string
 * (hand-authored workflow JSON) or an already-parsed object.
 * Returns null on parse failure (warning is logged); empty object is valid.
 */
function parseCustomFields(
  this: IExecuteFunctions,
  raw: unknown,
): Record<string, unknown> | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'object') {
    return raw as Record<string, unknown>;
  }
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed === '') return null;
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
      this.logger?.warn?.(
        `[kanban.card.update] customFields JSON did not parse to an object; got ${typeof parsed}`,
      );
      return null;
    } catch (err) {
      this.logger?.warn?.(
        `[kanban.card.update] customFields string is not valid JSON: ${(err as Error).message}`,
      );
      return null;
    }
  }
  this.logger?.warn?.(
    `[kanban.card.update] customFields has unsupported type ${typeof raw}; expected object or JSON string`,
  );
  return null;
}

/**
 * Outcome of a customFields write. `unresolved` is non-empty when the board's
 * schema could not address a requested field — the caller MUST be able to see
 * that, because the card update itself has already been committed.
 */
export interface CustomFieldsPersistenceReport {
  persisted: string[];
  unresolved: Array<{ name: string; reason: 'not-on-board' | 'no-addressable-group' }>;
}

/**
 * Resolve customField names to (groupId, fieldId) via the board fetch and
 * PATCH each entry to the card's custom-field-values endpoint. A name that
 * doesn't resolve does not abort the loop — it is recorded in the returned
 * report so the caller can surface the loss (see updateCard). A genuine HTTP
 * failure on a value PATCH still rejects and propagates.
 */
async function applyCustomFields(
  this: IExecuteFunctions,
  baseUrl: string,
  accessToken: string,
  cardId: string,
  boardId: string,
  values: Record<string, unknown>,
): Promise<CustomFieldsPersistenceReport> {
  const board = await makeRequest.call(
    this,
    'GET',
    `${baseUrl}/api/boards/${pathSegment(this, 'boardId', boardId)}?subscribe=false`,
    null,
    accessToken,
  );

  const included = board?.included ?? {};
  const customFields = (included.customFields ?? []) as Array<{
    id: string;
    name: string;
    customFieldGroupId: string | null;
    baseCustomFieldGroupId: string | null;
  }>;
  const customFieldGroups = (included.customFieldGroups ?? []) as Array<{
    id: string;
    baseCustomFieldGroupId: string | null;
  }>;

  // Some custom fields live on a base group (template); the *group* on the
  // board points back to the base group via baseCustomFieldGroupId. Build a
  // base-group → board-group lookup so fields whose own
  // customFieldGroupId is null can still be addressed.
  const groupByBase = new Map<string, string>();
  for (const grp of customFieldGroups) {
    if (grp.baseCustomFieldGroupId) {
      groupByBase.set(grp.baseCustomFieldGroupId, grp.id);
    }
  }

  // name (lowercased) → { groupId, fieldId }
  const byName = new Map<string, { groupId: string; fieldId: string }>();
  // Fields that DO exist on the board but whose group cannot be addressed.
  // Distinguishing them from "not on this board at all" matters: one is a
  // board-template defect, the other is a caller sending an unknown name.
  const ungrouped = new Set<string>();
  for (const f of customFields) {
    let groupId = f.customFieldGroupId;
    if (!groupId && f.baseCustomFieldGroupId) {
      groupId = groupByBase.get(f.baseCustomFieldGroupId) ?? null;
    }
    if (!groupId) {
      ungrouped.add(f.name.toLowerCase());
      continue;
    }
    byName.set(f.name.toLowerCase(), { groupId, fieldId: f.id });
  }

  const report: CustomFieldsPersistenceReport = { persisted: [], unresolved: [] };

  for (const [name, value] of Object.entries(values)) {
    const resolved = byName.get(name.toLowerCase());
    if (!resolved) {
      const reason = ungrouped.has(name.toLowerCase())
        ? ('no-addressable-group' as const)
        : ('not-on-board' as const);
      this.logger?.warn?.(
        `[kanban.card.update] customField "${name}" not found on board ${boardId}; skipping`,
      );
      report.unresolved.push({ name, reason });
      continue;
    }
    const url = `${baseUrl}/api/cards/${pathSegment(this, 'cardId', cardId)}/custom-field-values/customFieldGroupId:${pathSegment(this, 'groupId', resolved.groupId)}:customFieldId:${pathSegment(this, 'fieldId', resolved.fieldId)}`;
    const content = typeof value === 'string' ? value : JSON.stringify(value);
    await makeRequest.call(this, 'PATCH', url, { content }, accessToken);
    report.persisted.push(name);
  }

  return report;
}

async function deleteCard(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  const cardId = this.getNodeParameter('cardId', i) as string;

  return await makeRequest.call(
    this,
    'DELETE',
    `${baseUrl}/api/cards/${pathSegment(this, 'cardId', cardId)}`,
    null,
    accessToken,
  );
}

async function duplicateCard(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  const cardId = this.getNodeParameter('cardId', i) as string;
  const duplicateOptions = this.getNodeParameter('duplicateOptions', i, {}) as any;

  const body: any = {};

  if (duplicateOptions.name) body.name = duplicateOptions.name;
  if (duplicateOptions.position !== undefined) body.position = duplicateOptions.position;
  if (duplicateOptions.boardId) body.boardId = duplicateOptions.boardId;
  if (duplicateOptions.listId) body.listId = duplicateOptions.listId;

  return await makeRequest.call(
    this,
    'POST',
    `${baseUrl}/api/cards/${pathSegment(this, 'cardId', cardId)}/duplicate`,
    body,
    accessToken,
  );
}

async function readCardNotifications(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  const cardId = this.getNodeParameter('cardId', i) as string;

  return await makeRequest.call(
    this,
    'POST',
    `${baseUrl}/api/cards/${pathSegment(this, 'cardId', cardId)}/read-notifications`,
    null,
    accessToken,
  );
}

async function listCardsInList(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  const listId = this.getNodeParameter('listId', i) as string;
  const filters = this.getNodeParameter('filters', i, {}) as any;

  const queryParams: string[] = [];

  if (filters.beforeListChangedAt) {
    queryParams.push(`before[listChangedAt]=${encodeURIComponent(filters.beforeListChangedAt)}`);
  }
  if (filters.beforeId) {
    queryParams.push(`before[id]=${encodeURIComponent(filters.beforeId)}`);
  }
  if (filters.search) {
    queryParams.push(`search=${encodeURIComponent(filters.search)}`);
  }
  if (filters.userIds) {
    queryParams.push(`userIds=${encodeURIComponent(filters.userIds)}`);
  }
  if (filters.labelIds) {
    queryParams.push(`labelIds=${encodeURIComponent(filters.labelIds)}`);
  }

  const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';

  return await makeRequest.call(
    this,
    'GET',
    `${baseUrl}/api/lists/${pathSegment(this, 'listId', listId)}/cards${queryString}`,
    null,
    accessToken,
  );
}
