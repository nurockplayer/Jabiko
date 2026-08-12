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

  it("accepts article_viewed with a slug-only payload", () => {
    __setAnalyticsEnabledForTest(true);
    const track = installZaraz();

    trackEvent("article_viewed", { slug: "sweet-steady-sweet-step" });

    expect(track).toHaveBeenCalledWith("article_viewed", {
      slug: "sweet-steady-sweet-step"
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

  it("rejects article content at compile time", () => {
    // @ts-expect-error -- article_viewed must never include title or body text
    trackEvent("article_viewed", { slug: "sweet-steady-sweet-step", title: "文章標題" });
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
    trackEvent("article_viewed", { slug: "sweet-steady-sweet-step" });
    expect(track).toHaveBeenCalledTimes(8);
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

  it("strips article content and navigation metadata from article_viewed", () => {
    __setAnalyticsEnabledForTest(true);
    const track = installZaraz();
    const smuggled = {
      slug: "sweet-steady-sweet-step",
      title: "從歌詞學日文",
      body: "文章正文",
      referrer: "https://example.com/",
      search: "?q=private"
    };

    trackEvent("article_viewed", smuggled);

    expect(track).toHaveBeenCalledWith("article_viewed", {
      slug: "sweet-steady-sweet-step"
    });
  });

  it("accepts promo_click with a Home direct Airbnb placement (action: airbnb)", () => {
    __setAnalyticsEnabledForTest(true);
    const track = installZaraz();
    trackEvent("promo_click", {
      promoId: "stay-d",
      action: "airbnb",
      placement: "home-airbnb",
      locale: "zh-Hant"
    });
    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith("promo_click", {
      promoId: "stay-d",
      action: "airbnb",
      placement: "home-airbnb",
      locale: "zh-Hant"
    });
  });

  it("accepts promo_click with a Home video trigger placement (action: video)", () => {
    __setAnalyticsEnabledForTest(true);
    const track = installZaraz();
    trackEvent("promo_click", {
      promoId: "stay-d",
      action: "video",
      placement: "home-video",
      locale: "ja"
    });
    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith("promo_click", {
      promoId: "stay-d",
      action: "video",
      placement: "home-video",
      locale: "ja"
    });
  });

  it("accepts promo_click with a /stay-d final Airbnb placement", () => {
    __setAnalyticsEnabledForTest(true);
    const track = installZaraz();
    trackEvent("promo_click", {
      promoId: "stay-d",
      action: "airbnb",
      placement: "stay-d-final-airbnb",
      locale: "en"
    });
    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith("promo_click", {
      promoId: "stay-d",
      action: "airbnb",
      placement: "stay-d-final-airbnb",
      locale: "en"
    });
  });

  it("strips non-allowlisted keys from promo_click before forwarding to Zaraz", () => {
    __setAnalyticsEnabledForTest(true);
    const track = installZaraz();
    // The promotion CTA must not forward the destination URL, account data,
    // raw user ids, or arbitrary strings. Only the four allowlisted keys pass.
    const smuggled = {
      promoId: "stay-d" as const,
      action: "airbnb" as const,
      placement: "home-airbnb" as const,
      locale: "zh-Hant" as const,
      destinationUrl: "https://zh-t.airbnb.com/rooms/1518015758376242668",
      email: "a@b.com",
      userId: "supabase-123",
      nested: { title: "秘密の宿" }
    };
    trackEvent("promo_click", smuggled);
    expect(track).toHaveBeenCalledTimes(1);
    const forwarded = track.mock.calls[0][1] as Record<string, unknown>;
    expect(forwarded).not.toHaveProperty("destinationUrl");
    expect(forwarded).not.toHaveProperty("email");
    expect(forwarded).not.toHaveProperty("userId");
    expect(forwarded).not.toHaveProperty("nested");
    expect(forwarded).toEqual({
      promoId: "stay-d",
      action: "airbnb",
      placement: "home-airbnb",
      locale: "zh-Hant"
    });
  });

  it("rejects a non airbnb|video action for promo_click at compile time", () => {
    trackEvent("promo_click", {
      promoId: "stay-d",
      // @ts-expect-error -- action is narrowed to "airbnb" | "video"; a free-form
      // destination string (e.g. a booking provider) is not allowed
      action: "hotel",
      placement: "home-airbnb",
      locale: "zh-Hant"
    });
  });

  it("rejects destination URL or PII keys for promo_click at compile time", () => {
    trackEvent("promo_click", {
      promoId: "stay-d",
      action: "airbnb",
      placement: "home-airbnb",
      locale: "zh-Hant",
      // @ts-expect-error -- destinationUrl is not an allowlisted key; the
      // Airbnb URL must never travel inside the analytics payload
      destinationUrl: "https://zh-t.airbnb.com/rooms/1518015758376242668"
    });
  });

  it("rejects an arbitrary promoId at compile time", () => {
    trackEvent("promo_click", {
      // @ts-expect-error -- promoId is bounded to approved promotion ids; a
      // free-form string such as an email must not pass the boundary
      promoId: "user@example.com",
      action: "airbnb",
      placement: "home-airbnb",
      locale: "zh-Hant"
    });
  });

  it("rejects an arbitrary placement at compile time", () => {
    trackEvent("promo_click", {
      promoId: "stay-d",
      action: "airbnb",
      // @ts-expect-error -- placement is bounded to the frozen #744 funnel
      // placements; a URL or free text must not pass the boundary
      placement: "https://example.com/",
      locale: "zh-Hant"
    });
  });
});
