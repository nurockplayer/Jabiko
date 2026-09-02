// Points economy — answer-reward foundation.
//
// Earning is a pure rule replayed over the attempt history (like srs.ts /
// stats.ts): a correct attempt earns POINTS_PER_CORRECT_ANSWER, anything else
// earns nothing. Deriving from attempts means points need no storage of their
// own, ride the existing cross-device attempt sync (#151), and stay consistent
// with the learner's visible stats by construction.
//
// Planned evolution (shop system): spending must NOT rewrite earning history.
// A shop adds a separate spend ledger (its own storage + sync) and the balance
// becomes `computeEarnedPoints(attempts) - totalSpent`. Richer earning rules
// (streak multipliers, level bonuses) change only pointsForAttempt — the
// replay-from-history design re-derives every learner's total under the new
// rule with no migration.
//
// Imports only domain types: safe for the eager home bundle (never pulls the
// exam bank; see the stats.ts header for the same constraint).
import type { Attempt } from "./types";

export const POINTS_PER_CORRECT_ANSWER = 1;

/** Earning rule for a single attempt. The single seam future bonus rules extend. */
export function pointsForAttempt(attempt: Attempt): number {
  return attempt.isCorrect ? POINTS_PER_CORRECT_ANSWER : 0;
}

/** Total points earned over a full attempt history. */
export function computeEarnedPoints(attempts: Attempt[]): number {
  let total = 0;
  for (const attempt of attempts) {
    total += pointsForAttempt(attempt);
  }
  return total;
}
