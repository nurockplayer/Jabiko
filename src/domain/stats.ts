// Progress / mastery aggregation for the home dashboard (issue #133).
//
// Everything here is derived from `attempts` + the SRS box state, both of
// which are LIGHTWEIGHT (attempts are the learner's own history; srs.ts
// replays them with no question-bank dependency). It deliberately imports
// only srs + types -- NEVER the exam bank / vocabulary -- so the eager
// home view can show progress without dragging examBlocks into the initial
// bundle. Per-level is read from the exam item id prefix (n1-… → N1), so
// no bank lookup is needed to know an attempt's JLPT level.
import { computeReviewStates } from "./srs";
import type { Attempt, JlptLevel } from "./types";

const MS_PER_DAY = 86_400_000;

// "Mastered" = a previously-missed item drilled up to a high SRS box.
// (Items answered correctly on the first try never enter the SRS queue, so
// this measures recovered weak points rather than total knowledge.) Box 3
// is the 7-day interval -- solidly remembered, not yet fully graduated.
export const MASTERY_BOX = 3;

const LEVELS: JlptLevel[] = ["N1", "N2", "N3", "N4", "N5"];

export type LevelStat = {
  level: JlptLevel;
  answered: number;
  correct: number;
  accuracy: number;
};

export type ProgressStats = {
  totalAnswered: number;
  totalCorrect: number;
  overallAccuracy: number;
  perLevel: LevelStat[];
  masteredCount: number;
  dueCount: number;
  streakDays: number;
};

/** JLPT level of an attempt from its exam item id prefix (n1-… → N1), or
 *  null for non-exam items (basic drills / vocab) that carry no level. */
export function levelFromQuestionId(questionId: string | undefined): JlptLevel | null {
  if (!questionId) return null;
  const match = /^n([1-5])-/.exec(questionId);
  return match ? (`N${match[1]}` as JlptLevel) : null;
}

/** Consecutive calendar days (UTC buckets) with at least one attempt,
 *  ending today or yesterday; 0 if the streak is broken or no attempts. */
export function computeStreakDays(attempts: Attempt[], now: number = Date.now()): number {
  if (attempts.length === 0) return 0;
  const dayOf = (ts: number) => Math.floor(ts / MS_PER_DAY);
  const activeDays = new Set(attempts.map((attempt) => dayOf(attempt.timestamp)));
  const today = dayOf(now);
  // A streak only counts if it reaches today or yesterday; otherwise it's
  // been broken.
  let cursor = activeDays.has(today) ? today : activeDays.has(today - 1) ? today - 1 : null;
  if (cursor === null) return 0;
  let streak = 0;
  while (activeDays.has(cursor)) {
    streak++;
    cursor--;
  }
  return streak;
}

/** Aggregate the learner's progress: overall + per-level accuracy, mastered
 *  count (SRS box ≥ threshold), due count, and the activity streak. Pure;
 *  `now` is injectable for tests. */
export function computeProgressStats(attempts: Attempt[], now: number = Date.now()): ProgressStats {
  const totalAnswered = attempts.length;
  const totalCorrect = attempts.filter((attempt) => attempt.isCorrect).length;
  const overallAccuracy =
    totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

  const perLevel = LEVELS.map((level) => {
    const inLevel = attempts.filter((attempt) => levelFromQuestionId(attempt.questionId) === level);
    const correct = inLevel.filter((attempt) => attempt.isCorrect).length;
    return {
      level,
      answered: inLevel.length,
      correct,
      accuracy: inLevel.length > 0 ? Math.round((correct / inLevel.length) * 100) : 0
    };
  }).filter((stat) => stat.answered > 0);

  // One SRS replay covers both mastered (box ≥ threshold) and due
  // (dueAt ≤ now) -- same definition countDueReviews uses, without a
  // second pass over the attempts.
  const states = computeReviewStates(attempts);
  let masteredCount = 0;
  let dueCount = 0;
  for (const state of states.values()) {
    if (state.box >= MASTERY_BOX) masteredCount++;
    if (state.dueAt <= now) dueCount++;
  }

  return {
    totalAnswered,
    totalCorrect,
    overallAccuracy,
    perLevel,
    masteredCount,
    dueCount,
    streakDays: computeStreakDays(attempts, now)
  };
}
