import { describe, expect, it } from "vitest";
import { kanjiOnyomi, kanjiExamples } from "./kanjiOnyomi";

describe("kanjiOnyomi", () => {
  it("every entry is a single kanji with hiragana onyomi + a gloss", () => {
    for (const entry of kanjiOnyomi) {
      expect([...entry.kanji]).toHaveLength(1);
      expect(entry.onyomi.length).toBeGreaterThan(0);
      // onyomi is stored in hiragana (to match the reading drills).
      expect(entry.onyomi.every((reading) => /^[ぁ-ゖ]+$/.test(reading))).toBe(true);
      expect(entry.meaningZh.length).toBeGreaterThan(0);
    }
  });

  it("has no duplicate kanji", () => {
    const all = kanjiOnyomi.map((entry) => entry.kanji);
    expect(new Set(all).size).toBe(all.length);
  });

  it("pulls real example words that contain the kanji", () => {
    const examples = kanjiExamples("機");
    expect(examples.length).toBeGreaterThan(0);
    expect(examples.every((example) => example.surface.includes("機"))).toBe(true);
    expect(examples.every((example) => example.reading.length > 0 && example.meaningZh.length > 0)).toBe(true);
  });

  it("caps and sorts examples shortest-first", () => {
    const examples = kanjiExamples("関", 3);
    expect(examples.length).toBeLessThanOrEqual(3);
    for (let i = 1; i < examples.length; i++) {
      expect(examples[i].surface.length).toBeGreaterThanOrEqual(examples[i - 1].surface.length);
    }
  });

  it("yields at least one example word for every entry", () => {
    // kanjiExamples pulls from jlptVocabulary by surface-contains, so a kanji
    // that appears in NO vocab word would render an empty card. Guard every
    // entry -- this also catches a new kanji added without a backing compound.
    const empty = kanjiOnyomi
      .filter((entry) => kanjiExamples(entry.kanji).length === 0)
      .map((entry) => entry.kanji);
    expect(empty, `kanji with no example words: ${empty.join(", ")}`).toEqual([]);
  });
});
