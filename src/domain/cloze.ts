import { conjugate, TARGET_FORM_LABELS, TARGET_FORM_LABELS_I18N } from "./conjugation";
import type { ConjugationResult, JlptLevel, LocalizedText, PracticeQuestion, TargetForm, VocabularyItem } from "./types";

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
      explanationI18n: { en: explanation.en, ja: explanation.ja },
      promptLabel: `文中変化・${sentence.grammarPoint}`,
      promptText,
      promptContextZh: sentence.translationZh,
      promptContextI18n: sentence.translationI18n,
      instructionZh: "從句意挑出正確的變化形。",
      instructionI18n: {
        en: "Choose the form that fits the meaning of the sentence.",
        ja: "文の意味に合う形を選んでください。"
      },
      options
    });
  }

  return questions;
}

function buildExplanation(
  sentence: ClozeSentence,
  vocab: VocabularyItem,
  correctAnswer: string,
  correctResult: ConjugationResult
): { zh: string; en: string; ja: string } {
  const targetLabel = TARGET_FORM_LABELS[sentence.targetForm] ?? sentence.targetForm;
  const labelI18n = TARGET_FORM_LABELS_I18N[sentence.targetForm];
  const labelEn = labelI18n?.en ?? sentence.targetForm;
  const labelJa = labelI18n?.ja ?? sentence.targetForm;
  // Sentence translations fall back to zh until per-locale data lands (#427).
  const translationEn = sentence.translationI18n?.en ?? sentence.translationZh;
  const translationJa = sentence.translationI18n?.ja ?? sentence.translationZh;

  return {
    zh: [
      `句意：${sentence.translationZh}`,
      `文法重點：${sentence.grammarPoint} → 此處需要${targetLabel}「${correctAnswer}」（${vocab.surface}的${targetLabel}）。`,
      correctResult.explanation
    ].join("\n"),
    en: [
      `Sentence meaning: ${translationEn}`,
      `Grammar point: ${sentence.grammarPoint} → this blank needs the ${labelEn} 「${correctAnswer}」 (the ${labelEn} of ${vocab.surface}).`,
      correctResult.explanationI18n?.en ?? correctResult.explanation
    ].join("\n"),
    ja: [
      `文の意味：${translationJa}`,
      `文法ポイント：${sentence.grammarPoint} → ここには${labelJa}「${correctAnswer}」（${vocab.surface}の${labelJa}）が入ります。`,
      correctResult.explanationI18n?.ja ?? correctResult.explanation
    ].join("\n")
  };
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
