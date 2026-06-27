// Per-question-type accuracy for the dashboard weakness view (#243, phase 2).
//
// Pure aggregator over Attempt[]: groups by questionTypeOf and reports
// answered / correct / accuracy per type, sorted weakest-first so the learner
// sees where to focus. Every attempt is counted uniformly (a revealed answer
// is isCorrect:false, so it lowers accuracy exactly like it does in
// computeProgressStats -- the per-type bars stay consistent with the overall
// accuracy ring). Imports only ./questionType + ./types -> eager-safe.
import type { Attempt } from "../types";
import { questionTypeOf, type QuestionType } from "./questionType";

export interface QuestionTypeStat {
  type: QuestionType;
  answered: number;
  correct: number;
  /** Rounded percentage, 0-100. */
  accuracy: number;
}

/**
 * Accuracy per question type, weakest (lowest accuracy) first; ties broken by
 * most-answered first (a 50% over 20 questions is a louder signal than 50%
 * over 2). Types with no attempts are omitted; returns [] for empty input.
 */
export function computeErrorsByQuestionType(attempts: Attempt[]): QuestionTypeStat[] {
  const byType = new Map<QuestionType, { answered: number; correct: number }>();

  for (const attempt of attempts) {
    const type = questionTypeOf(attempt);
    const bucket = byType.get(type) ?? { answered: 0, correct: 0 };
    bucket.answered += 1;
    if (attempt.isCorrect) bucket.correct += 1;
    byType.set(type, bucket);
  }

  const stats: QuestionTypeStat[] = [];
  for (const [type, { answered, correct }] of byType) {
    stats.push({ type, answered, correct, accuracy: Math.round((correct / answered) * 100) });
  }

  stats.sort((a, b) => a.accuracy - b.accuracy || b.answered - a.answered);
  return stats;
}
