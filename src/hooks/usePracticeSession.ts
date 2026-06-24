import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { ADJECTIVE_FORMS, VERB_FORMS } from "../domain/conjugation";
import { VOCAB_LEVEL_RANGE_OPTIONS, type LevelRange } from "../domain/levelRange";
import type { MockExamLevel } from "../domain/mockExam";
import { type SentencePatternId } from "../domain/sentencePatterns";
import {
  buildChoiceOptions,
  getMistakeQuestions,
  getReviewQueue,
  scoreAttempt,
  selectQuestion
} from "../domain/practice";
import {
  buildAllKnownQuestions,
  buildModeCounts,
  buildPracticeQuestions,
  uniqueForms
} from "../domain/sessionPools";
import type { Attempt, PartOfSpeech, TargetForm, VerbGroup } from "../domain/types";
import { readStored, writeStored } from "../domain/safeStorage";
import { copy, type Language } from "../i18n";
import type { Feedback } from "../components/types";

// Configurable practice-session length (#154). The endless drill modes
// (exam / cloze / pattern / vocab / basic) are capped to this many
// questions so a session is finite; `null` means "全部" (no cap, the old
// endless behaviour). review (clears the whole due queue) and 今日練習
// (already a fixed ~20 set) ignore it. Persisted across sessions.
const SESSION_LENGTH_KEY = "jabiko.sessionLength";
const DEFAULT_SESSION_LENGTH = 20;
export const SESSION_LENGTH_OPTIONS: ReadonlyArray<number | null> = [10, 20, 30, 50, null];

function readSessionLength(): number | null {
  const raw = readStored(SESSION_LENGTH_KEY);
  if (raw === null) return DEFAULT_SESSION_LENGTH;
  if (raw === "all") return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_SESSION_LENGTH;
}

export type PracticeFocus = "single" | "teTa" | "negative" | "plain" | "adverbial" | "obligationPast";
export type PracticeMode = "basic" | "cloze" | "daily" | "pattern" | "exam" | "review" | "vocab";
export type PracticeFilter = {
  patternIds?: SentencePatternId[];
  // Narrows exam mode to one JLPT section (by level + promptLabel), set
  // when the learner taps a section card in the 模擬考 picker.
  examSection?: { level: MockExamLevel; promptLabel: string };
};

// Initial configuration the challenge view is launched with. App sets
// this (the "launch request") when the learner taps a learning-block
// drill, a mock section, or a review/vocab entry, then mounts the lazy
// ChallengePanel; usePracticeSession seeds its initial state from it.
// Undefined / empty -> the default basic drill (verb · godan · て形).
export type SessionInit = {
  mode?: PracticeMode;
  filter?: PracticeFilter;
  partOfSpeech?: PartOfSpeech | "mixed";
  verbGroup?: VerbGroup | "all";
  practiceFocus?: PracticeFocus;
  targetForm?: TargetForm;
  // JLPT level range for the exam (綜合) + vocab (単字) pools; default all.
  levelRange?: LevelRange;
};

// The level range a session starts in (#199). An explicit launch request
// (init.levelRange) always wins; otherwise it inherits the learner's global
// target preference. 単字 has no n4n5 jlpt vocab, so an n4n5 preference is
// clamped to "all" for that mode -- its picker can't show n4n5 and the pool
// would be empty (the composeDailySet / vocab-branch fallbacks cover the
// data side; this keeps the picker selection valid). Pure so it can be
// unit-tested without mounting the hook.
export function initialLevelRange(
  init: SessionInit | undefined,
  targetLevel: LevelRange | null
): LevelRange {
  if (init?.levelRange) return init.levelRange;
  const preferred = targetLevel ?? "all";
  if (init?.mode === "vocab" && !VOCAB_LEVEL_RANGE_OPTIONS.includes(preferred)) {
    return "all";
  }
  return preferred;
}

const focusOptions: Array<{ value: PracticeFocus; targetForms: TargetForm[]; verbOnly?: boolean }> = [
  { value: "single", targetForms: [] },
  { value: "teTa", targetForms: ["te", "ta"], verbOnly: true },
  { value: "negative", targetForms: ["nai", "negativeTe", "negativeContinuative", "plainPastNegative"] },
  {
    value: "plain",
    targetForms: [
      "plainPresentAffirmative",
      "plainPresentNegative",
      "plainPastAffirmative",
      "plainPastNegative"
    ]
  },
  {
    value: "adverbial",
    targetForms: ["adverbial"]
  },
  {
    value: "obligationPast",
    targetForms: ["obligationPast"]
  }
];

// The stateful core of the practice experience: owns all in-session
// state (mode / filters / current question / feedback / score), derives
// the active question pool, and exposes the handlers the challenge view
// binds to. Lives in the lazily-loaded ChallengePanel so the heavy
// question-data modules it imports stay out of the initial bundle.
//   - `init` seeds the initial drill config (the launch request).
//   - `progressAttempts` / `recordAttempt` are owned by App
//     (useProgressAttempts) so the always-mounted home/learn dashboards
//     can read history without loading this hook; we read it for the
//     review queue and append to it on each answer.
//   - `language` feeds the focus-summary copy lookups.
export function usePracticeSession({
  language,
  init,
  progressAttempts,
  recordAttempt,
  targetLevel = null
}: {
  language: Language;
  init?: SessionInit;
  progressAttempts: Attempt[];
  recordAttempt: (attempt: Attempt) => void;
  // The learner's global target-level preference (#199). Seeds the level
  // range for the daily / 綜合 / 単字 pools when the launch request doesn't
  // pin one; a per-session picker change still overrides it.
  targetLevel?: LevelRange | null;
}) {
  const [partOfSpeech, setPartOfSpeech] = useState<PartOfSpeech | "mixed">(init?.partOfSpeech ?? "verb");
  const [verbGroup, setVerbGroup] = useState<VerbGroup | "all">(init?.verbGroup ?? "godan");
  const [targetForm, setTargetForm] = useState<TargetForm>(init?.targetForm ?? "te");
  const [practiceFocus, setPracticeFocus] = useState<PracticeFocus>(init?.practiceFocus ?? "single");
  const [practiceMode, setPracticeMode] = useState<PracticeMode>(init?.mode ?? "basic");
  const [practiceFilter, setPracticeFilter] = useState<PracticeFilter>(init?.filter ?? {});
  const [levelRange, setLevelRange] = useState<LevelRange>(() => initialLevelRange(init, targetLevel));
  const [sessionLength, setSessionLength] = useState<number | null>(() => readSessionLength());
  const [questionIndex, setQuestionIndex] = useState(0);
  const [sessionSeed, setSessionSeed] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const startedAtRef = useRef(Date.now());
  const nextButtonRef = useRef<HTMLButtonElement>(null);
  const t = copy[language];

  const baseCompatibleForms =
    partOfSpeech === "mixed"
      ? uniqueForms([...VERB_FORMS, ...ADJECTIVE_FORMS])
      : partOfSpeech === "verb"
        ? VERB_FORMS
        : ADJECTIVE_FORMS;
  const compatibleForms = uniqueForms([...baseCompatibleForms, "reading", "meaning"]);
  const selectedForm = compatibleForms.includes(targetForm) ? targetForm : compatibleForms[0];
  const isExamFocus = practiceMode === "exam";
  const isClozeFocus = practiceMode === "cloze";
  const isPatternFocus = practiceMode === "pattern";
  const isReviewFocus = practiceMode === "review";
  const isVocabFocus = practiceMode === "vocab";
  const isDailyFocus = practiceMode === "daily";
  const isCuratedFocus =
    isExamFocus || isClozeFocus || isPatternFocus || isReviewFocus || isVocabFocus || isDailyFocus;
  // The session-length picker applies to the endless drill modes (exam /
  // cloze / pattern / vocab / basic). review clears the whole due queue
  // and 今日練習 is already a fixed ~20 set, so neither is capped.
  const showSessionLength = !isReviewFocus && !isDailyFocus;
  const isCapped = showSessionLength && sessionLength != null;
  // The level-range picker applies to the 綜合考題庫 (exam with no fixed
  // section) and 単字 pools -- the two banks with JLPT-tagged items. A
  // mock-launched exam section already fixes the level, so hide it there.
  // The exam pool's level ranges are now their own mode-picker presets
  // (綜合 / N1 備考 / N2 備考), so the in-mode range segmented is only
  // needed for the vocab pool.
  const showLevelRange = isVocabFocus;

  // Union pool used to materialise the review queue: any question the
  // learner has ever encountered (across exam / cloze / pattern / basic)
  // could be in their attempt history, so the queue lookup needs to see
  // them all. Built once and reused -- this is the same set of question
  // factories the four mode-specific branches below call, just unioned.
  const allKnownQuestions = useMemo(() => buildAllKnownQuestions(), []);

  const reviewQueue = useMemo(
    () => getReviewQueue(progressAttempts, allKnownQuestions),
    [progressAttempts, allKnownQuestions]
  );

  // Pool size per practice mode, shown on the mode cards so the learner
  // can see how big each bank is before picking. Static pools are
  // computed once; "basic" is intentionally omitted (its size depends on
  // the chosen word type / verb group / form), and "review" is dynamic
  // (the due count) so it's read from reviewQueue at render time.
  const modeCounts = useMemo(() => buildModeCounts(), []);
  const isVerbCapable = partOfSpeech === "verb" || partOfSpeech === "mixed";
  const availableFocusOptions = focusOptions.filter((option) => {
    if (option.verbOnly && !isVerbCapable) return false;
    if (option.value === "adverbial" && partOfSpeech === "verb") return false;
    return true;
  });
  const targetForms = useMemo(
    () =>
      isCuratedFocus
        ? []
        : practiceFocus === "single"
        ? [selectedForm]
        : focusOptions.find((option) => option.value === practiceFocus)?.targetForms ?? [selectedForm],
    [practiceFocus, isCuratedFocus, selectedForm]
  );
  const activeFocusForms = targetForms.filter((form) => compatibleForms.includes(form));
  // Exam mode is one PracticeMode but three picker presets (綜合 / N1 備考
  // / N2 備考). Map the active mode+range to the matching copy key so the
  // summary + mode description reflect the chosen 備考 preset, not the
  // generic 綜合考題庫 text.
  const activeModeCopyKey: PracticeMode | "examN1" | "examN2" | "examN4" =
    practiceMode === "exam"
      ? levelRange === "n1n2"
        ? "examN1"
        : levelRange === "n2n3"
          ? "examN2"
          : levelRange === "n4n5"
            ? "examN4"
            : "exam"
      : practiceMode;
  const focusSummary = isCuratedFocus
    ? t.modeOptions[activeModeCopyKey].subtitle
    : practiceFocus === "single"
    ? t.targetForms[selectedForm]
    : activeFocusForms.map((form) => t.targetForms[form]).join(" / ") || t.focusSummaryEmpty;

  const questions = useMemo(
    () => {
      void sessionSeed;
      return buildPracticeQuestions({
        isExamFocus,
        isClozeFocus,
        isPatternFocus,
        isReviewFocus,
        isVocabFocus,
        isDailyFocus,
        examSection: practiceFilter.examSection,
        patternIds: practiceFilter.patternIds,
        partOfSpeech,
        verbGroup,
        targetForms,
        levelRange,
        reviewQueue,
        sessionLength
      });
    },
    // INTENTIONALLY excluding `reviewQueue` from deps. The live queue
    // is reactive to every progressAttempts change (any answered
    // question shifts it), and including it here would re-run the
    // useMemo on every answer -- which in non-review modes reshuffles
    // the pool, and in review mode shrinks it. Either way the result
    // is currentQuestion getting ripped out from under the feedback
    // panel that's still showing the previous answer (user-visible
    // bug: "答題後跳到下一題、不能答、解析還在；按下一題又跳一題").
    // The closure inside captures the latest `reviewQueue` whenever
    // this useMemo DOES re-run (mode change / sessionSeed bump), so
    // entering review mode + explicit reset still get a fresh
    // snapshot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      isExamFocus,
      isClozeFocus,
      isPatternFocus,
      isReviewFocus,
      isVocabFocus,
      isDailyFocus,
      practiceFilter.patternIds,
      practiceFilter.examSection,
      partOfSpeech,
      targetForms,
      verbGroup,
      levelRange,
      sessionLength,
      sessionSeed
    ]
  );
  // Review and 今日練習 are FINITE passes over a snapshot: walk each item
  // once, no modulo wrap, then stop (and show a completion screen). Every
  // other mode is an endless drill (modulo wrap via selectQuestion).
  // Looping review would re-show items the learner just cleared -- exactly
  // the "錯題一直輪迴" report. Correctly-answered items leave the SRS due
  // set (next session), wrong ones reset to box 0 and return next session.
  // A capped endless mode (#154) also becomes a finite pass: walk the
  // sliced pool once, then show the completion screen ("再來一組" reshuffles
  // a fresh capped set via resetSession).
  const isFinitePass = isReviewFocus || isDailyFocus || isCapped;
  const currentQuestion = isFinitePass
    ? questions[questionIndex] ?? null
    : selectQuestion(questions, questionIndex);
  const reviewEmpty = isReviewFocus && questions.length === 0;
  const sessionExhausted =
    isFinitePass && questions.length > 0 && questionIndex >= questions.length;
  // Total for the "N / total" progress readout: known for finite passes
  // (capped / review / 今日練習), null for the remaining endless modes.
  const sessionTotal = isFinitePass ? questions.length : null;
  const choiceOptions = useMemo(
    () => (currentQuestion ? buildChoiceOptions(currentQuestion, questions, questionIndex) : []),
    [currentQuestion, questionIndex, questions]
  );
  const mistakeQuestions = getMistakeQuestions(attempts, questions);
  const correctCount = attempts.filter((attempt) => attempt.isCorrect).length;
  const accuracy = attempts.length > 0 ? Math.round((correctCount / attempts.length) * 100) : 0;

  useEffect(() => {
    if (feedback) {
      nextButtonRef.current?.focus({ preventScroll: true });
    }
  }, [feedback]);

  const handlePartOfSpeechChange = (nextPartOfSpeech: PartOfSpeech | "mixed") => {
    setPartOfSpeech(nextPartOfSpeech);
    setPracticeFocus("single");
    setTargetForm(nextPartOfSpeech === "verb" || nextPartOfSpeech === "mixed" ? "te" : "plainPresentNegative");
    resetSession();
  };

  const handlePracticeFocusChange = (nextFocus: PracticeFocus) => {
    setPracticeFocus(nextFocus);
    resetSession();
  };

  // The mode picker lists the exam pool as three side-by-side presets
  // (綜合 / N1 備考 / N2 備考), so picking one sets BOTH the mode and its
  // level range at once. Non-exam presets pass "all" (a no-op for the
  // modes that ignore levelRange). Clearing the filter keeps the picker a
  // "fresh mix" (a chapter drill button is what sets a patternIds filter).
  const applyModePreset = (nextMode: PracticeMode, nextRange?: LevelRange) => {
    // An explicit range (the exam 綜合 / 備考 cards) wins; otherwise inherit
    // the global target preference, so daily / 単字 keep honouring it when
    // re-picked from the in-session picker -- not only on first mount (#199).
    const resolvedRange = nextRange ?? initialLevelRange({ mode: nextMode }, targetLevel);
    if (nextMode === practiceMode && resolvedRange === levelRange) return;
    setPracticeMode(nextMode);
    setLevelRange(resolvedRange);
    setPracticeFilter({});
    resetSession();
  };

  const handleLevelRangeChange = (nextRange: LevelRange) => {
    if (nextRange === levelRange) return;
    setLevelRange(nextRange);
    resetSession();
  };

  const handleSessionLengthChange = (nextLength: number | null) => {
    if (nextLength === sessionLength) return;
    setSessionLength(nextLength);
    writeStored(SESSION_LENGTH_KEY, nextLength === null ? "all" : String(nextLength));
    resetSession();
  };

  const handleChoiceSubmit = (choice: string) => {
    if (!currentQuestion || feedback) {
      return;
    }

    setSelectedChoice(choice);

    const attempt = scoreAttempt(currentQuestion, choice, startedAtRef.current);
    setAttempts((current) => [...current, attempt]);
    recordAttempt(attempt);
    setFeedback({ status: attempt.isCorrect ? "correct" : "incorrect", question: currentQuestion });
  };

  const nextQuestion = () => {
    setQuestionIndex((current) => current + 1);
    setSelectedChoice(null);
    setFeedback(null);
    startedAtRef.current = Date.now();
  };

  const resetSession = () => {
    setAttempts([]);
    setQuestionIndex(0);
    setSessionSeed((seed) => seed + 1);
    setSelectedChoice(null);
    setFeedback(null);
    startedAtRef.current = Date.now();
  };

  const revealAnswer = () => {
    if (!currentQuestion || feedback) {
      return;
    }

    const attempt = scoreAttempt(currentQuestion, "", startedAtRef.current);
    const missedAttempt = { ...attempt, isCorrect: false, submittedAnswer: "(revealed)" };
    setAttempts((current) => [...current, missedAttempt]);
    recordAttempt(missedAttempt);
    setSelectedChoice(null);
    setFeedback({ status: "revealed", question: currentQuestion });
  };

  const handleDrillKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" && feedback) {
      event.preventDefault();
      nextQuestion();
    }
  };

  // Desktop shortcut: press 1-9 to pick (and submit) the matching MCQ
  // option. A GLOBAL document listener -- not the drill section's
  // onKeyDown -- because the choice buttons are never auto-focused before
  // answering, so a section-scoped handler would miss the keypress unless
  // the learner first tabbed in. Only active while a question is open and
  // unanswered; skipped when a text field is focused (so it never hijacks
  // typing) or when a modifier is held (leave browser/OS chords alone).
  // (Enter/Space-to-advance after feedback stays on handleDrillKeyDown,
  // which works because the next button is auto-focused once answered.)
  useEffect(() => {
    if (!currentQuestion || feedback) {
      return;
    }
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable) {
        return;
      }
      if (event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }
      if (event.key < "1" || event.key > "9") {
        return;
      }
      const choice = choiceOptions[Number(event.key) - 1];
      if (choice === undefined) {
        return;
      }
      event.preventDefault();
      handleChoiceSubmit(choice);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [currentQuestion, feedback, choiceOptions, handleChoiceSubmit]);

  return {
    partOfSpeech,
    verbGroup,
    practiceFocus,
    practiceMode,
    levelRange,
    showLevelRange,
    sessionLength,
    showSessionLength,
    sessionTotal,
    selectedForm,
    questionIndex,
    selectedChoice,
    feedback,
    attempts,
    setPartOfSpeech,
    setVerbGroup,
    setTargetForm,
    setPracticeFocus,
    setPracticeMode,
    setPracticeFilter,
    compatibleForms,
    isVerbCapable,
    availableFocusOptions,
    focusSummary,
    activeModeCopyKey,
    reviewQueue,
    modeCounts,
    currentQuestion,
    reviewEmpty,
    sessionExhausted,
    choiceOptions,
    mistakeQuestions,
    correctCount,
    accuracy,
    nextButtonRef,
    handlePartOfSpeechChange,
    handlePracticeFocusChange,
    applyModePreset,
    handleLevelRangeChange,
    handleSessionLengthChange,
    handleChoiceSubmit,
    nextQuestion,
    resetSession,
    revealAnswer,
    handleDrillKeyDown
  };
}

export type PracticeSession = ReturnType<typeof usePracticeSession>;
