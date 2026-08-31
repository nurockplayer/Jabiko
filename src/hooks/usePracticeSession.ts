import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { ADJECTIVE_FORMS, normalizeAnswer, VERB_FORMS } from "../domain/conjugation";
import { VOCAB_LEVEL_RANGE_OPTIONS, type LevelRange } from "../domain/levelRange";
import { examPresetForRange, type ModeCopyKey, type PracticeMode } from "../domain/practiceMode";
import type { KanaScript } from "../domain/kana";
import type { MockExamLevel } from "../domain/mockExam";
import { type SentencePatternId } from "../domain/sentencePatterns";
import {
  buildChoiceOptions,
  getMistakeQuestions,
  getReviewQueue,
  isRecallEligibleQuestion,
  scoreAttempt,
  selectQuestion
} from "../domain/practice";
import {
  buildAllKnownQuestions,
  buildModeCounts,
  buildPracticeQuestions,
  getAvailableBasicLevels,
  resolveBookmarkedQuestions,
  type PracticePoolOptions,
  uniqueForms
} from "../domain/sessionPools";
import { collectAttemptedIds } from "../domain/unattempted";
import { getBookmarkedIds, toggleBookmark } from "../domain/bookmarks";
import type { Attempt, JlptLevel, PartOfSpeech, TargetForm, VerbGroup } from "../domain/types";
import { readStored, writeStored } from "../domain/safeStorage";
import { copy, type Language } from "../i18n";
import { trackEvent } from "../lib/analytics";
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

export type PracticeFocus =
  | "single"
  | "coreConjugation"
  | "teTa"
  | "negative"
  | "plain"
  | "adverbial"
  | "obligationPast";
export type PracticeAnswerMode = "choice" | "recall";
// Re-exported (the canonical type now lives in domain/practiceMode) so the
// many `import { PracticeMode } from "../hooks/usePracticeSession"` sites keep working.
export type { PracticeMode };
export type PracticeFilter = {
  // Focused basic-practice filters. Undefined means no restriction; an
  // explicit empty array intentionally produces a zero-question pass.
  levels?: JlptLevel[];
  verbGroups?: VerbGroup[];
  patternIds?: SentencePatternId[];
  // Narrows exam mode to one JLPT section (by level + promptLabel), set
  // when the learner taps a section card in the 模擬考 picker.
  examSection?: { level: MockExamLevel; promptLabel: string };
  // Which gojuon script the kana recognition drill covers (#533); set by
  // the 入門 chapter CTAs. Kana mode without it defaults to hiragana.
  kanaScript?: KanaScript;
};

function copyPracticeFilter(filter: PracticeFilter): PracticeFilter {
  return {
    ...filter,
    levels: filter.levels === undefined ? undefined : [...filter.levels],
    verbGroups: filter.verbGroups === undefined ? undefined : [...filter.verbGroups]
  };
}

function initialPracticeFilter(init: SessionInit | undefined): PracticeFilter {
  if (init?.filter !== undefined) {
    return copyPracticeFilter(init.filter);
  }
  return {};
}

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
  answerMode?: PracticeAnswerMode;
  targetForm?: TargetForm;
  // JLPT level range for the exam (綜合) + vocab (単字) pools; default all.
  levelRange?: LevelRange;
};

type LivePracticePoolInputs = Pick<
  PracticePoolOptions,
  "reviewQueue" | "bookmarkedQuestions" | "attemptedIds"
>;

// One immutable set of pool-building inputs for the active pass. Live
// progress and bookmark changes are intentionally captured only when a
// mode/config change or explicit reset starts a new pass.
type PracticePoolSnapshot = Readonly<
  PracticePoolOptions & Pick<PracticeSessionConfig, "answerMode">
>;

// The static half of a pass snapshot: every knob that defines the pool
// (mode / filters / word type / form / range / length) plus the resolved
// targetForms. Stored as ONE immutable object so a new pass can be started
// from the config that is current AT THE EVENT -- never a render behind
// (#679). This replaces the old render-phase `latestPoolInputsRef` write.
export type PracticeSessionConfig = {
  mode: PracticeMode;
  filter: PracticeFilter;
  partOfSpeech: PartOfSpeech | "mixed";
  verbGroup: VerbGroup | "all";
  practiceFocus: PracticeFocus;
  answerMode: PracticeAnswerMode;
  targetForm: TargetForm;
  levelRange: LevelRange;
  sessionLength: number | null;
  targetForms: TargetForm[];
};

// The level range a session starts in (#199). An explicit launch request
// (init.levelRange) always wins; otherwise it inherits the learner's global
// target preference. 単字's picker offers all/n1n2/n2n3/n4n5 (#668); the one
// band it cannot show is starter (完全新手 drills 入門 content instead), so a
// starter preference clamps to "all" for that mode -- its picker can't show
// starter and the pool would be empty. Pure so it can be unit-tested without
// mounting the hook.
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
  {
    value: "coreConjugation",
    targetForms: ["masu", "nai", "te", "ta", "potential", "volitional"],
    verbOnly: true
  },
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

// The curated (non-basic) modes build their pool from the mode + range alone;
// targetForms are irrelevant to their pool construction, so they resolve to [].
function isCuratedMode(mode: PracticeMode): boolean {
  return (
    mode === "exam" ||
    mode === "cloze" ||
    mode === "pattern" ||
    mode === "review" ||
    mode === "vocab" ||
    mode === "daily" ||
    mode === "kana" ||
    mode === "starter" ||
    mode === "bookmarks"
  );
}

// Pure (#679): the target forms the basic pool builds for a config. Curated
// modes return []; "single" focus uses the selected form; multi-form focuses
// use their fixed list. Extracted from the hook so a fresh pass can resolve
// targetForms for the NEW config (not the render-behind one). Always returns
// a fresh array -- never the shared focusOptions lists by reference.
export function resolveTargetForms(config: {
  partOfSpeech: PartOfSpeech | "mixed";
  targetForm: TargetForm;
  practiceFocus: PracticeFocus;
  mode: PracticeMode;
}): TargetForm[] {
  if (isCuratedMode(config.mode)) return [];
  const baseCompatibleForms =
    config.partOfSpeech === "mixed"
      ? uniqueForms([...VERB_FORMS, ...ADJECTIVE_FORMS])
      : config.partOfSpeech === "verb"
        ? VERB_FORMS
        : ADJECTIVE_FORMS;
  const compatibleForms = uniqueForms([...baseCompatibleForms, "reading", "meaning"]);
  const selectedForm = compatibleForms.includes(config.targetForm)
    ? config.targetForm
    : compatibleForms[0];
  if (config.practiceFocus === "single") return [selectedForm];
  return [...(focusOptions.find((option) => option.value === config.practiceFocus)?.targetForms ?? [selectedForm])];
}

function pruneUnavailableLevels(
  levels: JlptLevel[] | undefined,
  availableLevels: readonly JlptLevel[]
): JlptLevel[] | undefined {
  if (levels === undefined) return undefined;
  if (levels.length === 0) return [];
  const available = new Set(availableLevels);
  const pruned = levels.filter((level) => available.has(level));
  return pruned.length > 0 ? pruned : undefined;
}

function preparePracticeSessionConfig(
  config: PracticeSessionConfig
): PracticeSessionConfig {
  const targetForms = resolveTargetForms(config);
  const filter = copyPracticeFilter(config.filter);
  if (config.mode !== "basic") return { ...config, filter, targetForms };

  const availableLevels = getAvailableBasicLevels({
    partOfSpeech: config.partOfSpeech,
    verbGroups: filter.verbGroups,
    verbGroup: config.verbGroup,
    targetForms
  });
  return {
    ...config,
    filter: {
      ...filter,
      levels: pruneUnavailableLevels(filter.levels, availableLevels)
    },
    targetForms
  };
}

function makeInitialConfig(
  init: SessionInit | undefined,
  targetLevel: LevelRange | null
): PracticeSessionConfig {
  const config = {
    mode: init?.mode ?? "daily",
    filter: initialPracticeFilter(init),
    partOfSpeech: init?.partOfSpeech ?? "verb",
    verbGroup: init?.verbGroup ?? "godan",
    practiceFocus: init?.practiceFocus ?? "single",
    answerMode: init?.answerMode ?? "choice",
    targetForm: init?.targetForm ?? "te",
    levelRange: initialLevelRange(init, targetLevel),
    sessionLength: readSessionLength()
  };
  return preparePracticeSessionConfig({
    ...config,
    targetForms: resolveTargetForms(config)
  });
}

// Pure snapshot builder (#679): merges the static config with the live
// progress/bookmark inputs captured at pass start into one immutable
// PracticePoolOptions. Copies the arrays/Set so a later change to the live
// inputs (or the shared focusOptions lists) can never mutate the stored pass.
export function createPracticePoolSnapshot(
  config: PracticeSessionConfig,
  liveInputs: LivePracticePoolInputs
): PracticePoolSnapshot {
  return {
    mode: config.mode,
    answerMode: config.answerMode,
    examSection: config.filter.examSection,
    patternIds: config.filter.patternIds,
    kanaScript: config.filter.kanaScript,
    levels: config.filter.levels === undefined ? undefined : [...config.filter.levels],
    verbGroups:
      config.filter.verbGroups === undefined ? undefined : [...config.filter.verbGroups],
    partOfSpeech: config.partOfSpeech,
    // Explicit arrays are authoritative; without one, retain the scalar launch
    // contract for legacy mixed/basic callers.
    verbGroup: config.filter.verbGroups === undefined ? config.verbGroup : "all",
    targetForms: [...config.targetForms],
    levelRange: config.levelRange,
    sessionLength: config.sessionLength,
    reviewQueue: [...liveInputs.reviewQueue],
    bookmarkedQuestions: [...liveInputs.bookmarkedQuestions],
    attemptedIds: liveInputs.attemptedIds ? new Set(liveInputs.attemptedIds) : undefined
  };
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
  // Config is ONE immutable object holding every static knob that defines a
  // pass. A new pass is started only by startNewPass, which builds a fresh
  // snapshot from the event-time config + the live inputs captured right
  // then -- so progress/bookmark/review-queue changes mid-pass never rebuild
  // or reorder the active set (#679). configRef mirrors the config so the
  // setter + resetSession pair (the ModePicker / DrillPanel composition)
  // reads the NEW config in the SAME event, never a render behind.
  const [config, setConfig] = useState<PracticeSessionConfig>(() => makeInitialConfig(init, targetLevel));
  const configRef = useRef<PracticeSessionConfig>(config);
  const {
    mode: practiceMode,
    filter: practiceFilter,
    partOfSpeech,
    verbGroup,
    practiceFocus,
    targetForm,
    levelRange,
    sessionLength,
    targetForms
  } = config;

  const [questionIndex, setQuestionIndex] = useState(0);
  const [sessionSeed, setSessionSeed] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const startedAtRef = useRef<number | null>(null);
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
  const isKanaFocus = practiceMode === "kana";
  const isStarterFocus = practiceMode === "starter";
  const isBookmarksFocus = practiceMode === "bookmarks";
  const isCuratedFocus =
    isExamFocus ||
    isClozeFocus ||
    isPatternFocus ||
    isReviewFocus ||
    isVocabFocus ||
    isDailyFocus ||
    isKanaFocus ||
    isStarterFocus ||
    isBookmarksFocus;
  // The session-length picker applies to the endless drill modes (exam /
  // cloze / pattern / vocab / basic). review clears the whole due queue,
  // 今日練習 is already a fixed ~20 set, and 收藏 is a finite pass over the
  // saved set (#470), so none of them is capped.
  const showSessionLength = !isReviewFocus && !isDailyFocus && !isBookmarksFocus;
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

  // Bookmarks (#470). localStorage has no change events we subscribe to, so
  // a version counter (bumped by onToggleBookmark) is what re-reads the
  // stored ids -- keeping the mode-card count and the 收藏 pool reactive to
  // the learner's own stars without a live storage listener.
  const [bookmarkVersion, setBookmarkVersion] = useState(0);
  // bookmarkVersion is the reactivity trigger: localStorage fires no change
  // events, so the counter (bumped by onToggleBookmark) is what re-reads the
  // stored ids. `void bookmarkVersion` inside each memo marks it as a read
  // dep so the linter keeps it instead of treating it as unused.
  const bookmarkedIds = useMemo(() => {
    void bookmarkVersion;
    return new Set(getBookmarkedIds());
  }, [bookmarkVersion]);
  // Preserve bookmark add-order (getBookmarkedIds order), not allKnownQuestions
  // order -- a plain filter would replay the pass in bank order (#470 review).
  const bookmarkedQuestions = useMemo(
    () => {
      void bookmarkVersion;
      return resolveBookmarkedQuestions(getBookmarkedIds(), allKnownQuestions);
    },
    [allKnownQuestions, bookmarkVersion]
  );
  const isQuestionBookmarked = (questionId: string) => bookmarkedIds.has(questionId);
  const onToggleBookmark = (questionId: string) => {
    toggleBookmark(questionId);
    setBookmarkVersion((version) => version + 1);
  };

  // Every question the learner has attempted, so the exam pool surfaces 新題
  // (unattempted) first (#385). The live value is captured into the session
  // snapshot below on mode/config change or reset, never mid-session.
  const attemptedIds = useMemo(() => collectAttemptedIds(progressAttempts), [progressAttempts]);

  // Pool size per practice mode, shown on the mode cards so the learner
  // can see how big each bank is before picking. Static pools are
  // computed once; "basic" is intentionally omitted (its size depends on
  // the chosen word type / verb group / form), and "review" is dynamic
  // (the due count) so it's read from reviewQueue at render time.
  const modeCounts = useMemo(() => buildModeCounts(), []);
  const selectedVerbGroups = useMemo(
    () =>
      practiceFilter.verbGroups === undefined
        ? verbGroup === "all"
          ? undefined
          : [verbGroup]
        : [...practiceFilter.verbGroups],
    [practiceFilter.verbGroups, verbGroup]
  );
  const availableBasicLevels = useMemo(
    () =>
      getAvailableBasicLevels({
        partOfSpeech,
        verbGroups: practiceFilter.verbGroups,
        verbGroup,
        targetForms
      }),
    [partOfSpeech, practiceFilter.verbGroups, targetForms, verbGroup]
  );
  const isVerbCapable = partOfSpeech === "verb" || partOfSpeech === "mixed";
  const availableFocusOptions = focusOptions.filter((option) => {
    if (option.verbOnly && !isVerbCapable) return false;
    if (option.value === "adverbial" && partOfSpeech === "verb") return false;
    return true;
  });
  const activeFocusForms = targetForms.filter((form) => compatibleForms.includes(form));
  // Exam mode is one PracticeMode but several picker presets (綜合 / 備考
  // bands). Map the active mode+range to the matching copy key (via the
  // single EXAM_PRESET_BY_RANGE table) so the summary + mode description
  // reflect the chosen 備考 preset, not the generic 綜合考題庫 text.
  const activeModeCopyKey: ModeCopyKey =
    practiceMode === "exam" ? examPresetForRange(levelRange) : practiceMode;
  const focusSummary = isCuratedFocus
    ? t.modeOptions[activeModeCopyKey].subtitle
    : practiceFocus === "single"
    ? t.targetForms[selectedForm]
    : activeFocusForms.map((form) => t.targetForms[form]).join(" / ") || t.focusSummaryEmpty;

  // The active pass's fixed inputs. STATE, not a memo over latest refs: a new
  // snapshot is created ONLY by startNewPass (mode/config change or explicit
  // reset), so live progress / bookmark / review-queue changes never rebuild
  // or reorder the current set (#679). Initialized once from the launch
  // config + the first render's live inputs.
  const [poolSnapshot, setPoolSnapshot] = useState<PracticePoolSnapshot>(() =>
    createPracticePoolSnapshot(config, { reviewQueue, bookmarkedQuestions, attemptedIds })
  );
  const answerMode = poolSnapshot.answerMode;

  const questions = useMemo(() => buildPracticeQuestions(poolSnapshot), [poolSnapshot]);
  // Review and 今日練習 are FINITE passes over a snapshot: walk each item
  // once, no modulo wrap, then stop (and show a completion screen). Every
  // other mode is an endless drill (modulo wrap via selectQuestion).
  // Looping review would re-show items the learner just cleared -- exactly
  // the "錯題一直輪迴" report. Correctly-answered items leave the SRS due
  // set (next session), wrong ones reset to box 0 and return next session.
  // A capped endless mode (#154) also becomes a finite pass: walk the
  // sliced pool once, then show the completion screen ("再來一組" reshuffles
  // a fresh capped set via resetSession).
  const isFinitePass = isReviewFocus || isDailyFocus || isBookmarksFocus || isCapped;
  const currentQuestion = isFinitePass
    ? questions[questionIndex] ?? null
    : selectQuestion(questions, questionIndex);
  const isRecallQuestion =
    answerMode === "recall" &&
    currentQuestion !== null &&
    isRecallEligibleQuestion(currentQuestion);
  const reviewEmpty = isReviewFocus && questions.length === 0;
  const bookmarksEmpty = isBookmarksFocus && questions.length === 0;
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

  // Phase 1 analytics (#404): fire practice_completed on the rising edge of
  // sessionExhausted. resetSession brings it back to false so the next
  // completion re-fires. Keeping the edge-detection here (not in
  // ChallengePanel) consolidates all practice-session analytics in the hook,
  // since it already owns answer_submitted and session-level_changed.
  // Must appear after correctCount / sessionTotal / practiceMode are
  // declared to avoid TDZ violations.
  const prevExhaustedRef = useRef(false);
  useEffect(() => {
    if (!prevExhaustedRef.current && sessionExhausted) {
      trackEvent("practice_completed", {
        source: practiceMode,
        level: practiceFilter.examSection?.level ?? "all",
        totalQuestions: sessionTotal ?? attempts.length,
        correctCount,
        locale: language
      });
    }
    prevExhaustedRef.current = sessionExhausted;
    // practiceFilter.examSection covers every field read above (its .level is a
    // child); the rule wants the optional-chain leaf, but re-running on that
    // same ref would re-track the event on every section-object identity change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionExhausted, practiceMode, sessionTotal, attempts.length, correctCount, language]);

  useEffect(() => {
    if (feedback) {
      nextButtonRef.current?.focus({ preventScroll: true });
    }
  }, [feedback]);

  // ---- #680: the session response-timer clock. startedAtRef starts null and
  // is only ever written by beginSessionClock(), which runs from event
  // handlers / effects -- NEVER during render, so the hook stays pure for the
  // React Compiler `purity` rule (no useRef(Date.now()) render-time call).
  // The clock re-bases on an explicit new pass (startNewPass) or next question
  // (nextQuestion); a plain re-render never restarts it.
  const beginSessionClock = (): number => {
    startedAtRef.current = Date.now();
    return startedAtRef.current;
  };

  // The initial pass starts its clock on mount (an effect, after the pass is
  // fully initialised). StrictMode double-invokes effects, but beginSessionClock
  // is idempotent (it just rewrites the ref), so the clock is not doubled.
  useEffect(() => {
    beginSessionClock();
  }, []);

  // ---- #679: the single entry that starts a new pass. Every mode / filter /
  // part-of-speech / focus / form / level-range / session-length change and
  // "再來一組" goes through startNewPass; nothing else may build a snapshot.
  // The live inputs (reviewQueue / bookmarkedQuestions / attemptedIds) are
  // captured from THIS event's closure, so later progress/bookmark changes
  // won't touch the stored pass until the next explicit start/reset.
  const updateConfig = (nextConfig: PracticeSessionConfig) => {
    // Resolve targetForms for the NEW config so a mode/focus/form change can
    // never carry a stale form set into the fresh pass (e.g. daily -> exam).
    const next = preparePracticeSessionConfig(nextConfig);
    configRef.current = next;
    setConfig(next);
    return next;
  };

  const startNewPass = (nextConfig: PracticeSessionConfig) => {
    const next = updateConfig(nextConfig);
    setPoolSnapshot(
      createPracticePoolSnapshot(next, { reviewQueue, bookmarkedQuestions, attemptedIds })
    );
    setAttempts([]);
    setQuestionIndex(0);
    setSessionSeed((seed) => seed + 1);
    setSelectedChoice(null);
    setFeedback(null);
    beginSessionClock();
  };

  // Raw setters (ModePicker / DrillPanel call these then resetSession): they
  // update the config immediately so the same-event resetSession captures the
  // NEW config via configRef -- not a render behind. The snapshot is only
  // rebuilt by the resetSession -> startNewPass call, exactly like before.
  const setPartOfSpeech = (next: PartOfSpeech | "mixed") =>
    updateConfig({ ...configRef.current, partOfSpeech: next });
  const setVerbGroup = (next: VerbGroup | "all") =>
    updateConfig({
      ...configRef.current,
      verbGroup: next,
      filter: {
        ...configRef.current.filter,
        verbGroups: undefined
      }
    });
  const setTargetForm = (next: TargetForm) =>
    updateConfig({ ...configRef.current, targetForm: next });
  const setPracticeFocus = (next: PracticeFocus) =>
    updateConfig({ ...configRef.current, practiceFocus: next });
  const setPracticeMode = (next: PracticeMode) =>
    updateConfig({ ...configRef.current, mode: next });
  const setPracticeFilter = (next: PracticeFilter) =>
    updateConfig({ ...configRef.current, filter: next });

  const handlePracticeFilterChange = (nextFilter: PracticeFilter) => {
    startNewPass({ ...configRef.current, filter: nextFilter });
  };

  const handleVerbGroupsChange = (nextVerbGroups: VerbGroup[] | undefined) => {
    startNewPass({
      ...configRef.current,
      verbGroup: "all",
      filter: {
        ...configRef.current.filter,
        verbGroups: nextVerbGroups === undefined ? undefined : [...nextVerbGroups]
      }
    });
  };

  const handlePartOfSpeechChange = (nextPartOfSpeech: PartOfSpeech | "mixed") => {
    const leavingVerbPractice = nextPartOfSpeech !== "verb";
    startNewPass({
      ...configRef.current,
      partOfSpeech: nextPartOfSpeech,
      verbGroup: leavingVerbPractice ? "all" : configRef.current.verbGroup,
      filter: leavingVerbPractice
        ? { ...configRef.current.filter, verbGroups: undefined }
        : configRef.current.filter,
      answerMode: leavingVerbPractice ? "choice" : configRef.current.answerMode,
      practiceFocus: "single",
      targetForm: nextPartOfSpeech === "verb" || nextPartOfSpeech === "mixed" ? "te" : "plainPresentNegative"
    });
  };

  const handlePracticeFocusChange = (nextFocus: PracticeFocus) => {
    startNewPass({ ...configRef.current, practiceFocus: nextFocus });
  };

  const handleAnswerModeChange = (nextMode: PracticeAnswerMode) => {
    if (nextMode === configRef.current.answerMode) return;
    startNewPass({ ...configRef.current, answerMode: nextMode });
  };

  // The mode picker lists the exam pool as three side-by-side presets
  // (綜合 / N1 備考 / N2 備考), so picking one sets BOTH the mode and its
  // level range at once. Non-exam presets pass "all" (a no-op for the
  // modes that ignore levelRange). Mode-specific filters are cleared so the
  // picker starts a fresh mix, while focused-basic selections survive a
  // round trip through another mode.
  const applyModePreset = (nextMode: PracticeMode, nextRange?: LevelRange) => {
    // An explicit range (the exam 綜合 / 備考 cards) wins; otherwise inherit
    // the global target preference, so daily / 単字 keep honouring it when
    // re-picked from the in-session picker -- not only on first mount (#199).
    const resolvedRange = nextRange ?? initialLevelRange({ mode: nextMode }, targetLevel);
    if (nextMode === practiceMode && resolvedRange === levelRange) return;
    const { levels, verbGroups } = configRef.current.filter;
    startNewPass({
      ...configRef.current,
      mode: nextMode,
      levelRange: resolvedRange,
      filter: {
        ...(levels === undefined ? {} : { levels: [...levels] }),
        ...(verbGroups === undefined ? {} : { verbGroups: [...verbGroups] })
      }
    });
  };

  const handleLevelRangeChange = (nextRange: LevelRange) => {
    if (nextRange === levelRange) return;
    trackEvent("level_changed", { scope: "session", levelRange: nextRange, locale: language });
    startNewPass({ ...configRef.current, levelRange: nextRange });
  };

  const handleSessionLengthChange = (nextLength: number | null) => {
    if (nextLength === sessionLength) return;
    writeStored(SESSION_LENGTH_KEY, nextLength === null ? "all" : String(nextLength));
    startNewPass({ ...configRef.current, sessionLength: nextLength });
  };

  // handleChoiceSubmit closes over currentQuestion/feedback/practiceMode/etc.,
  // so it can never be a stable callback without mirroring all of them as
  // useCallback deps (and the keydown effect below re-subscribes whenever they
  // change anyway). Wrapping it would add a stale-closure risk for no behavior
  // gain; the effect re-binds on every render as-is, which is correct.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleChoiceSubmit = (choice: string) => {
    if (!currentQuestion || feedback || normalizeAnswer(choice).length === 0) {
      return;
    }

    setSelectedChoice(choice);

    const attempt = scoreAttempt(
      currentQuestion,
      choice,
      // The clock was started on mount / startNewPass / nextQuestion. If the
      // ref is somehow still null (an extreme path that skipped those), the
      // event handler initialises it right here -- never a render fallback.
      startedAtRef.current ?? beginSessionClock()
    );
    setAttempts((current) => [...current, attempt]);
    recordAttempt(attempt);
    setFeedback({
      status: attempt.isCorrect ? "correct" : "incorrect",
      question: currentQuestion,
      submittedAnswer: choice
    });
    // Phase 1 analytics (#404): metadata only — no question text, no user
    // answer. questionType reuses practiceMode (a coarse, content-free label)
    // to avoid leaking the question surface; level is the fixed mock-section
    // level when present, else "all" (levelRange is a band, not a level).
    trackEvent("answer_submitted", {
      source: practiceMode,
      level: practiceFilter.examSection?.level ?? "all",
      questionType: practiceMode,
      isCorrect: attempt.isCorrect,
      locale: language
    });
  };

  const nextQuestion = () => {
    setQuestionIndex((current) => current + 1);
    setSelectedChoice(null);
    setFeedback(null);
    beginSessionClock();
  };

  // "再來一組" (completion CTA) and the ghost "重設本次" button both land
  // here: start a fresh pass with the CURRENT config, re-shuffling the pool
  // and capturing the latest live inputs (see startNewPass).
  const resetSession = () => {
    startNewPass(configRef.current);
  };

  const revealAnswer = () => {
    if (!currentQuestion || feedback) {
      return;
    }

    const attempt = scoreAttempt(
      currentQuestion,
      "",
      startedAtRef.current ?? beginSessionClock()
    );
    const missedAttempt = { ...attempt, isCorrect: false, submittedAnswer: "(revealed)" };
    setAttempts((current) => [...current, missedAttempt]);
    recordAttempt(missedAttempt);
    setSelectedChoice(null);
    setFeedback({ status: "revealed", question: currentQuestion, submittedAnswer: null });
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
    if (!currentQuestion || feedback || isRecallQuestion) {
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
  }, [currentQuestion, feedback, isRecallQuestion, choiceOptions, handleChoiceSubmit]);

  return {
    partOfSpeech,
    verbGroup,
    practiceFilter,
    practiceFocus,
    answerMode,
    practiceMode,
    levelRange,
    showLevelRange,
    sessionLength,
    showSessionLength,
    sessionTotal,
    selectedForm,
    questionIndex,
    sessionSeed,
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
    availableBasicLevels,
    selectedVerbGroups,
    availableFocusOptions,
    focusSummary,
    activeModeCopyKey,
    reviewQueue,
    bookmarkedQuestions,
    isQuestionBookmarked,
    onToggleBookmark,
    modeCounts,
    currentQuestion,
    isRecallQuestion,
    reviewEmpty,
    bookmarksEmpty,
    sessionExhausted,
    choiceOptions,
    mistakeQuestions,
    correctCount,
    accuracy,
    nextButtonRef,
    // The response-timer base, exposed so the #680 tests can force the
    // never-started (null) branch; production reads it only through the
    // handlers below.
    startedAtRef,
    handlePartOfSpeechChange,
    handlePracticeFocusChange,
    handleAnswerModeChange,
    handlePracticeFilterChange,
    handleVerbGroupsChange,
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
