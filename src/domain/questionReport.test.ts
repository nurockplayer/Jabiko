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

// 2026-07 report-format rework: the reviewer reads (1) which question,
// (2) what the learner picked and why they reported, (3) the learner's own
// words -- so those lead the message. Everything derivable from the question
// id is compressed into a context block below a `---` separator.
describe("buildQuestionReportMessage", () => {
  it("leads with the id, the essentials line, then the learner's detail", () => {
    const message = buildQuestionReportMessage({
      question: baseQuestion,
      reason: "wrongAnswer",
      detail: "正解が二つあるはず",
      language: "zh-Hant",
      selectedAnswer: "めいわく"
    });
    const lines = message.split("\n");

    expect(lines[0]).toBe("[題目回報 / question report] q-demo-001");
    expect(lines[1]).toBe("reason: wrongAnswer · selected: めいわく · ui: zh-Hant");
    expect(lines[2]).toBe("detail: 正解が二つあるはず");
    // The learner's words sit ABOVE the derived context.
    expect(message.indexOf("detail:")).toBeLessThan(message.indexOf("---"));
  });

  it("compresses the derived question data into the context block", () => {
    const message = buildQuestionReportMessage({
      question: baseQuestion,
      reason: "wrongAnswer",
      language: "zh-Hant"
    });
    const lines = message.split("\n");

    expect(lines).toContain("---");
    expect(lines).toContain("context: 漢字読み · reading · N2 · 面倒");
    expect(lines).toContain("expected: めんどう / めんどうな");
    expect(lines).toContain("prompt: この仕事は面倒だ。");
    // The old one-line-per-field block is gone (all derivable from the id).
    expect(message).not.toContain("vocabId:");
    expect(message).not.toContain("promptLabel:");
    expect(message).not.toContain("targetForm:");
    expect(message).not.toContain("surface:");
  });

  it("renders dashes for missing values and never the word undefined", () => {
    const { promptLabel, ...rest } = baseQuestion;
    void promptLabel;
    const question: PracticeQuestion = {
      ...(rest as PracticeQuestion),
      promptText: undefined,
      vocabulary: { ...baseQuestion.vocabulary, level: undefined }
    };
    const message = buildQuestionReportMessage({
      question,
      reason: "typo",
      language: "zh-Hant",
      selectedAnswer: null
    });
    const lines = message.split("\n");

    expect(lines[1]).toBe("reason: typo · selected: - · ui: zh-Hant");
    expect(lines).toContain("context: - · reading · - · 面倒");
    // No promptText -> the prompt line is omitted entirely.
    expect(message).not.toContain("prompt:");
    expect(message).not.toContain("undefined");
  });

  it("omits the detail line when the learner wrote nothing", () => {
    const message = buildQuestionReportMessage({
      question: baseQuestion,
      reason: "awkwardMeaning",
      language: "zh-Hant"
    });
    expect(message).not.toContain("detail:");
    expect(message).toContain("awkwardMeaning");
  });

  it("trims an over-long prompt inside the context block", () => {
    const question: PracticeQuestion = {
      ...baseQuestion,
      promptText: "あ".repeat(500)
    };
    const message = buildQuestionReportMessage({
      question,
      reason: "other",
      language: "zh-Hant"
    });
    const promptLine = message.split("\n").find((line) => line.startsWith("prompt:"));
    expect(promptLine).toBeDefined();
    expect(promptLine!.length).toBeLessThanOrEqual("prompt: ".length + 161);
    expect(promptLine).toContain("…");
  });

  it("caps at FEEDBACK_MAX with the essentials AND context surviving a huge detail", () => {
    const message = buildQuestionReportMessage({
      question: baseQuestion,
      reason: "other",
      detail: "あ".repeat(FEEDBACK_MAX * 2),
      language: "zh-Hant"
    });
    expect(message.length).toBeLessThanOrEqual(FEEDBACK_MAX);
    // Essentials + context are reserved first; only the detail is trimmed.
    expect(message).toContain("q-demo-001");
    expect(message).toContain("context: 漢字読み · reading · N2 · 面倒");
    expect(message).toContain("expected: めんどう / めんどうな");
    expect(message).toContain("detail: ");
  });

  it("is deterministic for identical input", () => {
    const input = {
      question: baseQuestion,
      reason: "confusingExplanation" as const,
      detail: "わからない",
      language: "zh-Hant" as const,
      selectedAnswer: "めんどう"
    };
    expect(buildQuestionReportMessage(input)).toBe(buildQuestionReportMessage(input));
  });
});
