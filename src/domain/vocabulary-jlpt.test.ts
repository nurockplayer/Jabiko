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

  it("only contains N1 / N2 / N3 / N5 items", () => {
    const offenders = jlptVocabulary
      .filter(
        (item) =>
          item.level !== "N1" && item.level !== "N2" && item.level !== "N3" && item.level !== "N5"
      )
      .map((item) => item.surface);
    expect(offenders).toEqual([]);
  });

  // #666: the N5 tier fills the daily 単字読音 band with everyday beginner
  // vocabulary. Lock the exact count, id/surface uniqueness, and reading
  // hygiene so hand-appending batches cannot drift.
  it("includes exactly 180 N5 items (#666)", () => {
    expect(jlptVocabulary.filter((item) => item.level === "N5").length).toBe(180);
  });

  it("gives every N5 item a unique id and surface", () => {
    const n5 = jlptVocabulary.filter((item) => item.level === "N5");
    const ids = n5.map((item) => item.id);
    const surfaces = n5.map((item) => item.surface);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(surfaces).size).toBe(surfaces.length);
  });

  it("does not repeat any N1–N3 surface inside the N5 batch", () => {
    const upperSurfaces = new Set(
      jlptVocabulary.filter((item) => item.level !== "N5").map((item) => item.surface)
    );
    const overlaps = jlptVocabulary
      .filter((item) => item.level === "N5")
      .filter((item) => upperSurfaces.has(item.surface))
      .map((item) => item.surface);
    expect(overlaps).toEqual([]);
  });

  it("gives every N5 item a hiragana reading and a valid part of speech", () => {
    const n5 = jlptVocabulary.filter((item) => item.level === "N5");
    const kanaOffenders = n5
      .filter((item) => !/^[ぁ-ゟー]+$/.test(item.reading))
      .map((item) => `${item.surface}=${item.reading}`);
    expect(kanaOffenders).toEqual([]);
    const pos = new Set(["noun", "na_adjective", "i_adjective", "adverb"]);
    const posOffenders = n5
      .filter((item) => !pos.has(item.partOfSpeech))
      .map((item) => `${item.surface}=${item.partOfSpeech}`);
    expect(posOffenders).toEqual([]);
  });

  it("has a non-kana surface for every N5 item (keeps 単字読音 meaningful)", () => {
    const offenders = jlptVocabulary
      .filter((item) => item.level === "N5")
      .filter((item) => /^[ぁ-ゟァ-ヶー]+$/.test(item.surface))
      .map((item) => item.surface);
    expect(offenders).toEqual([]);
  });

  it("lets every N5 item form a 4-option reading question", () => {
    const n5 = jlptVocabulary.filter((item) => item.level === "N5");
    const readingPool = n5.map((item) => item.reading);
    for (const item of n5) {
      const used = new Set([item.reading]);
      const distractors = readingPool.filter((r) => !used.has(r));
      expect(
        distractors.length,
        `${item.surface} cannot draw 3 distinct distractor readings`
      ).toBeGreaterThanOrEqual(3);
    }
  });

  // #583: the N3 tier fills the documented "初級 hole" (empty n2n3 band pool,
  // daily-set vocab slot spilling to exam). Guard that the tier stays populated.
  it("includes the N3 tier (#583)", () => {
    const n3Count = jlptVocabulary.filter((item) => item.level === "N3").length;
    expect(n3Count).toBeGreaterThanOrEqual(100);
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
    const adverbials = ["漫然", "突如", "漸次", "是非"];
    const offenders = adverbials
      .map((surface) => jlptVocabulary.find((item) => item.surface === surface))
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .filter((item) => item.partOfSpeech !== "adverb")
      .map((item) => `${item.surface}=${item.partOfSpeech}`);
    expect(offenders).toEqual([]);
  });
});
