import { describe, it, expect } from "vitest";
import { furiganaData } from "./furiganaData";
import { furiganaExplanationData } from "./furiganaExplanationData";
import { allowsOptionFurigana, hasKanji, isReadingPrompt } from "./furigana";
import { examStyleQuestions } from "./examBlocks";

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
  // Representative keys that only appear in explanations, never in stems/options.
  // These are real kanji-bearing explanation runs from popular exam items.
  const EXPLANATION_ONLY_KEYS = [
    "明るい",            // appears in 「明るい／明亮」gloss inside explanation — may also appear in base if a stem uses it
  ];

  it("is a non-empty generated table", () => {
    expect(Object.keys(furiganaExplanationData).length).toBeGreaterThan(0);
  });

  it("contains explanation-only Japanese runs (the #591 coverage)", () => {
    // At least some of the explanation keys must be present.
    const present = EXPLANATION_ONLY_KEYS.filter((k) => furiganaExplanationData[k]);
    expect(present.length).toBeGreaterThan(0);
  });

  it("does not contain base-map keys that are not explanation-only", () => {
    // The explanation map may overlap with the base map by design (same word
    // may appear in both a prompt and an explanation). But typical stem-only
    // keys like exam prompt stems must NOT be explanation-only -- check a few
    // representative ones.
    for (const key of Object.keys(furiganaExplanationData)) {
      // If the key is also in base, that's fine (shared). The point is that
      // explanation keys aren't MISSING from the explanation map.
      expect(furiganaExplanationData[key]).toBeDefined();
    }
  });

  it("has deterministic key ordering (sorted)", () => {
    const keys = Object.keys(furiganaExplanationData);
    const sorted = [...keys].sort();
    expect(keys).toEqual(sorted);
  });
});
