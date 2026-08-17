// App-level Focus Mode integration tests (#771). These exercise the REAL App
// shell with Supabase unconfigured (local-only, no sign-in): start from the
// chrome, countdown accuracy, route-change survival, single-fire expiry into
// the Break surface, skip into the next cycle, end-and-return, and keyboard
// reachability of the break actions. Deterministic clocks via fake timers;
// interactions use fireEvent (synchronous) so they do not depend on the
// timer-faked user-event scheduling.
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import type { Attempt } from "./domain/types";
import type { SupabaseClient } from "@supabase/supabase-js";

// Same seams as App.test.tsx: Supabase unconfigured (local-only), no remote.
// Focus Mode requires no account and no remote data model.
vi.mock("./lib/supabase", () => ({
  get isSupabaseConfigured() {
    return false;
  },
  getSupabase: () => Promise.resolve({} as unknown as SupabaseClient)
}));

vi.mock("./domain/attemptRemote", async () => {
  const actual = await vi.importActual<typeof import("./domain/attemptRemote")>(
    "./domain/attemptRemote"
  );
  return {
    ...actual,
    fetchRemoteAttempts: async () => [] as Attempt[],
    pushAttempts: async () => {}
  };
});

vi.mock("./domain/practiceHistoryDeletion", () => ({
  readDeletionMarker: () => false,
  writeDeletionMarker: () => true,
  removeDeletionMarker: () => true
}));

const FOCUS_MS = 25 * 60_000;

describe("App Focus Mode (#771)", () => {
  afterEach(() => {
    localStorage.clear();
    window.history.replaceState({}, "", "/");
    vi.useRealTimers();
  });

  /** Click the header Focus pill, then Start in the configuration dialog. */
  function startFocus() {
    fireEvent.click(screen.getByRole("button", { name: "專注" }));
    const dialog = screen.getByRole("dialog", { name: "專注設定" });
    fireEvent.click(within(dialog).getByRole("button", { name: "開始" }));
  }

  it("starts a 25/5 session from the app chrome with no sign-in", () => {
    render(<App />);
    startFocus();
    expect(screen.getByRole("button", { name: /專注 25:00/ })).toBeInTheDocument();
  });

  it("keeps the countdown across in-app route changes", () => {
    render(<App />);
    startFocus();
    fireEvent.click(screen.getByRole("button", { name: "學習" }));
    expect(screen.getByRole("button", { name: /專注 25:00/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "首頁" }));
    expect(screen.getByRole("button", { name: /專注 25:00/ })).toBeInTheDocument();
  });

  it("opens exactly one Break surface when focus expires", () => {
    vi.useFakeTimers();
    render(<App />);
    startFocus();
    act(() => {
      vi.advanceTimersByTime(FOCUS_MS);
    });
    const breakSurface = screen.getByRole("dialog", { name: "休息一下" });
    expect(breakSurface).toBeInTheDocument();
    // Extra time must not open a second surface / repeat the transition.
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(screen.getByRole("dialog", { name: "休息一下" })).toBe(breakSurface);
  });

  it("skips the break into the next focus cycle", () => {
    vi.useFakeTimers();
    render(<App />);
    startFocus();
    act(() => {
      vi.advanceTimersByTime(FOCUS_MS);
    });
    fireEvent.click(screen.getByRole("button", { name: "略過休息" }));
    expect(screen.getByRole("button", { name: /專注 25:00/ })).toBeInTheDocument();
  });

  it("ends Focus Mode from the active menu and returns to the current route", () => {
    render(<App />);
    startFocus();
    fireEvent.click(screen.getByRole("button", { name: /專注 25:00/ }));
    fireEvent.click(screen.getByRole("button", { name: "結束專注模式" }));
    // Back to the idle chrome pill; the learning surface is untouched.
    expect(screen.getByRole("button", { name: "專注" })).toBeInTheDocument();
  });

  it("keeps skip/end keyboard-reachable on the break surface", () => {
    vi.useFakeTimers();
    render(<App />);
    startFocus();
    act(() => {
      vi.advanceTimersByTime(FOCUS_MS);
    });
    const dialog = screen.getByRole("dialog", { name: "休息一下" });
    const skip = within(dialog).getByRole("button", { name: "略過休息" });
    const end = within(dialog).getByRole("button", { name: "結束專注模式" });
    expect(dialog).toHaveFocus();
    skip.focus();
    expect(skip).toHaveFocus();
    end.focus();
    expect(end).toHaveFocus();
  });

  it("keeps Focus reachable from the mobile 更多 menu (icon-only header)", () => {
    render(<App />);
    // On narrow phones the header tool row moves into the nav's 更多 menu;
    // the Focus entry must still open the configuration dialog.
    fireEvent.click(screen.getByRole("button", { name: "更多" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "專注" }));
    expect(screen.getByRole("dialog", { name: "專注設定" })).toBeInTheDocument();
  });
});
