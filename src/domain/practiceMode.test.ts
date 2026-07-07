import { describe, expect, it } from "vitest";
import { MODE_GROUPS } from "./practiceMode";

// #566 (challenge-panel IA): the 練習模式 list regrouped into three sections
// so review/bookmarks stop sinking below the fold and 基礎變化 stops
// occupying slot #2. The grouping is domain data so this test can pin the
// order without rendering the picker.
describe("challenge mode groups", () => {
  it("keeps the three sections in daily → exam → focused order", () => {
    expect(MODE_GROUPS.map((group) => group.id)).toEqual([
      "dailyGroup",
      "examGroup",
      "focusedGroup"
    ]);
  });

  it("puts review right after daily, and demotes basic to the tail", () => {
    const [daily, exam, focused] = MODE_GROUPS;
    expect(daily.presets.map((p) => p.id)).toEqual(["daily", "review", "bookmarks"]);
    expect(exam.presets.map((p) => p.id)).toEqual([
      "exam",
      "examN1",
      "examN2",
      "examN3",
      "examN4"
    ]);
    expect(focused.presets.map((p) => p.id)).toEqual(["pattern", "cloze", "vocab", "basic"]);
  });

  it("preserves all twelve cards exactly once (no card dropped by the regroup)", () => {
    const ids = MODE_GROUPS.flatMap((group) => group.presets.map((p) => p.id));
    expect(ids).toHaveLength(12);
    expect(new Set(ids).size).toBe(12);
  });

  it("keeps every exam preset pinned to its level range", () => {
    const exam = MODE_GROUPS.find((g) => g.id === "examGroup")!;
    expect(exam.presets.map((p) => p.levelRange)).toEqual(["all", "n1n2", "n2n3", "n3n4", "n4n5"]);
  });
});
