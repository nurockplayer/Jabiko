import { describe, expect, it } from "vitest";
import { CONTENT_STATS } from "./contentStats";
import { buildExamQuestionPool } from "./examBlocks";
import { buildSentencePatternPool } from "./sentencePatterns";
import { jlptVocabulary } from "./vocabulary-jlpt";
import { kanjiOnyomi } from "./kanjiOnyomi";
import { grammarPatterns } from "./grammarDatabase";

// Drift guard: CONTENT_STATS is hardcoded so the home view doesn't have
// to import the heavy data modules (see contentStats.ts). This test is
// what keeps the hardcoded numbers honest -- if a content batch changes
// any count, this fails and the new number must be written into
// contentStats.ts. It's free to import the heavy builders here; test
// files are never part of the shipped bundle.
describe("CONTENT_STATS", () => {
  it("matches the total exam-bank item count across all levels", () => {
    // examItems is the FULL bank total (N1–N5) so content growth at any
    // level shows up on the home dashboard -- not the default-pool size
    // (which trims N3 to a warm-up and excludes N4/N5).
    expect(CONTENT_STATS.examItems).toBe(
      buildExamQuestionPool(["N1", "N2", "N3", "N4", "N5"]).length
    );
  });

  it("matches the live N1 文法形式選擇 count", () => {
    expect(CONTENT_STATS.n1Grammar).toBe(
      buildExamQuestionPool("N1").filter((question) => question.promptLabel === "文法形式選擇").length
    );
  });

  it("matches the live sentence-pattern count", () => {
    expect(CONTENT_STATS.patternChecks).toBe(buildSentencePatternPool().length);
  });

  it("matches the live JLPT vocabulary count", () => {
    expect(CONTENT_STATS.vocab).toBe(jlptVocabulary.length);
  });

  it("matches the live kanji-reading entry count", () => {
    expect(CONTENT_STATS.kanjiReadings).toBe(kanjiOnyomi.length);
  });

  it("matches the live grammar-pattern count", () => {
    expect(CONTENT_STATS.grammarPatterns).toBe(grammarPatterns.length);
  });
});
