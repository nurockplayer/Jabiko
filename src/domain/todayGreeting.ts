import type { Attempt } from "./types";

// What ジャビ子 says when the learner opens Today (#866). Everything comes
// from the real attempt history -- no invented goals or points.
//
// "Today" is the learner's LOCAL calendar day: a greeting that says 今天 must
// roll over at the learner's midnight, not at UTC midnight (08:00 in Taipei).
// Imports only ./types so it stays safe for the eager home bundle.

export type TimeOfDay = "morning" | "day" | "evening";

export type GreetingKind =
  // No history at all: ジャビ子 introduces herself.
  | "welcome"
  // Practised today and the streak spans more than today.
  | "keepGoing"
  // Practised today, first day of a (new) streak.
  | "practicedToday"
  // Not yet today, but yesterday was active: today keeps the streak alive.
  | "streakWaiting"
  // Has history, no live streak.
  | "returning";

export interface TodayGreeting {
  kind: GreetingKind;
  streakDays: number;
  answeredToday: number;
  timeOfDay: TimeOfDay;
}

export function timeOfDay(hour: number): TimeOfDay {
  if (hour >= 5 && hour < 11) return "morning";
  if (hour >= 11 && hour < 17) return "day";
  return "evening";
}

function localDayStart(timestamp: number): number {
  const date = new Date(timestamp);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

// The local day before `dayStart` (DST-safe: built from calendar fields).
function previousLocalDay(dayStart: number): number {
  const date = new Date(dayStart);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1).getTime();
}

export function answeredOnLocalDay(attempts: readonly Attempt[], now: number): number {
  const today = localDayStart(now);
  return attempts.filter((item) => localDayStart(item.timestamp) === today).length;
}

/** Consecutive local calendar days with at least one attempt, ending today or
 *  yesterday (a streak stays alive until the learner's day is over). */
export function localDayStreak(attempts: readonly Attempt[], now: number): number {
  if (attempts.length === 0) return 0;
  const activeDays = new Set(attempts.map((item) => localDayStart(item.timestamp)));
  const today = localDayStart(now);
  const yesterday = previousLocalDay(today);
  let cursor = activeDays.has(today) ? today : activeDays.has(yesterday) ? yesterday : null;
  let streak = 0;
  while (cursor !== null && activeDays.has(cursor)) {
    streak += 1;
    cursor = previousLocalDay(cursor);
  }
  return streak;
}

export function todayGreeting(attempts: readonly Attempt[], now: number): TodayGreeting {
  const answeredToday = answeredOnLocalDay(attempts, now);
  const streakDays = localDayStreak(attempts, now);
  const period = timeOfDay(new Date(now).getHours());
  let kind: GreetingKind;
  if (attempts.length === 0) kind = "welcome";
  else if (answeredToday > 0) kind = streakDays > 1 ? "keepGoing" : "practicedToday";
  else kind = streakDays > 0 ? "streakWaiting" : "returning";
  return { kind, streakDays, answeredToday, timeOfDay: period };
}

const TIME_GREETING: Record<TimeOfDay, string> = {
  morning: "おはよう！",
  day: "こんにちは！",
  evening: "こんばんは！"
};

// ジャビ子's Japanese line. Like the session interjections (buddyReaction.ts)
// these are part of what the learner is learning, so they are not localized;
// the UI pairs them with a localized gloss.
export function greetingLine(greeting: TodayGreeting): string {
  switch (greeting.kind) {
    case "welcome":
      return "はじめまして！";
    case "keepGoing":
      return "その調子！";
    case "practicedToday":
      return "おかえり！";
    default:
      return TIME_GREETING[greeting.timeOfDay];
  }
}
