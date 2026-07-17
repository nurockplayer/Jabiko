import { useEffect, useState } from "react";
import { AlertTriangle, ArrowRight, ChevronDown } from "lucide-react";
import { copy, type Language } from "../i18n";
import type { Attempt } from "../domain/types";
import type { KanaScript } from "../domain/kana";
import {
  getIncompletePrereqs,
  isLearningBlockComplete,
  learningBlocks,
  type LearningBlockDrillPreset
} from "../domain/learningBlocks";
import {
  localizeCategory,
  localizeLearningBlock,
  type LearningBlockOverlays
} from "../domain/learningBlockText";
import type { SentencePatternId } from "../domain/sentencePatterns";
import { SproutSpot, TeaCupSpot } from "../illustrations";
import { LearningFuriganaBoundary } from "./LearningFuriganaBoundary";
import { LearningRuby } from "./LearningRuby";
import { LearningRubyText } from "./LearningRubyText";

// Chapter index + active-chapter detail (the "學習" view). Reads learner
// progress to mark chapter completion and surface a review nudge, but
// all mutation goes back through the callbacks the parent passes in.
export function LearningPanel({
  language,
  progressAttempts,
  reviewCount,
  onStartChallenge,
  onStartReview,
  onStartDrill,
  onStartPatternDrill,
  onStartExamSection,
  onStartKanaDrill,
  onStartStarterDrill,
  onOpenKana
}: {
  language: Language;
  progressAttempts: Attempt[];
  reviewCount: number;
  onStartChallenge: () => void;
  onStartReview: () => void;
  onStartDrill: (preset: LearningBlockDrillPreset) => void;
  onStartPatternDrill: (patternIds: SentencePatternId[]) => void;
  onStartExamSection: (level: "N1" | "N2" | "N3", promptLabel: string) => void;
  // Launches the kana recognition drill for an 入門 chapter (#533).
  onStartKanaDrill: (script: KanaScript) => void;
  // Launches the starter-vocab meaning drill (#533).
  onStartStarterDrill: () => void;
  // Opens the standalone /kana chart page (#619).
  onOpenKana: () => void;
}) {
  const t = copy[language];
  // Study-chapter translations are heavy and grow per language, so they're
  // dynamically imported here (kept out of the eager home bundle). Until the
  // chunk resolves, chapters render in their zh source and re-render on arrival.
  const [overlays, setOverlays] = useState<LearningBlockOverlays>({});
  useEffect(() => {
    let alive = true;
    import("../domain/learningBlocks.i18n").then((module) => {
      if (alive) setOverlays(module.learningBlockI18n);
    });
    return () => {
      alive = false;
    };
  }, []);

  // PR A: surface only the "basic" learning blocks. PR C will introduce
  // exam-prep blocks alongside these.
  const blockCards = learningBlocks
    .filter((block) => block.group === "basic")
    .map((block) => ({
      block,
      disp: localizeLearningBlock(block, language, overlays),
      complete: isLearningBlockComplete(progressAttempts, block),
      incompletePrereqs: getIncompletePrereqs(progressAttempts, block)
    }));

  // Default to the first incomplete chapter; fall back to the first
  // chapter if everything is complete (e.g. revisiting after finishing).
  const recommended = blockCards.find((card) => !card.complete) ?? blockCards[0];

  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const activeCard = blockCards.find((card) => card.block.id === selectedBlockId) ?? recommended;
  // #608 P0: on phones the 74-button index used to sit above the lesson,
  // pushing the material thousands of px down. The mobile chapter bar keeps
  // the index collapsed by default (desktop ignores this state; its sidebar
  // is always visible via CSS) and offers prev/next in reading order.
  const [indexOpen, setIndexOpen] = useState(false);
  const activeIndex = blockCards.findIndex((card) => card.block.id === activeCard.block.id);
  // Localized copy of the active block. localizeLearningBlock preserves every
  // logic field (id / drills / examDrill / requiredForms …) and only swaps the
  // Chinese display text, so it's safe to use for both rendering and handlers.
  const active = localizeLearningBlock(activeCard.block, language, overlays);

  // Group chapters by category so the rail reads as a few labelled sections
  // instead of one long flat list where every card repeats a coloured kicker
  // tag. First-seen category order is preserved.
  const groupOrder: string[] = [];
  const groupMap = new Map<string, typeof blockCards>();
  for (const card of blockCards) {
    const category = card.block.category;
    if (!groupMap.has(category)) {
      groupMap.set(category, []);
      groupOrder.push(category);
    }
    groupMap.get(category)!.push(card);
  }
  const chapterGroups = groupOrder.map((category) => ({
    category,
    label: localizeCategory(category, language, learningBlocks, overlays),
    cards: groupMap.get(category)!
  }));

  // Resolve the drill button label from the i18n copy table. The schema
  // stores a plain string key so new drill labels don't require schema
  // updates.
  const drillButtonLabel = (drill: { labelKey: string }): string => {
    const labels = t as unknown as Record<string, string>;
    return labels[drill.labelKey] ?? drill.labelKey;
  };

  const blockTitleById = (id: string): string => {
    const found = learningBlocks.find((b) => b.id === id);
    return found ? localizeLearningBlock(found, language, overlays).title : id;
  };

  // Lightweight dashboard stats: derived from the same attemptStore the
  // chapter index uses, so the count stays in sync with whatever the
  // learner just did. accuracyPercent is computed across ALL recorded
  // attempts (not just this session) -- the dashboard's purpose is to
  // surface cross-session signal, not session-local feedback.
  const dashboardTotalAttempts = progressAttempts.length;
  const dashboardCorrectAttempts = progressAttempts.filter((a) => a.isCorrect).length;
  const dashboardAccuracy =
    dashboardTotalAttempts === 0
      ? 0
      : Math.round((dashboardCorrectAttempts / dashboardTotalAttempts) * 100);

  return (
    <section className="learning-panel" aria-label={t.learningRegion}>
      <div className="chapter-shell">
        <div className="chapter-mobile-bar" data-testid="chapter-mobile-bar">
          <button
            type="button"
            className="chapter-mobile-toggle"
            data-testid="chapter-mobile-toggle"
            aria-expanded={indexOpen}
            onClick={() => setIndexOpen((open) => !open)}
          >
            <span className="chapter-mobile-progress">
              {activeIndex + 1} / {blockCards.length}
            </span>
            <strong>{active.title}</strong>
            <ChevronDown aria-hidden="true" />
          </button>
          <div className="chapter-mobile-nav">
            <button
              type="button"
              disabled={activeIndex <= 0}
              onClick={() => setSelectedBlockId(blockCards[activeIndex - 1].block.id)}
            >
              {t.chapterPrev}
            </button>
            <button
              type="button"
              disabled={activeIndex >= blockCards.length - 1}
              onClick={() => setSelectedBlockId(blockCards[activeIndex + 1].block.id)}
            >
              {t.chapterNext}
            </button>
          </div>
        </div>

        <aside
          className={`chapter-index${indexOpen ? " mobile-open" : ""}`}
          aria-label={t.chapterIndexLabel}
        >
          <div className="dashboard-card" aria-label={t.dashboardEyebrow}>
            <SproutSpot size={48} className="dashboard-spot" />
            <p className="eyebrow">{t.dashboardEyebrow}</p>
            {reviewCount > 0 ? (
              <button
                type="button"
                className="dashboard-review-cta"
                onClick={onStartReview}
              >
                <AlertTriangle aria-hidden="true" />
                <span className="dashboard-review-text">
                  {t.dashboardReviewPending(reviewCount)}
                </span>
                <span className="dashboard-review-action">{t.dashboardReviewCta}</span>
              </button>
            ) : (
              <p className="dashboard-review-empty">
                <TeaCupSpot size={40} />
                {t.dashboardReviewEmpty}
              </p>
            )}
            {dashboardTotalAttempts > 0 ? (
              <div className="dashboard-stats">
                <span>{t.dashboardStatsAttempts(dashboardTotalAttempts)}</span>
                <span>·</span>
                <span>{t.dashboardStatsAccuracy(dashboardAccuracy)}</span>
              </div>
            ) : null}
          </div>
          <div className="chapter-index-copy">
            <p className="eyebrow">{t.chapterEyebrow}</p>
            <h2>{t.chapterHeading}</h2>
            <p>{t.chapterIntro}</p>
          </div>

          <div className="chapter-list">
            {chapterGroups.map(({ category, label, cards }) => (
              <div className="chapter-group" key={category}>
                <p className="chapter-group-title">{label}</p>
                {cards.map(({ block, disp, complete, incompletePrereqs }) => {
                  // Card no longer carries the category kicker (the group
                  // header owns it); keep only a status marker when relevant.
                  // Reference chapters always read "參考" (they're material,
                  // not drillable), even once their prereqs are done.
                  const status = block.completionMode === "reference"
                    ? t.chapterStatusReference
                    : complete
                    ? t.chapterStatusComplete
                    : null;
                  return (
                    <button
                      key={block.id}
                      type="button"
                      className={`chapter-list-button${block.id === active.id ? " selected" : ""}${complete ? " complete" : ""}`}
                      aria-label={t.chapterViewLabel(disp.title)}
                      aria-pressed={block.id === active.id}
                      onClick={() => {
                        setSelectedBlockId(block.id);
                        // Collapse the mobile index so the picked material is
                        // immediately in view (no-op visually on desktop).
                        setIndexOpen(false);
                      }}
                    >
                      {status ? <span>{status}</span> : null}
                      <strong>{disp.title}</strong>
                      <small>
                        {incompletePrereqs.length > 0
                          ? t.chapterPrereqHint(incompletePrereqs.map(blockTitleById).join("、"))
                          : disp.subtitle}
                      </small>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          <button className="secondary-challenge-button" type="button" onClick={onStartChallenge}>
            <ArrowRight aria-hidden="true" />
            {t.startChallenge}
          </button>
        </aside>

        <LearningFuriganaBoundary>
        <section className="chapter-content" aria-labelledby="active-chapter-title">
          <div className="chapter-content-head">
            <p className="eyebrow">{active.kicker ?? active.category}</p>
            <h3 id="active-chapter-title">{active.title}</h3>
            <p>{active.explanation}</p>
            {active.subtitle ? (
              <div className="focus-formula" aria-label={t.chapterExampleLabel(active.title)}>
                <span><LearningRuby text={active.subtitle} /></span>
              </div>
            ) : null}
          </div>

          <div className="chapter-lesson">
            <div className="pipeline-grid">
              {active.examples.map((example) => (
                <article className="pipeline-card" key={example.formula}>
                  <code><LearningRuby text={example.formula} /></code>
                  {example.note ? <p>{example.note}</p> : null}
                </article>
              ))}
            </div>

            {active.pitfalls && active.pitfalls.length > 0 ? (
              <div className="block-pitfalls">
                <p className="block-pitfalls-title">{t.chapterPitfallsTitle}</p>
                <ul>
                  {active.pitfalls.map((pitfall) => (
                    <li key={pitfall}><LearningRubyText text={pitfall} language={language} /></li>
                  ))}
                </ul>
              </div>
            ) : null}

            {active.kanaDrill ? (
              <div className="inline-action-row">
                <button
                  className="inline-drill-button"
                  type="button"
                  onClick={() => onStartKanaDrill(active.kanaDrill!.script)}
                >
                  <ArrowRight aria-hidden="true" />
                  {drillButtonLabel(active.kanaDrill)}
                </button>
                <button className="inline-drill-button" type="button" onClick={onOpenKana}>
                  <ArrowRight aria-hidden="true" />
                  {t.kanaPageTitle}
                </button>
              </div>
            ) : null}

            {active.starterDrill ? (
              <div className="inline-action-row">
                <button
                  className="inline-drill-button"
                  type="button"
                  onClick={onStartStarterDrill}
                >
                  <ArrowRight aria-hidden="true" />
                  {drillButtonLabel(active.starterDrill)}
                </button>
              </div>
            ) : null}

            {active.patternDrills && active.patternDrills.length > 0 ? (
              <div className="inline-action-row">
                {active.patternDrills.map((drill) => (
                  <button
                    key={drill.labelKey}
                    className="inline-drill-button"
                    type="button"
                    onClick={() => onStartPatternDrill(drill.patternIds)}
                  >
                    <ArrowRight aria-hidden="true" />
                    {drillButtonLabel(drill)}
                  </button>
                ))}
              </div>
            ) : null}

            {active.examDrill ? (
              <div className="inline-action-row">
                <button
                  className="inline-drill-button"
                  type="button"
                  onClick={() =>
                    onStartExamSection(active.examDrill!.level, active.examDrill!.promptLabel)
                  }
                >
                  <ArrowRight aria-hidden="true" />
                  {drillButtonLabel(active.examDrill)}
                </button>
              </div>
            ) : null}

            {active.drillNote ? (
              <p className="block-drill-note">{active.drillNote}</p>
            ) : null}

            {active.drills && active.drills.length > 0 ? (
              <div className="inline-action-row">
                {active.drills.map((drill) => (
                  <button
                    key={drill.labelKey}
                    className="inline-drill-button"
                    type="button"
                    onClick={() => onStartDrill(drill.preset)}
                  >
                    <ArrowRight aria-hidden="true" />
                    {drillButtonLabel(drill)}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </section>
        </LearningFuriganaBoundary>
      </div>
    </section>
  );
}
