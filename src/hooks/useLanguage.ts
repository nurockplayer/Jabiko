import { useEffect, useState } from "react";
import { readStored, writeStored } from "../domain/safeStorage";
import type { Language } from "../i18n";

const LANGUAGE_STORAGE_KEY = "jabiko.lang";

const SUPPORTED_LANGUAGES: readonly Language[] = ["zh-Hant", "ja", "en", "th", "id", "ko", "vi", "my"];

function isSupportedLanguage(value: string | null): value is Language {
  return value !== null && (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}

// Map a single BCP-47 tag (e.g. "ja-JP", "zh-Hant-TW") to one of our five
// locales by prefix. zh-* always means Traditional Chinese here (the app has
// no Simplified locale). Returns null when the tag matches nothing.
function languageForTag(tag: string | undefined): Language | null {
  if (!tag) return null;
  const lower = tag.toLowerCase();
  if (lower.startsWith("ja")) return "ja";
  if (lower.startsWith("en")) return "en";
  if (lower.startsWith("th")) return "th";
  if (lower.startsWith("id")) return "id";
  if (lower.startsWith("ko")) return "ko";
  if (lower.startsWith("vi")) return "vi";
  if (lower.startsWith("my")) return "my";
  if (lower.startsWith("zh")) return "zh-Hant";
  return null;
}

// Walk the browser's ordered preference list (navigator.languages, falling
// back to the single navigator.language) and return the FIRST tag whose prefix
// maps to a supported locale. This honours a user who keeps an unsupported
// primary (e.g. "fr") but lists a supported secondary (e.g. "en"). Returns null
// when no entry matches, so the caller can apply the zh-Hant default.
function detectFromNavigator(): Language | null {
  if (typeof navigator === "undefined") return null;
  const tags =
    navigator.languages && navigator.languages.length > 0
      ? navigator.languages
      : navigator.language
        ? [navigator.language]
        : [];
  for (const tag of tags) {
    const matched = languageForTag(tag);
    if (matched) return matched;
  }
  return null;
}

// True once the user has a valid stored language preference. Drives the
// first-visit picker: when false, the app prompts for a language instead of
// silently committing the suggestion.
export function hasStoredLanguage(): boolean {
  return isSupportedLanguage(readStored(LANGUAGE_STORAGE_KEY));
}

// The language to start with: a valid stored preference wins; otherwise the
// best navigator match; otherwise Japanese (this is a Japanese-learning app, so
// ja is the sensible default suggestion). On a first visit this value is only a
// *suggestion* — it pre-selects the picker until the user makes a real choice.
export function getInitialLanguage(): Language {
  const stored = readStored(LANGUAGE_STORAGE_KEY);
  if (isSupportedLanguage(stored)) {
    return stored;
  }

  return detectFromNavigator() ?? "ja";
}

function storeLanguage(language: Language) {
  writeStored(LANGUAGE_STORAGE_KEY, language);
}

// Owns the UI language: the initial read (stored preference > navigator
// detection > ja default), the <html lang> side-effect, the persisted setter,
// and whether a first-visit language choice is still pending. Mirrors
// useTheme/useFurigana. The consumer renders the <select>; copy[language]
// re-renders the whole tree when it changes. When needsLanguageChoice is true
// the consumer shows the first-visit picker; setLanguage clears it for good.
export function useLanguage() {
  const [language, setLanguageState] = useState<Language>(() => getInitialLanguage());
  const [needsLanguageChoice, setNeedsLanguageChoice] = useState<boolean>(() => !hasStoredLanguage());

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (next: Language) => {
    setLanguageState(next);
    storeLanguage(next);
    setNeedsLanguageChoice(false);
  };

  return { language, setLanguage, needsLanguageChoice };
}
