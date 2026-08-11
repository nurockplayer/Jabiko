import type { JlptLevel, LocaleCode } from "../domain/types";
import type { LevelRange } from "../domain/levelRange";
import type { PracticeMode } from "../domain/practiceMode";

export type AnalyticsEventName =
  | "page_view"
  | "practice_started"
  | "answer_submitted"
  | "practice_completed"
  | "study_page_viewed"
  | "level_changed"
  | "locale_changed"
  | "weak_review_started"
  | "article_viewed"
  | "promo_click";

export interface PageViewPayload {
  view: string;
  locale: LocaleCode;
}
export interface PracticeStartedPayload {
  source: PracticeMode;
  levelRange?: LevelRange;
  locale: LocaleCode;
}
export interface AnswerSubmittedPayload {
  source: PracticeMode;
  level: JlptLevel | "all";
  // questionType reuses PracticeMode (a coarse, content-free label) — never
  // the question's surface or text. Typed narrowly so the value cannot be a
  // free-form string that smuggles question content.
  questionType: PracticeMode;
  isCorrect: boolean;
  locale: LocaleCode;
}
export interface PracticeCompletedPayload {
  source: PracticeMode;
  level: JlptLevel | "all";
  totalQuestions: number;
  correctCount: number;
  locale: LocaleCode;
}
export interface StudyPageViewedPayload {
  surface: string;
  locale: LocaleCode;
}
export interface LevelChangedPayload {
  scope: "global" | "session";
  levelRange: LevelRange;
  locale: LocaleCode;
}
export interface LocaleChangedPayload {
  from: LocaleCode;
  to: LocaleCode;
}
export interface WeakReviewStartedPayload {
  dueCount: number;
  locale: LocaleCode;
}
export interface ArticleViewedPayload {
  slug: string;
}
// Outbound promotion click (#745). destinationType is narrowed to the single
// currently-approved destination ("airbnb"); placement identifies the Jabiko
// surface the card rendered on, not free-form copy. Nothing about the
// destination page, account, or visitor travels in this payload.
export interface PromoClickPayload {
  promoId: string;
  destinationType: "airbnb";
  placement: string;
  locale: LocaleCode;
}

export interface AnalyticsPayloadMap {
  page_view: PageViewPayload;
  practice_started: PracticeStartedPayload;
  answer_submitted: AnswerSubmittedPayload;
  practice_completed: PracticeCompletedPayload;
  study_page_viewed: StudyPageViewedPayload;
  level_changed: LevelChangedPayload;
  locale_changed: LocaleChangedPayload;
  weak_review_started: WeakReviewStartedPayload;
  article_viewed: ArticleViewedPayload;
  promo_click: PromoClickPayload;
}

const ZARAZ_ENABLED_FLAG = import.meta.env.VITE_ZARAZ_ENABLED;
const IS_PROD = import.meta.env.PROD;

// Per-event allowlist of payload keys. trackEvent only forwards keys that
// appear here, so a caller that defeats TS excess-property checking (by
// building the payload as a variable with extra smuggled fields like
// `userAnswer` / `email`) cannot leak those fields to Zaraz — the helper is
// the privacy boundary, not the type system alone.
const ALLOWED_PAYLOAD_KEYS: Record<AnalyticsEventName, readonly string[]> = {
  page_view: ["view", "locale"],
  practice_started: ["source", "levelRange", "locale"],
  answer_submitted: ["source", "level", "questionType", "isCorrect", "locale"],
  practice_completed: ["source", "level", "totalQuestions", "correctCount", "locale"],
  study_page_viewed: ["surface", "locale"],
  level_changed: ["scope", "levelRange", "locale"],
  locale_changed: ["from", "to"],
  weak_review_started: ["dueCount", "locale"],
  article_viewed: ["slug"],
  promo_click: ["promoId", "destinationType", "placement", "locale"]
};

function sanitizePayload<K extends AnalyticsEventName>(
  name: K,
  payload: AnalyticsPayloadMap[K]
): Record<string, unknown> {
  const allowed = ALLOWED_PAYLOAD_KEYS[name];
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload as unknown as Record<string, unknown>)) {
    if (allowed.includes(key) && (typeof value === "string" || typeof value === "number" || typeof value === "boolean" || value === null)) {
      out[key] = value;
    }
  }
  return out;
}

let testOverride: boolean | undefined = undefined;

export type AnalyticsEnabledState = "on" | "off" | "test";

export function isAnalyticsEnabled(): boolean {
  if (testOverride !== undefined) return testOverride;
  return IS_PROD && ZARAZ_ENABLED_FLAG === "true";
}

export function __setAnalyticsEnabledForTest(enabled: boolean | undefined): void {
  testOverride = enabled;
}

export function trackEvent<K extends AnalyticsEventName>(
  name: K,
  payload: AnalyticsPayloadMap[K]
): void {
  if (!isAnalyticsEnabled()) return;
  if (typeof window === "undefined") return;
  const zaraz = window.zaraz;
  if (!zaraz || typeof zaraz.track !== "function") return;
  try {
    zaraz.track(name, sanitizePayload(name, payload));
  } catch {
    // Zaraz failures must never break learning flows.
  }
}
