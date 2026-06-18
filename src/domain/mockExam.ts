// Mock-exam composer.
//
// Mock-exam mode is a separate top-level view (App.tsx -> appView === "mock")
// that mimics the JLPT 言語知識・読解 paper structure: pull questions
// section-by-section to match the official 1-回 quotas, run them without
// per-question feedback, then show a per-section score + wrong-answer
// review at the end.
//
// Why a dedicated composer (instead of just calling shuffleQuestions on
// buildExamQuestionPool(level)):
//   1. The real exam is structured. A 73-question paper hits 14 different
//      問題 sections in fixed counts -- not a uniform shuffle. The composer
//      enforces the section structure so the practice feels like the test.
//   2. Some sections are still empty (漢字書寫 表記 / 語形成 / 読解 5
//      sections). The composer reports a `gap` per section so the UI can
//      surface "this section is short" instead of silently truncating.
//   3. Mock exam attempts are session-local (NOT written to attemptStore)
//      so the result of a mock doesn't pollute the per-vocabulary progress
//      tracker. Keeping the composer pure makes that boundary clean.
import type { JlptLevel, PracticeQuestion } from "./types";

export type MockExamLevel = Extract<JlptLevel, "N1" | "N2">;

export interface MockExamSection {
  /** Stable id used internally (e.g. "kanji-yomi"). */
  id: string;
  /** Japanese label (matches the JLPT 問題 X conventions for display). */
  labelJa: string;
  /** Short 中文 hint for the section. */
  labelZh: string;
  /**
   * Value the composer matches against PracticeQuestion.promptLabel.
   * MUST match the strings authored in `examBlocks.ts` exactly, or the
   * section will silently report a gap of 100%.
   */
  promptLabel: string;
  /** Number of questions per official 1 回. */
  targetCount: number;
}

export interface MockExamBlueprint {
  level: MockExamLevel;
  /** Official 言語知識・読解 duration in minutes. Reference only -- the
   *  runner shows elapsed time, not a hard countdown. */
  totalMinutes: number;
  sections: MockExamSection[];
}

export interface MockExamSectionPlan {
  section: MockExamSection;
  /** Questions chosen for this run (already in display order). */
  questions: PracticeQuestion[];
  /** Shortfall vs targetCount. Always >= 0. */
  gap: number;
}

export interface MockExamPlan {
  blueprint: MockExamBlueprint;
  sections: MockExamSectionPlan[];
  totalTarget: number;
  totalPicked: number;
  totalGap: number;
}

// Official JLPT 1 回 structure (言語知識・読解 paper only -- 聴解 is its own
// paper and out of scope for this app). Counts taken from the JLPT
// official guide; treat them as the contract -- if 国際交流基金 ever
// revises, update here.
export const N2_BLUEPRINT: MockExamBlueprint = {
  level: "N2",
  totalMinutes: 105,
  sections: [
    { id: "kanji-yomi", labelJa: "漢字読み", labelZh: "漢字讀音", promptLabel: "漢字読み", targetCount: 5 },
    { id: "hyoki", labelJa: "表記", labelZh: "漢字書寫", promptLabel: "表記", targetCount: 5 },
    { id: "go-keisei", labelJa: "語形成", labelZh: "詞形成（N2 限定）", promptLabel: "語形成", targetCount: 3 },
    { id: "bunmyaku-kitei", labelJa: "文脈規定", labelZh: "詞彙填空", promptLabel: "詞彙填空", targetCount: 7 },
    { id: "iikae-ruigi", labelJa: "言い換え類義", labelZh: "類義替換", promptLabel: "類義替換", targetCount: 5 },
    { id: "yohou", labelJa: "用法", labelZh: "詞彙用法", promptLabel: "詞彙用法", targetCount: 5 },
    { id: "bun-bunpou-1", labelJa: "文の文法 1（文法形式の判断）", labelZh: "文法形式判斷", promptLabel: "文法形式選擇", targetCount: 12 },
    { id: "bun-bunpou-2", labelJa: "文の文法 2（文の組み立て）", labelZh: "句子組合（★ 題）", promptLabel: "語順組合", targetCount: 5 },
    { id: "bunshou-bunpou", labelJa: "文章の文法", labelZh: "文章脈絡填空", promptLabel: "文章脈絡", targetCount: 5 },
    { id: "dokkai-short", labelJa: "内容理解（短文）", labelZh: "短文閱讀", promptLabel: "内容理解（短文）", targetCount: 5 },
    { id: "dokkai-mid", labelJa: "内容理解（中文）", labelZh: "中文閱讀", promptLabel: "内容理解（中文）", targetCount: 9 },
    { id: "togo", labelJa: "統合理解", labelZh: "綜合理解（雙文）", promptLabel: "統合理解", targetCount: 2 },
    { id: "shucho", labelJa: "主張理解（長文）", labelZh: "主張理解（長文）", promptLabel: "主張理解", targetCount: 3 },
    { id: "joho-kensaku", labelJa: "情報検索", labelZh: "資訊檢索", promptLabel: "情報検索", targetCount: 2 }
  ]
};

export const N1_BLUEPRINT: MockExamBlueprint = {
  level: "N1",
  totalMinutes: 110,
  sections: [
    { id: "kanji-yomi", labelJa: "漢字読み", labelZh: "漢字讀音", promptLabel: "漢字読み", targetCount: 6 },
    { id: "bunmyaku-kitei", labelJa: "文脈規定", labelZh: "詞彙填空", promptLabel: "詞彙填空", targetCount: 7 },
    { id: "iikae-ruigi", labelJa: "言い換え類義", labelZh: "類義替換", promptLabel: "類義替換", targetCount: 6 },
    { id: "yohou", labelJa: "用法", labelZh: "詞彙用法", promptLabel: "詞彙用法", targetCount: 6 },
    { id: "bun-bunpou-1", labelJa: "文の文法 1（文法形式の判断）", labelZh: "文法形式判斷", promptLabel: "文法形式選擇", targetCount: 10 },
    { id: "bun-bunpou-2", labelJa: "文の文法 2（文の組み立て）", labelZh: "句子組合（★ 題）", promptLabel: "語順組合", targetCount: 5 },
    { id: "bunshou-bunpou", labelJa: "文章の文法", labelZh: "文章脈絡填空", promptLabel: "文章脈絡", targetCount: 5 },
    { id: "dokkai-short", labelJa: "内容理解（短文）", labelZh: "短文閱讀", promptLabel: "内容理解（短文）", targetCount: 4 },
    { id: "dokkai-mid", labelJa: "内容理解（中文）", labelZh: "中文閱讀", promptLabel: "内容理解（中文）", targetCount: 9 },
    { id: "togo", labelJa: "統合理解", labelZh: "綜合理解（雙文）", promptLabel: "統合理解", targetCount: 2 },
    { id: "shucho", labelJa: "主張理解（長文）", labelZh: "主張理解（長文）", promptLabel: "主張理解", targetCount: 4 },
    { id: "joho-kensaku", labelJa: "情報検索", labelZh: "資訊檢索", promptLabel: "情報検索", targetCount: 2 }
  ]
};

export function getMockExamBlueprint(level: MockExamLevel): MockExamBlueprint {
  return level === "N1" ? N1_BLUEPRINT : N2_BLUEPRINT;
}

/**
 * Compose a mock-exam plan: walk each blueprint section, pull up to
 * `targetCount` matching questions from the pool, and report any
 * shortfall.
 *
 * The `shuffle` argument is injectable so tests can pass an identity
 * function and assert deterministic selection. In production the
 * default `Math.random`-based Fisher-Yates is fine -- the user wants
 * variety per run, not reproducibility.
 *
 * Note: a question is consumed at most ONCE within a single composition.
 * Sections are matched by exact `promptLabel`, so a question authored
 * with `promptLabel: "漢字読み"` can only land in the kanji-yomi
 * section; cross-section collisions are structurally impossible.
 */
export function composeMockExam(
  level: MockExamLevel,
  pool: PracticeQuestion[],
  shuffle: <T>(items: T[]) => T[] = defaultShuffle
): MockExamPlan {
  const blueprint = getMockExamBlueprint(level);
  const levelPool = pool.filter((q) => q.vocabulary.level === level);

  const sections: MockExamSectionPlan[] = blueprint.sections.map((section) => {
    const matching = levelPool.filter((q) => q.promptLabel === section.promptLabel);
    const picked = shuffle(matching).slice(0, section.targetCount);
    return {
      section,
      questions: picked,
      gap: Math.max(0, section.targetCount - picked.length)
    };
  });

  const totalTarget = blueprint.sections.reduce((sum, s) => sum + s.targetCount, 0);
  const totalPicked = sections.reduce((sum, s) => sum + s.questions.length, 0);
  const totalGap = sections.reduce((sum, s) => sum + s.gap, 0);

  return { blueprint, sections, totalTarget, totalPicked, totalGap };
}

export interface MockExamQuestionResult {
  question: PracticeQuestion;
  /** Learner-submitted choice, or null if they skipped the question. */
  submittedAnswer: string | null;
  isCorrect: boolean;
  wasAnswered: boolean;
}

export interface MockExamSectionSummary {
  section: MockExamSection;
  results: MockExamQuestionResult[];
  correct: number;
  answered: number;
  total: number;
  /** Shortfall this section had vs blueprint targetCount (carry-through). */
  gap: number;
}

export interface MockExamSummary {
  plan: MockExamPlan;
  sections: MockExamSectionSummary[];
  totalCorrect: number;
  totalAnswered: number;
  totalQuestions: number;
  /** 0-100, computed over questions actually presented (not blueprint
   *  target). Unanswered counts as wrong here. */
  accuracyPercent: number;
}

/**
 * Aggregate per-question answers into a per-section summary. The
 * `answers` map is keyed by `PracticeQuestion.id` -> raw submitted
 * string. Missing keys count as "skipped" (wasAnswered: false,
 * isCorrect: false).
 */
export function summarizeMockExam(
  plan: MockExamPlan,
  answers: Map<string, string>
): MockExamSummary {
  const sections = plan.sections.map((sp): MockExamSectionSummary => {
    const results: MockExamQuestionResult[] = sp.questions.map((question) => {
      const submitted = answers.get(question.id);
      const wasAnswered = submitted !== undefined && submitted !== "";
      const isCorrect = wasAnswered
        ? question.expectedAnswers.includes(submitted as string)
        : false;
      return {
        question,
        submittedAnswer: wasAnswered ? (submitted as string) : null,
        isCorrect,
        wasAnswered
      };
    });

    return {
      section: sp.section,
      results,
      correct: results.filter((r) => r.isCorrect).length,
      answered: results.filter((r) => r.wasAnswered).length,
      total: results.length,
      gap: sp.gap
    };
  });

  const totalCorrect = sections.reduce((sum, s) => sum + s.correct, 0);
  const totalAnswered = sections.reduce((sum, s) => sum + s.answered, 0);
  const totalQuestions = sections.reduce((sum, s) => sum + s.total, 0);
  const accuracyPercent =
    totalQuestions === 0 ? 0 : Math.round((totalCorrect / totalQuestions) * 100);

  return {
    plan,
    sections,
    totalCorrect,
    totalAnswered,
    totalQuestions,
    accuracyPercent
  };
}

/**
 * Flatten a plan's sections back into a single sequential question
 * array, in section order. UI runner iterates over this.
 */
export function flattenMockExam(plan: MockExamPlan): PracticeQuestion[] {
  return plan.sections.flatMap((sp) => sp.questions);
}

function defaultShuffle<T>(items: T[]): T[] {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
