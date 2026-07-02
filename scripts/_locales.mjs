// Runtime locale registry for the .mjs scripts.
//
// The TS source of truth is `LOCALE_CODES` in src/domain/types.ts (an
// `as const` tuple so the LocaleCode union derives from it). Node scripts
// can't import a .ts at runtime, so we read that one array back out here.
// `src/domain/locales.test.ts` asserts this parse equals the real array, so a
// reformat or drift breaks CI rather than silently desyncing.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const TYPES_PATH = join(HERE, "..", "src", "domain", "types.ts");

function parseLocaleCodes() {
  const src = readFileSync(TYPES_PATH, "utf8");
  const match = src.match(/LOCALE_CODES\s*=\s*\[([^\]]+)\]\s*as const/);
  if (!match) {
    throw new Error("could not find `LOCALE_CODES = [...] as const` in src/domain/types.ts");
  }
  const codes = [...match[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  if (codes.length === 0) {
    throw new Error("parsed an empty LOCALE_CODES array from src/domain/types.ts");
  }
  return codes;
}

/** Every locale code, in the order declared in types.ts. */
export const LOCALE_CODES = parseLocaleCodes();

/** The zh-Hant source locale (content is authored here). */
export const SOURCE_LOCALE = "zh-Hant";

/** Han-script locales — Han residue in these is NOT an untranslated signal. */
export const HAN_LOCALES = new Set([SOURCE_LOCALE, "ja"]);

/** Translation targets: everything except the source. */
export const TARGET_LOCALES = LOCALE_CODES.filter((code) => code !== SOURCE_LOCALE);

/**
 * Locales whose values should contain NO Han ideographs, so leftover Han flags
 * an untranslated string. Everything except the two Han-script locales
 * (zh-Hant source + ja). Derived, so ko/my are covered automatically.
 */
export const NON_HAN_LOCALES = new Set(LOCALE_CODES.filter((code) => !HAN_LOCALES.has(code)));

/** Human-readable language names, for translation prompts. */
export const LOCALE_NAME = {
  "zh-Hant": "Traditional Chinese",
  ja: "Japanese",
  en: "English",
  th: "Thai",
  id: "Indonesian",
  ko: "Korean",
  vi: "Vietnamese",
  my: "Burmese"
};
