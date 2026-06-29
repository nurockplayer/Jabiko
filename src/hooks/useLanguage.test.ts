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

// Priority: URL ?lang= > stored > ja default (no navigator detection).
describe("useLanguage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("lang");
    vi.restoreAllMocks();
  });

  it("uses a valid stored preference as the initial language", () => {
    localStorage.setItem(KEY, "zh-Hant");

    const { result } = renderHook(() => useLanguage());

    expect(result.current.language).toBe("zh-Hant");
  });

  it("ignores an invalid stored value and defaults to ja", () => {
    localStorage.setItem(KEY, "fr");

    const { result } = renderHook(() => useLanguage());

    expect(result.current.language).toBe("ja");
  });

  it("defaults to ja when nothing is stored", () => {
    const { result } = renderHook(() => useLanguage());

    expect(result.current.language).toBe("ja");
  });

  it("sets document.documentElement.lang to the active language", () => {
    localStorage.setItem(KEY, "ja");

    renderHook(() => useLanguage());

    expect(document.documentElement.lang).toBe("ja");
  });

  it("setLanguage updates the value and persists it", () => {
    const { result } = renderHook(() => useLanguage());

    act(() => result.current.setLanguage("ko"));

    expect(result.current.language).toBe("ko");
    expect(localStorage.getItem(KEY)).toBe("ko");
    expect(document.documentElement.lang).toBe("ko");
  });
});

describe("getInitialLanguage with URL param", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("lang");
    vi.restoreAllMocks();
  });

  it("URL ?lang= overrides stored preference", () => {
    localStorage.setItem(KEY, "zh-Hant");
    setLocationSearch("?lang=en");

    expect(getInitialLanguage()).toBe("en");
  });

  it("URL param wins over everything", () => {
    localStorage.setItem(KEY, "zh-Hant");
    setLocationSearch("?lang=id");

    expect(getInitialLanguage()).toBe("id");
  });

  it("accepts a BCP-47 tag and maps it by prefix (?lang=vi-VN -> vi)", () => {
    setLocationSearch("?lang=vi-VN");

    expect(getInitialLanguage()).toBe("vi");
  });

  it("ignores an unsupported ?lang= and falls through to stored", () => {
    localStorage.setItem(KEY, "th");
    setLocationSearch("?lang=fr");

    expect(getInitialLanguage()).toBe("th");
  });

  it("case-insensitive ?lang= matching (JA -> ja)", () => {
    setLocationSearch("?lang=JA");

    expect(getInitialLanguage()).toBe("ja");
  });

  it("no stored + no ?lang= -> ja default", () => {
    setLocationSearch("");

    expect(getInitialLanguage()).toBe("ja");
  });

  it("?lang= with no value falls through to stored", () => {
    localStorage.setItem(KEY, "ja");
    setLocationSearch("?lang=");

    expect(getInitialLanguage()).toBe("ja");
  });
});
