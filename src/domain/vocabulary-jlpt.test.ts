import { describe, expect, it } from "vitest";
import { jlptVocabulary } from "./vocabulary-jlpt";

// Guards for the growing N1/N2 vocab pool. These catch the easy mistakes
// when hand-appending batches: a duplicated surface (which would let the
// same word appear as both a question and its own distractor), a reading
// that isn't kana, or an entry mislabelled to a non-N1/N2 level.
describe("jlptVocabulary integrity", () => {
  it("has no duplicate surfaces", () => {
    const seen = new Map<string, number>();
    for (const item of jlptVocabulary) {
      seen.set(item.surface, (seen.get(item.surface) ?? 0) + 1);
    }
    const dups = [...seen.entries()].filter(([, count]) => count > 1).map(([surface]) => surface);
    expect(dups).toEqual([]);
  });

  it("uses kana-only readings (hiragana + the long-vowel mark)", () => {
    const offenders = jlptVocabulary
      .filter((item) => !/^[ぁ-ゟー]+$/.test(item.reading))
      .map((item) => `${item.surface}=${item.reading}`);
    expect(offenders).toEqual([]);
  });

  it("only contains N1 / N2 items", () => {
    const offenders = jlptVocabulary
      .filter((item) => item.level !== "N1" && item.level !== "N2")
      .map((item) => item.surface);
    expect(offenders).toEqual([]);
  });

  it("gives every entry a surface, reading, and meaning", () => {
    const incomplete = jlptVocabulary
      .filter((item) => !item.surface || !item.reading || !item.meaningZh)
      .map((item) => item.surface || "(empty)");
    expect(incomplete).toEqual([]);
  });

  // #60: words used adverbially (漫然と／たる, 突如として) must not be
  // mislabelled as plain nouns -- the UI shows the part-of-speech and the
  // practice engine groups distractors by it.
  it("labels adverbial words as adverb, not noun", () => {
    const adverbials = ["漫然", "突如"];
    const offenders = adverbials
      .map((surface) => jlptVocabulary.find((item) => item.surface === surface))
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .filter((item) => item.partOfSpeech !== "adverb")
      .map((item) => `${item.surface}=${item.partOfSpeech}`);
    expect(offenders).toEqual([]);
  });
});
