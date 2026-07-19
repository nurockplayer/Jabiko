import { readTtsRate } from "../lib/ttsRate";
import { getJapaneseVoice } from "../lib/speech";

// Reproducibility diagnostics for anonymous general feedback (#654). Vague
// reports ("排版亂掉" / "ne 發音怪怪的") can't be reproduced without the render
// environment, so submitFeedback attaches this blob in a dedicated column.
//
// PRIVACY BOUNDARY (mirrors analytics.ts's ALLOWED_PAYLOAD_KEYS): only the
// coarse, content-free fields below are ever collected. NO raw user-agent, IP,
// browsing history, arbitrary localStorage, other-page content, question text,
// or fine device identifiers. The browser/OS are parsed down to a bare name
// (no version) so the blob can't act as a fingerprint. Every value is a
// primitive or null -- never a nested object that could smuggle content.

// Injected at build time (vite `define`); "dev" in tests / local runs.
declare const __APP_BUILD__: string;

export interface FeedbackDiagnostics {
  /** location.pathname, e.g. "/challenge" -- says which flow, carries no content. */
  route: string;
  /** Build id (Cloudflare commit SHA) so a report maps to a deploy. */
  appBuild: string;
  uiLocale: string;
  furigana: boolean;
  viewportW: number;
  viewportH: number;
  dpr: number;
  /** Coarse browser name (no version). */
  browser: string;
  /** Coarse OS name (no version). */
  os: string;
  /** Running as an installed PWA (standalone display) vs a normal tab. */
  pwa: boolean;
  ttsRate: number;
  voiceName: string | null;
  voiceLang: string | null;
  voiceLocalService: boolean | null;
  voiceDefault: boolean | null;
  /** Only during the practice flow; ID + type, never the prompt/options. */
  questionId?: string;
  promptLabel?: string;
}

// The complete, closed set of keys a diagnostics blob may carry. Used by the
// test as the privacy allowlist -- anything outside this is a leak.
export const DIAGNOSTICS_KEYS = [
  "route", "appBuild", "uiLocale", "furigana", "viewportW", "viewportH", "dpr",
  "browser", "os", "pwa", "ttsRate", "voiceName", "voiceLang",
  "voiceLocalService", "voiceDefault", "questionId", "promptLabel"
] as const;

/** Coarse browser + OS name from a UA string -- name only, never the version. */
export function parseBrowserOs(ua: string): { browser: string; os: string } {
  const os =
    /iPhone|iPad|iPod/.test(ua) ? "iOS"
      : /Android/.test(ua) ? "Android"
        : /Windows/.test(ua) ? "Windows"
          : /Mac OS X|Macintosh/.test(ua) ? "macOS"
            : /Linux/.test(ua) ? "Linux"
              : "other";
  // Order matters: Edge/Opera/Samsung masquerade as Chrome; Chrome-on-iOS
  // (CriOS) and Firefox-on-iOS (FxiOS) sit inside a Safari-like UA.
  const browser =
    /Edg\//.test(ua) ? "Edge"
      : /OPR\/|Opera/.test(ua) ? "Opera"
        : /SamsungBrowser/.test(ua) ? "Samsung"
          : /Firefox\/|FxiOS/.test(ua) ? "Firefox"
            : /CriOS\//.test(ua) ? "Chrome"
              : /Chrome\//.test(ua) ? "Chrome"
                : /Safari\//.test(ua) ? "Safari"
                  : "other";
  return { browser, os };
}

export function collectDiagnostics(input: {
  locale: string;
  furigana: boolean;
  questionId?: string;
  promptLabel?: string;
}): FeedbackDiagnostics {
  const win = typeof window === "undefined" ? undefined : window;
  const nav = typeof navigator === "undefined" ? undefined : navigator;
  const loc = typeof location === "undefined" ? undefined : location;
  const { browser, os } = parseBrowserOs(nav?.userAgent ?? "");

  let pwa = false;
  try {
    pwa =
      (win?.matchMedia?.("(display-mode: standalone)").matches ?? false) ||
      (nav as unknown as { standalone?: boolean } | undefined)?.standalone === true;
  } catch {
    // matchMedia can throw on some engines; a false PWA flag is a safe default.
  }

  let ttsRate = 1;
  try {
    ttsRate = readTtsRate();
  } catch {
    // fall back to the default rate
  }

  let voiceName: string | null = null;
  let voiceLang: string | null = null;
  let voiceLocalService: boolean | null = null;
  let voiceDefault: boolean | null = null;
  try {
    const v = getJapaneseVoice();
    if (v) {
      voiceName = v.name ?? null;
      voiceLang = v.lang ?? null;
      voiceLocalService = v.localService ?? null;
      voiceDefault = v.default ?? null;
    }
  } catch {
    // voices may not be loaded on the first play; null is the honest value.
  }

  const out: FeedbackDiagnostics = {
    route: loc?.pathname ?? "",
    appBuild: typeof __APP_BUILD__ !== "undefined" ? __APP_BUILD__ : "dev",
    uiLocale: input.locale,
    furigana: input.furigana,
    viewportW: win?.innerWidth ?? 0,
    viewportH: win?.innerHeight ?? 0,
    dpr: win?.devicePixelRatio ?? 1,
    browser,
    os,
    pwa,
    ttsRate,
    voiceName,
    voiceLang,
    voiceLocalService,
    voiceDefault
  };
  if (input.questionId) out.questionId = input.questionId;
  if (input.promptLabel) out.promptLabel = input.promptLabel;
  return out;
}
