// Which wafuu spot illustration to crown the session-complete card with.
//
// The completion card is the app's highest-emotion beat (and the thing users
// screenshot to share), so it should not always show the same picture. A
// flawless run earns the special open-eye daruma (両目 = 開眼, "wish
// fulfilled"); every other finish rotates deterministically through a small
// pool of celebratory motifs, keyed off the session counter so the picture is
// stable while the card is on screen but varies from one session to the next.
//
// Pure + deterministic (no Math.random) so it is unit-testable and never
// flickers on re-render. The DrillPanel maps the returned key to a component;
// keeping this layer key-only keeps the domain free of React/JSX imports.

export type DoneSpotKey =
  | "daruma"
  | "sprout"
  | "omamori"
  | "lantern"
  | "torii"
  | "teacup"
  | "target";

// The rotating pool for ordinary finishes. "daruma" is deliberately absent:
// the open-eye daruma is reserved for a perfect (100%) run so it keeps meaning.
export const DONE_SPOT_POOL: DoneSpotKey[] = [
  "sprout",
  "omamori",
  "lantern",
  "torii",
  "teacup",
  "target"
];

export function pickDoneSpot(seed: number, isPerfect: boolean): DoneSpotKey {
  if (isPerfect) {
    return "daruma";
  }
  const size = DONE_SPOT_POOL.length;
  // Euclidean modulo so negative seeds still land on a valid index.
  const index = ((Math.trunc(seed) % size) + size) % size;
  return DONE_SPOT_POOL[index];
}
