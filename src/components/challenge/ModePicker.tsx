import { RotateCcw } from "lucide-react";
import { copy, type Language } from "../../i18n";
import { JabikoMark } from "../JabikoMark";
import type { JlptLevel, PartOfSpeech, TargetForm, VerbGroup } from "../../domain/types";
import { VOCAB_LEVEL_RANGE_OPTIONS } from "../../domain/levelRange";
import { MODE_GROUPS } from "../../domain/practiceMode";
import { type PracticeSession } from "../../hooks/usePracticeSession";

const partOfSpeechOptions: Array<PartOfSpeech | "mixed"> = ["verb", "i_adjective", "na_adjective", "noun", "mixed"];

const jlptLevelOptions: JlptLevel[] = ["N1", "N2", "N3", "N4", "N5"];

const verbGroupOptions: VerbGroup[] = ["godan", "ichidan", "irregular"];

function toggleSelection<T>(options: readonly T[], selected: T[] | undefined, value: T): T[] {
  if (selected === undefined) return [value];
  const next = new Set(selected);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return options.filter((option) => next.has(option));
}

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

// The left-hand controls column of the challenge workspace: the mode /
// 備考 preset picker, the (vocab-only) level-range segmented control, the
// basic-mode setup controls (word type / focus / verb group / target
// form), the focus summary line, and the reset button. Pure presentation
// over the practice session's state + handlers; extracted from
// ChallengePanel with no behavioural change.
export function ModePicker({
  language,
  partOfSpeech,
  practiceFilter,
  practiceFocus,
  practiceMode,
  levelRange,
  showLevelRange,
  selectedForm,
  setTargetForm,
  compatibleForms,
  isVerbCapable,
  availableFocusOptions,
  focusSummary,
  reviewQueue,
  bookmarkedQuestions,
  modeCounts,
  handlePartOfSpeechChange,
  handlePracticeFocusChange,
  handlePracticeFilterChange,
  applyModePreset,
  handleLevelRangeChange,
  resetSession
}: Pick<
  PracticeSession,
  | "partOfSpeech"
  | "practiceFilter"
  | "practiceFocus"
  | "practiceMode"
  | "levelRange"
  | "showLevelRange"
  | "selectedForm"
  | "setTargetForm"
  | "compatibleForms"
  | "isVerbCapable"
  | "availableFocusOptions"
  | "focusSummary"
  | "reviewQueue"
  | "bookmarkedQuestions"
  | "modeCounts"
  | "handlePartOfSpeechChange"
  | "handlePracticeFocusChange"
  | "handlePracticeFilterChange"
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
        {MODE_GROUPS.map((group) => (
          <div key={group.id} className="mode-group" role="group" aria-label={t.modeGroups[group.id]}>
            <p className="mode-group-label">{t.modeGroups[group.id]}</p>
            <div className="mode-toggle">
              {group.presets.map((preset) => {
                const count =
                  preset.mode === "review"
                    ? reviewQueue.length
                    : preset.mode === "bookmarks"
                    ? bookmarkedQuestions.length
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
          </div>
        ))}
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

          <fieldset>
            <legend>{t.levelRange}</legend>
            <div className="segmented level-segmented">
              <button
                type="button"
                className={practiceFilter.levels === undefined ? "selected" : ""}
                aria-pressed={practiceFilter.levels === undefined}
                onClick={() =>
                  handlePracticeFilterChange({ ...practiceFilter, levels: undefined })
                }
              >
                {t.levelRangeOptions.all}
              </button>
              {jlptLevelOptions.map((level) => {
                const selected = practiceFilter.levels?.includes(level) ?? false;
                return (
                  <button
                    key={level}
                    type="button"
                    className={selected ? "selected" : ""}
                    aria-pressed={selected}
                    onClick={() =>
                      handlePracticeFilterChange({
                        ...practiceFilter,
                        levels: toggleSelection(jlptLevelOptions, practiceFilter.levels, level)
                      })
                    }
                  >
                    {level}
                  </button>
                );
              })}
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
              <div className="segmented level-segmented">
                <button
                  type="button"
                  className={practiceFilter.verbGroups === undefined ? "selected" : ""}
                  aria-pressed={practiceFilter.verbGroups === undefined}
                  onClick={() =>
                    handlePracticeFilterChange({ ...practiceFilter, verbGroups: undefined })
                  }
                >
                  {t.verbGroups.all}
                </button>
                {verbGroupOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={practiceFilter.verbGroups?.includes(option) ? "selected" : ""}
                    aria-pressed={practiceFilter.verbGroups?.includes(option) ?? false}
                    onClick={() =>
                      handlePracticeFilterChange({
                        ...practiceFilter,
                        verbGroups: toggleSelection(
                          verbGroupOptions,
                          practiceFilter.verbGroups,
                          option
                        )
                      })
                    }
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
