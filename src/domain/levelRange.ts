import type { JlptLevel } from "./types";

// Practice "level range" presets. A learner studying for N1 typically
// wants to drill N1+N2; an N2 candidate wants N2+N3. This is a POOL
// FILTER only -- the level never appears on the question itself (no
// visible promptLabel); it just narrows which bank items are in play.
// "all" keeps each pool's own default behaviour (no level narrowing).
export type LevelRange = "all" | "n1n2" | "n2n3";

// Order shown in the picker (全部 first, then the two target bands).
export const LEVEL_RANGE_OPTIONS: LevelRange[] = ["all", "n1n2", "n2n3"];

const RANGE_LEVELS: Record<Exclude<LevelRange, "all">, JlptLevel[]> = {
  n1n2: ["N1", "N2"],
  n2n3: ["N2", "N3"]
};

// The JLPT levels a range covers, or null for "all" (= no filter; let the
// pool keep its default mix).
export function levelsForRange(range: LevelRange): JlptLevel[] | null {
  return range === "all" ? null : RANGE_LEVELS[range];
}
