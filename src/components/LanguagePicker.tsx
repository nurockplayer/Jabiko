import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { copy, type Language } from "../i18n";
import { LanguageFlag } from "./LanguageFlag";

// Language picker (#313 first-visit + #326 on-demand). The heading is
// deliberately multilingual -- on a first visit the user hasn't chosen a
// language yet, so a single-locale title would beg the question. Each option is
// labelled in its own script via copy[code].languageName, with lang={code} so
// the browser can pick the right font (matters for Korean / Burmese). The
// suggested option (detected / ja-fallback guess, or the current language when
// reopened) is pre-highlighted and focused so Enter commits it.
//
// Two modes:
//  - First visit (no onClose): mandatory -- no close affordance, choosing IS the
//    action.
//  - On demand from the header switcher (onClose given): dismissible via a close
//    button, Escape, or a backdrop click, so the user can back out unchanged.
export function LanguagePicker({
  current,
  options,
  onChoose,
  onClose,
  closeLabel = "Close"
}: {
  current: Language;
  options: readonly Language[];
  onChoose: (language: Language) => void;
  onClose?: () => void;
  closeLabel?: string;
}) {
  const suggestedRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    suggestedRef.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  // Escape closes only in dismissible mode.
  useEffect(() => {
    if (!onClose) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="lang-picker-overlay"
      role="presentation"
      onClick={onClose ? () => onClose() : undefined}
    >
      <div
        className="lang-picker"
        role="dialog"
        aria-modal="true"
        aria-label="Choose your language / 選擇語言 / 言語を選択"
        onClick={(event) => event.stopPropagation()}
      >
        {onClose && (
          <button
            type="button"
            className="lang-picker-close"
            aria-label={closeLabel}
            onClick={onClose}
          >
            <X aria-hidden="true" />
          </button>
        )}
        <div className="lang-picker-head">
          <span className="lang-picker-brand" lang="ja">
            ジャビ子
          </span>
          <p className="lang-picker-title">選擇語言</p>
          <p className="lang-picker-subtitle">Choose your language · 言語を選択</p>
        </div>
        <div className="lang-picker-grid">
          {options.map((code) => {
            const isSuggested = code === current;
            return (
              <button
                key={code}
                type="button"
                ref={isSuggested ? suggestedRef : undefined}
                className={isSuggested ? "lang-picker-option suggested" : "lang-picker-option"}
                aria-current={isSuggested ? "true" : undefined}
                lang={code}
                onClick={() => onChoose(code)}
              >
                <LanguageFlag language={code} className="lang-picker-flag" />
                {copy[code].languageName}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
