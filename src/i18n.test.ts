import { afterEach, describe, expect, it, vi } from "vitest";
import { getInitialLanguage, LANGUAGE_STORAGE_KEY } from "./i18n";

describe("getInitialLanguage", () => {
  afterEach(() => {
    localStorage.clear();
    window.history.replaceState({}, "", "/");
    vi.restoreAllMocks();
  });

  it("uses lang from the URL and stores it for later visits", () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "en");
    window.history.replaceState({}, "", "/?lang=ko");

    expect(getInitialLanguage()).toBe("ko");
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("ko");
  });

  it("falls back to stored preference when the URL has no supported lang", () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "en");
    window.history.replaceState({}, "", "/?lang=fr");

    expect(getInitialLanguage()).toBe("en");
  });

  it("uses browser languages when no URL or stored preference exists", () => {
    vi.spyOn(window.navigator, "languages", "get").mockReturnValue(["ko-KR", "en-US"]);

    expect(getInitialLanguage()).toBe("ko");
  });

  it("maps Traditional Chinese browser locales to zh-Hant", () => {
    vi.spyOn(window.navigator, "languages", "get").mockReturnValue(["zh-TW", "en-US"]);

    expect(getInitialLanguage()).toBe("zh-Hant");
  });

  it("falls back to zh-Hant when no source matches", () => {
    vi.spyOn(window.navigator, "languages", "get").mockReturnValue(["fr-FR"]);

    expect(getInitialLanguage()).toBe("zh-Hant");
  });
});
