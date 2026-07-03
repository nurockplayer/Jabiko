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
import type { JlptLevel, LocaleCode, LocalizedText } from "./types";

export type MockExamLevel = Extract<JlptLevel, "N1" | "N2" | "N3">;

export interface MockExamSection {
  /** Stable id used internally (e.g. "kanji-yomi"). */
  id: string;
  /** Japanese label (matches the JLPT 問題 X conventions for display). */
  labelJa: string;
  /** Short 中文 hint for the section. */
  labelZh: string;
  /**
   * Per-locale subtitle hints (#427/#434). `en` ships today; adding another
   * locale is just another key — `sectionSubtitle` reads whatever is here and
   * falls back to the zh hint. `ja` is intentionally absent: labelJa already
   * IS the official Japanese name, so ja needs no subtitle.
   */
  labelI18n: LocalizedText;
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

/**
 * The subtitle under a section's Japanese name, per UI locale (#427/#434):
 * ja gets none (labelJa already IS the Japanese name); every other locale
 * reads its labelI18n entry and falls back to the zh hint when absent --
 * matching the app-wide zh-fallback rule for content locales.
 */
export function sectionSubtitle(section: MockExamSection, locale: LocaleCode): string | null {
  if (locale === "ja") return null;
  return section.labelI18n[locale] ?? section.labelZh;
}

// Official JLPT 1 回 structure (言語知識・読解 paper only -- 聴解 is its own
// paper and out of scope for this app). Counts taken from the JLPT
// official guide; treat them as the contract -- if 国際交流基金 ever
// revises, update here.
export const N2_BLUEPRINT: MockExamBlueprint = {
  level: "N2",
  totalMinutes: 105,
  sections: [
    { id: "kanji-yomi", labelJa: "漢字読み", labelZh: "漢字讀音", labelI18n: { en: "Kanji reading" }, promptLabel: "漢字読み", targetCount: 5 },
    { id: "hyoki", labelJa: "表記", labelZh: "漢字書寫", labelI18n: { en: "Orthography (kanji writing)" }, promptLabel: "表記", targetCount: 5 },
    { id: "go-keisei", labelJa: "語形成", labelZh: "詞形成（N2 限定）", labelI18n: { en: "Word formation (N2 only)" }, promptLabel: "語形成", targetCount: 3 },
    { id: "bunmyaku-kitei", labelJa: "文脈規定", labelZh: "詞彙填空", labelI18n: { en: "Vocabulary in context" }, promptLabel: "詞彙填空", targetCount: 7 },
    { id: "iikae-ruigi", labelJa: "言い換え類義", labelZh: "類義替換", labelI18n: { en: "Paraphrase (synonyms)" }, promptLabel: "類義替換", targetCount: 5 },
    { id: "yohou", labelJa: "用法", labelZh: "詞彙用法", labelI18n: { en: "Word usage" }, promptLabel: "詞彙用法", targetCount: 5 },
    { id: "bun-bunpou-1", labelJa: "文の文法 1（文法形式の判断）", labelZh: "文法形式判斷", labelI18n: { en: "Grammar form selection" }, promptLabel: "文法形式選擇", targetCount: 12 },
    { id: "bun-bunpou-2", labelJa: "文の文法 2（文の組み立て）", labelZh: "句子組合（★ 題）", labelI18n: { en: "Sentence assembly (★)" }, promptLabel: "語順組合", targetCount: 5 },
    { id: "bunshou-bunpou", labelJa: "文章の文法", labelZh: "文章脈絡填空", labelI18n: { en: "Passage cloze" }, promptLabel: "文章脈絡", targetCount: 5 },
    { id: "dokkai-short", labelJa: "内容理解（短文）", labelZh: "短文閱讀", labelI18n: { en: "Reading: short passages" }, promptLabel: "内容理解（短文）", targetCount: 5 },
    { id: "dokkai-mid", labelJa: "内容理解（中文）", labelZh: "中文閱讀", labelI18n: { en: "Reading: mid-length passages" }, promptLabel: "内容理解（中文）", targetCount: 9 },
    { id: "togo", labelJa: "統合理解", labelZh: "綜合理解（雙文）", labelI18n: { en: "Integrated comprehension (two texts)" }, promptLabel: "統合理解", targetCount: 2 },
    { id: "shucho", labelJa: "主張理解（長文）", labelZh: "主張理解（長文）", labelI18n: { en: "Thesis comprehension (long passage)" }, promptLabel: "主張理解", targetCount: 3 },
    { id: "joho-kensaku", labelJa: "情報検索", labelZh: "資訊檢索", labelI18n: { en: "Information retrieval" }, promptLabel: "情報検索", targetCount: 2 }
  ]
};

export const N1_BLUEPRINT: MockExamBlueprint = {
  level: "N1",
  totalMinutes: 110,
  sections: [
    { id: "kanji-yomi", labelJa: "漢字読み", labelZh: "漢字讀音", labelI18n: { en: "Kanji reading" }, promptLabel: "漢字読み", targetCount: 6 },
    { id: "bunmyaku-kitei", labelJa: "文脈規定", labelZh: "詞彙填空", labelI18n: { en: "Vocabulary in context" }, promptLabel: "詞彙填空", targetCount: 7 },
    { id: "iikae-ruigi", labelJa: "言い換え類義", labelZh: "類義替換", labelI18n: { en: "Paraphrase (synonyms)" }, promptLabel: "類義替換", targetCount: 6 },
    { id: "yohou", labelJa: "用法", labelZh: "詞彙用法", labelI18n: { en: "Word usage" }, promptLabel: "詞彙用法", targetCount: 6 },
    { id: "bun-bunpou-1", labelJa: "文の文法 1（文法形式の判断）", labelZh: "文法形式判斷", labelI18n: { en: "Grammar form selection" }, promptLabel: "文法形式選擇", targetCount: 10 },
    { id: "bun-bunpou-2", labelJa: "文の文法 2（文の組み立て）", labelZh: "句子組合（★ 題）", labelI18n: { en: "Sentence assembly (★)" }, promptLabel: "語順組合", targetCount: 5 },
    { id: "bunshou-bunpou", labelJa: "文章の文法", labelZh: "文章脈絡填空", labelI18n: { en: "Passage cloze" }, promptLabel: "文章脈絡", targetCount: 5 },
    { id: "dokkai-short", labelJa: "内容理解（短文）", labelZh: "短文閱讀", labelI18n: { en: "Reading: short passages" }, promptLabel: "内容理解（短文）", targetCount: 4 },
    { id: "dokkai-mid", labelJa: "内容理解（中文）", labelZh: "中文閱讀", labelI18n: { en: "Reading: mid-length passages" }, promptLabel: "内容理解（中文）", targetCount: 9 },
    { id: "togo", labelJa: "統合理解", labelZh: "綜合理解（雙文）", labelI18n: { en: "Integrated comprehension (two texts)" }, promptLabel: "統合理解", targetCount: 2 },
    { id: "shucho", labelJa: "主張理解（長文）", labelZh: "主張理解（長文）", labelI18n: { en: "Thesis comprehension (long passage)" }, promptLabel: "主張理解", targetCount: 4 },
    { id: "joho-kensaku", labelJa: "情報検索", labelZh: "資訊檢索", labelI18n: { en: "Information retrieval" }, promptLabel: "情報検索", targetCount: 2 }
  ]
};

// N3 言語知識（文字・語彙）・（文法）・読解 (聴解 is out of scope). N3 differs
// from N2/N1: NO 語形成, and its long reading is plain 内容理解（長文） rather
// than 統合理解 / 主張理解. The 文字・語彙 (30 min) + 文法・読解 (70 min) papers are
// merged here into one section list, matching the N1/N2 blueprint shape.
// promptLabels mirror the strings authored for N3 in examBlocks.ts; sections
// with no authored items yet (表記 / 語順組合 / 読解) render as "準備中".
export const N3_BLUEPRINT: MockExamBlueprint = {
  level: "N3",
  totalMinutes: 100,
  sections: [
    { id: "kanji-yomi", labelJa: "漢字読み", labelZh: "漢字讀音", labelI18n: { en: "Kanji reading" }, promptLabel: "漢字読み", targetCount: 8 },
    { id: "hyoki", labelJa: "表記", labelZh: "漢字書寫", labelI18n: { en: "Orthography (kanji writing)" }, promptLabel: "表記", targetCount: 6 },
    { id: "bunmyaku-kitei", labelJa: "文脈規定", labelZh: "詞彙填空", labelI18n: { en: "Vocabulary in context" }, promptLabel: "詞彙填空", targetCount: 11 },
    { id: "iikae-ruigi", labelJa: "言い換え類義", labelZh: "類義替換", labelI18n: { en: "Paraphrase (synonyms)" }, promptLabel: "類義替換", targetCount: 5 },
    { id: "yohou", labelJa: "用法", labelZh: "詞彙用法", labelI18n: { en: "Word usage" }, promptLabel: "詞彙用法", targetCount: 5 },
    { id: "bun-bunpou-1", labelJa: "文の文法 1（文法形式の判断）", labelZh: "文法形式判斷", labelI18n: { en: "Grammar form selection" }, promptLabel: "文法形式選擇", targetCount: 13 },
    { id: "bun-bunpou-2", labelJa: "文の文法 2（文の組み立て）", labelZh: "句子組合（★ 題）", labelI18n: { en: "Sentence assembly (★)" }, promptLabel: "語順組合", targetCount: 5 },
    { id: "bunshou-bunpou", labelJa: "文章の文法", labelZh: "文章脈絡填空", labelI18n: { en: "Passage cloze" }, promptLabel: "文章脈絡", targetCount: 5 },
    { id: "dokkai-short", labelJa: "内容理解（短文）", labelZh: "短文閱讀", labelI18n: { en: "Reading: short passages" }, promptLabel: "内容理解（短文）", targetCount: 4 },
    { id: "dokkai-mid", labelJa: "内容理解（中文）", labelZh: "中文閱讀", labelI18n: { en: "Reading: mid-length passages" }, promptLabel: "内容理解（中文）", targetCount: 6 },
    { id: "dokkai-long", labelJa: "内容理解（長文）", labelZh: "長文閱讀", labelI18n: { en: "Reading: long passages" }, promptLabel: "内容理解（長文）", targetCount: 4 },
    { id: "joho-kensaku", labelJa: "情報検索", labelZh: "資訊檢索", labelI18n: { en: "Information retrieval" }, promptLabel: "情報検索", targetCount: 2 }
  ]
};

export function getMockExamBlueprint(level: MockExamLevel): MockExamBlueprint {
  if (level === "N1") return N1_BLUEPRINT;
  if (level === "N3") return N3_BLUEPRINT;
  return N2_BLUEPRINT;
}
