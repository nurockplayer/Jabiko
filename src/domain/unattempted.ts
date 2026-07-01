import type { Attempt, PracticeQuestion } from "./types";

// "Unattempted-first" ordering for the exam practice pool (新題優先): items the
// learner has never answered (0 attempts) surface before ones they've already
// done, so new / newly-added content comes up first. The wrong-answer review
// (錯題複習) and 今日練習 modes keep their own ordering -- this only reorders
// the endless exam pool.

/** Set of every question id the learner has ever attempted (any result). */
export function collectAttemptedIds(attempts: Attempt[]): Set<string> {
  const ids = new Set<string>();
  for (const attempt of attempts) {
    // Exam items use the same value for question id and vocabulary id; older
    // attempts may carry only vocabularyId. Add both so a match is robust.
    if (attempt.questionId) ids.add(attempt.questionId);
    if (attempt.vocabularyId) ids.add(attempt.vocabularyId);
  }
  return ids;
}

/**
 * Stable partition: unattempted questions first (in their existing order),
 * then attempted ones (in theirs). A no-op when nothing has been attempted,
 * so a logged-out / fresh learner sees the pool unchanged. Never mutates the
 * input.
 */
export function prioritizeUnattempted(
  questions: PracticeQuestion[],
  attemptedIds: Set<string>
): PracticeQuestion[] {
  if (attemptedIds.size === 0) return questions;
  const fresh: PracticeQuestion[] = [];
  const done: PracticeQuestion[] = [];
  for (const question of questions) {
    (attemptedIds.has(question.id) ? done : fresh).push(question);
  }
  return [...fresh, ...done];
}
