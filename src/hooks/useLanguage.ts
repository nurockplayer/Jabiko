import { useEffect, useState } from "react";
import { readStored, writeStored } from "../domain/safeStorage";
import { LOCALE_CODES } from "../domain/types";
import { LAUNCHED_LANGUAGES, type Language } from "../i18n";

const LANGUAGE_STORAGE_KEY = "jabiko.lang";

// Every selection layer (URL / stored / navigator) gates on the LAUNCHED set:
// a locale whose content isn't translated yet behaves as if it doesn't exist
// (its visitors get the ja fallback), and a preference stored before the
// launch set was narrowed degrades gracefully instead of resurfacing it.
function isSupportedLanguage(value: string | null): value is Language {
  return value !== null && (LAUNCHED_LANGUAGES as readonly string[]).includes(value);
}

// Primary BCP-47 subtag -> locale code, derived from the registry (#434):
// "zh-Hant" -> "zh", "ja" -> "ja", … So a new locale is detectable the moment
// it launches, with no hand-maintained prefix table.
const PRIMARY_SUBTAG_TO_CODE: Record<string, Language> = Object.fromEntries(
  LOCALE_CODES.map((code) => [code.split("-")[0], code])
);

function languageForTag(tag: string | undefined): Language | null {
  if (!tag) return null;
  const primary = tag.toLowerCase().split("-")[0];
  const code = PRIMARY_SUBTAG_TO_CODE[primary];
  // Only launched locales resolve; a gated locale's tag falls through to the
  // ja fallback, so unfinished content is never surfaced by detection.
  return code && isSupportedLanguage(code) ? code : null;
}

function languageFromSearch(search: string): Language | null {
  const raw = new URLSearchParams(search).get("lang");
  if (!raw) return null;
  if (isSupportedLanguage(raw)) return raw;
  return languageForTag(raw);
}

function urlLanguage(): Language | null {
  if (typeof window === "undefined") return null;
  return languageFromSearch(window.location.search);
}

// Best supported match from the browser's preferred languages (navigator),
// in the browser's own priority order. Returns null when none of the
// browser's languages map to one we ship -- callers then fall back to ja.
function navigatorLanguage(): Language | null {
  if (typeof navigator === "undefined") return null;
  const tags =
    navigator.languages && navigator.languages.length > 0
      ? navigator.languages
      : navigator.language
        ? [navigator.language]
        : [];
  for (const tag of tags) {
    const mapped = languageForTag(tag);
    if (mapped) return mapped;
  }
  return null;
}

// Priority: URL ?lang= > stored preference > browser language > ja fallback.
// ja is the deliberate fallback (Japanese-language-school audience) for
// visitors whose browser language we don't ship.
export function getInitialLanguage(): Language {
  const fromUrl = urlLanguage();
  if (fromUrl) return fromUrl;

  const stored = readStored(LANGUAGE_STORAGE_KEY);
  if (isSupportedLanguage(stored)) return stored;

  const fromNavigator = navigatorLanguage();
  if (fromNavigator) return fromNavigator;

  return "ja";
}

function storeLanguage(language: Language) {
  writeStored(LANGUAGE_STORAGE_KEY, language);
}

export function useLanguage() {
  const [language, setLanguageState] = useState<Language>(() => getInitialLanguage());

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    const fromUrl = urlLanguage();
    if (fromUrl) storeLanguage(fromUrl);
  }, []);

  const setLanguage = (next: Language) => {
    setLanguageState(next);
    storeLanguage(next);
  };

  return { language, setLanguage };
}
