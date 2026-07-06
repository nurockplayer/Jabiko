import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  __setAnalyticsEnabledForTest,
  trackEvent
} from "./analytics";

// Zaraz global is injected by the Zaraz snippet in production. In tests it
// is absent by default; each test that needs it installs its own stub and we
// tear it down in afterEach so nothing leaks between suites. The
// Window.zaraz type is declared once in src/vite-env.d.ts.
type ZarazTrack = (name: string, payload: Record<string, unknown>) => void;
type ZarazTrackMock = ReturnType<typeof vi.fn>;

function installZaraz(): ZarazTrackMock {
  const track = vi.fn() as unknown as ZarazTrack;
  (window as unknown as { zaraz: { track: ZarazTrack } }).zaraz = { track };
  return track as unknown as ZarazTrackMock;
}

function clearZaraz() {
  delete (window as unknown as { zaraz?: unknown }).zaraz;
}

describe("analytics.trackEvent", () => {
  beforeEach(() => {
    clearZaraz();
  });

  afterEach(() => {
    __setAnalyticsEnabledForTest(undefined);
    clearZaraz();
  });

  it("no-ops when analytics is disabled (default)", () => {
    __setAnalyticsEnabledForTest(false);
    const track = installZaraz();
    trackEvent("page_view", { view: "home", locale: "zh-Hant" });
    expect(track).not.toHaveBeenCalled();
  });

  it("calls window.zaraz.track with name and payload when enabled", () => {
    __setAnalyticsEnabledForTest(true);
    const track = installZaraz();
    trackEvent("page_view", { view: "home", locale: "zh-Hant" });
    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith("page_view", {
      view: "home",
      locale: "zh-Hant"
    });
  });

  it("no-ops without throwing when window.zaraz is missing", () => {
    __setAnalyticsEnabledForTest(true);
    clearZaraz();
    expect(() =>
      trackEvent("page_view", { view: "home", locale: "zh-Hant" })
    ).not.toThrow();
  });

  it("swallows errors thrown by window.zaraz.track", () => {
    __setAnalyticsEnabledForTest(true);
    (window as unknown as { zaraz: { track: ZarazTrack } }).zaraz = {
      track: () => {
        throw new Error("zaraz boom");
      }
    };
    expect(() =>
      trackEvent("page_view", { view: "home", locale: "zh-Hant" })
    ).not.toThrow();
  });

  it("no-ops when window.zaraz.track is not a function", () => {
    __setAnalyticsEnabledForTest(true);
    (window as unknown as { zaraz: { track: unknown } }).zaraz = {
      track: "not-a-function"
    };
    expect(() =>
      trackEvent("page_view", { view: "home", locale: "zh-Hant" })
    ).not.toThrow();
  });

  it("rejects unknown event names at compile time", () => {
    // @ts-expect-error -- "button_clicked" is not a Phase 1 event
    trackEvent("button_clicked", {});
  });

  it("rejects a wrong payload type for a known event at compile time", () => {
    // @ts-expect-error -- page_view.view must be a string, not a number
    trackEvent("page_view", { view: 123, locale: "zh-Hant" });
  });

  it("rejects sensitive payload keys at compile time (answer_submitted.userAnswer)", () => {
    // @ts-expect-error -- userAnswer is not an allowed key; user content is forbidden
    trackEvent("answer_submitted", { source: "daily", level: "N4", questionType: "daily", isCorrect: true, locale: "zh-Hant", userAnswer: "秘密の答え" });
  });

  it("rejects sensitive payload keys at compile time (level_changed.userId)", () => {
    // @ts-expect-error -- userId / raw supabase id is forbidden
    trackEvent("level_changed", { scope: "global", levelRange: "all", locale: "zh-Hant", userId: "abc-123" });
  });

  it("accepts each Phase 1 event with its documented payload shape", () => {
    __setAnalyticsEnabledForTest(true);
    const track = installZaraz();
    trackEvent("practice_started", {
      source: "daily",
      levelRange: "all",
      locale: "zh-Hant"
    });
    trackEvent("answer_submitted", {
      source: "exam",
      level: "N3",
      questionType: "exam",
      isCorrect: false,
      locale: "zh-Hant"
    });
    trackEvent("practice_completed", {
      source: "daily",
      level: "all",
      totalQuestions: 20,
      correctCount: 16,
      locale: "zh-Hant"
    });
    trackEvent("study_page_viewed", { surface: "〜てもいい", locale: "zh-Hant" });
    trackEvent("level_changed", {
      scope: "session",
      levelRange: "n1n2",
      locale: "zh-Hant"
    });
    trackEvent("locale_changed", { from: "ja", to: "zh-Hant" });
    trackEvent("weak_review_started", { dueCount: 5, locale: "zh-Hant" });
    expect(track).toHaveBeenCalledTimes(7);
  });

  it("module import has no firing side effects", () => {
    __setAnalyticsEnabledForTest(true);
    clearZaraz();
    expect(
      (window as unknown as { zaraz?: unknown }).zaraz
    ).toBeUndefined();
    expect(() =>
      trackEvent("page_view", { view: "home", locale: "zh-Hant" })
    ).not.toThrow();
  });

  it("strips non-allowlisted payload keys before forwarding to Zaraz", () => {
    __setAnalyticsEnabledForTest(true);
    const track = installZaraz();
    // A caller that builds the payload as a variable defeats TS excess-property
    // checking (see review #3524583187). trackEvent must only forward allowlist
    // keys so user content / PII never leaks even when the caller smuggles extra
    // fields past the type system.
    const smuggled = {
      source: "daily" as const,
      level: "N4" as const,
      questionType: "daily" as const,
      isCorrect: true as const,
      locale: "zh-Hant" as const,
      userAnswer: "秘密の答え",
      email: "a@b.com"
    };
    trackEvent("answer_submitted", smuggled);
    expect(track).toHaveBeenCalledTimes(1);
    const forwarded = track.mock.calls[0][1] as Record<string, unknown>;
    expect(forwarded).not.toHaveProperty("userAnswer");
    expect(forwarded).not.toHaveProperty("email");
    expect(forwarded).toEqual({
      source: "daily",
      level: "N4",
      questionType: "daily",
      isCorrect: true,
      locale: "zh-Hant"
    });
  });
});
