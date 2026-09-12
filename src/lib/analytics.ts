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
  | "promo_click"
  | "focus_started"
  | "focus_cycle_completed"
  | "focus_ended";

interface PageViewPayload {
  view: string;
  locale: LocaleCode;
}
interface PracticeStartedPayload {
  source: PracticeMode;
  levelRange?: LevelRange;
  locale: LocaleCode;
}
interface AnswerSubmittedPayload {
  source: PracticeMode;
  level: JlptLevel | "all";
  // questionType reuses PracticeMode (a coarse, content-free label) — never
  // the question's surface or text. Typed narrowly so the value cannot be a
  // free-form string that smuggles question content.
  questionType: PracticeMode;
  isCorrect: boolean;
  locale: LocaleCode;
}
interface PracticeCompletedPayload {
  source: PracticeMode;
  level: JlptLevel | "all";
  totalQuestions: number;
  correctCount: number;
  locale: LocaleCode;
}
interface StudyPageViewedPayload {
  surface: string;
  locale: LocaleCode;
}
interface LevelChangedPayload {
  scope: "global" | "session";
  levelRange: LevelRange;
  locale: LocaleCode;
}
interface LocaleChangedPayload {
  from: LocaleCode;
  to: LocaleCode;
}
interface WeakReviewStartedPayload {
  dueCount: number;
  locale: LocaleCode;
}
interface ArticleViewedPayload {
  slug: string;
}
// Outbound promotion click (#745). promoId and placement are bounded to
// approved identifiers so arbitrary free-form text or PII (an email, a URL)
// cannot pass the analytics boundary at compile time. action distinguishes a
// direct Airbnb CTA from a video-trigger interaction. Extend the unions below
// when a new approved promotion or placement lands.
export type PromoIdentifier = "stay-d";

// Stable Stay.D funnel interaction placements frozen by #744 (#745 analytics
// boundary). Each value identifies a distinct user-facing funnel interaction,
// not a raw URL, surface slug, or free-form copy. #744 wires exactly these
// values when the Stay.D UI lands; adding a new funnel step extends the union.
export type PromoPlacement =
  | "home-airbnb"
  | "home-video"
  | "home-video-airbnb"
  | "stay-d-hero-airbnb"
  | "stay-d-video"
  | "stay-d-video-airbnb"
  | "stay-d-final-airbnb";

interface PromoClickPayload {
  promoId: PromoIdentifier;
  action: "airbnb" | "video";
  placement: PromoPlacement;
  locale: LocaleCode;
}

// Focus Mode lifecycle (#771). Durations are whole configured minutes and the
// cycle count is a small integer -- low-cardinality metadata only, no text or
// study content. focus_started fires on a Focus run start (and each next
// cycle), focus_cycle_completed when a focus phase folds into the break, and
// focus_ended when the learner ends Focus Mode.
interface FocusStartedPayload {
  focusMin: number;
  breakMin: number;
  locale: LocaleCode;
}
interface FocusCycleCompletedPayload {
  durationMin: number;
  locale: LocaleCode;
}
interface FocusEndedPayload {
  cycles: number;
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
  focus_started: FocusStartedPayload;
  focus_cycle_completed: FocusCycleCompletedPayload;
  focus_ended: FocusEndedPayload;
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
  promo_click: ["promoId", "action", "placement", "locale"],
  focus_started: ["focusMin", "breakMin", "locale"],
  focus_cycle_completed: ["durationMin", "locale"],
  focus_ended: ["cycles", "locale"]
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

function isAnalyticsEnabled(): boolean {
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
