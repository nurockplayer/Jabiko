import { useEffect, useRef } from "react";
import { copy, type Language } from "../i18n";

// First-visit language picker (#313 follow-up). Shown once, when no language
// preference is stored yet (useLanguage.needsLanguageChoice), instead of
// silently committing the auto-detected suggestion. The heading is deliberately
// multilingual -- the visitor hasn't chosen a language yet, so a single-locale
// title would beg the question. Each option is labelled in its own script via
// copy[code].languageName, with lang={code} so the browser can pick the right
// font (matters for Korean / Burmese). The suggested option (the detected /
// ja-fallback guess) is pre-highlighted and focused so Enter commits it.
// Choosing any option commits + dismisses for good; there is intentionally no
// close affordance -- making a choice IS the action.
export function LanguagePicker({
  current,
  options,
  onChoose
}: {
  current: Language;
  options: readonly Language[];
  onChoose: (language: Language) => void;
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

  return (
    <div className="lang-picker-overlay" role="presentation">
      <div
        className="lang-picker"
        role="dialog"
        aria-modal="true"
        aria-label="Choose your language / 選擇語言 / 言語を選択"
      >
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
                {copy[code].languageName}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
