// Question-type decoder for the dashboard weakness view (#243, phase 2).
//
// Mirrors stats.ts levelFromQuestionId: it reads the TYPE from an attempt's
// id rather than needing the question bank, so it stays eager-safe (imports
// only ./types). Exam items are id'd `n{1-5}-{type}-…` (grammar/vocab/kanji/
// syn/usage/context/read/order/text); the non-exam practice modes use their
// own id namespaces (cloze:… / pattern-… / `vocabId:targetForm`).
//
// This is the single type decoder the weakness metrics build on, and the same
// brick a future 2-D level×type heatmap / #242 recommendation layer will reuse.
import type { Attempt } from "../types";

/** Exam-item question types, in display order (matches the id 2nd segment). */
export const EXAM_QUESTION_TYPES = [
  "grammar",
  "vocab",
  "kanji",
  "syn",
  "usage",
  "context",
  "read",
  "order",
  "text"
] as const;

export type ExamQuestionType = (typeof EXAM_QUESTION_TYPES)[number];

/** All buckets: the 9 exam types, then the non-exam practice modes. */
export type QuestionType = ExamQuestionType | "cloze" | "pattern" | "basic";

// Ordered list of every bucket. Exported (its test pins order + uniqueness);
// also reserved for the planned 2-D level×type weakness heatmap (#243/#242).
export const QUESTION_TYPES: readonly QuestionType[] = [
  ...EXAM_QUESTION_TYPES,
  "cloze",
  "pattern",
  "basic"
];

const EXAM_TYPE_SET = new Set<string>(EXAM_QUESTION_TYPES);
const EXAM_ID = /^n[1-5]-([a-z]+)/;

/**
 * Classify an attempt into a question-type bucket from its id. Exam ids map to
 * their 2nd segment; cloze:/pattern- ids map to those modes; everything else
 * (the `vocabId:targetForm` basic/vocab drills, missing ids, or any
 * unrecognised shape) falls back to "basic".
 */
export function questionTypeOf(attempt: Attempt): QuestionType {
  const id = attempt.questionId;
  if (id) {
    const match = EXAM_ID.exec(id);
    if (match && EXAM_TYPE_SET.has(match[1])) return match[1] as ExamQuestionType;
    if (id.startsWith("cloze:")) return "cloze";
    if (id.startsWith("pattern-") || id.startsWith("pattern:")) return "pattern";
  }
  return "basic";
}
