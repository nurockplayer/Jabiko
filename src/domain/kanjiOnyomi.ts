import type { JlptLevel } from "./types";
import { jlptVocabulary } from "./vocabulary-jlpt";

// 音読み (on'yomi) study table -- a self-authored subset, NOT imported from
// KANJIDIC (keeps the bank original + license-clean, matching the rest of
// the content). Each entry is just the kanji + its reading(s) + a Chinese
// gloss + level; EXAMPLE WORDS are pulled at runtime from jlptVocabulary
// (see kanjiExamples), so the table always centres on real words (the
// reading lives in the compound, not in an isolated kanji) and needs no
// hand-maintained example list.
//
// onyomi is stored in HIRAGANA to match the reading drills + Phase 1
// confusers (the UI labels it as 音読み). The first entry is the primary
// reading and drives the homophone grouping.
export type KanjiOnyomiEntry = {
  kanji: string;
  onyomi: string[];
  meaningZh: string;
  level: JlptLevel;
};

export const kanjiOnyomi: KanjiOnyomiEntry[] = [
  // -- かい --------------------------------------------------------------
  { kanji: "解", onyomi: ["かい", "げ"], meaningZh: "解開、理解", level: "N2" },
  { kanji: "開", onyomi: ["かい"], meaningZh: "打開、開始", level: "N2" },
  { kanji: "介", onyomi: ["かい"], meaningZh: "介於、介紹", level: "N2" },
  { kanji: "改", onyomi: ["かい"], meaningZh: "改變、修改", level: "N2" },
  // -- き ----------------------------------------------------------------
  { kanji: "機", onyomi: ["き"], meaningZh: "機械、時機", level: "N2" },
  { kanji: "危", onyomi: ["き"], meaningZh: "危險", level: "N2" },
  { kanji: "規", onyomi: ["き"], meaningZh: "規則、規範", level: "N2" },
  { kanji: "基", onyomi: ["き"], meaningZh: "基礎、根基", level: "N2" },
  // -- かん --------------------------------------------------------------
  { kanji: "観", onyomi: ["かん"], meaningZh: "觀看、看法", level: "N2" },
  { kanji: "関", onyomi: ["かん"], meaningZh: "關係、相關", level: "N2" },
  { kanji: "感", onyomi: ["かん"], meaningZh: "感覺、感受", level: "N2" },
  // -- せい --------------------------------------------------------------
  { kanji: "成", onyomi: ["せい", "じょう"], meaningZh: "完成、形成", level: "N2" },
  { kanji: "正", onyomi: ["せい", "しょう"], meaningZh: "正確、端正", level: "N2" },
  { kanji: "制", onyomi: ["せい"], meaningZh: "制度、控制", level: "N2" },
  // -- たい --------------------------------------------------------------
  { kanji: "対", onyomi: ["たい"], meaningZh: "相對、對於", level: "N2" },
  { kanji: "退", onyomi: ["たい"], meaningZh: "後退、退出", level: "N2" },
  // -- ちょう ------------------------------------------------------------
  { kanji: "調", onyomi: ["ちょう"], meaningZh: "調查、調整", level: "N2" },
  { kanji: "張", onyomi: ["ちょう"], meaningZh: "主張、伸張", level: "N2" },
  // -- じょう ------------------------------------------------------------
  { kanji: "情", onyomi: ["じょう"], meaningZh: "情感、情報", level: "N2" },
  { kanji: "状", onyomi: ["じょう"], meaningZh: "狀態、形狀", level: "N2" },
  // -- つう --------------------------------------------------------------
  { kanji: "通", onyomi: ["つう"], meaningZh: "通過、普遍", level: "N2" },
  // -- こう --------------------------------------------------------------
  { kanji: "効", onyomi: ["こう"], meaningZh: "效果、有效", level: "N3" },
  { kanji: "工", onyomi: ["こう", "く"], meaningZh: "工程、工夫", level: "N3" },
  { kanji: "交", onyomi: ["こう"], meaningZh: "交往、交叉", level: "N3" },
  { kanji: "構", onyomi: ["こう"], meaningZh: "構造、構成", level: "N2" },
  { kanji: "攻", onyomi: ["こう"], meaningZh: "攻擊、進攻", level: "N1" },
  // -- しょう ------------------------------------------------------------
  { kanji: "消", onyomi: ["しょう"], meaningZh: "消失、消費", level: "N3" },
  { kanji: "招", onyomi: ["しょう"], meaningZh: "招待、招來", level: "N3" },
  { kanji: "証", onyomi: ["しょう"], meaningZh: "證明、證據", level: "N2" },
  // -- きょう ------------------------------------------------------------
  { kanji: "教", onyomi: ["きょう"], meaningZh: "教導、教育", level: "N3" },
  { kanji: "競", onyomi: ["きょう", "けい"], meaningZh: "競爭、競賽", level: "N2" },
  { kanji: "強", onyomi: ["きょう", "ごう"], meaningZh: "強烈、強調", level: "N3" },
  { kanji: "共", onyomi: ["きょう"], meaningZh: "共同、一起", level: "N3" },
  // -- か ----------------------------------------------------------------
  { kanji: "化", onyomi: ["か", "け"], meaningZh: "變化、化為", level: "N3" },
  { kanji: "加", onyomi: ["か"], meaningZh: "增加、加入", level: "N3" },
  { kanji: "価", onyomi: ["か"], meaningZh: "價值、價格", level: "N3" },
  { kanji: "可", onyomi: ["か"], meaningZh: "可以、可能", level: "N3" },
  { kanji: "過", onyomi: ["か"], meaningZh: "經過、過度", level: "N1" },
  // -- げん --------------------------------------------------------------
  { kanji: "減", onyomi: ["げん"], meaningZh: "減少、削減", level: "N3" },
  { kanji: "限", onyomi: ["げん"], meaningZh: "限制、界限", level: "N2" },
  { kanji: "現", onyomi: ["げん"], meaningZh: "出現、現在", level: "N2" }
];

export type KanjiExample = { surface: string; reading: string; meaningZh: string };

/**
 * Real words from jlptVocabulary that contain this kanji -- the example
 * compounds shown on the kanji card. Sorted shortest-first (the simplest
 * compound reads most clearly) and capped, since a kanji card only needs
 * a few illustrative words, not every occurrence.
 */
export function kanjiExamples(kanji: string, limit = 6): KanjiExample[] {
  return jlptVocabulary
    .filter((item) => item.surface.includes(kanji))
    .sort((a, b) => a.surface.length - b.surface.length)
    .slice(0, limit)
    .map((item) => ({ surface: item.surface, reading: item.reading, meaningZh: item.meaningZh }));
}
