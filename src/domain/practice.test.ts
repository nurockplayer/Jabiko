import { describe, expect, it, vi } from "vitest";
import { vocabulary } from "./vocabulary";
import {
  buildChoiceOptions,
  buildQuestionPool,
  getMistakeQuestions,
  scoreAttempt,
  shuffleQuestions
} from "./practice";

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

  it("filters out trivial questions where the expected answer equals the prompt surface", () => {
    const questions = buildQuestionPool(vocabulary, {
      partOfSpeech: "verb",
      verbGroup: "godan",
      targetForms: ["dictionary", "plainPresentAffirmative", "te"]
    });

    expect(questions.some((question) => question.targetForm === "te")).toBe(true);
    expect(questions.some((question) => question.targetForm === "dictionary")).toBe(false);
    expect(questions.some((question) => question.targetForm === "plainPresentAffirmative")).toBe(false);
  });

  it("keeps plainPresentAffirmative for na-adjectives and nouns since they add だ", () => {
    const questions = buildQuestionPool(vocabulary, {
      partOfSpeech: "na_adjective",
      verbGroup: "all",
      targetForms: ["plainPresentAffirmative"]
    });

    expect(questions.length).toBeGreaterThan(0);
    expect(
      questions.find((question) => question.vocabulary.surface === "静か")?.expectedAnswers
    ).toEqual(["静かだ"]);
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

describe("buildChoiceOptions", () => {
  it("uses other te-form rules of the same verb as distractors", () => {
    const questions = buildQuestionPool(vocabulary, {
      partOfSpeech: "verb",
      verbGroup: "godan",
      targetForms: ["te"]
    });
    const target = questions.find((question) => question.vocabulary.surface === "帰る");

    expect(target).toBeDefined();

    const options = buildChoiceOptions(target!, questions, 0);

    expect(options).toContain("帰って");
    expect(options).toHaveLength(4);
    expect(options.every((option) => option.startsWith("帰"))).toBe(true);
    expect(options.filter((option) => option !== "帰って").every((option) => /[てで]$/.test(option))).toBe(true);
  });

  it("includes the classic ichidan mistake when testing te-form of る-ending godan verbs", () => {
    const questions = buildQuestionPool(vocabulary, {
      partOfSpeech: "verb",
      verbGroup: "godan",
      targetForms: ["te"]
    });
    const target = questions.find((question) => question.vocabulary.surface === "帰る");

    expect(target).toBeDefined();

    const options = buildChoiceOptions(target!, questions, 0);
    const distractors = options.filter((option) => option !== "帰って");

    // expect rule-based wrong attempts to dominate (not other words' answers)
    expect(distractors.every((option) => option.startsWith("帰"))).toBe(true);
  });

  it("uses ta-form rule variants as distractors", () => {
    const questions = buildQuestionPool(vocabulary, {
      partOfSpeech: "verb",
      verbGroup: "godan",
      targetForms: ["ta"]
    });
    const target = questions.find((question) => question.vocabulary.surface === "読む");

    expect(target).toBeDefined();

    const options = buildChoiceOptions(target!, questions, 0);

    expect(options).toContain("読んだ");
    expect(options.every((option) => option.startsWith("読"))).toBe(true);
    expect(options.filter((option) => option !== "読んだ").every((option) => /[ただ]$/.test(option))).toBe(true);
  });

  it("falls back to same-word other-form distractors for irregular verbs", () => {
    const questions = buildQuestionPool(vocabulary, {
      partOfSpeech: "verb",
      verbGroup: "irregular",
      targetForms: ["te"]
    });
    const target = questions.find((question) => question.vocabulary.surface === "勉強する");

    expect(target).toBeDefined();

    const options = buildChoiceOptions(target!, questions, 0);

    expect(options).toContain("勉強して");
    expect(options.every((option) => option.startsWith("勉強"))).toBe(true);
  });

  it("does not duplicate the prompt word in choice options", () => {
    const questions = buildQuestionPool(vocabulary, {
      partOfSpeech: "verb",
      verbGroup: "godan",
      targetForms: ["te"]
    });
    const target = questions.find((question) => question.vocabulary.surface === "聞く");

    expect(target).toBeDefined();

    const options = buildChoiceOptions(target!, questions, 0);

    expect(options).not.toContain("聞く");
  });

  it("uses same-word distractors for adjective practice", () => {
    const questions = buildQuestionPool(vocabulary, {
      partOfSpeech: "i_adjective",
      verbGroup: "all",
      targetForms: ["plainPresentNegative"]
    });
    const target = questions.find((question) => question.vocabulary.surface === "高い");

    expect(target).toBeDefined();

    const options = buildChoiceOptions(target!, questions, 0);

    expect(options).toContain("高くない");
    expect(options.every((option) => option.startsWith("高"))).toBe(true);
  });
});

describe("shuffleQuestions", () => {
  it("returns the same set of questions", () => {
    const pool = buildQuestionPool(vocabulary, {
      partOfSpeech: "verb",
      verbGroup: "all",
      targetForms: ["te"]
    });

    const shuffled = shuffleQuestions(pool);

    expect(shuffled).toHaveLength(pool.length);
    expect(new Set(shuffled.map((question) => question.id))).toEqual(
      new Set(pool.map((question) => question.id))
    );
  });

  it("does not mutate the input pool", () => {
    const pool = buildQuestionPool(vocabulary, {
      partOfSpeech: "verb",
      verbGroup: "godan",
      targetForms: ["te"]
    });
    const originalOrder = pool.map((question) => question.id);

    vi.spyOn(Math, "random").mockReturnValue(0); // forces reordering
    shuffleQuestions(pool);

    expect(pool.map((question) => question.id)).toEqual(originalOrder);
  });

  it("reorders questions when Math.random returns 0", () => {
    const pool = buildQuestionPool(vocabulary, {
      partOfSpeech: "verb",
      verbGroup: "godan",
      targetForms: ["te"]
    });
    const originalOrder = pool.map((question) => question.id);

    vi.spyOn(Math, "random").mockReturnValue(0);
    const shuffled = shuffleQuestions(pool).map((question) => question.id);

    expect(shuffled).not.toEqual(originalOrder);
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
