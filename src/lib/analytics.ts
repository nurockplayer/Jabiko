import type { JlptLevel } from "../domain/types";
import type { LevelRange } from "../domain/levelRange";
import type { LocaleCode } from "../domain/types";

export type AnalyticsEventName =
  | "page_view"
  | "practice_started"
  | "answer_submitted"
  | "practice_completed"
  | "study_page_viewed"
  | "level_changed"
  | "locale_changed"
  | "weak_review_started";

export interface PageViewPayload {
  view: string;
  locale: LocaleCode;
}
export interface PracticeStartedPayload {
  source: string;
  levelRange?: LevelRange;
  locale: LocaleCode;
}
export interface AnswerSubmittedPayload {
  source: string;
  level: JlptLevel | "all";
  questionType: string;
  isCorrect: boolean;
  locale: LocaleCode;
}
export interface PracticeCompletedPayload {
  source: string;
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

export interface AnalyticsPayloadMap {
  page_view: PageViewPayload;
  practice_started: PracticeStartedPayload;
  answer_submitted: AnswerSubmittedPayload;
  practice_completed: PracticeCompletedPayload;
  study_page_viewed: StudyPageViewedPayload;
  level_changed: LevelChangedPayload;
  locale_changed: LocaleChangedPayload;
  weak_review_started: WeakReviewStartedPayload;
}

const ZARAZ_ENABLED_FLAG = import.meta.env.VITE_ZARAZ_ENABLED;
const IS_PROD = import.meta.env.PROD;

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
    zaraz.track(name, payload as unknown as Record<string, unknown>);
  } catch {
    // Zaraz failures must never break learning flows.
  }
}
