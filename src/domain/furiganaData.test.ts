import { describe, it, expect } from "vitest";
import { furiganaData } from "./furiganaData";
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
