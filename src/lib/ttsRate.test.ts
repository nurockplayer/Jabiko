import { afterEach, describe, expect, it } from "vitest";
import {
  TTS_RATE_DEFAULT,
  TTS_RATE_MAX,
  TTS_RATE_MIN,
  TTS_RATE_PRESETS,
  clampTtsRate,
  readTtsRate,
  writeTtsRate
} from "./ttsRate";

afterEach(() => {
  localStorage.clear();
});

describe("clampTtsRate", () => {
  it("keeps an in-range rate unchanged", () => {
    expect(clampTtsRate(0.8)).toBe(0.8);
  });

  it("clamps below the minimum and above the maximum", () => {
    expect(clampTtsRate(0.1)).toBe(TTS_RATE_MIN);
    expect(clampTtsRate(9)).toBe(TTS_RATE_MAX);
  });

  it("falls back to the default for non-finite input", () => {
    expect(clampTtsRate(Number.NaN)).toBe(TTS_RATE_DEFAULT);
    expect(clampTtsRate(Number.POSITIVE_INFINITY)).toBe(TTS_RATE_DEFAULT);
  });
});

describe("readTtsRate / writeTtsRate", () => {
  it("defaults to TTS_RATE_DEFAULT when nothing is stored", () => {
    expect(readTtsRate()).toBe(TTS_RATE_DEFAULT);
  });

  it("round-trips a written in-range rate", () => {
    writeTtsRate(0.7);
    expect(readTtsRate()).toBe(0.7);
  });

  it("clamps an out-of-range written rate on the way in", () => {
    writeTtsRate(5);
    expect(readTtsRate()).toBe(TTS_RATE_MAX);
  });

  it("falls back to the default when the stored value is not a number", () => {
    localStorage.setItem("jabiko.ttsRate", "not-a-number");
    expect(readTtsRate()).toBe(TTS_RATE_DEFAULT);
  });

  it("falls back to the default (not the minimum) for an empty stored value", () => {
    localStorage.setItem("jabiko.ttsRate", "");
    expect(readTtsRate()).toBe(TTS_RATE_DEFAULT);
    localStorage.setItem("jabiko.ttsRate", "   ");
    expect(readTtsRate()).toBe(TTS_RATE_DEFAULT);
  });
});

describe("TTS_RATE_PRESETS", () => {
  it("includes a normal preset equal to the default (no change for existing users)", () => {
    expect(TTS_RATE_PRESETS.some((preset) => preset.rate === TTS_RATE_DEFAULT)).toBe(true);
  });

  it("offers at least one slower-than-default option (the point of #527)", () => {
    expect(TTS_RATE_PRESETS.some((preset) => preset.rate < TTS_RATE_DEFAULT)).toBe(true);
  });

  it("keeps every preset within the clamp range", () => {
    for (const preset of TTS_RATE_PRESETS) {
      expect(preset.rate).toBeGreaterThanOrEqual(TTS_RATE_MIN);
      expect(preset.rate).toBeLessThanOrEqual(TTS_RATE_MAX);
    }
  });
});
