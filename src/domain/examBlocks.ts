import type { JlptLevel, PracticeQuestion } from "./types";
import { n1Items } from "./exam/items/n1";
import { n2Items } from "./exam/items/n2";
import { n3Items } from "./exam/items/n3";
import { n4Items } from "./exam/items/n4";
import { n5Items } from "./exam/items/n5";

// Exam-style question bank, split by JLPT level (issue #99). The per-level
// item arrays live in ./exam/items/*.ts; the ExamQuestionInput type is in
// ./exam/types.ts and the examQuestion() factory in ./exam/helpers.ts. This
// module only aggregates them and exposes the pool builders, so existing
// imports of `examStyleQuestions` / `buildExamQuestionPool` keep working.
//
// This whole module (and its item chunks) is reached only via the lazy
// ChallengePanel / MockExamPanel imports, so the ~288 KB of question data
// stays out of the initial bundle.
export const examStyleQuestions: PracticeQuestion[] = [
  ...n1Items,
  ...n2Items,
  ...n3Items,
  ...n4Items,
  ...n5Items
];

// Warm-up cap: how many N3 items leak into the default "all" pool so they
// don't dilute the N1/N2 focus. Declared before its consumer below.
const MAX_N3_IN_DEFAULT_POOL = 6;

export function buildExamQuestionPool(
  level: JlptLevel | JlptLevel[] | "all" = "all"
): PracticeQuestion[] {
  // A level RANGE (e.g. ["N1","N2"] / ["N2","N3"]) -- keep every item in
  // those levels, no N3 warm-up trimming (the caller asked for that band
  // explicitly).
  if (Array.isArray(level)) {
    const levels = new Set(level);
    return examStyleQuestions.filter(
      (question) => question.vocabulary.level !== undefined && levels.has(question.vocabulary.level)
    );
  }
  if (level === "N1" || level === "N2" || level === "N3" || level === "N4" || level === "N5") {
    return examStyleQuestions.filter((question) => question.vocabulary.level === level);
  }

  // For the default "all" pool, focus on N1/N2 (the user's target) and
  // keep only a small warm-up subset of N3 items so they don't dilute
  // the high-level practice. The full N3 set is still reachable via
  // an explicit buildExamQuestionPool("N3") call.
  const n1AndN2 = examStyleQuestions.filter((q) => q.vocabulary.level === "N1" || q.vocabulary.level === "N2");
  const n3WarmUp = examStyleQuestions
    .filter((q) => q.vocabulary.level === "N3")
    .slice(0, MAX_N3_IN_DEFAULT_POOL);
  return [...n1AndN2, ...n3WarmUp];
}
