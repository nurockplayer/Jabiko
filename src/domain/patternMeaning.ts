import { examStyleQuestions } from "./examBlocks";
import { pickLocalized } from "./localizedContent";
import type { LocaleCode, LocalizedText } from "./types";

// pattern (an option string a learner sees in a 文法 question) -> its gloss,
// sourced from wherever that pattern is an exam item's answer or surface in
// the bank. Used post-answer to annotate grammar distractors (ものの ->
// 雖然…但是), turning a wrong pick into a quick "what was that one?" note.
// Carries the per-locale meaning overlays (#400) alongside the zh source so
// the gloss follows the UI language. Built once at module load; only ever
// loaded inside the lazy challenge chunk (examBlocks already lives there).
const patternToMeaning = new Map<string, { meaningZh: string; meaningI18n?: LocalizedText }>();
for (const question of examStyleQuestions) {
  const meaning = question.vocabulary.meaningZh;
  if (!meaning) continue;
  for (const key of [question.vocabulary.surface, ...question.expectedAnswers]) {
    if (key && !patternToMeaning.has(key)) {
      patternToMeaning.set(key, {
        meaningZh: meaning,
        meaningI18n: question.vocabulary.meaningI18n
      });
    }
  }
}

/**
 * Gloss for a grammar pattern if the bank knows it, else null. Localized to
 * `lang` when the sourcing item carries an overlay, falling back to the
 * Chinese source. Distractors not present in the bank stay un-annotated
 * (they are still real patterns -- unlike reading distractors, "not found"
 * is not a content defect here).
 */
export function lookupPatternMeaning(
  pattern: string,
  lang: LocaleCode = "zh-Hant"
): string | null {
  const entry = patternToMeaning.get(pattern);
  return entry ? pickLocalized(entry.meaningZh, entry.meaningI18n, lang) : null;
}
