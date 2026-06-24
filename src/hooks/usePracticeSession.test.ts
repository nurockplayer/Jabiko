import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { initialLevelRange, usePracticeSession } from "./usePracticeSession";

const baseHookArgs = {
  language: "zh-Hant" as const,
  progressAttempts: [],
  recordAttempt: () => {}
};

// applyModePreset must keep honouring the global target preference when a
// mode is picked from the in-session picker -- not only on first mount.
// Modes with no explicit range (daily / 単字 / basic …) inherit the
// preference; the exam 備考 cards still pass an explicit range that wins.
describe("usePracticeSession applyModePreset preference (#199)", () => {
  it("re-selecting 今日練習 in the picker keeps the global preference (not reset to 'all')", () => {
    const { result } = renderHook(() =>
      usePracticeSession({ ...baseHookArgs, init: { mode: "daily" }, targetLevel: "n4n5" })
    );
    expect(result.current.levelRange).toBe("n4n5");
    act(() => result.current.applyModePreset("basic"));
    act(() => result.current.applyModePreset("daily"));
    expect(result.current.levelRange).toBe("n4n5");
  });

  it("clamps the preference for 単字 when re-selected (n4n5 has no jlpt vocab -> all)", () => {
    const { result } = renderHook(() =>
      usePracticeSession({ ...baseHookArgs, init: { mode: "basic" }, targetLevel: "n4n5" })
    );
    act(() => result.current.applyModePreset("vocab"));
    expect(result.current.levelRange).toBe("all");
  });

  it("an explicit exam range (備考 cards) still overrides the preference", () => {
    const { result } = renderHook(() =>
      usePracticeSession({ ...baseHookArgs, init: { mode: "basic" }, targetLevel: "n4n5" })
    );
    act(() => result.current.applyModePreset("exam", "n1n2"));
    expect(result.current.levelRange).toBe("n1n2");
  });
});

// The pure seed logic for a session's starting level range (#199): an
// explicit launch request wins; otherwise the global target preference,
// clamped so 単字 never starts on a band its picker can't show.
describe("initialLevelRange (#199)", () => {
  it("uses an explicit init.levelRange over the global preference", () => {
    expect(initialLevelRange({ mode: "exam", levelRange: "n1n2" }, "n4n5")).toBe("n1n2");
  });

  it("falls back to the global target preference when init has none", () => {
    expect(initialLevelRange({ mode: "daily" }, "n4n5")).toBe("n4n5");
    expect(initialLevelRange({ mode: "exam" }, "n2n3")).toBe("n2n3");
  });

  it("defaults to 'all' when there is no preference", () => {
    expect(initialLevelRange(undefined, null)).toBe("all");
    expect(initialLevelRange({ mode: "daily" }, null)).toBe("all");
  });

  it("clamps an n4n5 preference to 'all' for 単字 mode (no n4n5 jlpt vocab)", () => {
    expect(initialLevelRange({ mode: "vocab" }, "n4n5")).toBe("all");
  });

  it("keeps a vocab-valid preference for 単字 mode", () => {
    expect(initialLevelRange({ mode: "vocab" }, "n2n3")).toBe("n2n3");
    expect(initialLevelRange({ mode: "vocab" }, "n1n2")).toBe("n1n2");
  });
});
