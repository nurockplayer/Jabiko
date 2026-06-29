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

// The shipped locale set is zh-Hant / ja / en / th / id.
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

  it("defaults to zh-Hant when no entry in navigator.languages is supported", () => {
    setNavigatorLanguage("fr-FR");
    setNavigatorLanguages(["fr-FR", "de-DE"]);

    const { result } = renderHook(() => useLanguage());

    expect(result.current.language).toBe("zh-Hant");
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

  it("defaults to zh-Hant when nothing is stored and navigator is unrecognised", () => {
    setNavigatorLanguage("de-DE");
    setNavigatorLanguages(["de-DE"]);

    const { result } = renderHook(() => useLanguage());

    expect(result.current.language).toBe("zh-Hant");
  });

  it("defaults to zh-Hant when navigator.language is missing", () => {
    setNavigatorLanguage(undefined);
    setNavigatorLanguages(undefined);

    const { result } = renderHook(() => useLanguage());

    expect(result.current.language).toBe("zh-Hant");
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
});
