import { KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Eye,
  GraduationCap,
  Moon,
  RotateCcw,
  Sun,
  Volume2,
  XCircle
} from "lucide-react";
import { ADJECTIVE_FORMS, VERB_FORMS } from "./domain/conjugation";
import { buildClozeQuestionPool } from "./domain/cloze";
import { clozeSentences } from "./domain/cloze-data";
import { buildExamQuestionPool } from "./domain/examBlocks";
import type { MockExamLevel } from "./domain/mockExam";
import type { LearningBlockDrillPreset } from "./domain/learningBlocks";
import { buildSentencePatternPool, type SentencePatternId } from "./domain/sentencePatterns";
import {
  buildChoiceOptions,
  buildQuestionPool,
  getMistakeQuestions,
  getReviewQueue,
  reduceAdjacentClusters,
  scoreAttempt,
  selectQuestion,
  shuffleQuestions
} from "./domain/practice";
import { createAttemptStore } from "./domain/storage";
import { readStored, writeStored } from "./domain/safeStorage";
import type { Attempt, PartOfSpeech, PracticeQuestion, TargetForm, VerbGroup } from "./domain/types";
import { vocabulary } from "./domain/vocabulary";
import { jlptVocabulary } from "./domain/vocabulary-jlpt";
import { copy, type Language } from "./i18n";
import { DarumaSpot, PaperNoteSpot, TeaCupSpot } from "./illustrations";
import { HomePanel, LearningPanel, MockExamPanel, RulesPanel } from "./components";
import "./styles.css";

type Feedback =
  | { status: "correct"; question: PracticeQuestion }
  | { status: "incorrect"; question: PracticeQuestion }
  | { status: "revealed"; question: PracticeQuestion }
  | null;

type PracticeFocus = "single" | "teTa" | "negative" | "plain" | "adverbial" | "obligationPast";
type PracticeMode = "basic" | "cloze" | "pattern" | "exam" | "review" | "vocab";
type PracticeFilter = {
  patternIds?: SentencePatternId[];
  // Narrows exam mode to one JLPT section (by level + promptLabel), set
  // when the learner taps a section card in the 模擬考 picker.
  examSection?: { level: MockExamLevel; promptLabel: string };
};
type AppView = "home" | "learn" | "rules" | "challenge" | "mock";
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
  // Single-language app (zh-Hant). The `language` seam is kept so the
  // copy[language] call sites and component props don't have to change;
  // re-adding a locale later is just restoring entries in i18n.ts.
  const language: Language = "zh-Hant";
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
      practiceFilter.patternIds,
      practiceFilter.examSection,
      partOfSpeech,
      targetForms,
      verbGroup,
      sessionSeed
    ]
  );
  // Review mode is a FINITE pass over the currently-due snapshot: walk
  // each item once, no modulo wrap, then stop. Every other mode is an
  // endless drill (modulo wrap via selectQuestion). Looping review would
  // re-show items the learner just cleared -- exactly the "錯題一直輪迴"
  // report. Correctly-answered items leave the SRS due set (next
  // session), wrong ones reset to box 0 and return next session.
  const currentQuestion = isReviewFocus
    ? questions[questionIndex] ?? null
    : selectQuestion(questions, questionIndex);
  const reviewEmpty = isReviewFocus && questions.length === 0;
  const reviewExhausted =
    isReviewFocus && questions.length > 0 && questionIndex >= questions.length;
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

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    storeTheme(nextTheme);
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
          className={appView === "rules" ? "selected" : ""}
          onClick={() => setAppView("rules")}
        >
          {t.rules}
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
      ) : appView === "rules" ? (
        <RulesPanel language={language} />
      ) : appView === "mock" ? (
        <MockExamPanel
          language={language}
          onStartSection={(level, promptLabel) => {
            setPracticeMode("exam");
            setPracticeFilter({ examSection: { level, promptLabel } });
            resetSession();
            setAppView("challenge");
          }}
        />
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
              {practiceModeOrder.map((mode) => {
                const count =
                  mode === "review"
                    ? reviewQueue.length
                    : mode === "basic"
                    ? null
                    : modeCounts[mode];
                return (
                  <button
                    key={mode}
                    type="button"
                    className={`mode-card${practiceMode === mode ? " selected" : ""}`}
                    aria-pressed={practiceMode === mode}
                    onClick={() => handlePracticeModeChange(mode)}
                  >
                    <strong>{t.modeOptions[mode].title}</strong>
                    <small>{t.modeOptions[mode].subtitle}</small>
                    {count !== null ? (
                      <span className="mode-card-count">{t.modeQuestionCount(count)}</span>
                    ) : null}
                  </button>
                );
              })}
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
          ) : reviewExhausted ? (
            <div className="empty-state review-done">
              <DarumaSpot />
              <h2>{t.reviewDoneTitle}</h2>
              <p>{t.reviewDoneBody(correctCount, attempts.length - correctCount)}</p>
              <div className="review-done-actions">
                <button className="next-button" type="button" onClick={resetSession}>
                  <RotateCcw aria-hidden="true" />
                  {t.reviewDoneAgain}
                </button>
                <button className="ghost-button" type="button" onClick={() => setAppView("home")}>
                  {t.reviewDoneExit}
                </button>
              </div>
            </div>
          ) : reviewEmpty ? (
            <div className="empty-state review-done">
              <TeaCupSpot />
              <p>{t.reviewEmptyState}</p>
              <div className="review-done-actions">
                <button
                  className="next-button"
                  type="button"
                  onClick={() => {
                    setPracticeMode("exam");
                    setPracticeFilter({});
                    resetSession();
                  }}
                >
                  <ArrowRight aria-hidden="true" />
                  {t.reviewEmptyCta}
                </button>
                <button className="ghost-button" type="button" onClick={() => setAppView("home")}>
                  {t.reviewDoneExit}
                </button>
              </div>
            </div>
          ) : (
            <div className="empty-state empty-state-illustrated">
              <PaperNoteSpot />
              <p>{t.emptyState}</p>
            </div>
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

function getInitialTheme(): Theme {
  const storedTheme = readStored(THEME_STORAGE_KEY);

  if (storedTheme === "dark" || storedTheme === "light") {
    return storedTheme;
  }

  // First-time default switched from dark to light: the new wafuu-paper
  // palette is designed light-first. Dark theme is still available via
  // the toggle and via stored preference.
  return "light";
}

// ---- RulesPanel ------------------------------------------------------
// "規則表" view: a read-only reference page of conjugation tables.
// Pure presentational; all data lives in domain/conjugationTables.ts
// so future tables (formal forms / adjective variations / sentence
// patterns) just need a data-file edit and no component change.
function storeTheme(theme: Theme) {
  writeStored(THEME_STORAGE_KEY, theme);
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
  // line. Skip the vocab row for those items -- the prompt label
  // already names the pattern.
  const isSentencePattern = question.vocabulary.tags?.includes("sentence_pattern");
  // ANSWER-LEAK GUARD: for 文法形式選擇 items the surface IS the answer
  // (e.g. surface「ものの」== the correct choice); for 漢字読み items the
  // reading IS the answer (e.g. reading「とどこおって」). Rendering the
  // surface・reading・meaning row pre-answer therefore hands the learner
  // the answer. Only show that row when neither surface nor reading is
  // one of the expected answers -- which keeps it for cloze items
  // (待つ -> answer 待って, surface is a legit "which verb" hint) but
  // hides it for grammar / kanji-reading. The full answer always shows
  // post-answer in FeedbackPanel.
  const answerSet = new Set(question.expectedAnswers);
  const vocabRowLeaksAnswer =
    answerSet.has(question.vocabulary.surface) || answerSet.has(question.vocabulary.reading);
  const showVocabRow = !isSentencePattern && !vocabRowLeaksAnswer;
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
      {showVocabRow ? (
        <p className="reading">
          {question.vocabulary.surface}・{question.vocabulary.reading}・{question.vocabulary.meaningZh}
        </p>
      ) : null}
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
