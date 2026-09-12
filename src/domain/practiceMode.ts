import type { LevelRange } from "./levelRange";

// The practice modes (challenge entry points). Lives in the domain layer so
// the hook, the picker, and i18n can all share one definition without a
// cross-layer cycle (usePracticeSession re-exports it for back-compat).
export type PracticeMode =
  | "basic"
  | "cloze"
  | "daily"
  | "kana"
  | "starter"
  | "pattern"
  | "exam"
  | "review"
  | "vocab"
  | "bookmarks";

// The 備考 exam presets: exam mode pinned to a specific level band, surfaced
// as first-class picker rows. They are i18n / mode-count keys, not modes.
type ExamPresetId = "examN1" | "examN2" | "examN3" | "examN4";

// The key used for mode copy (i18n modeOptions) and mode counts: a base mode,
// or one of the exam presets.
export type ModeCopyKey = PracticeMode | ExamPresetId;

// THE one source linking a level range to its 備考 preset id. The picker rows,
// the active-copy-key logic, and the i18n modeOptions keys all derive from
// this — adding a band (e.g. a 5th 備考) is a single edit here.
const EXAM_PRESET_BY_RANGE: Partial<Record<LevelRange, ExamPresetId>> = {
  n1n2: "examN1",
  n2n3: "examN2",
  n3n4: "examN3",
  n4n5: "examN4"
};

// The copy / count key for exam mode at a given range. "all" (and any range
// with no preset) falls back to the generic 綜合考題庫 "exam" key.
export function examPresetForRange(range: LevelRange): ModeCopyKey {
  return EXAM_PRESET_BY_RANGE[range] ?? "exam";
}

// One picker card: a copy/count key plus the mode (and pinned range) it
// applies. Lives here (not in the picker component) so the grouping and
// order are domain data the tests can pin.
export type ModePreset = { id: ModeCopyKey; mode: PracticeMode; levelRange?: LevelRange };

export type ModeGroupId = "dailyGroup" | "examGroup" | "focusedGroup";

// The challenge picker's three sections (2026-07 IA pass): the daily loop
// (practice + review + bookmarks) first, the exam bank band next, and the
// focused single-skill drills last — 基礎變化 deliberately sits at the tail
// instead of its old slot #2.
export const MODE_GROUPS: Array<{ id: ModeGroupId; presets: ModePreset[] }> = [
  {
    id: "dailyGroup",
    presets: [
      { id: "daily", mode: "daily" },
      { id: "review", mode: "review" },
      { id: "bookmarks", mode: "bookmarks" }
    ]
  },
  {
    id: "examGroup",
    presets: [
      { id: "exam", mode: "exam", levelRange: "all" },
      ...(Object.entries(EXAM_PRESET_BY_RANGE) as [LevelRange, ExamPresetId][]).map(
        ([levelRange, id]): ModePreset => ({ id, mode: "exam", levelRange })
      )
    ]
  },
  {
    id: "focusedGroup",
    presets: [
      { id: "pattern", mode: "pattern" },
      { id: "cloze", mode: "cloze" },
      { id: "vocab", mode: "vocab" },
      { id: "basic", mode: "basic" }
    ]
  }
];
