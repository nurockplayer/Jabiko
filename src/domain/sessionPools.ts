// Pure pool-composition helpers for the practice session (issue #102, A).
//
// These were inlined in src/hooks/usePracticeSession.ts; they own all the
// "given a config, build the question pool" logic and depend on NO React
// state, so they live here as plain functions the hook calls from its
// memos. The hook keeps only the React state / memo / handler wiring.
//
// This module reaches the heavy question-data builders (buildExamQuestionPool
// alone pulls ~288 KB of exam items), so it must stay on the lazy
// ChallengePanel chunk: it is imported ONLY by usePracticeSession (which is
// itself imported only by the lazily-loaded ChallengePanel). Importing it
// from any eager module (App / the components barrel / the home or learn
// views) would drag examBlocks back into the initial bundle.
import { ADJECTIVE_FORMS, VERB_FORMS } from "./conjugation";
import { buildClozeQuestionPool } from "./cloze";
import { clozeSentences } from "./cloze-data";
import { buildExamQuestionPool } from "./examBlocks";
import { levelsForRange, type LevelRange } from "./levelRange";
import type { MockExamLevel } from "./mockExam";
import { buildSentencePatternPool, type SentencePatternId } from "./sentencePatterns";
import {
  buildQuestionPool,
  reduceAdjacentClusters,
  shuffleQuestions
} from "./practice";
import type { PartOfSpeech, PracticeQuestion, TargetForm, VerbGroup } from "./types";
import { vocabulary } from "./vocabulary";
import { jlptVocabulary } from "./vocabulary-jlpt";

export function uniqueForms(forms: TargetForm[]): TargetForm[] {
  return Array.from(new Set(forms));
}

const DAILY_TARGET = 20;
// Reserve enough fresh vocab-reading items that their pool-based
// distractors (drawn from same-targetForm peers within the session) can
// always fill a full 4-option grid. Without this floor, a daily set that
// happened to land only 1-2 vocab items would render those 漢字読み
// questions with too few choices.
const DAILY_VOCAB_MIN = Math.floor(DAILY_TARGET / 4);

// Builds the "今日練習" set: due SRS reviews first (capped at half so a
// big backlog still leaves room for variety), then a de-clustered mix of
// fresh vocab (a reserved minimum) + exam items to fill out the session.
// It's a FINITE pass -- the learner works through the set once and gets a
// completion screen, same as review mode. v1 is an even mix; weighting
// toward the learner's weak sections is a follow-up (needs attempt
// metadata).
export function composeDailySet(due: PracticeQuestion[]): PracticeQuestion[] {
  const dueTake = due.slice(0, Math.ceil(DAILY_TARGET / 2));
  // Exclude EVERY due item from the fresh pools -- not just the capped
  // slice -- so an over-cap due item can't slip back in mislabelled as a
  // fresh question (which would drop its most-overdue-first SRS ordering).
  const dueIds = new Set(due.map((question) => question.id));
  const isFresh = (question: PracticeQuestion) => !dueIds.has(question.id);
  const freshSlots = DAILY_TARGET - dueTake.length;

  const vocabFresh = shuffleQuestions(
    buildQuestionPool(jlptVocabulary, {
      partOfSpeech: "mixed",
      verbGroup: "all",
      targetForms: ["reading"]
    }).filter(isFresh)
  ).slice(0, Math.min(DAILY_VOCAB_MIN, freshSlots));
  const examFresh = shuffleQuestions(buildExamQuestionPool().filter(isFresh)).slice(
    0,
    freshSlots - vocabFresh.length
  );

  // De-cluster only the FRESH portion so consecutive fresh questions
  // aren't all the same kind (exam items carry promptLabel; vocab falls
  // back to its targetForm, "reading"). The due block stays first, in its
  // most-overdue-first order -- declustering the whole set would let fresh
  // items slip between due items and break the "reviews first" promise.
  const fresh = reduceAdjacentClusters(
    [...vocabFresh, ...examFresh],
    (question) => question.promptLabel ?? question.targetForm
  );
  return [...dueTake, ...fresh];
}

// Pool size per practice mode, shown on the mode cards so the learner
// can see how big each bank is before picking. Static pools are
// computed once; "basic" is intentionally omitted (its size depends on
// the chosen word type / verb group / form), and "review" is dynamic
// (the due count) so it's read from reviewQueue at render time.
export function buildModeCounts() {
  return {
    cloze: buildClozeQuestionPool(clozeSentences, vocabulary).length,
    pattern: buildSentencePatternPool().length,
    exam: buildExamQuestionPool().length,
    examN1: buildExamQuestionPool(levelsForRange("n1n2") ?? "all").length,
    examN2: buildExamQuestionPool(levelsForRange("n2n3") ?? "all").length,
    examN4: buildExamQuestionPool(levelsForRange("n4n5") ?? "all").length,
    vocab: buildQuestionPool(jlptVocabulary, {
      partOfSpeech: "mixed",
      verbGroup: "all",
      targetForms: ["reading"]
    }).length
  };
}

// Union pool used to materialise the review queue: any question the
// learner has ever encountered (across exam / cloze / pattern / basic)
// could be in their attempt history, so the queue lookup needs to see
// them all. Built once and reused -- this is the same set of question
// factories the four mode-specific branches below call, just unioned.
export function buildAllKnownQuestions(): PracticeQuestion[] {
  return [
    ...buildExamQuestionPool(),
    ...buildClozeQuestionPool(clozeSentences, vocabulary),
    ...buildSentencePatternPool(),
    ...buildQuestionPool(vocabulary, {
      partOfSpeech: "mixed",
      verbGroup: "all",
      targetForms: uniqueForms([
        ...VERB_FORMS,
        ...ADJECTIVE_FORMS,
        "reading",
        "meaning"
      ])
    })
  ];
}

// All the inputs the active-pool builder needs from the React layer. The
// hook derives these from its state (mode flags), props (reviewQueue
// snapshot), and config (filter / partOfSpeech / verbGroup / targetForms
// / levelRange), then hands them in so this stays a pure function.
export type PracticePoolParams = {
  isExamFocus: boolean;
  isClozeFocus: boolean;
  isPatternFocus: boolean;
  isReviewFocus: boolean;
  isVocabFocus: boolean;
  isDailyFocus: boolean;
  examSection?: { level: MockExamLevel; promptLabel: string };
  patternIds?: SentencePatternId[];
  partOfSpeech: PartOfSpeech | "mixed";
  verbGroup: VerbGroup | "all";
  targetForms: TargetForm[];
  levelRange: LevelRange;
  // Snapshot of the SRS due queue taken at session start; used by the
  // review and 今日練習 branches. The hook passes the value captured when
  // its `questions` memo last ran (mode change / explicit reset).
  reviewQueue: PracticeQuestion[];
};

// Derives the active question pool for the current mode. This is the body
// of usePracticeSession's `questions` memo, lifted out verbatim so every
// mode/range branch (section-filtered exam, 綜合 level-range exam, cloze,
// pattern, review snapshot, vocab reading drill, 今日練習, basic drill)
// stays exactly as it was.
export function buildPracticeQuestions(params: PracticePoolParams): PracticeQuestion[] {
  const {
    isExamFocus,
    isClozeFocus,
    isPatternFocus,
    isReviewFocus,
    isVocabFocus,
    isDailyFocus,
    examSection,
    patternIds,
    partOfSpeech,
    verbGroup,
    targetForms,
    levelRange,
    reviewQueue
  } = params;

  if (isExamFocus) {
    // Section-filtered when launched from the 模擬考 picker; the
    // plain "綜合考題庫" mode card leaves examSection unset and
    // mixes every section.
    const section = examSection;
    if (section) {
      return shuffleQuestions(
        buildExamQuestionPool(section.level).filter(
          (question) => question.promptLabel === section.promptLabel
        )
      );
    }
    // 綜合考題庫: optionally narrowed to a level range (N1+N2 / N2+N3).
    return shuffleQuestions(buildExamQuestionPool(levelsForRange(levelRange) ?? "all"));
  }

  if (isClozeFocus) {
    return shuffleQuestions(buildClozeQuestionPool(clozeSentences, vocabulary));
  }

  if (isPatternFocus) {
    return shuffleQuestions(
      buildSentencePatternPool({ patternIds })
    );
  }

  if (isReviewFocus) {
    // Snapshot the SRS queue at session start. Subsequent answers
    // update the LIVE reviewQueue (used by the home banner count),
    // but this useMemo is intentionally NOT re-keyed on it -- see
    // the deps comment below for the regression that fixes.
    // Ordering is preserved (no extra shuffle): getReviewQueue
    // already sorts most-overdue first.
    return reviewQueue;
  }

  if (isVocabFocus) {
    // 単字 mode: N1/N2 reading drill. Reading-only on purpose --
    // for a Chinese-speaking learner the kanji usually telegraphs
    // the meaning (影響 = 影響), so an isolated meaning question is
    // trivial and can't be rescued by stronger distractors. The
    // genuinely hard, JLPT-relevant skill is the READING (よみ):
    // 影響 is えいきょう, not えいきゅう. Meaning is still tested,
    // but in CONTEXT, via the exam pool's 詞彙填空 / 類義替換 /
    // 詞彙用法 sections -- which is the authentic way to test it.
    const levels = levelsForRange(levelRange);
    const vocabSource = levels
      ? jlptVocabulary.filter((item) => item.level != null && levels.includes(item.level))
      : jlptVocabulary;
    const vocabPool = shuffleQuestions(
      buildQuestionPool(vocabSource, {
        partOfSpeech: "mixed",
        verbGroup: "all",
        targetForms: ["reading"]
      })
    );
    // De-run by reading length: consecutive questions then tend to
    // have different-length answers -> different distractor bands ->
    // no "same options twice in a row" feel even when the random
    // shuffle clusters same-length words together.
    return reduceAdjacentClusters(
      vocabPool,
      (question) => String(question.expectedAnswers[0]?.length ?? 0)
    );
  }

  if (isDailyFocus) {
    // Snapshot the current due queue at session start (same as review
    // mode); the live reviewQueue stays excluded from the deps below.
    return composeDailySet(reviewQueue);
  }

  return shuffleQuestions(
    buildQuestionPool(vocabulary, {
      partOfSpeech,
      verbGroup,
      targetForms
    })
  );
}
