import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import type { Attempt } from "./domain/types";
import type { SupabaseClient } from "@supabase/supabase-js";

const adBoundary = vi.hoisted(() => ({ render: vi.fn() }));

vi.mock("./components/ads/AdSensePlacement", () => ({
  AdSensePlacement: (props: { placement: string; eligible: boolean; label: string }) => {
    adBoundary.render(props);
    return <aside aria-label={props.label}>ad boundary</aside>;
  }
}));

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

function startFocus() {
  fireEvent.click(screen.getByRole("button", { name: "專注" }));
  fireEvent.click(within(screen.getByRole("dialog", { name: "專注設定" })).getByRole("button", { name: "開始" }));
}

describe("App AdSense isolation (#772)", () => {
  afterEach(() => {
    adBoundary.render.mockClear();
    localStorage.clear();
    window.history.replaceState({}, "", "/");
    vi.useRealTimers();
  });

  it("never inserts the provider boundary into Focus, Challenge, or mock active learning", async () => {
    render(<App />);
    startFocus();
    expect(adBoundary.render).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "挑戰" }));
    await screen.findByRole("region", { name: "目前題目" }, { timeout: 30000 });
    expect(adBoundary.render).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "題型練習" }));
    await screen.findByRole("region", { name: "題型練習" }, { timeout: 30000 });
    expect(adBoundary.render).not.toHaveBeenCalled();
  }, 60000);

  it("never inserts the provider boundary into weak-point review", async () => {
    localStorage.setItem(
      "jabiko:attempts",
      JSON.stringify([
        {
          questionId: "n1-grammar-yainaya",
          vocabularyId: "n1-grammar-yainaya",
          targetForm: "meaning",
          prompt: "seed",
          expectedAnswers: ["や否や"],
          submittedAnswer: "x",
          isCorrect: false,
          timestamp: 1000,
          responseTimeMs: 100
        }
      ])
    );
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /等待複習/ }));
    await screen.findByRole("button", { name: "や否や" }, { timeout: 30000 });
    expect(adBoundary.render).not.toHaveBeenCalled();
  }, 60000);

  it("keeps a zero-answer Focus Break ineligible while exposing only the allowlisted boundary", () => {
    vi.useFakeTimers();
    render(<App />);
    startFocus();
    expect(adBoundary.render).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(25 * 60_000));
    expect(screen.getByRole("dialog", { name: "休息一下" })).toBeInTheDocument();
    expect(adBoundary.render).toHaveBeenCalled();
    for (const [props] of adBoundary.render.mock.calls) {
      expect(props).toMatchObject({ placement: "focus-break", eligible: false });
    }
  });

  it("makes the Break eligible only after a local attempt is recorded during Focus", async () => {
    localStorage.setItem(
      "jabiko:attempts",
      JSON.stringify([
        {
          questionId: "n1-grammar-yainaya",
          vocabularyId: "n1-grammar-yainaya",
          targetForm: "meaning",
          prompt: "seed",
          expectedAnswers: ["や否や"],
          submittedAnswer: "x",
          isCorrect: false,
          timestamp: 1000,
          responseTimeMs: 100
        }
      ])
    );
    vi.useFakeTimers();
    render(<App />);
    startFocus();
    fireEvent.click(screen.getByRole("button", { name: /等待複習/ }));
    await act(async () => Promise.resolve());
    fireEvent.click(screen.getByRole("button", { name: "や否や" }));
    act(() => vi.advanceTimersByTime(25 * 60_000));
    expect(screen.getByRole("dialog", { name: "休息一下" })).toBeInTheDocument();
    expect(adBoundary.render.mock.calls.some(([props]) => props.eligible === true)).toBe(true);
  });
});
