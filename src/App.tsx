import { KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Eye,
  GraduationCap,
  Languages,
  Lock,
  Moon,
  RotateCcw,
  Sun,
  XCircle
} from "lucide-react";
import { ADJECTIVE_FORMS, VERB_FORMS } from "./domain/conjugation";
import {
  buildChoiceOptions,
  buildQuestionPool,
  getMistakeQuestions,
  scoreAttempt,
  selectQuestion,
  shuffleQuestions
} from "./domain/practice";
import { createAttemptStore } from "./domain/storage";
import type { Attempt, JlptLevel, PartOfSpeech, PracticeQuestion, TargetForm, VerbGroup } from "./domain/types";
import { vocabulary } from "./domain/vocabulary";
import { copy, getInitialLanguage, languageOptions, storeLanguage, type Language } from "./i18n";
import "./styles.css";

type Feedback =
  | { status: "correct"; question: PracticeQuestion }
  | { status: "incorrect"; question: PracticeQuestion }
  | { status: "revealed"; question: PracticeQuestion }
  | null;

type PracticeFocus = "single" | "teTa" | "negative" | "plain" | "adverbial" | "obligationPast";
type AppView = "learn" | "challenge";
type Theme = "light" | "dark";
type DrillPreset = {
  partOfSpeech: PartOfSpeech | "mixed";
  verbGroup?: VerbGroup | "all";
  practiceFocus: PracticeFocus;
  targetForm: TargetForm;
};
type UnlockStageId = "adverbial" | "negative" | "teTa" | "obligationPast";
type UnlockStage = {
  id: UnlockStageId;
  kicker: string;
  title: string;
  body: string;
  example: string;
  actionLabel: string;
  preset: DrillPreset;
  requiredForms: TargetForm[];
};

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
  "plainPresentAffirmative",
  "plainPresentNegative",
  "plainPastAffirmative",
  "plainPastNegative"
];

const jlptLevels: Array<JlptLevel | "all"> = ["all", "N5", "N4", "N3", "N2", "N1"];

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

const verbGroupGuide = [
  {
    group: "一類動詞",
    rule: "最後一個假名會換段或音便。",
    examples: ["書く -> 書きます", "読む -> 読みます", "帰る -> 帰ります"],
    note: "像「帰る」雖然以る結尾，但仍是一類，要另外記。"
  },
  {
    group: "二類動詞",
    rule: "先去掉最後的る，再接語尾。",
    examples: ["食べる -> 食べます", "見る -> 見ます", "起きる -> 起きます"],
    note: "二類通常比較規則：食べる、見る、起きる。"
  },
  {
    group: "三類動詞",
    rule: "する、来る是不規則，直接記形。",
    examples: ["する -> します", "来る -> 来ます", "勉強する -> 勉強します"],
    note: "名詞 + する 也跟 する 一起變。"
  }
];

const teTaRows = [
  { ending: "く", te: "いて", ta: "いた", example: "書く -> 書いて / 書いた" },
  { ending: "ぐ", te: "いで", ta: "いだ", example: "泳ぐ -> 泳いで / 泳いだ" },
  { ending: "す", te: "して", ta: "した", example: "話す -> 話して / 話した" },
  { ending: "う・つ・る", te: "って", ta: "った", example: "待つ -> 待って / 待った" },
  { ending: "む・ぶ・ぬ", te: "んで", ta: "んだ", example: "読む -> 読んで / 読んだ" }
];

const negativePipelines = [
  {
    title: "ない形",
    formula: "書く -> 書かない",
    body: "一類動詞先把最後假名換成あ段，再接ない；う結尾要變わない。"
  },
  {
    title: "否定て形・ないで",
    formula: "書かない -> 書かないで",
    body: "不是從て形變否定。先做ない形，再接ないで。"
  },
  {
    title: "否定接續・なくて",
    formula: "書かない -> 書かなくて",
    body: "也是先做ない形，再把ない換成なくて。常用來接理由或狀態。"
  },
  {
    title: "否定過去",
    formula: "書かない -> 書かなかった",
    body: "不是從た形變否定。先做ない形，再把ない換成なかった。"
  }
];

const adjectiveRows = [
  {
    type: "い形容詞",
    cue: "去い，加く或かった",
    examples: ["高い -> 高く", "高い -> 高くない", "高い -> 高かった"],
    note: "修飾動詞用く；否定過去是くなかった，不是かった再否定。"
  },
  {
    type: "な形容詞",
    cue: "修飾動詞加に，句尾像名詞句",
    examples: ["静か -> 静かに", "静かだ", "静かだった"],
    note: "修飾動詞用に；過去是だった，不是把な留下來加た。"
  },
  {
    type: "名詞",
    cue: "修飾或方向常加に",
    examples: ["学生 -> 学生に", "学生だ", "学生だった"],
    note: "名詞加に常用在變成某身分或方向；句尾過去用だった。"
  }
];

const obligationPastRows = [
  {
    title: "動詞",
    formula: "書く -> 書かなければならなかった",
    body: "先做ない形「書かない」，再把ない換成「なければならなかった」。"
  },
  {
    title: "い形容詞",
    formula: "高い -> 高くならなければならなかった",
    body: "先做「高くなる」，再把なる變成必要過去。"
  },
  {
    title: "な形容詞",
    formula: "静か -> 静かにならなければならなかった",
    body: "先加に做「静かになる」，過去放在最後的ならなかった。"
  },
  {
    title: "名詞",
    formula: "学生 -> 学生にならなければならなかった",
    body: "你卡住的型就在這裡：名詞 + に + ならなければならなかった。"
  }
];

const unlockStages: UnlockStage[] = [
  {
    id: "adverbial",
    kicker: "第 1 關",
    title: "先分清楚く / に",
    body: "い形容詞去い加く；な形容詞和名詞先加に。必要過去的に就是從這裡來。",
    example: "高く / 静かに / 学生に",
    actionLabel: "開始第 1 關",
    preset: {
      partOfSpeech: "mixed",
      verbGroup: "all",
      practiceFocus: "adverbial",
      targetForm: "adverbial"
    },
    requiredForms: ["adverbial"]
  },
  {
    id: "negative",
    kicker: "第 2 關",
    title: "ない形家族",
    body: "先把ない、ないで、なくて、なかった整理成同一條線。",
    example: "書かない -> 書かなかった",
    actionLabel: "練第 2 關",
    preset: {
      partOfSpeech: "verb",
      verbGroup: "all",
      practiceFocus: "negative",
      targetForm: "nai"
    },
    requiredForms: ["nai", "negativeTe", "negativeContinuative", "plainPastNegative"]
  },
  {
    id: "teTa",
    kicker: "第 3 關",
    title: "動詞て形 / た形",
    body: "熟悉一類動詞音便後，再處理更長的句型比較穩。",
    example: "読む -> 読んで / 読んだ",
    actionLabel: "練第 3 關",
    preset: {
      partOfSpeech: "verb",
      verbGroup: "godan",
      practiceFocus: "teTa",
      targetForm: "te"
    },
    requiredForms: ["te", "ta"]
  },
  {
    id: "obligationPast",
    kicker: "最後解鎖",
    title: "必要過去",
    body: "前面三關都答對過後，再練「にならなければならなかった」。",
    example: "学生 + に + ならなければならなかった",
    actionLabel: "練必要過去",
    preset: {
      partOfSpeech: "noun",
      verbGroup: "all",
      practiceFocus: "obligationPast",
      targetForm: "obligationPast"
    },
    requiredForms: ["obligationPast"]
  }
];

const attemptStore = createAttemptStore();

function isLearningStageComplete(attempts: Attempt[], stage: UnlockStage): boolean {
  return stage.requiredForms.every((targetForm) =>
    attempts.some((attempt) => attempt.isCorrect && attempt.targetForm === targetForm)
  );
}

function isObligationUnlocked(attempts: Attempt[]): boolean {
  return unlockStages
    .filter((stage) => stage.id !== "obligationPast")
    .every((stage) => isLearningStageComplete(attempts, stage));
}

export default function App() {
  const [appView, setAppView] = useState<AppView>("learn");
  const [partOfSpeech, setPartOfSpeech] = useState<PartOfSpeech | "mixed">("verb");
  const [verbGroup, setVerbGroup] = useState<VerbGroup | "all">("godan");
  const [targetForm, setTargetForm] = useState<TargetForm>("te");
  const [practiceFocus, setPracticeFocus] = useState<PracticeFocus>("single");
  const [theme, setTheme] = useState<Theme>(() => getInitialTheme());
  const [language, setLanguage] = useState<Language>(() => getInitialLanguage());
  const [jlptLevel, setJlptLevel] = useState<JlptLevel | "all">("all");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [sessionSeed, setSessionSeed] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [progressAttempts, setProgressAttempts] = useState<Attempt[]>(() => attemptStore.list());
  const startedAtRef = useRef(Date.now());
  const nextButtonRef = useRef<HTMLButtonElement>(null);
  const t = copy[language];
  const obligationUnlocked = isObligationUnlocked(progressAttempts);

  const baseCompatibleForms =
    partOfSpeech === "mixed"
      ? uniqueForms([...VERB_FORMS, ...ADJECTIVE_FORMS])
      : partOfSpeech === "verb"
        ? VERB_FORMS
        : ADJECTIVE_FORMS;
  const compatibleForms = uniqueForms([...baseCompatibleForms, "reading"]).filter(
    (form) => obligationUnlocked || form !== "obligationPast"
  );
  const selectedForm = compatibleForms.includes(targetForm) ? targetForm : compatibleForms[0];
  const effectivePracticeFocus = !obligationUnlocked && practiceFocus === "obligationPast" ? "single" : practiceFocus;
  const targetForms = useMemo(
    () =>
      effectivePracticeFocus === "single"
        ? [selectedForm]
        : focusOptions.find((option) => option.value === effectivePracticeFocus)?.targetForms ?? [selectedForm],
    [effectivePracticeFocus, selectedForm]
  );
  const activeFocusForms = targetForms.filter((form) => compatibleForms.includes(form));
  const focusSummary =
    effectivePracticeFocus === "single"
      ? t.targetForms[selectedForm]
      : activeFocusForms.map((form) => t.targetForms[form]).join(" / ") || t.focusSummaryEmpty;

  const questions = useMemo(
    () => {
      void sessionSeed;
      return shuffleQuestions(
        buildQuestionPool(vocabulary, {
          partOfSpeech,
          verbGroup,
          targetForms,
          level: jlptLevel
        })
      );
    },
    [partOfSpeech, targetForms, verbGroup, jlptLevel, sessionSeed]
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

          <fieldset>
            <legend>{t.practiceFocus}</legend>
            <div className="segmented focus-segmented">
              {focusOptions.map((option) => {
                const isDisabled =
                  (option.verbOnly && partOfSpeech !== "verb" && partOfSpeech !== "mixed") ||
                  (option.value === "adverbial" && partOfSpeech === "verb") ||
                  (option.value === "obligationPast" && !obligationUnlocked);

                return (
                  <button
                    key={option.value}
                    type="button"
                    className={effectivePracticeFocus === option.value ? "selected" : ""}
                    disabled={isDisabled}
                    onClick={() => handlePracticeFocusChange(option.value)}
                  >
                    {t.focusOptions[option.value]}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset>
            <legend>{t.verbGroup}</legend>
            <div className="segmented">
              {verbGroupOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={verbGroup === option ? "selected" : ""}
                  disabled={partOfSpeech !== "verb" && partOfSpeech !== "mixed"}
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

          <fieldset>
            <legend>{t.jlptLevel}</legend>
            <div className="segmented focus-segmented">
              {jlptLevels.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={jlptLevel === option ? "selected" : ""}
                  onClick={() => {
                    setJlptLevel(option);
                    if (option === "N1" || option === "N2") {
                      setPartOfSpeech("mixed");
                      setPracticeFocus("single");
                      setTargetForm("reading");
                    }
                    resetSession();
                  }}
                >
                  {t.jlptLevels[option]}
                </button>
              ))}
            </div>
          </fieldset>

          <label className="select-label">
            {t.targetForm}
            <select
              value={selectedForm}
              disabled={effectivePracticeFocus !== "single"}
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
                <strong>{t.targetForms[currentQuestion.targetForm]}</strong>
              </div>

              <div className="word-block">
                <p className="word-kind">
                  <GraduationCap aria-hidden="true" />
                  {partOfSpeechLabel(currentQuestion.vocabulary.partOfSpeech, language)}
                </p>
                {currentQuestion.targetForm === "reading" ? null : (
                  <p className="reading">{currentQuestion.vocabulary.reading}</p>
                )}
                <p className="surface">{currentQuestion.vocabulary.surface}</p>
                <p className="meaning">{currentQuestion.vocabulary.meaningZh}</p>
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
                  {question.vocabulary.surface} {"->"} {t.targetForms[question.targetForm]}
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
  const obligationIsUnlocked = isObligationUnlocked(progressAttempts);
  const stageCards = unlockStages.map((stage) => {
    const complete = isLearningStageComplete(progressAttempts, stage);
    const locked = stage.id === "obligationPast" && !obligationIsUnlocked;
    return { ...stage, complete, locked };
  });
  const recommendedStage = stageCards.find((stage) => !stage.complete && !stage.locked) ?? stageCards[stageCards.length - 1];
  const [selectedChapterId, setSelectedChapterId] = useState<UnlockStageId | null>(null);
  const selectedStage = stageCards.find((stage) => stage.id === selectedChapterId);
  const activeStage = selectedStage && !selectedStage.locked ? selectedStage : recommendedStage;

  const renderChapterLesson = () => {
    switch (activeStage.id) {
      case "adverbial":
        return (
          <div className="chapter-lesson">
            <div className="rule-matrix three-column">
              {adjectiveRows.map((row) => (
                <article className="rule-card" key={row.type}>
                  <h4>{row.type}</h4>
                  <p>{row.cue}</p>
                  <div className="formula-row" aria-label={`${row.type}例子`}>
                    {row.examples.map((example) => (
                      <code key={example}>{example}</code>
                    ))}
                  </div>
                  <small>{row.note}</small>
                </article>
              ))}
            </div>
            <div className="inline-action-row">
              <button
                className="inline-drill-button"
                type="button"
                onClick={() =>
                  onStartDrill({
                    partOfSpeech: "i_adjective",
                    verbGroup: "all",
                    practiceFocus: "plain",
                    targetForm: "plainPresentNegative"
                  })
                }
              >
                <ArrowRight aria-hidden="true" />
                {t.drillIAdjective}
              </button>
              <button
                className="inline-drill-button"
                type="button"
                onClick={() =>
                  onStartDrill({
                    partOfSpeech: "na_adjective",
                    verbGroup: "all",
                    practiceFocus: "plain",
                    targetForm: "plainPresentNegative"
                  })
                }
              >
                <ArrowRight aria-hidden="true" />
                {t.drillNaAdjective}
              </button>
              <button
                className="inline-drill-button"
                type="button"
                onClick={() => onStartDrill(activeStage.preset)}
              >
                <ArrowRight aria-hidden="true" />
                {t.drillAdverbial}
              </button>
            </div>
          </div>
        );

      case "negative":
        return (
          <div className="chapter-lesson">
            <div className="pipeline-grid">
              {negativePipelines.map((item) => (
                <article className="pipeline-card" key={item.title}>
                  <span>{item.title}</span>
                  <code>{item.formula}</code>
                  <p>{item.body}</p>
                </article>
              ))}
            </div>
            <button className="inline-drill-button" type="button" onClick={() => onStartDrill(activeStage.preset)}>
              <ArrowRight aria-hidden="true" />
              {t.drillNegative}
            </button>
          </div>
        );

      case "teTa":
        return (
          <div className="chapter-lesson">
            <div className="rule-matrix three-column">
              {verbGroupGuide.map((item) => (
                <article className="rule-card" key={item.group}>
                  <h4>{item.group}</h4>
                  <p>{item.rule}</p>
                  <div className="formula-row" aria-label={`${item.group}例子`}>
                    {item.examples.map((example) => (
                      <code key={example}>{example}</code>
                    ))}
                  </div>
                  <small>{item.note}</small>
                </article>
              ))}
            </div>
            <div className="sound-table" role="table" aria-label={t.teTaTableLabel}>
              <div className="sound-row sound-head" role="row">
                <span role="columnheader">{t.tableEnding}</span>
                <span role="columnheader">{t.tableTe}</span>
                <span role="columnheader">{t.tableTa}</span>
                <span role="columnheader">{t.tableExample}</span>
              </div>
              {teTaRows.map((row) => (
                <div className="sound-row" role="row" key={row.ending}>
                  <span role="cell">{row.ending}</span>
                  <code role="cell">{row.te}</code>
                  <code role="cell">{row.ta}</code>
                  <code role="cell">{row.example}</code>
                </div>
              ))}
            </div>
            <button className="inline-drill-button" type="button" onClick={() => onStartDrill(activeStage.preset)}>
              <ArrowRight aria-hidden="true" />
              {t.drillGodanTeTa}
            </button>
          </div>
        );

      case "obligationPast":
        return (
          <div className="chapter-lesson">
            <div className="pipeline-grid">
              {obligationPastRows.map((item) => (
                <article className="pipeline-card" key={item.title}>
                  <span>{item.title}</span>
                  <code>{item.formula}</code>
                  <p>{item.body}</p>
                </article>
              ))}
            </div>
            <button
              className="inline-drill-button"
              type="button"
              disabled={!obligationIsUnlocked}
              onClick={() => onStartDrill(activeStage.preset)}
            >
              {obligationIsUnlocked ? <ArrowRight aria-hidden="true" /> : <Lock aria-hidden="true" />}
              {obligationIsUnlocked ? t.drillObligationPast : "完成前置後解鎖"}
            </button>
          </div>
        );
    }
  };

  return (
    <section className="learning-panel" aria-label={t.learningRegion}>
      <div className="chapter-shell">
        <aside className="chapter-index" aria-label="學習章節">
          <div className="chapter-index-copy">
            <p className="eyebrow">課程章節</p>
            <h2>一章一章解鎖</h2>
            <p>首頁只放章節目錄。選一章後，右邊才顯示該章規則、例子與練習。</p>
          </div>

          <div className="chapter-list">
            {stageCards.map((stage) => (
              <button
                className={`chapter-list-button${stage.id === activeStage.id ? " selected" : ""}${stage.complete ? " complete" : ""}`}
                type="button"
                key={stage.id}
                disabled={stage.locked}
                aria-label={stage.locked ? `${stage.title}：完成前置後解鎖` : `查看：${stage.title}`}
                onClick={() => setSelectedChapterId(stage.id)}
              >
                <span>{stage.complete ? "完成" : stage.locked ? "鎖定" : stage.kicker}</span>
                <strong>{stage.title}</strong>
                <small>{stage.locked ? "完成前置後解鎖" : stage.example}</small>
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
            <p className="eyebrow">{activeStage.kicker}</p>
            <h3 id="active-chapter-title">{activeStage.title}</h3>
            <p>{activeStage.body}</p>
            <div className="focus-formula" aria-label={`${activeStage.title}例子`}>
              <span>{activeStage.example}</span>
            </div>
            <div className="chapter-actions">
              <button className="start-challenge" type="button" onClick={() => onStartDrill(activeStage.preset)}>
                <ArrowRight aria-hidden="true" />
                {activeStage.complete ? "複習這一章" : activeStage.actionLabel}
              </button>
              <span>{obligationIsUnlocked ? "必要過去已解鎖" : "必要過去會在前置完成後解鎖"}</span>
            </div>
          </div>
          {renderChapterLesson()}
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
