import { describe, expect, it } from "vitest";
import { getMockExamBlueprint, N1_BLUEPRINT, N2_BLUEPRINT } from "./mockExam";

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

  it("gives every section a non-empty promptLabel and stable id", () => {
    for (const bp of [N1_BLUEPRINT, N2_BLUEPRINT]) {
      const ids = bp.sections.map((s) => s.id);
      expect(new Set(ids).size).toBe(ids.length); // ids unique within a level
      for (const section of bp.sections) {
        expect(section.promptLabel.length).toBeGreaterThan(0);
        expect(section.labelJa.length).toBeGreaterThan(0);
        expect(section.targetCount).toBeGreaterThan(0);
      }
    }
  });
});
