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

// Parse ?lang=<code> from a location search string (#326). Accepts an exact
// supported locale ("ja", "zh-Hant") or a BCP-47 tag whose prefix maps to one
// ("vi-VN" -> vi). Returns null when the param is absent or unrecognised. Lets
// a deep link / marketing URL force a language regardless of stored preference
// or browser detection.
export function languageFromSearch(search: string): Language | null {
  const raw = new URLSearchParams(search).get("lang");
  if (!raw) return null;
  if (isSupportedLanguage(raw)) return raw;
  return languageForTag(raw);
}

function urlLanguage(): Language | null {
  if (typeof window === "undefined") return null;
  return languageFromSearch(window.location.search);
}

// The language to start with. Priority (#326): URL ?lang= override > a valid
// stored preference > the best navigator match > Japanese (this is a
// Japanese-learning app, so ja is the sensible default). On a first visit with
// no URL override this value is only a *suggestion* — it pre-selects the picker
// until the user makes a real choice.
export function getInitialLanguage(): Language {
  const fromUrl = urlLanguage();
  if (fromUrl) {
    return fromUrl;
  }

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
  // A ?lang= override counts as an explicit choice: skip the first-visit picker.
  const [needsLanguageChoice, setNeedsLanguageChoice] = useState<boolean>(
    () => urlLanguage() === null && !hasStoredLanguage()
  );

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  // Persist a ?lang= deep-link choice so it sticks on the next visit (and so the
  // picker stays dismissed). Runs once on mount; the param itself stays in the
  // URL untouched.
  useEffect(() => {
    const fromUrl = urlLanguage();
    if (fromUrl) {
      storeLanguage(fromUrl);
    }
  }, []);

  const setLanguage = (next: Language) => {
    setLanguageState(next);
    storeLanguage(next);
    setNeedsLanguageChoice(false);
  };

  return { language, setLanguage, needsLanguageChoice };
}
