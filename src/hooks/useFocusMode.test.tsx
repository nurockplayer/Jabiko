// useFocusMode tests (#771). Deterministic clocks via vi fake timers; the
// module-level focus store is reset per test through localStorage.clear()
// (jsdom has a real localStorage, and reads prefer storage over the in-memory
// fallback).
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useFocusMode } from "./useFocusMode";
import { MS_PER_MINUTE, defaultFocusConfig } from "../domain/focus";

const FOCUS_MS = 25 * MS_PER_MINUTE;
const BREAK_MS = 5 * MS_PER_MINUTE;

function setDocumentHidden(hidden: boolean) {
  Object.defineProperty(document, "hidden", { configurable: true, value: hidden });
}

describe("useFocusMode", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    setDocumentHidden(false);
    vi.useRealTimers();
  });

  it("starts idle with no active session", () => {
    const { result } = renderHook(() => useFocusMode({ locale: "zh-Hant" }));
    expect(result.current.state.session).toBeNull();
    expect(result.current.remainingMs).toBe(0);
  });

  it("starts a focus session with the configured remaining time", () => {
    const { result } = renderHook(() => useFocusMode({ locale: "zh-Hant" }));
    act(() => {
      result.current.start(defaultFocusConfig(), { answered: 0, correct: 0 });
    });
    expect(result.current.state.session!.phase).toBe("focus");
    expect(result.current.remainingMs).toBe(FOCUS_MS);
  });

  it("counts down from the absolute deadline on each tick", () => {
    const { result } = renderHook(() => useFocusMode({ locale: "zh-Hant" }));
    act(() => {
      result.current.start(defaultFocusConfig(), { answered: 0, correct: 0 });
    });
    act(() => {
      vi.advanceTimersByTime(3 * MS_PER_MINUTE);
    });
    expect(result.current.remainingMs).toBe(22 * MS_PER_MINUTE);
  });

  it("transitions to break once when the focus deadline passes", () => {
    const { result } = renderHook(() => useFocusMode({ locale: "zh-Hant" }));
    act(() => {
      result.current.start(defaultFocusConfig(), { answered: 0, correct: 0 });
    });
    act(() => {
      vi.advanceTimersByTime(FOCUS_MS);
    });
    expect(result.current.state.session!.phase).toBe("break");
    expect(result.current.remainingMs).toBe(BREAK_MS);
    // Extra ticks after expiry do not re-fire the transition.
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(result.current.state.session!.phase).toBe("break");
    expect(result.current.state.session!.breakDone).toBe(false);
  });

  it("does not drift when the tab is hidden (ticks paused) and reconciles on return", () => {
    const { result } = renderHook(() => useFocusMode({ locale: "zh-Hant" }));
    act(() => {
      result.current.start(defaultFocusConfig(), { answered: 0, correct: 0 });
    });

    // Hide the tab; time passes well past the focus deadline while hidden.
    setDocumentHidden(true);
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    act(() => {
      vi.advanceTimersByTime(FOCUS_MS + 2 * MS_PER_MINUTE);
    });
    // Ticks are paused while hidden -- the session stays in focus phase.
    expect(result.current.state.session!.phase).toBe("focus");

    // Coming back reconciles the expiry into the break without restarting the clock.
    setDocumentHidden(false);
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(result.current.state.session!.phase).toBe("break");
    expect(result.current.remainingMs).toBe(BREAK_MS - 2 * MS_PER_MINUTE);
  });

  it("marks a break done once its deadline passes, staying done", () => {
    const { result } = renderHook(() => useFocusMode({ locale: "zh-Hant" }));
    act(() => {
      result.current.start(defaultFocusConfig(), { answered: 0, correct: 0 });
    });
    act(() => {
      vi.advanceTimersByTime(FOCUS_MS + BREAK_MS);
    });
    expect(result.current.state.session!.phase).toBe("break");
    expect(result.current.state.session!.breakDone).toBe(true);
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(result.current.state.session!.breakDone).toBe(true);
  });

  it("skipBreak starts the next focus cycle", () => {
    const { result } = renderHook(() => useFocusMode({ locale: "zh-Hant" }));
    act(() => {
      result.current.start(defaultFocusConfig(), { answered: 0, correct: 0 });
    });
    act(() => {
      vi.advanceTimersByTime(FOCUS_MS);
    });
    act(() => {
      result.current.skipBreak({ answered: 5, correct: 5 });
    });
    expect(result.current.state.session!.phase).toBe("focus");
    expect(result.current.state.session!.cycle).toBe(2);
    expect(result.current.remainingMs).toBe(FOCUS_MS);
  });

  it("end clears the active session", () => {
    const { result } = renderHook(() => useFocusMode({ locale: "zh-Hant" }));
    act(() => {
      result.current.start(defaultFocusConfig(), { answered: 0, correct: 0 });
    });
    act(() => {
      result.current.end();
    });
    expect(result.current.state.session).toBeNull();
    expect(result.current.remainingMs).toBe(0);
  });

  it("recovers an active session on remount (reload semantics)", () => {
    const first = renderHook(() => useFocusMode({ locale: "zh-Hant" }));
    act(() => {
      first.result.current.start({ focusMinutes: 30, breakMinutes: 5 }, { answered: 2, correct: 2 });
    });
    first.unmount();

    const second = renderHook(() => useFocusMode({ locale: "zh-Hant" }));
    expect(second.result.current.state.session!.phase).toBe("focus");
    expect(second.result.current.state.session!.cycle).toBe(1);
    expect(second.result.current.state.config.focusMinutes).toBe(30);
    expect(second.result.current.remainingMs).toBe(30 * MS_PER_MINUTE);
  });

  it("reconciles an expired persisted session on mount instead of restarting it", () => {
    // Seed the store with a session whose focus deadline already passed, as a
    // reload would after a long-hidden tab.
    const seeded = renderHook(() => useFocusMode({ locale: "zh-Hant" }));
    act(() => {
      seeded.result.current.start(defaultFocusConfig(), { answered: 0, correct: 0 });
    });
    seeded.unmount();

    // Advance the clock well past the deadline before remounting.
    act(() => {
      vi.advanceTimersByTime(FOCUS_MS + MS_PER_MINUTE);
    });

    const remounted = renderHook(() => useFocusMode({ locale: "zh-Hant" }));
    expect(remounted.result.current.state.session!.phase).toBe("break");
    expect(remounted.result.current.remainingMs).toBe(BREAK_MS - MS_PER_MINUTE);
  });
});
