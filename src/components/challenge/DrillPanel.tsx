import { ArrowRight, Eye, GraduationCap, RotateCcw } from "lucide-react";
import { copy, type Language } from "../../i18n";
import type { PartOfSpeech } from "../../domain/types";
import { DarumaSpot, PaperNoteSpot, TeaCupSpot } from "../../illustrations";
import { ExamPrompt } from "../ExamPrompt";
import { FeedbackPanel } from "../FeedbackPanel";
import { SpeakButton } from "../SpeakButton";
import type { Feedback } from "../types";
import type { PracticeSession } from "../../hooks/usePracticeSession";

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
  reviewEmpty,
  sessionExhausted,
  choiceOptions,
  correctCount,
  nextButtonRef,
  setPracticeMode,
  setPracticeFilter,
  handleChoiceSubmit,
  nextQuestion,
  resetSession,
  revealAnswer,
  handleDrillKeyDown,
  onExit
}: Pick<
  PracticeSession,
  | "questionIndex"
  | "sessionTotal"
  | "selectedChoice"
  | "feedback"
  | "attempts"
  | "practiceMode"
  | "currentQuestion"
  | "reviewEmpty"
  | "sessionExhausted"
  | "choiceOptions"
  | "correctCount"
  | "nextButtonRef"
  | "setPracticeMode"
  | "setPracticeFilter"
  | "handleChoiceSubmit"
  | "nextQuestion"
  | "resetSession"
  | "revealAnswer"
  | "handleDrillKeyDown"
> & { language: Language; onExit: () => void }) {
  const t = copy[language];

  // Completion-screen copy: daily / review have their own wording; every
  // other (capped, #154) finite session uses the generic "這組完成" set.
  const wrongCount = attempts.length - correctCount;
  const doneTitle =
    practiceMode === "daily"
      ? t.dailyDoneTitle
      : practiceMode === "review"
        ? t.reviewDoneTitle
        : t.sessionDoneTitle;
  const doneBody =
    practiceMode === "daily"
      ? t.dailyDoneBody(correctCount, wrongCount)
      : practiceMode === "review"
        ? t.reviewDoneBody(correctCount, wrongCount)
        : t.sessionDoneBody(correctCount, wrongCount);
  const doneAgain =
    practiceMode === "daily"
      ? t.dailyDoneAgain
      : practiceMode === "review"
        ? t.reviewDoneAgain
        : t.sessionDoneAgain;
  const doneExit =
    practiceMode === "daily"
      ? t.dailyDoneExit
      : practiceMode === "review"
        ? t.reviewDoneExit
        : t.sessionDoneExit;

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

  return (
    <section
      className="drill-panel"
      aria-label={t.currentQuestion}
      onKeyDown={handleDrillKeyDown}
      data-question-id={currentQuestion?.id}
      data-question-type={currentQuestion?.promptLabel ?? currentQuestion?.targetForm}
      data-selected={selectedChoice ?? undefined}
      data-result={drillResult}
      data-expected-answer={feedback ? currentQuestion?.expectedAnswers.join(" / ") : undefined}
    >
      {currentQuestion ? (
        <>
          <div className="prompt-header">
            <span>
              {sessionTotal != null
                ? t.questionProgress(questionIndex + 1, sessionTotal)
                : t.questionNumber(questionIndex + 1)}
            </span>
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
                  {choice}
                </button>
              );
            })}
          </div>

          {!feedback ? <p className="kbd-hint">{t.keyboardHint}</p> : null}

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

          {feedback ? (
            <FeedbackPanel feedback={feedback} language={language} options={choiceOptions} />
          ) : null}
        </>
      ) : sessionExhausted ? (
        <div className="empty-state review-done">
          <DarumaSpot />
          <h2>{doneTitle}</h2>
          <p>{doneBody}</p>
          <div className="review-done-actions">
            <button className="next-button" type="button" onClick={resetSession}>
              <RotateCcw aria-hidden="true" />
              {doneAgain}
            </button>
            <button className="ghost-button" type="button" onClick={onExit}>
              {doneExit}
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
