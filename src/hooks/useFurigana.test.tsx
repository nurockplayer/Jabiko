import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useFurigana } from "./useFurigana";

const KEY = "jabiko.furigana";

describe("useFurigana", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it("defaults to OFF when nothing is stored (realistic exam condition, #134)", () => {
    const { result } = renderHook(() => useFurigana());
    expect(result.current.enabled).toBe(false);
  });

  it("reads a persisted ON preference on mount", () => {
    localStorage.setItem(KEY, "on");
    const { result } = renderHook(() => useFurigana());
    expect(result.current.enabled).toBe(true);
  });

  it("treats any non-\"on\" stored value as OFF", () => {
    localStorage.setItem(KEY, "off");
    const { result } = renderHook(() => useFurigana());
    expect(result.current.enabled).toBe(false);
  });

  it("enable() turns furigana ON and persists, and is idempotent (#532 starter onboarding)", () => {
    const { result } = renderHook(() => useFurigana());
    expect(result.current.enabled).toBe(false);

    act(() => result.current.enable());
    expect(result.current.enabled).toBe(true);
    expect(localStorage.getItem(KEY)).toBe("on");

    // Calling again keeps it on (no accidental toggle).
    act(() => result.current.enable());
    expect(result.current.enabled).toBe(true);
    expect(localStorage.getItem(KEY)).toBe("on");
  });

  it("toggles and persists the new value", () => {
    const { result } = renderHook(() => useFurigana());

    act(() => result.current.toggle());
    expect(result.current.enabled).toBe(true);
    expect(localStorage.getItem(KEY)).toBe("on");

    act(() => result.current.toggle());
    expect(result.current.enabled).toBe(false);
    expect(localStorage.getItem(KEY)).toBe("off");
  });
});
