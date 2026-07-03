import { conjugate, TARGET_FORM_LABELS, TARGET_FORM_LABELS_I18N } from "./conjugation";
import {
  CONTENT_LOCALES,
  type ConjugationResult,
  type ContentLocale,
  type JlptLevel,
  type LocalizedText,
  type PracticeQuestion,
  type TargetForm,
  type VocabularyItem
} from "./types";

export interface ClozeSentence {
  id: string;
  prefix: string;
  suffix: string;
  vocabularyId: string;
  targetForm: TargetForm;
  grammarPoint: string;
  translationZh: string;
  /** Per-locale translations of `translationZh`; falls back to the zh source (#427). */
  translationI18n?: LocalizedText;
  level?: JlptLevel;
  /** Override default distractor strategy for this sentence. */
  distractorForms?: TargetForm[];
}

export interface ClozePoolOptions {
  level?: JlptLevel | "all";
}

const BLANK_MARKER = "＿＿＿";

const DEFAULT_DISTRACTORS_BY_FORM: Partial<Record<TargetForm, TargetForm[]>> = {
  te: ["ta", "masu", "nai"],
  ta: ["te", "masu", "plainPresentAffirmative"],
  nai: ["negativeTe", "negativeContinuative", "plainPastNegative"],
  masu: ["plainPresentAffirmative", "te", "ta"],
  negativeTe: ["nai", "negativeContinuative", "plainPastNegative"],
  negativeContinuative: ["nai", "negativeTe", "plainPastNegative"],
  potential: ["plainPresentAffirmative", "ta", "nai"],
  volitional: ["masu", "plainPresentAffirmative", "te"],
  desiderative: ["masu", "ta", "te"],
  plainPastNegative: ["nai", "negativeTe", "negativeContinuative"],
  plainPastAffirmative: ["ta", "plainPresentAffirmative", "nai"]
};

export function buildClozeQuestionPool(
  sentences: ClozeSentence[],
  vocabulary: VocabularyItem[],
  options: ClozePoolOptions = {}
): PracticeQuestion[] {
  const level = options.level ?? "all";
  const vocabularyById = new Map(vocabulary.map((item) => [item.id, item]));
  const questions: PracticeQuestion[] = [];

  for (const sentence of sentences) {
    if (level !== "all" && sentence.level && sentence.level !== level) continue;

    const vocab = vocabularyById.get(sentence.vocabularyId);
    if (!vocab) continue;

    const correctResult = conjugate(vocab, sentence.targetForm);
    const correctAnswer = correctResult.answers[0];
    if (!correctAnswer) continue;

    const distractorForms = sentence.distractorForms ?? DEFAULT_DISTRACTORS_BY_FORM[sentence.targetForm] ?? [];
    const acceptedAnswers = new Set(correctResult.answers);
    const distractors: string[] = [];

    for (const form of distractorForms) {
      const result = conjugate(vocab, form);
      for (const answer of result.answers) {
        if (!answer) continue;
        if (acceptedAnswers.has(answer)) continue;
        if (distractors.includes(answer)) continue;
        if (answer === vocab.surface || answer === vocab.reading) continue;
        distractors.push(answer);
      }
      if (distractors.length >= 3) break;
    }

    const options = sortDeterministic([correctAnswer, ...distractors.slice(0, 3)], sentence.id);
    const promptText = `${sentence.prefix}${BLANK_MARKER}${sentence.suffix}`;

    const explanation = buildExplanation(sentence, vocab, correctAnswer, correctResult);

    questions.push({
      id: `cloze:${sentence.id}`,
      vocabulary: vocab,
      targetForm: sentence.targetForm,
      expectedAnswers: correctResult.answers,
      explanation: explanation.zh,
      explanationI18n: explanation.overlay,
      promptLabel: `文中変化・${sentence.grammarPoint}`,
      promptText,
      promptContextZh: sentence.translationZh,
      promptContextI18n: sentence.translationI18n,
      instructionZh: "從句意挑出正確的變化形。",
      instructionI18n: { ...CLOZE_INSTRUCTION },
      options
    });
  }

  return questions;
}

// Per-CONTENT_LOCALE chrome for the generated cloze explanation + instruction
// (#434). Typed against the registry, so adding a code to CONTENT_LOCALES
// compile-forces its phrasing here. The zh source lives inline in
// buildExplanation / the `instructionZh` literal.
const CLOZE_INSTRUCTION: Record<ContentLocale, string> = {
  en: "Choose the form that fits the meaning of the sentence.",
  ja: "文の意味に合う形を選んでください。"
};

const CLOZE_EXPLANATION_TEMPLATE: Record<
  ContentLocale,
  { meaningLine: (translation: string) => string; grammarLine: (parts: GrammarLineParts) => string }
> = {
  en: {
    meaningLine: (t) => `Sentence meaning: ${t}`,
    grammarLine: ({ grammarPoint, label, answer, surface }) =>
      `Grammar point: ${grammarPoint} → this blank needs the ${label} 「${answer}」 (the ${label} of ${surface}).`
  },
  ja: {
    meaningLine: (t) => `文の意味：${t}`,
    grammarLine: ({ grammarPoint, label, answer, surface }) =>
      `文法ポイント：${grammarPoint} → ここには${label}「${answer}」（${surface}の${label}）が入ります。`
  }
};

type GrammarLineParts = { grammarPoint: string; label: string; answer: string; surface: string };

function buildExplanation(
  sentence: ClozeSentence,
  vocab: VocabularyItem,
  correctAnswer: string,
  correctResult: ConjugationResult
): { zh: string; overlay: LocalizedText } {
  const targetLabel = TARGET_FORM_LABELS[sentence.targetForm] ?? sentence.targetForm;
  const zh = [
    `句意：${sentence.translationZh}`,
    `文法重點：${sentence.grammarPoint} → 此處需要${targetLabel}「${correctAnswer}」（${vocab.surface}的${targetLabel}）。`,
    correctResult.explanation
  ].join("\n");

  const overlay: LocalizedText = {};
  for (const loc of CONTENT_LOCALES) {
    const template = CLOZE_EXPLANATION_TEMPLATE[loc];
    const label = TARGET_FORM_LABELS_I18N[sentence.targetForm]?.[loc] ?? sentence.targetForm;
    // Sentence translations fall back to zh until per-locale data lands (#427).
    const translation = sentence.translationI18n?.[loc] ?? sentence.translationZh;
    const base = correctResult.explanationI18n?.[loc] ?? correctResult.explanation;
    overlay[loc] = [
      template.meaningLine(translation),
      template.grammarLine({ grammarPoint: sentence.grammarPoint, label, answer: correctAnswer, surface: vocab.surface }),
      base
    ].join("\n");
  }
  return { zh, overlay };
}

function sortDeterministic(values: string[], seed: string): string[] {
  // Stable shuffle keyed off the sentence id so the same question always
  // shows the same option order across renders, but different sentences
  // don't all put the correct answer in the same slot.
  const seedNum = [...seed].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const indexed = values.map((value, index) => ({ value, key: (index * 31 + seedNum) % 97 }));
  indexed.sort((a, b) => a.key - b.key);
  return indexed.map((entry) => entry.value);
}
