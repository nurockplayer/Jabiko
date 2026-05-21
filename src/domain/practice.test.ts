import { describe, expect, it } from "vitest";
import { vocabulary } from "./vocabulary";
import { buildQuestionPool, getMistakeQuestions, scoreAttempt } from "./practice";

describe("buildQuestionPool", () => {
  it("filters questions by part of speech, verb group, and selected forms", () => {
    const questions = buildQuestionPool(vocabulary, {
      partOfSpeech: "verb",
      verbGroup: "godan",
      targetForms: ["te"]
    });

    expect(questions.length).toBeGreaterThan(0);
    expect(questions.every((question) => question.vocabulary.partOfSpeech === "verb")).toBe(true);
    expect(questions.every((question) => question.vocabulary.group === "godan")).toBe(true);
    expect(questions.every((question) => question.targetForm === "te")).toBe(true);
    expect(questions.find((question) => question.vocabulary.surface === "書く")?.expectedAnswers).toEqual(["書いて"]);
  });

  it("includes adjective questions only for adjective-compatible forms", () => {
    const questions = buildQuestionPool(vocabulary, {
      partOfSpeech: "i_adjective",
      verbGroup: "all",
      targetForms: ["negativeTe", "negativeContinuative", "plainPastNegative"]
    });

    expect(questions.every((question) => question.vocabulary.partOfSpeech === "i_adjective")).toBe(true);
    expect(questions.some((question) => question.targetForm === "negativeTe")).toBe(false);
    expect(questions.some((question) => question.targetForm === "negativeContinuative")).toBe(true);
    expect(
      questions.find((question) => question.vocabulary.surface === "高い" && question.targetForm === "plainPastNegative")
        ?.expectedAnswers
    ).toEqual(["高くなかった"]);
  });

  it("builds noun-like practice questions for plain and negative connective forms", () => {
    const questions = buildQuestionPool(vocabulary, {
      partOfSpeech: "noun",
      verbGroup: "all",
      targetForms: ["plainPastAffirmative", "negativeContinuative"]
    });

    expect(questions.length).toBeGreaterThan(0);
    expect(questions.every((question) => question.vocabulary.partOfSpeech === "noun")).toBe(true);
    expect(questions.find((question) => question.vocabulary.surface === "学生" && question.targetForm === "plainPastAffirmative")?.expectedAnswers).toEqual(["学生だった"]);
    expect(questions.find((question) => question.vocabulary.surface === "学生" && question.targetForm === "negativeContinuative")?.expectedAnswers).toEqual([
      "学生ではなくて",
      "学生じゃなくて"
    ]);
  });
});

describe("scoreAttempt", () => {
  it("records correct answers with timing metadata", () => {
    const question = buildQuestionPool(vocabulary, {
      partOfSpeech: "verb",
      verbGroup: "ichidan",
      targetForms: ["te"]
    }).find((candidate) => candidate.vocabulary.surface === "食べる");

    expect(question).toBeDefined();

    const attempt = scoreAttempt(question!, " 食べて。", 1000, 2400);

    expect(attempt).toMatchObject({
      vocabularyId: "taberu",
      targetForm: "te",
      submittedAnswer: " 食べて。",
      isCorrect: true,
      responseTimeMs: 1400
    });
  });
});

describe("getMistakeQuestions", () => {
  it("returns missed questions for immediate review", () => {
    const question = buildQuestionPool(vocabulary, {
      partOfSpeech: "verb",
      verbGroup: "godan",
      targetForms: ["te"]
    })[0];
    const wrongAttempt = scoreAttempt(question, "wrong", 1000, 1800);
    const rightAttempt = scoreAttempt(question, question.expectedAnswers[0], 2000, 2300);

    expect(getMistakeQuestions([wrongAttempt, rightAttempt], [question])).toEqual([question]);
  });
});
