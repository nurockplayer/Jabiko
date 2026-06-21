import { describe, expect, it } from "vitest";
import { buildClozeQuestionPool } from "./cloze";
import { clozeSentences } from "./cloze-data";
import { buildExamQuestionPool } from "./examBlocks";
import { levelsForRange } from "./levelRange";
import { buildQuestionPool } from "./practice";
import {
  buildAllKnownQuestions,
  buildModeCounts,
  buildPracticeQuestions,
  composeDailySet,
  uniqueForms,
  type PracticePoolParams
} from "./sessionPools";
import type { PracticeQuestion } from "./types";
import { vocabulary } from "./vocabulary";
import { jlptVocabulary } from "./vocabulary-jlpt";

// Default mode flags = the "basic" drill (every focus flag false). Each
// test flips exactly the flag(s) for the branch it exercises, so the
// branch under test is isolated.
function poolParams(overrides: Partial<PracticePoolParams> = {}): PracticePoolParams {
  return {
    isExamFocus: false,
    isClozeFocus: false,
    isPatternFocus: false,
    isReviewFocus: false,
    isVocabFocus: false,
    isDailyFocus: false,
    partOfSpeech: "verb",
    verbGroup: "godan",
    targetForms: ["te"],
    levelRange: "all",
    reviewQueue: [],
    ...overrides
  };
}

describe("uniqueForms", () => {
  it("dedupes target forms while preserving first-seen order", () => {
    expect(uniqueForms(["te", "ta", "te", "reading", "ta"])).toEqual(["te", "ta", "reading"]);
  });
});

describe("buildModeCounts", () => {
  it("reports a count for every static mode card, matching the live builders", () => {
    const counts = buildModeCounts();

    expect(counts.cloze).toBe(buildClozeQuestionPool(clozeSentences, vocabulary).length);
    expect(counts.exam).toBe(buildExamQuestionPool().length);
    // examN1 / examN2 / examN4 are the 備考 presets (issues #65/#92): the
    // counts come from the matching level RANGE pools, never the default.
    expect(counts.examN1).toBe(buildExamQuestionPool(levelsForRange("n1n2") ?? "all").length);
    expect(counts.examN2).toBe(buildExamQuestionPool(levelsForRange("n2n3") ?? "all").length);
    expect(counts.examN4).toBe(buildExamQuestionPool(levelsForRange("n4n5") ?? "all").length);
    expect(counts.vocab).toBe(
      buildQuestionPool(jlptVocabulary, {
        partOfSpeech: "mixed",
        verbGroup: "all",
        targetForms: ["reading"]
      }).length
    );
  });

  it("derives the examN4 preset from the n4n5 range (N4/N5 only)", () => {
    const counts = buildModeCounts();
    const n4n5 = buildExamQuestionPool(levelsForRange("n4n5") ?? "all");

    expect(counts.examN4).toBeGreaterThan(0);
    expect(counts.examN4).toBe(n4n5.length);
    expect(
      n4n5.every((q) => q.vocabulary.level === "N4" || q.vocabulary.level === "N5")
    ).toBe(true);
  });
});

describe("buildAllKnownQuestions", () => {
  it("unions the exam, cloze, pattern, and full vocab pools", () => {
    const all = buildAllKnownQuestions();
    const exam = buildExamQuestionPool();
    const cloze = buildClozeQuestionPool(clozeSentences, vocabulary);

    expect(all.length).toBeGreaterThan(exam.length + cloze.length);
    const ids = new Set(all.map((q) => q.id));
    // A sample id from each contributing source must be present.
    expect(ids.has(exam[0].id)).toBe(true);
    expect(ids.has(cloze[0].id)).toBe(true);
    // Vocab reading + meaning forms (both requested in the union) appear.
    expect(all.some((q) => q.targetForm === "reading")).toBe(true);
    expect(all.some((q) => q.targetForm === "meaning")).toBe(true);
  });
});

describe("buildPracticeQuestions", () => {
  it("basic mode: builds a shuffled pool for the chosen part of speech / group / form", () => {
    const questions = buildPracticeQuestions(
      poolParams({ partOfSpeech: "verb", verbGroup: "godan", targetForms: ["te"] })
    );

    expect(questions.length).toBeGreaterThan(0);
    expect(questions.every((q) => q.vocabulary.partOfSpeech === "verb")).toBe(true);
    expect(questions.every((q) => q.vocabulary.group === "godan")).toBe(true);
    expect(questions.every((q) => q.targetForm === "te")).toBe(true);
  });

  it("exam mode (綜合, range all): mirrors the default exam pool contents", () => {
    const questions = buildPracticeQuestions(poolParams({ isExamFocus: true, levelRange: "all" }));
    const expected = buildExamQuestionPool("all");

    expect(new Set(questions.map((q) => q.id))).toEqual(new Set(expected.map((q) => q.id)));
  });

  it("exam mode (綜合, n1n2 range): narrows to N1+N2 only", () => {
    const questions = buildPracticeQuestions(poolParams({ isExamFocus: true, levelRange: "n1n2" }));

    expect(questions.length).toBeGreaterThan(0);
    expect(
      questions.every((q) => q.vocabulary.level === "N1" || q.vocabulary.level === "N2")
    ).toBe(true);
  });

  it("exam mode (綜合, n2n3 range): narrows to N2+N3 only", () => {
    const questions = buildPracticeQuestions(poolParams({ isExamFocus: true, levelRange: "n2n3" }));

    expect(questions.length).toBeGreaterThan(0);
    expect(
      questions.every((q) => q.vocabulary.level === "N2" || q.vocabulary.level === "N3")
    ).toBe(true);
  });

  it("exam mode (備考, n4n5 range): narrows to N4+N5 only (#65/#92)", () => {
    const questions = buildPracticeQuestions(poolParams({ isExamFocus: true, levelRange: "n4n5" }));

    expect(questions.length).toBeGreaterThan(0);
    expect(
      questions.every((q) => q.vocabulary.level === "N4" || q.vocabulary.level === "N5")
    ).toBe(true);
  });

  it("exam mode (mock section): filters to the given level + promptLabel", () => {
    // Pick a real (level, promptLabel) pair straight from the N1 pool so
    // the section is guaranteed non-empty.
    const n1 = buildExamQuestionPool("N1");
    const sample = n1.find((q) => q.promptLabel);
    expect(sample).toBeDefined();
    const promptLabel = sample!.promptLabel!;

    const questions = buildPracticeQuestions(
      poolParams({ isExamFocus: true, examSection: { level: "N1", promptLabel } })
    );

    expect(questions.length).toBeGreaterThan(0);
    expect(questions.every((q) => q.vocabulary.level === "N1")).toBe(true);
    expect(questions.every((q) => q.promptLabel === promptLabel)).toBe(true);
  });

  it("cloze mode: returns the cloze pool (same membership)", () => {
    const questions = buildPracticeQuestions(poolParams({ isClozeFocus: true }));
    const expected = buildClozeQuestionPool(clozeSentences, vocabulary);

    expect(new Set(questions.map((q) => q.id))).toEqual(new Set(expected.map((q) => q.id)));
  });

  it("review mode: returns the snapshot queue verbatim (same order, no shuffle)", () => {
    const snapshot = buildExamQuestionPool("N1").slice(0, 3);
    const questions = buildPracticeQuestions(
      poolParams({ isReviewFocus: true, reviewQueue: snapshot })
    );

    expect(questions).toBe(snapshot);
  });

  it("vocab mode: reading-only drill, narrowed by level range", () => {
    const questions = buildPracticeQuestions(poolParams({ isVocabFocus: true, levelRange: "n1n2" }));

    expect(questions.length).toBeGreaterThan(0);
    expect(questions.every((q) => q.targetForm === "reading")).toBe(true);
    expect(
      questions.every((q) => q.vocabulary.level === "N1" || q.vocabulary.level === "N2")
    ).toBe(true);
  });

  it("vocab mode (range all): keeps the whole JLPT vocab reading pool", () => {
    const questions = buildPracticeQuestions(poolParams({ isVocabFocus: true, levelRange: "all" }));
    const expected = buildQuestionPool(jlptVocabulary, {
      partOfSpeech: "mixed",
      verbGroup: "all",
      targetForms: ["reading"]
    });

    expect(new Set(questions.map((q) => q.id))).toEqual(new Set(expected.map((q) => q.id)));
  });

  it("daily mode: composes a finite 今日練習 set from the due snapshot", () => {
    const due = buildExamQuestionPool("N1").slice(0, 4);
    const questions = buildPracticeQuestions(poolParams({ isDailyFocus: true, reviewQueue: due }));

    expect(questions.length).toBeGreaterThan(0);
    expect(questions.length).toBeLessThanOrEqual(20);
    // The due items lead the set (composeDailySet puts reviews first).
    const dueIds = new Set(due.map((q) => q.id));
    const leading = questions.slice(0, due.length);
    expect(leading.every((q) => dueIds.has(q.id))).toBe(true);
  });
});

describe("composeDailySet", () => {
  const makeDue = (n: number): PracticeQuestion[] => buildExamQuestionPool("N1").slice(0, n);

  it("caps the whole set at the daily target of 20", () => {
    expect(composeDailySet([]).length).toBeLessThanOrEqual(20);
    expect(composeDailySet(makeDue(40)).length).toBeLessThanOrEqual(20);
  });

  it("caps due items at half the target so fresh content still fits", () => {
    const due = makeDue(40);
    const set = composeDailySet(due);
    const dueIds = new Set(due.map((q) => q.id));
    const dueInSet = set.filter((q) => dueIds.has(q.id)).length;

    expect(dueInSet).toBeLessThanOrEqual(10);
  });

  it("places the due block first, in its incoming (most-overdue-first) order", () => {
    const due = makeDue(4);
    const set = composeDailySet(due);

    expect(set.slice(0, due.length).map((q) => q.id)).toEqual(due.map((q) => q.id));
  });

  it("never lets a due item reappear in the fresh portion", () => {
    const due = makeDue(4);
    const set = composeDailySet(due);
    const dueIds = new Set(due.map((q) => q.id));
    const fresh = set.slice(due.length);

    expect(fresh.some((q) => dueIds.has(q.id))).toBe(false);
  });

  it("fills the set with fresh vocab + exam items when there are no due reviews", () => {
    const set = composeDailySet([]);

    expect(set.length).toBeGreaterThan(0);
    // With an empty due queue the set is entirely fresh and reserves at
    // least one vocab reading item (DAILY_VOCAB_MIN floor).
    expect(set.some((q) => q.targetForm === "reading")).toBe(true);
  });
});
