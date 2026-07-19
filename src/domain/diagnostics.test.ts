import { afterEach, describe, expect, it, vi } from "vitest";
import { collectDiagnostics, parseBrowserOs, DIAGNOSTICS_KEYS } from "./diagnostics";

describe("parseBrowserOs", () => {
  it("reads a coarse browser + OS from common user agents (no version, no fingerprint)", () => {
    const chromeWin = parseBrowserOs(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"
    );
    expect(chromeWin).toEqual({ browser: "Chrome", os: "Windows" });

    const safariIos = parseBrowserOs(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
    );
    expect(safariIos).toEqual({ browser: "Safari", os: "iOS" });

    const fxAndroid = parseBrowserOs(
      "Mozilla/5.0 (Android 14; Mobile; rv:121.0) Gecko/121.0 Firefox/121.0"
    );
    expect(fxAndroid).toEqual({ browser: "Firefox", os: "Android" });
  });

  it("falls back to 'other' rather than leaking the raw string", () => {
    const r = parseBrowserOs("something weird");
    expect(r.browser).toBe("other");
    expect(r.os).toBe("other");
  });
});

describe("collectDiagnostics", () => {
  afterEach(() => vi.unstubAllGlobals());

  const stubEnv = () => {
    vi.stubGlobal("location", { pathname: "/challenge" });
    vi.stubGlobal("navigator", {
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"
    });
    vi.stubGlobal("innerWidth", 375);
    vi.stubGlobal("innerHeight", 812);
    vi.stubGlobal("devicePixelRatio", 2);
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
  };

  it("collects the whitelisted environment fields", () => {
    stubEnv();
    const d = collectDiagnostics({ locale: "zh-Hant", furigana: true });
    expect(d.route).toBe("/challenge");
    expect(d.uiLocale).toBe("zh-Hant");
    expect(d.furigana).toBe(true);
    expect(d.viewportW).toBe(375);
    expect(d.viewportH).toBe(812);
    expect(d.dpr).toBe(2);
    expect(d.browser).toBe("Chrome");
    expect(d.os).toBe("Windows");
    expect(d.pwa).toBe(false);
    expect(typeof d.ttsRate).toBe("number");
    expect(typeof d.appBuild).toBe("string");
  });

  it("includes question context only when supplied (practice flow)", () => {
    stubEnv();
    const withCtx = collectDiagnostics({
      locale: "zh-Hant",
      furigana: false,
      questionId: "n2-usage-panchi",
      promptLabel: "詞彙用法"
    });
    expect(withCtx.questionId).toBe("n2-usage-panchi");
    expect(withCtx.promptLabel).toBe("詞彙用法");

    const noCtx = collectDiagnostics({ locale: "en", furigana: false });
    expect("questionId" in noCtx).toBe(false);
    expect("promptLabel" in noCtx).toBe(false);
  });

  it("never carries PII or the raw user-agent string", () => {
    stubEnv();
    const d = collectDiagnostics({ locale: "zh-Hant", furigana: true });
    // every value is a primitive (or null) -- no nested objects that could
    // smuggle content, mirroring the analytics allowlist discipline.
    for (const [key, value] of Object.entries(d)) {
      expect(DIAGNOSTICS_KEYS).toContain(key);
      expect(["string", "number", "boolean"].includes(typeof value) || value === null).toBe(true);
    }
    // the full UA must never be embedded (only a coarse browser/os name).
    expect(JSON.stringify(d)).not.toContain("AppleWebKit");
    expect(JSON.stringify(d)).not.toContain("Mozilla");
  });

  it("degrades safely under SSR (no window/navigator)", () => {
    vi.stubGlobal("location", undefined);
    vi.stubGlobal("navigator", undefined);
    expect(() => collectDiagnostics({ locale: "zh-Hant", furigana: false })).not.toThrow();
  });
});
