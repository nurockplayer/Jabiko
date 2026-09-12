// Mistake pool for the "弱點複習" (weak-point review) queue.
//
// Semantics (#525, reversing #472): a question enters the pool the instant it
// is answered wrong (a "reveal" is recorded as wrong, so it counts) and leaves
// the instant it is answered right ONCE; miss it again and it is back. There
// is no cooldown and no due-date scheduling.
//
// This replaces the earlier Leitner spaced-repetition schedule, whose 2-day
// box-0 cooldown (#472/#244) kept a just-missed item out of the queue for two
// days. New learners who drilled a hundred questions in one sitting therefore
// saw an empty weak-point list and reported it as "my mistakes aren't being
// recorded" (two Supabase feedback reports). The bookmark feature (#470)
// already covers "keep this around to drill on purpose", so the review queue
// can be the simpler, more legible "the questions I most recently got wrong".
//
// State is still DERIVED by replaying Attempt[] chronologically; no schema or
// storage. We keep a Leitner-style `box` purely so the dashboard can count
// "mastered" items (stats.ts: box >= threshold). The load-bearing invariant:
//   box === 0  <=>  the item's MOST RECENT attempt was wrong  <=>  in the pool.
//   - First wrong attempt seeds the item in box 0.
//   - Each subsequent CORRECT attempt promotes one box (capped at SRS_MAX_BOX).
//   - Any wrong attempt resets to box 0.
// So one correct answer clears an item and a later miss re-adds it.
//
// Items never answered wrong are NOT tracked (correct-first-try needs no
// review; seeding brand-new questions is the practice modes' job).
import type { Attempt, PracticeQuestion } from "./types";

// Highest box an item can reach; promotion caps here. Only used to classify
// "mastered" on the dashboard (stats.ts) -- the pool itself is just box 0.
export const SRS_MAX_BOX = 4;

export interface ReviewItemState {
  /** Question id, or fallback "<vocabularyId>:<targetForm>". */
  key: string;
  /** Box index, 0..SRS_MAX_BOX. box === 0 means the last attempt was wrong. */
  box: number;
  /** Timestamp of the most recent attempt (any outcome). */
  lastAttemptAt: number;
}

// Key invariant: scoreAttempt() always records `questionId: question.id`, and
// a basic-drill question's id IS `${vocab.id}:${targetForm}`, so every attempt
// for a given question resolves to the SAME key -- the `??` fallback never
// fires for real attempts. That's why box === 0 is strictly equivalent to
// "this question's most recent attempt was wrong" (no split across key forms).
function attemptKey(attempt: Attempt): string {
  return attempt.questionId ?? `${attempt.vocabularyId}:${attempt.targetForm}`;
}

/**
 * Replay attempts in chronological order to derive each item's current state.
 * Pure: takes attempts, returns a map. box === 0 marks a currently-unresolved
 * mistake; boxes 1+ are cleared items retained only for the mastery count.
 */
export function computeReviewStates(attempts: Attempt[]): Map<string, ReviewItemState> {
  const sorted = [...attempts].sort((a, b) => a.timestamp - b.timestamp);
  const states = new Map<string, ReviewItemState>();

  for (const attempt of sorted) {
    const key = attemptKey(attempt);
    const existing = states.get(key);

    if (!existing) {
      // Only a WRONG first attempt seeds the item; correct-first-try items
      // never enter the tracker.
      if (attempt.isCorrect) continue;
      states.set(key, { key, box: 0, lastAttemptAt: attempt.timestamp });
      continue;
    }

    existing.lastAttemptAt = attempt.timestamp;
    existing.box = attempt.isCorrect ? Math.min(existing.box + 1, SRS_MAX_BOX) : 0;
  }

  return states;
}

/**
 * Questions currently in the mistake pool (most recent attempt was wrong, i.e.
 * box === 0), ordered oldest-unresolved-mistake first so the longest-waiting
 * miss surfaces first. Items whose question is no longer in `pool` are dropped.
 */
export function getMistakePool(
  attempts: Attempt[],
  pool: PracticeQuestion[]
): PracticeQuestion[] {
  const states = computeReviewStates(attempts);
  if (states.size === 0) return [];

  const matched: Array<{ question: PracticeQuestion; state: ReviewItemState }> = [];
  for (const question of pool) {
    const state =
      states.get(question.id) ??
      states.get(`${question.vocabulary.id}:${question.targetForm}`);
    if (!state || state.box !== 0) continue;
    matched.push({ question, state });
  }

  // Oldest unresolved miss first (smallest lastAttemptAt = waiting longest).
  matched.sort((a, b) => a.state.lastAttemptAt - b.state.lastAttemptAt);
  return matched.map((m) => m.question);
}

/**
 * Count questions currently in the mistake pool (box === 0), WITHOUT a
 * question pool -- the lightweight number behind the home/learn badge.
 * (Forcing the pool just for a count would drag the heavy question-data
 * modules into the eager initial bundle.) It can include a state whose
 * question was since removed from the bank (a stale +1 until re-attempted),
 * which is acceptable for a nudge.
 */
export function countMistakes(attempts: Attempt[]): number {
  const states = computeReviewStates(attempts);
  let count = 0;
  for (const state of states.values()) {
    if (state.box === 0) count++;
  }
  return count;
}
