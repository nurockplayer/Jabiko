import { describe, expect, it } from "vitest";
import { buildSentencePatternPool } from "./sentencePatterns";
import { patternInstructionI18n } from "./sentencePatterns.i18n";

describe("sentence-pattern overlays", () => {
  it("threads the constant instruction overlay onto every question", () => {
    const pool = buildSentencePatternPool();
    expect(pool.length).toBeGreaterThan(0);
    for (const q of pool) {
      expect(q.instructionI18n).toBe(patternInstructionI18n);
      expect((q.instructionI18n?.en ?? "").length).toBeGreaterThan(0);
      expect((q.instructionI18n?.ja ?? "").length).toBeGreaterThan(0);
    }
  });

  // Coverage of NEW items is a warn-level concern for the check:i18n report
  // (#422), deliberately NOT a hard CI gate here -- content batches land
  // zh-first by design. This test only proves the THREADING works, using a
  // known item that has overlays.
  it("carries per-item hint / context / explanation overlays through to the question", () => {
    const q = buildSentencePatternPool().find((x) => x.id === "pattern-te-kudasai-001")!;
    expect(q).toBeDefined();
    for (const lang of ["en", "ja"] as const) {
      expect(q.hintI18n?.[lang]).toBeTruthy();
      expect(q.promptContextI18n?.[lang]).toBeTruthy();
      expect(q.explanationI18n?.[lang]).toBeTruthy();
    }
  });

  it("threads the context overlay onto the baked example meaning (post-answer line)", () => {
    const q = buildSentencePatternPool().find((x) => x.id === "pattern-te-kudasai-001")!;
    expect(q.vocabulary.examples[0]?.meaningI18n?.en).toBe(q.promptContextI18n?.en);
  });
});
