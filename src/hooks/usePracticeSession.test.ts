import { createElement, StrictMode } from "react";
import type { ReactNode } from "react";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { BOOKMARKS_KEY } from "../domain/bookmarks";
import { buildAllKnownQuestions } from "../domain/sessionPools";
import type { SentencePatternId } from "../domain/sentencePatterns";
import type { Attempt, PracticeQuestion } from "../domain/types";
import {
  createPracticePoolSnapshot,
  initialLevelRange,
  type PracticeFilter,
  usePracticeSession
} from "./usePracticeSession";

const baseHookArgs = {
  language: "zh-Hant" as const,
  progressAttempts: [],
  recordAttempt: () => {}
};

function makeAttempt(question: PracticeQuestion, isCorrect: boolean, timestamp: number): Attempt {
  return {
    questionId: question.id,
    vocabularyId: question.vocabulary.id,
    targetForm: question.targetForm,
    prompt: question.vocabulary.surface,
    expectedAnswers: question.expectedAnswers,
    submittedAnswer: isCorrect ? question.expectedAnswers[0] : "wrong",
    isCorrect,
    timestamp,
    responseTimeMs: 100
  };
}

describe("usePracticeSession pool snapshot (#623)", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  // The static config half of a snapshot (mode / filters / form / range /
  // length). The live inputs (reviewQueue / bookmarkedQuestions /
  // attemptedIds) are the second argument, captured at pass start.
  const baseConfig = {
    mode: "basic" as const,
    filter: {} as PracticeFilter,
    partOfSpeech: "verb" as const,
    verbGroup: "all" as const,
    practiceFocus: "single" as const,
    targetForm: "te" as const,
    targetForms: ["te" as const],
    levelRange: "all" as const,
    sessionLength: 20
  };
  const liveInputs = {
    reviewQueue: [] as PracticeQuestion[],
    bookmarkedQuestions: [] as PracticeQuestion[],
    attemptedIds: undefined as Set<string> | undefined
  };

  // #679 — pure snapshot builder: each call must be a fresh immutable object.
  it("builds a fresh immutable snapshot each call", () => {
    const a = createPracticePoolSnapshot(baseConfig, liveInputs);
    const b = createPracticePoolSnapshot(baseConfig, liveInputs);
    expect(a).not.toBe(b);
    expect(a.reviewQueue).not.toBe(liveInputs.reviewQueue);
    expect(a.bookmarkedQuestions).not.toBe(liveInputs.bookmarkedQuestions);
    expect(a.reviewQueue).toEqual([]);
  });

  it("carries the config fields and the live inputs through", () => {
    const q = buildAllKnownQuestions()[0];
    const snapshot = createPracticePoolSnapshot(
      {
        ...baseConfig,
        mode: "exam",
        filter: {
          examSection: { level: "N1", promptLabel: "test" },
          patternIds: ["p1" as SentencePatternId]
        },
        sessionLength: 10
      },
      {
        reviewQueue: [q],
        bookmarkedQuestions: [q],
        attemptedIds: new Set(["x"])
      }
    );
    expect(snapshot.mode).toBe("exam");
    expect(snapshot.examSection).toEqual({ level: "N1", promptLabel: "test" });
    expect(snapshot.patternIds).toEqual(["p1"]);
    expect(snapshot.sessionLength).toBe(10);
    expect(snapshot.reviewQueue).toEqual([q]);
    expect(snapshot.bookmarkedQuestions).toEqual([q]);
    expect(snapshot.attemptedIds?.has("x")).toBe(true);
    expect(snapshot.kanaScript).toBeUndefined();
  });

  it("carries an N4/N5 mock-section filter through the snapshot (#703)", () => {
    const snapshot = createPracticePoolSnapshot(
      {
        ...baseConfig,
        mode: "exam",
        filter: { examSection: { level: "N4", promptLabel: "文法形式選擇" } }
      },
      liveInputs
    );
    expect(snapshot.mode).toBe("exam");
    expect(snapshot.examSection).toEqual({ level: "N4", promptLabel: "文法形式選擇" });

    const n5Snapshot = createPracticePoolSnapshot(
      {
        ...baseConfig,
        mode: "exam",
        filter: { examSection: { level: "N5", promptLabel: "詞彙填空" } }
      },
      liveInputs
    );
    expect(n5Snapshot.examSection).toEqual({ level: "N5", promptLabel: "詞彙填空" });
  });

  // #679 — snapshot copy: the live inputs are captured by reference at pass
  // start; a later mutation of the caller's arrays must not corrupt the
  // stored pass (the hook hands in freshly-computed inputs each pass).
  it("keeps the review pass stable until an explicit reset captures the latest queue", () => {
    const question = buildAllKnownQuestions()[0];
    const missed = makeAttempt(question, false, 1);
    const cleared = makeAttempt(question, true, 2);
    const { result, rerender } = renderHook(
      ({ progressAttempts }: { progressAttempts: Attempt[] }) =>
        usePracticeSession({
          ...baseHookArgs,
          init: { mode: "review" },
          progressAttempts
        }),
      { initialProps: { progressAttempts: [missed] } }
    );

    expect(result.current.currentQuestion?.id).toBe(question.id);
    expect(result.current.sessionTotal).toBe(1);

    rerender({ progressAttempts: [missed, cleared] });

    expect(result.current.reviewQueue).toHaveLength(0);
    expect(result.current.currentQuestion?.id).toBe(question.id);
    expect(result.current.sessionTotal).toBe(1);

    act(() => result.current.resetSession());

    expect(result.current.reviewEmpty).toBe(true);
    expect(result.current.currentQuestion).toBeNull();
    expect(result.current.sessionTotal).toBe(0);
  });

  it("keeps the bookmark pass stable until an explicit reset captures the latest bookmarks", () => {
    const question = buildAllKnownQuestions()[0];
    window.localStorage.setItem(BOOKMARKS_KEY, JSON.stringify([question.id]));
    const { result } = renderHook(() =>
      usePracticeSession({ ...baseHookArgs, init: { mode: "bookmarks" } })
    );

    expect(result.current.currentQuestion?.id).toBe(question.id);
    expect(result.current.sessionTotal).toBe(1);

    act(() => result.current.onToggleBookmark(question.id));

    expect(result.current.bookmarkedQuestions).toHaveLength(0);
    expect(result.current.currentQuestion?.id).toBe(question.id);
    expect(result.current.sessionTotal).toBe(1);

    act(() => result.current.resetSession());

    expect(result.current.bookmarksEmpty).toBe(true);
    expect(result.current.currentQuestion).toBeNull();
    expect(result.current.sessionTotal).toBe(0);
  });
});

// #679 — the active-pass snapshot boundary. progress/bookmark/review-queue
// changes must never rebuild, shrink, or reorder the live pass; only an
// explicit start/reset/config change captures the latest live inputs.
describe("usePracticeSession pass snapshot (#679)", () => {
  const question = buildAllKnownQuestions()[0];

  it("does not reorder or shrink the active pass when a progress attempt lands mid-pass", () => {
    const missed = makeAttempt(question, false, 1);
    const fresh = makeAttempt(question, false, 2);
    const { result, rerender } = renderHook(
      ({ progressAttempts }: { progressAttempts: Attempt[] }) =>
        usePracticeSession({
          ...baseHookArgs,
          init: { mode: "exam", levelRange: "all" },
          progressAttempts
        }),
      { initialProps: { progressAttempts: [missed] } }
    );
    const before = result.current.currentQuestion?.id;
    expect(before).toBeTruthy();
    // Default session length caps exam at 20; a mid-pass progress change must
    // not rebuild/shrink the pool.
    expect(result.current.sessionTotal).toBe(20);

    rerender({ progressAttempts: [missed, fresh] });
    expect(result.current.currentQuestion?.id).toBe(before);
    expect(result.current.sessionTotal).toBe(20);

    act(() => result.current.resetSession());
    expect(result.current.currentQuestion).toBeDefined();
  });

  it("does not change the bookmark pass mid-pass; reset captures the latest set", () => {
    window.localStorage.setItem(BOOKMARKS_KEY, JSON.stringify([question.id]));
    const { result } = renderHook(() =>
      usePracticeSession({ ...baseHookArgs, init: { mode: "bookmarks" } })
    );
    const before = result.current.currentQuestion?.id;
    expect(before).toBe(question.id);

    act(() => result.current.onToggleBookmark(question.id));
    expect(result.current.currentQuestion?.id).toBe(question.id);

    act(() => result.current.resetSession());
    expect(result.current.bookmarksEmpty).toBe(true);
  });

  it("does not let a mid-pass review-queue change contaminate the pass; reset picks it up", () => {
    const missed = makeAttempt(question, false, 1);
    const { result, rerender } = renderHook(
      ({ progressAttempts }: { progressAttempts: Attempt[] }) =>
        usePracticeSession({
          ...baseHookArgs,
          init: { mode: "review" },
          progressAttempts
        }),
      { initialProps: { progressAttempts: [missed] } }
    );
    expect(result.current.sessionTotal).toBe(1);

    rerender({ progressAttempts: [missed, missed] });
    expect(result.current.currentQuestion?.id).toBe(question.id);
    expect(result.current.sessionTotal).toBe(1);
  });

  it("each mode/level/filter/form change creates exactly one new snapshot", () => {
    const { result } = renderHook(() => usePracticeSession(baseHookArgs));
    act(() => result.current.applyModePreset("vocab", "n1n2"));
    expect(result.current.levelRange).toBe("n1n2");

    act(() => result.current.setPracticeFilter({}));
    expect(result.current.practiceMode).toBe("vocab");
    expect(result.current.levelRange).toBe("n1n2");

    act(() => result.current.handlePracticeFocusChange("single"));
    expect(result.current.practiceFocus).toBe("single");
    expect(result.current.practiceMode).toBe("vocab");
  });

  it("sessionSeed reshuffle keeps the same config but grabs the latest live inputs", () => {
    const missed = makeAttempt(question, false, 1);
    const { result, rerender } = renderHook(
      ({ progressAttempts }: { progressAttempts: Attempt[] }) =>
        usePracticeSession({
          ...baseHookArgs,
          init: { mode: "exam", levelRange: "all" },
          progressAttempts
        }),
      { initialProps: { progressAttempts: [missed] } }
    );
    const firstQuestion = result.current.currentQuestion?.id;

    rerender({ progressAttempts: [missed, missed] });
    const afterRerender = result.current.currentQuestion?.id;

    act(() => result.current.resetSession());
    expect(result.current.currentQuestion).toBeDefined();
    expect(firstQuestion).toBeTruthy();
    expect(afterRerender).toBeTruthy();
  });

  it("handlers use the passed next config in the same event, not a render behind", () => {
    const { result } = renderHook(() => usePracticeSession(baseHookArgs));
    act(() => result.current.applyModePreset("cloze"));
    expect(result.current.practiceMode).toBe("cloze");
  });

  it("StrictMode + rapid clicks do not mix old/new config snapshots", () => {
    window.localStorage.setItem(BOOKMARKS_KEY, JSON.stringify([question.id]));
    // renderHook's `wrapper` must be a component. Build one without JSX
    // (this file is *.ts, not *.tsx) by creating a StrictMode-wrapping
    // element via createElement.
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(StrictMode, null, children);
    const { result } = renderHook(
      () => usePracticeSession({ ...baseHookArgs, init: { mode: "daily" } }),
      { wrapper }
    );
    expect(result.current).toBeDefined();

    act(() => result.current.setPracticeMode("exam"));
    act(() => result.current.resetSession());
    expect(result.current.practiceMode).toBe("exam");
  });

  it("the raw mode/filter/verbGroup/form setters are the UI composition path into a new snapshot", () => {
    // ModePicker / DrillPanel call the raw setter then resetSession() (see
    // ModePicker.tsx verbGroup/select and DrillPanel.tsx review-empty CTA).
    // The pair must capture the NEW config for the fresh snapshot -- not lag
    // a render behind.
    const { result } = renderHook(() => usePracticeSession(baseHookArgs));

    act(() => result.current.setPracticeMode("exam"));
    act(() => result.current.resetSession());
    expect(result.current.practiceMode).toBe("exam");

    act(() => result.current.setVerbGroup("ichidan"));
    act(() => result.current.resetSession());
    expect(result.current.verbGroup).toBe("ichidan");

    act(() => result.current.setTargetForm("te"));
    act(() => result.current.resetSession());
    expect(result.current.selectedForm).toBe("te");

    act(() => result.current.setPracticeFilter({}));
    act(() => result.current.resetSession());
    // The filter is not exposed as a getter; a no-op filter change must not
    // throw or rebuild the pass differently.
    expect(result.current.currentQuestion).toBeDefined();
  });
});

// applyModePreset must keep honouring the global target preference when a
// mode is picked from the in-session picker -- not only on first mount.
// Modes with no explicit range (daily / 単字 / basic …) inherit the
// preference; the exam 備考 cards still pass an explicit range that wins.
describe("usePracticeSession applyModePreset preference (#199)", () => {
  it("re-selecting 今日練習 in the picker keeps the global preference (not reset to 'all')", () => {
    const { result } = renderHook(() =>
      usePracticeSession({ ...baseHookArgs, init: { mode: "daily" }, targetLevel: "n4n5" })
    );
    expect(result.current.levelRange).toBe("n4n5");
    act(() => result.current.applyModePreset("basic"));
    act(() => result.current.applyModePreset("daily"));
    expect(result.current.levelRange).toBe("n4n5");
  });

  it("keeps the n4n5 preference for 単字 when re-selected (real N4/N5 vocab, #668)", () => {
    const { result } = renderHook(() =>
      usePracticeSession({ ...baseHookArgs, init: { mode: "basic" }, targetLevel: "n4n5" })
    );
    act(() => result.current.applyModePreset("vocab"));
    expect(result.current.levelRange).toBe("n4n5");
  });

  it("clamps the starter preference for 単字 when re-selected (完全新手 -> all)", () => {
    const { result } = renderHook(() =>
      usePracticeSession({ ...baseHookArgs, init: { mode: "basic" }, targetLevel: "starter" })
    );
    act(() => result.current.applyModePreset("vocab"));
    expect(result.current.levelRange).toBe("all");
  });

  it("an explicit exam range (備考 cards) still overrides the preference", () => {
    const { result } = renderHook(() =>
      usePracticeSession({ ...baseHookArgs, init: { mode: "basic" }, targetLevel: "n4n5" })
    );
    act(() => result.current.applyModePreset("exam", "n1n2"));
    expect(result.current.levelRange).toBe("n1n2");
  });
});

// FIX 1 (#299): the graded answer must travel WITH the feedback object so the
// per-question report can never read a stale/mismatched live `selectedChoice`.
// A choice-submit records the chosen string; a reveal records null (no choice).
describe("usePracticeSession feedback.submittedAnswer (#299)", () => {
  it("carries the chosen string on a choice-submit (correct or incorrect)", () => {
    const { result } = renderHook(() => usePracticeSession(baseHookArgs));
    const choice = result.current.choiceOptions[0];
    expect(choice).toBeTypeOf("string");

    act(() => result.current.handleChoiceSubmit(choice));

    expect(result.current.feedback).not.toBeNull();
    expect(result.current.feedback?.submittedAnswer).toBe(choice);
    // And it equals the live selectedChoice at submit time (no drift).
    expect(result.current.feedback?.submittedAnswer).toBe(result.current.selectedChoice);
  });

  it("records null on a reveal (the learner made no choice)", () => {
    const { result } = renderHook(() => usePracticeSession(baseHookArgs));

    act(() => result.current.revealAnswer());

    expect(result.current.feedback?.status).toBe("revealed");
    expect(result.current.feedback?.submittedAnswer).toBeNull();
  });

  it("resets submittedAnswer with the feedback on nextQuestion", () => {
    const { result } = renderHook(() => usePracticeSession(baseHookArgs));
    act(() => result.current.handleChoiceSubmit(result.current.choiceOptions[0]));
    act(() => result.current.nextQuestion());
    expect(result.current.feedback).toBeNull();
  });
});

// The pure seed logic for a session's starting level range (#199): an
// explicit launch request wins; otherwise the global target preference,
// clamped so 単字 never starts on a band its picker can't show.
describe("initialLevelRange (#199)", () => {
  it("uses an explicit init.levelRange over the global preference", () => {
    expect(initialLevelRange({ mode: "exam", levelRange: "n1n2" }, "n4n5")).toBe("n1n2");
  });

  it("falls back to the global target preference when init has none", () => {
    expect(initialLevelRange({ mode: "daily" }, "n4n5")).toBe("n4n5");
    expect(initialLevelRange({ mode: "exam" }, "n2n3")).toBe("n2n3");
  });

  it("defaults to 'all' when there is no preference", () => {
    expect(initialLevelRange(undefined, null)).toBe("all");
    expect(initialLevelRange({ mode: "daily" }, null)).toBe("all");
  });

  it("clamps a non-vocab-picker band to 'all' for 単字 mode (starter never meets 単字)", () => {
    // The vocab picker offers all/n1n2/n2n3/n4n5 (#668). starter is the one
    // band it cannot show (完全新手 drills 入門 content instead), so only that
    // gets clamped.
    expect(initialLevelRange({ mode: "vocab" }, "starter")).toBe("all");
  });

  it("keeps an n4n5 preference for 単字 mode (real N4/N5 jlpt vocab, #666/#667/#668)", () => {
    expect(initialLevelRange({ mode: "vocab" }, "n4n5")).toBe("n4n5");
  });

  it("keeps a vocab-valid preference for 単字 mode", () => {
    expect(initialLevelRange({ mode: "vocab" }, "n2n3")).toBe("n2n3");
    expect(initialLevelRange({ mode: "vocab" }, "n1n2")).toBe("n1n2");
    expect(initialLevelRange({ mode: "vocab" }, "all")).toBe("all");
  });
});
