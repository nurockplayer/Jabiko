import type { JlptLevel } from "./types";

// Practice "level range" presets. A learner studying for N1 typically
// wants to drill N1+N2; an N2 candidate wants N2+N3. This is a POOL
// FILTER only -- the level never appears on the question itself (no
// visible promptLabel); it just narrows which bank items are in play.
// "all" keeps each pool's own default behaviour (no level narrowing).
//
// "starter" (#532) is the 完全新手 band from the onboarding card: the daily
// session serves 入門 content (kana + starter vocab) instead of exam items,
// and any exam-pool consumer falls back to the gentlest N5-only pool.
export type LevelRange = "all" | "n1n2" | "n2n3" | "n3n4" | "n4n5" | "starter";

// Order shown in the picker (全部 first, then the target bands high→low).
export const LEVEL_RANGE_OPTIONS: LevelRange[] = ["all", "n1n2", "n2n3", "n3n4", "n4n5", "starter"];

// Vocab (単字讀音) only has N1/N2 jlpt entries, so its segmented picker must
// NOT offer the lower bands (they would filter jlptVocabulary down to an
// empty pool). Exam reaches N3/N4/N5 via the examN3 / examN4 mode presets,
// not this picker.
export const VOCAB_LEVEL_RANGE_OPTIONS: LevelRange[] = ["all", "n1n2", "n2n3"];

const RANGE_LEVELS: Record<Exclude<LevelRange, "all">, JlptLevel[]> = {
  n1n2: ["N1", "N2"],
  n2n3: ["N2", "N3"],
  n3n4: ["N3", "N4"],
  n4n5: ["N4", "N5"],
  // 完全新手 shouldn't meet the exam pool at all (daily serves 入門 content
  // instead), but any consumer that does ask gets the shallowest bank.
  starter: ["N5"]
};

// The JLPT levels a range covers, or null for "all" (= no filter; let the
// pool keep its default mix).
export function levelsForRange(range: LevelRange): JlptLevel[] | null {
  return range === "all" ? null : RANGE_LEVELS[range];
}
