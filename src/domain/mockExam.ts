// Mock-exam section blueprints.
//
// 模擬考 mode (App.tsx -> appView === "mock") is a SECTION PICKER: it
// lists the JLPT 言語知識・読解 sections and lets the learner drill one
// section at a time in the normal challenge view. This module supplies
// the canonical section metadata -- label, order, and the `promptLabel`
// that ties each section to its questions in examBlocks.ts -- plus the
// official per-回 target counts (kept for reference / a possible future
// timed mode).
//
// (An earlier version composed and ran a full timed paper here; that was
// dropped for the lighter section picker. See git history if a timed
// full-paper mode is ever wanted again.)
import type { JlptLevel } from "./types";

export type MockExamLevel = Extract<JlptLevel, "N1" | "N2">;

export interface MockExamSection {
  /** Stable id used internally (e.g. "kanji-yomi"). */
  id: string;
  /** Japanese label (matches the JLPT 問題 X conventions for display). */
  labelJa: string;
  /** Short 中文 hint for the section. */
  labelZh: string;
  /**
   * Matched against PracticeQuestion.promptLabel to gather a section's
   * questions. MUST match the strings authored in `examBlocks.ts`
   * exactly, or the section shows up empty.
   */
  promptLabel: string;
  /** Number of questions per official 1 回 (reference only). */
  targetCount: number;
}

export interface MockExamBlueprint {
  level: MockExamLevel;
  /** Official 言語知識・読解 duration in minutes (reference only). */
  totalMinutes: number;
  sections: MockExamSection[];
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
