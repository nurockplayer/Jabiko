import { describe, expect, it } from "vitest";
import { getMockExamBlueprint, N1_BLUEPRINT, N2_BLUEPRINT, N3_BLUEPRINT, sectionSubtitle } from "./mockExam";

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
});