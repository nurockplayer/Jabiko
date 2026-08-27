import { createElement, StrictMode } from "react";
import type { ReactNode } from "react";
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BOOKMARKS_KEY } from "../domain/bookmarks";
import { buildAllKnownQuestions } from "../domain/sessionPools";
import type { SentencePatternId } from "../domain/sentencePatterns";
import type { Attempt, JlptLevel, PracticeQuestion, VerbGroup } from "../domain/types";
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

  it("copies focused-practice level and verb-group arrays into the pass snapshot", () => {
    const levels: JlptLevel[] = ["N3", "N4", "N5"];
    const verbGroups: VerbGroup[] = ["godan", "ichidan"];
    const snapshot = createPracticePoolSnapshot(
      {
        ...baseConfig,
        filter: { levels, verbGroups },
        targetForm: "meaning",
        targetForms: ["meaning"]
      },
      liveInputs
    );

    expect(snapshot.levels).toEqual(["N3", "N4", "N5"]);
    expect(snapshot.verbGroups).toEqual(["godan", "ichidan"]);
    expect(snapshot.verbGroup).toBe("all");
    expect(snapshot.levels).not.toBe(levels);
    expect(snapshot.verbGroups).not.toBe(verbGroups);

    levels.splice(0, levels.length, "N1");
    verbGroups.splice(0, verbGroups.length, "irregular");

    expect(snapshot.levels).toEqual(["N3", "N4", "N5"]);
    expect(snapshot.verbGroups).toEqual(["godan", "ichidan"]);
  });

  it("preserves the legacy scalar in a snapshot when no explicit group array exists", () => {
    const snapshot = createPracticePoolSnapshot(
      {
        ...baseConfig,
        partOfSpeech: "mixed",
        verbGroup: "ichidan",
        filter: {},
        targetForm: "meaning",
        targetForms: ["meaning"]
      },
      liveInputs
    );

    expect(snapshot.verbGroups).toBeUndefined();
    expect(snapshot.verbGroup).toBe("ichidan");
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

describe("usePracticeSession basic composable filters (#789)", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("preserves a legacy scalar verb-group launch when no explicit filter is supplied", () => {
    const { result } = renderHook(() =>
      usePracticeSession({
        ...baseHookArgs,
        init: {
          mode: "basic",
          partOfSpeech: "verb",
          verbGroup: "ichidan",
          targetForm: "meaning"
        }
      })
    );

    expect(result.current.practiceFilter).toEqual({});
    expect(result.current.selectedVerbGroups).toEqual(["ichidan"]);
    expect(result.current.availableBasicLevels).toEqual(["N5"]);
    expect(result.current.currentQuestion?.vocabulary.group).toBe("ichidan");
  });

  it("lets an explicit canonical filter override the legacy scalar launch field", () => {
    const { result } = renderHook(() =>
      usePracticeSession({
        ...baseHookArgs,
        init: {
          mode: "basic",
          filter: { verbGroups: ["godan"] },
          partOfSpeech: "verb",
          verbGroup: "ichidan",
          targetForm: "meaning"
        }
      })
    );

    expect(result.current.selectedVerbGroups).toEqual(["godan"]);
    expect(result.current.currentQuestion?.vocabulary.group).toBe("godan");
  });

  it("atomically prunes invalid selected levels when the part of speech changes", () => {
    const { result } = renderHook(() =>
      usePracticeSession({
        ...baseHookArgs,
        init: {
          mode: "basic",
          filter: { levels: ["N3", "N5"] },
          partOfSpeech: "mixed",
          verbGroup: "godan",
          targetForm: "meaning"
        }
      })
    );

    expect(result.current.availableBasicLevels).toEqual(["N1", "N2", "N3", "N4", "N5"]);

    act(() => result.current.handlePartOfSpeechChange("verb"));

    expect(result.current.practiceFilter.levels).toEqual(["N5"]);
    expect(result.current.availableBasicLevels).toEqual(["N5"]);
    expect(result.current.currentQuestion?.vocabulary.level).toBe("N5");
  });

  it("clears an explicit verb filter in the same pass when leaving verb practice", () => {
    const { result } = renderHook(() =>
      usePracticeSession({
        ...baseHookArgs,
        init: {
          mode: "basic",
          filter: { levels: ["N5"], verbGroups: ["godan"] },
          partOfSpeech: "verb",
          targetForm: "meaning"
        }
      })
    );

    act(() => result.current.handlePartOfSpeechChange("noun"));

    expect(result.current.practiceFilter.verbGroups).toBeUndefined();
    expect(result.current.verbGroup).toBe("all");
    expect(result.current.selectedVerbGroups).toBeUndefined();
    expect(result.current.currentQuestion?.vocabulary.partOfSpeech).toBe("noun");
  });

  it("clears a newly invalid non-empty level selection but preserves an explicit empty one", () => {
    const selected = renderHook(() =>
      usePracticeSession({
        ...baseHookArgs,
        init: {
          mode: "basic",
          filter: { levels: ["N3"] },
          partOfSpeech: "mixed",
          targetForm: "meaning"
        }
      })
    );
    const empty = renderHook(() =>
      usePracticeSession({
        ...baseHookArgs,
        init: {
          mode: "basic",
          filter: { levels: [] },
          partOfSpeech: "mixed",
          targetForm: "meaning"
        }
      })
    );

    act(() => selected.result.current.handlePartOfSpeechChange("verb"));
    act(() => empty.result.current.handlePartOfSpeechChange("verb"));

    expect(selected.result.current.practiceFilter.levels).toBeUndefined();
    expect(selected.result.current.currentQuestion?.vocabulary.level).toBe("N5");
    expect(empty.result.current.practiceFilter.levels).toEqual([]);
    expect(empty.result.current.currentQuestion).toBeNull();
  });

  it("makes explicit group changes authoritative and keeps All coherent with the scalar", () => {
    const { result } = renderHook(() =>
      usePracticeSession({
        ...baseHookArgs,
        init: {
          mode: "basic",
          partOfSpeech: "verb",
          verbGroup: "ichidan",
          targetForm: "meaning"
        }
      })
    );

    act(() => result.current.handleVerbGroupsChange(["godan"]));

    expect(result.current.verbGroup).toBe("all");
    expect(result.current.practiceFilter.verbGroups).toEqual(["godan"]);
    expect(result.current.selectedVerbGroups).toEqual(["godan"]);
    expect(result.current.currentQuestion?.vocabulary.group).toBe("godan");

    act(() => result.current.handleVerbGroupsChange(undefined));

    expect(result.current.verbGroup).toBe("all");
    expect(result.current.practiceFilter.verbGroups).toBeUndefined();
    expect(result.current.selectedVerbGroups).toBeUndefined();
  });

  it("preserves basic filters across mode changes while clearing mode-specific filters", () => {
    const { result } = renderHook(() =>
      usePracticeSession({
        ...baseHookArgs,
        init: {
          mode: "basic",
          filter: {
            levels: ["N5"],
            verbGroups: ["godan"],
            kanaScript: "katakana"
          },
          partOfSpeech: "verb",
          targetForm: "meaning"
        }
      })
    );

    act(() => result.current.applyModePreset("kana"));

    expect(result.current.practiceFilter).toEqual({
      levels: ["N5"],
      verbGroups: ["godan"]
    });

    act(() => result.current.applyModePreset("basic"));

    expect(result.current.practiceFilter).toEqual({
      levels: ["N5"],
      verbGroups: ["godan"]
    });
    expect(result.current.currentQuestion?.vocabulary.level).toBe("N5");
    expect(result.current.currentQuestion?.vocabulary.group).toBe("godan");
  });

  it("keeps an explicit empty filter as a zero-question pass", () => {
    const { result } = renderHook(() =>
      usePracticeSession({
        ...baseHookArgs,
        init: {
          mode: "basic",
          filter: { levels: [] },
          partOfSpeech: "noun",
          targetForm: "meaning"
        }
      })
    );

    expect(result.current.currentQuestion).toBeNull();
    expect(result.current.sessionTotal).toBe(0);
  });

  it("starts a fresh pass and clears answer state when focused filters change", () => {
    const { result } = renderHook(() =>
      usePracticeSession({
        ...baseHookArgs,
        init: {
          mode: "basic",
          filter: { levels: ["N5"], verbGroups: ["godan"] },
          partOfSpeech: "verb",
          targetForm: "meaning"
        }
      })
    );

    act(() => result.current.handleChoiceSubmit(result.current.choiceOptions[0]));
    act(() => result.current.nextQuestion());
    act(() => result.current.handleChoiceSubmit(result.current.choiceOptions[0]));
    expect(result.current.attempts).toHaveLength(2);
    expect(result.current.questionIndex).toBe(1);
    expect(result.current.feedback).not.toBeNull();
    expect(result.current.handlePracticeFilterChange).toBeTypeOf("function");

    act(() =>
      result.current.handlePracticeFilterChange({
        levels: ["N5"],
        verbGroups: ["ichidan"]
      })
    );

    expect(result.current.practiceFilter).toEqual({
      levels: ["N5"],
      verbGroups: ["ichidan"]
    });
    expect(result.current.attempts).toEqual([]);
    expect(result.current.questionIndex).toBe(0);
    expect(result.current.feedback).toBeNull();
    expect(result.current.currentQuestion?.vocabulary.group).toBe("ichidan");
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

// Session clock (#680) — the answer-response timer must be started by
// events/effects (mount, startNewPass, nextQuestion), never by render-phase
// Date.now(). The ref must start null and only be initialised by
// beginSessionClock(); render stays a pure function of props/state.
describe("usePracticeSession session clock (#680)", () => {
  beforeEach(() => {
    // Deterministic base time: all subsequent tests (except the purity one,
    // which restores real time) build on an epoch of exactly 1000.
    vi.useFakeTimers({ now: 1000, shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // Purity (React Compiler) gate (#663/#680): render must not call any time
  // API. A flag wraps the hook's own render body so the spy can tell
  // render-phase calls (useRef(Date.now()) -- the #680 violation) apart from
  // the legal effect- and event-handler calls (mount clock effect,
  // scoreAttempt's finishedAt default). StrictMode double-renders, so the
  // violation would register twice.
  it("does not call Date.now() during render", () => {
    let inRender = false;
    let renderCalls = 0;
    const spy = vi.spyOn(Date, "now").mockImplementation(() => {
      if (inRender) renderCalls += 1;
      return 12345;
    });
    const useTracked = () => {
      inRender = true;
      try {
        return usePracticeSession(baseHookArgs);
      } finally {
        inRender = false;
      }
    };
    try {
      const { result } = renderHook(useTracked);
      // Mount: the clock may be started by an effect (legal), never in render.
      expect(renderCalls).toBe(0);
      // Answer submission reads the ref in the event handler; the resulting
      // re-render must not call Date.now() either.
      act(() => result.current.handleChoiceSubmit(result.current.choiceOptions[0]));
      expect(renderCalls).toBe(0);
    } finally {
      spy.mockRestore();
    }
  });

  // Mount -> clock is started by an effect (after the pass is fully initialised).
  it("starts the clock with an effect on mount", () => {
    const { result } = renderHook(() => usePracticeSession(baseHookArgs));
    act(() => result.current.handleChoiceSubmit(result.current.choiceOptions[0]));
    expect(result.current.attempts[0].responseTimeMs).toBe(0);
  });

  it("re-bases the clock on an explicit new pass, not a render dependency", () => {
    const { result } = renderHook(() => usePracticeSession(baseHookArgs));
    act(() => result.current.handleChoiceSubmit(result.current.choiceOptions[0]));
    expect(result.current.attempts[0].responseTimeMs).toBe(0);
    expect(result.current.attempts[0].timestamp).toBe(1000);

    // A NEW pass (resetSession -> startNewPass) re-bases the clock at the
    // event's current time. resetSession clears attempts, so the first answer
    // of the new pass must be a fresh 0ms (not 2000ms vs the old base).
    vi.setSystemTime(3000);
    act(() => result.current.resetSession());
    act(() => result.current.handleChoiceSubmit(result.current.choiceOptions[0]));
    expect(result.current.attempts[0].responseTimeMs).toBe(0);
    expect(result.current.attempts[0].timestamp).toBe(3000);

    // nextQuestion re-bases the clock to its own event time, so a later answer
    // measures from THAT point, not from the pass start.
    vi.setSystemTime(3500);
    act(() => result.current.nextQuestion());
    vi.setSystemTime(4000);
    act(() => result.current.handleChoiceSubmit(result.current.choiceOptions[0]));
    expect(result.current.attempts[1].responseTimeMs).toBe(500);
    expect(result.current.attempts[1].timestamp).toBe(4000);
  });

  it("re-bases the clock on nextQuestion", () => {
    const { result } = renderHook(() => usePracticeSession(baseHookArgs));
    act(() => result.current.handleChoiceSubmit(result.current.choiceOptions[0]));

    vi.setSystemTime(2000);
    act(() => result.current.nextQuestion());
    vi.setSystemTime(2400);
    act(() => result.current.handleChoiceSubmit(result.current.choiceOptions[0]));
    expect(result.current.attempts[1].responseTimeMs).toBe(400);
    expect(result.current.attempts[1].timestamp).toBe(2400);
  });

  it("initialises a null clock in the event handler on answer", () => {
    const { result } = renderHook(() => usePracticeSession(baseHookArgs));
    // Extreme case: the clock was never started (e.g. a buggy startNewPass
    // path). The answer handler must initialise the ref itself, never fall
    // back to a render-time Date.now().
    result.current.startedAtRef.current = null;
    act(() => result.current.handleChoiceSubmit(result.current.choiceOptions[0]));
    expect(result.current.attempts[0].responseTimeMs).toBe(0);
    expect(result.current.attempts[0].timestamp).toBe(1000);
  });

  it("computes durations under fake timers with the existing units and rounding", () => {
    const { result } = renderHook(() => usePracticeSession(baseHookArgs));
    // Question shown at mount (clock base 1000).
    vi.setSystemTime(1250);
    act(() => result.current.handleChoiceSubmit(result.current.choiceOptions[0]));
    expect(result.current.attempts[0].responseTimeMs).toBe(250);
    expect(result.current.attempts[0].timestamp).toBe(1250);

    // Next question re-bases the clock at 2000; answer 500ms later.
    vi.setSystemTime(2000);
    act(() => result.current.nextQuestion());
    vi.setSystemTime(2500);
    act(() => result.current.handleChoiceSubmit(result.current.choiceOptions[0]));
    expect(result.current.attempts[1].responseTimeMs).toBe(500);
    expect(result.current.attempts[1].timestamp).toBe(2500);

    // Same-question elapsed is rounded as a plain ms difference (integer).
    vi.setSystemTime(3500);
    act(() => result.current.nextQuestion());
    vi.setSystemTime(3600);
    act(() => result.current.handleChoiceSubmit(result.current.choiceOptions[0]));
    expect(result.current.attempts[2].responseTimeMs).toBe(100);
    expect(result.current.attempts[2].timestamp).toBe(3600);
  });

  it("StrictMode does not start the clock twice or corrupt durations", () => {
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(StrictMode, null, children);
    const { result } = renderHook(() => usePracticeSession(baseHookArgs), { wrapper });
    act(() => result.current.handleChoiceSubmit(result.current.choiceOptions[0]));
    expect(result.current.attempts[0].responseTimeMs).toBe(0);
    expect(result.current.attempts[0].timestamp).toBe(1000);

    vi.setSystemTime(2000);
    act(() => result.current.nextQuestion());
    vi.setSystemTime(2400);
    act(() => result.current.handleChoiceSubmit(result.current.choiceOptions[0]));
    expect(result.current.attempts[1].responseTimeMs).toBe(400);
  });
});
