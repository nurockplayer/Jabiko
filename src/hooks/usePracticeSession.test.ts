import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { BOOKMARKS_KEY } from "../domain/bookmarks";
import { buildAllKnownQuestions } from "../domain/sessionPools";
import type { Attempt, PracticeQuestion } from "../domain/types";
import { initialLevelRange, usePracticeSession } from "./usePracticeSession";

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

  it("clamps the preference for 単字 when re-selected (n4n5 has no jlpt vocab -> all)", () => {
    const { result } = renderHook(() =>
      usePracticeSession({ ...baseHookArgs, init: { mode: "basic" }, targetLevel: "n4n5" })
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

  it("clamps an n4n5 preference to 'all' for 単字 mode (no n4n5 jlpt vocab)", () => {
    expect(initialLevelRange({ mode: "vocab" }, "n4n5")).toBe("all");
  });

  it("keeps a vocab-valid preference for 単字 mode", () => {
    expect(initialLevelRange({ mode: "vocab" }, "n2n3")).toBe("n2n3");
    expect(initialLevelRange({ mode: "vocab" }, "n1n2")).toBe("n1n2");
  });
});
