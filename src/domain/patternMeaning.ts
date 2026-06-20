import { examStyleQuestions } from "./examBlocks";

// pattern (an option string a learner sees in a 文法 question) -> its
// Chinese gloss, sourced from wherever that pattern is an exam item's
// answer or surface in the bank. Used post-answer to annotate grammar
// distractors (ものの -> 雖然…但是), turning a wrong pick into a quick
// "what was that one?" note. Built once at module load; only ever loaded
// inside the lazy challenge chunk (examBlocks already lives there).
const patternToMeaning = new Map<string, string>();
for (const question of examStyleQuestions) {
  const meaning = question.vocabulary.meaningZh;
  if (!meaning) continue;
  for (const key of [question.vocabulary.surface, ...question.expectedAnswers]) {
    if (key && !patternToMeaning.has(key)) {
      patternToMeaning.set(key, meaning);
    }
  }
}

/**
 * Chinese gloss for a grammar pattern if the bank knows it, else null.
 * Distractors not present in the bank stay un-annotated (they are still
 * real patterns -- unlike reading distractors, "not found" is not a
 * content defect here).
 */
export function lookupPatternMeaning(pattern: string): string | null {
  return patternToMeaning.get(pattern) ?? null;
}
