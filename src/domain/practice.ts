import { ADJECTIVE_FORMS, conjugate, validateAnswer, VERB_FORMS } from "./conjugation";
import type { Attempt, PartOfSpeech, PracticeQuestion, TargetForm, VerbGroup, VocabularyItem } from "./types";

export interface QuestionOptions {
  partOfSpeech: PartOfSpeech | "mixed";
  verbGroup: VerbGroup | "all";
  targetForms: TargetForm[];
}

export function buildQuestionPool(vocabulary: VocabularyItem[], options: QuestionOptions): PracticeQuestion[] {
  return vocabulary
    .filter((item) => options.partOfSpeech === "mixed" || item.partOfSpeech === options.partOfSpeech)
    .filter((item) => item.partOfSpeech !== "verb" || options.verbGroup === "all" || item.group === options.verbGroup)
    .flatMap((item) =>
      options.targetForms
        .filter((targetForm) => isFormCompatible(item, targetForm))
        .map((targetForm) => {
          const result = conjugate(item, targetForm);
          return {
            id: `${item.id}:${targetForm}`,
            vocabulary: item,
            targetForm,
            expectedAnswers: result.answers,
            explanation: result.explanation
          };
        })
    );
}

export function scoreAttempt(
  question: PracticeQuestion,
  submittedAnswer: string,
  startedAt: number,
  finishedAt: number = Date.now()
): Attempt {
  return {
    vocabularyId: question.vocabulary.id,
    targetForm: question.targetForm,
    prompt: question.vocabulary.surface,
    expectedAnswers: question.expectedAnswers,
    submittedAnswer,
    isCorrect: validateAnswer(submittedAnswer, question.expectedAnswers),
    timestamp: finishedAt,
    responseTimeMs: Math.max(0, finishedAt - startedAt)
  };
}

export function getMistakeQuestions(attempts: Attempt[], questions: PracticeQuestion[]): PracticeQuestion[] {
  const missedIds = new Set(
    attempts.filter((attempt) => !attempt.isCorrect).map((attempt) => `${attempt.vocabularyId}:${attempt.targetForm}`)
  );

  return questions.filter((question) => missedIds.has(question.id));
}

export function selectQuestion(questions: PracticeQuestion[], index: number): PracticeQuestion | null {
  if (questions.length === 0) {
    return null;
  }

  return questions[index % questions.length];
}

function isFormCompatible(item: VocabularyItem, targetForm: TargetForm): boolean {
  if (item.partOfSpeech === "verb") {
    return VERB_FORMS.includes(targetForm);
  }

  return ADJECTIVE_FORMS.includes(targetForm);
}
