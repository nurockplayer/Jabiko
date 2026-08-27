import { describe, expect, it } from "vitest";
import { buildSentencePatternPool } from "./sentencePatterns";
import { patternInstructionI18n } from "./sentencePatterns.i18n";

describe("sentence-pattern overlays", () => {
  it("threads the constant instruction overlay onto every question", () => {
    const pool = buildSentencePatternPool();
    expect(pool.length).toBeGreaterThan(0);
    for (const q of pool) {
      expect(q.instructionI18n).toBe(patternInstructionI18n);
      expect((q.instructionI18n?.en ?? "").length).toBeGreaterThan(0);
      expect((q.instructionI18n?.ja ?? "").length).toBeGreaterThan(0);
    }
  });

  // Coverage of NEW items is a warn-level concern for the check:i18n report
  // (#422), deliberately NOT a hard CI gate here -- content batches land
  // zh-first by design. This test only proves the THREADING works, using a
  // known item that has overlays.
  it("carries per-item hint / context / explanation overlays through to the question", () => {
    const q = buildSentencePatternPool().find((x) => x.id === "pattern-te-kudasai-001")!;
    expect(q).toBeDefined();
    for (const lang of ["en", "ja"] as const) {
      expect(q.hintI18n?.[lang]).toBeTruthy();
      expect(q.promptContextI18n?.[lang]).toBeTruthy();
      expect(q.explanationI18n?.[lang]).toBeTruthy();
    }
  });

  it("threads the context overlay onto the baked example meaning (post-answer line)", () => {
    const q = buildSentencePatternPool().find((x) => x.id === "pattern-te-kudasai-001")!;
    expect(q.vocabulary.examples[0]?.meaningI18n?.en).toBe(q.promptContextI18n?.en);
  });

  it("locks neutral pre-answer hints for every human-reviewed locale", () => {
    // Exact content lock: these hints were reviewed as situation-only context.
    // They must not drift without repeating the semantic review of the prompt.
    const reviews = [
      {
        id: "pattern-n5-sonzai-007",
        hintZh: "家人確認貓現在在哪裡。",
        hintEn: "A family member checks the cat's current location.",
        hintJa: "家族が猫の今いる場所を確認する。"
      },
      {
        id: "pattern-n5-riyuu-001",
        hintZh: "老師確認學生昨天缺席時的情況。",
        hintEn: "A teacher checks what happened when a student was absent yesterday.",
        hintJa: "先生が生徒の昨日の欠席について確認する。"
      },
      {
        id: "pattern-n5-riyuu-002",
        hintZh: "說話者說明明天的休假計畫與公司來電。",
        hintEn: "The speaker describes tomorrow's day-off plan and a call from work.",
        hintJa: "話し手が明日の休みの予定と会社からの電話について話す。"
      },
      {
        id: "pattern-n5-riyuu-005",
        hintZh: "說話者說明出門前的天氣與上班時間。",
        hintEn: "The speaker describes the weather and work time before leaving home.",
        hintJa: "話し手が家を出る前の天気と仕事の時間について話す。"
      }
    ];

    const pool = buildSentencePatternPool();
    const actual = reviews.map(({ id }) => {
      const q = pool.find((candidate) => candidate.id === id);
      return {
        id,
        hintZh: q?.hintZh,
        hintEn: q?.hintI18n?.en,
        hintJa: q?.hintI18n?.ja
      };
    });

    expect(actual).toEqual(reviews);
  });
});
