import { ArrowRight, BookOpen, Eye, GraduationCap, RotateCcw } from "lucide-react";
import { copy, type Language } from "../i18n";
import type { Attempt, PartOfSpeech, TargetForm, VerbGroup } from "../domain/types";
import { DarumaSpot, PaperNoteSpot, TeaCupSpot } from "../illustrations";
import { ExamPrompt } from "./ExamPrompt";
import { FeedbackPanel } from "./FeedbackPanel";
import { SpeakButton } from "./SpeakButton";
import type { Feedback } from "./types";
import { LEVEL_RANGE_OPTIONS, type LevelRange } from "../domain/levelRange";
import { usePracticeSession, type PracticeMode, type SessionInit } from "../hooks/usePracticeSession";

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

// Mode picker entries. The exam pool is surfaced as three side-by-side
// presets -- 綜合考題庫 (all levels) plus N1 備考 (N1+N2) and N2 備考
// (N2+N3) -- so the備考 ranges are first-class picks rather than a filter
// hidden inside the exam mode. `id` doubles as the i18n / count key.
type ModePresetId = PracticeMode | "examN1" | "examN2";
type ModePreset = { id: ModePresetId; mode: PracticeMode; levelRange?: LevelRange };
const modePresetOrder: ModePreset[] = [
  { id: "daily", mode: "daily" },
  { id: "basic", mode: "basic" },
  { id: "cloze", mode: "cloze" },
  { id: "pattern", mode: "pattern" },
  { id: "exam", mode: "exam", levelRange: "all" },
  { id: "examN1", mode: "exam", levelRange: "n1n2" },
  { id: "examN2", mode: "exam", levelRange: "n2n3" },
  { id: "vocab", mode: "vocab" },
  { id: "review", mode: "review" }
];

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

// The challenge workspace: the three-column practice layout (mode/setup
// controls, the active drill, and the running mistake list). This is the
// lazily-loaded view that owns the practice session -- usePracticeSession
// (and the heavy question-data it imports) only loads when the learner
// enters the challenge. `init` is the launch request (which drill to
// start); `progressAttempts` / `recordAttempt` are the App-owned attempt
// history; `onExit` returns to the home dashboard from the review
// completion / empty screens.
export function ChallengePanel({
  init,
  progressAttempts,
  recordAttempt,
  language,
  onExit
}: {
  init?: SessionInit;
  progressAttempts: Attempt[];
  recordAttempt: (attempt: Attempt) => void;
  language: Language;
  onExit: () => void;
}) {
  const t = copy[language];
  const session = usePracticeSession({ language, init, progressAttempts, recordAttempt });
  const {
    partOfSpeech,
    verbGroup,
    practiceFocus,
    practiceMode,
    levelRange,
    showLevelRange,
    selectedForm,
    questionIndex,
    selectedChoice,
    feedback,
    attempts,
    setVerbGroup,
    setTargetForm,
    setPracticeMode,
    setPracticeFilter,
    compatibleForms,
    isVerbCapable,
    availableFocusOptions,
    focusSummary,
    activeModeCopyKey,
    reviewQueue,
    modeCounts,
    currentQuestion,
    reviewEmpty,
    sessionExhausted,
    choiceOptions,
    mistakeQuestions,
    correctCount,
    accuracy,
    nextButtonRef,
    handlePartOfSpeechChange,
    handlePracticeFocusChange,
    applyModePreset,
    handleLevelRangeChange,
    handleChoiceSubmit,
    nextQuestion,
    resetSession,
    revealAnswer,
    handleDrillKeyDown
  } = session;

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
          {modePresetOrder.map((preset) => {
            const count =
              preset.mode === "review"
                ? reviewQueue.length
                : preset.mode === "basic" || preset.mode === "daily"
                ? null
                : modeCounts[preset.id as keyof typeof modeCounts];
            // The exam presets share one mode; the active one is whichever
            // matches the current level range.
            const selected =
              practiceMode === preset.mode &&
              (preset.mode !== "exam" || (preset.levelRange ?? "all") === levelRange);
            return (
              <button
                key={preset.id}
                type="button"
                className={`mode-card${selected ? " selected" : ""}`}
                aria-pressed={selected}
                onClick={() => applyModePreset(preset.mode, preset.levelRange ?? "all")}
              >
                <strong>{t.modeOptions[preset.id].title}</strong>
                <small>{t.modeOptions[preset.id].subtitle}</small>
                {count !== null ? (
                  <span className="mode-card-count">{t.modeQuestionCount(count)}</span>
                ) : null}
              </button>
            );
          })}
        </div>
      </fieldset>

      {showLevelRange ? (
        <fieldset>
          <legend>{t.levelRange}</legend>
          <div className="segmented">
            {LEVEL_RANGE_OPTIONS.map((range) => (
              <button
                key={range}
                type="button"
                className={levelRange === range ? "selected" : ""}
                aria-pressed={levelRange === range}
                onClick={() => handleLevelRangeChange(range)}
              >
                {t.levelRangeOptions[range]}
              </button>
            ))}
          </div>
        </fieldset>
      ) : null}

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
          <p>{t.modeOptions[activeModeCopyKey].subtitle}</p>
        </div>
      )}

      <p className="focus-summary">{focusSummary}</p>

      <button className="ghost-button" type="button" onClick={resetSession}>
        <RotateCcw aria-hidden="true" />
        {t.resetSession}
      </button>
    </aside>

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
          <h2>{practiceMode === "daily" ? t.dailyDoneTitle : t.reviewDoneTitle}</h2>
          <p>
            {practiceMode === "daily"
              ? t.dailyDoneBody(correctCount, attempts.length - correctCount)
              : t.reviewDoneBody(correctCount, attempts.length - correctCount)}
          </p>
          <div className="review-done-actions">
            <button className="next-button" type="button" onClick={resetSession}>
              <RotateCcw aria-hidden="true" />
              {practiceMode === "daily" ? t.dailyDoneAgain : t.reviewDoneAgain}
            </button>
            <button className="ghost-button" type="button" onClick={onExit}>
              {practiceMode === "daily" ? t.dailyDoneExit : t.reviewDoneExit}
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

    <aside className="review-panel" aria-label={t.mistakesLabel}>
      <div className="score-report" role="group" aria-label="今日戰報">
        <div className="score-strip">
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
        <p className="score-accuracy">
          <span className="score-accuracy-label">{t.accuracyLabel}</span>
          <strong className="score-accuracy-value">{accuracy}%</strong>
        </p>
        <div
          className="score-bar"
          role="progressbar"
          aria-valuenow={accuracy}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={t.accuracyLabel}
        >
          <span className="score-bar-fill" style={{ width: `${accuracy}%` }} />
        </div>
      </div>
      <div className="review-heading">
        <h2>{t.mistakeReview}</h2>
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
  );
}
