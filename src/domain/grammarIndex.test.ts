import { describe, expect, it } from "vitest";
import {
  getPatternsByLevel,
  getPatternsGroupedByLevel,
  getPatternById,
  findPatternBySurface,
  searchPatterns,
  getRelatedPatterns,
  getPatternsWithMediaExamples,
  getPatternsByImportance,
  getLevelSummary,
} from "./grammarIndex";
import { grammarPatterns } from "./grammarDatabase";

describe("getPatternsByLevel", () => {
  it("returns 15 patterns for N5 sorted by id", () => {
    const patterns = getPatternsByLevel("N5");
    expect(patterns).toHaveLength(15);
    // verify sorted by id
    const ids = patterns.map((p) => p.id);
    expect(ids).toEqual([...ids].sort());
  });

  it("returns 15 patterns for N4 sorted by id", () => {
    const patterns = getPatternsByLevel("N4");
    expect(patterns).toHaveLength(15);
    const ids = patterns.map((p) => p.id);
    expect(ids).toEqual([...ids].sort());
  });

  it("returns 19 patterns for N2 sorted by id", () => {
    const patterns = getPatternsByLevel("N2");
    expect(patterns).toHaveLength(19);
    const ids = patterns.map((p) => p.id);
    // production code sorts with localeCompare, verify order is non-decreasing
    for (let i = 1; i < ids.length; i++) {
      expect(ids[i - 1].localeCompare(ids[i])).toBeLessThanOrEqual(0);
    }
  });

  it("returns an empty array for N3 (no data yet)", () => {
    expect(getPatternsByLevel("N3")).toHaveLength(0);
  });

  it("returns an empty array for N1 (no data yet)", () => {
    expect(getPatternsByLevel("N1")).toHaveLength(0);
  });
});

describe("getPatternsGroupedByLevel", () => {
  it("groups patterns by JLPT level with correct counts", () => {
    const grouped = getPatternsGroupedByLevel();
    expect(grouped.N5).toHaveLength(15);
    expect(grouped.N4).toHaveLength(15);
    expect(grouped.N2).toHaveLength(19);
    expect(grouped.N3).toHaveLength(0);
    expect(grouped.N1).toHaveLength(0);
  });

  it("sorts patterns within each group by id", () => {
    const grouped = getPatternsGroupedByLevel();
    for (const level of ["N5", "N4", "N2"] as const) {
      const ids = grouped[level].map((p) => p.id);
      for (let i = 1; i < ids.length; i++) {
        expect(ids[i - 1].localeCompare(ids[i])).toBeLessThanOrEqual(0);
      }
    }
  });
});

describe("getPatternById", () => {
  it("returns the correct pattern for a known id", () => {
    const pattern = getPatternById("te-mo-ii");
    expect(pattern).toBeDefined();
    expect(pattern?.pattern).toBe("〜てもいい");
    expect(pattern?.level).toBe("N5");
  });

  it("returns undefined for a non-existent id", () => {
    expect(getPatternById("non-existent")).toBeUndefined();
  });
});

describe("findPatternBySurface", () => {
  it("finds a pattern by exact surface match", () => {
    const pattern = findPatternBySurface("〜なければならない");
    expect(pattern).toBeDefined();
    expect(pattern?.id).toBe("nakereba-naranai");
  });

  it("finds a pattern by surface with 〜 prefix stripped", () => {
    // "なければならない" without 〜 should match "〜なければならない"
    const pattern = findPatternBySurface("なければならない");
    expect(pattern).toBeDefined();
    expect(pattern?.id).toBe("nakereba-naranai");
  });

  it("finds a pattern by surface with ～ prefix stripped (full-width tilde)", () => {
    const pattern = findPatternBySurface("～なければならない");
    expect(pattern).toBeDefined();
    expect(pattern?.id).toBe("nakereba-naranai");
  });

  it("returns undefined for a surface that does not exist", () => {
    expect(findPatternBySurface("完全不存在的文型")).toBeUndefined();
  });
});

describe("searchPatterns", () => {
  it("returns an empty array for an empty query", () => {
    expect(searchPatterns("")).toHaveLength(0);
    expect(searchPatterns("   ")).toHaveLength(0);
  });

  it("matches patterns by pattern string (keyword in 〜てもいい)", () => {
    const results = searchPatterns("てもいい");
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results.some((p) => p.id === "te-mo-ii")).toBe(true);
  });

  it("matches patterns by meaningZh", () => {
    const results = searchPatterns("不可以");
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results.some((p) => p.id === "te-wa-ikenai")).toBe(true);
  });

  it("matches patterns by meaningJa", () => {
    const results = searchPatterns("許可");
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results.some((p) => p.id === "te-mo-ii")).toBe(true);
  });

  it("matches patterns by id", () => {
    const results = searchPatterns("te-mo");
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results.some((p) => p.id === "te-mo-ii")).toBe(true);
  });

  it("matches patterns by tags", () => {
    // "禁止" appears as a tag on te-wa-ikenai
    const results = searchPatterns("禁止");
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results.some((p) => p.id === "te-wa-ikenai")).toBe(true);
  });

  it("is case-insensitive", () => {
    const lower = searchPatterns("te-mo-ii");
    const upper = searchPatterns("TE-MO-II");
    expect(lower).toEqual(upper);
  });

  it("returns all matching patterns across levels", () => {
    // "逆接" appears in tags across N2 and N4
    const results = searchPatterns("逆接");
    expect(results.length).toBeGreaterThanOrEqual(2);
  });
});

describe("getRelatedPatterns", () => {
  it("returns related patterns for a pattern with known relations", () => {
    const related = getRelatedPatterns("te-mo-ii");
    expect(related.length).toBeGreaterThanOrEqual(1);
    expect(related.some((p) => p.id === "te-wa-ikenai")).toBe(true);
  });

  it("returns an empty array for a pattern with no relatedPatternIds", () => {
    expect(getRelatedPatterns("to-omou")).toHaveLength(0);
  });

  it("returns an empty array for an unknown id", () => {
    expect(getRelatedPatterns("non-existent-id")).toHaveLength(0);
  });

  it("silently drops related ids that do not exist in the database", () => {
    // Collect all existing IDs
    const existingIds = new Set(grammarPatterns.map((p) => p.id));
    // Verify that every relatedPatternId points to an existing pattern
    for (const pattern of grammarPatterns) {
      const related = getRelatedPatterns(pattern.id);
      for (const r of related) {
        expect(existingIds.has(r.id)).toBe(true);
      }
    }
  });
});

describe("getPatternsWithMediaExamples", () => {
  it("returns only patterns that have mediaExamples", () => {
    const results = getPatternsWithMediaExamples();
    expect(results.length).toBeGreaterThan(0);
    for (const p of results) {
      expect(p.mediaExamples.length).toBeGreaterThan(0);
    }
  });

  it("filters by level when specified", () => {
    const n2Results = getPatternsWithMediaExamples("N2");
    for (const p of n2Results) {
      expect(p.level).toBe("N2");
      expect(p.mediaExamples.length).toBeGreaterThan(0);
    }
  });

  it("returns no N5 patterns with media examples (none exist)", () => {
    expect(getPatternsWithMediaExamples("N5")).toHaveLength(0);
  });

  it("returns the same as no filter when N2 is the only level with media examples", () => {
    const all = getPatternsWithMediaExamples();
    const n2 = getPatternsWithMediaExamples("N2");
    // N2 is the only level that has mediaExamples
    expect(all).toEqual(n2);
  });
});

describe("getPatternsByImportance", () => {
  it("returns all patterns sorted by importance order (must_know first)", () => {
    const results = getPatternsByImportance();
    const order = ["must_know", "high_frequency", "understand", "reference"];
    const importanceOrder = results.map((p) => p.importance);
    // Verify that the order is non-decreasing per the importance ranking
    for (let i = 1; i < importanceOrder.length; i++) {
      const prevIdx = order.indexOf(importanceOrder[i - 1]);
      const currIdx = order.indexOf(importanceOrder[i]);
      expect(currIdx).toBeGreaterThanOrEqual(prevIdx);
    }
  });

  it("filters by level when specified", () => {
    const results = getPatternsByImportance("N5");
    for (const p of results) {
      expect(p.level).toBe("N5");
    }
  });

  it("returns only N5 patterns sorted by importance", () => {
    const n5 = getPatternsByImportance("N5");
    const order = ["must_know", "high_frequency", "understand", "reference"];
    const importanceOrder = n5.map((p) => p.importance);
    for (let i = 1; i < importanceOrder.length; i++) {
      const prevIdx = order.indexOf(importanceOrder[i - 1]);
      const currIdx = order.indexOf(importanceOrder[i]);
      expect(currIdx).toBeGreaterThanOrEqual(prevIdx);
    }
  });

  it("returns the full list (same length as grammarPatterns) when no level filter", () => {
    expect(getPatternsByImportance()).toHaveLength(grammarPatterns.length);
  });
});

describe("getLevelSummary", () => {
  it("returns correct totals per level", () => {
    const summary = getLevelSummary();
    expect(summary.N5.total).toBe(15);
    expect(summary.N4.total).toBe(15);
    expect(summary.N2.total).toBe(19);
    expect(summary.N3.total).toBe(0);
    expect(summary.N1.total).toBe(0);
  });

  it("returns correct mustKnow counts", () => {
    const summary = getLevelSummary();
    // N5 must_know count: all N5 patterns with importance "must_know"
    const n5MustKnow = grammarPatterns.filter(
      (p) => p.level === "N5" && p.importance === "must_know"
    ).length;
    const n4MustKnow = grammarPatterns.filter(
      (p) => p.level === "N4" && p.importance === "must_know"
    ).length;
    expect(summary.N5.mustKnow).toBe(n5MustKnow);
    expect(summary.N4.mustKnow).toBe(n4MustKnow);
  });

  it("returns correct highFrequency counts", () => {
    const summary = getLevelSummary();
    const n5High = grammarPatterns.filter(
      (p) => p.level === "N5" && p.importance === "high_frequency"
    ).length;
    expect(summary.N5.highFrequency).toBe(n5High);
  });

  it("returns correct withMediaExamples counts", () => {
    const summary = getLevelSummary();
    // Only N2 has media examples in the current data
    expect(summary.N5.withMediaExamples).toBe(0);
    expect(summary.N4.withMediaExamples).toBe(0);
    expect(summary.N2.withMediaExamples).toBeGreaterThan(0);
    // Verify count matches reality
    const n2Media = grammarPatterns.filter(
      (p) => p.level === "N2" && p.mediaExamples.length > 0
    ).length;
    expect(summary.N2.withMediaExamples).toBe(n2Media);
  });

  it("all counts match live filtering of grammarPatterns", () => {
    const summary = getLevelSummary();
    for (const level of ["N5", "N4", "N3", "N2", "N1"] as const) {
      const live = grammarPatterns.filter((p) => p.level === level);
      expect(summary[level].total).toBe(live.length);
      expect(summary[level].mustKnow).toBe(
        live.filter((p) => p.importance === "must_know").length
      );
      expect(summary[level].highFrequency).toBe(
        live.filter((p) => p.importance === "high_frequency").length
      );
      expect(summary[level].withMediaExamples).toBe(
        live.filter((p) => p.mediaExamples.length > 0).length
      );
    }
  });
});
