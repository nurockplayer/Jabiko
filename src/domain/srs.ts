// Leitner-style spaced repetition for the review queue.
//
// The previous review queue was binary: get a question wrong -> it's
// in the queue, get it right -> out forever (until you miss again).
// That works for "fix recent misses" but degrades for long-horizon
// retention: an item answered right ONCE still gets forgotten in two
// weeks. JLPT prep runs 3-6 months, so we need item resurfacing.
//
// SRS rules implemented here:
//   - First incorrect attempt seeds the item in box 0. Box 0 rests 2 days
//     before the item is due again. #244 originally set this to ~1 hour
//     (clear the session, resurface same-day), but learner feedback (#472)
//     was that a same-day repeat trains answer POSITION, not recall -- the
//     card comes back before you've actually forgotten it. So box 0 now
//     waits a couple of days, matching the "2-3 days, not immediately"
//     request. (A per-user "exam sprint" mode that restores the short
//     cooldown is deferred -- see #472; it needs a settings surface.)
//   - Each subsequent CORRECT attempt promotes one box, growing the
//     interval (2 -> 4 -> 7 -> 14 -> 30 days).
//   - Any INCORRECT attempt resets to box 0 (back to the 2-day rest).
//   - Items capped at MAX_BOX (30-day interval). Capping there matches a
//     typical JLPT-prep cadence where exam day is the goal, not lifelong
//     retention; going further is a one-line constant change.
//   - dueAt = lastAttemptAt + boxInterval. "Due" means dueAt <= now.
//
// State is DERIVED from the existing Attempt[] each call. No schema
// migration, no new storage; the trade-off is recomputing on every
// dashboard tick, which for a few hundred attempts is microseconds.
//
// Items that have NEVER been answered incorrectly are NOT in the
// queue. The SRS review queue is "things I got wrong"; introducing
// brand-new questions is a separate concern (the practice modes
// themselves seed those).
import type { Attempt, PracticeQuestion } from "./types";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Box 0 = 2 days: a missed item rests a couple of days before returning,
// so review is genuine recall rather than same-day position-memorising
// (#472). Boxes 1+ widen the spacing toward exam-prep horizons.
export const SRS_INTERVAL_DAYS = [2, 4, 7, 14, 30] as const;
export const SRS_MAX_BOX = SRS_INTERVAL_DAYS.length - 1;

export interface ReviewItemState {
  /** Question id, or fallback "<vocabularyId>:<targetForm>". */
  key: string;
  /** Box index, 0..SRS_MAX_BOX. Higher box = longer interval. */
  box: number;
  /** Timestamp of the most recent attempt (any outcome). */
  lastAttemptAt: number;
  /** Timestamp when the question next becomes due. */
  dueAt: number;
}

function attemptKey(attempt: Attempt): string {
  return attempt.questionId ?? `${attempt.vocabularyId}:${attempt.targetForm}`;
}

function questionMatchesKey(question: PracticeQuestion, key: string): boolean {
  return question.id === key || `${question.vocabulary.id}:${question.targetForm}` === key;
}

/**
 * Replay attempts in chronological order to derive each item's
 * current SRS state. Pure function; takes attempts, returns a map.
 */
export function computeReviewStates(attempts: Attempt[]): Map<string, ReviewItemState> {
  const sorted = [...attempts].sort((a, b) => a.timestamp - b.timestamp);
  const states = new Map<string, ReviewItemState>();

  for (const attempt of sorted) {
    const key = attemptKey(attempt);
    const existing = states.get(key);

    if (!existing) {
      // The item is "new to the review tracker". Only seed state on
      // the first INCORRECT attempt -- correct-first-try items never
      // enter the queue.
      if (attempt.isCorrect) continue;
      states.set(key, {
        key,
        box: 0,
        lastAttemptAt: attempt.timestamp,
        dueAt: attempt.timestamp + SRS_INTERVAL_DAYS[0] * MS_PER_DAY
      });
      continue;
    }

    if (attempt.isCorrect) {
      const nextBox = Math.min(existing.box + 1, SRS_MAX_BOX);
      existing.box = nextBox;
      existing.lastAttemptAt = attempt.timestamp;
      existing.dueAt = attempt.timestamp + SRS_INTERVAL_DAYS[nextBox] * MS_PER_DAY;
    } else {
      existing.box = 0;
      existing.lastAttemptAt = attempt.timestamp;
      existing.dueAt = attempt.timestamp + SRS_INTERVAL_DAYS[0] * MS_PER_DAY;
    }
  }

  return states;
}

/**
 * Returns questions whose SRS state is currently due (dueAt <= now),
 * sorted most-overdue-first. `now` is injectable for testing; default
 * Date.now().
 *
 * Items not yet due (still resting between intervals) are deliberately
 * excluded -- that's the SRS contract: spaced items rest while
 * recently-missed items take priority.
 */
export function getDueQuestions(
  attempts: Attempt[],
  pool: PracticeQuestion[],
  now: number = Date.now()
): PracticeQuestion[] {
  const states = computeReviewStates(attempts);
  if (states.size === 0) return [];

  const matchedWithState: Array<{ question: PracticeQuestion; state: ReviewItemState }> = [];
  for (const question of pool) {
    const state =
      states.get(question.id) ??
      states.get(`${question.vocabulary.id}:${question.targetForm}`);
    if (!state) continue;
    if (state.dueAt > now) continue;
    matchedWithState.push({ question, state });
  }

  // Sort most-overdue first (smallest dueAt = oldest = most urgent).
  matchedWithState.sort((a, b) => a.state.dueAt - b.state.dueAt);
  return matchedWithState.map((m) => m.question);
}

/**
 * Count items currently due (dueAt <= now), WITHOUT a question pool.
 *
 * This is the lightweight count behind the home/learn "N 個等待複習"
 * badge. getDueQuestions needs the full question pool to return the
 * actual review items (and to drop states whose question no longer
 * exists), but the badge only needs a number -- and forcing the pool
 * just for a count would pull the heavy question-data modules into the
 * eager initial bundle. The trade-off: this can include a state whose
 * question was since removed from the bank (a stale +1 until that item
 * ages out), which is acceptable for a nudge.
 */
export function countDueReviews(attempts: Attempt[], now: number = Date.now()): number {
  const states = computeReviewStates(attempts);
  let count = 0;
  for (const state of states.values()) {
    if (state.dueAt <= now) count++;
  }
  return count;
}

/**
 * Count items scheduled to come due within the next `daysAhead` days.
 * Excludes items already due (those go to getDueQuestions). Useful for
 * "X coming up this week" forward-looking UI if we ever add it.
 */
export function countUpcoming(
  attempts: Attempt[],
  daysAhead: number,
  now: number = Date.now()
): number {
  const states = computeReviewStates(attempts);
  const cutoff = now + daysAhead * MS_PER_DAY;
  let count = 0;
  for (const state of states.values()) {
    if (state.dueAt > now && state.dueAt <= cutoff) count++;
  }
  return count;
}

// Re-export so callers don't need to know the helper exists.
export { questionMatchesKey };
