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
    // promptLabel AND targetForm are emitted separately, not collapsed into one.
    expect(message).toContain("漢字読み"); // promptLabel
    expect(message).toContain("reading"); // targetForm (kept even when promptLabel exists)
    expect(message).toContain("N2");
    expect(message).toContain("面倒"); // surface
    // Extra vocabulary identity: id + reading.
    expect(message).toContain("v-demo"); // vocabulary id
    expect(message).toContain("めんどう"); // vocabulary reading
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

  it("emits promptLabel and targetForm on separate labelled lines", () => {
    const message = buildQuestionReportMessage({
      question: baseQuestion,
      reason: "wrongAnswer",
      language: "zh-Hant"
    });
    const lines = message.split("\n");
    expect(lines).toContain("promptLabel: 漢字読み");
    expect(lines).toContain("targetForm: reading");
    // Vocabulary identity is its own structured pair, not folded into surface.
    expect(lines).toContain("vocabId: v-demo");
    expect(lines).toContain("reading: めんどう");
  });

  it("shows a dash for an absent promptLabel but still emits targetForm", () => {
    const { promptLabel, ...rest } = baseQuestion;
    void promptLabel;
    const message = buildQuestionReportMessage({
      question: rest as PracticeQuestion,
      reason: "typo",
      language: "zh-Hant"
    });
    const lines = message.split("\n");
    expect(lines).toContain("promptLabel: -"); // missing -> dash, never "undefined"
    expect(lines).toContain("targetForm: reading"); // targetForm always present
    expect(message).not.toContain("undefined");
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
    // The full structured metadata block survives the cap (only detail trims).
    expect(message).toContain("q-demo-001");
    expect(message).toContain("v-demo"); // vocab id
    expect(message).toContain("めんどう"); // vocab reading
    expect(message).toContain("漢字読み"); // promptLabel
    expect(message).toContain("reading"); // targetForm
  });
});
