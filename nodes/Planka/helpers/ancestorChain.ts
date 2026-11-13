/**
 * The transitive `Relations.parent_card` walk that resolves an ancestor's
 * `Metadata.project_id` -- ported from the two hand-rolled copies it replaces
 * (n8n_custom_nodes `patterns/activity-card-hydration.json` Seed Ancestor Walk /
 * Plan Hop / Record Hop / Finish Ancestor Walk, and `patterns/done-finalize.json`
 * Seed Spawn Ancestors / Plan Spawn Hop / Record Spawn Hop / Finish Spawn Walk).
 * Those two copies are line-for-line the same algorithm; this is that algorithm
 * once, with every named stop preserved.
 *
 * Pure: all I/O is injected, so the unit tests drive it without Planka.
 *
 * ⛔ EVERY stop is an OUTPUT, never a throw, and never an empty answer. "An
 * ancestor we could not read" / "an ancestor on another board" / "a cycle" are
 * different facts from "no ancestor has a project", and the callers branch on them.
 */

export const PLACEHOLDER_PROJECT_ID = '00000000-0000-0000-0000-000000000001';
export const PROJECT_UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Measured 2026-09-06: deepest parent_card chain in the kanban DB is 30. */
export const DEFAULT_ANCESTOR_WALK_CAP = 40;
export const MAX_ANCESTOR_WALK_CAP = 100;

export type AncestorWalkStop =
  | 'resolved'
  | 'chain_exhausted_no_project_id'
  | 'ancestor_cycle'
  | 'ancestor_conflict'
  | 'ancestor_parent_ambiguous'
  | 'ancestor_value_refused'
  | 'ancestor_unreadable'
  | 'ancestor_off_board'
  | 'ancestor_board_unknown'
  | 'no_field_definitions'
  | 'depth_cap_reached'
  | 'walk_board_unreadable';

export const ANCESTOR_WALK_REASONS: Record<AncestorWalkStop, string | null> = {
  resolved: null,
  chain_exhausted_no_project_id:
    'the transitive Relations.parent_card chain was walked to its root and NO ancestor carries a Metadata.project_id',
  ancestor_cycle:
    'the Relations.parent_card chain revisits a card it already read — REFUSED rather than truncated to whichever ancestor came first',
  ancestor_conflict:
    'an ancestor carries more than one distinct Metadata.project_id — REFUSED rather than resolved by picking one',
  ancestor_parent_ambiguous:
    'an ancestor carries more than one distinct Relations.parent_card — the chain forks and REFUSES rather than choosing a branch',
  ancestor_value_refused:
    'an ancestor carries a project_id that is not a UUID (or is the placeholder sentinel) — REFUSED and named rather than propagated',
  ancestor_unreadable:
    'an ancestor card could not be read from Planka, so the chain is broken rather than absent',
  ancestor_off_board:
    'an ancestor sits on a DIFFERENT board, so its Metadata.project_id is stored against field definitions this walk never fetched — UNREADABLE, which is not the same fact as absent, and not a licence to keep walking',
  ancestor_board_unknown:
    'an ancestor card reported no boardId, so the walk cannot confirm its Metadata.project_id was readable — treated as unreadable rather than absent',
  no_field_definitions:
    'the board carried no customField definitions, so an ancestor value could not be located — this is a fetch defect, not an absent project_id',
  depth_cap_reached:
    'the walk hit its structural depth cap before finding an ancestor with a project_id',
  walk_board_unreadable:
    "the starting card's board could not be read, so no field definitions exist to walk with",
};

export interface RejectedValue {
  source: string;
  card_id: string;
  value: string;
  why: 'placeholder_sentinel' | 'not_uuid_shaped';
}

export interface AncestorChainResult {
  card_id: string;
  board_id: string;
  /** The starting card's own distinct Relations.parent_card values (normalised). */
  start_parents: string[];
  resolved: string | null;
  source: 'ancestor_walk' | null;
  stop: AncestorWalkStop;
  stop_detail: string | null;
  reason: string | null;
  /** Ancestors actually fetched, in walk order (the start card is NOT in it). */
  chain: string[];
  /** Start card + every ancestor fetched: the memo and the cycle guard. */
  visited: string[];
  hops: number;
  cap: number;
  rejected: RejectedValue[];
  /** Set only for stops that are a fact about this walk's REACH, not the data. */
  known_source_out_of_reach: string | null;
}

/** First non-empty trimmed line: recovers a UUID doubled across a newline, still refuses a snowflake. */
export function firstLine(x: unknown): string {
  return (
    String(x == null ? '' : x)
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)[0] || ''
  );
}

/** Unwrap a Planka `card:get` response: `{ item, included }`. */
function unwrapCard(resp: any): { card: any; included: any } {
  const card = resp && resp.item ? resp.item : resp;
  const included = (resp && resp.included) || (card && card.included) || {};
  return { card: card || {}, included };
}

/**
 * Every DISTINCT normalised value of `groupName.fieldName` on one card.
 * Collect-all, never `find()`: a card carrying both a card-scoped and a
 * board-level group of the same name must surface as a conflict, not be
 * resolved by array order.
 */
function distinctValues(
  groups: any[],
  fields: any[],
  values: any[],
  groupName: string,
  fieldName: string,
): string[] {
  const gids = groups.filter((g) => (g && g.name) === groupName).map((g) => String(g.id));
  const fids = fields
    .filter((f) => f && (f.name || '') === fieldName && gids.indexOf(String(f.customFieldGroupId)) !== -1)
    .map((f) => String(f.id));
  const seen: string[] = [];
  for (const v of values) {
    if (!v || fids.indexOf(String(v.customFieldId)) === -1) continue;
    const n = firstLine(v.content);
    if (n && seen.indexOf(n) === -1) seen.push(n);
  }
  return seen;
}

export type FetchOutcome = { ok: true; response: any } | { ok: false; message: string };

export interface WalkInput {
  cardId: string;
  /** The starting card's `card:get` response (already read; its failure is the caller's throw). */
  startCard: any;
  /** The starting card's board:get response, or a failure. Only groups/fields are read from it. */
  board: FetchOutcome;
  cap: number;
  fetchCard: (cardId: string) => Promise<FetchOutcome>;
}

export async function walkAncestorChain(input: WalkInput): Promise<AncestorChainResult> {
  const cap = input.cap;
  const cardId = String(input.cardId);
  const { card: start, included: startInc } = unwrapCard(input.startCard);
  const refBoardId = String((start && start.boardId) || '');

  const boardIncluded = input.board.ok ? (input.board.response && input.board.response.included) || {} : {};
  const boardGroups: any[] = Array.isArray(boardIncluded.customFieldGroups) ? boardIncluded.customFieldGroups : [];
  const boardFields: any[] = Array.isArray(boardIncluded.customFields) ? boardIncluded.customFields : [];

  const res: AncestorChainResult = {
    card_id: cardId,
    board_id: refBoardId,
    start_parents: [],
    resolved: null,
    source: null,
    stop: 'chain_exhausted_no_project_id',
    stop_detail: null,
    reason: null,
    chain: [],
    visited: [cardId],
    hops: 0,
    cap,
    rejected: [],
    known_source_out_of_reach: null,
  };

  const finish = (stop: AncestorWalkStop, detail: string | null = null): AncestorChainResult => {
    res.stop = stop;
    res.stop_detail = detail;
    res.reason = res.resolved ? null : ANCESTOR_WALK_REASONS[stop];
    if (!res.resolved && stop === 'depth_cap_reached') {
      res.known_source_out_of_reach = 'ancestor_walk_depth_cap_' + cap;
    } else if (!res.resolved && (stop === 'ancestor_off_board' || stop === 'ancestor_board_unknown')) {
      res.known_source_out_of_reach = 'ancestor_walk_' + stop;
    }
    return res;
  };

  if (!input.board.ok) {
    return finish('walk_board_unreadable', String(input.board.message).slice(0, 300));
  }

  // The starting card's own parent: same defs (board + its card-scoped groups), same collect-all rule.
  const startGroups = boardGroups.concat(startInc.customFieldGroups || []);
  const startFields = boardFields.concat(startInc.customFields || []);
  const startValues = (startInc.customFieldValues || []).filter((x: any) => x && String(x.cardId) === cardId);
  const startParents = distinctValues(startGroups, startFields, startValues, 'Relations', 'parent_card');
  res.start_parents = startParents;
  if (startParents.length > 1) {
    return finish(
      'ancestor_parent_ambiguous',
      'start card ' + cardId + ' carries ' + startParents.length + ' distinct parent_card values: ' + startParents.join(' | '),
    );
  }

  let next = startParents[0] || '';
  for (;;) {
    // Plan Hop: decide whether one more fetch is warranted, and name why not.
    if (!next) return finish('chain_exhausted_no_project_id');
    if (res.visited.indexOf(next) !== -1) {
      return finish('ancestor_cycle', 'card ' + next + ' was already visited: ' + res.visited.join(' -> '));
    }
    if (res.hops >= cap) return finish('depth_cap_reached');

    // Record Hop.
    const target = next;
    next = '';
    const fetched = await input.fetchCard(target);
    res.visited.push(target);
    res.chain.push(target);
    res.hops += 1;
    if (!fetched.ok) return finish('ancestor_unreadable', String(fetched.message).slice(0, 300));

    const { card, included: inc } = unwrapCard(fetched.response);
    const groups = boardGroups.concat(inc.customFieldGroups || []);
    const fields = boardFields.concat(inc.customFields || []);
    const values = (inc.customFieldValues || []).filter((x: any) => x && String(x.cardId) === target);
    if (!groups.length || !fields.length) return finish('no_field_definitions');

    const pids = distinctValues(groups, fields, values, 'Metadata', 'project_id');
    const parents = distinctValues(groups, fields, values, 'Relations', 'parent_card');

    if (pids.length > 1) {
      return finish(
        'ancestor_conflict',
        'ancestor ' + target + ' carries ' + pids.length + ' distinct project_id values: ' + pids.join(' | '),
      );
    }
    if (pids.length === 1) {
      const cand = pids[0];
      if (cand === PLACEHOLDER_PROJECT_ID) {
        res.rejected.push({ source: 'ancestor_walk@hop' + res.hops, card_id: target, value: cand, why: 'placeholder_sentinel' });
        return finish('ancestor_value_refused');
      }
      if (!PROJECT_UUID_RE.test(cand)) {
        // Refuse and STOP: walking past it would answer with a different project's id.
        res.rejected.push({ source: 'ancestor_walk@hop' + res.hops, card_id: target, value: cand, why: 'not_uuid_shaped' });
        return finish('ancestor_value_refused');
      }
      res.resolved = cand;
      res.source = 'ancestor_walk';
      return finish('resolved');
    }

    // No readable project_id: only now does an off-board ancestor matter (its value is
    // stored against field defs this walk never fetched, so empty != absent).
    const ancBoardId = String((card && card.boardId) || '');
    if (refBoardId && ancBoardId !== refBoardId) {
      return finish(
        ancBoardId ? 'ancestor_off_board' : 'ancestor_board_unknown',
        'ancestor ' + target + ' is on board ' + (ancBoardId || '(none reported)') +
          ', not the starting board ' + refBoardId +
          ' — its Metadata.project_id is stored against field definitions this walk never fetched, so it is UNREADABLE, not absent',
      );
    }
    if (parents.length > 1) {
      return finish(
        'ancestor_parent_ambiguous',
        'ancestor ' + target + ' carries ' + parents.length + ' distinct parent_card values: ' + parents.join(' | '),
      );
    }
    next = parents[0] || '';
  }
}
