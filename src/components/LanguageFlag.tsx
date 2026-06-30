import type { Language } from "../i18n";
import twFlag from "flag-icons/flags/4x3/tw.svg";
import jpFlag from "flag-icons/flags/4x3/jp.svg";
import gbFlag from "flag-icons/flags/4x3/gb.svg";
import thFlag from "flag-icons/flags/4x3/th.svg";
import idFlag from "flag-icons/flags/4x3/id.svg";
import krFlag from "flag-icons/flags/4x3/kr.svg";
import vnFlag from "flag-icons/flags/4x3/vn.svg";
import mmFlag from "flag-icons/flags/4x3/mm.svg";

// Per-language flag (SVG, cross-platform — emoji flags don't render on Windows).
// zh-Hant -> Taiwan, en -> United Kingdom; the rest map to their language's
// home country. Decorative: alt="" + aria-hidden, the language name carries the
// accessible label.
const FLAG_SRC: Record<Language, string> = {
  "zh-Hant": twFlag,
  ja: jpFlag,
  en: gbFlag,
  th: thFlag,
  id: idFlag,
  ko: krFlag,
  vi: vnFlag,
  my: mmFlag,
};

export function LanguageFlag({ language, className }: { language: Language; className?: string }) {
  return (
    <img
      src={FLAG_SRC[language]}
      alt=""
      aria-hidden="true"
      className={className ? `lang-flag ${className}` : "lang-flag"}
    />
  );
}
