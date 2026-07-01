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

  it("carries per-item hint / context / explanation overlays through to the question", () => {
    const pool = buildSentencePatternPool();
    const withEn = pool.filter(
      (q) => q.hintI18n?.en && q.promptContextI18n?.en && q.explanationI18n?.en
    );
    const withJa = pool.filter(
      (q) => q.hintI18n?.ja && q.promptContextI18n?.ja && q.explanationI18n?.ja
    );
    // Every pattern item should be fully overlaid once the translation pass lands.
    expect(withEn.length).toBe(pool.length);
    expect(withJa.length).toBe(pool.length);
  });
});
