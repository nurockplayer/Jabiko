import { RotateCcw } from "lucide-react";
import { copy, type Language } from "../../i18n";
import { JabikoMark } from "../JabikoMark";
import type { PartOfSpeech, TargetForm, VerbGroup } from "../../domain/types";
import { VOCAB_LEVEL_RANGE_OPTIONS, type LevelRange } from "../../domain/levelRange";
import {
  EXAM_PRESET_BY_RANGE,
  type ExamPresetId,
  type ModeCopyKey,
  type PracticeMode
} from "../../domain/practiceMode";
import { type PracticeSession } from "../../hooks/usePracticeSession";

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

// Mode picker entries. The exam pool is surfaced as several side-by-side
// presets -- 綜合考題庫 (all levels) plus the 備考 bands -- so the ranges are
// first-class picks rather than a filter hidden inside the exam mode. `id`
// doubles as the i18n / count key (ModeCopyKey). The 備考 rows are generated
// from the single EXAM_PRESET_BY_RANGE table, so adding a band is one edit there.
type ModePreset = { id: ModeCopyKey; mode: PracticeMode; levelRange?: LevelRange };
const examPresetRows: ModePreset[] = (
  Object.entries(EXAM_PRESET_BY_RANGE) as [LevelRange, ExamPresetId][]
).map(([levelRange, id]) => ({ id, mode: "exam", levelRange }));
const modePresetOrder: ModePreset[] = [
  { id: "daily", mode: "daily" },
  { id: "basic", mode: "basic" },
  { id: "cloze", mode: "cloze" },
  { id: "pattern", mode: "pattern" },
  { id: "exam", mode: "exam", levelRange: "all" },
  ...examPresetRows,
  { id: "vocab", mode: "vocab" },
  { id: "review", mode: "review" }
];

// The left-hand controls column of the challenge workspace: the mode /
// 備考 preset picker, the (vocab-only) level-range segmented control, the
// basic-mode setup controls (word type / focus / verb group / target
// form), the focus summary line, and the reset button. Pure presentation
// over the practice session's state + handlers; extracted from
// ChallengePanel with no behavioural change.
export function ModePicker({
  language,
  partOfSpeech,
  verbGroup,
  practiceFocus,
  practiceMode,
  levelRange,
  showLevelRange,
  selectedForm,
  setVerbGroup,
  setTargetForm,
  compatibleForms,
  isVerbCapable,
  availableFocusOptions,
  focusSummary,
  reviewQueue,
  modeCounts,
  handlePartOfSpeechChange,
  handlePracticeFocusChange,
  applyModePreset,
  handleLevelRangeChange,
  resetSession
}: Pick<
  PracticeSession,
  | "partOfSpeech"
  | "verbGroup"
  | "practiceFocus"
  | "practiceMode"
  | "levelRange"
  | "showLevelRange"
  | "selectedForm"
  | "setVerbGroup"
  | "setTargetForm"
  | "compatibleForms"
  | "isVerbCapable"
  | "availableFocusOptions"
  | "focusSummary"
  | "reviewQueue"
  | "modeCounts"
  | "handlePartOfSpeechChange"
  | "handlePracticeFocusChange"
  | "applyModePreset"
  | "handleLevelRangeChange"
  | "resetSession"
> & { language: Language }) {
  const t = copy[language];

  return (
    <aside className="controls-panel" aria-label={t.settingsLabel}>
      <div className="brand-lockup">
        <JabikoMark />
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
                onClick={() => applyModePreset(preset.mode, preset.levelRange)}
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
            {VOCAB_LEVEL_RANGE_OPTIONS.map((range) => (
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
      ) : null}

      {/* Non-basic modes: the focus-summary line below already shows the active
          mode's subtitle (focusSummary falls back to it), so a separate
          mode-description block would duplicate it (#358). */}
      <p className="focus-summary">{focusSummary}</p>

      <button className="ghost-button" type="button" onClick={resetSession}>
        <RotateCcw aria-hidden="true" />
        {t.resetSession}
      </button>
    </aside>
  );
}
