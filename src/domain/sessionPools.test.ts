import { describe, expect, it } from "vitest";
import { buildClozeQuestionPool } from "./cloze";
import { clozeSentences } from "./cloze-data";
import { ADJECTIVE_FORMS } from "./conjugation";
import { buildExamQuestionPool } from "./examBlocks";
import { buildKanaQuestionPool } from "./kanaDrill";
import { levelsForRange } from "./levelRange";
import { buildChoiceOptions, buildQuestionPool } from "./practice";
import type { PracticeMode } from "./practiceMode";
import { buildSentencePatternPool } from "./sentencePatterns";
import {
  buildAllKnownQuestions,
  buildModeCounts,
  buildPracticeQuestions,
  composeDailySet,
  getAvailableBasicLevels,
  resolveBookmarkedQuestions,
  uniqueForms,
  type PracticePoolOptions
} from "./sessionPools";
import type { PracticeQuestion } from "./types";
import { vocabulary } from "./vocabulary";
import { jlptVocabulary } from "./vocabulary-jlpt";

// Default options = the "basic" drill. Each test changes exactly one mode,
// so the branch under test is isolated and impossible mode combinations
// cannot be constructed.
function poolParams(overrides: Partial<PracticePoolOptions> = {}): PracticePoolOptions {
  return {
    mode: "basic",
    partOfSpeech: "verb",
    verbGroup: "godan",
    targetForms: ["te"],
    levelRange: "all",
    reviewQueue: [],
    bookmarkedQuestions: [],
    ...overrides
  };
}

describe("buildPracticeQuestions mode options (#623)", () => {
  it("selects exactly one pool branch from mode", () => {
    const questions = buildPracticeQuestions({
      ...poolParams(),
      mode: "kana",
      kanaScript: "katakana",
      sessionLength: null
    });

    expect(questions).toHaveLength(312);
    expect(questions.every((question) => question.id.startsWith("kana-katakana-"))).toBe(true);
  });

  it("throws for a corrupt mode instead of silently falling back to basic", () => {
    const corruptMode = "corrupt" as unknown as PracticeMode;

    expect(() => buildPracticeQuestions(poolParams({ mode: corruptMode }))).toThrow(
      "Unsupported practice mode: corrupt"
    );
  });
});

describe("buildPracticeQuestions kana branch (#533)", () => {
  it("kana focus builds the requested script's pool, defaulting to hiragana", () => {
    const hira = buildPracticeQuestions(
      poolParams({ mode: "kana", kanaScript: "hiragana", sessionLength: null })
    );
    expect(hira).toHaveLength(208);
    expect(hira.every((question) => question.id.startsWith("kana-hiragana-"))).toBe(true);

    const fallback = buildPracticeQuestions(
      poolParams({ mode: "kana", sessionLength: null })
    );
    expect(fallback.every((question) => question.id.startsWith("kana-hiragana-"))).toBe(true);

    const kata = buildPracticeQuestions(
      poolParams({ mode: "kana", kanaScript: "katakana", sessionLength: null })
    );
    expect(kata).toHaveLength(312);
  });

  it("kana focus honours the session-length cap", () => {
    const capped = buildPracticeQuestions(
      poolParams({ mode: "kana", kanaScript: "hiragana", sessionLength: 10 })
    );
    expect(capped).toHaveLength(10);
  });

  it("buildAllKnownQuestions resolves kana questions (weak-point queue / 收藏)", () => {
    const known = buildAllKnownQuestions();
    expect(known.some((question) => question.id.startsWith("kana-hiragana-"))).toBe(true);
    expect(known.some((question) => question.id.startsWith("kana-katakana-match-"))).toBe(true);
  });
});

describe("buildPracticeQuestions starter branch (#533)", () => {
  it("starter focus builds one meaning question per deck word", () => {
    const pool = buildPracticeQuestions(poolParams({ mode: "starter", sessionLength: null }));
    expect(pool.length).toBeGreaterThanOrEqual(90);
    expect(pool.every((question) => question.targetForm === "meaning")).toBe(true);
    expect(pool.every((question) => question.id.startsWith("starter-"))).toBe(true);
  });

  it("starter focus honours the session-length cap and resolves in buildAllKnownQuestions", () => {
    const capped = buildPracticeQuestions(
      poolParams({ mode: "starter", sessionLength: 10 })
    );
    expect(capped).toHaveLength(10);
    const known = buildAllKnownQuestions();
    expect(known.some((question) => question.id.startsWith("starter-"))).toBe(true);
  });
});

describe("uniqueForms", () => {
  it("dedupes target forms while preserving first-seen order", () => {
    expect(uniqueForms(["te", "ta", "te", "reading", "ta"])).toEqual(["te", "ta", "reading"]);
  });
});

describe("buildModeCounts", () => {
  it("reports a count for every static mode card, matching the live builders", () => {
    const counts = buildModeCounts();

    expect(counts.cloze).toBe(buildClozeQuestionPool(clozeSentences, vocabulary).length);
    expect(counts.exam).toBe(buildExamQuestionPool().length);
    // examN1 / examN2 / examN4 are the 備考 presets (issues #65/#92): the
    // counts come from the matching level RANGE pools, never the default.
    expect(counts.examN1).toBe(buildExamQuestionPool(levelsForRange("n1n2") ?? "all").length);
    expect(counts.examN2).toBe(buildExamQuestionPool(levelsForRange("n2n3") ?? "all").length);
    expect(counts.examN3).toBe(buildExamQuestionPool(levelsForRange("n3n4") ?? "all").length);
    expect(counts.examN4).toBe(buildExamQuestionPool(levelsForRange("n4n5") ?? "all").length);
    expect(counts.vocab).toBe(
      buildQuestionPool(jlptVocabulary, {
        partOfSpeech: "mixed",
        verbGroup: "all",
        targetForms: ["reading"]
      }).length
    );
  });

  it("derives the examN4 preset from the n4n5 range (N4/N5 only)", () => {
    const counts = buildModeCounts();
    const n4n5 = buildExamQuestionPool(levelsForRange("n4n5") ?? "all");

    expect(counts.examN4).toBeGreaterThan(0);
    expect(counts.examN4).toBe(n4n5.length);
    expect(
      n4n5.every((q) => q.vocabulary.level === "N4" || q.vocabulary.level === "N5")
    ).toBe(true);
  });

  it("derives the examN3 preset from the n3n4 range (N3/N4 only)", () => {
    const counts = buildModeCounts();
    const n3n4 = buildExamQuestionPool(levelsForRange("n3n4") ?? "all");

    expect(counts.examN3).toBeGreaterThan(0);
    expect(counts.examN3).toBe(n3n4.length);
    expect(
      n3n4.every((q) => q.vocabulary.level === "N3" || q.vocabulary.level === "N4")
    ).toBe(true);
  });
});

describe("buildAllKnownQuestions", () => {
  it("unions the exam, cloze, pattern, and full vocab pools", () => {
    const all = buildAllKnownQuestions();
    const exam = buildExamQuestionPool();
    const cloze = buildClozeQuestionPool(clozeSentences, vocabulary);

    expect(all.length).toBeGreaterThan(exam.length + cloze.length);
    const ids = new Set(all.map((q) => q.id));
    // A sample id from each contributing source must be present.
    expect(ids.has(exam[0].id)).toBe(true);
    expect(ids.has(cloze[0].id)).toBe(true);
    // Vocab reading + meaning forms (both requested in the union) appear.
    expect(all.some((q) => q.targetForm === "reading")).toBe(true);
    expect(all.some((q) => q.targetForm === "meaning")).toBe(true);
  });
});

describe("buildPracticeQuestions", () => {
  it("basic mode: builds a shuffled pool for the chosen part of speech / group / form", () => {
    const questions = buildPracticeQuestions(
      poolParams({ partOfSpeech: "verb", verbGroup: "godan", targetForms: ["te"] })
    );

    expect(questions.length).toBeGreaterThan(0);
    expect(questions.every((q) => q.vocabulary.partOfSpeech === "verb")).toBe(true);
    expect(questions.every((q) => q.vocabulary.group === "godan")).toBe(true);
    expect(questions.every((q) => q.targetForm === "te")).toBe(true);
  });

  it("exam mode (綜合, range all): mirrors the default exam pool contents", () => {
    const questions = buildPracticeQuestions(poolParams({ mode: "exam", levelRange: "all" }));
    const expected = buildExamQuestionPool("all");

    expect(new Set(questions.map((q) => q.id))).toEqual(new Set(expected.map((q) => q.id)));
  });

  it("exam mode (綜合, n1n2 range): narrows to N1+N2 only", () => {
    const questions = buildPracticeQuestions(poolParams({ mode: "exam", levelRange: "n1n2" }));

    expect(questions.length).toBeGreaterThan(0);
    expect(
      questions.every((q) => q.vocabulary.level === "N1" || q.vocabulary.level === "N2")
    ).toBe(true);
  });

  it("exam mode (綜合, n2n3 range): narrows to N2+N3 only", () => {
    const questions = buildPracticeQuestions(poolParams({ mode: "exam", levelRange: "n2n3" }));

    expect(questions.length).toBeGreaterThan(0);
    expect(
      questions.every((q) => q.vocabulary.level === "N2" || q.vocabulary.level === "N3")
    ).toBe(true);
  });

  it("exam mode (備考, n4n5 range): narrows to N4+N5 only (#65/#92)", () => {
    const questions = buildPracticeQuestions(poolParams({ mode: "exam", levelRange: "n4n5" }));

    expect(questions.length).toBeGreaterThan(0);
    expect(
      questions.every((q) => q.vocabulary.level === "N4" || q.vocabulary.level === "N5")
    ).toBe(true);
  });

  it("exam mode (mock section): filters to the given level + promptLabel", () => {
    // Pick a real (level, promptLabel) pair straight from the N1 pool so
    // the section is guaranteed non-empty.
    const n1 = buildExamQuestionPool("N1");
    const sample = n1.find((q) => q.promptLabel);
    expect(sample).toBeDefined();
    const promptLabel = sample!.promptLabel!;

    const questions = buildPracticeQuestions(
      poolParams({ mode: "exam", examSection: { level: "N1", promptLabel } })
    );

    expect(questions.length).toBeGreaterThan(0);
    expect(questions.every((q) => q.vocabulary.level === "N1")).toBe(true);
    expect(questions.every((q) => q.promptLabel === promptLabel)).toBe(true);
  });

  it("exam mode (N4 mock section): filters to the N4 level + promptLabel (#703)", () => {
    const n4 = buildExamQuestionPool("N4");
    const sample = n4.find((q) => q.promptLabel);
    expect(sample).toBeDefined();
    const promptLabel = sample!.promptLabel!;

    const questions = buildPracticeQuestions(
      poolParams({ mode: "exam", examSection: { level: "N4", promptLabel } })
    );

    expect(questions.length).toBeGreaterThan(0);
    expect(questions.every((q) => q.vocabulary.level === "N4")).toBe(true);
    expect(questions.every((q) => q.promptLabel === promptLabel)).toBe(true);
  });

  it("exam mode (N5 mock section): filters to the N5 level + promptLabel (#703)", () => {
    const n5 = buildExamQuestionPool("N5");
    const sample = n5.find((q) => q.promptLabel);
    expect(sample).toBeDefined();
    const promptLabel = sample!.promptLabel!;

    const questions = buildPracticeQuestions(
      poolParams({ mode: "exam", examSection: { level: "N5", promptLabel } })
    );

    expect(questions.length).toBeGreaterThan(0);
    expect(questions.every((q) => q.vocabulary.level === "N5")).toBe(true);
    expect(questions.every((q) => q.promptLabel === promptLabel)).toBe(true);
  });

  it("cloze mode: returns the cloze pool (same membership)", () => {
    const questions = buildPracticeQuestions(poolParams({ mode: "cloze" }));
    const expected = buildClozeQuestionPool(clozeSentences, vocabulary);

    expect(new Set(questions.map((q) => q.id))).toEqual(new Set(expected.map((q) => q.id)));
  });

  it("pattern mode: passes patternIds through to the filtered pool", () => {
    const patternIds = ["starter-desu"] as const;
    const questions = buildPracticeQuestions(
      poolParams({ mode: "pattern", patternIds: [...patternIds] })
    );
    const expected = buildSentencePatternPool({ patternIds: [...patternIds] });

    expect(questions.length).toBeGreaterThan(0);
    expect(new Set(questions.map((q) => q.id))).toEqual(new Set(expected.map((q) => q.id)));
  });

  it("review mode: returns the snapshot queue verbatim (same order, no shuffle)", () => {
    const snapshot = buildExamQuestionPool("N1").slice(0, 3);
    const questions = buildPracticeQuestions(
      poolParams({ mode: "review", reviewQueue: snapshot })
    );

    expect(questions).toBe(snapshot);
  });

  it("bookmarks mode: returns the bookmarked snapshot verbatim (add-order, no shuffle)", () => {
    const snapshot = buildExamQuestionPool("N1").slice(0, 3);
    const questions = buildPracticeQuestions(
      poolParams({ mode: "bookmarks", bookmarkedQuestions: snapshot })
    );

    expect(questions).toBe(snapshot);
  });

  it("bookmarks mode: empty when nothing is starred", () => {
    const questions = buildPracticeQuestions(
      poolParams({ mode: "bookmarks", bookmarkedQuestions: [] })
    );
    expect(questions).toEqual([]);
  });

  it("vocab mode: reading-only drill, narrowed by level range", () => {
    const questions = buildPracticeQuestions(poolParams({ mode: "vocab", levelRange: "n1n2" }));

    expect(questions.length).toBeGreaterThan(0);
    expect(questions.every((q) => q.targetForm === "reading")).toBe(true);
    expect(
      questions.every((q) => q.vocabulary.level === "N1" || q.vocabulary.level === "N2")
    ).toBe(true);
  });

  it("vocab mode (n4n5): uses ONLY the N4/N5 jlpt entries -- no N1-N3, no starter deck, no exam items (#668)", () => {
    // #666/#667 landed N5/N4 jlptVocabulary entries, so the n4n5 band now has
    // a REAL 単字読音 source: the narrowed pool must be exactly N4/N5.
    const questions = buildPracticeQuestions(poolParams({ mode: "vocab", levelRange: "n4n5" }));

    expect(questions.length).toBeGreaterThan(0);
    expect(questions.every((q) => q.targetForm === "reading")).toBe(true);
    expect(
      questions.every((q) => q.vocabulary.level === "N4" || q.vocabulary.level === "N5")
    ).toBe(true);
    // No starter deck, no exam items, and nothing above N4 in the session.
    expect(questions.every((q) => q.id.startsWith("n4-") || q.id.startsWith("n5-"))).toBe(true);
    expect(questions.every((q) => !q.vocabulary.tags?.includes("exam_style"))).toBe(true);
    expect(questions.some((q) => q.vocabulary.level === "N4")).toBe(true);
    expect(questions.some((q) => q.vocabulary.level === "N5")).toBe(true);
  });

  it("vocab mode (range all): keeps the whole JLPT vocab reading pool", () => {
    const questions = buildPracticeQuestions(poolParams({ mode: "vocab", levelRange: "all" }));
    const expected = buildQuestionPool(jlptVocabulary, {
      partOfSpeech: "mixed",
      verbGroup: "all",
      targetForms: ["reading"]
    });

    expect(new Set(questions.map((q) => q.id))).toEqual(new Set(expected.map((q) => q.id)));
  });

  it("daily mode: composes a finite 今日練習 set from the due snapshot", () => {
    const due = buildExamQuestionPool("N1").slice(0, 4);
    const questions = buildPracticeQuestions(poolParams({ mode: "daily", reviewQueue: due }));

    expect(questions.length).toBeGreaterThan(0);
    expect(questions.length).toBeLessThanOrEqual(20);
    // The due items lead the set (composeDailySet puts reviews first).
    const dueIds = new Set(due.map((q) => q.id));
    const leading = questions.slice(0, due.length);
    expect(leading.every((q) => dueIds.has(q.id))).toBe(true);
  });

  it("daily mode: threads the level range into the composed set (n4n5 -> N4/N5) (#199)", () => {
    const questions = buildPracticeQuestions(
      poolParams({ mode: "daily", reviewQueue: [], levelRange: "n4n5" })
    );
    expect(questions.length).toBeGreaterThan(0);
    expect(
      questions.every((q) => q.vocabulary.level === "N4" || q.vocabulary.level === "N5")
    ).toBe(true);
  });
});

describe("buildPracticeQuestions basic composable filters (#789)", () => {
  it("derives supported JLPT levels from the canonical basic vocabulary", () => {
    expect(
      getAvailableBasicLevels({
        partOfSpeech: "verb",
        verbGroup: "all",
        targetForms: ["meaning"]
      })
    ).toEqual(["N5"]);
    expect(
      getAvailableBasicLevels({
        partOfSpeech: "noun",
        verbGroup: "all",
        targetForms: ["meaning"]
      })
    ).toEqual(["N1", "N2", "N3", "N4", "N5"]);
  });

  it("narrows the basic pool to one selected JLPT level", () => {
    const questions = buildPracticeQuestions(
      poolParams({
        partOfSpeech: "noun",
        targetForms: ["meaning"],
        levels: ["N4"]
      })
    );

    expect(questions.length).toBeGreaterThan(0);
    expect(questions.every((question) => question.vocabulary.level === "N4")).toBe(true);
  });

  it("unions selected JLPT levels within the basic pool", () => {
    const questions = buildPracticeQuestions(
      poolParams({
        partOfSpeech: "noun",
        targetForms: ["meaning"],
        levels: ["N3", "N4", "N5"]
      })
    );

    expect(new Set(questions.map((question) => question.vocabulary.level))).toEqual(
      new Set(["N3", "N4", "N5"])
    );
  });

  it("unions selected verb groups and excludes unselected groups", () => {
    const questions = buildPracticeQuestions(
      poolParams({
        partOfSpeech: "verb",
        verbGroup: "irregular",
        verbGroups: ["godan", "ichidan"],
        targetForms: ["meaning"]
      })
    );

    expect(new Set(questions.map((question) => question.vocabulary.group))).toEqual(
      new Set(["godan", "ichidan"])
    );
  });

  it("intersects levels, part of speech, verb groups, and target forms", () => {
    const selectedLevels = new Set(["N3", "N4", "N5"]);
    const selectedGroups = new Set(["godan", "ichidan"]);
    const questions = buildPracticeQuestions(
      poolParams({
        partOfSpeech: "verb",
        verbGroups: ["godan", "ichidan"],
        targetForms: ["meaning"],
        levels: ["N3", "N4", "N5"]
      })
    );

    expect(questions.length).toBeGreaterThan(0);
    expect(new Set(questions.map((question) => question.vocabulary.group))).toEqual(
      new Set(["godan", "ichidan"])
    );
    expect(
      questions.every(
        (question) =>
          question.vocabulary.level !== undefined &&
          selectedLevels.has(question.vocabulary.level) &&
          question.vocabulary.partOfSpeech === "verb" &&
          question.vocabulary.group !== null &&
          selectedGroups.has(question.vocabulary.group) &&
          question.targetForm === "meaning"
      )
    ).toBe(true);
  });

  it("keeps an explicitly empty level selection empty", () => {
    const questions = buildPracticeQuestions(
      poolParams({ partOfSpeech: "noun", targetForms: ["meaning"], levels: [] })
    );

    expect(questions).toEqual([]);
  });

  it("keeps an explicitly empty verb-group selection empty", () => {
    const questions = buildPracticeQuestions(
      poolParams({ partOfSpeech: "verb", targetForms: ["meaning"], verbGroups: [] })
    );

    expect(questions).toEqual([]);
  });

  it("treats explicit verb groups as a verb-only filter in mixed practice", () => {
    const selectedGroups = new Set(["godan", "ichidan"]);
    const questions = buildPracticeQuestions(
      poolParams({
        partOfSpeech: "mixed",
        verbGroup: "irregular",
        verbGroups: ["godan", "ichidan"],
        targetForms: ["meaning"]
      })
    );

    expect(questions.length).toBeGreaterThan(0);
    expect(
      questions.every(
        (question) =>
          question.vocabulary.partOfSpeech === "verb" &&
          question.vocabulary.group !== null &&
          selectedGroups.has(question.vocabulary.group)
      )
    ).toBe(true);
    expect(new Set(questions.map((question) => question.vocabulary.group))).toEqual(
      new Set(["godan", "ichidan"])
    );
  });

  it("keeps an explicitly empty verb-group selection empty in mixed practice", () => {
    const questions = buildPracticeQuestions(
      poolParams({ partOfSpeech: "mixed", targetForms: ["meaning"], verbGroups: [] })
    );

    expect(questions).toEqual([]);
  });

  it("preserves legacy scalar mixed practice when no explicit group filter exists", () => {
    const questions = buildPracticeQuestions(
      poolParams({
        partOfSpeech: "mixed",
        verbGroup: "godan",
        verbGroups: undefined,
        targetForms: ["meaning"]
      })
    );

    expect(questions.some((question) => question.vocabulary.partOfSpeech !== "verb")).toBe(true);
    expect(
      questions
        .filter((question) => question.vocabulary.partOfSpeech === "verb")
        .every((question) => question.vocabulary.group === "godan")
    ).toBe(true);
  });
});

describe("composeDailySet", () => {
  const makeDue = (n: number): PracticeQuestion[] => buildExamQuestionPool("N1").slice(0, n);

  it("caps the whole set at the daily target of 20", () => {
    expect(composeDailySet([]).length).toBeLessThanOrEqual(20);
    expect(composeDailySet(makeDue(40)).length).toBeLessThanOrEqual(20);
  });

  it("caps due items at half the target so fresh content still fits", () => {
    const due = makeDue(40);
    const set = composeDailySet(due);
    const dueIds = new Set(due.map((q) => q.id));
    const dueInSet = set.filter((q) => dueIds.has(q.id)).length;

    expect(dueInSet).toBeLessThanOrEqual(10);
  });

  it("places the due block first, in its incoming (most-overdue-first) order", () => {
    const due = makeDue(4);
    const set = composeDailySet(due);

    expect(set.slice(0, due.length).map((q) => q.id)).toEqual(due.map((q) => q.id));
  });

  it("never lets a due item reappear in the fresh portion", () => {
    const due = makeDue(4);
    const set = composeDailySet(due);
    const dueIds = new Set(due.map((q) => q.id));
    const fresh = set.slice(due.length);

    expect(fresh.some((q) => dueIds.has(q.id))).toBe(false);
  });

  it("fills the set with fresh vocab + exam items when there are no due reviews", () => {
    const set = composeDailySet([]);

    expect(set.length).toBeGreaterThan(0);
    // With an empty due queue the set is entirely fresh and reserves at
    // least one vocab reading item (DAILY_VOCAB_MIN floor).
    expect(set.some((q) => q.targetForm === "reading")).toBe(true);
  });

  it("targets the chosen band: n1n2 yields N1/N2 fresh items only (#199)", () => {
    const set = composeDailySet([], "n1n2");
    expect(set.length).toBeGreaterThan(0);
    expect(set.every((q) => q.vocabulary.level === "N1" || q.vocabulary.level === "N2")).toBe(true);
  });

  it("targets the chosen band: n2n3 narrows to N2/N3 and still reserves a vocab item (#199)", () => {
    const set = composeDailySet([], "n2n3");
    expect(set.length).toBeGreaterThan(0);
    expect(set.every((q) => q.vocabulary.level === "N2" || q.vocabulary.level === "N3")).toBe(true);
    // jlptVocabulary has N2 entries, so the reserved vocab reading slot fills
    // (a non-exam_style item -- exam items also carry targetForm "reading").
    expect(set.some((q) => !q.vocabulary.tags?.includes("exam_style"))).toBe(true);
  });

  it("初級 n4n5: mixes N5 vocab reading items into the N4/N5 exam fill (#666)", () => {
    // #666 added the N5 tier to jlptVocabulary, so the n4n5 daily band now has
    // a real vocab source: the reserved reading slot fills with N5 items and
    // the rest rolls into N4/N5 exam. Every item stays inside the band.
    const set = composeDailySet([], "n4n5");
    expect(set.length).toBe(20);
    expect(set.every((q) => q.vocabulary.level === "N4" || q.vocabulary.level === "N5")).toBe(true);
    // The reserved vocab slot is a real 単字読音 item (N5 level, not exam).
    expect(set.some((q) => !q.vocabulary.tags?.includes("exam_style"))).toBe(true);
    // DAILY_VOCAB_MIN reading-vocab floor applies to the low band too (#668):
    // at least 5 distinct non-exam reading items.
    const vocabItems = set.filter((q) => !q.vocabulary.tags?.includes("exam_style"));
    expect(vocabItems.length).toBeGreaterThanOrEqual(5);
    // Every question renders a full 4-distinct-option grid once resolved the
    // way the render path does (buildChoiceOptions: exam items carry baked
    // options, pool-based reading items generate theirs from the session).
    set.forEach((question, index) => {
      const options = buildChoiceOptions(question, set, index);
      expect(options.length).toBeGreaterThanOrEqual(4);
      expect(new Set(options).size).toBe(options.length);
    });
  });

  it("完全新手 starter: the fresh portion is 入門 content only (kana + starter vocab), never exam (#532)", () => {
    const set = composeDailySet([], "starter");
    expect(set.length).toBe(20);
    expect(
      set.every(
        (question) => question.id.startsWith("kana-") || question.id.startsWith("starter-")
      )
    ).toBe(true);
    // A real mix, not a single-pool dump.
    expect(set.some((question) => question.id.startsWith("kana-"))).toBe(true);
    expect(set.some((question) => question.id.startsWith("starter-"))).toBe(true);
  });

  it("starter back-fills from words when the kana pool is exhausted (codex review)", () => {
    // Every kana question is due -> the fresh kana pool filters to empty.
    // The word half must then expand to fill ALL fresh slots, not leave the
    // session short.
    const allKana = [
      ...buildKanaQuestionPool({ script: "hiragana" }),
      ...buildKanaQuestionPool({ script: "katakana" })
    ];
    const set = composeDailySet(allKana, "starter");
    expect(set).toHaveLength(20);
    // 10 due kana lead; the 10 fresh are all starter words.
    expect(set.slice(10).every((question) => question.id.startsWith("starter-"))).toBe(true);
  });

  it("starter keeps the reviews-first promise: due 入門 items lead the set (#532)", () => {
    const due = composeDailySet([], "starter").slice(0, 3);
    const set = composeDailySet(due, "starter");
    expect(set.slice(0, due.length).map((question) => question.id)).toEqual(
      due.map((question) => question.id)
    );
    const dueIds = new Set(due.map((question) => question.id));
    expect(set.slice(due.length).some((question) => dueIds.has(question.id))).toBe(false);
  });

  it("defaults to the prior all-levels behaviour when no range is passed (#199)", () => {
    // No range arg == "all" == the old N1/N2-focused default, so an
    // existing learner with no preference is unaffected. (Both random
    // sets reserve a vocab reading item and are not band-restricted.)
    const set = composeDailySet([]);
    expect(set.some((q) => q.targetForm === "reading")).toBe(true);
    // "all" is not narrowed to a single band: N1 items are eligible.
    const everN1 = Array.from({ length: 5 }, () => composeDailySet([])).some((s) =>
      s.some((q) => q.vocabulary.level === "N1")
    );
    expect(everN1).toBe(true);
  });
});

describe("buildPracticeQuestions unattempted-first exam ordering (#385)", () => {
  it("surfaces unattempted exam items before attempted ones (綜合)", () => {
    const pool = buildExamQuestionPool("all");
    const attemptedIds = new Set(pool.slice(0, 8).map((q) => q.id));
    const out = buildPracticeQuestions(
      poolParams({ mode: "exam", levelRange: "all", attemptedIds })
    );
    // membership unchanged...
    expect(new Set(out.map((q) => q.id))).toEqual(new Set(pool.map((q) => q.id)));
    // ...and every attempted item comes after every unattempted item.
    const flags = out.map((q) => attemptedIds.has(q.id));
    const firstAttempted = flags.indexOf(true);
    const lastFresh = flags.lastIndexOf(false);
    expect(firstAttempted).toBeGreaterThan(lastFresh);
  });

  it("a capped session pulls unattempted items first (#385 + #154)", () => {
    const pool = buildExamQuestionPool("all");
    const attemptedIds = new Set(pool.slice(0, 10).map((q) => q.id));
    const capped = buildPracticeQuestions(
      poolParams({ mode: "exam", levelRange: "all", sessionLength: 20, attemptedIds })
    );
    expect(capped.length).toBe(20);
    // The bank has far more than 20 unattempted, so a capped set is all fresh.
    expect(capped.every((q) => !attemptedIds.has(q.id))).toBe(true);
  });

  it("no attemptedIds: membership unchanged (fresh learner sees the plain pool)", () => {
    const out = buildPracticeQuestions(poolParams({ mode: "exam", levelRange: "all" }));
    expect(new Set(out.map((q) => q.id))).toEqual(
      new Set(buildExamQuestionPool("all").map((q) => q.id))
    );
  });
});

describe("buildQuestionPool part-of-speech handling (#60)", () => {
  it("does not generate conjugation drills for adverbs", () => {
    const adverb = jlptVocabulary.find((item) => item.partOfSpeech === "adverb");
    expect(adverb).toBeDefined();
    // Adverbs (e.g. 漫然/突如) have no conjugation; pairing one with every
    // adjective conjugation form must yield zero questions. Only reading /
    // meaning drills are valid for them.
    const drills = buildQuestionPool([adverb!], {
      partOfSpeech: "mixed",
      verbGroup: "all",
      targetForms: ADJECTIVE_FORMS
    });
    expect(drills).toEqual([]);
  });
});

describe("buildPracticeQuestions session-length cap (#154)", () => {
  it("caps the basic-drill pool to sessionLength", () => {
    const full = buildPracticeQuestions(
      poolParams({ partOfSpeech: "verb", verbGroup: "godan", targetForms: ["te"] })
    );
    expect(full.length).toBeGreaterThan(20);

    const capped = buildPracticeQuestions(
      poolParams({ partOfSpeech: "verb", verbGroup: "godan", targetForms: ["te"], sessionLength: 20 })
    );
    expect(capped.length).toBe(20);
  });

  it("caps the exam pool to sessionLength", () => {
    const capped = buildPracticeQuestions(
      poolParams({ mode: "exam", levelRange: "all", sessionLength: 20 })
    );
    expect(capped.length).toBe(20);
  });

  it("treats null sessionLength as no cap (full pool)", () => {
    const full = buildPracticeQuestions(
      poolParams({ mode: "exam", levelRange: "all", sessionLength: null })
    );
    expect(full.length).toBe(buildExamQuestionPool("all").length);
  });

  it("does NOT cap review mode (clears the whole due queue)", () => {
    const due = buildExamQuestionPool("all").slice(0, 25);
    const questions = buildPracticeQuestions(
      poolParams({ mode: "review", reviewQueue: due, sessionLength: 20 })
    );
    expect(questions.length).toBe(25);
  });

  it("does NOT shrink 今日練習 below its own target via sessionLength", () => {
    const daily = buildPracticeQuestions(
      poolParams({ mode: "daily", reviewQueue: [], sessionLength: 5 })
    );
    expect(daily.length).toBeGreaterThan(5);
  });
});

describe("buildAllKnownQuestions exam coverage (#470 review)", () => {
  it("includes N4 and N5 exam items so bookmarked/reviewed low-level items resolve", () => {
    // The union pool feeds both the SRS review queue AND the 收藏 pool. If it
    // were built from the default 'all' exam pool (N1/N2 + 6 N3 warm-ups), any
    // bookmarked N4/N5 exam question -- reachable via the N3/N4 備考 presets --
    // would be silently absent from the pool and the mode count.
    const pool = buildAllKnownQuestions();
    const levels = new Set(pool.map((q) => q.vocabulary.level));
    expect(levels.has("N4")).toBe(true);
    expect(levels.has("N5")).toBe(true);
    // And the full N3 set, not just the 6-item warm-up slice.
    const n3Count = pool.filter((q) => q.vocabulary.level === "N3").length;
    expect(n3Count).toBeGreaterThan(6);
  });
});

describe("resolveBookmarkedQuestions (#470 review)", () => {
  const q = (id: string): PracticeQuestion => ({
    id,
    vocabulary: {
      id,
      surface: id,
      reading: id,
      meaningZh: "x",
      partOfSpeech: "verb",
      group: "godan",
      lesson: null,
      tags: [],
      examples: []
    },
    targetForm: "te",
    expectedAnswers: ["ok"],
    explanation: ""
  });

  it("returns questions in bookmark add-order, not pool order", () => {
    const pool = [q("A"), q("B"), q("C")]; // pool/bank order A,B,C
    const ids = ["C", "A", "B"]; // starred in this order
    const resolved = resolveBookmarkedQuestions(ids, pool);
    expect(resolved.map((r) => r.id)).toEqual(["C", "A", "B"]);
  });

  it("drops ids with no matching question in the pool (stale/removed)", () => {
    const pool = [q("A"), q("B")];
    const resolved = resolveBookmarkedQuestions(["A", "gone", "B"], pool);
    expect(resolved.map((r) => r.id)).toEqual(["A", "B"]);
  });

  it("returns an empty list when nothing is bookmarked", () => {
    expect(resolveBookmarkedQuestions([], [q("A")])).toEqual([]);
  });
});
