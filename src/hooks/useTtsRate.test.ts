import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useTtsRate } from "./useTtsRate";
import { TTS_RATE_DEFAULT, TTS_RATE_MAX } from "../lib/ttsRate";

const KEY = "jabiko.ttsRate";

describe("useTtsRate", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it("defaults to TTS_RATE_DEFAULT when nothing is stored", () => {
    const { result } = renderHook(() => useTtsRate());
    expect(result.current.rate).toBe(TTS_RATE_DEFAULT);
  });

  it("reads a persisted rate on mount", () => {
    localStorage.setItem(KEY, "0.7");
    const { result } = renderHook(() => useTtsRate());
    expect(result.current.rate).toBe(0.7);
  });

  it("setRate persists and reflects the new rate", () => {
    const { result } = renderHook(() => useTtsRate());

    act(() => result.current.setRate(0.5));
    expect(result.current.rate).toBe(0.5);
    expect(localStorage.getItem(KEY)).toBe("0.5");
  });

  it("setRate clamps an out-of-range value in BOTH the state and storage", () => {
    const { result } = renderHook(() => useTtsRate());

    act(() => result.current.setRate(3));
    expect(result.current.rate).toBe(TTS_RATE_MAX);
    expect(localStorage.getItem(KEY)).toBe(String(TTS_RATE_MAX));
  });
});
