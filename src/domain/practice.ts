import {
  ADJECTIVE_FORMS,
  conjugate,
  generateAdjectiveRuleCandidates,
  generateVerbRuleCandidates,
  validateAnswer,
  VERB_FORMS
} from "./conjugation";
import type {
  Attempt,
  JlptLevel,
  PartOfSpeech,
  PracticeQuestion,
  TargetForm,
  VerbGroup,
  VocabularyItem
} from "./types";

export const CHOICE_COUNT = 4;

export interface QuestionOptions {
  partOfSpeech: PartOfSpeech | "mixed";
  verbGroup: VerbGroup | "all";
  targetForms: TargetForm[];
  level?: JlptLevel | "all";
}

export function buildQuestionPool(vocabulary: VocabularyItem[], options: QuestionOptions): PracticeQuestion[] {
  const level = options.level ?? "all";

  return vocabulary
    .filter((item) => level === "all" || item.level === level)
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
    )
    .filter(isMeaningfulQuestion);
}

function isMeaningfulQuestion(question: PracticeQuestion): boolean {
  return question.expectedAnswers.some((answer) => answer !== question.vocabulary.surface);
}

export function scoreAttempt(
  question: PracticeQuestion,
  submittedAnswer: string,
  startedAt: number,
  finishedAt: number = Date.now()
): Attempt {
  return {
    questionId: question.id,
    vocabularyId: question.vocabulary.id,
    targetForm: question.targetForm,
    prompt: question.promptText ?? question.vocabulary.surface,
    expectedAnswers: question.expectedAnswers,
    submittedAnswer,
    isCorrect: validateAnswer(submittedAnswer, question.expectedAnswers),
    timestamp: finishedAt,
    responseTimeMs: Math.max(0, finishedAt - startedAt)
  };
}

export function getMistakeQuestions(attempts: Attempt[], questions: PracticeQuestion[]): PracticeQuestion[] {
  const missedIds = new Set(
    attempts
      .filter((attempt) => !attempt.isCorrect)
      .map((attempt) => attempt.questionId ?? `${attempt.vocabularyId}:${attempt.targetForm}`)
  );

  return questions.filter((question) => missedIds.has(question.id) || missedIds.has(`${question.vocabulary.id}:${question.targetForm}`));
}

/**
 * Cross-session review queue: questions whose MOST RECENT attempt was
 * incorrect. Once the learner answers correctly, that question drops out
 * of the queue -- this is the simplest "SRS-lite" rule that avoids
 * shoving items they've already mastered back into review.
 *
 * Returns questions in attempt-recency order (most-recent miss first),
 * deduplicated by question id. Used by the "弱點複習" practice mode and
 * for the dashboard pending-count badge on the Learn view.
 */
export function getReviewQueue(attempts: Attempt[], pool: PracticeQuestion[]): PracticeQuestion[] {
  const lastIncorrectAt = new Map<string, number>();
  const lastCorrectAt = new Map<string, number>();

  for (const attempt of attempts) {
    const key = attempt.questionId ?? `${attempt.vocabularyId}:${attempt.targetForm}`;
    const target = attempt.isCorrect ? lastCorrectAt : lastIncorrectAt;
    const current = target.get(key) ?? 0;
    if (attempt.timestamp > current) {
      target.set(key, attempt.timestamp);
    }
  }

  // A question is in the queue iff its most recent incorrect attempt is
  // strictly newer than its most recent correct one (or it has no
  // correct one yet).
  const reviewKeys = new Set<string>();
  for (const [key, missedAt] of lastIncorrectAt) {
    if (missedAt > (lastCorrectAt.get(key) ?? 0)) {
      reviewKeys.add(key);
    }
  }

  const matched = pool.filter(
    (question) =>
      reviewKeys.has(question.id) ||
      reviewKeys.has(`${question.vocabulary.id}:${question.targetForm}`)
  );

  // Sort most-recent-miss first so the learner re-encounters fresh
  // mistakes before older ones (cheaper recall = stronger reinforcement).
  return matched.sort((a, b) => {
    const aTime =
      lastIncorrectAt.get(a.id) ?? lastIncorrectAt.get(`${a.vocabulary.id}:${a.targetForm}`) ?? 0;
    const bTime =
      lastIncorrectAt.get(b.id) ?? lastIncorrectAt.get(`${b.vocabulary.id}:${b.targetForm}`) ?? 0;
    return bTime - aTime;
  });
}

export function selectQuestion(questions: PracticeQuestion[], index: number): PracticeQuestion | null {
  if (questions.length === 0) {
    return null;
  }

  return questions[index % questions.length];
}

export function shuffleQuestions(questions: PracticeQuestion[]): PracticeQuestion[] {
  const shuffled = [...questions];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

export function buildChoiceOptions(
  currentQuestion: PracticeQuestion,
  questions: PracticeQuestion[],
  questionIndex: number
): string[] {
  if (currentQuestion.options?.length) {
    return rotateOptions(
      uniqueAnswers([...currentQuestion.expectedAnswers, ...currentQuestion.options]),
      currentQuestion,
      questionIndex
    );
  }

  if (currentQuestion.targetForm === "reading" || currentQuestion.targetForm === "meaning") {
    return buildPoolBasedChoiceOptions(currentQuestion, questions, questionIndex);
  }

  const correctAnswer = currentQuestion.expectedAnswers[0];
  const acceptedAnswers = new Set(currentQuestion.expectedAnswers);
  const vocab = currentQuestion.vocabulary;
  const targetForm = currentQuestion.targetForm;

  const ruleDistractors = buildRuleVariantDistractors(vocab, targetForm, acceptedAnswers);
  const sameWordDistractors = buildSameWordDistractors(vocab, targetForm, acceptedAnswers);
  const fallbackDistractors = uniqueAnswers(
    questions
      .filter(
        (question) =>
          question.vocabulary.id !== vocab.id && question.vocabulary.partOfSpeech === vocab.partOfSpeech
      )
      .flatMap((question) => question.expectedAnswers)
      .filter((answer) => !acceptedAnswers.has(answer) && answer !== vocab.surface)
  );

  const distractors = uniqueAnswers([...ruleDistractors, ...sameWordDistractors, ...fallbackDistractors]);
  const options = [correctAnswer, ...distractors.slice(0, CHOICE_COUNT - 1)];

  return rotateOptions(options, currentQuestion, questionIndex);
}

function buildPoolBasedChoiceOptions(
  currentQuestion: PracticeQuestion,
  questions: PracticeQuestion[],
  questionIndex: number
): string[] {
  const correctAnswer = currentQuestion.expectedAnswers[0];
  const acceptedAnswers = new Set(currentQuestion.expectedAnswers);
  const vocab = currentQuestion.vocabulary;

  const distractors = uniqueAnswers(
    questions
      .filter(
        (question) =>
          question.vocabulary.id !== vocab.id && question.targetForm === currentQuestion.targetForm
      )
      .flatMap((question) => question.expectedAnswers)
      .filter((answer) => !acceptedAnswers.has(answer))
  );

  const options = [correctAnswer, ...distractors.slice(0, CHOICE_COUNT - 1)];

  return rotateOptions(options, currentQuestion, questionIndex);
}

function rotateOptions(options: string[], currentQuestion: PracticeQuestion, questionIndex: number): string[] {
  const offset = options.length > 0 ? (questionIndex + currentQuestion.id.length) % options.length : 0;
  return [...options.slice(offset), ...options.slice(0, offset)];
}

function buildRuleVariantDistractors(
  vocab: VocabularyItem,
  targetForm: TargetForm,
  acceptedAnswers: Set<string>
): string[] {
  const candidates =
    vocab.partOfSpeech === "verb"
      ? vocab.group === "irregular"
        ? []
        : generateVerbRuleCandidates(vocab.surface, targetForm)
      : generateAdjectiveRuleCandidates(vocab, targetForm);

  return candidates.filter(
    (candidate) => !acceptedAnswers.has(candidate) && candidate !== vocab.surface
  );
}

function buildSameWordDistractors(
  vocab: VocabularyItem,
  targetForm: TargetForm,
  acceptedAnswers: Set<string>
): string[] {
  const forms = vocab.partOfSpeech === "verb" ? VERB_FORMS : ADJECTIVE_FORMS;
  const distractors: string[] = [];

  for (const form of forms) {
    if (form === targetForm) continue;

    const result = conjugate(vocab, form);

    for (const answer of result.answers) {
      if (!answer || acceptedAnswers.has(answer) || distractors.includes(answer)) continue;
      if (answer === vocab.surface) continue;
      distractors.push(answer);
    }
  }

  return distractors;
}

function uniqueAnswers(answers: string[]): string[] {
  return Array.from(new Set(answers));
}

function isFormCompatible(item: VocabularyItem, targetForm: TargetForm): boolean {
  if (targetForm === "reading" || targetForm === "meaning") {
    return true;
  }

  if (item.partOfSpeech === "verb") {
    return VERB_FORMS.includes(targetForm);
  }

  return ADJECTIVE_FORMS.includes(targetForm);
}
