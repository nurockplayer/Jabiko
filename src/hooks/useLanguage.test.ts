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
    localStorage.setItem(KEY, "en");
    setNavigatorLanguage("ja-JP");

    const { result } = renderHook(() => useLanguage());

    expect(result.current.language).toBe("en");
  });

  it("ignores an invalid stored value and falls through to detection", () => {
    localStorage.setItem(KEY, "fr"); // not one of the five
    setNavigatorLanguage("th-TH");

    const { result } = renderHook(() => useLanguage());

    expect(result.current.language).toBe("th");
  });

  it.each([
    ["ja-JP", "ja"],
    ["en-US", "en"],
    ["th-TH", "th"],
    ["id-ID", "id"],
    ["zh-Hant-TW", "zh-Hant"]
  ])("detects %s from navigator.language as %s", (navLang, expected) => {
    setNavigatorLanguage(navLang);

    const { result } = renderHook(() => useLanguage());

    expect(result.current.language).toBe(expected);
  });

  it("defaults to zh-Hant when nothing is stored and navigator is unrecognised", () => {
    setNavigatorLanguage("de-DE");

    const { result } = renderHook(() => useLanguage());

    expect(result.current.language).toBe("zh-Hant");
  });

  it("defaults to zh-Hant when navigator.language is missing", () => {
    setNavigatorLanguage(undefined);

    const { result } = renderHook(() => useLanguage());

    expect(result.current.language).toBe("zh-Hant");
  });

  it("sets document.documentElement.lang to the active language", () => {
    setNavigatorLanguage("ja-JP");

    renderHook(() => useLanguage());

    expect(document.documentElement.lang).toBe("ja");
  });

  it("setLanguage updates the value and persists it", () => {
    const { result } = renderHook(() => useLanguage());

    act(() => result.current.setLanguage("th"));

    expect(result.current.language).toBe("th");
    expect(localStorage.getItem(KEY)).toBe("th");
    expect(document.documentElement.lang).toBe("th");
  });
});
