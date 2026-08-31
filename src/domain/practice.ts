import {
  ADJECTIVE_FORMS,
  conjugate,
  generateAdjectiveRuleCandidates,
  generateVerbRuleCandidates,
  validateAnswer,
  VERB_FORMS
} from "./conjugation";
import { getMistakePool } from "./srs";
import { generateReadingConfusers } from "./readingConfusers";
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

// How many of the most-similar candidates form the pool we sample
// distractors from. Strict top-(CHOICE_COUNT-1) converges: questions
// with similar answers keep drawing the same globally-closest readings.
// A band + per-question seeded sample keeps distractors confusable but
// varied. 8 is wide enough for variety (C(8,3)=56 combos) while staying
// in the high-similarity tier.
const DISTRACTOR_BAND = 8;

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
            explanation: result.explanation,
            explanationI18n: result.explanationI18n
          };
        })
    )
    .filter(isMeaningfulQuestion);
}

function isMeaningfulQuestion(question: PracticeQuestion): boolean {
  return question.expectedAnswers.some((answer) => answer !== question.vocabulary.surface);
}

export function isRecallEligibleQuestion(question: PracticeQuestion): boolean {
  return (
    question.vocabulary.partOfSpeech === "verb" &&
    question.targetForm !== "reading" &&
    question.targetForm !== "meaning" &&
    question.promptText === undefined &&
    question.options === undefined &&
    question.id === `${question.vocabulary.id}:${question.targetForm}`
  );
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
 * Cross-session weak-point review queue: the questions whose most recent
 * attempt was wrong (the mistake pool -- see ./srs.ts). Wrong -> in the queue
 * immediately; one correct answer -> out; missed again -> back. Oldest
 * unresolved miss first. (#525 replaced the earlier SRS cooldown schedule,
 * whose 2-day rest made a just-missed item look "not recorded".)
 */
export function getReviewQueue(
  attempts: Attempt[],
  pool: PracticeQuestion[]
): PracticeQuestion[] {
  return getMistakePool(attempts, pool);
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

  if (currentQuestion.targetForm === "reading") {
    return buildReadingChoiceOptions(currentQuestion, questions, questionIndex);
  }

  if (currentQuestion.targetForm === "meaning") {
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
  const isReading = currentQuestion.targetForm === "reading";

  // Collect candidate distractor strings from other items sharing this
  // targetForm, keeping each candidate's part of speech so meaning
  // distractors can prefer the same word class.
  const seen = new Set<string>(acceptedAnswers);
  const candidates: Array<{ text: string; pos: PartOfSpeech }> = [];
  for (const question of questions) {
    if (question.vocabulary.id === vocab.id) continue;
    if (question.targetForm !== currentQuestion.targetForm) continue;
    const text = question.expectedAnswers[0];
    if (!text || seen.has(text)) continue;
    seen.add(text);
    candidates.push({ text, pos: question.vocabulary.partOfSpeech });
  }

  // Rank candidates by similarity to the correct answer, then take the
  // top few. Two problems this fixes vs the old `.slice(0, 3)`:
  //   1. "shared options": the old code sliced the first 3 of a
  //      session-fixed pool order, so almost every question showed the
  //      same 3 distractors. Ranking by similarity-to-THIS-answer makes
  //      the picked set differ per question (the ranking is relative to
  //      each answer).
  //   2. "weak distractors": random pool entries were trivially
  //      eliminable. Reading distractors now match mora count / edge
  //      kana (realistic misreadings); meaning distractors prefer the
  //      same part of speech.
  // Deterministic tiebreak (hash of candidate + question id) keeps the
  // option set stable across re-renders -- no reshuffle on answer.
  const ranked = candidates
    .map((candidate) => ({
      text: candidate.text,
      score: isReading
        ? readingSimilarity(correctAnswer, candidate.text)
        : meaningDistractorScore(vocab.partOfSpeech, candidate.pos, correctAnswer, candidate.text),
      tiebreak: hashString(candidate.text + currentQuestion.id)
    }))
    .sort((a, b) => b.score - a.score || a.tiebreak - b.tiebreak)
    .map((entry) => entry.text);

  // Sample the distractors from a similarity band rather than taking the
  // strict top few -- see DISTRACTOR_BAND. Seed is the question id hash,
  // so the pick is deterministic (stable across re-renders, no
  // reshuffle-on-answer) yet differs between questions.
  const band = ranked.slice(0, Math.min(ranked.length, DISTRACTOR_BAND));
  const picked = seededSample(band, CHOICE_COUNT - 1, hashString(currentQuestion.id));
  const options = [correctAnswer, ...picked];

  return rotateOptions(options, currentQuestion, questionIndex);
}

// Reading drills get PERTURBATION distractors: variants of the correct
// reading along the axes learners confuse -- voicing (か/が), long vowels
// (こう/こ), gemination (がっこう/がこう). These are far more testing than
// "some other word's reading". The pool (other readings) is only a
// top-up when a short reading yields fewer than CHOICE_COUNT-1
// perturbations. Sampling is seeded by the question id so the option set
// is stable across re-renders (no reshuffle after answering).
function buildReadingChoiceOptions(
  currentQuestion: PracticeQuestion,
  questions: PracticeQuestion[],
  questionIndex: number
): string[] {
  const correctAnswer = currentQuestion.expectedAnswers[0];
  const acceptedAnswers = new Set(currentQuestion.expectedAnswers);
  const vocab = currentQuestion.vocabulary;
  const seed = hashString(currentQuestion.id);

  let distractors = seededSample(
    generateReadingConfusers(correctAnswer, acceptedAnswers),
    CHOICE_COUNT - 1,
    seed
  );

  if (distractors.length < CHOICE_COUNT - 1) {
    const used = new Set<string>([...acceptedAnswers, ...distractors]);
    const poolCandidates: string[] = [];
    for (const question of questions) {
      if (question.vocabulary.id === vocab.id) continue;
      if (question.targetForm !== "reading") continue;
      const text = question.expectedAnswers[0];
      if (!text || used.has(text)) continue;
      used.add(text);
      poolCandidates.push(text);
    }
    const ranked = poolCandidates
      .map((text) => ({
        text,
        score: readingSimilarity(correctAnswer, text),
        tiebreak: hashString(text + currentQuestion.id)
      }))
      .sort((a, b) => b.score - a.score || a.tiebreak - b.tiebreak)
      .map((entry) => entry.text);
    const band = ranked.slice(0, Math.min(ranked.length, DISTRACTOR_BAND));
    const topUp = seededSample(band, CHOICE_COUNT - 1 - distractors.length, seed ^ 0x9e3779b9);
    distractors = uniqueAnswers([...distractors, ...topUp]);
  }

  const options = [correctAnswer, ...distractors.slice(0, CHOICE_COUNT - 1)];
  return rotateOptions(options, currentQuestion, questionIndex);
}

/**
 * Phonetic plausibility of a wrong reading vs the correct one. Higher =
 * more confusable = better distractor. Rewards matching mora count and
 * shared edge kana, which is how learners actually mis-read a word.
 */
export function readingSimilarity(correct: string, candidate: string): number {
  let score = 0;
  const lenDiff = Math.abs(correct.length - candidate.length);
  if (lenDiff === 0) score += 4;
  else if (lenDiff === 1) score += 2;
  else if (lenDiff === 2) score += 1;
  if (correct[0] === candidate[0]) score += 2; // same onset kana
  if (correct[correct.length - 1] === candidate[candidate.length - 1]) score += 1; // same coda kana
  // Shared kana (captures long-vowel う / 促音 っ / general overlap).
  const correctChars = new Set([...correct]);
  let shared = 0;
  for (const ch of new Set([...candidate])) {
    if (correctChars.has(ch)) shared += 1;
  }
  return score + Math.min(shared, 3);
}

/**
 * Distractor strength for a meaning question. Same part of speech is the
 * strongest signal (keeps nouns with nouns, na-adjectives with
 * na-adjectives); a similar length is a weak secondary nudge.
 */
function meaningDistractorScore(
  answerPos: PartOfSpeech,
  candidatePos: PartOfSpeech,
  correct: string,
  candidate: string
): number {
  let score = 0;
  if (candidatePos === answerPos) score += 3;
  if (Math.abs(correct.length - candidate.length) <= 1) score += 1;
  return score;
}

/** Stable unsigned 32-bit string hash for deterministic tiebreaks. */
function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (Math.imul(hash, 31) + value.charCodeAt(i)) | 0;
  }
  return hash >>> 0;
}

/** Small deterministic PRNG (mulberry32). Seeded so distractor sampling
 *  is reproducible per question -- stable across re-renders. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Deterministic seeded sample: seeded Fisher-Yates, take first `count`. */
function seededSample<T>(items: T[], count: number, seed: number): T[] {
  const arr = [...items];
  const rand = mulberry32(seed);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, count);
}

/**
 * Single greedy pass that pulls apart runs of same-key items: whenever an
 * item shares its key with the previous item, swap in the next later item
 * that has a different key. Preserves the input set and most of the
 * incoming (already-shuffled) order, just de-runs adjacency.
 *
 * Used for vocab reading drills keyed by reading length: consecutive
 * questions then tend to have different answer lengths, which means
 * different distractor bands, which kills the "every question looks the
 * same" feel even when the random shuffle happens to cluster.
 */
export function reduceAdjacentClusters<T>(items: T[], keyFn: (item: T) => string): T[] {
  const result = [...items];
  for (let i = 1; i < result.length; i++) {
    if (keyFn(result[i]) !== keyFn(result[i - 1])) continue;
    for (let j = i + 1; j < result.length; j++) {
      if (keyFn(result[j]) !== keyFn(result[i - 1])) {
        [result[i], result[j]] = [result[j], result[i]];
        break;
      }
    }
  }
  return result;
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

  // Adverbs (e.g. 漫然/突如) have no conjugation; only the reading/meaning
  // drills above apply to them -- never generate a conjugation question.
  if (item.partOfSpeech === "adverb") {
    return false;
  }

  if (item.partOfSpeech === "verb") {
    return VERB_FORMS.includes(targetForm);
  }

  return ADJECTIVE_FORMS.includes(targetForm);
}
