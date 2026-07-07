import { describe, expect, it } from "vitest";
import { buildClozeQuestionPool } from "./cloze";
import { clozeSentences } from "./cloze-data";
import { ADJECTIVE_FORMS } from "./conjugation";
import { buildExamQuestionPool } from "./examBlocks";
import { levelsForRange } from "./levelRange";
import { buildQuestionPool } from "./practice";
import {
  buildAllKnownQuestions,
  buildModeCounts,
  buildPracticeQuestions,
  composeDailySet,
  resolveBookmarkedQuestions,
  uniqueForms,
  type PracticePoolParams
} from "./sessionPools";
import type { PracticeQuestion } from "./types";
import { vocabulary } from "./vocabulary";
import { jlptVocabulary } from "./vocabulary-jlpt";

// Default mode flags = the "basic" drill (every focus flag false). Each
// test flips exactly the flag(s) for the branch it exercises, so the
// branch under test is isolated.
function poolParams(overrides: Partial<PracticePoolParams> = {}): PracticePoolParams {
  return {
    isExamFocus: false,
    isClozeFocus: false,
    isPatternFocus: false,
    isReviewFocus: false,
    isVocabFocus: false,
    isDailyFocus: false,
    isKanaFocus: false,
    isBookmarksFocus: false,
    partOfSpeech: "verb",
    verbGroup: "godan",
    targetForms: ["te"],
    levelRange: "all",
    reviewQueue: [],
    bookmarkedQuestions: [],
    ...overrides
  };
}

describe("buildPracticeQuestions kana branch (#533)", () => {
  it("kana focus builds the requested script's pool, defaulting to hiragana", () => {
    const hira = buildPracticeQuestions(
      poolParams({ isKanaFocus: true, kanaScript: "hiragana", sessionLength: null })
    );
    expect(hira).toHaveLength(208);
    expect(hira.every((question) => question.id.startsWith("kana-hiragana-"))).toBe(true);

    const fallback = buildPracticeQuestions(
      poolParams({ isKanaFocus: true, sessionLength: null })
    );
    expect(fallback.every((question) => question.id.startsWith("kana-hiragana-"))).toBe(true);

    const kata = buildPracticeQuestions(
      poolParams({ isKanaFocus: true, kanaScript: "katakana", sessionLength: null })
    );
    expect(kata).toHaveLength(312);
  });

  it("kana focus honours the session-length cap", () => {
    const capped = buildPracticeQuestions(
      poolParams({ isKanaFocus: true, kanaScript: "hiragana", sessionLength: 10 })
    );
    expect(capped).toHaveLength(10);
  });

  it("buildAllKnownQuestions resolves kana questions (weak-point queue / 收藏)", () => {
    const known = buildAllKnownQuestions();
    expect(known.some((question) => question.id.startsWith("kana-hiragana-"))).toBe(true);
    expect(known.some((question) => question.id.startsWith("kana-katakana-match-"))).toBe(true);
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
    const questions = buildPracticeQuestions(poolParams({ isExamFocus: true, levelRange: "all" }));
    const expected = buildExamQuestionPool("all");

    expect(new Set(questions.map((q) => q.id))).toEqual(new Set(expected.map((q) => q.id)));
  });

  it("exam mode (綜合, n1n2 range): narrows to N1+N2 only", () => {
    const questions = buildPracticeQuestions(poolParams({ isExamFocus: true, levelRange: "n1n2" }));

    expect(questions.length).toBeGreaterThan(0);
    expect(
      questions.every((q) => q.vocabulary.level === "N1" || q.vocabulary.level === "N2")
    ).toBe(true);
  });

  it("exam mode (綜合, n2n3 range): narrows to N2+N3 only", () => {
    const questions = buildPracticeQuestions(poolParams({ isExamFocus: true, levelRange: "n2n3" }));

    expect(questions.length).toBeGreaterThan(0);
    expect(
      questions.every((q) => q.vocabulary.level === "N2" || q.vocabulary.level === "N3")
    ).toBe(true);
  });

  it("exam mode (備考, n4n5 range): narrows to N4+N5 only (#65/#92)", () => {
    const questions = buildPracticeQuestions(poolParams({ isExamFocus: true, levelRange: "n4n5" }));

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
      poolParams({ isExamFocus: true, examSection: { level: "N1", promptLabel } })
    );

    expect(questions.length).toBeGreaterThan(0);
    expect(questions.every((q) => q.vocabulary.level === "N1")).toBe(true);
    expect(questions.every((q) => q.promptLabel === promptLabel)).toBe(true);
  });

  it("cloze mode: returns the cloze pool (same membership)", () => {
    const questions = buildPracticeQuestions(poolParams({ isClozeFocus: true }));
    const expected = buildClozeQuestionPool(clozeSentences, vocabulary);

    expect(new Set(questions.map((q) => q.id))).toEqual(new Set(expected.map((q) => q.id)));
  });

  it("review mode: returns the snapshot queue verbatim (same order, no shuffle)", () => {
    const snapshot = buildExamQuestionPool("N1").slice(0, 3);
    const questions = buildPracticeQuestions(
      poolParams({ isReviewFocus: true, reviewQueue: snapshot })
    );

    expect(questions).toBe(snapshot);
  });

  it("bookmarks mode: returns the bookmarked snapshot verbatim (add-order, no shuffle)", () => {
    const snapshot = buildExamQuestionPool("N1").slice(0, 3);
    const questions = buildPracticeQuestions(
      poolParams({ isBookmarksFocus: true, bookmarkedQuestions: snapshot })
    );

    expect(questions).toBe(snapshot);
  });

  it("bookmarks mode: empty when nothing is starred", () => {
    const questions = buildPracticeQuestions(
      poolParams({ isBookmarksFocus: true, bookmarkedQuestions: [] })
    );
    expect(questions).toEqual([]);
  });

  it("vocab mode: reading-only drill, narrowed by level range", () => {
    const questions = buildPracticeQuestions(poolParams({ isVocabFocus: true, levelRange: "n1n2" }));

    expect(questions.length).toBeGreaterThan(0);
    expect(questions.every((q) => q.targetForm === "reading")).toBe(true);
    expect(
      questions.every((q) => q.vocabulary.level === "N1" || q.vocabulary.level === "N2")
    ).toBe(true);
  });

  it("vocab mode (n4n5 has no JLPT vocab): falls back to a non-empty reading pool (#199)", () => {
    // 単字 only has N1/N2 jlpt entries. A global n4n5 preference must not
    // empty the 単字 pool -- it falls back to the full reading deck.
    const questions = buildPracticeQuestions(poolParams({ isVocabFocus: true, levelRange: "n4n5" }));
    expect(questions.length).toBeGreaterThan(0);
    expect(questions.every((q) => q.targetForm === "reading")).toBe(true);
  });

  it("vocab mode (range all): keeps the whole JLPT vocab reading pool", () => {
    const questions = buildPracticeQuestions(poolParams({ isVocabFocus: true, levelRange: "all" }));
    const expected = buildQuestionPool(jlptVocabulary, {
      partOfSpeech: "mixed",
      verbGroup: "all",
      targetForms: ["reading"]
    });

    expect(new Set(questions.map((q) => q.id))).toEqual(new Set(expected.map((q) => q.id)));
  });

  it("daily mode: composes a finite 今日練習 set from the due snapshot", () => {
    const due = buildExamQuestionPool("N1").slice(0, 4);
    const questions = buildPracticeQuestions(poolParams({ isDailyFocus: true, reviewQueue: due }));

    expect(questions.length).toBeGreaterThan(0);
    expect(questions.length).toBeLessThanOrEqual(20);
    // The due items lead the set (composeDailySet puts reviews first).
    const dueIds = new Set(due.map((q) => q.id));
    const leading = questions.slice(0, due.length);
    expect(leading.every((q) => dueIds.has(q.id))).toBe(true);
  });

  it("daily mode: threads the level range into the composed set (n4n5 -> N4/N5) (#199)", () => {
    const questions = buildPracticeQuestions(
      poolParams({ isDailyFocus: true, reviewQueue: [], levelRange: "n4n5" })
    );
    expect(questions.length).toBeGreaterThan(0);
    expect(
      questions.every((q) => q.vocabulary.level === "N4" || q.vocabulary.level === "N5")
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

  it("初級 n4n5: jlptVocabulary has no N4/N5, so the set fills entirely with N4/N5 exam (no vocab gap) (#199)", () => {
    const set = composeDailySet([], "n4n5");
    expect(set.length).toBeGreaterThan(0);
    expect(set.every((q) => q.vocabulary.level === "N4" || q.vocabulary.level === "N5")).toBe(true);
    // The empty vocab slots roll into N4/N5 exam (which carry their own 4
    // baked options), so EVERY item is exam_style -- no short-option 漢字読み.
    expect(set.every((q) => q.vocabulary.tags?.includes("exam_style"))).toBe(true);
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
      poolParams({ isExamFocus: true, levelRange: "all", attemptedIds })
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
      poolParams({ isExamFocus: true, levelRange: "all", sessionLength: 20, attemptedIds })
    );
    expect(capped.length).toBe(20);
    // The bank has far more than 20 unattempted, so a capped set is all fresh.
    expect(capped.every((q) => !attemptedIds.has(q.id))).toBe(true);
  });

  it("no attemptedIds: membership unchanged (fresh learner sees the plain pool)", () => {
    const out = buildPracticeQuestions(poolParams({ isExamFocus: true, levelRange: "all" }));
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
      poolParams({ isExamFocus: true, levelRange: "all", sessionLength: 20 })
    );
    expect(capped.length).toBe(20);
  });

  it("treats null sessionLength as no cap (full pool)", () => {
    const full = buildPracticeQuestions(
      poolParams({ isExamFocus: true, levelRange: "all", sessionLength: null })
    );
    expect(full.length).toBe(buildExamQuestionPool("all").length);
  });

  it("does NOT cap review mode (clears the whole due queue)", () => {
    const due = buildExamQuestionPool("all").slice(0, 25);
    const questions = buildPracticeQuestions(
      poolParams({ isReviewFocus: true, reviewQueue: due, sessionLength: 20 })
    );
    expect(questions.length).toBe(25);
  });

  it("does NOT shrink 今日練習 below its own target via sessionLength", () => {
    const daily = buildPracticeQuestions(
      poolParams({ isDailyFocus: true, reviewQueue: [], sessionLength: 5 })
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
