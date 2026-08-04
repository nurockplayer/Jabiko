import { useMemo, useState } from "react";
import { ArrowLeft, BookOpen, Search, Clapperboard } from "lucide-react";
import { copy, type Language } from "../i18n";
import {
  getPatternsGroupedByLevel,
  getLevelSummary,
  searchPatterns,
} from "../domain/grammarIndex";
import type { GrammarPattern } from "../domain/grammarDatabase";
import type { JlptLevel } from "../domain/types";

export function GrammarIndexPage({
  language,
  level,
  onOpenPattern,
  onBack,
  onBackToOverview,
  onSelectLevel,
}: {
  language: Language;
  level: JlptLevel | null;
  onOpenPattern: (surface: string) => void;
  onBack: () => void;
  onBackToOverview?: () => void;
  onSelectLevel?: (level: JlptLevel) => void;
}) {
  const t = copy[language];
  const [searchQuery, setSearchQuery] = useState("");
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
    must_know: t.grammarImportanceMustKnow,
    high_frequency: t.grammarImportanceHighFreq,
    understand: t.grammarImportanceUnderstand,
    reference: t.grammarImportanceReference,
  };

  // Stable labels map so globalSearchResults' useMemo doesn't re-run every
  // render (t only changes on locale switch).
  const matchedFieldLabels: Record<string, string> = useMemo(
    () => ({
      pattern: t.grammarMatchPattern,
      meaningZh: t.grammarMatchZh,
      meaningJa: t.grammarMatchJa,
      tag: t.grammarMatchTag,
      id: t.grammarMatchId
    }),
    [t]
  );

  /** 跨等級搜尋結果 */
  const globalSearchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const matches = searchPatterns(searchQuery);
    return matches.map((p) => {
      const q = searchQuery.trim().toLowerCase();
      let field: keyof typeof matchedFieldLabels = "pattern";
      if (p.pattern.includes(q)) field = "pattern";
      else if (p.meaningZh.includes(q)) field = "meaningZh";
      else if (p.meaningJa?.includes(q)) field = "meaningJa";
      else if (p.tags.some((tag) => tag.includes(q))) field = "tag";
      else if (p.id.includes(q)) field = "id";
      return { pattern: p, matchedField: matchedFieldLabels[field] };
    });
  }, [searchQuery, matchedFieldLabels]);

  /** 共用搜尋列 — 在三個分支外層統一只渲染一份，避免查詢時 IME 因 remount 被中斷 */
  const renderSearchBar = (
    <div className="gi-search-bar" key="search-bar">
      <Search className="gi-search-icon" aria-hidden="true" size={18} />
      <input
        type="search"
        className="gi-search-input"
        aria-label={t.grammarSearchPlaceholder}
        placeholder={t.grammarSearchPlaceholder}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
    </div>
  );

  const showGlobalSearch = !level && globalSearchResults !== null;
  const showLevel = level !== null;
  const showOverview = !showGlobalSearch && !showLevel;

  return (
    <section className="grammar-index" aria-label={t.grammarIndexTitle}>
      <div className="gi-header">
        <button type="button" className="ghost-button" onClick={onBack}>
          <ArrowLeft aria-hidden="true" />
          {t.reviewDoneExit}
        </button>
        {showLevel && (
          <h1 className="gi-hero-title">JLPT {level} {t.grammar}</h1>
        )}
        {showOverview && (
          <h1 className="gi-hero-title">{t.grammarIndexTitle}</h1>
        )}
      </div>

      {showOverview && (
        <p className="gi-hero-sub">{t.grammarIndexIntro}</p>
      )}

      {renderSearchBar}

      {showGlobalSearch ? (
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
                  grammarHasMedia={t.grammarHasMedia}
                  grammarMatchFieldLabel={t.grammarMatchFieldLabel}
                />
              ))}
            </ul>
          )}
        </div>
      ) : showLevel ? (
        // Level-local filters live in GrammarLevelResults, mounted with
        // key={level} so a level switch (or overview round-trip) unmounts them
        // and the next level starts from the default filters again — no
        // effect-driven reset needed (#682).
        <GrammarLevelResults
          key={level}
          language={language}
          searchQuery={searchQuery}
          patterns={grouped[level]}
          importanceLabels={importanceLabels}
          onOpenPattern={onOpenPattern}
          onBack={onBack}
          onBackToOverview={onBackToOverview}
        />
      ) : (
        (["N5", "N4", "N3", "N2", "N1"] as JlptLevel[]).map((lvl) => {
          const stats = summary[lvl];
          const overviewPatterns = filterBySearch(grouped[lvl], searchQuery);
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
                  {stats.total} {t.grammar}
                  {stats.withMediaExamples > 0 && (
                    <>
                      <Clapperboard aria-hidden="true" size={14} />
                      {stats.withMediaExamples}
                    </>
                  )}
                </span>
                {onSelectLevel && (
                  <span
                    className="gi-level-enter"
                    role="button"
                    tabIndex={0}
                    aria-label={`${t.grammarBrowseLevel} ${levelLabels[lvl]}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onSelectLevel(lvl);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        e.stopPropagation();
                        onSelectLevel(lvl);
                      }
                    }}
                  >
                    {t.grammarBrowseLevel ?? "瀏覽"}
                  </span>
                )}
              </summary>
              {overviewPatterns.length === 0 ? (
                <p className="gi-empty">{t.grammarNoPatterns}</p>
              ) : (
                <ul className="gi-pattern-list">
                  {overviewPatterns.map((p) => (
                    <PatternCard
                      key={p.id}
                      pattern={p}
                      importanceLabels={importanceLabels}
                      matchedField={null}
                      onOpen={onOpenPattern}
                      grammarHasMedia={t.grammarHasMedia}
                      grammarMatchFieldLabel={t.grammarMatchFieldLabel}
                    />
                  ))}
                </ul>
              )}
            </details>
          );
        })
      )}
    </section>
  );
}

/** 只依搜尋字串縮減列表（overview 用）— 不套用任何 level-local filter。 */
function filterBySearch(
  patterns: GrammarPattern[],
  searchQuery: string
): GrammarPattern[] {
  if (!searchQuery.trim()) return patterns;
  return searchPatterns(searchQuery).filter((p) =>
    patterns.some((sp) => sp.id === p.id)
  );
}

/**
 * 單一等級的文型列表，持有 level-local 的 showMediaOnly / showImportanceFilter
 * state。以 key={level} 掛載於 GrammarIndexPage，因此離開等級 route（回 overview
 * 或直接切等級）即 unmount，下次進入任何等級都從預設 filter 重新開始 —
 * 不需要在父層用 effect 同步重設（#682）。
 */
function GrammarLevelResults({
  language,
  searchQuery,
  patterns,
  importanceLabels,
  onOpenPattern,
  onBack,
  onBackToOverview,
}: {
  language: Language;
  searchQuery: string;
  patterns: GrammarPattern[];
  importanceLabels: Record<string, string>;
  onOpenPattern: (surface: string) => void;
  onBack: () => void;
  onBackToOverview?: () => void;
}) {
  const t = copy[language];
  const [showMediaOnly, setShowMediaOnly] = useState(false);
  const [showImportanceFilter, setShowImportanceFilter] = useState<string | null>(null);

  /** 篩選單一等級的列表：search + level-local filters */
  const filterPatterns = (patterns: GrammarPattern[]): GrammarPattern[] => {
    let result = patterns;
    if (searchQuery.trim()) {
      result = searchPatterns(searchQuery).filter((p) =>
        patterns.some((sp) => sp.id === p.id)
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

  const levelPatterns = filterPatterns(patterns);

  return (
    <>
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
              grammarHasMedia={t.grammarHasMedia}
              grammarMatchFieldLabel={t.grammarMatchFieldLabel}
            />
          ))}
        </ul>
      )}

      <div className="gi-cta">
        <button type="button" className="ghost-button" onClick={onBackToOverview ?? onBack}>
          <ArrowLeft aria-hidden="true" />
          {t.grammarBackToIndex}
        </button>
      </div>
    </>
  );
}

/** 單張文型卡片 */
function PatternCard({
  pattern,
  importanceLabels,
  matchedField,
  onOpen,
  grammarHasMedia,
  grammarMatchFieldLabel,
}: {
  pattern: GrammarPattern;
  importanceLabels: Record<string, string>;
  matchedField: string | null;
  onOpen: (surface: string) => void;
  grammarHasMedia: string;
  grammarMatchFieldLabel: (field: string) => string;
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
              <span className="gi-has-media" title={grammarHasMedia}>
                <Clapperboard aria-hidden="true" size={14} />
              </span>
            )}
          </div>
        </div>
        <p className="gi-pattern-meaning">{pattern.meaningZh}</p>
        <p className="gi-pattern-formation">{pattern.formation}</p>
        {matchedField && <span className="gi-match-field">{grammarMatchFieldLabel(matchedField)}</span>}
      </button>
    </li>
  );
}
