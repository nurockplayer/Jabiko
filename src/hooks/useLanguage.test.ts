import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useLanguage } from "./useLanguage";

const KEY = "jabiko.lang";

// Override navigator.language per test. The shared setup (src/test/setup.ts)
// already spies this getter and pins it to "zh-TW"; re-spying here replaces
// that for the current test. vi.restoreAllMocks() in afterEach unwinds it.
function setNavigatorLanguage(value: string | undefined) {
  vi.spyOn(window.navigator, "language", "get").mockReturnValue(value as string);
}

// Override navigator.languages (the ordered preference list) for a test. The
// shared setup pins it to ["zh-TW"]; re-spying replaces it for the current test.
function setNavigatorLanguages(values: readonly string[] | undefined) {
  vi.spyOn(window.navigator, "languages", "get").mockReturnValue(values as readonly string[]);
}

// The shipped locale set is zh-Hant / ja / en / th / id / ko / vi / my.
describe("useLanguage", () => {
  beforeEach(() => {
    localStorage.clear();
    setNavigatorLanguage("zh-TW");
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("lang");
    vi.restoreAllMocks();
  });

  it("uses a valid stored preference over navigator detection", () => {
    localStorage.setItem(KEY, "zh-Hant");
    setNavigatorLanguage("ja-JP");

    const { result } = renderHook(() => useLanguage());

    expect(result.current.language).toBe("zh-Hant");
  });

  it("ignores an invalid stored value and falls through to the default", () => {
    localStorage.setItem(KEY, "fr"); // not a supported locale
    setNavigatorLanguage("th-TH");
    setNavigatorLanguages(["th-TH"]);

    const { result } = renderHook(() => useLanguage());

    expect(result.current.language).toBe("th");
  });

  it.each([
    ["zh-Hant-TW", "zh-Hant"],
    ["zh-TW", "zh-Hant"],
    ["ja-JP", "ja"],
    ["en-US", "en"],
    ["th-TH", "th"],
    ["id-ID", "id"]
  ])("detects %s from navigator.languages as %s", (navLang, expected) => {
    setNavigatorLanguage(navLang);
    setNavigatorLanguages([navLang]);

    const { result } = renderHook(() => useLanguage());

    expect(result.current.language).toBe(expected);
  });

  it("picks id when the primary tag is unsupported but id is listed next", () => {
    setNavigatorLanguage("fr-FR");
    setNavigatorLanguages(["fr-FR", "id-ID"]);

    const { result } = renderHook(() => useLanguage());

    expect(result.current.language).toBe("id");
  });

  it("scans navigator.languages in order, returning the first supported tag", () => {
    // Primary "fr" is unsupported; the next entry "zh-TW" is the first match.
    setNavigatorLanguage("fr-FR");
    setNavigatorLanguages(["fr-FR", "zh-TW"]);

    const { result } = renderHook(() => useLanguage());

    expect(result.current.language).toBe("zh-Hant");
  });

  // Suggestion fallback is ja (a Japanese-learning app): when nothing matches,
  // the language *suggested* in the first-visit picker is Japanese, not zh-Hant.
  it("suggests ja when no entry in navigator.languages is supported", () => {
    setNavigatorLanguage("fr-FR");
    setNavigatorLanguages(["fr-FR", "de-DE"]);

    const { result } = renderHook(() => useLanguage());

    expect(result.current.language).toBe("ja");
  });

  it("falls back to navigator.language when navigator.languages is empty/absent", () => {
    setNavigatorLanguage("zh-TW");
    setNavigatorLanguages(undefined);

    const { result } = renderHook(() => useLanguage());

    expect(result.current.language).toBe("zh-Hant");
  });

  it("a valid stored preference still wins over navigator.languages", () => {
    localStorage.setItem(KEY, "zh-Hant");
    setNavigatorLanguages(["ja-JP", "th-TH"]);

    const { result } = renderHook(() => useLanguage());

    expect(result.current.language).toBe("zh-Hant");
  });

  it("suggests ja when nothing is stored and navigator is unrecognised", () => {
    setNavigatorLanguage("de-DE");
    setNavigatorLanguages(["de-DE"]);

    const { result } = renderHook(() => useLanguage());

    expect(result.current.language).toBe("ja");
  });

  it("suggests ja when navigator.language is missing", () => {
    setNavigatorLanguage(undefined);
    setNavigatorLanguages(undefined);

    const { result } = renderHook(() => useLanguage());

    expect(result.current.language).toBe("ja");
  });

  it("sets document.documentElement.lang to the active language", () => {
    setNavigatorLanguage("zh-TW");
    setNavigatorLanguages(["zh-TW"]);

    renderHook(() => useLanguage());

    expect(document.documentElement.lang).toBe("zh-Hant");
  });

  it("setLanguage updates the value and persists it", () => {
    const { result } = renderHook(() => useLanguage());

    act(() => result.current.setLanguage("zh-Hant"));

    expect(result.current.language).toBe("zh-Hant");
    expect(localStorage.getItem(KEY)).toBe("zh-Hant");
    expect(document.documentElement.lang).toBe("zh-Hant");
  });

  // First-visit language choice: with no stored preference the app shows a
  // language picker; once a choice is stored it never asks again.
  describe("needsLanguageChoice (first-visit picker)", () => {
    it("is true when there is no stored preference", () => {
      setNavigatorLanguage("ja-JP");
      setNavigatorLanguages(["ja-JP"]);

      const { result } = renderHook(() => useLanguage());

      expect(result.current.needsLanguageChoice).toBe(true);
    });

    it("is false when a valid preference is already stored", () => {
      localStorage.setItem(KEY, "ja");

      const { result } = renderHook(() => useLanguage());

      expect(result.current.needsLanguageChoice).toBe(false);
    });

    it("is true when the stored value is invalid (treated as no choice yet)", () => {
      localStorage.setItem(KEY, "fr"); // not a supported locale

      const { result } = renderHook(() => useLanguage());

      expect(result.current.needsLanguageChoice).toBe(true);
    });

    it("clears once the user picks via setLanguage, and persists the choice", () => {
      const { result } = renderHook(() => useLanguage());
      expect(result.current.needsLanguageChoice).toBe(true);

      act(() => result.current.setLanguage("ko"));

      expect(result.current.needsLanguageChoice).toBe(false);
      expect(result.current.language).toBe("ko");
      expect(localStorage.getItem(KEY)).toBe("ko");
    });
  });
});
