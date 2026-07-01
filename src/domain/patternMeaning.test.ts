import { describe, expect, it } from "vitest";
import { lookupPatternMeaning } from "./patternMeaning";
import { examStyleQuestions } from "./examBlocks";

// Pick a real bank pattern whose vocabulary carries an en overlay, so the
// localized lookup has something to return (all exam items have en/ja
// overlays as of #400).
const sample = examStyleQuestions.find(
  (q) => q.vocabulary.surface && q.vocabulary.meaningZh && q.vocabulary.meaningI18n?.en
)!;

describe("lookupPatternMeaning", () => {
  it("returns the Chinese gloss by default (backwards compatible)", () => {
    expect(lookupPatternMeaning(sample.vocabulary.surface)).toBe(sample.vocabulary.meaningZh);
  });

  it("returns the localized gloss for a locale with an overlay", () => {
    expect(lookupPatternMeaning(sample.vocabulary.surface, "en")).toBe(
      sample.vocabulary.meaningI18n!.en
    );
  });

  it("falls back to the Chinese gloss for a locale without an overlay", () => {
    // th content overlays don't exist yet -- must degrade to zh, not blank.
    expect(lookupPatternMeaning(sample.vocabulary.surface, "th")).toBe(
      sample.vocabulary.meaningZh
    );
  });

  it("still returns null for a pattern the bank does not know", () => {
    expect(lookupPatternMeaning("ぜったいにそんざいしないぶんけい", "en")).toBeNull();
  });
});
