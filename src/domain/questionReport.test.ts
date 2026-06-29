import { describe, expect, it } from "vitest";
import { buildQuestionReportMessage } from "./questionReport";
import { FEEDBACK_MAX } from "./feedbackRemote";
import type { PracticeQuestion } from "./types";

// A fully-populated reference question so each assertion can target one field.
const baseQuestion: PracticeQuestion = {
  id: "q-demo-001",
  vocabulary: {
    id: "v-demo",
    surface: "面倒",
    reading: "めんどう",
    meaningZh: "麻煩",
    partOfSpeech: "na_adjective",
    group: null,
    lesson: null,
    tags: [],
    examples: [],
    level: "N2"
  },
  targetForm: "reading",
  expectedAnswers: ["めんどう", "めんどうな"],
  explanation: "「面倒」讀作 めんどう。",
  promptLabel: "漢字読み",
  promptText: "この仕事は面倒だ。"
};

describe("buildQuestionReportMessage", () => {
  it("packs every metadata field into a human-readable message", () => {
    const message = buildQuestionReportMessage({
      question: baseQuestion,
      reason: "wrongAnswer",
      detail: "正解が二つあるはず",
      language: "ja",
      selectedAnswer: "めいわく"
    });

    // A clear header marking this as a question report.
    expect(message).toContain("題目回報");
    expect(message).toContain("question report");
    // Reason key.
    expect(message).toContain("wrongAnswer");
    // Question identity + type + level.
    expect(message).toContain("q-demo-001");
    expect(message).toContain("漢字読み"); // promptLabel preferred as type
    expect(message).toContain("N2");
    expect(message).toContain("面倒"); // surface
    expect(message).toContain("この仕事は面倒だ。"); // promptText
    // Both expected answers joined.
    expect(message).toContain("めんどう");
    expect(message).toContain("めんどうな");
    // The learner's pick.
    expect(message).toContain("めいわく");
    // UI language.
    expect(message).toContain("ja");
    // Free-text detail.
    expect(message).toContain("正解が二つあるはず");
  });

  it("falls back to targetForm when promptLabel is absent", () => {
    const { promptLabel, ...rest } = baseQuestion;
    void promptLabel;
    const message = buildQuestionReportMessage({
      question: rest as PracticeQuestion,
      reason: "typo",
      language: "zh-Hant"
    });
    expect(message).toContain("reading"); // targetForm used as type
  });

  it("renders placeholders for missing optional promptText / level / selectedAnswer", () => {
    const question: PracticeQuestion = {
      ...baseQuestion,
      promptText: undefined,
      vocabulary: { ...baseQuestion.vocabulary, level: undefined }
    };
    const message = buildQuestionReportMessage({
      question,
      reason: "other",
      language: "en",
      selectedAnswer: null
    });
    // Should not blow up and should still mention the surface + id.
    expect(message).toContain("q-demo-001");
    expect(message).toContain("面倒");
    // Missing fields rendered as a dash placeholder, never "undefined".
    expect(message).not.toContain("undefined");
    expect(message).toContain("-");
  });

  it("omits the detail section gracefully when no detail is given", () => {
    const message = buildQuestionReportMessage({
      question: baseQuestion,
      reason: "awkwardMeaning",
      language: "en"
    });
    expect(message).not.toContain("undefined");
    expect(message).toContain("awkwardMeaning");
  });

  it("is deterministic for identical input", () => {
    const input = {
      question: baseQuestion,
      reason: "confusingExplanation" as const,
      detail: "わからない",
      language: "ja" as const,
      selectedAnswer: "めんどう"
    };
    expect(buildQuestionReportMessage(input)).toBe(buildQuestionReportMessage(input));
  });

  it("caps the message at FEEDBACK_MAX even with an over-long detail", () => {
    const message = buildQuestionReportMessage({
      question: baseQuestion,
      reason: "other",
      detail: "あ".repeat(FEEDBACK_MAX * 2),
      language: "ja"
    });
    expect(message.length).toBeLessThanOrEqual(FEEDBACK_MAX);
    // The structured header survives the cap (detail is what gets trimmed).
    expect(message).toContain("q-demo-001");
  });
});
