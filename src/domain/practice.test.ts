import { describe, expect, it, vi } from "vitest";
import { vocabulary } from "./vocabulary";
import { buildClozeQuestionPool, type ClozeSentence } from "./cloze";
import { clozeSentences } from "./cloze-data";
import { buildExamQuestionPool } from "./examBlocks";
import {
  buildChoiceOptions,
  buildQuestionPool,
  getMistakeQuestions,
  getReviewQueue,
  readingSimilarity,
  reduceAdjacentClusters,
  scoreAttempt,
  shuffleQuestions
} from "./practice";
import type { VocabularyItem } from "./types";

describe("buildClozeQuestionPool", () => {
  it("turns seed sentences into PracticeQuestion objects with curated options", () => {
    const questions = buildClozeQuestionPool(clozeSentences, vocabulary);

    expect(questions.length).toBeGreaterThan(0);
    const matsuTe = questions.find((question) => question.id === "cloze:te-request-matsu");
    expect(matsuTe).toBeDefined();
    expect(matsuTe!.expectedAnswers).toContain("待って");
    expect(matsuTe!.options).toHaveLength(4);
    expect(matsuTe!.options).toContain("待って");
    expect(matsuTe!.promptText).toContain("＿＿＿");
    expect(matsuTe!.promptLabel).toContain("〜てください");
  });

  it("uses distinct same-verb forms (not random other words) as cloze distractors", () => {
    const questions = buildClozeQuestionPool(clozeSentences, vocabulary);
    const matsuTe = questions.find((question) => question.id === "cloze:te-request-matsu");

    expect(matsuTe).toBeDefined();
    expect(matsuTe!.options!.every((option) => option.startsWith("待"))).toBe(true);
  });

  it("produces desiderative answers for たいです patterns", () => {
    const questions = buildClozeQuestionPool(clozeSentences, vocabulary);
    const nomuTai = questions.find((question) => question.id === "cloze:tai-nomu-water");

    expect(nomuTai).toBeDefined();
    expect(nomuTai!.expectedAnswers).toContain("飲みたい");
    expect(nomuTai!.options).toContain("飲みたい");
    expect(nomuTai!.options!.every((option) => option.startsWith("飲"))).toBe(true);
  });

  it("filters by JLPT level", () => {
    const all = buildClozeQuestionPool(clozeSentences, vocabulary, { level: "all" });
    const n5 = buildClozeQuestionPool(clozeSentences, vocabulary, { level: "N5" });
    const n1 = buildClozeQuestionPool(clozeSentences, vocabulary, { level: "N1" });

    expect(all.length).toBeGreaterThan(0);
    expect(n5.length).toEqual(all.length);
    expect(n1.length).toEqual(0);
  });

  it("localizes cloze explanations and instructions (#427)", () => {
    const questions = buildClozeQuestionPool(clozeSentences, vocabulary);
    const matsuTe = questions.find((question) => question.id === "cloze:te-request-matsu");

    expect(matsuTe).toBeDefined();
    expect(matsuTe!.explanation).toContain("句意：");
    expect(matsuTe!.explanationI18n?.en).toContain("Grammar point:");
    expect(matsuTe!.explanationI18n?.en).toContain("待って");
    expect(matsuTe!.explanationI18n?.ja).toContain("文法ポイント：");
    expect(matsuTe!.instructionI18n?.en).toBeTruthy();
    expect(matsuTe!.instructionI18n?.ja).toBeTruthy();
  });

  it("threads cloze translationI18n into promptContext and the meaning line (#427)", () => {
    const sentence: ClozeSentence = {
      id: "test-te",
      prefix: "ここで",
      suffix: "ください。",
      vocabularyId: "matsu",
      targetForm: "te",
      grammarPoint: "〜てください",
      translationZh: "請在這裡等。",
      translationI18n: { en: "Please wait here.", ja: "ここで待ってください。" }
    };

    const [question] = buildClozeQuestionPool([sentence], vocabulary);
    expect(question.promptContextI18n?.en).toBe("Please wait here.");
    expect(question.explanationI18n?.en).toContain("Sentence meaning: Please wait here.");
    expect(question.explanationI18n?.ja).toContain("文の意味：ここで待ってください。");
  });
});

describe("buildExamQuestionPool", () => {
  it("builds original exam-style grammar questions for N1, N2, and N3", () => {
    const questions = buildExamQuestionPool("all");

    expect(questions.length).toBeGreaterThanOrEqual(50);
    expect(questions.every((question) => question.vocabulary.tags.includes("exam_style"))).toBe(true);
    // The default pool focuses on N1/N2 + a small N3 warm-up; N4/N5 are
    // excluded here (reachable only via the explicit n4n5 range).
    expect(
      questions.every(
        (question) =>
          question.vocabulary.level === "N1" ||
          question.vocabulary.level === "N2" ||
          question.vocabulary.level === "N3"
      )
    ).toBe(true);
    expect(questions.some((question) => question.vocabulary.level === "N1")).toBe(true);
    expect(questions.some((question) => question.vocabulary.level === "N2")).toBe(true);
    expect(questions.some((question) => question.vocabulary.level === "N3")).toBe(true);
    // The default pool must not pull in N4/N5 seed items.
    expect(questions.some((question) => question.vocabulary.level === "N4")).toBe(false);
    expect(questions.some((question) => question.vocabulary.level === "N5")).toBe(false);
    // promptLabel must NOT leak the JLPT level (N1–N5) back to the user.
    // Word boundary (\b) matches the importer + contentGuard check, so a
    // no-space "N3文法" leak is caught here too.
    expect(
      questions.every((question) => !/^N[1-5]\b/.test(question.promptLabel ?? ""))
    ).toBe(true);
  });

  it("filters exam-style questions by JLPT level", () => {
    expect(buildExamQuestionPool("N1").every((question) => question.vocabulary.level === "N1")).toBe(true);
    expect(buildExamQuestionPool("N2").every((question) => question.vocabulary.level === "N2")).toBe(true);
    expect(buildExamQuestionPool("N3").every((question) => question.vocabulary.level === "N3")).toBe(true);
    // N4/N5 now have seed exam content, so their pools filter to that level.
    expect(buildExamQuestionPool("N4").every((question) => question.vocabulary.level === "N4")).toBe(true);
    const n5 = buildExamQuestionPool("N5");
    expect(n5.length).toBeGreaterThan(0);
    expect(n5.every((question) => question.vocabulary.level === "N5")).toBe(true);
  });

  it("caps N3 items in the default pool so they don't dilute N1/N2 focus", () => {
    const defaultPool = buildExamQuestionPool("all");
    const allN3 = buildExamQuestionPool("N3");
    const n3InDefault = defaultPool.filter((q) => q.vocabulary.level === "N3").length;
    // Default pool keeps a small N3 warm-up but strictly less than the
    // full N3 set, so N1/N2 dominate the random sequence.
    expect(n3InDefault).toBeLessThan(allN3.length);
    expect(n3InDefault).toBeGreaterThan(0);
    // And N3 should be at most ~10% of the default pool.
    expect(n3InDefault / defaultPool.length).toBeLessThan(0.1);
  });
});

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

  it("threads explanationI18n from the conjugator into pool questions (#427)", () => {
    const questions = buildQuestionPool(vocabulary, {
      partOfSpeech: "mixed",
      verbGroup: "all",
      targetForms: ["te", "reading", "meaning", "plainPastNegative"]
    });

    expect(questions.length).toBeGreaterThan(0);
    for (const question of questions) {
      expect(question.explanationI18n?.en, `${question.id}:en`).toBeTruthy();
      expect(question.explanationI18n?.ja, `${question.id}:ja`).toBeTruthy();
    }
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

  it("returns a populated pool for the N5 filter (existing Minna no Nihongo vocabulary)", () => {
    const n5Questions = buildQuestionPool(vocabulary, {
      partOfSpeech: "verb",
      verbGroup: "godan",
      targetForms: ["te"],
      level: "N5"
    });

    expect(n5Questions.length).toBeGreaterThan(0);
    expect(n5Questions.every((question) => question.vocabulary.level === "N5")).toBe(true);
    expect(n5Questions.some((question) => question.vocabulary.surface === "書く")).toBe(true);
  });

  it("filters by JLPT level when one is selected", () => {
    const n2Questions = buildQuestionPool(vocabulary, {
      partOfSpeech: "mixed",
      verbGroup: "all",
      targetForms: ["reading"],
      level: "N2"
    });
    const n1Questions = buildQuestionPool(vocabulary, {
      partOfSpeech: "mixed",
      verbGroup: "all",
      targetForms: ["reading"],
      level: "N1"
    });

    expect(n2Questions.length).toBeGreaterThan(0);
    expect(n2Questions.every((question) => question.vocabulary.level === "N2")).toBe(true);
    expect(n1Questions.every((question) => question.vocabulary.level === "N1")).toBe(true);
    expect(n2Questions.some((question) => question.vocabulary.surface === "影響")).toBe(true);
    expect(n1Questions.some((question) => question.vocabulary.surface === "蹂躙")).toBe(true);
  });

  it("builds meaning questions with the Chinese meaning as the expected answer", () => {
    const questions = buildQuestionPool(vocabulary, {
      partOfSpeech: "mixed",
      verbGroup: "all",
      targetForms: ["meaning"],
      level: "N1"
    });
    const target = questions.find((question) => question.vocabulary.surface === "蹂躙");

    expect(target).toBeDefined();
    expect(target!.expectedAnswers).toEqual(["蹂躪、踐踏"]);
  });

  it("supports reading questions for any part of speech", () => {
    const questions = buildQuestionPool(vocabulary, {
      partOfSpeech: "mixed",
      verbGroup: "all",
      targetForms: ["reading"],
      level: "N1"
    });
    const target = questions.find((question) => question.vocabulary.surface === "蹂躙");

    expect(target).toBeDefined();
    expect(target!.expectedAnswers).toEqual(["じゅうりん"]);
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
  it("records exam-style prompt text and stable question id", () => {
    const question = buildExamQuestionPool("N2")[0];
    const attempt = scoreAttempt(question, question.expectedAnswers[0], 1000, 1800);

    expect(attempt).toMatchObject({
      questionId: question.id,
      vocabularyId: question.vocabulary.id,
      prompt: question.promptText,
      isCorrect: true
    });
  });

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
  it("uses curated exam-style options before generated distractors", () => {
    const questions = buildExamQuestionPool("N1");
    const target = questions.find((question) => question.id === "n1-grammar-nakushitewa");

    expect(target).toBeDefined();

    const options = buildChoiceOptions(target!, questions, 0);

    expect(options).toContain("なくしては");
    expect(options).toContain("にしては");
    expect(options).toHaveLength(4);
  });

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

  it("includes the na-adjective wrong rule when testing i-adjective negation", () => {
    const questions = buildQuestionPool(vocabulary, {
      partOfSpeech: "i_adjective",
      verbGroup: "all",
      targetForms: ["plainPresentNegative"]
    });
    const target = questions.find((question) => question.vocabulary.surface === "高い");

    expect(target).toBeDefined();

    const options = buildChoiceOptions(target!, questions, 0);

    expect(options).toContain("高くない");
    expect(options).toContain("高ではない");
    expect(options.every((option) => option.startsWith("高"))).toBe(true);
  });

  it("includes the i-adjective wrong rule when testing na-adjective negation", () => {
    const questions = buildQuestionPool(vocabulary, {
      partOfSpeech: "na_adjective",
      verbGroup: "all",
      targetForms: ["plainPresentNegative"]
    });
    const target = questions.find((question) => question.vocabulary.surface === "静か");

    expect(target).toBeDefined();

    const options = buildChoiceOptions(target!, questions, 0);

    expect(options).toContain("静かではない");
    expect(options).toContain("静かくない");
  });

  it("includes the i-adjective wrong rule when testing noun negation", () => {
    const questions = buildQuestionPool(vocabulary, {
      partOfSpeech: "noun",
      verbGroup: "all",
      targetForms: ["plainPresentNegative"]
    });
    const target = questions.find((question) => question.vocabulary.surface === "学生");

    expect(target).toBeDefined();

    const options = buildChoiceOptions(target!, questions, 0);

    expect(options).toContain("学生ではない");
    expect(options).toContain("学生くない");
  });

  it("generates wrong-rule distractors for potential form", () => {
    const questions = buildQuestionPool(vocabulary, {
      partOfSpeech: "verb",
      verbGroup: "ichidan",
      targetForms: ["potential"]
    });
    const target = questions.find((question) => question.vocabulary.surface === "食べる");

    expect(target).toBeDefined();

    const options = buildChoiceOptions(target!, questions, 0);

    expect(options).toContain("食べられる");
    expect(options).toContain("食べれる");
    expect(options.every((option) => option.startsWith("食べ"))).toBe(true);
  });

  it("generates wrong-rule distractors for conditional form", () => {
    const questions = buildQuestionPool(vocabulary, {
      partOfSpeech: "verb",
      verbGroup: "godan",
      targetForms: ["conditional"]
    });
    const target = questions.find((question) => question.vocabulary.surface === "書く");

    expect(target).toBeDefined();
    expect(target!.expectedAnswers).toContain("書けば");

    const options = buildChoiceOptions(target!, questions, 0);

    expect(options).toContain("書けば");
    expect(options.every((option) => option.startsWith("書"))).toBe(true);
  });

  it("generates wrong-rule distractors for volitional form", () => {
    const questions = buildQuestionPool(vocabulary, {
      partOfSpeech: "verb",
      verbGroup: "godan",
      targetForms: ["volitional"]
    });
    const target = questions.find((question) => question.vocabulary.surface === "書く");

    expect(target).toBeDefined();

    const options = buildChoiceOptions(target!, questions, 0);

    expect(options).toContain("書こう");
    expect(options.every((option) => option.startsWith("書"))).toBe(true);
    expect(options.filter((option) => option !== "書こう").every((option) => /[うよ]う?$/.test(option))).toBe(true);
  });

  it("generates wrong-rule distractors for causative form, including the ichidan-style mistake", () => {
    const questions = buildQuestionPool(vocabulary, {
      partOfSpeech: "verb",
      verbGroup: "godan",
      targetForms: ["causative"]
    });
    const target = questions.find((question) => question.vocabulary.surface === "帰る");

    expect(target).toBeDefined();

    const options = buildChoiceOptions(target!, questions, 0);

    expect(options).toContain("帰らせる");
    expect(options).toContain("帰させる");
    expect(options.every((option) => option.startsWith("帰"))).toBe(true);
  });

  it("generates wrong-rule distractors for passive form", () => {
    const questions = buildQuestionPool(vocabulary, {
      partOfSpeech: "verb",
      verbGroup: "godan",
      targetForms: ["passive"]
    });
    const target = questions.find((question) => question.vocabulary.surface === "書く");

    expect(target).toBeDefined();

    const options = buildChoiceOptions(target!, questions, 0);

    expect(options).toContain("書かれる");
    expect(options.every((option) => option.startsWith("書"))).toBe(true);
    expect(options.filter((option) => option !== "書かれる").every((option) => option.endsWith("れる"))).toBe(true);
  });

  it("uses other words' meanings as distractors for meaning questions", () => {
    const questions = buildQuestionPool(vocabulary, {
      partOfSpeech: "mixed",
      verbGroup: "all",
      targetForms: ["meaning"],
      level: "N1"
    });
    const target = questions.find((question) => question.vocabulary.surface === "蹂躙");

    expect(target).toBeDefined();

    const options = buildChoiceOptions(target!, questions, 0);

    expect(options).toContain("蹂躪、踐踏");
    expect(options).toHaveLength(4);
    // distractors should be Chinese meanings, not kana
    const distractors = options.filter((option) => option !== "蹂躪、踐踏");
    expect(distractors.every((option) => /^[぀-ゟ]+$/.test(option))).toBe(false);
  });

  it("uses other words' readings as distractors for reading questions", () => {
    const questions = buildQuestionPool(vocabulary, {
      partOfSpeech: "mixed",
      verbGroup: "all",
      targetForms: ["reading"],
      level: "N2"
    });
    const target = questions.find((question) => question.vocabulary.surface === "影響");

    expect(target).toBeDefined();

    const options = buildChoiceOptions(target!, questions, 0);

    expect(options).toContain("えいきょう");
    expect(options).toHaveLength(4);
    expect(options.every((option) => /^[぀-ゟ]+$/.test(option))).toBe(true);
  });

  it("includes the cross-category wrong rule for the adverbial form", () => {
    const iAdjQuestions = buildQuestionPool(vocabulary, {
      partOfSpeech: "i_adjective",
      verbGroup: "all",
      targetForms: ["adverbial"]
    });
    const iAdjTarget = iAdjQuestions.find((question) => question.vocabulary.surface === "高い");
    expect(iAdjTarget).toBeDefined();
    expect(buildChoiceOptions(iAdjTarget!, iAdjQuestions, 0)).toContain("高に");

    const naAdjQuestions = buildQuestionPool(vocabulary, {
      partOfSpeech: "na_adjective",
      verbGroup: "all",
      targetForms: ["adverbial"]
    });
    const naAdjTarget = naAdjQuestions.find((question) => question.vocabulary.surface === "静か");
    expect(naAdjTarget).toBeDefined();
    expect(buildChoiceOptions(naAdjTarget!, naAdjQuestions, 0)).toContain("静かく");
  });
});

describe("readingSimilarity", () => {
  it("scores same-length, edge-sharing readings above unrelated ones", () => {
    // えいきょう vs かんきょう: same 5-length, shared き/ょ/う, same coda.
    // えいきょう vs くに: different length, no overlap.
    const close = readingSimilarity("えいきょう", "かんきょう");
    const far = readingSimilarity("えいきょう", "くに");
    expect(close).toBeGreaterThan(far);
  });

  it("rewards matching mora count", () => {
    // Same length (4) should outscore a 2-length candidate even if the
    // shorter one shares the onset.
    const sameLen = readingSimilarity("けいけん", "けいざい");
    const shorter = readingSimilarity("けいけん", "けん");
    expect(sameLen).toBeGreaterThan(shorter);
  });
});

describe("buildChoiceOptions (vocab reading distractors)", () => {
  const mk = (id: string, surface: string, reading: string): VocabularyItem => ({
    id,
    surface,
    reading,
    meaningZh: "test",
    partOfSpeech: "noun",
    group: null,
    lesson: null,
    tags: [],
    examples: [],
    level: "N2"
  });

  // Nine 4-kana readings + three 2-kana ones. The 4-kana group is big
  // enough (>= DISTRACTOR_BAND) that the similarity band for any 4-kana
  // answer is entirely 4-kana, which lets us assert length-preference
  // deterministically while still having room for variety.
  const readingVocab: VocabularyItem[] = [
    mk("v1", "経験", "けいけん"),
    mk("v2", "経済", "けいざい"),
    mk("v3", "社会", "しゃかい"),
    mk("v4", "解決", "かいけつ"),
    mk("v5", "賛成", "さんせい"),
    mk("v6", "関係", "かんけい"),
    mk("v7", "種類", "しゅるい"),
    mk("v8", "貯金", "ちょきん"),
    mk("v9", "公開", "こうかい"),
    mk("s1", "国", "くに"),
    mk("s2", "山", "やま"),
    mk("s3", "川", "かわ")
  ];

  const readingQuestions = buildQuestionPool(readingVocab, {
    partOfSpeech: "noun",
    verbGroup: "all",
    targetForms: ["reading"]
  });
  const fourKana = readingQuestions.filter((q) => q.expectedAnswers[0].length === 4);

  it("always returns 4 options including the correct reading", () => {
    for (let i = 0; i < readingQuestions.length; i++) {
      const options = buildChoiceOptions(readingQuestions[i], readingQuestions, i);
      expect(options).toHaveLength(4);
      expect(options).toContain(readingQuestions[i].expectedAnswers[0]);
    }
  });

  it("does not give every question the same distractor set (the shared-options bug)", () => {
    // The old `.slice(0, 3)` handed nearly every question the same first
    // three pool entries. Band + seeded sample must spread them out.
    const distractorSets = fourKana.map((question) => {
      const index = readingQuestions.indexOf(question);
      const answer = question.expectedAnswers[0];
      return buildChoiceOptions(question, readingQuestions, index)
        .filter((option) => option !== answer)
        .slice()
        .sort()
        .join("|");
    });
    const uniqueSets = new Set(distractorSets);
    // 9 four-kana questions -> expect a healthy spread of distinct sets.
    expect(uniqueSets.size).toBeGreaterThanOrEqual(6);
  });

  it("uses voicing/length perturbations of the answer as reading distractors", () => {
    // Reading distractors now perturb the answer (voicing / long vowel /
    // gemination) rather than pulling other words' readings. 公開 こうかい
    // has exactly three perturbations -- ごうかい (こ->ご), こうがい (か->が),
    // こうか (drop the long vowel) -- so こうがい must appear as an option.
    const target = readingQuestions.find((q) => q.expectedAnswers[0] === "こうかい")!;
    const index = readingQuestions.indexOf(target);
    const options = buildChoiceOptions(target, readingQuestions, index);
    expect(options).toContain("こうがい");
  });

  it("is stable across repeated calls (no per-render reshuffle)", () => {
    const q = readingQuestions[0];
    const first = buildChoiceOptions(q, readingQuestions, 0);
    const second = buildChoiceOptions(q, readingQuestions, 0);
    expect(first).toEqual(second);
  });

  it("leaves a baked 漢字読み item on its authored options (no perturbation)", () => {
    // A reading item that ships baked options must keep using them -- the
    // perturbation path is only for option-less vocab reading drills.
    const baked = buildExamQuestionPool("all").find(
      (q) => q.promptLabel === "漢字読み" && (q.options?.length ?? 0) > 0
    );
    expect(baked).toBeDefined();
    const options = buildChoiceOptions(baked!, [baked!], 0);
    const authored = new Set([...baked!.expectedAnswers, ...(baked!.options ?? [])]);
    expect(new Set(options)).toEqual(authored);
  });
});

describe("reduceAdjacentClusters", () => {
  it("removes avoidable adjacent same-key pairs", () => {
    const items = ["a1", "a2", "a3", "b1", "b2", "c1"];
    const key = (s: string) => s[0];
    const spread = reduceAdjacentClusters(items, key);
    for (let i = 1; i < spread.length; i++) {
      expect(key(spread[i])).not.toBe(key(spread[i - 1]));
    }
  });

  it("preserves the exact multiset of items", () => {
    const items = ["a1", "a2", "a3", "b1", "b2", "c1"];
    const spread = reduceAdjacentClusters(items, (s) => s[0]);
    expect([...spread].sort()).toEqual([...items].sort());
  });

  it("leaves unavoidable runs in place without looping forever", () => {
    // All same key: nothing can be de-run, but it must terminate and
    // preserve the items.
    const items = ["a1", "a2", "a3"];
    const spread = reduceAdjacentClusters(items, () => "same");
    expect([...spread].sort()).toEqual([...items].sort());
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

describe("getReviewQueue", () => {
  // The wrapper around the mistake pool (see srs.ts). Verifies the
  // caller-visible contract: an attempt history + a pool -> the questions
  // whose most recent attempt was wrong. The box reset/promote state machine
  // is covered in srs.test.ts; here we just check the wrapper delegates.
  const pool = buildQuestionPool(vocabulary, {
    partOfSpeech: "verb",
    verbGroup: "godan",
    targetForms: ["te"]
  }).slice(0, 3);

  it("returns an empty queue when no attempts have been made", () => {
    expect(getReviewQueue([], pool)).toEqual([]);
  });

  it("adds a just-missed question immediately -- no cooldown (#525)", () => {
    const wrong = scoreAttempt(pool[0], "wrong", 1000, 1500);
    expect(getReviewQueue([wrong], pool)).toEqual([pool[0]]);
  });

  it("removes a question after one correct answer", () => {
    const wrong = scoreAttempt(pool[0], "wrong", 1000, 1500);
    const right = scoreAttempt(pool[0], pool[0].expectedAnswers[0], 2000, 2300);
    expect(getReviewQueue([wrong, right], pool)).toEqual([]);
  });

  it("re-adds a question that was answered correctly then missed again", () => {
    const right = scoreAttempt(pool[0], pool[0].expectedAnswers[0], 1000, 1300);
    const wrong = scoreAttempt(pool[0], "wrong", 2000, 2500);
    expect(getReviewQueue([right, wrong], pool)).toEqual([pool[0]]);
  });

  it("orders the queue with the oldest unresolved miss first", () => {
    const olderMiss = scoreAttempt(pool[0], "wrong", 1000, 1500);
    const newerMiss = scoreAttempt(pool[1], "wrong", 3000, 3500);
    const queue = getReviewQueue([olderMiss, newerMiss], pool);
    expect(queue.map((q) => q.id)).toEqual([pool[0].id, pool[1].id]);
  });

  it("deduplicates a question that has been missed multiple times", () => {
    const miss1 = scoreAttempt(pool[0], "wrong", 1000, 1500);
    const miss2 = scoreAttempt(pool[0], "wrong-again", 2000, 2500);
    expect(getReviewQueue([miss1, miss2], pool)).toEqual([pool[0]]);
  });
});
