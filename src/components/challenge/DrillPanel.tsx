import type { ComponentType } from "react";
import { ArrowRight, Eye, GraduationCap, MessageSquare, RotateCcw } from "lucide-react";
import { copy, type Language } from "../../i18n";
import type { PartOfSpeech } from "../../domain/types";
import {
  DarumaDoneSpot,
  LanternSpot,
  OmamoriSpot,
  PaperNoteSpot,
  SproutSpot,
  TargetSpot,
  TeaCupSpot,
  ToriiSpot
} from "../../illustrations";
import { allowsOptionFurigana, isReadingPrompt } from "../../domain/furigana";
import { pickDoneSpot, type DoneSpotKey } from "../../domain/doneSpot";
import { pickLocalized } from "../../domain/localizedContent";
import { ExamPrompt } from "../ExamPrompt";
import { FeedbackPanel } from "../FeedbackPanel";
import { Ruby } from "../Ruby";
import { ShareButtons } from "./ShareButtons";
import { SpeakButton } from "../SpeakButton";
import type { Feedback } from "../types";
import type { PracticeSession } from "../../hooks/usePracticeSession";

// The completion card's illustration key -> component. Lives here (not in the
// domain) so doneSpot.ts stays JSX-free. "daruma" is the open-eye perfect-run
// spot; the rest rotate for ordinary finishes.
const DONE_SPOTS: Record<DoneSpotKey, ComponentType<{ size?: number; className?: string }>> = {
  daruma: DarumaDoneSpot,
  sprout: SproutSpot,
  omamori: OmamoriSpot,
  lantern: LanternSpot,
  torii: ToriiSpot,
  teacup: TeaCupSpot,
  target: TargetSpot
};

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
  onOpenGrammar,
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
  onOpenGrammar?: (surface: string) => void;
  // Opens the in-app feedback form (#456) from the completion card, so a
  // learner who just spotted a bad question can report it in context.
  onOpenFeedback?: () => void;
}) {
  const t = copy[language];

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

  // A flawless run earns the open-eye daruma + a badge; every other finish
  // rotates a celebratory spot keyed off the session counter, so the picture
  // is stable while the card shows but varies session to session.
  const isPerfectSession = attempts.length > 0 && wrongCount === 0;
  const DoneSpot = DONE_SPOTS[pickDoneSpot(sessionSeed, isPerfectSession)];

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
                  <Ruby
                    text={currentQuestion.vocabulary.surface}
                    plain={isReadingPrompt(currentQuestion.promptLabel, currentQuestion.targetForm)}
                  />
                  <SpeakButton
                    text={currentQuestion.vocabulary.surface}
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
                  <Ruby
                    text={choice}
                    plain={
                      currentQuestion.targetForm === "meaning" ||
                      !allowsOptionFurigana(currentQuestion.promptLabel)
                    }
                  />
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
            <FeedbackPanel
              feedback={feedback}
              language={language}
              options={choiceOptions}
              onOpenGrammar={onOpenGrammar}
              bookmarked={isQuestionBookmarked(feedback.question.id)}
              onToggleBookmark={() => onToggleBookmark(feedback.question.id)}
            />
          ) : null}
        </>
      ) : sessionExhausted ? (
        <div className="empty-state review-done session-done">
          <DoneSpot />
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
