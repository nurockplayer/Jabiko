import { describe, expect, it } from "vitest";
import kuromoji from "kuromoji";
import { createRequire } from "node:module";
import path from "node:path";
// @ts-expect-error -- plain .mjs tooling module, no types
import {
  buildReadingSurfaceOverrides,
  isReadingDrillQuestion
} from "./build-furigana.mjs";
import { buildQuestionPool } from "../src/domain/practice";
import type { VocabularyItem } from "../src/domain/types";
import { alignToken, kataToHira, tokensToSegments } from "../src/domain/furigana";

const require = createRequire(import.meta.url);
const DIC = path.join(path.dirname(require.resolve("kuromoji/package.json")), "dict");

// #714: a standalone ambiguous-kanji surface baked as a reading-drill question
// must use the vocabulary record's explicit `reading` (authoritative), not the
// reading kuromoji happens to pick for the bare character. e.g. the N5 vocab
// 時 is read じ ("o'clock"), but kuromoji defaults 時 to とき ("time").
type Drill = {
  targetForm: string;
  promptLabel?: string;
  vocabulary: { surface: string; reading: string };
};

const readingDrill = (surface: string, reading: string): Drill => ({
  targetForm: "reading",
  vocabulary: { surface, reading }
});

const labelledDrill = (surface: string, reading: string): Drill => ({
  targetForm: "reading",
  promptLabel: "漢字読み",
  vocabulary: { surface, reading }
});

const build = (questions: Drill[]) =>
  buildReadingSurfaceOverrides(questions, alignToken, kataToHira);

const segmentsFor = (surface: string, reading: string) =>
  tokensToSegments([{ surface_form: surface, reading }]);

describe("isReadingDrillQuestion (#714)", () => {
  it("accepts an unlabelled reading-form drill (the #666 N5 vocab class)", () => {
    expect(isReadingDrillQuestion(readingDrill("時", "じ"))).toBe(true);
  });

  it("rejects labelled items even when targetForm defaults to 'reading'", () => {
    // 漢字読み / 詞彙填空 etc. default targetForm to "reading" too, but their
    // vocabulary.reading may be a context conjugation (募る -> つのって), so
    // they must never drive the override map.
    expect(isReadingDrillQuestion(labelledDrill("募る", "つのって"))).toBe(false);
    expect(isReadingDrillQuestion({ targetForm: "meaning", vocabulary: { surface: "時", reading: "じ" } }))
      .toBe(false);
  });
});

describe("buildReadingSurfaceOverrides (#714)", () => {
  it("maps the 6 multi-reading N5 surfaces to their vocabulary readings", () => {
    const map = build([
      readingDrill("時", "じ"),
      readingDrill("分", "ふん"),
      readingDrill("米", "こめ"),
      readingDrill("万", "まん"),
      readingDrill("辛い", "からい"),
      readingDrill("十分", "じゅうぶん")
    ]);
    expect(map.get("時")).toBe("じ");
    expect(map.get("分")).toBe("ふん");
    expect(map.get("米")).toBe("こめ");
    expect(map.get("万")).toBe("まん");
    expect(map.get("辛い")).toBe("からい");
    expect(map.get("十分")).toBe("じゅうぶん");
  });

  it("bakes the authoritative reading as the standalone surface's ruby", () => {
    const map = build([readingDrill("時", "じ")]);
    expect(segmentsFor("時", map.get("時")!)).toEqual([{ t: "時", r: "じ" }]);

    const karai = build([readingDrill("辛い", "からい")]);
    expect(segmentsFor("辛い", karai.get("辛い")!)).toEqual([
      { t: "辛", r: "から" },
      { t: "い" }
    ]);

    const jubun = build([readingDrill("十分", "じゅうぶん")]);
    expect(segmentsFor("十分", jubun.get("十分")!)).toEqual([
      { t: "十分", r: "じゅうぶん" }
    ]);
  });

  it("never overrides the same kanji inside a compound / longer string", () => {
    // The override map is keyed by the FULL source string, so a lookup for a
    // compound is a miss: 時 inside 時々 / 毎時 keeps kuromoji's own reading.
    const map = build([readingDrill("時", "じ")]);
    expect(map.has("時々")).toBe(false);
    expect(map.has("毎時")).toBe(false);
    expect(map.get("時々")).toBeUndefined();
    expect(map.get("毎時")).toBeUndefined();
  });

  it("excludes labelled reading drills (contextual reading, not the lemma)", () => {
    const map = build([labelledDrill("募る", "つのって")]);
    expect(map.has("募る")).toBe(false);
  });

  it("excludes a surface whose reading drills disagree (拒む: こばむ / こばんだ)", () => {
    const map = build([readingDrill("拒む", "こばむ"), readingDrill("拒む", "こばんだ")]);
    expect(map.has("拒む")).toBe(false);
  });

  it("excludes a surface whose reading carries no kanji (nothing to override)", () => {
    const map = build([readingDrill("ごはん", "ごはん")]);
    expect(map.has("ごはん")).toBe(false);
  });

  it("is deterministic: rebuilding from the same questions yields the same map", () => {
    const questions = [
      readingDrill("時", "じ"),
      readingDrill("万", "まん"),
      readingDrill("十分", "じゅうぶん"),
      readingDrill("辛い", "からい")
    ];
    const first = build(questions);
    const second = build(questions);
    expect([...first]).toEqual([...second]);
  });
});

// =============================================================================
// Real-pool integration (#714, reviewer blocking).
//
// The 6 target surfaces come from the #666 N5 vocabulary batch, which is not
// merged into current main — so `buildAllKnownQuestions()` here does NOT
// contain them and the baked tables cannot yet show the fix. These tests
// therefore rebuild the real #666 vocabulary shape (the exact `entry()` /
// `buildQuestionPool` calls the app makes), then run the generator's actual
// bake pipeline (kuromoji + the override map + tokensToSegments) to prove the
// fix yields correct ruby for the 6 surfaces and never pollutes compounds.
// =============================================================================

/** Mirrors `entry()` in src/domain/vocabulary-jlpt.ts (#666). */
function entry(
  level: string,
  partOfSpeech: VocabularyItem["partOfSpeech"],
  surface: string,
  reading: string,
  meaningZh: string
): VocabularyItem {
  return {
    id: `${level.toLowerCase()}-${surface}`,
    surface,
    reading,
    meaningZh,
    partOfSpeech,
    group: null,
    lesson: null,
    tags: [],
    examples: [],
    level: level as VocabularyItem["level"]
  };
}

const n5DrillVocabulary = [
  entry("N5", "noun", "時", "じ", "點鐘"),
  entry("N5", "noun", "分", "ふん", "分鐘"),
  entry("N5", "noun", "米", "こめ", "米"),
  entry("N5", "noun", "万", "まん", "萬"),
  entry("N5", "i_adjective", "辛い", "からい", "辣的"),
  entry("N5", "na_adjective", "十分", "じゅうぶん", "足夠"),
  // #666 also ships 時々 as its own vocab item; a compound containing the
  // same kanji must keep its own reading and never be hijacked by the 時 -> じ
  // override.
  entry("N5", "adverb", "時々", "ときどき", "有時")
];

// kuromoji ships no TS types; the generator's build-furigana.mjs uses the same
// untyped builder pattern. `t` (the tokenizer) is treated as `any`.
function buildTokenizedOnce() {
  return new Promise((resolve, reject) =>
    kuromoji.builder({ dicPath: DIC }).build((err, t) => (err ? reject(err) : resolve(t)))
  );
}

describe("real reading-drill pool bakes authoritative ruby (#714, #666 shape)", () => {
  it("bakes the 6 surfaces with their vocabulary reading and leaves 時々 on kuromoji", async () => {
    // Same call the app makes for vocab reading drills (sessionPools.ts).
    const questions = buildQuestionPool(n5DrillVocabulary, {
      partOfSpeech: "mixed",
      verbGroup: "all",
      targetForms: ["reading"]
    });
    expect(questions.length).toBe(n5DrillVocabulary.length);

    const overrides = buildReadingSurfaceOverrides(questions, alignToken, kataToHira);
    const tokenizer = await buildTokenizedOnce();

    // The generator's bake loop for a standalone surface source.
    const bake = (surface: string) => {
      const surfaceOverride = overrides.get(surface);
      const tokens = surfaceOverride
        ? [{ surface_form: surface, reading: surfaceOverride }]
        : tokenizer.tokenize(surface).map((t) => ({ surface_form: t.surface_form, reading: t.reading }));
      return tokensToSegments(tokens);
    };

    expect(bake("時")).toEqual([{ t: "時", r: "じ" }]);
    expect(bake("分")).toEqual([{ t: "分", r: "ふん" }]);
    expect(bake("米")).toEqual([{ t: "米", r: "こめ" }]);
    expect(bake("万")).toEqual([{ t: "万", r: "まん" }]);
    expect(bake("辛い")).toEqual([{ t: "辛", r: "から" }, { t: "い" }]);
    expect(bake("十分")).toEqual([{ t: "十分", r: "じゅうぶん" }]);
  }, 30000);

  it("keeps the compound 時々 on its own reading, never the bare 時 -> じ", async () => {
    const questions = buildQuestionPool(n5DrillVocabulary, {
      partOfSpeech: "mixed",
      verbGroup: "all",
      targetForms: ["reading"]
    });
    const overrides = buildReadingSurfaceOverrides(questions, alignToken, kataToHira);

    // 時々 is itself a reading-drill surface, so it maps to ITS authoritative
    // reading (ときどき) — the same value kuromoji would pick anyway. What must
    // never happen is the bare 時 -> じ override leaking onto the compound.
    expect(overrides.get("時々")).toBe("ときどき");
    expect(overrides.get("時")).toBe("じ");

    const tokenizer = await buildTokenizedOnce();
    const bake = (surface: string) => {
      const surfaceOverride = overrides.get(surface);
      const tokens = surfaceOverride
        ? [{ surface_form: surface, reading: surfaceOverride }]
        : tokenizer.tokenize(surface).map((t) => ({ surface_form: t.surface_form, reading: t.reading }));
      return tokensToSegments(tokens);
    };

    expect(bake("時々")).toEqual([{ t: "時々", r: "ときどき" }]);
  }, 30000);

  it("leaves the kanji 時 untouched inside unrelated compounds and sentences", async () => {
    const questions = buildQuestionPool(n5DrillVocabulary, {
      partOfSpeech: "mixed",
      verbGroup: "all",
      targetForms: ["reading"]
    });
    const overrides = buildReadingSurfaceOverrides(questions, alignToken, kataToHira);
    expect(overrides.has("時間")).toBe(false);
    expect(overrides.has("毎時")).toBe(false);
    expect(overrides.has("時点")).toBe(false);
  });
});
