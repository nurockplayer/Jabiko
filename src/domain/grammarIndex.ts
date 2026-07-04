// JLPT 文型查詢與篩選工具（Issue #437）
//
// 提供跨等級瀏覽、關鍵字搜尋、相近文型查詢等功能。
// 此模組僅依賴型別定義與 grammarDatabase 的純資料，不帶 React 或 UI 依賴。
import type { JlptLevel } from "./types";
import {
  grammarPatterns,
  type GrammarPattern,
} from "./grammarDatabase";

/** 按 JLPT 等級取得文型列表 */
export function getPatternsByLevel(level: JlptLevel): GrammarPattern[] {
  return grammarPatterns.filter((p) => p.level === level).sort((a, b) => a.id.localeCompare(b.id));
}

/** 取得所有等級的文型，依等級分組 */
export function getPatternsGroupedByLevel(): Record<JlptLevel, GrammarPattern[]> {
  const grouped: Record<JlptLevel, GrammarPattern[]> = {
    N5: [],
    N4: [],
    N3: [],
    N2: [],
    N1: [],
  };
  for (const pattern of grammarPatterns) {
    grouped[pattern.level].push(pattern);
  }
  // 各等級內部排序
  for (const level of Object.keys(grouped) as JlptLevel[]) {
    grouped[level].sort((a, b) => a.id.localeCompare(b.id));
  }
  return grouped;
}

/** 依 id 取得單一文型 */
export function getPatternById(id: string): GrammarPattern | undefined {
  return grammarPatterns.find((p) => p.id === id);
}

/** 依 surface 比對文型（自動處理 〜/～ 前綴） */
export function findPatternBySurface(surface: string): GrammarPattern | undefined {
  return grammarPatterns.find(
    (p) => p.pattern === surface || p.pattern === `〜${surface.replace(/^[〜～]/, "")}`
  );
}

/** 文型的可導覽 surface（去掉開頭的 〜/～，與索引點擊 onOpenPattern 一致）。 */
export function patternSurface(pattern: GrammarPattern): string {
  return pattern.pattern.replace(/^[〜～]/, "");
}

const ADJACENCY_LEVEL_ORDER: JlptLevel[] = ["N5", "N4", "N3", "N2", "N1"];

/**
 * 依索引的自然閱讀順序（等級 N5→N1、等級內 id 排序，與
 * getPatternsGroupedByLevel 一致）取得某文型的前／後相鄰文型，
 * 讓學習頁能「下一個 / 上一個」直接翻頁、不必退回索引重選（#457）。
 * 非資料庫文型（surface 找不到）回傳兩者皆 null。
 */
export function getAdjacentPatterns(surface: string): {
  prev: GrammarPattern | null;
  next: GrammarPattern | null;
} {
  const current = findPatternBySurface(surface);
  if (!current) return { prev: null, next: null };
  const grouped = getPatternsGroupedByLevel();
  const flat = ADJACENCY_LEVEL_ORDER.flatMap((level) => grouped[level]);
  const i = flat.findIndex((p) => p.id === current.id);
  if (i === -1) return { prev: null, next: null };
  return {
    prev: i > 0 ? flat[i - 1] : null,
    next: i < flat.length - 1 ? flat[i + 1] : null,
  };
}

/** 依關鍵字搜尋文型和中文解釋 */
export function searchPatterns(query: string): GrammarPattern[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return grammarPatterns.filter(
    (p) =>
      p.pattern.includes(q) ||
      p.meaningZh.includes(q) ||
      (p.meaningJa?.includes(q)) ||
      p.id.includes(q) ||
      p.tags.some((tag) => tag.includes(q))
  );
}

/** 取得某一文型的相近文型 */
export function getRelatedPatterns(id: string): GrammarPattern[] {
  const pattern = grammarPatterns.find((p) => p.id === id);
  if (!pattern) return [];
  return pattern.relatedPatternIds
    .map((rid) => grammarPatterns.find((p) => p.id === rid))
    .filter((p): p is GrammarPattern => p !== undefined);
}

/** 取得有日劇／動漫例句的文型 */
export function getPatternsWithMediaExamples(level?: JlptLevel): GrammarPattern[] {
  return grammarPatterns.filter(
    (p) => p.mediaExamples.length > 0 && (level ? p.level === level : true)
  );
}

/** 依重要性取得文型 */
export function getPatternsByImportance(level?: JlptLevel): GrammarPattern[] {
  const order: Record<string, number> = {
    must_know: 0,
    high_frequency: 1,
    understand: 2,
    reference: 3,
  };
  return grammarPatterns
    .filter((p) => (level ? p.level === level : true))
    .sort((a, b) => (order[a.importance] ?? 9) - (order[b.importance] ?? 9));
}

/** 每個等級的概覽統計 */
export function getLevelSummary(): Record<
  JlptLevel,
  {
    total: number;
    mustKnow: number;
    highFrequency: number;
    withMediaExamples: number;
  }
> {
  const summary: Record<string, { total: number; mustKnow: number; highFrequency: number; withMediaExamples: number }> = {};
  for (const level of ["N5", "N4", "N3", "N2", "N1"] as JlptLevel[]) {
    const patterns = grammarPatterns.filter((p) => p.level === level);
    summary[level] = {
      total: patterns.length,
      mustKnow: patterns.filter((p) => p.importance === "must_know").length,
      highFrequency: patterns.filter((p) => p.importance === "high_frequency").length,
      withMediaExamples: patterns.filter((p) => p.mediaExamples.length > 0).length,
    };
  }
  return summary as Record<JlptLevel, { total: number; mustKnow: number; highFrequency: number; withMediaExamples: number }>;
}
