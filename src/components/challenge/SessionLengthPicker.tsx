import { copy, type Language } from "../../i18n";
import { SESSION_LENGTH_OPTIONS } from "../../hooks/usePracticeSession";

// The 每組題數 (session length) segmented control (#154). Moved out of the
// left mode/setup column to the top of the right-hand column so it sits high
// and stays visible instead of being pushed below the mode cards (#199
// follow-up). Pure presentation over the session's length state + handler.
export function SessionLengthPicker({
  language,
  sessionLength,
  onChange
}: {
  language: Language;
  sessionLength: number | null;
  onChange: (length: number | null) => void;
}) {
  const t = copy[language];

  // A length that isn't one of the presets (and isn't 全部) is a manual
  // choice -- surface it in the 自訂 field so it stays visible/editable and
  // no preset button lights up.
  const isCustom = sessionLength != null && !SESSION_LENGTH_OPTIONS.includes(sessionLength);

  return (
    <fieldset className="session-length-picker">
      <legend>{t.sessionLength}</legend>
      <div className="segmented">
        {SESSION_LENGTH_OPTIONS.map((option) => {
          const key = option ?? "all";
          const active = sessionLength === option;
          return (
            <button
              key={key}
              type="button"
              className={active ? "selected" : ""}
              aria-pressed={active}
              onClick={() => onChange(option)}
            >
              {option === null ? t.sessionLengthAll : String(option)}
            </button>
          );
        })}
      </div>
      <label className={`session-length-custom${isCustom ? " selected" : ""}`}>
        <span>{t.sessionLengthCustom}</span>
        <input
          type="number"
          min={1}
          max={999}
          inputMode="numeric"
          aria-label={t.sessionLengthCustom}
          placeholder={t.sessionLengthCustomPlaceholder}
          value={isCustom ? sessionLength : ""}
          onChange={(event) => {
            const next = Math.floor(Number(event.target.value));
            if (Number.isFinite(next) && next > 0) onChange(next);
          }}
        />
      </label>
    </fieldset>
  );
}
