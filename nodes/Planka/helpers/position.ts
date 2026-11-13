/**
 * Default `position` for a card MOVE (PATCH /api/cards/:id with `listId`)
 * when the caller supplied none.
 *
 * Why not a constant (the previous default was `1`, "top of list"):
 * Planka stores positions as `double precision` with a floor of 0 and, on any
 * clash, runs `insertToPositionables` (server/api/helpers/cards/update-one.js),
 * which issues one awaited UPDATE plus one socket broadcast per repositioned
 * card. Inserting at the top of a list halves the headroom below the first card
 * on every move, so after ~log2(minPosition / 0.125) moves the gap is gone and
 * the WHOLE list is renumbered. On the ~768-card DONE list that took longer
 * than the ingress's 60s `proxy_read_timeout` (nginx 504 on
 * `AA Pattern - QA Evaluate :: Move Card`). Any top-of-list policy
 * (constant 1, half the current minimum, ...) shares that bound; running
 * Planka's helper over 300 moves gave ~15k UPDATEs for both.
 *
 * What we do instead: place the card at the BOTTOM, using the wall clock in ms.
 * That is strictly above every position Planka itself hands out (the client
 * appends at last + 65536 and the server's GAP is 2^14, so a list's positions
 * stay ~10^7 at most, versus Date.now() ~ 1.8 x 10^12) and far below Planka's
 * MAX_POSITION (2^50, ~35,000 years of headroom), so the insert never clashes
 * and costs zero repositions without reading the list first. It is monotonic,
 * so "later move = lower in the list". Nothing in the conveyor depends on card
 * order within a list (see the PR for the audit); only the board UI renders it.
 *
 * `lastIssued` keeps positions strictly increasing within this process even
 * when two moves fall in the same millisecond or the clock steps backwards.
 * Two processes colliding in the same ms cost Planka a single small
 * reposition, not a renumber.
 */
let lastIssued = 0;

export function nextDefaultCardPosition(now: number = Date.now()): number {
  const candidate = Math.max(now, lastIssued + 1);
  lastIssued = candidate;
  return candidate;
}

/** Test-only: forget the last issued position. */
export function resetDefaultCardPositionForTests(): void {
  lastIssued = 0;
}
