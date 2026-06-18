import { KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Clock,
  Eye,
  GraduationCap,
  Languages,
  Moon,
  RotateCcw,
  Sun,
  Timer,
  Volume2,
  XCircle
} from "lucide-react";
import { ADJECTIVE_FORMS, VERB_FORMS } from "./domain/conjugation";
import { buildClozeQuestionPool } from "./domain/cloze";
import { clozeSentences } from "./domain/cloze-data";
import { buildExamQuestionPool } from "./domain/examBlocks";
import {
  composeMockExam,
  flattenMockExam,
  summarizeMockExam,
  type MockExamLevel,
  type MockExamPlan,
  type MockExamSummary
} from "./domain/mockExam";
import {
  getIncompletePrereqs,
  isLearningBlockComplete,
  learningBlocks,
  type LearningBlockDrillPreset
} from "./domain/learningBlocks";
import { buildSentencePatternPool, type SentencePatternId } from "./domain/sentencePatterns";
import {
  buildChoiceOptions,
  buildQuestionPool,
  getMistakeQuestions,
  getReviewQueue,
  scoreAttempt,
  selectQuestion,
  shuffleQuestions
} from "./domain/practice";
import { createAttemptStore } from "./domain/storage";
import type { Attempt, PartOfSpeech, PracticeQuestion, TargetForm, VerbGroup } from "./domain/types";
import { vocabulary } from "./domain/vocabulary";
import { jlptVocabulary } from "./domain/vocabulary-jlpt";
import { copy, getInitialLanguage, languageOptions, storeLanguage, type Copy, type Language } from "./i18n";
import "./styles.css";

type Feedback =
  | { status: "correct"; question: PracticeQuestion }
  | { status: "incorrect"; question: PracticeQuestion }
  | { status: "revealed"; question: PracticeQuestion }
  | null;

type PracticeFocus = "single" | "teTa" | "negative" | "plain" | "adverbial" | "obligationPast";
type PracticeMode = "basic" | "cloze" | "pattern" | "exam" | "review" | "vocab";
type PracticeFilter = { patternIds?: SentencePatternId[] };
type AppView = "home" | "learn" | "challenge" | "mock";
type Theme = "light" | "dark";
type DrillPreset = LearningBlockDrillPreset;

const THEME_STORAGE_KEY = "jabiko.theme";

const partOfSpeechOptions: Array<PartOfSpeech | "mixed"> = ["verb", "i_adjective", "na_adjective", "noun", "mixed"];

const verbGroupOptions: Array<VerbGroup | "all"> = ["godan", "ichidan", "irregular", "all"];

const formOptions: TargetForm[] = [
  "te",
  "ta",
  "nai",
  "negativeTe",
  "negativeContinuative",
  "adverbial",
  "obligationPast",
  "masu",
  "potential",
  "volitional",
  "causative",
  "passive",
  "reading",
  "meaning",
  "plainPresentAffirmative",
  "plainPresentNegative",
  "plainPastAffirmative",
  "plainPastNegative"
];


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

const practiceModeOrder: PracticeMode[] = ["basic", "cloze", "pattern", "exam", "vocab", "review"];

const attemptStore = createAttemptStore();

export default function App() {
  const [appView, setAppView] = useState<AppView>("home");
  const [partOfSpeech, setPartOfSpeech] = useState<PartOfSpeech | "mixed">("verb");
  const [verbGroup, setVerbGroup] = useState<VerbGroup | "all">("godan");
  const [targetForm, setTargetForm] = useState<TargetForm>("te");
  const [practiceFocus, setPracticeFocus] = useState<PracticeFocus>("single");
  const [practiceMode, setPracticeMode] = useState<PracticeMode>("basic");
  const [practiceFilter, setPracticeFilter] = useState<PracticeFilter>({});
  const [theme, setTheme] = useState<Theme>(() => getInitialTheme());
  const [language, setLanguage] = useState<Language>(() => getInitialLanguage());
  const [questionIndex, setQuestionIndex] = useState(0);
  const [sessionSeed, setSessionSeed] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [progressAttempts, setProgressAttempts] = useState<Attempt[]>(() => attemptStore.list());
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
  const isCuratedFocus =
    isExamFocus || isClozeFocus || isPatternFocus || isReviewFocus || isVocabFocus;

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
        // Don't shuffle: getReviewQueue already orders by recency-of-miss
        // so the freshest mistakes come first. Shuffling here would
        // throw that away.
        return reviewQueue;
      }

      if (isVocabFocus) {
        // 単字 mode: N1/N2 vocabulary drill, alternating reading +
        // meaning prompts. Pool is the JLPT vocabulary export (which
        // is N1 + N2 nouns / na-adjectives); each entry produces two
        // PracticeQuestions (one per target form), then we shuffle.
        return shuffleQuestions(
          buildQuestionPool(jlptVocabulary, {
            partOfSpeech: "mixed",
            verbGroup: "all",
            targetForms: ["reading", "meaning"]
          })
        );
      }

      return shuffleQuestions(
        buildQuestionPool(vocabulary, {
          partOfSpeech,
          verbGroup,
          targetForms
        })
      );
    },
    [
      isExamFocus,
      isClozeFocus,
      isPatternFocus,
      isReviewFocus,
      isVocabFocus,
      reviewQueue,
      practiceFilter.patternIds,
      partOfSpeech,
      targetForms,
      verbGroup,
      sessionSeed
    ]
  );
  const currentQuestion = selectQuestion(questions, questionIndex);
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

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    storeTheme(nextTheme);
  };

  const handleLanguageChange = (nextLanguage: Language) => {
    setLanguage(nextLanguage);
    storeLanguage(nextLanguage);
  };

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
    setProgressAttempts((current) => [...current, attempt]);
    attemptStore.add(attempt);
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
    setProgressAttempts((current) => [...current, missedAttempt]);
    attemptStore.add(missedAttempt);
    setSelectedChoice(null);
    setFeedback({ status: "revealed", question: currentQuestion });
  };

  const handleDrillKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" && feedback) {
      event.preventDefault();
      nextQuestion();
    }
  };

  const themeToggleLabel = theme === "dark" ? t.themeLight : t.themeDark;
  const ThemeIcon = theme === "dark" ? Sun : Moon;
  const startDrill = (preset: DrillPreset) => {
    setPracticeMode("basic");
    setPracticeFilter({});
    setPartOfSpeech(preset.partOfSpeech);
    setVerbGroup(preset.verbGroup ?? "all");
    setPracticeFocus(preset.practiceFocus);
    setTargetForm(preset.targetForm);
    resetSession();
    setAppView("challenge");
  };

  const startPatternDrill = (patternIds: SentencePatternId[]) => {
    setPracticeMode("pattern");
    setPracticeFilter({ patternIds });
    resetSession();
    setAppView("challenge");
  };

  return (
    <main className="app-shell">
      <div className="app-heading" aria-label={t.appIntroLabel}>
        <div>
          <p className="eyebrow">Minna no Nihongo practice</p>
          <h1>{t.appTitle}</h1>
        </div>
        <div className="heading-actions">
          <p>{t.appTagline}</p>
          <div className="language-switch" aria-label="Language">
            <Languages aria-hidden="true" />
            {languageOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={language === option.value ? "selected" : ""}
                onClick={() => handleLanguageChange(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <button className="theme-toggle" type="button" onClick={toggleTheme}>
            <ThemeIcon aria-hidden="true" />
            {themeToggleLabel}
          </button>
        </div>
      </div>

      <nav className="view-switch segmented" aria-label={t.flowLabel}>
        <button
          type="button"
          className={appView === "home" ? "selected" : ""}
          onClick={() => setAppView("home")}
        >
          {t.home}
        </button>
        <button
          type="button"
          className={appView === "learn" ? "selected" : ""}
          onClick={() => setAppView("learn")}
        >
          {t.learn}
        </button>
        <button
          type="button"
          className={appView === "challenge" ? "selected" : ""}
          onClick={() => setAppView("challenge")}
        >
          {t.challenge}
        </button>
        <button
          type="button"
          className={appView === "mock" ? "selected" : ""}
          onClick={() => setAppView("mock")}
        >
          {t.mockExam}
        </button>
      </nav>

      {appView === "home" ? (
        <HomePanel
          language={language}
          progressAttempts={progressAttempts}
          reviewCount={reviewQueue.length}
          onNavigate={(target) => setAppView(target)}
          onStartReview={() => {
            setPracticeMode("review");
            setPracticeFilter({});
            resetSession();
            setAppView("challenge");
          }}
          onStartVocab={() => {
            setPracticeMode("vocab");
            setPracticeFilter({});
            resetSession();
            setAppView("challenge");
          }}
        />
      ) : appView === "learn" ? (
        <LearningPanel
          language={language}
          progressAttempts={progressAttempts}
          reviewCount={reviewQueue.length}
          onStartChallenge={() => setAppView("challenge")}
          onStartReview={() => {
            setPracticeMode("review");
            setPracticeFilter({});
            resetSession();
            setAppView("challenge");
          }}
          onStartDrill={startDrill}
          onStartPatternDrill={startPatternDrill}
        />
      ) : appView === "mock" ? (
        <MockExamPanel language={language} onExit={() => setAppView("home")} />
      ) : (
        <section className="practice-layout" aria-label="Jabiko practice">
        <aside className="controls-panel" aria-label={t.settingsLabel}>
          <div className="brand-lockup">
            <BookOpen aria-hidden="true" />
            <div>
              <p>Jabiko</p>
              <h2>{t.todayPractice}</h2>
            </div>
          </div>

          <fieldset>
            <legend>{t.practiceMode}</legend>
            <div className="mode-toggle">
              {practiceModeOrder.map((mode) => (
                <button
                  key={mode}
                  type="button"
                  className={`mode-card${practiceMode === mode ? " selected" : ""}`}
                  aria-pressed={practiceMode === mode}
                  onClick={() => handlePracticeModeChange(mode)}
                >
                  <strong>{t.modeOptions[mode].title}</strong>
                  <small>{t.modeOptions[mode].subtitle}</small>
                </button>
              ))}
            </div>
          </fieldset>

          {practiceMode === "basic" ? (
            <>
              <fieldset>
                <legend>{t.practiceType}</legend>
                <div className="segmented">
                  {partOfSpeechOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      className={partOfSpeech === option ? "selected" : ""}
                      onClick={() => handlePartOfSpeechChange(option)}
                    >
                      {t.partOfSpeech[option]}
                    </button>
                  ))}
                </div>
              </fieldset>

              {availableFocusOptions.length > 0 ? (
                <fieldset>
                  <legend>{t.practiceFocus}</legend>
                  <div className="segmented focus-segmented">
                    {availableFocusOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={practiceFocus === option.value ? "selected" : ""}
                        onClick={() => handlePracticeFocusChange(option.value)}
                      >
                        {t.focusOptions[option.value]}
                      </button>
                    ))}
                  </div>
                </fieldset>
              ) : null}

              {isVerbCapable ? (
                <fieldset>
                  <legend>{t.verbGroup}</legend>
                  <div className="segmented">
                    {verbGroupOptions.map((option) => (
                      <button
                        key={option}
                        type="button"
                        className={verbGroup === option ? "selected" : ""}
                        onClick={() => {
                          setVerbGroup(option);
                          resetSession();
                        }}
                      >
                        {t.verbGroups[option]}
                      </button>
                    ))}
                  </div>
                </fieldset>
              ) : null}

              {practiceFocus === "single" ? (
                <label className="select-label">
                  {t.targetForm}
                  <select
                    value={selectedForm}
                    onChange={(event) => {
                      setTargetForm(event.target.value as TargetForm);
                      resetSession();
                    }}
                  >
                    {formOptions
                      .filter((form) => compatibleForms.includes(form))
                      .map((form) => (
                        <option key={form} value={form}>
                          {t.targetForms[form]}
                        </option>
                      ))}
                  </select>
                </label>
              ) : null}
            </>
          ) : (
            <div className="mode-description">
              <p>{t.modeOptions[practiceMode].subtitle}</p>
            </div>
          )}

          <p className="focus-summary">{focusSummary}</p>

          <div className="score-strip" aria-label="本次練習成績">
            <span>
              <strong>{attempts.length}</strong>
              {t.answered}
            </span>
            <span>
              <strong>{correctCount}</strong>
              {t.correctShort}
            </span>
            <span>
              <strong>{mistakeQuestions.length}</strong>
              {t.reviewShort}
            </span>
          </div>

          <button className="ghost-button" type="button" onClick={resetSession}>
            <RotateCcw aria-hidden="true" />
            {t.resetSession}
          </button>
        </aside>

        <section className="drill-panel" aria-label={t.currentQuestion} onKeyDown={handleDrillKeyDown}>
          {currentQuestion ? (
            <>
              <div className="prompt-header">
                <span>{t.questionNumber(questionIndex + 1)}</span>
                <strong>{currentQuestion.promptLabel ?? t.targetForms[currentQuestion.targetForm]}</strong>
              </div>

              <div className="word-block">
                {currentQuestion.promptText ? (
                  <ExamPrompt question={currentQuestion} language={language} />
                ) : (
                  <>
                    <p className="word-kind">
                      <GraduationCap aria-hidden="true" />
                      {partOfSpeechLabel(currentQuestion.vocabulary.partOfSpeech, language)}
                    </p>
                    {currentQuestion.targetForm === "reading" ? null : (
                      <p className="reading">{currentQuestion.vocabulary.reading}</p>
                    )}
                    <p className="surface">
                      {currentQuestion.vocabulary.surface}
                      <SpeakButton
                        text={currentQuestion.vocabulary.surface}
                        language={language}
                      />
                    </p>
                    {currentQuestion.targetForm === "meaning" ? null : (
                      <p className="meaning">{currentQuestion.vocabulary.meaningZh}</p>
                    )}
                  </>
                )}
              </div>

              <div className="choice-grid" aria-label={t.answerOptions}>
                {choiceOptions.map((choice) => (
                  <button
                    key={choice}
                    type="button"
                    className={choiceOptionClass(choice, selectedChoice, feedback)}
                    disabled={Boolean(feedback)}
                    onClick={() => handleChoiceSubmit(choice)}
                  >
                    {choice}
                  </button>
                ))}
              </div>

              <div className="action-row">
                <button className="ghost-button" type="button" onClick={revealAnswer} disabled={Boolean(feedback)}>
                  <Eye aria-hidden="true" />
                  {t.revealAnswer}
                </button>
                <button className="next-button" type="button" ref={nextButtonRef} onClick={nextQuestion}>
                  <ArrowRight aria-hidden="true" />
                  {t.nextQuestion}
                </button>
              </div>

              {feedback ? <FeedbackPanel feedback={feedback} language={language} /> : null}
            </>
          ) : (
            <div className="empty-state">{t.emptyState}</div>
          )}
        </section>

        <aside className="review-panel" aria-label={t.mistakesLabel}>
          <div className="review-heading">
            <h2>{t.mistakeReview}</h2>
            <span>{accuracy}%</span>
          </div>
          {mistakeQuestions.length > 0 ? (
            <ul>
              {mistakeQuestions.map((question) => (
                <li key={question.id}>
                  {question.vocabulary.surface} {"->"} {question.promptLabel ?? t.targetForms[question.targetForm]}
                </li>
              ))}
            </ul>
          ) : (
            <p>{t.noMistakes}</p>
          )}
        </aside>
        </section>
      )}
    </main>
  );
}

function LearningPanel({
  language,
  progressAttempts,
  reviewCount,
  onStartChallenge,
  onStartReview,
  onStartDrill,
  onStartPatternDrill
}: {
  language: Language;
  progressAttempts: Attempt[];
  reviewCount: number;
  onStartChallenge: () => void;
  onStartReview: () => void;
  onStartDrill: (preset: DrillPreset) => void;
  onStartPatternDrill: (patternIds: SentencePatternId[]) => void;
}) {
  const t = copy[language];
  // PR A: surface only the "basic" learning blocks. PR C will introduce
  // exam-prep blocks alongside these.
  const blockCards = learningBlocks
    .filter((block) => block.group === "basic")
    .map((block) => ({
      block,
      complete: isLearningBlockComplete(progressAttempts, block),
      incompletePrereqs: getIncompletePrereqs(progressAttempts, block)
    }));

  // Default to the first incomplete chapter; fall back to the first
  // chapter if everything is complete (e.g. revisiting after finishing).
  const recommended = blockCards.find((card) => !card.complete) ?? blockCards[0];

  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const activeCard = blockCards.find((card) => card.block.id === selectedBlockId) ?? recommended;
  const active = activeCard.block;

  // Resolve the drill button label from the i18n copy table. The schema
  // stores a plain string key so new drill labels don't require schema
  // updates.
  const drillButtonLabel = (drill: { labelKey: string }): string => {
    const labels = t as unknown as Record<string, string>;
    return labels[drill.labelKey] ?? drill.labelKey;
  };

  const blockTitleById = (id: string): string => {
    const found = learningBlocks.find((b) => b.id === id);
    return found ? found.title : id;
  };

  // Lightweight dashboard stats: derived from the same attemptStore the
  // chapter index uses, so the count stays in sync with whatever the
  // learner just did. accuracyPercent is computed across ALL recorded
  // attempts (not just this session) -- the dashboard's purpose is to
  // surface cross-session signal, not session-local feedback.
  const dashboardTotalAttempts = progressAttempts.length;
  const dashboardCorrectAttempts = progressAttempts.filter((a) => a.isCorrect).length;
  const dashboardAccuracy =
    dashboardTotalAttempts === 0
      ? 0
      : Math.round((dashboardCorrectAttempts / dashboardTotalAttempts) * 100);

  return (
    <section className="learning-panel" aria-label={t.learningRegion}>
      <div className="chapter-shell">
        <aside className="chapter-index" aria-label="學習章節">
          <div className="dashboard-card" aria-label={t.dashboardEyebrow}>
            <p className="eyebrow">{t.dashboardEyebrow}</p>
            {reviewCount > 0 ? (
              <button
                type="button"
                className="dashboard-review-cta"
                onClick={onStartReview}
              >
                <AlertTriangle aria-hidden="true" />
                <span className="dashboard-review-text">
                  {t.dashboardReviewPending(reviewCount)}
                </span>
                <span className="dashboard-review-action">{t.dashboardReviewCta}</span>
              </button>
            ) : (
              <p className="dashboard-review-empty">{t.dashboardReviewEmpty}</p>
            )}
            {dashboardTotalAttempts > 0 ? (
              <div className="dashboard-stats">
                <span>{t.dashboardStatsAttempts(dashboardTotalAttempts)}</span>
                <span>·</span>
                <span>{t.dashboardStatsAccuracy(dashboardAccuracy)}</span>
              </div>
            ) : null}
          </div>
          <div className="chapter-index-copy">
            <p className="eyebrow">課程章節</p>
            <h2>一章一章解鎖</h2>
            <p>選一章看規則、例子與常見陷阱，再到挑戰頁練。</p>
          </div>

          <div className="chapter-list">
            {blockCards.map(({ block, complete, incompletePrereqs }) => (
              <button
                key={block.id}
                type="button"
                className={`chapter-list-button${block.id === active.id ? " selected" : ""}${complete ? " complete" : ""}`}
                aria-label={`查看：${block.title}`}
                aria-pressed={block.id === active.id}
                onClick={() => setSelectedBlockId(block.id)}
              >
                <span>
                  {block.completionMode === "reference"
                    ? "參考"
                    : complete
                    ? "完成"
                    : block.kicker ?? block.category}
                </span>
                <strong>{block.title}</strong>
                <small>
                  {incompletePrereqs.length > 0
                    ? `建議先看：${incompletePrereqs.map(blockTitleById).join("、")}`
                    : block.subtitle}
                </small>
              </button>
            ))}
          </div>

          <button className="secondary-challenge-button" type="button" onClick={onStartChallenge}>
            <ArrowRight aria-hidden="true" />
            {t.startChallenge}
          </button>
        </aside>

        <section className="chapter-content" aria-labelledby="active-chapter-title">
          <div className="chapter-content-head">
            <p className="eyebrow">{active.kicker ?? active.category}</p>
            <h3 id="active-chapter-title">{active.title}</h3>
            <p>{active.explanation}</p>
            {active.subtitle ? (
              <div className="focus-formula" aria-label={`${active.title}例子`}>
                <span>{active.subtitle}</span>
              </div>
            ) : null}
          </div>

          <div className="chapter-lesson">
            <div className="pipeline-grid">
              {active.examples.map((example) => (
                <article className="pipeline-card" key={example.formula}>
                  <code>{example.formula}</code>
                  {example.note ? <p>{example.note}</p> : null}
                </article>
              ))}
            </div>

            {active.pitfalls && active.pitfalls.length > 0 ? (
              <div className="block-pitfalls">
                <p className="block-pitfalls-title">常見陷阱</p>
                <ul>
                  {active.pitfalls.map((pitfall) => (
                    <li key={pitfall}>{pitfall}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {active.patternDrills && active.patternDrills.length > 0 ? (
              <div className="inline-action-row">
                {active.patternDrills.map((drill) => (
                  <button
                    key={drill.labelKey}
                    className="inline-drill-button"
                    type="button"
                    onClick={() => onStartPatternDrill(drill.patternIds)}
                  >
                    <ArrowRight aria-hidden="true" />
                    {drillButtonLabel(drill)}
                  </button>
                ))}
              </div>
            ) : null}

            {active.drillNote ? (
              <p className="block-drill-note">{active.drillNote}</p>
            ) : null}

            {active.drills && active.drills.length > 0 ? (
              <div className="inline-action-row">
                {active.drills.map((drill) => (
                  <button
                    key={drill.labelKey}
                    className="inline-drill-button"
                    type="button"
                    onClick={() => onStartDrill(drill.preset)}
                  >
                    <ArrowRight aria-hidden="true" />
                    {drillButtonLabel(drill)}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </section>
  );
}

// ---- HomePanel -------------------------------------------------------
// First view the learner lands on. Three layers:
//   1. Context-aware banner ("review N items" if any, else "continue
//      chapter XX" if there's an incomplete one). Suppressed entirely
//      when nothing meaningful to surface, to avoid noise.
//   2. Lifetime stats strip (only shown after the first attempt).
//   3. Four entry cards. The Review card disables itself when there's
//      nothing to review, so the affordance is still discoverable but
//      doesn't lead to an empty quiz.
//
// HomePanel is intentionally read-only of the learner state -- mutating
// callbacks (onNavigate, onStartReview) live on the parent so the panel
// stays a presentational component.

// Content-volume snapshot rendered above the entry cards. Computed
// once at module load -- the underlying data (learningBlocks, exam
// pool, sentence patterns, jlptVocabulary) is static at runtime and
// only changes when a content batch ships, which rebuilds the bundle
// anyway. Pre-computing avoids re-running buildExamQuestionPool on
// every HomePanel render.
const HOME_CONTENT_STATS = {
  chapters: learningBlocks.filter((block) => block.group === "basic").length,
  examItems: buildExamQuestionPool("all").length,
  n1Grammar: buildExamQuestionPool("N1").filter((q) => q.promptLabel === "文法形式選擇").length,
  patternChecks: buildSentencePatternPool().length,
  vocab: jlptVocabulary.length
};

function HomePanel({
  language,
  progressAttempts,
  reviewCount,
  onNavigate,
  onStartReview,
  onStartVocab
}: {
  language: Language;
  progressAttempts: Attempt[];
  reviewCount: number;
  onNavigate: (target: "learn" | "challenge" | "mock") => void;
  onStartReview: () => void;
  onStartVocab: () => void;
}) {
  const t = copy[language];

  const totalAttempts = progressAttempts.length;
  const correctAttempts = progressAttempts.filter((attempt) => attempt.isCorrect).length;
  const accuracyPercent =
    totalAttempts === 0 ? 0 : Math.round((correctAttempts / totalAttempts) * 100);

  // Only count "trackable" basic chapters towards the X / Y badge --
  // reference chapters (verb-types + the four sentence-pattern reading
  // chapters) are reading material, not drillable units.
  const trackableChapters = learningBlocks.filter(
    (block) => block.group === "basic" && block.completionMode !== "reference"
  );
  const completedChapters = trackableChapters.filter((block) =>
    isLearningBlockComplete(progressAttempts, block)
  ).length;

  const nextIncompleteChapter = trackableChapters.find(
    (block) => !isLearningBlockComplete(progressAttempts, block)
  );

  return (
    <section className="home-panel" aria-label={t.home}>
      <header className="home-hero">
        {/* Decorative hero -- the heading below carries the actual
            message, so alt is intentionally empty (avoids the screen
            reader saying "image, hero" which adds nothing). */}
        <img
          className="home-hero-image"
          src="/hero.webp"
          alt=""
          width={1600}
          height={900}
        />
        <div className="home-hero-text">
          <h1>{t.homeHeroTitle}</h1>
          <p>{t.homeHeroIntro}</p>
        </div>
      </header>

      {/* Content-volume strip: tells first-time visitors what they're
          walking into without resorting to SaaS-style metric tiles.
          Counts are derived live from the data modules so this stays
          honest whenever a content batch lands. */}
      <p className="home-content-stats">
        {t.homeContentStats(
          HOME_CONTENT_STATS.chapters,
          HOME_CONTENT_STATS.examItems,
          HOME_CONTENT_STATS.n1Grammar,
          HOME_CONTENT_STATS.patternChecks,
          HOME_CONTENT_STATS.vocab
        )}
      </p>

      {reviewCount > 0 ? (
        <button type="button" className="home-banner home-banner-review" onClick={onStartReview}>
          <AlertTriangle aria-hidden="true" />
          <span className="home-banner-text">
            <strong>{t.homeBannerReviewMain(reviewCount)}</strong>
            <small>{t.homeBannerReviewSub}</small>
          </span>
          <ArrowRight aria-hidden="true" />
        </button>
      ) : nextIncompleteChapter ? (
        <button
          type="button"
          className="home-banner home-banner-continue"
          onClick={() => onNavigate("learn")}
        >
          <BookOpen aria-hidden="true" />
          <span className="home-banner-text">
            <strong>{t.homeBannerContinueMain(nextIncompleteChapter.title)}</strong>
            <small>{t.homeBannerContinueSub}</small>
          </span>
          <ArrowRight aria-hidden="true" />
        </button>
      ) : null}

      {totalAttempts > 0 ? (
        <div className="home-stats-strip" aria-label={t.homeStatsLabel}>
          <div className="home-stats-cell">
            <strong>{totalAttempts}</strong>
            <small>{t.homeStatsAttempts}</small>
          </div>
          <div className="home-stats-cell">
            <strong>{accuracyPercent}%</strong>
            <small>{t.homeStatsAccuracy}</small>
          </div>
          <div className="home-stats-cell">
            <strong>
              {completedChapters} / {trackableChapters.length}
            </strong>
            <small>{t.homeStatsChapters}</small>
          </div>
        </div>
      ) : null}

      <div className="home-grid">
        {/* Each card carries a single-CJK "stage badge" (學 / 練 / 背 /
            考 / 補) instead of a lucide-react icon. The icons read as
            tech-product chrome; the kanji read as editorial. Stages
            suggest a natural progression but the cards stay
            independently entry-able -- a returning learner who only
            wants today's mock exam can still jump straight to 考. */}
        <button type="button" className="home-card" onClick={() => onNavigate("learn")}>
          <span className="home-card-stage" aria-hidden="true">{t.homeCardStageLearn}</span>
          <h2>{t.homeCardLearnTitle}</h2>
          <p>{t.homeCardLearnSub}</p>
          <span className="home-card-meta">
            {t.homeCardLearnMeta(completedChapters, trackableChapters.length)}
          </span>
          <ArrowRight className="home-card-arrow" aria-hidden="true" />
        </button>
        <button type="button" className="home-card" onClick={() => onNavigate("challenge")}>
          <span className="home-card-stage" aria-hidden="true">{t.homeCardStageChallenge}</span>
          <h2>{t.homeCardChallengeTitle}</h2>
          <p>{t.homeCardChallengeSub}</p>
          <span className="home-card-meta">{t.homeCardChallengeMeta}</span>
          <ArrowRight className="home-card-arrow" aria-hidden="true" />
        </button>
        <button type="button" className="home-card" onClick={onStartVocab}>
          <span className="home-card-stage" aria-hidden="true">{t.homeCardStageVocab}</span>
          <h2>{t.homeCardVocabTitle}</h2>
          <p>{t.homeCardVocabSub}</p>
          <span className="home-card-meta">{t.homeCardVocabMeta}</span>
          <ArrowRight className="home-card-arrow" aria-hidden="true" />
        </button>
        <button type="button" className="home-card" onClick={() => onNavigate("mock")}>
          <span className="home-card-stage" aria-hidden="true">{t.homeCardStageMock}</span>
          <h2>{t.homeCardMockTitle}</h2>
          <p>{t.homeCardMockSub}</p>
          <span className="home-card-meta">{t.homeCardMockMeta}</span>
          <ArrowRight className="home-card-arrow" aria-hidden="true" />
        </button>
        <button
          type="button"
          className={`home-card${reviewCount === 0 ? " home-card-dimmed" : ""}`}
          onClick={onStartReview}
          disabled={reviewCount === 0}
        >
          <span className="home-card-stage" aria-hidden="true">{t.homeCardStageReview}</span>
          <h2>{t.homeCardReviewTitle}</h2>
          <p>
            {reviewCount > 0 ? t.homeCardReviewSubActive(reviewCount) : t.homeCardReviewSubEmpty}
          </p>
          <span className="home-card-meta">{t.homeCardReviewMeta}</span>
          <ArrowRight className="home-card-arrow" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}

function getInitialTheme(): Theme {
  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);

  if (storedTheme === "dark" || storedTheme === "light") {
    return storedTheme;
  }

  // First-time default switched from dark to light: the new wafuu-paper
  // palette is designed light-first. Dark theme is still available via
  // the toggle and via stored preference.
  return "light";
}

function storeTheme(theme: Theme) {
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
}

function uniqueForms(forms: TargetForm[]): TargetForm[] {
  return Array.from(new Set(forms));
}

function choiceOptionClass(choice: string, selectedChoice: string | null, feedback: Feedback): string {
  const classes = ["choice-option"];

  if (selectedChoice === choice) {
    classes.push("chosen");

    if (feedback?.status === "correct") {
      classes.push("correct");
    }

    if (feedback?.status === "incorrect") {
      classes.push("incorrect");
    }
  }

  return classes.join(" ");
}

function partOfSpeechLabel(partOfSpeech: PartOfSpeech, language: Language): string {
  return copy[language].partOfSpeech[partOfSpeech];
}

function ExamPrompt({ question, language }: { question: PracticeQuestion; language: Language }) {
  // Sentence-pattern items use placeholder surface/reading (the pattern
  // id) which would render as a meaningless "te-kudasai・te-kudasai・..."
  // line. Skip the reading row for those items -- the prompt label
  // already names the pattern.
  const isSentencePattern = question.vocabulary.tags?.includes("sentence_pattern");
  // Pre-answer Chinese: prefer the neutral hint when authored; fall back
  // to the full translation for items that haven't been audited yet
  // (legacy exam items). The full translation still appears in the
  // FeedbackPanel post-answer via vocabulary.examples[0].meaningZh.
  const preAnswerHint = question.hintZh ?? question.promptContextZh;
  return (
    <>
      <p className="word-kind">
        <GraduationCap aria-hidden="true" />
        {question.instructionZh}
      </p>
      <p className="exam-prompt">
        {question.promptText}
        {question.promptText ? (
          <SpeakButton text={question.promptText} language={language} />
        ) : null}
      </p>
      {preAnswerHint ? <p className="meaning">{preAnswerHint}</p> : null}
      {isSentencePattern ? null : (
        <p className="reading">
          {question.vocabulary.surface}・{question.vocabulary.reading}・{question.vocabulary.meaningZh}
        </p>
      )}
    </>
  );
}

// ---- SpeakButton ------------------------------------------------------
// Small inline button that reads its `text` aloud via the browser's
// built-in SpeechSynthesis API. No external TTS service or audio asset
// involved -- the voice quality depends on what the user's OS/browser
// ships, but for "hear the kanji" / "hear the example sentence" the
// built-in JA voices are good enough for a first cut. If the API or a
// JA voice isn't available, the component renders nothing rather than a
// broken-feeling button. Single-flight: if you click it again while
// it's still speaking, the current utterance is cancelled first so the
// new one starts cleanly.

function SpeakButton({ text, language }: { text: string; language: Language }) {
  const supported =
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    typeof window.SpeechSynthesisUtterance === "function";

  if (!supported) return null;
  if (!text) return null;

  const handleClick = () => {
    try {
      window.speechSynthesis.cancel();
      const utterance = new window.SpeechSynthesisUtterance(text);
      utterance.lang = "ja-JP";
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Voice synthesis can throw if the engine is in a bad state; the
      // worst case here is "no sound played", which is better than
      // crashing the practice flow.
    }
  };

  return (
    <button
      type="button"
      className="speak-button"
      aria-label={copy[language].speakAriaLabel}
      onClick={handleClick}
    >
      <Volume2 aria-hidden="true" />
    </button>
  );
}

function FeedbackPanel({ feedback, language }: { feedback: NonNullable<Feedback>; language: Language }) {
  const t = copy[language];
  const isCorrect = feedback.status === "correct";
  const isRevealed = feedback.status === "revealed";
  const title = isCorrect ? t.correct : isRevealed ? t.revealed : t.incorrect;
  const Icon = isCorrect ? CheckCircle2 : XCircle;

  return (
    <section className={`feedback ${isCorrect ? "correct" : isRevealed ? "revealed" : "incorrect"}`} aria-live="polite">
      <div className="feedback-title">
        <Icon aria-hidden="true" />
        <h2>{title}</h2>
      </div>
      <p className="answer-key">{t.answerKey}：{feedback.question.expectedAnswers.join(" / ")}</p>
      <p>{feedback.question.explanation}</p>
      {feedback.question.vocabulary.examples[0] ? (
        <p className="example">
          {feedback.question.vocabulary.examples[0].japanese}
          <span>{feedback.question.vocabulary.examples[0].meaningZh}</span>
        </p>
      ) : null}
    </section>
  );
}

// ---- Mock exam panel ---------------------------------------------------
// Self-contained: composes a plan from the shared exam pool, runs the
// learner through it without per-question feedback, then shows score +
// per-section breakdown + wrong-answer detail. Mock-exam attempts are
// session-local on purpose -- they don't write to attemptStore, so a
// mock run doesn't pollute the per-vocabulary progress tracker (which
// drives chapter completion in the Learn view).

type MockPhase = "setup" | "running" | "results";

function MockExamPanel({ language, onExit }: { language: Language; onExit: () => void }) {
  const t = copy[language];
  const [level, setLevel] = useState<MockExamLevel>("N2");
  const [phase, setPhase] = useState<MockPhase>("setup");
  const [planKey, setPlanKey] = useState(0); // bump to recompose on retake
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, string>>(() => new Map());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const startedAtRef = useRef<number | null>(null);

  // Compose a fresh plan whenever level or planKey changes. The full
  // pool is filtered to the chosen level by composeMockExam.
  const plan: MockExamPlan = useMemo(
    () => {
      void planKey;
      return composeMockExam(level, buildExamQuestionPool(level));
    },
    [level, planKey]
  );

  const questions = useMemo(() => flattenMockExam(plan), [plan]);
  const currentQuestion = questions[currentIndex] ?? null;

  // Running-phase elapsed-time tick. Resets when we enter setup/results.
  useEffect(() => {
    if (phase !== "running") {
      return;
    }
    const start = startedAtRef.current ?? Date.now();
    startedAtRef.current = start;
    setElapsedSeconds(Math.floor((Date.now() - start) / 1000));
    const id = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => window.clearInterval(id);
  }, [phase]);

  const startExam = () => {
    setCurrentIndex(0);
    setAnswers(new Map());
    setElapsedSeconds(0);
    startedAtRef.current = Date.now();
    setPhase("running");
  };

  const retake = () => {
    setPlanKey((k) => k + 1);
    setCurrentIndex(0);
    setAnswers(new Map());
    setElapsedSeconds(0);
    startedAtRef.current = null;
    setPhase("setup");
  };

  const recordAnswer = (choice: string) => {
    if (!currentQuestion) return;
    setAnswers((prev) => {
      const next = new Map(prev);
      next.set(currentQuestion.id, choice);
      return next;
    });
  };

  const goNext = () => {
    setCurrentIndex((i) => Math.min(i + 1, questions.length - 1));
  };

  const goPrev = () => {
    setCurrentIndex((i) => Math.max(i - 1, 0));
  };

  const submit = () => {
    const unansweredCount = questions.length - answers.size;
    if (unansweredCount > 0 && !window.confirm(t.mockExamSubmitConfirm)) {
      return;
    }
    setPhase("results");
  };

  const summary: MockExamSummary | null = phase === "results" ? summarizeMockExam(plan, answers) : null;

  return (
    <section className="mock-panel" aria-label="Mock exam">
      {phase === "setup" ? (
        <MockExamSetup
          t={t}
          level={level}
          onLevelChange={setLevel}
          plan={plan}
          onStart={startExam}
          onExit={onExit}
        />
      ) : phase === "running" && currentQuestion ? (
        <MockExamRunning
          t={t}
          language={language}
          level={level}
          question={currentQuestion}
          currentIndex={currentIndex}
          total={questions.length}
          selectedAnswer={answers.get(currentQuestion.id) ?? null}
          elapsedSeconds={elapsedSeconds}
          onSelect={recordAnswer}
          onPrev={goPrev}
          onNext={goNext}
          onSubmit={submit}
          onExit={onExit}
        />
      ) : summary ? (
        <MockExamResults
          t={t}
          level={level}
          summary={summary}
          elapsedSeconds={elapsedSeconds}
          onRetake={retake}
          onExit={onExit}
        />
      ) : (
        <div className="empty-state">{t.emptyState}</div>
      )}
    </section>
  );
}

function MockExamSetup({
  t,
  level,
  onLevelChange,
  plan,
  onStart,
  onExit
}: {
  t: Copy;
  level: MockExamLevel;
  onLevelChange: (level: MockExamLevel) => void;
  plan: MockExamPlan;
  onStart: () => void;
  onExit: () => void;
}) {
  return (
    <div className="mock-setup">
      <header className="mock-setup-head">
        <p className="eyebrow">
          <ClipboardList aria-hidden="true" />
          {t.mockExamSetupTitle}
        </p>
        <p className="mock-setup-intro">{t.mockExamSetupIntro}</p>
        <p className="mock-setup-meta">
          <Timer aria-hidden="true" />
          {t.mockExamSuggestedMinutes(plan.blueprint.totalMinutes)}
        </p>
      </header>

      <fieldset className="mock-level-picker">
        <legend>{t.mockExamLevelLabel}</legend>
        <div className="segmented">
          {(["N2", "N1"] as MockExamLevel[]).map((option) => (
            <button
              key={option}
              type="button"
              className={level === option ? "selected" : ""}
              onClick={() => onLevelChange(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </fieldset>

      <section className="mock-section-list" aria-label={t.mockExamSectionsHeading}>
        <h3>{t.mockExamSectionsHeading}</h3>
        <p className="mock-section-summary">
          {t.mockExamAnsweredOf(plan.totalPicked, plan.totalTarget)}
          {plan.totalGap > 0 ? ` · ${t.mockExamGapNote(plan.totalGap)}` : ""}
        </p>
        <ol className="mock-section-rows">
          {plan.sections.map((sp, index) => {
            const isEmpty = sp.questions.length === 0;
            const isPartial = !isEmpty && sp.gap > 0;
            return (
              <li
                key={sp.section.id}
                className={`mock-section-row${isEmpty ? " empty" : isPartial ? " partial" : ""}`}
              >
                <span className="mock-section-badge">{t.mockExamSectionBadge(index + 1)}</span>
                <div className="mock-section-meta">
                  <strong>{sp.section.labelJa}</strong>
                  <small>{sp.section.labelZh}</small>
                </div>
                <div className="mock-section-pool">
                  <span>
                    {sp.questions.length} / {sp.section.targetCount}
                  </span>
                  {isEmpty ? (
                    <em className="mock-section-warn">
                      <AlertTriangle aria-hidden="true" />
                      {t.mockExamPoolEmpty}
                    </em>
                  ) : isPartial ? (
                    <em className="mock-section-warn">
                      <AlertTriangle aria-hidden="true" />
                      {t.mockExamSectionGap.replace("{gap}", String(sp.gap))}
                    </em>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <div className="mock-actions">
        <button
          className="next-button"
          type="button"
          disabled={plan.totalPicked === 0}
          onClick={onStart}
        >
          <ArrowRight aria-hidden="true" />
          {plan.totalPicked === 0 ? t.mockExamStartDisabled : t.mockExamStart}
        </button>
        <button className="ghost-button" type="button" onClick={onExit}>
          {t.mockExamExit}
        </button>
      </div>
    </div>
  );
}

function MockExamRunning({
  t,
  language,
  level,
  question,
  currentIndex,
  total,
  selectedAnswer,
  elapsedSeconds,
  onSelect,
  onPrev,
  onNext,
  onSubmit,
  onExit
}: {
  t: Copy;
  language: Language;
  level: MockExamLevel;
  question: PracticeQuestion;
  currentIndex: number;
  total: number;
  selectedAnswer: string | null;
  elapsedSeconds: number;
  onSelect: (choice: string) => void;
  onPrev: () => void;
  onNext: () => void;
  onSubmit: () => void;
  onExit: () => void;
}) {
  // Reuse the existing exam options as authored (the examQuestion helper
  // wires `options` and includes the expected answer). Rotate the
  // display order deterministically by index so it's not always answer-
  // first, while staying stable if the learner navigates back.
  const options = useMemo(() => {
    const raw = Array.from(new Set([...question.expectedAnswers, ...(question.options ?? [])]));
    if (raw.length === 0) return raw;
    const offset = (currentIndex + question.id.length) % raw.length;
    return [...raw.slice(offset), ...raw.slice(0, offset)];
  }, [question, currentIndex]);

  const isLast = currentIndex === total - 1;

  return (
    <div className="mock-running">
      <header className="mock-running-head">
        <div>
          <p className="eyebrow">{t.mockExamRunningTitle(level)}</p>
          <strong>{t.mockExamProgress(currentIndex + 1, total)}</strong>
        </div>
        <div className="mock-elapsed">
          <Clock aria-hidden="true" />
          <span>{t.mockExamElapsed}</span>
          <strong>{formatElapsed(elapsedSeconds)}</strong>
        </div>
      </header>

      <div className="mock-question">
        <div className="prompt-header">
          <span>{question.promptLabel}</span>
        </div>
        <div className="word-block">
          <ExamPrompt question={question} language={language} />
        </div>

        <div className="choice-grid" aria-label={t.answerOptions}>
          {options.map((choice) => (
            <button
              key={choice}
              type="button"
              className={`choice-option${selectedAnswer === choice ? " chosen" : ""}`}
              onClick={() => onSelect(choice)}
            >
              {choice}
            </button>
          ))}
        </div>
      </div>

      <div className="mock-nav">
        <button className="ghost-button" type="button" onClick={onPrev} disabled={currentIndex === 0}>
          {t.mockExamPrev}
        </button>
        {isLast ? (
          <button className="next-button" type="button" onClick={onSubmit}>
            <CheckCircle2 aria-hidden="true" />
            {t.mockExamSubmit}
          </button>
        ) : (
          <button className="next-button" type="button" onClick={onNext}>
            <ArrowRight aria-hidden="true" />
            {selectedAnswer === null ? t.mockExamSkip : t.mockExamNext}
          </button>
        )}
        <button className="ghost-button mock-exit" type="button" onClick={onExit}>
          {t.mockExamExit}
        </button>
      </div>
    </div>
  );
}

function MockExamResults({
  t,
  level,
  summary,
  elapsedSeconds,
  onRetake,
  onExit
}: {
  t: Copy;
  level: MockExamLevel;
  summary: MockExamSummary;
  elapsedSeconds: number;
  onRetake: () => void;
  onExit: () => void;
}) {
  const wrong = summary.sections.flatMap((s) =>
    s.results.filter((r) => !r.isCorrect).map((r) => ({ section: s.section, result: r }))
  );
  const totalGap = summary.plan.totalGap;

  return (
    <div className="mock-results">
      <header className="mock-results-head">
        <p className="eyebrow">{t.mockExamResultsTitle(level)}</p>
        <h2>
          {t.mockExamTotalScore(
            summary.totalCorrect,
            summary.totalQuestions,
            summary.accuracyPercent
          )}
        </h2>
        <p className="mock-results-meta">
          <Clock aria-hidden="true" />
          {t.mockExamElapsed}：{formatElapsed(elapsedSeconds)}
          {" · "}
          {t.mockExamAnsweredOf(summary.totalAnswered, summary.totalQuestions)}
        </p>
        {totalGap > 0 ? (
          <p className="mock-results-gap">
            <AlertTriangle aria-hidden="true" />
            {t.mockExamGapNote(totalGap)}
          </p>
        ) : null}
      </header>

      <section className="mock-section-breakdown" aria-label={t.mockExamReviewSection}>
        <h3>{t.mockExamReviewSection}</h3>
        <ol className="mock-section-rows">
          {summary.sections.map((s, index) => (
            <li
              key={s.section.id}
              className={`mock-section-row${s.total === 0 ? " empty" : ""}`}
            >
              <span className="mock-section-badge">{t.mockExamSectionBadge(index + 1)}</span>
              <div className="mock-section-meta">
                <strong>{s.section.labelJa}</strong>
                <small>{s.section.labelZh}</small>
              </div>
              <div className="mock-section-pool">
                {s.total === 0 ? (
                  <em className="mock-section-warn">
                    <AlertTriangle aria-hidden="true" />
                    {t.mockExamPoolEmpty}
                  </em>
                ) : (
                  <span>
                    {s.correct} / {s.total}
                    {s.answered < s.total ? ` · ${t.mockExamSkippedShort} ${s.total - s.answered}` : ""}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ol>
      </section>

      {wrong.length > 0 ? (
        <section className="mock-wrong-list" aria-label={t.mockExamReviewWrong}>
          <h3>{t.mockExamReviewWrong}</h3>
          <ul>
            {wrong.map(({ section, result }) => (
              <li key={result.question.id} className="mock-wrong-item">
                <div className="mock-wrong-head">
                  <span className="mock-section-badge">{section.labelJa}</span>
                  <strong className="mock-wrong-prompt">{result.question.promptText}</strong>
                </div>
                <p className="answer-key">
                  {t.answerKey}：{result.question.expectedAnswers.join(" / ")}
                  {result.wasAnswered ? (
                    <span className="mock-wrong-submitted"> · {t.incorrect}：{result.submittedAnswer}</span>
                  ) : (
                    <span className="mock-wrong-submitted"> · {t.mockExamUnansweredBadge}</span>
                  )}
                </p>
                <p className="mock-wrong-explanation">{result.question.explanation}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="mock-actions">
        <button className="next-button" type="button" onClick={onRetake}>
          <RotateCcw aria-hidden="true" />
          {t.mockExamRetake}
        </button>
        <button className="ghost-button" type="button" onClick={onExit}>
          {t.mockExamExit}
        </button>
      </div>
    </div>
  );
}

function formatElapsed(seconds: number): string {
  const mm = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const ss = (seconds % 60).toString().padStart(2, "0");
  return `${mm}:${ss}`;
}
