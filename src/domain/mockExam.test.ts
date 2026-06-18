import { describe, expect, it } from "vitest";
import { buildExamQuestionPool } from "./examBlocks";
import {
  composeMockExam,
  flattenMockExam,
  getMockExamBlueprint,
  N1_BLUEPRINT,
  N2_BLUEPRINT,
  summarizeMockExam
} from "./mockExam";
import type { PracticeQuestion, VocabularyItem } from "./types";

// Identity "shuffle" makes the composer deterministic for tests.
const identityShuffle = <T>(items: T[]): T[] => [...items];

function makeQuestion(
  id: string,
  level: "N1" | "N2",
  promptLabel: string,
  expected: string,
  options: string[]
): PracticeQuestion {
  const vocab: VocabularyItem = {
    id,
    surface: id,
    reading: id,
    meaningZh: "test",
    partOfSpeech: "noun",
    group: null,
    lesson: null,
    tags: [],
    examples: [],
    level
  };
  return {
    id,
    vocabulary: vocab,
    targetForm: "meaning",
    expectedAnswers: [expected],
    explanation: "",
    promptLabel,
    options
  };
}

describe("getMockExamBlueprint", () => {
  it("returns the N2 blueprint with the official 73-question total", () => {
    const bp = getMockExamBlueprint("N2");
    const total = bp.sections.reduce((sum, s) => sum + s.targetCount, 0);
    expect(bp).toBe(N2_BLUEPRINT);
    expect(total).toBe(73);
  });

  it("returns the N1 blueprint with the official 66-question total", () => {
    const bp = getMockExamBlueprint("N1");
    const total = bp.sections.reduce((sum, s) => sum + s.targetCount, 0);
    expect(bp).toBe(N1_BLUEPRINT);
    expect(total).toBe(66);
  });
});

describe("composeMockExam", () => {
  it("respects each section's targetCount and reports gap=0 when pool is sufficient", () => {
    // Build a pool with exactly enough questions for each N2 section.
    const pool: PracticeQuestion[] = N2_BLUEPRINT.sections.flatMap((section) =>
      Array.from({ length: section.targetCount + 2 }, (_, i) =>
        makeQuestion(`${section.id}-q${i}`, "N2", section.promptLabel, "a", ["a", "b", "c", "d"])
      )
    );

    const plan = composeMockExam("N2", pool, identityShuffle);

    for (const sp of plan.sections) {
      expect(sp.questions.length).toBe(sp.section.targetCount);
      expect(sp.gap).toBe(0);
    }
    expect(plan.totalGap).toBe(0);
    expect(plan.totalPicked).toBe(73);
  });

  it("reports gap correctly when a section has no matching questions", () => {
    // Only seed the 漢字読み section; everything else should report gap.
    const pool: PracticeQuestion[] = Array.from({ length: 10 }, (_, i) =>
      makeQuestion(`kanji-${i}`, "N2", "漢字読み", "a", ["a", "b", "c", "d"])
    );

    const plan = composeMockExam("N2", pool, identityShuffle);

    const kanji = plan.sections.find((s) => s.section.promptLabel === "漢字読み")!;
    expect(kanji.questions.length).toBe(5);
    expect(kanji.gap).toBe(0);

    for (const sp of plan.sections) {
      if (sp.section.promptLabel === "漢字読み") continue;
      expect(sp.questions.length).toBe(0);
      expect(sp.gap).toBe(sp.section.targetCount);
    }
    expect(plan.totalPicked).toBe(5);
    expect(plan.totalGap).toBe(73 - 5);
  });

  it("filters by level: an N1 question is never picked for an N2 exam", () => {
    const pool: PracticeQuestion[] = [
      makeQuestion("n1-x", "N1", "漢字読み", "a", ["a", "b", "c", "d"]),
      makeQuestion("n2-x", "N2", "漢字読み", "a", ["a", "b", "c", "d"])
    ];

    const plan = composeMockExam("N2", pool, identityShuffle);
    const kanji = plan.sections.find((s) => s.section.promptLabel === "漢字読み")!;

    expect(kanji.questions.map((q) => q.id)).toEqual(["n2-x"]);
  });

  it("does not duplicate a single question across sections", () => {
    const plan = composeMockExam("N2", buildExamQuestionPool("N2"), identityShuffle);
    const flat = flattenMockExam(plan);
    const ids = flat.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("produces a non-empty plan from the real N2 exam pool (sanity)", () => {
    const plan = composeMockExam("N2", buildExamQuestionPool("N2"));
    expect(plan.totalPicked).toBeGreaterThan(0);
    // The current exam bank still has 0 読解 items -- this asserts the
    // composer correctly surfaces that as a non-zero gap rather than
    // silently truncating to a 50-question paper that pretends to be
    // complete. Remove or weaken this assertion only when 読解 items
    // are added to examBlocks.ts.
    expect(plan.totalGap).toBeGreaterThan(0);
  });
});

describe("summarizeMockExam", () => {
  it("counts correct, answered, and skipped questions per section", () => {
    const q1 = makeQuestion("q1", "N2", "漢字読み", "a", ["a", "b", "c", "d"]);
    const q2 = makeQuestion("q2", "N2", "漢字読み", "b", ["a", "b", "c", "d"]);
    const q3 = makeQuestion("q3", "N2", "漢字読み", "c", ["a", "b", "c", "d"]);
    const q4 = makeQuestion("q4", "N2", "漢字読み", "d", ["a", "b", "c", "d"]);
    const q5 = makeQuestion("q5", "N2", "漢字読み", "a", ["a", "b", "c", "d"]);

    const plan = composeMockExam("N2", [q1, q2, q3, q4, q5], identityShuffle);

    const answers = new Map<string, string>([
      ["q1", "a"], // correct
      ["q2", "b"], // correct
      ["q3", "x"], // wrong
      // q4 skipped
      ["q5", ""] // explicit-empty also counts as skipped
    ]);

    const summary = summarizeMockExam(plan, answers);
    const kanji = summary.sections.find((s) => s.section.promptLabel === "漢字読み")!;

    expect(kanji.correct).toBe(2);
    expect(kanji.answered).toBe(3);
    expect(kanji.total).toBe(5);
    expect(summary.totalCorrect).toBe(2);
    expect(summary.totalAnswered).toBe(3);
    // 2/5 = 40
    expect(summary.accuracyPercent).toBe(40);
  });

  it("handles an empty plan without dividing by zero", () => {
    // Empty pool -> every section has 0 questions.
    const plan = composeMockExam("N2", [], identityShuffle);
    const summary = summarizeMockExam(plan, new Map());

    expect(summary.totalQuestions).toBe(0);
    expect(summary.accuracyPercent).toBe(0);
  });
});

describe("flattenMockExam", () => {
  it("preserves section order in the flat output", () => {
    const q1 = makeQuestion("q1", "N2", "漢字読み", "a", ["a", "b", "c", "d"]);
    const q2 = makeQuestion("q2", "N2", "文法形式選擇", "a", ["a", "b", "c", "d"]);
    const plan = composeMockExam("N2", [q2, q1], identityShuffle);

    const flat = flattenMockExam(plan);
    // 漢字読み is section index 0 in the N2 blueprint; 文法形式選擇 is
    // later. So the kanji item must come first regardless of pool order.
    expect(flat[0]?.id).toBe("q1");
  });
});
