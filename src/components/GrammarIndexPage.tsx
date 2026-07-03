import { useMemo, useState } from "react";
import { ArrowLeft, BookOpen, Search, Clapperboard, BarChart3 } from "lucide-react";
import { copy, type Language } from "../i18n";
import {
  getPatternsGroupedByLevel,
  getLevelSummary,
  getPatternsWithMediaExamples,
  getPatternsByImportance,
} from "../domain/grammarIndex";
import { getRelatedPatterns } from "../domain/grammarIndex";
import type { GrammarPattern } from "../domain/grammarDatabase";
import type { JlptLevel } from "../domain/types";

export function GrammarIndexPage({
  language,
  level,
  onOpenPattern,
  onBack,
}: {
  language: Language;
  level: JlptLevel | null;
  onOpenPattern: (surface: string) => void;
  onBack: () => void;
}) {
  const t = copy[language];
  const [searchQuery, setSearchQuery] = useState("");
  const [showMediaOnly, setShowMediaOnly] = useState(false);
  const [showImportanceFilter, setShowImportanceFilter] = useState<string | null>(null);
  const [expandedLevel, setExpandedLevel] = useState<JlptLevel | null>(level);

  const grouped = useMemo(() => getPatternsGroupedByLevel(), []);
  const summary = useMemo(() => getLevelSummary(), []);

  const levelLabels: Record<JlptLevel, string> = {
    N5: "N5",
    N4: "N4",
    N3: "N3",
    N2: "N2",
    N1: "N1",
  };

  const importanceLabels: Record<string, string> = {
    must_know: "必考",
    high_frequency: "高頻",
    understand: "理解即可",
    reference: "參考",
  };

  /** 篩選單一等級的列表 */
  const filterPatterns = (patterns: GrammarPattern[]): GrammarPattern[] => {
    let result = patterns;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (p) =>
          p.pattern.includes(q) ||
          p.meaningZh.includes(q) ||
          p.tags.some((tag) => tag.includes(q)) ||
          (p.meaningJa?.includes(q))
      );
    }
    if (showMediaOnly) {
      result = result.filter((p) => p.mediaExamples.length > 0);
    }
    if (showImportanceFilter) {
      result = result.filter((p) => p.importance === showImportanceFilter);
    }
    return result;
  };

  /** 搜尋總結果（跨等級） */
  const globalSearchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.trim().toLowerCase();
    const allResults: { pattern: GrammarPattern; matchedField: string }[] = [];
    for (const patterns of Object.values(grouped)) {
      for (const p of patterns) {
        if (p.pattern.includes(q)) {
          allResults.push({ pattern: p, matchedField: "文型" });
        } else if (p.meaningZh.includes(q)) {
          allResults.push({ pattern: p, matchedField: "中文解釋" });
        } else if (p.meaningJa?.includes(q)) {
          allResults.push({ pattern: p, matchedField: "日文解釋" });
        } else if (p.tags.some((tag) => tag.includes(q))) {
          allResults.push({ pattern: p, matchedField: "標籤" });
        }
      }
    }
    return allResults;
  }, [searchQuery, grouped]);

  // 如果正在搜尋，顯示跨等級結果
  if (globalSearchResults) {
    return (
      <section className="grammar-index" aria-label={t.grammarIndexTitle}>
        <div className="gi-header">
          <button type="button" className="ghost-button" onClick={onBack}>
            <ArrowLeft aria-hidden="true" />
            {t.reviewDoneExit}
          </button>
        </div>

        <div className="gi-search-bar">
          <Search className="gi-search-icon" aria-hidden="true" size={18} />
          <input
            type="search"
            className="gi-search-input"
            placeholder={t.grammarSearchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
        </div>

        <div className="gi-section">
          <h2 className="gi-section-title">
            {t.grammarSearchResults}（{globalSearchResults.length}）
          </h2>
          {globalSearchResults.length === 0 ? (
            <p className="gi-empty">{t.grammarSearchEmpty}</p>
          ) : (
            <ul className="gi-pattern-list">
              {globalSearchResults.map(({ pattern: p, matchedField }) => (
                <PatternCard
                  key={p.id}
                  pattern={p}
                  importanceLabels={importanceLabels}
                  matchedField={matchedField}
                  onOpen={onOpenPattern}
                />
              ))}
            </ul>
          )}
        </div>
      </section>
    );
  }

  // 特定等級檢視
  if (level) {
    const patterns = filterPatterns(grouped[level]);
    return (
      <section className="grammar-index" aria-label={`JLPT ${level} 文型`}>
        <div className="gi-header">
          <button type="button" className="ghost-button" onClick={onBack}>
            <ArrowLeft aria-hidden="true" />
            {t.reviewDoneExit}
          </button>
          <h1 className="gi-hero-title">JLPT {level} 文型</h1>
        </div>

        <div className="gi-search-bar">
          <Search className="gi-search-icon" aria-hidden="true" size={18} />
          <input
            type="search"
            className="gi-search-input"
            placeholder={t.grammarSearchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="gi-filters">
          <button
            type="button"
            className={`gi-filter-btn${showMediaOnly ? " active" : ""}`}
            onClick={() => setShowMediaOnly(!showMediaOnly)}
          >
            <Clapperboard aria-hidden="true" size={16} />
            {t.grammarFilterMediaOnly}
          </button>
          <select
            className="gi-filter-select"
            value={showImportanceFilter ?? ""}
            onChange={(e) => setShowImportanceFilter(e.target.value || null)}
            aria-label={t.grammarFilterImportance}
          >
            <option value="">{t.grammarFilterAllImportance}</option>
            {Object.entries(importanceLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {patterns.length === 0 ? (
          <p className="gi-empty">{t.grammarNoPatterns}</p>
        ) : (
          <ul className="gi-pattern-list">
            {patterns.map((p) => (
              <PatternCard
                key={p.id}
                pattern={p}
                importanceLabels={importanceLabels}
                matchedField={null}
                onOpen={onOpenPattern}
              />
            ))}
          </ul>
        )}

        <div className="gi-cta">
          <button type="button" className="ghost-button" onClick={onBack}>
            <ArrowLeft aria-hidden="true" />
            {t.grammarBackToIndex}
          </button>
        </div>
      </section>
    );
  }

  // 概覽頁（所有等級）
  return (
    <section className="grammar-index" aria-label={t.grammarIndexTitle}>
      <div className="gi-header">
        <button type="button" className="ghost-button" onClick={onBack}>
          <ArrowLeft aria-hidden="true" />
          {t.reviewDoneExit}
        </button>
        <h1 className="gi-hero-title">{t.grammarIndexTitle}</h1>
      </div>

      <p className="gi-hero-sub">{t.grammarIndexIntro}</p>

      <div className="gi-search-bar">
        <Search className="gi-search-icon" aria-hidden="true" size={18} />
        <input
          type="search"
          className="gi-search-input"
          placeholder={t.grammarSearchPlaceholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {(["N5", "N4", "N3", "N2", "N1"] as JlptLevel[]).map((lvl) => {
        const stats = summary[lvl];
        const levelPatterns = filterPatterns(grouped[lvl]);
        const isExpanded = expandedLevel === lvl;
        return (
          <details
            key={lvl}
            className="gi-level-group"
            open={isExpanded}
            onToggle={(e) => {
              if ((e.target as HTMLDetailsElement).open) setExpandedLevel(lvl);
            }}
          >
            <summary className="gi-level-summary">
              <span className="gi-level-badge">{levelLabels[lvl]}</span>
              <span className="gi-level-stats">
                <BookOpen aria-hidden="true" size={14} />
                {stats.total} 文型
                {stats.withMediaExamples > 0 && (
                  <>
                    <Clapperboard aria-hidden="true" size={14} />
                    {stats.withMediaExamples}
                  </>
                )}
              </span>
            </summary>
            {levelPatterns.length === 0 ? (
              <p className="gi-empty">{t.grammarNoPatterns}</p>
            ) : (
              <ul className="gi-pattern-list">
                {levelPatterns.map((p) => (
                  <PatternCard
                    key={p.id}
                    pattern={p}
                    importanceLabels={importanceLabels}
                    matchedField={null}
                    onOpen={onOpenPattern}
                  />
                ))}
              </ul>
            )}
          </details>
        );
      })}
    </section>
  );
}

/** 單張文型卡片 */
function PatternCard({
  pattern,
  importanceLabels,
  matchedField,
  onOpen,
}: {
  pattern: GrammarPattern;
  importanceLabels: Record<string, string>;
  matchedField: string | null;
  onOpen: (surface: string) => void;
}) {
  const importanceClass = (() => {
    switch (pattern.importance) {
      case "must_know":
        return "gi-importance-must";
      case "high_frequency":
        return "gi-importance-high";
      default:
        return "";
    }
  })();

  return (
    <li className="gi-pattern-card">
      <button
        type="button"
        className="gi-pattern-card-inner"
        onClick={() => onOpen(pattern.pattern.replace(/^[〜～]/, ""))}
      >
        <div className="gi-pattern-row">
          <span className="gi-pattern-text" lang="ja">{pattern.pattern}</span>
          <div className="gi-pattern-meta">
            <span className={`gi-importance ${importanceClass}`}>
              {importanceLabels[pattern.importance] ?? pattern.importance}
            </span>
            {pattern.mediaExamples.length > 0 && (
              <span className="gi-has-media" title="含影視例句">
                <Clapperboard aria-hidden="true" size={14} />
              </span>
            )}
          </div>
        </div>
        <p className="gi-pattern-meaning">{pattern.meaningZh}</p>
        <p className="gi-pattern-formation">{pattern.formation}</p>
        {matchedField && <span className="gi-match-field">符合「{matchedField}」</span>}
      </button>
    </li>
  );
}
