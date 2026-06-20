import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { ADJECTIVE_FORMS, VERB_FORMS } from "../domain/conjugation";
import { buildClozeQuestionPool } from "../domain/cloze";
import { clozeSentences } from "../domain/cloze-data";
import { buildExamQuestionPool } from "../domain/examBlocks";
import type { MockExamLevel } from "../domain/mockExam";
import { buildSentencePatternPool, type SentencePatternId } from "../domain/sentencePatterns";
import {
  buildChoiceOptions,
  buildQuestionPool,
  getMistakeQuestions,
  getReviewQueue,
  reduceAdjacentClusters,
  scoreAttempt,
  selectQuestion,
  shuffleQuestions
} from "../domain/practice";
import type { Attempt, PartOfSpeech, PracticeQuestion, TargetForm, VerbGroup } from "../domain/types";
import { vocabulary } from "../domain/vocabulary";
import { jlptVocabulary } from "../domain/vocabulary-jlpt";
import { copy, type Language } from "../i18n";
import type { Feedback } from "../components/types";

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
};

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

function uniqueForms(forms: TargetForm[]): TargetForm[] {
  return Array.from(new Set(forms));
}

const DAILY_TARGET = 20;

// Builds the "今日練習" set: due SRS reviews first (capped at half so a
// big backlog still leaves room for variety), then an even, de-clustered
// mix of fresh exam + vocab items to fill out the session. It's a FINITE
// pass -- the learner works through the set once and gets a completion
// screen, same as review mode. v1 is an even mix; weighting toward the
// learner's weak sections is a follow-up (needs attempt metadata).
function composeDailySet(due: PracticeQuestion[]): PracticeQuestion[] {
  const dueTake = due.slice(0, Math.ceil(DAILY_TARGET / 2));
  const dueIds = new Set(dueTake.map((question) => question.id));
  const fresh = shuffleQuestions(
    [
      ...buildExamQuestionPool(),
      ...buildQuestionPool(jlptVocabulary, {
        partOfSpeech: "mixed",
        verbGroup: "all",
        targetForms: ["reading"]
      })
    ].filter((question) => !dueIds.has(question.id))
  ).slice(0, DAILY_TARGET - dueTake.length);
  // De-cluster by section/type so consecutive questions aren't all the
  // same kind (exam items carry promptLabel; vocab falls back to its
  // targetForm, "reading").
  return reduceAdjacentClusters(
    [...dueTake, ...fresh],
    (question) => question.promptLabel ?? question.targetForm
  );
}

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
  recordAttempt
}: {
  language: Language;
  init?: SessionInit;
  progressAttempts: Attempt[];
  recordAttempt: (attempt: Attempt) => void;
}) {
  const [partOfSpeech, setPartOfSpeech] = useState<PartOfSpeech | "mixed">(init?.partOfSpeech ?? "verb");
  const [verbGroup, setVerbGroup] = useState<VerbGroup | "all">(init?.verbGroup ?? "godan");
  const [targetForm, setTargetForm] = useState<TargetForm>(init?.targetForm ?? "te");
  const [practiceFocus, setPracticeFocus] = useState<PracticeFocus>(init?.practiceFocus ?? "single");
  const [practiceMode, setPracticeMode] = useState<PracticeMode>(init?.mode ?? "basic");
  const [practiceFilter, setPracticeFilter] = useState<PracticeFilter>(init?.filter ?? {});
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

  // Union pool used to materialise the review queue: any question the
  // learner has ever encountered (across exam / cloze / pattern / basic)
  // could be in their attempt history, so the queue lookup needs to see
  // them all. Built once and reused -- this is the same set of question
  // factories the four mode-specific branches below call, just unioned.
  const allKnownQuestions = useMemo(
    () => [
      ...buildExamQuestionPool(),
      ...buildClozeQuestionPool(clozeSentences, vocabulary),
      ...buildSentencePatternPool(),
      ...buildQuestionPool(vocabulary, {
        partOfSpeech: "mixed",
        verbGroup: "all",
        targetForms: uniqueForms([
          ...VERB_FORMS,
          ...ADJECTIVE_FORMS,
          "reading",
          "meaning"
        ])
      })
    ],
    []
  );

  const reviewQueue = useMemo(
    () => getReviewQueue(progressAttempts, allKnownQuestions),
    [progressAttempts, allKnownQuestions]
  );

  // Pool size per practice mode, shown on the mode cards so the learner
  // can see how big each bank is before picking. Static pools are
  // computed once; "basic" is intentionally omitted (its size depends on
  // the chosen word type / verb group / form), and "review" is dynamic
  // (the due count) so it's read from reviewQueue at render time.
  const modeCounts = useMemo(
    () => ({
      cloze: buildClozeQuestionPool(clozeSentences, vocabulary).length,
      pattern: buildSentencePatternPool().length,
      exam: buildExamQuestionPool().length,
      vocab: buildQuestionPool(jlptVocabulary, {
        partOfSpeech: "mixed",
        verbGroup: "all",
        targetForms: ["reading"]
      }).length
    }),
    []
  );
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
  const focusSummary = isCuratedFocus
    ? t.modeOptions[practiceMode].subtitle
    : practiceFocus === "single"
    ? t.targetForms[selectedForm]
    : activeFocusForms.map((form) => t.targetForms[form]).join(" / ") || t.focusSummaryEmpty;

  const questions = useMemo(
    () => {
      void sessionSeed;
      if (isExamFocus) {
        // Section-filtered when launched from the 模擬考 picker; the
        // plain "綜合考題庫" mode card leaves examSection unset and
        // mixes every section.
        const section = practiceFilter.examSection;
        if (section) {
          return shuffleQuestions(
            buildExamQuestionPool(section.level).filter(
              (question) => question.promptLabel === section.promptLabel
            )
          );
        }
        return shuffleQuestions(buildExamQuestionPool());
      }

      if (isClozeFocus) {
        return shuffleQuestions(buildClozeQuestionPool(clozeSentences, vocabulary));
      }

      if (isPatternFocus) {
        return shuffleQuestions(
          buildSentencePatternPool({ patternIds: practiceFilter.patternIds })
        );
      }

      if (isReviewFocus) {
        // Snapshot the SRS queue at session start. Subsequent answers
        // update the LIVE reviewQueue (used by the home banner count),
        // but this useMemo is intentionally NOT re-keyed on it -- see
        // the deps comment below for the regression that fixes.
        // Ordering is preserved (no extra shuffle): getReviewQueue
        // already sorts most-overdue first.
        return reviewQueue;
      }

      if (isVocabFocus) {
        // 単字 mode: N1/N2 reading drill. Reading-only on purpose --
        // for a Chinese-speaking learner the kanji usually telegraphs
        // the meaning (影響 = 影響), so an isolated meaning question is
        // trivial and can't be rescued by stronger distractors. The
        // genuinely hard, JLPT-relevant skill is the READING (よみ):
        // 影響 is えいきょう, not えいきゅう. Meaning is still tested,
        // but in CONTEXT, via the exam pool's 詞彙填空 / 類義替換 /
        // 詞彙用法 sections -- which is the authentic way to test it.
        const vocabPool = shuffleQuestions(
          buildQuestionPool(jlptVocabulary, {
            partOfSpeech: "mixed",
            verbGroup: "all",
            targetForms: ["reading"]
          })
        );
        // De-run by reading length: consecutive questions then tend to
        // have different-length answers -> different distractor bands ->
        // no "same options twice in a row" feel even when the random
        // shuffle clusters same-length words together.
        return reduceAdjacentClusters(
          vocabPool,
          (question) => String(question.expectedAnswers[0]?.length ?? 0)
        );
      }

      if (isDailyFocus) {
        // Snapshot the current due queue at session start (same as review
        // mode); the live reviewQueue stays excluded from the deps below.
        return composeDailySet(reviewQueue);
      }

      return shuffleQuestions(
        buildQuestionPool(vocabulary, {
          partOfSpeech,
          verbGroup,
          targetForms
        })
      );
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
      sessionSeed
    ]
  );
  // Review and 今日練習 are FINITE passes over a snapshot: walk each item
  // once, no modulo wrap, then stop (and show a completion screen). Every
  // other mode is an endless drill (modulo wrap via selectQuestion).
  // Looping review would re-show items the learner just cleared -- exactly
  // the "錯題一直輪迴" report. Correctly-answered items leave the SRS due
  // set (next session), wrong ones reset to box 0 and return next session.
  const isFinitePass = isReviewFocus || isDailyFocus;
  const currentQuestion = isFinitePass
    ? questions[questionIndex] ?? null
    : selectQuestion(questions, questionIndex);
  const reviewEmpty = isReviewFocus && questions.length === 0;
  const sessionExhausted =
    isFinitePass && questions.length > 0 && questionIndex >= questions.length;
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

  const handlePracticeModeChange = (nextMode: PracticeMode) => {
    if (nextMode === practiceMode) return;
    setPracticeMode(nextMode);
    // Clear any chapter-driven filter when the learner switches modes
    // via the picker -- the picker means "give me a fresh mix",
    // whereas a chapter drill button sets a specific patternIds filter.
    setPracticeFilter({});
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

  return {
    partOfSpeech,
    verbGroup,
    practiceFocus,
    practiceMode,
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
    handlePracticeModeChange,
    handleChoiceSubmit,
    nextQuestion,
    resetSession,
    revealAnswer,
    handleDrillKeyDown
  };
}

export type PracticeSession = ReturnType<typeof usePracticeSession>;
