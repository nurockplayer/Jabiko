import { describe, expect, it } from "vitest";
import { levelsForRange, LEVEL_RANGE_OPTIONS, VOCAB_LEVEL_RANGE_OPTIONS } from "./levelRange";
import { buildExamQuestionPool } from "./examBlocks";

describe("levelsForRange", () => {
  it("maps presets to JLPT levels and null for all", () => {
    expect(levelsForRange("all")).toBeNull();
    expect(levelsForRange("n1n2")).toEqual(["N1", "N2"]);
    expect(levelsForRange("n2n3")).toEqual(["N2", "N3"]);
    expect(levelsForRange("n4n5")).toEqual(["N4", "N5"]);
  });

  it("offers 全部 first, then the target bands", () => {
    expect(LEVEL_RANGE_OPTIONS[0]).toBe("all");
    expect(LEVEL_RANGE_OPTIONS).toEqual(["all", "n1n2", "n2n3", "n4n5"]);
  });

  it("excludes n4n5 from the vocab picker (no N4/N5 jlpt words)", () => {
    expect(VOCAB_LEVEL_RANGE_OPTIONS).toEqual(["all", "n1n2", "n2n3"]);
  });
});

describe("buildExamQuestionPool level range", () => {
  it("N1+N2 keeps only N1/N2 items (no N3)", () => {
    const pool = buildExamQuestionPool(["N1", "N2"]);
    expect(pool.length).toBeGreaterThan(0);
    expect(pool.every((q) => q.vocabulary.level === "N1" || q.vocabulary.level === "N2")).toBe(true);
    expect(pool.some((q) => q.vocabulary.level === "N3")).toBe(false);
  });

  it("N2+N3 includes the full N3 set and excludes N1", () => {
    const pool = buildExamQuestionPool(["N2", "N3"]);
    expect(pool.every((q) => q.vocabulary.level === "N2" || q.vocabulary.level === "N3")).toBe(true);
    expect(pool.some((q) => q.vocabulary.level === "N1")).toBe(false);
    // The range pulls the FULL N3 set, more than the "all" pool's warm-up cap.
    const n3InRange = pool.filter((q) => q.vocabulary.level === "N3").length;
    const n3InAll = buildExamQuestionPool().filter((q) => q.vocabulary.level === "N3").length;
    expect(n3InRange).toBeGreaterThan(n3InAll);
  });

  it("does not regress the single-level and all behaviour", () => {
    expect(buildExamQuestionPool("N1").every((q) => q.vocabulary.level === "N1")).toBe(true);
    const all = buildExamQuestionPool();
    expect(all.some((q) => q.vocabulary.level === "N1")).toBe(true);
    expect(all.some((q) => q.vocabulary.level === "N2")).toBe(true);
    // "all" trims N3 to a small warm-up subset.
    expect(all.filter((q) => q.vocabulary.level === "N3").length).toBeLessThanOrEqual(6);
  });
});
