import { describe, expect, it } from "vitest";
import {
  getMockExamBlueprint,
  N1_BLUEPRINT,
  N2_BLUEPRINT,
  N3_BLUEPRINT,
  N4_BLUEPRINT,
  N5_BLUEPRINT,
  sectionSubtitle,
  type MockExamBlueprint,
  type MockExamLevel,
} from "./mockExam";

/** Compact (id, promptLabel, targetCount) projection used to pin the tables. */
function sectionTuples(bp: MockExamBlueprint): Array<[string, string, number]> {
  return bp.sections.map((s) => [s.id, s.promptLabel, s.targetCount]);
}

// 模擬考 is now a section picker built on these blueprints (the timed
// full-paper composer was removed). These tests pin the section metadata:
// the per-回 target totals and that getMockExamBlueprint returns the
// right blueprint per level.
describe("getMockExamBlueprint", () => {
  it("returns the N2 blueprint with the official 73-question total", () => {
    const bp = getMockExamBlueprint("N2");
    const total = bp.sections.reduce((sum, s) => sum + s.targetCount, 0);
    expect(bp).toBe(N2_BLUEPRINT);
    expect(total).toBe(73);
  });

  it("returns the N1 blueprint with the official 66-question total", () => {
    const bp = getMockExamBlueprint("N1");
    const total = bp.sections.reduce((sum, s) => sum + s.targetCount, 0);
    expect(bp).toBe(N1_BLUEPRINT);
    expect(total).toBe(66);
  });

  it("returns the N3 blueprint with the official 74-question total", () => {
    const bp = getMockExamBlueprint("N3");
    const total = bp.sections.reduce((sum, s) => sum + s.targetCount, 0);
    expect(bp).toBe(N3_BLUEPRINT);
    expect(total).toBe(74);
    // N3 has NO 語形成 / 統合理解 / 主張理解 sections (those are N1/N2 only);
    // its long reading is plain 内容理解（長文）.
    const ids = bp.sections.map((s) => s.id);
    expect(ids).not.toContain("go-keisei");
    expect(ids).not.toContain("togo");
    expect(ids).not.toContain("shucho");
    expect(ids).toContain("dokkai-long");
  });

  it("gives every section a non-empty promptLabel and stable id", () => {
    for (const bp of [N1_BLUEPRINT, N2_BLUEPRINT, N3_BLUEPRINT]) {
      const ids = bp.sections.map((s) => s.id);
      expect(new Set(ids).size).toBe(ids.length); // ids unique within a level
      for (const section of bp.sections) {
        expect(section.promptLabel.length).toBeGreaterThan(0);
        expect(section.labelJa.length).toBeGreaterThan(0);
        expect(section.targetCount).toBeGreaterThan(0);
      }
    }
  });

  it("returns the English subtitle for en locale and zh subtitle for zh-Hant", () => {
    for (const bp of [N1_BLUEPRINT, N2_BLUEPRINT, N3_BLUEPRINT]) {
      for (const section of bp.sections) {
        // The English subtitle should be truthy and Han-free (as per original intent)
        expect(section.labelEn).toBeTruthy();
        expect(/[㐀-鿿]/.test(section.labelEn)).toBe(false);
        // en locale returns English subtitle
        expect(sectionSubtitle(section, "en")).toBe(section.labelEn);
        // zh-Hant returns the Chinese subtitle
        expect(sectionSubtitle(section, "zh-Hant")).toBe(section.labelZh);
      }
    }
  });

  it("returns the mid-length reading subtitle for zh-Hant across N1-N5 (#804)", () => {
    for (const level of ["N1", "N2", "N3", "N4", "N5"] as const) {
      const section = getMockExamBlueprint(level).sections.find(({ id }) => id === "dokkai-mid");
      expect(section).toBeDefined();
      if (!section) {
        throw new Error(`Missing dokkai-mid section for ${level}`);
      }

      const subtitle = sectionSubtitle(section, "zh-Hant");
      expect(subtitle).toBe("中篇閱讀");
      expect(subtitle).not.toBe("中文閱讀");
    }
  });
});

describe("N4 / N5 blueprints (#702)", () => {
  it("getMockExamBlueprint returns every one of the five levels with the right level tag", () => {
    for (const level of ["N1", "N2", "N3", "N4", "N5"] as const) {
      const bp = getMockExamBlueprint(level);
      expect(bp.level).toBe(level);
      expect(bp.sections.length).toBeGreaterThan(0);
    }
  });

  it("matches the N4 section table exactly", () => {
    expect(sectionTuples(N4_BLUEPRINT)).toEqual([
      ["kanji-yomi", "漢字読み", 7],
      ["hyoki", "表記", 5],
      ["bunmyaku-kitei", "詞彙填空", 8],
      ["iikae-ruigi", "類義替換", 4],
      ["yohou", "詞彙用法", 4],
      ["bun-bunpou-1", "文法形式選擇", 13],
      ["bun-bunpou-2", "語順組合", 4],
      ["bunshou-bunpou", "文章脈絡", 4],
      ["dokkai-short", "内容理解（短文）", 3],
      ["dokkai-mid", "内容理解（中文）", 3],
      ["joho-kensaku", "情報検索", 2],
    ]);
  });

  it("matches the N5 section table exactly", () => {
    expect(sectionTuples(N5_BLUEPRINT)).toEqual([
      ["kanji-yomi", "漢字読み", 7],
      ["hyoki", "表記", 5],
      ["bunmyaku-kitei", "詞彙填空", 6],
      ["iikae-ruigi", "類義替換", 3],
      ["bun-bunpou-1", "文法形式選擇", 9],
      ["bun-bunpou-2", "語順組合", 4],
      ["bunshou-bunpou", "文章脈絡", 4],
      ["dokkai-short", "内容理解（短文）", 2],
      ["dokkai-mid", "内容理解（中文）", 2],
      ["joho-kensaku", "情報検索", 1],
    ]);
  });

  it("fixes totalMinutes at N4 80 and N5 60", () => {
    expect(N4_BLUEPRINT.totalMinutes).toBe(80);
    expect(N5_BLUEPRINT.totalMinutes).toBe(60);
  });

  it("forbids N5 詞彙用法 and both N4/N5 語形成 / 長文 / 統合理解 / 主張理解", () => {
    const n5Ids = N5_BLUEPRINT.sections.map((s) => s.id);
    const n4Ids = N4_BLUEPRINT.sections.map((s) => s.id);
    const n4Labels = N4_BLUEPRINT.sections.map((s) => s.promptLabel);
    const n5Labels = N5_BLUEPRINT.sections.map((s) => s.promptLabel);

    expect(n5Ids).not.toContain("yohou"); // N5 無詞彙用法
    for (const ids of [n4Ids, n5Ids]) {
      expect(ids).not.toContain("go-keisei"); // 語形成
      expect(ids).not.toContain("dokkai-long"); // 内容理解（長文）
      expect(ids).not.toContain("togo"); // 統合理解
      expect(ids).not.toContain("shucho"); // 主張理解
    }
    expect(n4Labels).not.toContain("内容理解（長文）");
    expect(n5Labels).not.toContain("内容理解（長文）");
  });

  it("keeps N1–N3 blueprints byte-identical to the existing baseline", () => {
    expect(getMockExamBlueprint("N1")).toBe(N1_BLUEPRINT);
    expect(getMockExamBlueprint("N2")).toBe(N2_BLUEPRINT);
    expect(getMockExamBlueprint("N3")).toBe(N3_BLUEPRINT);
  });

  it("never falls back to another level for unknown/unsafe levels", () => {
    const seen = new Set<MockExamLevel>();
    const levels: MockExamLevel[] = ["N1", "N2", "N3", "N4", "N5"];
    for (const level of levels) {
      const bp = getMockExamBlueprint(level);
      expect(bp.level).toBe(level);
      expect(seen.has(bp.level)).toBe(false);
      seen.add(bp.level);
    }
    // Runtime junk is rejected at the type boundary, but the runtime lookup
    // must also not silently map garbage to a valid level.
    expect(() => getMockExamBlueprint("N6" as MockExamLevel)).toThrow();
    expect(() => getMockExamBlueprint("" as MockExamLevel)).toThrow();
  });

  it("gives every N4/N5 section a non-empty promptLabel and stable unique id", () => {
    for (const bp of [N4_BLUEPRINT, N5_BLUEPRINT]) {
      const ids = bp.sections.map((s) => s.id);
      expect(new Set(ids).size).toBe(ids.length);
      for (const section of bp.sections) {
        expect(section.promptLabel.length).toBeGreaterThan(0);
        expect(section.labelJa.length).toBeGreaterThan(0);
        expect(section.labelZh.length).toBeGreaterThan(0);
        expect(section.labelEn.length).toBeGreaterThan(0);
        expect(section.targetCount).toBeGreaterThan(0);
      }
    }
  });
});