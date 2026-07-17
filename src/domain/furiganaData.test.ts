import { describe, it, expect } from "vitest";
import { furiganaData } from "./furiganaData";
import { furiganaExplanationData } from "./furiganaExplanationData";
import { furiganaLearningData } from "./furiganaLearningData";
import {
  allowsOptionFurigana,
  collectJapaneseRubySources,
  collectQuotedRubySources,
  hasKanji,
  isReadingPrompt
} from "./furigana";
import { examStyleQuestions } from "./examBlocks";
import { learningBlocks } from "./learningBlocks";
import { learningBlockI18n } from "./learningBlocks.i18n";

// #589: choice buttons render options through <Ruby>, which falls back to
// plain text whenever a string has no baked entry. This drift guard keeps
// the baked table in step with the bank: every kanji-bearing option of a
// furigana-allowed item must have an entry, or the toggle silently does
// nothing on exactly the buttons the user asked about. (Blocked labels --
// 表記 / 語形成 -- are excluded at render time via allowsOptionFurigana, so
// they are not required, and must not be forced, here.)
describe("furiganaData option coverage (#589)", () => {
  it("bakes every kanji-bearing option of furigana-allowed exam items", () => {
    const missing: string[] = [];
    for (const question of examStyleQuestions) {
      if (!allowsOptionFurigana(question.promptLabel)) continue;
      if (isReadingPrompt(question.promptLabel, question.targetForm)) continue;
      for (const option of question.options ?? []) {
        if (hasKanji(option) && !furiganaData[option]) {
          missing.push(`${question.id}: ${option}`);
        }
      }
    }
    expect(
      missing,
      `kanji options without a baked furigana entry (run pnpm build:furigana): ${missing.slice(0, 10).join(" | ")}`
    ).toEqual([]);
  });

  it("does not bake a localized meaning answer as Japanese text", () => {
    expect(furiganaData["今天"]).toBeUndefined();
  });
});

// #599: explanation-only furigana data is split into a separate table.
// The base map must NOT contain explanation-only keys, while the explanation
// map must still cover the explanation examples #591 introduced.
describe("furiganaExplanationData drift guard (#599)", () => {
  // Keys that exist in the base map (from stems/options/examples)
  // and SHOULD NOT appear in the explanation map — if they do, it means
  // the classification in build-furigana.mjs let base-only content leak
  // into the explanation table. These are representative prompt stems
  // that never appear in explanations.
  const BASE_ONLY_KEYS = [
    " ___ 作った料理なのに、誰も食べてくれなかった。", // exam stem with blank
    "SNS上では、その企業の対応をめぐって ___ 批判が続いている。",
    "彼は、何があってもあきらめない人だ。",             // vocab example
  ];

  // Explanation-exclusive Japanese runs (extracted via collectJapaneseRubySources
  // from explanation text, not present in any stem/option/example).
  // These must survive in the explanation map for #591 compatibility.
  const EXPLANATION_ONLY_KEYS = [
    "あいさつを食べました",      // appears in explanation examples
    "あえては自ら進んで行うこと", // explanation-only grammar gloss
  ];

  it("is a non-empty generated table", () => {
    expect(Object.keys(furiganaExplanationData).length).toBeGreaterThan(0);
  });

  it("contains explanation-only Japanese runs (the #591 coverage)", () => {
    const present = EXPLANATION_ONLY_KEYS.filter((k) => furiganaExplanationData[k]);
    expect(present.length).toBeGreaterThan(0);
  });

  it("does not contain base-only keys (stems/examples)", () => {
    // Base-only keys that never appear in explanations must NOT leak
    // into the explanation map. This guards the classification boundary.
    const leaking = BASE_ONLY_KEYS.filter((k) => furiganaExplanationData[k]);
    expect(leaking, `base-only keys leaked into explanation map: ${leaking.join(" | ")}`).toEqual([]);
  });

  it("has deterministic key ordering (sorted)", () => {
    const keys = Object.keys(furiganaExplanationData);
    const sorted = [...keys].sort();
    expect(keys).toEqual(sorted);
  });
});

describe("furiganaLearningData drift guard (#618)", () => {
  it("bakes every kanji-bearing learning formula and subtitle", () => {
    const missing: string[] = [];
    for (const block of learningBlocks) {
      for (const text of [block.subtitle, ...block.examples.map((example) => example.formula)]) {
        if (hasKanji(text) && !furiganaLearningData[text]) {
          missing.push(`${block.id}: ${text}`);
        }
      }
    }
    expect(
      missing,
      `learning formulas without baked furigana (run pnpm build:furigana): ${missing.slice(0, 10).join(" | ")}`
    ).toEqual([]);
  });

  it("bakes safe Japanese sources from source and localized pitfalls", () => {
    const missing: string[] = [];
    const check = (owner: string, text: string, locale: string) => {
      const sources = locale === "ja"
        ? [text]
        : locale === "zh-Hant"
          ? collectQuotedRubySources(text)
          : collectJapaneseRubySources(text);
      for (const run of sources) {
        if (hasKanji(run) && !furiganaLearningData[run]) {
          missing.push(`${owner}: ${run}`);
        }
      }
    };

    for (const block of learningBlocks) {
      for (const pitfall of block.pitfalls ?? []) check(block.id, pitfall, "zh-Hant");
    }
    for (const [blockId, locales] of Object.entries(learningBlockI18n)) {
      for (const [locale, overlay] of Object.entries(locales)) {
        for (const pitfall of overlay?.pitfalls ?? []) {
          check(`${blockId}/${locale}`, pitfall, locale);
        }
      }
    }

    expect(
      missing,
      `learning pitfalls without baked furigana (run pnpm build:furigana): ${missing.slice(0, 10).join(" | ")}`
    ).toEqual([]);
  });

  it("does not bake mixed Traditional Chinese prose as Japanese", () => {
    expect(furiganaLearningData["過去要放在最後的ならなかった"]).toBeUndefined();
    expect(furiganaLearningData["不是買あます"]).toBeUndefined();
    expect(furiganaLearningData["う結尾的一類動詞要變わ"]).toBeUndefined();
  });

  it("pins known context-sensitive learning readings", () => {
    const causative = furiganaLearningData["来る → 来させる"];
    expect(causative?.filter((segment) => segment.t === "来").map((segment) => segment.r))
      .toEqual(["く", "こ"]);
  });

  it("reads grammar-form terminology as けい without changing ordinary 形", () => {
    // Kana-prefixed terms align as plain kana + 形(けい); all-kanji terms
    // align as one ruby segment carrying the complete compound reading.
    const readingOverShape: Record<string, string> = {
      "て形": "けい",
      "た形": "けい",
      "ない形": "けい",
      "ます形": "けい",
      "辞書形": "じしょけい",
      "い形": "けい",
      "な形": "けい",
      "普通形": "ふつうけい",
      "未来形": "みらいけい",
      "条件形": "じょうけんけい",
      "可能形": "かのうけい",
      "意向形": "いこうけい",
      "命令形": "めいれいけい"
    };
    const allSegments = Object.values(furiganaLearningData).flat();

    for (const [term, reading] of Object.entries(readingOverShape)) {
      let occurrences = 0;
      for (const [source, segments] of Object.entries(furiganaLearningData)) {
        let fromIndex = 0;
        while (true) {
          const termIndex = source.indexOf(term, fromIndex);
          if (termIndex === -1) break;
          fromIndex = termIndex + term.length;
          // い形容詞 / な形容詞 contain the same two characters but are a
          // different word, not the grammar shorthand い形 / な形.
          if ((term === "い形" || term === "な形") && source[fromIndex] === "容") continue;

          occurrences += 1;
          const shapeIndex = termIndex + term.length - 1;
          let cursor = 0;
          const segment = segments.find((candidate) => {
            const containsShape = shapeIndex >= cursor && shapeIndex < cursor + candidate.t.length;
            cursor += candidate.t.length;
            return containsShape;
          });
          expect(segment?.r, `${term} in ${source}`).toBe(reading);
        }
      }
      expect(occurrences, `${term} should occur in the generated learning map`).toBeGreaterThan(0);
    }

    expect(allSegments.some((segment) => segment.t === "形" && segment.r === "がた"))
      .toBe(false);
    expect(allSegments.some((segment) => segment.t === "形" && segment.r === "かたち"))
      .toBe(true);
  });

  it("reads the chapter suffix in ばかり章 as しょう", () => {
    const source = Object.entries(furiganaLearningData)
      .find(([key]) => key.includes("ばかり章"));
    expect(source?.[1].find((segment) => segment.t === "章")?.r).toBe("しょう");
  });

  it("is a non-empty generated table with deterministic key ordering", () => {
    const keys = Object.keys(furiganaLearningData);
    expect(keys.length).toBeGreaterThan(0);
    expect(keys).toEqual([...keys].sort());
  });
});
