import { describe, expect, it } from "vitest";
import {
  kanjiDefaultLevel,
  levelsForRange,
  LEVEL_RANGE_OPTIONS,
  VOCAB_LEVEL_RANGE_OPTIONS
} from "./levelRange";
import { buildExamQuestionPool } from "./examBlocks";

// #608 P1: the kanji quick-reference defaults to the learner's band instead
// of "all" (671 entries at once). A range maps to its HARDER level (the exam
// they study toward); starter learners get N5; no preference keeps "all".
describe("kanjiDefaultLevel", () => {
  it("maps each band to its harder level", () => {
    expect(kanjiDefaultLevel("n1n2")).toBe("N1");
    expect(kanjiDefaultLevel("n2n3")).toBe("N2");
    expect(kanjiDefaultLevel("n3n4")).toBe("N3");
    expect(kanjiDefaultLevel("n4n5")).toBe("N4");
    expect(kanjiDefaultLevel("starter")).toBe("N5");
  });

  it("keeps 全部 for the all band and for learners with no preference", () => {
    expect(kanjiDefaultLevel("all")).toBe("all");
    expect(kanjiDefaultLevel(null)).toBe("all");
  });
});

describe("levelsForRange", () => {
  it("maps presets to JLPT levels and null for all", () => {
    expect(levelsForRange("all")).toBeNull();
    expect(levelsForRange("n1n2")).toEqual(["N1", "N2"]);
    expect(levelsForRange("n2n3")).toEqual(["N2", "N3"]);
    expect(levelsForRange("n3n4")).toEqual(["N3", "N4"]);
    expect(levelsForRange("n4n5")).toEqual(["N4", "N5"]);
  });

  it("offers 全部 first, then the target bands high→low, then the starter band (#532)", () => {
    expect(LEVEL_RANGE_OPTIONS[0]).toBe("all");
    expect(LEVEL_RANGE_OPTIONS).toEqual(["all", "n1n2", "n2n3", "n3n4", "n4n5", "starter"]);
  });

  it("maps the starter band to the gentlest exam pool (N5 only)", () => {
    // 完全新手 shouldn't be in exam mode at all, but if they wander in, the
    // pool must be the shallowest -- never the N1/N2 default.
    expect(levelsForRange("starter")).toEqual(["N5"]);
  });

  it("excludes n4n5 and starter from the vocab picker (no N4/N5 jlpt words)", () => {
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

  it("N3+N4 keeps only N3/N4 items (the new N3 備考 band)", () => {
    const pool = buildExamQuestionPool(["N3", "N4"]);
    expect(pool.length).toBeGreaterThan(0);
    expect(pool.every((q) => q.vocabulary.level === "N3" || q.vocabulary.level === "N4")).toBe(true);
    expect(pool.some((q) => q.vocabulary.level === "N3")).toBe(true);
    expect(pool.some((q) => q.vocabulary.level === "N4")).toBe(true);
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
