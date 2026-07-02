import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getInitialLanguage, useLanguage } from "./useLanguage";

const KEY = "jabiko.lang";

function setLocationSearch(search: string) {
  vi.stubGlobal("location", {
    ...window.location,
    search,
  });
  window.location.search = search;
}

// Override navigator.languages / navigator.language (getters on the prototype)
// with own shadowing properties, so browser-language detection can be exercised
// deterministically. Cleaned up in afterEach.
function setBrowserLanguages(languages: string[]) {
  Object.defineProperty(window.navigator, "languages", { configurable: true, get: () => languages });
  Object.defineProperty(window.navigator, "language", { configurable: true, get: () => languages[0] });
}

function resetBrowserLanguages() {
  Reflect.deleteProperty(window.navigator, "languages");
  Reflect.deleteProperty(window.navigator, "language");
}

// Priority: URL ?lang= > stored > browser language (navigator) > ja fallback.
// Only the LAUNCHED languages (zh-Hant / ja / en) are selectable anywhere;
// locales whose CONTENT isn't translated yet (th/id/ko/vi/my) are ignored at
// every layer until they ship, so their visitors get the ja fallback instead
// of a UI-only translation over Chinese content.
describe("useLanguage", () => {
  beforeEach(() => {
    localStorage.clear();
    // Default to an unsupported browser language so, unless a test opts in,
    // detection falls through to the ja fallback.
    setBrowserLanguages(["fr-FR"]);
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("lang");
    resetBrowserLanguages();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("uses a valid stored preference as the initial language", () => {
    localStorage.setItem(KEY, "zh-Hant");

    const { result } = renderHook(() => useLanguage());

    expect(result.current.language).toBe("zh-Hant");
  });

  it("ignores an invalid stored value and falls back to ja (browser unsupported)", () => {
    localStorage.setItem(KEY, "fr");

    const { result } = renderHook(() => useLanguage());

    expect(result.current.language).toBe("ja");
  });

  it("ignores a stored NOT-YET-LAUNCHED locale and falls back to ja", () => {
    // e.g. a preference stored before the launch set was narrowed.
    localStorage.setItem(KEY, "ko");

    const { result } = renderHook(() => useLanguage());

    expect(result.current.language).toBe("ja");
  });

  it("falls back to ja when nothing is stored and the browser language is unsupported", () => {
    const { result } = renderHook(() => useLanguage());

    expect(result.current.language).toBe("ja");
  });

  it("detects the browser language when nothing is stored (zh-TW -> zh-Hant)", () => {
    setBrowserLanguages(["zh-TW"]);

    const { result } = renderHook(() => useLanguage());

    expect(result.current.language).toBe("zh-Hant");
  });

  it("sets document.documentElement.lang to the active language", () => {
    localStorage.setItem(KEY, "ja");

    renderHook(() => useLanguage());

    expect(document.documentElement.lang).toBe("ja");
  });

  it("setLanguage updates the value and persists it", () => {
    const { result } = renderHook(() => useLanguage());

    act(() => result.current.setLanguage("en"));

    expect(result.current.language).toBe("en");
    expect(localStorage.getItem(KEY)).toBe("en");
    expect(document.documentElement.lang).toBe("en");
  });
});

describe("getInitialLanguage priority", () => {
  beforeEach(() => {
    localStorage.clear();
    setBrowserLanguages(["fr-FR"]); // unsupported by default
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("lang");
    resetBrowserLanguages();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("URL ?lang= overrides stored preference", () => {
    localStorage.setItem(KEY, "zh-Hant");
    setLocationSearch("?lang=en");

    expect(getInitialLanguage()).toBe("en");
  });

  it("URL param wins over stored and browser language", () => {
    localStorage.setItem(KEY, "zh-Hant");
    setBrowserLanguages(["ja"]);
    setLocationSearch("?lang=en");

    expect(getInitialLanguage()).toBe("en");
  });

  it("ignores a NOT-YET-LAUNCHED ?lang= and falls through to stored (?lang=id)", () => {
    localStorage.setItem(KEY, "zh-Hant");
    setLocationSearch("?lang=id");

    expect(getInitialLanguage()).toBe("zh-Hant");
  });

  it("accepts a BCP-47 tag and maps it by prefix (?lang=en-US -> en)", () => {
    setLocationSearch("?lang=en-US");

    expect(getInitialLanguage()).toBe("en");
  });

  it("ignores an unsupported ?lang= and falls through to stored", () => {
    localStorage.setItem(KEY, "zh-Hant");
    setLocationSearch("?lang=fr");

    expect(getInitialLanguage()).toBe("zh-Hant");
  });

  it("case-insensitive ?lang= matching (JA -> ja)", () => {
    setLocationSearch("?lang=JA");

    expect(getInitialLanguage()).toBe("ja");
  });

  it("no stored + no ?lang= + unsupported browser -> ja fallback", () => {
    setLocationSearch("");

    expect(getInitialLanguage()).toBe("ja");
  });

  it("?lang= with no value falls through to stored", () => {
    localStorage.setItem(KEY, "ja");
    setLocationSearch("?lang=");

    expect(getInitialLanguage()).toBe("ja");
  });

  // ---- Browser-language detection (navigator layer) ----

  it("detects a launched browser language when nothing is stored (en-US -> en)", () => {
    setLocationSearch("");
    setBrowserLanguages(["en-US"]);

    expect(getInitialLanguage()).toBe("en");
  });

  it("a NOT-YET-LAUNCHED browser language gets the ja fallback (ko-KR -> ja)", () => {
    setLocationSearch("");
    setBrowserLanguages(["ko-KR"]);

    expect(getInitialLanguage()).toBe("ja");
  });

  it("picks the first LAUNCHED entry from navigator.languages", () => {
    setLocationSearch("");
    // fr/de unsupported, ko not launched -> en is the first usable entry.
    setBrowserLanguages(["fr-FR", "de", "ko", "en"]);

    expect(getInitialLanguage()).toBe("en");
  });

  it("maps zh variants to zh-Hant (zh-CN -> zh-Hant)", () => {
    setLocationSearch("");
    setBrowserLanguages(["zh-CN"]);

    expect(getInitialLanguage()).toBe("zh-Hant");
  });

  it("stored preference wins over the browser language", () => {
    localStorage.setItem(KEY, "zh-Hant");
    setLocationSearch("");
    setBrowserLanguages(["ja"]);

    expect(getInitialLanguage()).toBe("zh-Hant");
  });

  it("falls back to ja when the browser language is unsupported (fr -> ja)", () => {
    setLocationSearch("");
    setBrowserLanguages(["fr-FR"]);

    expect(getInitialLanguage()).toBe("ja");
  });
});
