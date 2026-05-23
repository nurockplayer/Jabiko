import { KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Eye,
  GraduationCap,
  Languages,
  Moon,
  RotateCcw,
  Sun,
  XCircle
} from "lucide-react";
import { ADJECTIVE_FORMS, VERB_FORMS } from "./domain/conjugation";
import { buildClozeQuestionPool } from "./domain/cloze";
import { clozeSentences } from "./domain/cloze-data";
import { buildExamQuestionPool } from "./domain/examBlocks";
import {
  getIncompletePrereqs,
  isLearningBlockComplete,
  learningBlocks,
  type LearningBlockDrillPreset
} from "./domain/learningBlocks";
import {
  buildChoiceOptions,
  buildQuestionPool,
  getMistakeQuestions,
  scoreAttempt,
  selectQuestion,
  shuffleQuestions
} from "./domain/practice";
import { createAttemptStore } from "./domain/storage";
import type { Attempt, PartOfSpeech, PracticeQuestion, TargetForm, VerbGroup } from "./domain/types";
import { vocabulary } from "./domain/vocabulary";
import { copy, getInitialLanguage, languageOptions, storeLanguage, type Language } from "./i18n";
import "./styles.css";

type Feedback =
  | { status: "correct"; question: PracticeQuestion }
  | { status: "incorrect"; question: PracticeQuestion }
  | { status: "revealed"; question: PracticeQuestion }
  | null;

type PracticeFocus = "single" | "teTa" | "negative" | "plain" | "adverbial" | "obligationPast";
type PracticeMode = "basic" | "cloze" | "exam";
type AppView = "learn" | "challenge";
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

const practiceModeOrder: PracticeMode[] = ["basic", "cloze", "exam"];

const attemptStore = createAttemptStore();

export default function App() {
  const [appView, setAppView] = useState<AppView>("learn");
  const [partOfSpeech, setPartOfSpeech] = useState<PartOfSpeech | "mixed">("verb");
  const [verbGroup, setVerbGroup] = useState<VerbGroup | "all">("godan");
  const [targetForm, setTargetForm] = useState<TargetForm>("te");
  const [practiceFocus, setPracticeFocus] = useState<PracticeFocus>("single");
  const [practiceMode, setPracticeMode] = useState<PracticeMode>("basic");
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
  const isCuratedFocus = isExamFocus || isClozeFocus;
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

      return shuffleQuestions(
        buildQuestionPool(vocabulary, {
          partOfSpeech,
          verbGroup,
          targetForms
        })
      );
    },
    [isExamFocus, isClozeFocus, partOfSpeech, targetForms, verbGroup, sessionSeed]
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
    setPartOfSpeech(preset.partOfSpeech);
    setVerbGroup(preset.verbGroup ?? "all");
    setPracticeFocus(preset.practiceFocus);
    setTargetForm(preset.targetForm);
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
      </nav>

      {appView === "learn" ? (
        <LearningPanel
          language={language}
          progressAttempts={progressAttempts}
          onStartChallenge={() => setAppView("challenge")}
          onStartDrill={startDrill}
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
                  <ExamPrompt question={currentQuestion} />
                ) : (
                  <>
                    <p className="word-kind">
                      <GraduationCap aria-hidden="true" />
                      {partOfSpeechLabel(currentQuestion.vocabulary.partOfSpeech, language)}
                    </p>
                    {currentQuestion.targetForm === "reading" ? null : (
                      <p className="reading">{currentQuestion.vocabulary.reading}</p>
                    )}
                    <p className="surface">{currentQuestion.vocabulary.surface}</p>
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
  onStartChallenge,
  onStartDrill
}: {
  language: Language;
  progressAttempts: Attempt[];
  onStartChallenge: () => void;
  onStartDrill: (preset: DrillPreset) => void;
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

  return (
    <section className="learning-panel" aria-label={t.learningRegion}>
      <div className="chapter-shell">
        <aside className="chapter-index" aria-label="學習章節">
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
                <span>{complete ? "完成" : block.kicker ?? block.category}</span>
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

function getInitialTheme(): Theme {
  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);

  if (storedTheme === "dark" || storedTheme === "light") {
    return storedTheme;
  }

  return "dark";
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

function ExamPrompt({ question }: { question: PracticeQuestion }) {
  return (
    <>
      <p className="word-kind">
        <GraduationCap aria-hidden="true" />
        {question.instructionZh}
      </p>
      <p className="exam-prompt">{question.promptText}</p>
      <p className="meaning">{question.promptContextZh}</p>
      <p className="reading">
        {question.vocabulary.surface}・{question.vocabulary.reading}・{question.vocabulary.meaningZh}
      </p>
    </>
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
