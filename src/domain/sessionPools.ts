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
import { buildKanaQuestionPool } from "./kanaDrill";
import type { KanaScript } from "./kana";
import { levelsForRange, type LevelRange } from "./levelRange";
import type { MockExamLevel } from "./mockExam";
import type { PracticeMode } from "./practiceMode";
import { buildSentencePatternPool, type SentencePatternId } from "./sentencePatterns";
import {
  buildQuestionPool,
  reduceAdjacentClusters,
  shuffleQuestions
} from "./practice";
import type { PartOfSpeech, PracticeQuestion, TargetForm, VerbGroup } from "./types";
import { prioritizeUnattempted } from "./unattempted";
import { starterVocabulary } from "./starterVocabulary";
import { vocabulary } from "./vocabulary";
import { jlptVocabulary } from "./vocabulary-jlpt";

export function uniqueForms(forms: TargetForm[]): TargetForm[] {
  return Array.from(new Set(forms));
}

function assertNever(value: never): never {
  throw new Error(`Unsupported practice mode: ${String(value)}`);
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
export function composeDailySet(
  due: PracticeQuestion[],
  range: LevelRange = "all"
): PracticeQuestion[] {
  const dueTake = due.slice(0, Math.ceil(DAILY_TARGET / 2));
  // Exclude EVERY due item from the fresh pools -- not just the capped
  // slice -- so an over-cap due item can't slip back in mislabelled as a
  // fresh question (which would drop its most-overdue-first SRS ordering).
  const dueIds = new Set(due.map((question) => question.id));
  const isFresh = (question: PracticeQuestion) => !dueIds.has(question.id);
  const freshSlots = DAILY_TARGET - dueTake.length;

  // 完全新手 (#532): the fresh portion is 入門 content ONLY -- kana
  // recognition + starter vocab -- never exam items (kanji-laden JLPT
  // questions are exactly what a zero-base learner must not meet on day
  // one). Reviews still lead the set, same as every other band.
  if (range === "starter") {
    // Reserved halves (mirroring the vocab-floor pattern below): a naive
    // shuffle over both pools would often draw kana only -- the kana bank is
    // ~5x the word deck -- so the session reserves word slots explicitly.
    // Either pool being short rolls its slots into the other.
    const kanaAll = shuffleQuestions(
      [
        ...buildKanaQuestionPool({ script: "hiragana" }),
        ...buildKanaQuestionPool({ script: "katakana" })
      ].filter(isFresh)
    );
    const wordsAll = shuffleQuestions(
      buildQuestionPool(starterVocabulary, {
        partOfSpeech: "mixed",
        verbGroup: "all",
        targetForms: ["meaning"]
      }).filter(isFresh)
    );
    const wordTake = wordsAll.slice(0, Math.ceil(freshSlots / 2));
    const kanaTake = kanaAll.slice(0, freshSlots - wordTake.length);
    // Back-fill in BOTH directions (codex review): a short kana pool (e.g.
    // everything due) rolls its unfilled slots back into words, so the
    // session never comes up short while either pool still has questions.
    const wordTopUp = wordsAll.slice(
      wordTake.length,
      wordTake.length + (freshSlots - wordTake.length - kanaTake.length)
    );
    const starterMix = reduceAdjacentClusters(
      [...kanaTake, ...wordTake, ...wordTopUp],
      (question) => question.promptLabel ?? question.targetForm
    );
    return [...dueTake, ...starterMix];
  }

  // Narrow the fresh pools to the learner's target band (#199). `null`
  // (range "all") keeps each bank's own default mix -- the prior behaviour,
  // so a learner with no preference is unaffected.
  const levels = levelsForRange(range);
  const vocabSource = levels
    ? jlptVocabulary.filter((item) => item.level != null && levels.includes(item.level))
    : jlptVocabulary;

  const vocabFresh = shuffleQuestions(
    buildQuestionPool(vocabSource, {
      partOfSpeech: "mixed",
      verbGroup: "all",
      targetForms: ["reading"]
    }).filter(isFresh)
  ).slice(0, Math.min(DAILY_VOCAB_MIN, freshSlots));
  // 初級 (n4n5) hole: jlptVocabulary is N1/N2 only, so vocabSource is empty
  // there -> vocabFresh is empty and its reserved slots roll into exam. Exam
  // items each carry their own 4 baked options, so the band still fills a full
  // set with no short-option 漢字読み. DAILY_VOCAB_MIN keeps its "reserve a
  // vocab floor" meaning only where vocab actually exists.
  const examFresh = shuffleQuestions(buildExamQuestionPool(levels ?? "all").filter(isFresh)).slice(
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
    examN3: buildExamQuestionPool(levelsForRange("n3n4") ?? "all").length,
    examN4: buildExamQuestionPool(levelsForRange("n4n5") ?? "all").length,
    vocab: buildQuestionPool(jlptVocabulary, {
      partOfSpeech: "mixed",
      verbGroup: "all",
      targetForms: ["reading"]
    }).length
  };
}

// Union pool used to materialise the review queue AND the 收藏 pool: any
// question the learner has ever attempted OR bookmarked (across exam / cloze
// / pattern / basic) must be resolvable here by id. The exam portion uses the
// EXPLICIT full level set, NOT the default buildExamQuestionPool() -- the
// default "all" trims to N1/N2 + a 6-item N3 warm-up and drops N4/N5 entirely,
// which would make a bookmarked/attempted N4/N5 exam item (reachable via the
// N3/N4 備考 presets) silently unresolvable in both the review queue and the
// 收藏 count/pool (#470 review). Built once and reused.
export function buildAllKnownQuestions(): PracticeQuestion[] {
  return [
    ...buildExamQuestionPool(["N1", "N2", "N3", "N4", "N5"]),
    ...buildClozeQuestionPool(clozeSentences, vocabulary),
    ...buildSentencePatternPool(),
    // Both kana scripts + the starter deck (#533): a missed 入門 question
    // must resolve here or it silently vanishes from the weak-point queue /
    // 收藏 (same trap as the N4/N5 exam items above).
    ...buildKanaQuestionPool({ script: "hiragana" }),
    ...buildKanaQuestionPool({ script: "katakana" }),
    ...buildQuestionPool(starterVocabulary, {
      partOfSpeech: "mixed",
      verbGroup: "all",
      targetForms: ["meaning"]
    }),
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

// Resolve a list of bookmarked ids to their questions, preserving the id
// list's order (bookmark add-order) and dropping ids with no match in the
// pool (a question since removed from the bank). Filtering the pool instead
// would return bank-order, losing the most-recently-starred-last ordering
// bookmarks.ts carefully preserves (#470 review).
export function resolveBookmarkedQuestions(
  ids: string[],
  pool: PracticeQuestion[]
): PracticeQuestion[] {
  const byId = new Map(pool.map((question) => [question.id, question]));
  return ids
    .map((id) => byId.get(id))
    .filter((question): question is PracticeQuestion => question !== undefined);
}

// All the inputs the active-pool builder needs from the React layer. The
// hook derives these from its state (one mode), props (reviewQueue
// snapshot), and config (filter / partOfSpeech / verbGroup / targetForms
// / levelRange), then hands them in so this stays a pure function.
export type PracticePoolRequest = {
  // A single mode value makes impossible states (for example exam + review)
  // unrepresentable. The previous nine booleans also made branch priority
  // depend on the order of the if-statements below.
  mode: PracticeMode;
  examSection?: { level: MockExamLevel; promptLabel: string };
  patternIds?: SentencePatternId[];
  // Gojuon script for kana mode (#533); undefined -> hiragana.
  kanaScript?: KanaScript;
  partOfSpeech: PartOfSpeech | "mixed";
  verbGroup: VerbGroup | "all";
  targetForms: TargetForm[];
  levelRange: LevelRange;
  // Snapshot of the SRS due queue taken at session start; used by the
  // review and 今日練習 branches. The hook passes the value captured when
  // its `questions` memo last ran (mode change / explicit reset).
  reviewQueue: PracticeQuestion[];
  // Snapshot of the learner's bookmarked questions (#470), taken at session
  // start like reviewQueue. Materialised in the hook (allKnownQuestions
  // filtered by the stored bookmark ids) so this stays a pure function.
  bookmarkedQuestions: PracticeQuestion[];
  // Cap for the endless drill modes (exam / cloze / pattern / vocab /
  // basic): the learner picks a session length (#154) and we slice the
  // shuffled pool down to it so the session is finite. null / undefined /
  // <=0 means no cap (the old endless behaviour). review (clears the whole
  // due queue) and 今日練習 (already a fixed ~20 set) are NEVER capped.
  sessionLength?: number | null;
  // Ids the learner has already attempted. When provided, the 綜合 / 備考 exam
  // pool surfaces unattempted (新題) items first (#385). Empty / omitted = no
  // reordering (logged-out or fresh learner sees the plain shuffle).
  attemptedIds?: Set<string>;
};

// Derives the active question pool for the current mode. This is the body
// of usePracticeSession's `questions` memo, lifted out verbatim so every
// mode/range branch (section-filtered exam, 綜合 level-range exam, cloze,
// pattern, review snapshot, vocab reading drill, 今日練習, basic drill)
// stays exactly as it was.
export function buildPracticeQuestions(params: PracticePoolRequest): PracticeQuestion[] {
  const {
    mode,
    examSection,
    patternIds,
    kanaScript,
    partOfSpeech,
    verbGroup,
    targetForms,
    levelRange,
    reviewQueue,
    bookmarkedQuestions,
    sessionLength,
    attemptedIds
  } = params;
  const fresh = (pool: PracticeQuestion[]): PracticeQuestion[] =>
    attemptedIds ? prioritizeUnattempted(pool, attemptedIds) : pool;

  // Cap the endless drill modes to the chosen session length (#154). A
  // null / non-positive length leaves the pool whole (old behaviour).
  // Applied only to the cappable branches below; review / 今日練習 return
  // without it.
  const cap = (pool: PracticeQuestion[]): PracticeQuestion[] =>
    sessionLength != null && sessionLength > 0 ? pool.slice(0, sessionLength) : pool;

  switch (mode) {
    case "exam": {
      // Section-filtered when launched from the 模擬考 picker; the
      // plain "綜合考題庫" mode card leaves examSection unset and
      // mixes every section.
      const section = examSection;
      if (section) {
        return cap(
          shuffleQuestions(
            buildExamQuestionPool(section.level).filter(
              (question) => question.promptLabel === section.promptLabel
            )
          )
        );
      }
      // 綜合考題庫 + 備考 presets: optionally narrowed to a level range, then
      // unattempted (新題) items first so a capped session pulls new content
      // before anything already done (#385). The section-filtered mock path
      // above keeps its pure shuffle (a mock test shouldn't reorder by history).
      return cap(fresh(shuffleQuestions(buildExamQuestionPool(levelsForRange(levelRange) ?? "all"))));
    }

    case "cloze":
      return cap(shuffleQuestions(buildClozeQuestionPool(clozeSentences, vocabulary)));

    case "pattern":
      return cap(shuffleQuestions(buildSentencePatternPool({ patternIds })));

    case "kana":
      // Kana recognition drill (#533): the 入門 chapter CTAs pick the script.
      return cap(shuffleQuestions(buildKanaQuestionPool({ script: kanaScript ?? "hiragana" })));

    case "starter":
      // Starter-vocab meaning drill (#533): see the kana word, pick its
      // meaning. Distractors come from the same deck (pool-based), whose
      // pairwise-distinct meanings are locked by starterVocabulary.test.ts.
      return cap(
        shuffleQuestions(
          buildQuestionPool(starterVocabulary, {
            partOfSpeech: "mixed",
            verbGroup: "all",
            targetForms: ["meaning"]
          })
        )
      );

    case "review":
      // Snapshot the SRS queue at session start. Subsequent answers
      // update the LIVE reviewQueue (used by the home banner count),
      // but this useMemo is intentionally NOT re-keyed on it -- see
      // the deps comment below for the regression that fixes.
      // Ordering is preserved (no extra shuffle): getReviewQueue
      // already sorts most-overdue first.
      return reviewQueue;

    case "vocab": {
      // 単字 mode: N1/N2 reading drill. Reading-only on purpose --
      // for a Chinese-speaking learner the kanji usually telegraphs
      // the meaning (影響 = 影響), so an isolated meaning question is
      // trivial and can't be rescued by stronger distractors. The
      // genuinely hard, JLPT-relevant skill is the READING (よみ):
      // 影響 is えいきょう, not えいきゅう. Meaning is still tested,
      // but in CONTEXT, via the exam pool's 詞彙填空 / 類義替換 /
      // 詞彙用法 sections -- which is the authentic way to test it.
      const levels = levelsForRange(levelRange);
      const narrowed = levels
        ? jlptVocabulary.filter((item) => item.level != null && levels.includes(item.level))
        : jlptVocabulary;
      // 単字 only has N1/N2 jlpt entries (VOCAB_LEVEL_RANGE_OPTIONS excludes
      // n4n5 for this reason). A global n4n5 preference would narrow this to an
      // empty pool, so fall back to the full reading deck rather than show an
      // empty 単字 session (#199).
      const vocabSource = narrowed.length > 0 ? narrowed : jlptVocabulary;
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
      return cap(
        reduceAdjacentClusters(
          vocabPool,
          (question) => String(question.expectedAnswers[0]?.length ?? 0)
        )
      );
    }

    case "daily":
      // Snapshot the current due queue at session start (same as review
      // mode); the live reviewQueue stays excluded from the deps below. The
      // fresh portion is narrowed to the learner's target band (#199).
      return composeDailySet(reviewQueue, levelRange);

    case "bookmarks":
      // 收藏 mode (#470): a finite pass over the learner's starred questions,
      // in add-order (getBookmarkedIds order). Snapshot at session start like
      // review -- toggling a star mid-session doesn't reshuffle the live pass.
      return bookmarkedQuestions;

    case "basic":
      return cap(
        shuffleQuestions(
          buildQuestionPool(vocabulary, {
            partOfSpeech,
            verbGroup,
            targetForms
          })
        )
      );

    default:
      return assertNever(mode);
  }
}
