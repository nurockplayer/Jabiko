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
    </fieldset>
  );
}
