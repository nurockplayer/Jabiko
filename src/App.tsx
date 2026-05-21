import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Eye,
  GraduationCap,
  RotateCcw,
  Send,
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

const partOfSpeechOptions: Array<{ value: PartOfSpeech | "mixed"; label: string }> = [
  { value: "verb", label: "動詞" },
  { value: "i_adjective", label: "い形容詞" },
  { value: "na_adjective", label: "な形容詞" },
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
  "masu",
  "dictionary",
  "plainPresentAffirmative",
  "plainPresentNegative",
  "plainPastAffirmative",
  "plainPastNegative"
];

const attemptStore = createAttemptStore();

export default function App() {
  const [partOfSpeech, setPartOfSpeech] = useState<PartOfSpeech | "mixed">("verb");
  const [verbGroup, setVerbGroup] = useState<VerbGroup | "all">("godan");
  const [targetForm, setTargetForm] = useState<TargetForm>("te");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [inputHint, setInputHint] = useState("");
  const startedAtRef = useRef(Date.now());
  const answerInputRef = useRef<HTMLInputElement>(null);

  const compatibleForms = partOfSpeech === "verb" || partOfSpeech === "mixed" ? VERB_FORMS : ADJECTIVE_FORMS;
  const selectedForm = compatibleForms.includes(targetForm) ? targetForm : compatibleForms[0];

  const questions = useMemo(
    () =>
      buildQuestionPool(vocabulary, {
        partOfSpeech,
        verbGroup,
        targetForms: [selectedForm]
      }),
    [partOfSpeech, selectedForm, verbGroup]
  );
  const currentQuestion = selectQuestion(questions, questionIndex);
  const mistakeQuestions = getMistakeQuestions(attempts, questions);
  const correctCount = attempts.filter((attempt) => attempt.isCorrect).length;
  const accuracy = attempts.length > 0 ? Math.round((correctCount / attempts.length) * 100) : 0;

  useEffect(() => {
    answerInputRef.current?.focus({ preventScroll: true });
  }, [feedback, questionIndex, selectedForm]);

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

    const attempt = scoreAttempt(currentQuestion, answer, startedAtRef.current);
    setAttempts((current) => [...current, attempt]);
    attemptStore.add(attempt);
    setInputHint("");
    setFeedback({ status: attempt.isCorrect ? "correct" : "incorrect", question: currentQuestion });
  };

  const nextQuestion = () => {
    setQuestionIndex((current) => current + 1);
    setAnswer("");
    setInputHint("");
    setFeedback(null);
    startedAtRef.current = Date.now();
  };

  const resetSession = () => {
    setAttempts([]);
    setQuestionIndex(0);
    setAnswer("");
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
    setFeedback({ status: "revealed", question: currentQuestion });
  };

  const handleDrillKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" && feedback) {
      event.preventDefault();
      nextQuestion();
    }
  };

  return (
    <main className="app-shell">
      <div className="app-heading" aria-label="應用程式介紹">
        <div>
          <p className="eyebrow">Minna no Nihongo practice</p>
          <h1>Jabiko 變化訓練場</h1>
        </div>
        <p>短回合、立即訂正，把動詞與形容詞變化練到不用想太久。</p>
      </div>

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
                  onClick={() => {
                    setPartOfSpeech(option.value);
                    setTargetForm(option.value === "verb" || option.value === "mixed" ? "te" : "plainPresentNegative");
                    resetSession();
                  }}
                >
                  {option.label}
                </button>
              ))}
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
                  {currentQuestion.vocabulary.partOfSpeech === "verb" ? "動詞" : "形容詞"}
                </p>
                <p className="reading">{currentQuestion.vocabulary.reading}</p>
                <p className="surface">{currentQuestion.vocabulary.surface}</p>
                <p className="meaning">{currentQuestion.vocabulary.meaningZh}</p>
              </div>

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

              <div className="action-row">
                <button className="ghost-button" type="button" onClick={revealAnswer} disabled={Boolean(feedback)}>
                  <Eye aria-hidden="true" />
                  看答案
                </button>
                <button className="next-button" type="button" onClick={nextQuestion}>
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
    </main>
  );
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
