import { describe, expect, it } from "vitest";
import { kanjiOnyomi, kanjiExamples } from "./kanjiOnyomi";
import type { VocabularyItem } from "./types";

// Readings are stored as plain hiragana (long-vowel ー allowed), no okurigana
// dots -- matching the reading drills + the panel's grouping/display.
const HIRAGANA = /^[ぁ-ゖー]+$/;
const LEVELS = ["N5", "N4", "N3", "N2", "N1"] as const;

describe("kanjiOnyomi", () => {
  it("every entry is a single kanji with hiragana readings, a gloss, and a level", () => {
    for (const entry of kanjiOnyomi) {
      expect([...entry.kanji]).toHaveLength(1);
      // At least one reading -- on'yomi OR kun'yomi (some kanji lack one type).
      expect(entry.onyomi.length + entry.kunyomi.length).toBeGreaterThan(0);
      expect(entry.onyomi.every((reading) => HIRAGANA.test(reading))).toBe(true);
      expect(entry.kunyomi.every((reading) => HIRAGANA.test(reading))).toBe(true);
      expect(entry.meaningZh.length).toBeGreaterThan(0);
      expect(LEVELS).toContain(entry.level);
    }
  });

  it("has no duplicate kanji", () => {
    const all = kanjiOnyomi.map((entry) => entry.kanji);
    expect(new Set(all).size).toBe(all.length);
  });

  it("covers every JLPT level N5–N1 (#195)", () => {
    const levels = new Set(kanjiOnyomi.map((entry) => entry.level));
    for (const level of LEVELS) {
      expect(levels.has(level), `no kanji at level ${level}`).toBe(true);
    }
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
    // kanjiExamples pulls from the vocab deck by surface-contains, so a kanji
    // that appears in NO vocab word would render an empty card. Guard every
    // entry -- this also catches a kanji added without a backing compound.
    const empty = kanjiOnyomi
      .filter((entry) => kanjiExamples(entry.kanji).length === 0)
      .map((entry) => entry.kanji);
    expect(empty, `kanji with no example words: ${empty.join(", ")}`).toEqual([]);
  });

  it("passes vocab meaningI18n through to kanji example words (#427)", () => {
    const deck: VocabularyItem[] = [
      {
        id: "x-書道",
        surface: "書道",
        reading: "しょどう",
        meaningZh: "書法",
        meaningI18n: { en: "calligraphy", ja: "毛筆で文字を書く芸術" },
        partOfSpeech: "noun",
        group: null,
        lesson: null,
        tags: [],
        examples: []
      }
    ];

    const examples = kanjiExamples("書", 6, deck);
    expect(examples).toHaveLength(1);
    expect(examples[0].meaningI18n?.en).toBe("calligraphy");
    expect(examples[0].meaningI18n?.ja).toBe("毛筆で文字を書く芸術");
  });
});
