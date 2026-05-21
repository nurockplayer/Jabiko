import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Eye,
  GraduationCap,
  Moon,
  RotateCcw,
  Send,
  Sun,
  XCircle
} from "lucide-react";
import {
  ADJECTIVE_FORMS,
  TARGET_FORM_LABELS,
  validateAnswer,
  VERB_FORMS
} from "./domain/conjugation";
import { buildQuestionPool, getMistakeQuestions, scoreAttempt, selectQuestion } from "./domain/practice";
import { createAttemptStore } from "./domain/storage";
import type { Attempt, PartOfSpeech, PracticeQuestion, TargetForm, VerbGroup } from "./domain/types";
import { vocabulary } from "./domain/vocabulary";
import "./styles.css";

type Feedback =
  | { status: "correct"; question: PracticeQuestion }
  | { status: "incorrect"; question: PracticeQuestion }
  | { status: "revealed"; question: PracticeQuestion }
  | null;

type PracticeFocus = "single" | "teTa" | "negative" | "plain";
type AnswerMode = "choice" | "input";
type AppView = "learn" | "challenge";
type Theme = "light" | "dark";
type DrillPreset = {
  partOfSpeech: PartOfSpeech | "mixed";
  verbGroup?: VerbGroup | "all";
  practiceFocus: PracticeFocus;
  targetForm: TargetForm;
};

const THEME_STORAGE_KEY = "jabiko.theme";

const partOfSpeechOptions: Array<{ value: PartOfSpeech | "mixed"; label: string }> = [
  { value: "verb", label: "動詞" },
  { value: "i_adjective", label: "い形容詞" },
  { value: "na_adjective", label: "な形容詞" },
  { value: "noun", label: "名詞" },
  { value: "mixed", label: "混合" }
];

const verbGroupOptions: Array<{ value: VerbGroup | "all"; label: string }> = [
  { value: "godan", label: "一類" },
  { value: "ichidan", label: "二類" },
  { value: "irregular", label: "三類" },
  { value: "all", label: "全部" }
];

const formOptions: TargetForm[] = [
  "te",
  "ta",
  "nai",
  "negativeTe",
  "negativeContinuative",
  "masu",
  "dictionary",
  "plainPresentAffirmative",
  "plainPresentNegative",
  "plainPastAffirmative",
  "plainPastNegative"
];

const focusOptions: Array<{ value: PracticeFocus; label: string; targetForms: TargetForm[]; verbOnly?: boolean }> = [
  { value: "single", label: "單一形", targetForms: [] },
  { value: "teTa", label: "て/た比較", targetForms: ["te", "ta"], verbOnly: true },
  { value: "negative", label: "否定整理", targetForms: ["nai", "negativeTe", "negativeContinuative", "plainPastNegative"] },
  {
    value: "plain",
    label: "普通形整理",
    targetForms: [
      "plainPresentAffirmative",
      "plainPresentNegative",
      "plainPastAffirmative",
      "plainPastNegative"
    ]
  }
];

const learningSteps = [
  {
    label: "先分類",
    title: "不要一開始就背表",
    body: "先問：這是動詞、い形容詞、な形容詞，還是名詞？如果是動詞，再判斷一類、二類、三類。"
  },
  {
    label: "選家族",
    title: "同一組變化放一起",
    body: "て形 / た形是一組；ない、ないで、なくて、なかった是一組。先把家族關係看懂，比硬背單字快。"
  },
  {
    label: "看錯題",
    title: "錯了就讀規則",
    body: "挑戰時答錯會顯示正解與規則。先確認「為什麼這樣變」，再進下一題。"
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
    examples: ["高い -> 高くない", "高い -> 高かった", "高い -> 高くなかった"],
    note: "否定過去是くなかった，不是かった再否定。"
  },
  {
    type: "な形容詞",
    cue: "像名詞句，現在肯定要だ",
    examples: ["静かだ", "静かではない", "静かだった"],
    note: "過去是だった，不是把な留下來加た。"
  },
  {
    type: "名詞",
    cue: "和な形容詞同一套",
    examples: ["学生だ", "学生ではない", "学生だった"],
    note: "名詞過去用だった；口語否定也可以用じゃない。"
  }
];

const lessonCards = [
  {
    title: "一類動詞先看最後一個假名",
    focus: "て形 / た形音便",
    rule: "く -> いて、ぐ -> いで、す -> して；う・つ・る -> って；む・ぶ・ぬ -> んで。",
    examples: ["書く -> 書いて", "読む -> 読んで", "行く -> 行って"]
  },
  {
    title: "ない形不是把て形變否定",
    focus: "ないで / なくて / なかった",
    rule: "先做ない形，再分別接：ないで、なくて、なかった。這三個不是從て形或た形變來。",
    examples: ["書かないで", "書かなくて", "書かなかった"]
  },
  {
    title: "い形容詞去い，な形容詞像名詞",
    focus: "形容詞與名詞型",
    rule: "い形容詞：高い -> 高くない / 高かった。な形容詞與名詞：静かだ、学生だ，過去用だった。",
    examples: ["高くなかった", "静かではない", "学生だった"]
  }
];

const attemptStore = createAttemptStore();

export default function App() {
  const [appView, setAppView] = useState<AppView>("learn");
  const [partOfSpeech, setPartOfSpeech] = useState<PartOfSpeech | "mixed">("verb");
  const [verbGroup, setVerbGroup] = useState<VerbGroup | "all">("godan");
  const [targetForm, setTargetForm] = useState<TargetForm>("te");
  const [practiceFocus, setPracticeFocus] = useState<PracticeFocus>("single");
  const [answerMode, setAnswerMode] = useState<AnswerMode>("choice");
  const [theme, setTheme] = useState<Theme>(() => getInitialTheme());
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [inputHint, setInputHint] = useState("");
  const startedAtRef = useRef(Date.now());
  const answerInputRef = useRef<HTMLInputElement>(null);
  const nextButtonRef = useRef<HTMLButtonElement>(null);

  const compatibleForms = partOfSpeech === "verb" || partOfSpeech === "mixed" ? VERB_FORMS : ADJECTIVE_FORMS;
  const selectedForm = compatibleForms.includes(targetForm) ? targetForm : compatibleForms[0];
  const targetForms = useMemo(
    () =>
      practiceFocus === "single"
        ? [selectedForm]
        : focusOptions.find((option) => option.value === practiceFocus)?.targetForms ?? [selectedForm],
    [practiceFocus, selectedForm]
  );
  const activeFocusForms = targetForms.filter((form) => compatibleForms.includes(form));
  const focusSummary =
    practiceFocus === "single"
      ? TARGET_FORM_LABELS[selectedForm]
      : activeFocusForms.map((form) => TARGET_FORM_LABELS[form]).join(" / ");

  const questions = useMemo(
    () =>
      buildQuestionPool(vocabulary, {
        partOfSpeech,
        verbGroup,
        targetForms
      }),
    [partOfSpeech, targetForms, verbGroup]
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
      return;
    }

    if (answerMode === "input" && !feedback) {
      answerInputRef.current?.focus({ preventScroll: true });
    }
  }, [answerMode, feedback, questionIndex, practiceFocus, selectedForm]);

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

  const handleAnswerModeChange = (nextMode: AnswerMode) => {
    setAnswerMode(nextMode);
    setAnswer("");
    setInputHint("");
    setSelectedChoice(null);
  };

  const submitAnswer = (submittedAnswer: string) => {
    if (!currentQuestion || feedback) {
      return;
    }

    const attempt = scoreAttempt(currentQuestion, submittedAnswer, startedAtRef.current);
    setAttempts((current) => [...current, attempt]);
    attemptStore.add(attempt);
    setInputHint("");
    setFeedback({ status: attempt.isCorrect ? "correct" : "incorrect", question: currentQuestion });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!currentQuestion || feedback) {
      return;
    }

    if (!answer.trim()) {
      setInputHint("請先輸入答案，再按 Enter 送出。");
      answerInputRef.current?.focus({ preventScroll: true });
      return;
    }

    submitAnswer(answer);
  };

  const handleChoiceSubmit = (choice: string) => {
    if (!currentQuestion || feedback) {
      return;
    }

    setSelectedChoice(choice);
    submitAnswer(choice);
  };

  const nextQuestion = () => {
    setQuestionIndex((current) => current + 1);
    setAnswer("");
    setSelectedChoice(null);
    setInputHint("");
    setFeedback(null);
    startedAtRef.current = Date.now();
  };

  const resetSession = () => {
    setAttempts([]);
    setQuestionIndex(0);
    setAnswer("");
    setSelectedChoice(null);
    setInputHint("");
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
    attemptStore.add(missedAttempt);
    setInputHint("");
    setSelectedChoice(null);
    setFeedback({ status: "revealed", question: currentQuestion });
  };

  const handleDrillKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" && feedback) {
      event.preventDefault();
      nextQuestion();
    }
  };

  const themeToggleLabel = theme === "dark" ? "淺色模式" : "深色模式";
  const ThemeIcon = theme === "dark" ? Sun : Moon;
  const startDrill = (preset: DrillPreset) => {
    setPartOfSpeech(preset.partOfSpeech);
    setVerbGroup(preset.verbGroup ?? "all");
    setPracticeFocus(preset.practiceFocus);
    setTargetForm(preset.targetForm);
    setAnswerMode("choice");
    resetSession();
    setAppView("challenge");
  };

  return (
    <main className="app-shell">
      <div className="app-heading" aria-label="應用程式介紹">
        <div>
          <p className="eyebrow">Minna no Nihongo practice</p>
          <h1>Jabiko 變化訓練場</h1>
        </div>
        <div className="heading-actions">
          <p>短回合、立即訂正，把動詞與形容詞變化練到不用想太久。</p>
          <button className="theme-toggle" type="button" onClick={toggleTheme}>
            <ThemeIcon aria-hidden="true" />
            {themeToggleLabel}
          </button>
        </div>
      </div>

      <nav className="view-switch segmented" aria-label="學習流程">
        <button
          type="button"
          className={appView === "learn" ? "selected" : ""}
          onClick={() => setAppView("learn")}
        >
          學習
        </button>
        <button
          type="button"
          className={appView === "challenge" ? "selected" : ""}
          onClick={() => setAppView("challenge")}
        >
          挑戰
        </button>
      </nav>

      {appView === "learn" ? (
        <LearningPanel onStartChallenge={() => setAppView("challenge")} onStartDrill={startDrill} />
      ) : (
        <section className="practice-layout" aria-label="Jabiko practice">
        <aside className="controls-panel" aria-label="練習設定">
          <div className="brand-lockup">
            <BookOpen aria-hidden="true" />
            <div>
              <p>Jabiko</p>
              <h2>今日練習</h2>
            </div>
          </div>

          <fieldset>
            <legend>練習類型</legend>
            <div className="segmented">
              {partOfSpeechOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={partOfSpeech === option.value ? "selected" : ""}
                  onClick={() => handlePartOfSpeechChange(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend>練習重點</legend>
            <div className="segmented focus-segmented">
              {focusOptions.map((option) => {
                const isDisabled = option.verbOnly && partOfSpeech !== "verb" && partOfSpeech !== "mixed";

                return (
                  <button
                    key={option.value}
                    type="button"
                    className={practiceFocus === option.value ? "selected" : ""}
                    disabled={isDisabled}
                    onClick={() => handlePracticeFocusChange(option.value)}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset>
            <legend>動詞類別</legend>
            <div className="segmented">
              {verbGroupOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={verbGroup === option.value ? "selected" : ""}
                  disabled={partOfSpeech !== "verb" && partOfSpeech !== "mixed"}
                  onClick={() => {
                    setVerbGroup(option.value);
                    resetSession();
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>

          <label className="select-label">
            目標形
            <select
              value={selectedForm}
              disabled={practiceFocus !== "single"}
              onChange={(event) => {
                setTargetForm(event.target.value as TargetForm);
                resetSession();
              }}
            >
              {formOptions
                .filter((form) => compatibleForms.includes(form))
                .map((form) => (
                  <option key={form} value={form}>
                    {TARGET_FORM_LABELS[form]}
                  </option>
                ))}
            </select>
          </label>

          <p className="focus-summary">{focusSummary}</p>

          <div className="score-strip" aria-label="本次練習成績">
            <span>
              <strong>{attempts.length}</strong>
              已答
            </span>
            <span>
              <strong>{correctCount}</strong>
              正解
            </span>
            <span>
              <strong>{mistakeQuestions.length}</strong>
              複習
            </span>
          </div>

          <button className="ghost-button" type="button" onClick={resetSession}>
            <RotateCcw aria-hidden="true" />
            重設本次
          </button>
        </aside>

        <section className="drill-panel" aria-label="目前題目" onKeyDown={handleDrillKeyDown}>
          {currentQuestion ? (
            <>
              <div className="prompt-header">
                <span>第 {questionIndex + 1} 題</span>
                <strong>{TARGET_FORM_LABELS[currentQuestion.targetForm]}</strong>
              </div>

              <div className="word-block">
                <p className="word-kind">
                  <GraduationCap aria-hidden="true" />
                  {partOfSpeechLabel(currentQuestion.vocabulary.partOfSpeech)}
                </p>
                <p className="reading">{currentQuestion.vocabulary.reading}</p>
                <p className="surface">{currentQuestion.vocabulary.surface}</p>
                <p className="meaning">{currentQuestion.vocabulary.meaningZh}</p>
              </div>

              <fieldset className="answer-mode">
                <legend>答題方式</legend>
                <div className="segmented answer-mode-segmented">
                  <button
                    type="button"
                    className={answerMode === "choice" ? "selected" : ""}
                    disabled={Boolean(feedback)}
                    onClick={() => handleAnswerModeChange("choice")}
                  >
                    選擇題
                  </button>
                  <button
                    type="button"
                    className={answerMode === "input" ? "selected" : ""}
                    disabled={Boolean(feedback)}
                    onClick={() => handleAnswerModeChange("input")}
                  >
                    輸入
                  </button>
                </div>
              </fieldset>

              {answerMode === "choice" ? (
                <div className="choice-grid" aria-label="答案選項">
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
              ) : (
                <form className="answer-row" onSubmit={handleSubmit}>
                  <label htmlFor="answer">答案</label>
                  <input
                    id="answer"
                    ref={answerInputRef}
                    value={answer}
                    readOnly={Boolean(feedback)}
                    aria-describedby={inputHint ? "answer-hint" : undefined}
                    autoComplete="off"
                    onChange={(event) => setAnswer(event.target.value)}
                  />
                  <button type="submit" disabled={Boolean(feedback)}>
                    <Send aria-hidden="true" />
                    送出
                  </button>
                  {inputHint ? (
                    <p className="input-hint" id="answer-hint" role="status">
                      {inputHint}
                    </p>
                  ) : null}
                </form>
              )}

              <div className="action-row">
                <button className="ghost-button" type="button" onClick={revealAnswer} disabled={Boolean(feedback)}>
                  <Eye aria-hidden="true" />
                  看答案
                </button>
                <button className="next-button" type="button" ref={nextButtonRef} onClick={nextQuestion}>
                  <ArrowRight aria-hidden="true" />
                  下一題
                </button>
              </div>

              {feedback ? <FeedbackPanel feedback={feedback} /> : null}
            </>
          ) : (
            <div className="empty-state">目前設定沒有可練習的題目。</div>
          )}
        </section>

        <aside className="review-panel" aria-label="錯題">
          <div className="review-heading">
            <h2>錯題複習</h2>
            <span>{accuracy}%</span>
          </div>
          {mistakeQuestions.length > 0 ? (
            <ul>
              {mistakeQuestions.map((question) => (
                <li key={question.id}>
                  {question.vocabulary.surface} {"->"} {TARGET_FORM_LABELS[question.targetForm]}
                </li>
              ))}
            </ul>
          ) : (
            <p>本次還沒有錯題。</p>
          )}
        </aside>
        </section>
      )}
    </main>
  );
}

function LearningPanel({
  onStartChallenge,
  onStartDrill
}: {
  onStartChallenge: () => void;
  onStartDrill: (preset: DrillPreset) => void;
}) {
  return (
    <section className="learning-panel" aria-label="學習">
      <div className="learning-copy">
        <p className="eyebrow">Study before recall</p>
        <h2>先學會，再挑戰</h2>
        <p>第一次使用先照順序看：分辨詞類、抓同一組變化、再用選擇題確認。看懂規則後才進入輸入練習。</p>
      </div>

      <ol className="learning-roadmap" aria-label="建議學習順序">
        {learningSteps.map((step) => (
          <li key={step.label}>
            <span>{step.label}</span>
            <strong>{step.title}</strong>
            <p>{step.body}</p>
          </li>
        ))}
      </ol>

      <section className="learning-section" aria-labelledby="verb-group-title">
        <div className="learning-section-copy">
          <p className="eyebrow">Step 1</p>
          <h3 id="verb-group-title">動詞先分三類</h3>
          <p>先不要管て形或た形。動詞題第一步只做分類，分類對了，後面才知道要「換最後假名」還是「去る」。</p>
        </div>
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
      </section>

      <section className="learning-section" aria-labelledby="te-ta-title">
        <div className="learning-section-copy">
          <p className="eyebrow">Step 2</p>
          <h3 id="te-ta-title">て形和た形是同一張表</h3>
          <p>一類動詞最難的是音便。先背「て / た 成對」，不要分開背兩份規則。行く是例外：行って、行った。</p>
        </div>
        <div className="sound-table" role="table" aria-label="一類動詞て形與た形音便">
          <div className="sound-row sound-head" role="row">
            <span role="columnheader">結尾</span>
            <span role="columnheader">て形</span>
            <span role="columnheader">た形</span>
            <span role="columnheader">例子</span>
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
        <button
          className="inline-drill-button"
          type="button"
          onClick={() =>
            onStartDrill({ partOfSpeech: "verb", verbGroup: "godan", practiceFocus: "teTa", targetForm: "te" })
          }
        >
          <ArrowRight aria-hidden="true" />
          練一類て/た
        </button>
      </section>

      <section className="learning-section" aria-labelledby="negative-title">
        <div className="learning-section-copy">
          <p className="eyebrow">Step 3</p>
          <h3 id="negative-title">否定變化都先回到ない形</h3>
          <p>你卡住的「て形た形的否定」其實不是從て形或た形變來。先做ない形，再往下接。</p>
        </div>
        <div className="pipeline-grid">
          {negativePipelines.map((item) => (
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
          onClick={() =>
            onStartDrill({ partOfSpeech: "verb", verbGroup: "all", practiceFocus: "negative", targetForm: "nai" })
          }
        >
          <ArrowRight aria-hidden="true" />
          練否定整理
        </button>
      </section>

      <section className="learning-section" aria-labelledby="adjective-title">
        <div className="learning-section-copy">
          <p className="eyebrow">Step 4</p>
          <h3 id="adjective-title">形容詞和名詞不要混在一起背</h3>
          <p>い形容詞會去い；な形容詞和名詞比較像「名詞句」，用だ、ではない、だった這一套。</p>
        </div>
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
            練い形容詞
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
            練な形容詞
          </button>
        </div>
      </section>

      <div className="lesson-grid" aria-label="速記卡">
        {lessonCards.map((card) => (
          <article className="lesson-card" key={card.title}>
            <span>{card.focus}</span>
            <h3>{card.title}</h3>
            <p>{card.rule}</p>
            <div className="formula-row" aria-label={`${card.title}例子`}>
              {card.examples.map((example) => (
                <code key={example}>{example}</code>
              ))}
            </div>
          </article>
        ))}
      </div>

      <button className="start-challenge" type="button" onClick={onStartChallenge}>
        <ArrowRight aria-hidden="true" />
        開始挑戰
      </button>
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

function buildChoiceOptions(
  currentQuestion: PracticeQuestion,
  questions: PracticeQuestion[],
  questionIndex: number
): string[] {
  const correctAnswer = currentQuestion.expectedAnswers[0];
  const acceptedAnswers = new Set(currentQuestion.expectedAnswers);
  const distractors = uniqueAnswers(
    questions
      .filter((question) => question.id !== currentQuestion.id)
      .flatMap((question) => question.expectedAnswers)
      .filter((answer) => !acceptedAnswers.has(answer))
  );
  const options = [correctAnswer, ...distractors.slice(0, 3)];
  const offset = options.length > 0 ? (questionIndex + currentQuestion.id.length) % options.length : 0;

  return [...options.slice(offset), ...options.slice(0, offset)];
}

function uniqueAnswers(answers: string[]): string[] {
  return Array.from(new Set(answers));
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

function partOfSpeechLabel(partOfSpeech: PartOfSpeech): string {
  switch (partOfSpeech) {
    case "verb":
      return "動詞";
    case "i_adjective":
      return "い形容詞";
    case "na_adjective":
      return "な形容詞";
    case "noun":
      return "名詞";
  }
}

function FeedbackPanel({ feedback }: { feedback: NonNullable<Feedback> }) {
  const isCorrect = feedback.status === "correct";
  const isRevealed = feedback.status === "revealed";
  const title = isCorrect ? "正解" : isRevealed ? "先記這題" : "再想一下";
  const Icon = isCorrect ? CheckCircle2 : XCircle;

  return (
    <section className={`feedback ${isCorrect ? "correct" : isRevealed ? "revealed" : "incorrect"}`} aria-live="polite">
      <div className="feedback-title">
        <Icon aria-hidden="true" />
        <h2>{title}</h2>
      </div>
      <p className="answer-key">正解：{feedback.question.expectedAnswers.join(" / ")}</p>
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
