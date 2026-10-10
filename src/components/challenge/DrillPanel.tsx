import { useEffect, useRef, type CSSProperties } from "react";
import { ArrowRight, ChevronDown, Eye, GraduationCap, House, MessageSquare, RotateCcw } from "lucide-react";
import { copy, type Language } from "../../i18n";
import type { PartOfSpeech } from "../../domain/types";
import { PaperNoteSpot, TeaCupSpot } from "../../illustrations";
import { allowsOptionFurigana, isReadingPrompt } from "../../domain/furigana";
import { pickLocalized } from "../../domain/localizedContent";
import { ExamPrompt } from "../ExamPrompt";
import { FeedbackPanel } from "../FeedbackPanel";
import { JabikoBuddy } from "../JabikoBuddy";
import {
  buddyEnergy,
  buddyLine,
  completionEnergy,
  trailingCorrect,
  type BuddyMood
} from "../../domain/buddyReaction";
import { Ruby } from "../Ruby";
import { ShareButtons } from "./ShareButtons";
import { SpeakButton } from "../SpeakButton";
import type { Feedback } from "../types";
import type { PracticeSession } from "../../hooks/usePracticeSession";

// How much of the explanation (verdict title + answer line + a first line of
// text) must show above the docked action row once the mark has landed.
const FEEDBACK_PEEK_PX = 120;
// Let the 〇/× land before the view moves.
const FEEDBACK_PEEK_DELAY_MS = 420;

function prefersReducedMotion(): boolean {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
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

// #861 / D-03: the verdict is marked ON the judged option, the way a teacher
// marks a paper (丸付け). 〇 = the right answer, × = the learner's wrong pick,
// dashed 〇 = shown without answering. The glyph shape carries the meaning
// (never colour alone); it is aria-hidden because the feedback live region
// already announces the verdict. `pathLength` = 1 lets CSS draw the stroke
// (learning-loop.css); without motion the mark is simply complete.
type VerdictMarkKind = "correct" | "miss" | "revealed";

// A hand-drawn maru: starts at ~10 o'clock and runs clockwise a little past a
// full turn, tightening so the tail tucks inside its own start.
const MARU_PATH =
  "M4.03 7.40C4.28 7.08 4.93 6.03 5.50 5.45C6.06 4.88 6.73 4.36 7.43 3.95C8.13 3.55 8.91 3.23 9.69 3.02C10.47 2.82 11.32 2.72 12.12 2.73C12.93 2.74 13.77 2.87 14.55 3.10C15.32 3.33 16.09 3.68 16.77 4.11C17.45 4.53 18.10 5.08 18.64 5.67C19.17 6.26 19.64 6.95 20.00 7.66C20.35 8.38 20.61 9.16 20.76 9.93C20.91 10.71 20.95 11.52 20.89 12.30C20.83 13.07 20.65 13.86 20.38 14.58C20.12 15.30 19.74 16.00 19.30 16.62C18.86 17.23 18.32 17.80 17.74 18.27C17.17 18.74 16.51 19.13 15.84 19.43C15.17 19.73 14.44 19.94 13.73 20.05C13.02 20.16 12.27 20.17 11.56 20.09C10.86 20.02 10.15 19.84 9.49 19.59C8.84 19.34 8.20 19.00 7.64 18.59C7.08 18.19 6.56 17.70 6.12 17.17C5.69 16.64 5.31 16.04 5.02 15.43C4.73 14.81 4.52 14.14 4.40 13.47C4.28 12.81 4.24 12.10 4.29 11.43C4.35 10.76 4.49 10.07 4.71 9.43C4.93 8.79 5.25 8.16 5.63 7.60C6.01 7.04 6.47 6.51 6.99 6.06C7.50 5.62 8.42 5.12 8.70 4.93";

function VerdictMark({ kind }: { kind: VerdictMarkKind }) {
  return (
    <svg className="verdict-mark" data-mark={kind} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path pathLength={1} d={kind === "miss" ? "M7 7 17 17M17 7 7 17" : MARU_PATH} />
    </svg>
  );
}

function verdictMarkFor(
  choice: string,
  selectedChoice: string | null,
  feedback: Feedback,
  expectedAnswers: string[]
): VerdictMarkKind | null {
  if (!feedback) return null;
  const isSelected = selectedChoice === choice;
  if (feedback.status === "correct") return isSelected ? "correct" : null;
  if (feedback.status === "incorrect") {
    if (isSelected) return "miss";
    return expectedAnswers.includes(choice) ? "correct" : null;
  }
  return expectedAnswers.includes(choice) ? "revealed" : null;
}

function partOfSpeechLabel(partOfSpeech: PartOfSpeech, language: Language): string {
  return copy[language].partOfSpeech[partOfSpeech];
}

// The centre column of the challenge workspace: the active drill. Renders
// the current question's prompt + choice grid + action row + post-answer
// feedback, or one of the three terminal states (session exhausted /
// review queue empty / nothing to practise). Pure presentation over the
// practice session's state + handlers; extracted from ChallengePanel with
// no behavioural change. `onExit` returns to the home dashboard from the
// completion / empty screens.
export function DrillPanel({
  language,
  questionIndex,
  sessionTotal,
  selectedChoice,
  feedback,
  attempts,
  practiceMode,
  currentQuestion,
  isRecallQuestion,
  reviewEmpty,
  bookmarksEmpty,
  sessionExhausted,
  choiceOptions,
  correctCount,
  accuracy,
  sessionSeed,
  nextButtonRef,
  setPracticeMode,
  setPracticeFilter,
  handleChoiceSubmit,
  nextQuestion,
  resetSession,
  revealAnswer,
  handleDrillKeyDown,
  isQuestionBookmarked,
  onToggleBookmark,
  onExit,
  onOpenFeedback
}: Pick<
  PracticeSession,
  | "questionIndex"
  | "sessionTotal"
  | "selectedChoice"
  | "feedback"
  | "attempts"
  | "practiceMode"
  | "currentQuestion"
  | "isRecallQuestion"
  | "reviewEmpty"
  | "bookmarksEmpty"
  | "sessionExhausted"
  | "choiceOptions"
  | "correctCount"
  | "accuracy"
  | "sessionSeed"
  | "nextButtonRef"
  | "setPracticeMode"
  | "setPracticeFilter"
  | "handleChoiceSubmit"
  | "nextQuestion"
  | "resetSession"
  | "revealAnswer"
  | "handleDrillKeyDown"
  | "isQuestionBookmarked"
  | "onToggleBookmark"
> & {
  language: Language;
  onExit: () => void;
  // Opens the in-app feedback form (#456) from the completion card, so a
  // learner who just spotted a bad question can report it in context.
  onOpenFeedback?: () => void;
}) {
  const t = copy[language];
  const recallInputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  // #861: one key per step of the loop (a question, or the completion card).
  // Keying the prompt and options by it remounts them on Next, so CSS can
  // play the "turn" in; answering keeps the same key, so nothing replays
  // (or moves) when the verdict lands.
  const stepKey = currentQuestion
    ? `${sessionSeed}:${questionIndex}:${currentQuestion.id}`
    : sessionExhausted
      ? `${sessionSeed}:done`
      : "idle";
  const lastStepRef = useRef(stepKey);

  // Bring a new step into view when the learner would otherwise land
  // mid-page (the previous question's feedback left the page scrolled).
  // Never on first render or when feedback appears -- only on a new step.
  useEffect(() => {
    if (lastStepRef.current === stepKey) return;
    lastStepRef.current = stepKey;
    const panel = panelRef.current;
    if (!panel) return;
    // In view = its top clears the sticky header (the panel's scroll margin).
    const headerClearance = parseFloat(getComputedStyle(panel).scrollMarginTop) || 0;
    if (panel.getBoundingClientRect().top >= headerClearance) return;
    panel.scrollIntoView({ block: "start", behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }, [stepKey]);

  // Once the verdict mark has landed, make sure the start of the explanation
  // is not hidden behind the docked action row: scroll just enough to show it,
  // but never so far that the marked options slide under the header. Only on
  // the answer itself -- not when a page is rendered already answered.
  const lastFeedbackRef = useRef(feedback);
  useEffect(() => {
    const previous = lastFeedbackRef.current;
    lastFeedbackRef.current = feedback;
    if (!feedback || previous) return;
    const reduce = prefersReducedMotion();
    const peek = () => {
      const panel = panelRef.current;
      const explanation = panel?.querySelector<HTMLElement>(".feedback");
      if (!panel || !explanation) return;
      const dock = panel.querySelector<HTMLElement>(".action-row--dock")?.getBoundingClientRect();
      // Docked = the row sits on the viewport's bottom edge (compact widths).
      const visibleBottom = dock && dock.bottom >= window.innerHeight - 1 ? dock.top : window.innerHeight;
      const needed = explanation.getBoundingClientRect().top + FEEDBACK_PEEK_PX - visibleBottom;
      if (needed <= 0) return;
      const marks = Array.from(panel.querySelectorAll<HTMLElement>(".choice-grid button[data-result], .recall-form"));
      const marksTop = Math.min(...marks.map((mark) => mark.getBoundingClientRect().top));
      const headerClearance = parseFloat(getComputedStyle(panel).scrollMarginTop) || 0;
      const room = Number.isFinite(marksTop) ? marksTop - headerClearance : needed;
      const top = Math.round(Math.min(needed, room));
      if (top > 4) window.scrollBy({ top, behavior: reduce ? "auto" : "smooth" });
    };
    const timer = window.setTimeout(peek, reduce ? 0 : FEEDBACK_PEEK_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  const showExplanation = () => {
    const explanation = panelRef.current?.querySelector<HTMLElement>(".feedback");
    if (!explanation) return;
    explanation.scrollIntoView({ block: "start", behavior: prefersReducedMotion() ? "auto" : "smooth" });
    explanation.focus({ preventScroll: true });
  };

  // ジャビ子's mood follows the verdict; a real run of correct answers in this
  // session raises the energy of the reaction (never shown as a number).
  const buddyMood: BuddyMood =
    feedback?.status === "correct" ? "happy" : feedback?.status === "incorrect" ? "oops" : "thinking";
  const verdictTitle =
    feedback?.status === "correct" ? t.correct : feedback?.status === "incorrect" ? t.incorrect : t.revealed;
  const energy = buddyEnergy(trailingCorrect(attempts));

  // Truthful session progress: questions answered out of the pass total.
  const answeredCount = attempts.length;

  useEffect(() => {
    if (isRecallQuestion && currentQuestion && !feedback) {
      recallInputRef.current?.focus({ preventScroll: true });
    }
  }, [currentQuestion, feedback, isRecallQuestion, sessionSeed]);

  // Completion-screen copy: daily / review have their own wording; every
  // other (capped, #154) finite session uses the generic "這組完成" set.
  const wrongCount = attempts.length - correctCount;
  // One copy set per finish flavour (daily / review / generic capped #154);
  // pick once so a new variant is a single map entry, not four-in-lockstep.
  const doneCopy =
    practiceMode === "daily"
      ? { title: t.dailyDoneTitle, body: t.dailyDoneBody, again: t.dailyDoneAgain, exit: t.dailyDoneExit }
      : practiceMode === "review"
        ? { title: t.reviewDoneTitle, body: t.reviewDoneBody, again: t.reviewDoneAgain, exit: t.reviewDoneExit }
        : { title: t.sessionDoneTitle, body: t.sessionDoneBody, again: t.sessionDoneAgain, exit: t.sessionDoneExit };
  const doneTitle = doneCopy.title;
  const doneBody = doneCopy.body(correctCount, wrongCount);
  const doneAgain = doneCopy.again;
  const doneExit = doneCopy.exit;

  // A flawless run earns a badge and ジャビ子's biggest cheer; the cheer scales
  // with the real accuracy of the set (D-10 retired the rotating spot art).
  const isPerfectSession = attempts.length > 0 && wrongCount === 0;
  const doneEnergy = completionEnergy(isPerfectSession, accuracy);

  // Container-level answer state for embedded AI / browser automation:
  // collapse feedback into one result string so .drill-panel exposes the
  // whole state (which question, what was picked, the outcome) in one place
  // without having to scan the option buttons. "unanswered" until answered.
  const drillResult = !feedback
    ? "unanswered"
    : feedback.status === "correct"
      ? "correct"
      : feedback.status === "revealed"
        ? "revealed"
        : "wrong";
  const showDirectExit =
    Boolean(currentQuestion) || (!sessionExhausted && !reviewEmpty && !bookmarksEmpty);

  return (
    <section
      ref={panelRef}
      className="drill-panel"
      aria-label={t.currentQuestion}
      onKeyDown={handleDrillKeyDown}
      data-question-id={currentQuestion?.id}
      data-question-type={currentQuestion?.promptLabel ?? currentQuestion?.targetForm}
      data-selected={selectedChoice ?? undefined}
      data-result={drillResult}
      data-expected-answer={feedback ? currentQuestion?.expectedAnswers.join(" / ") : undefined}
    >
      {showDirectExit ? (
        <button
          className="session-exit"
          type="button"
          onClick={onExit}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <House aria-hidden="true" size={16} />
          {t.home}
        </button>
      ) : null}
      {currentQuestion ? (
        <>
          <div className="prompt-header">
            <span>
              {sessionTotal != null
                ? t.questionProgress(questionIndex + 1, sessionTotal)
                : t.questionNumber(questionIndex + 1)}
            </span>
            <strong>{currentQuestion.promptLabel ?? t.targetForms[currentQuestion.targetForm]}</strong>
            {sessionTotal != null ? (
              // Visual echo of the "n / N" text above, so aria-hidden.
              <span className="session-meter" aria-hidden="true" data-answered={answeredCount}>
                <span
                  className="session-meter-fill"
                  style={{ "--progress": String(Math.min(1, answeredCount / sessionTotal)) } as CSSProperties}
                />
              </span>
            ) : null}
          </div>

          <div className="word-block" key={`word:${stepKey}`}>
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
                  <Ruby
                    text={currentQuestion.vocabulary.surface}
                    plain={isReadingPrompt(currentQuestion.promptLabel, currentQuestion.targetForm)}
                  />
                  <SpeakButton
                    text={currentQuestion.vocabulary.reading}
                    language={language}
                  />
                </p>
                {currentQuestion.targetForm === "meaning" ? null : (
                  <p className="meaning">
                    {pickLocalized(
                      currentQuestion.vocabulary.meaningZh,
                      currentQuestion.vocabulary.meaningI18n,
                      language
                    )}
                  </p>
                )}
              </>
            )}
          </div>

          {isRecallQuestion ? (
            <form
              key={`recall:${stepKey}`}
              className="recall-form"
              onSubmit={(event) => {
                event.preventDefault();
                const answer = new FormData(event.currentTarget).get("recallAnswer");
                if (typeof answer === "string") handleChoiceSubmit(answer);
              }}
            >
              <label htmlFor="recall-answer">{t.recallAnswerLabel}</label>
              <div className="recall-answer-row">
                <input
                  key={`${sessionSeed}:${currentQuestion.id}`}
                  ref={recallInputRef}
                  id="recall-answer"
                  name="recallAnswer"
                  type="text"
                  lang="ja"
                  autoComplete="off"
                  spellCheck={false}
                  placeholder={t.recallAnswerPlaceholder}
                  disabled={Boolean(feedback)}
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" &&
                      (event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229)
                    ) {
                      event.preventDefault();
                    }
                  }}
                />
                <button type="submit" className="next-button" disabled={Boolean(feedback)}>
                  {t.recallSubmit}
                </button>
              </div>
            </form>
          ) : (
          <div className="choice-grid" key={`choices:${stepKey}`} aria-label={t.answerOptions}>
            {choiceOptions.map((choice) => {
              // Expose selection + result as DOM data attributes for AI /
              // browser-automation testability. Derived purely from existing
              // state -- no change to click handling or to choiceOptionClass
              // (the visual styling). Multi-answer aware via expectedAnswers.
              const isSelected = selectedChoice === choice;
              let dataResult: "correct" | "wrong" | "target" | undefined;
              if (feedback) {
                if (isSelected) {
                  dataResult = feedback.status === "correct" ? "correct" : "wrong";
                } else if (
                  feedback.status !== "correct" &&
                  currentQuestion.expectedAnswers.includes(choice)
                ) {
                  // Got it wrong (or revealed) -> flag the correct answer button.
                  dataResult = "target";
                }
              }
              const mark = verdictMarkFor(choice, selectedChoice, feedback, currentQuestion.expectedAnswers);
              return (
                <button
                  key={choice}
                  type="button"
                  className={choiceOptionClass(choice, selectedChoice, feedback)}
                  disabled={Boolean(feedback)}
                  onClick={() => handleChoiceSubmit(choice)}
                  data-selected={isSelected ? "true" : undefined}
                  data-result={dataResult}
                >
                  <Ruby
                    text={choice}
                    plain={
                      currentQuestion.targetForm === "meaning" ||
                      !allowsOptionFurigana(currentQuestion.promptLabel)
                    }
                  />
                  {mark ? <VerdictMark kind={mark} /> : null}
                </button>
              );
            })}
          </div>
          )}

          {/* D-07: the action row sits directly under the options (docked to
              the viewport bottom on compact widths for multiple choice), and
              everything that changes after answering comes AFTER it -- the
              hint disappears and the feedback appears below, so the options
              and Next keep their exact boxes. Typed recall stays in flow so
              the row never fights the software keyboard. */}
          <div className={isRecallQuestion ? "action-row" : "action-row action-row--dock"}>
            {feedback ? (
              // The reveal slot becomes the verdict: ジャビ子 reacts right by
              // the learner's thumb, and the button opens the explanation.
              // Enter here must open it, not skip to the next question.
              <button
                className="verdict-chip"
                type="button"
                data-verdict={drillResult}
                onClick={showExplanation}
                onKeyDown={(event) => event.stopPropagation()}
              >
                <JabikoBuddy mood={buddyMood} energy={energy} />
                <span className="buddy-bubble" lang="ja" aria-hidden="true">
                  {buddyLine(buddyMood, energy)}
                </span>
                <span className="verdict-chip-text">
                  <strong>{verdictTitle}</strong> <small>{t.seeExplanation}</small>
                </span>
                <ChevronDown aria-hidden="true" />
              </button>
            ) : (
              <button className="ghost-button" type="button" onClick={revealAnswer}>
                <Eye aria-hidden="true" />
                {t.revealAnswer}
              </button>
            )}
            <button className="next-button" type="button" ref={nextButtonRef} onClick={nextQuestion}>
              <ArrowRight aria-hidden="true" />
              {t.nextQuestion}
            </button>
          </div>

          {!feedback ? (
            <p className="kbd-hint">{isRecallQuestion ? t.recallKeyboardHint : t.keyboardHint}</p>
          ) : (
            <FeedbackPanel
              feedback={feedback}
              language={language}
              options={choiceOptions}
              bookmarked={isQuestionBookmarked(feedback.question.id)}
              onToggleBookmark={() => onToggleBookmark(feedback.question.id)}
            />
          )}
        </>
      ) : sessionExhausted ? (
        <div className="empty-state review-done session-done">
          <div className="done-buddy-stage">
            <JabikoBuddy mood="cheer" energy={doneEnergy} className="done-buddy" />
            <span className="buddy-bubble" lang="ja" aria-hidden="true">
              {buddyLine("cheer", doneEnergy)}
            </span>
          </div>
          {isPerfectSession ? (
            <span className="done-perfect-badge">{t.donePerfectBadge}</span>
          ) : null}
          <h2>{doneTitle}</h2>
          <dl className="done-stats" aria-label={t.scoreReportLabel}>
            <div className="done-stat">
              <dt>{t.answered}</dt>
              <dd>{attempts.length}</dd>
            </div>
            <div className="done-stat done-stat-correct">
              <dt>{t.correctShort}</dt>
              <dd>{correctCount}</dd>
            </div>
            <div className="done-stat">
              <dt>{t.accuracyShort}</dt>
              <dd>{accuracy}%</dd>
            </div>
          </dl>
          {isPerfectSession ? null : <p>{doneBody}</p>}
          <div className="review-done-actions">
            <button className="next-button" type="button" onClick={resetSession}>
              <RotateCcw aria-hidden="true" />
              {doneAgain}
            </button>
            <button className="ghost-button" type="button" onClick={onExit}>
              {doneExit}
            </button>
          </div>
          <ShareButtons language={language} text={t.shareText(attempts.length, accuracy)} />
          {onOpenFeedback ? (
            <button type="button" className="done-feedback" onClick={onOpenFeedback}>
              <MessageSquare aria-hidden="true" />
              {t.feedbackTitle}
            </button>
          ) : null}
          <p className="done-watermark">jabiko.app</p>
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
            <button className="ghost-button" type="button" onClick={onExit}>
              {t.reviewDoneExit}
            </button>
          </div>
        </div>
      ) : bookmarksEmpty ? (
        <div className="empty-state review-done">
          <TeaCupSpot />
          <p>{t.bookmarksEmptyState}</p>
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
            <button className="ghost-button" type="button" onClick={onExit}>
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
  );
}
