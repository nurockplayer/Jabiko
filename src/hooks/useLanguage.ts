import { useEffect, useState } from "react";
import { readStored, writeStored } from "../domain/safeStorage";
import type { Language } from "../i18n";

const LANGUAGE_STORAGE_KEY = "jabiko.lang";

const SUPPORTED_LANGUAGES: readonly Language[] = ["zh-Hant", "ja", "en", "th", "id", "ko", "vi", "my"];

function isSupportedLanguage(value: string | null): value is Language {
  return value !== null && (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}

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
