// Daily activity trend for the home dashboard (#243).
//
// A pure aggregator over the persisted Attempt[] history: it buckets
// attempts by UTC day and returns a DENSE, zero-filled series of the last
// `days` days ending today. "Dense" matters for the chart -- a day with no
// practice must still be a zero-height bar, not a gap, so streaks read
// honestly.
//
// NOTE on labelling: this is attempts-PER-DAY (題數), NOT study time. The
// Attempt schema has responseTimeMs per answer but no session/idle data, so
// a real "study duration" would overstate; the UI calls this 每日練習量.
//
// Like the rest of the analytics layer this imports ONLY ./types, so it is
// safe to use from the eager home bundle (no exam-bank / vocabulary pull).
import type { Attempt } from "../types";

const MS_PER_DAY = 86_400_000;

export interface TrendPoint {
  /** UTC day index, Math.floor(timestamp / MS_PER_DAY). */
  dayBucket: number;
  /** ISO yyyy-mm-dd for the bucket (UTC), for labels/tooltips. */
  date: string;
  /** Attempts answered that day. */
  attempts: number;
  /** Correct attempts that day (<= attempts). */
  correct: number;
}

function bucketToISO(dayBucket: number): string {
  return new Date(dayBucket * MS_PER_DAY).toISOString().slice(0, 10);
}

/**
 * Daily attempt counts for the last `days` days ending on today's bucket.
 * Oldest day first, today last. Always returns exactly `days` points
 * (zero-filled), or [] when `days` < 1. `now` is injectable for tests.
 */
export function computeActivityTrend(
  attempts: Attempt[],
  days: number,
  now: number = Date.now()
): TrendPoint[] {
  if (days < 1) return [];

  const todayBucket = Math.floor(now / MS_PER_DAY);
  const startBucket = todayBucket - (days - 1);

  const points: TrendPoint[] = [];
  const byBucket = new Map<number, TrendPoint>();
  for (let bucket = startBucket; bucket <= todayBucket; bucket++) {
    const point: TrendPoint = {
      dayBucket: bucket,
      date: bucketToISO(bucket),
      attempts: 0,
      correct: 0
    };
    points.push(point);
    byBucket.set(bucket, point);
  }

  for (const attempt of attempts) {
    const point = byBucket.get(Math.floor(attempt.timestamp / MS_PER_DAY));
    if (!point) continue; // outside the window
    point.attempts += 1;
    if (attempt.isCorrect) point.correct += 1;
  }

  return points;
}
