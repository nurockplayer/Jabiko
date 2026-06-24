import { useState } from "react";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { copy, type Language } from "../i18n";
import type { Attempt } from "../domain/types";
import {
  getIncompletePrereqs,
  isLearningBlockComplete,
  learningBlocks,
  type LearningBlockDrillPreset
} from "../domain/learningBlocks";
import type { SentencePatternId } from "../domain/sentencePatterns";

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
  onStartPatternDrill
}: {
  language: Language;
  progressAttempts: Attempt[];
  reviewCount: number;
  onStartChallenge: () => void;
  onStartReview: () => void;
  onStartDrill: (preset: LearningBlockDrillPreset) => void;
  onStartPatternDrill: (patternIds: SentencePatternId[]) => void;
}) {
  const t = copy[language];
  // PR A: surface only the "basic" learning blocks. PR C will introduce
  // exam-prep blocks alongside these.
  const blockCards = learningBlocks
    .filter((block) => block.group === "basic")
    .map((block) => ({
      block,
      complete: isLearningBlockComplete(progressAttempts, block),
      incompletePrereqs: getIncompletePrereqs(progressAttempts, block)
    }));

  // Default to the first incomplete chapter; fall back to the first
  // chapter if everything is complete (e.g. revisiting after finishing).
  const recommended = blockCards.find((card) => !card.complete) ?? blockCards[0];

  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const activeCard = blockCards.find((card) => card.block.id === selectedBlockId) ?? recommended;
  const active = activeCard.block;

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
  const chapterGroups = groupOrder.map((category) => ({ category, cards: groupMap.get(category)! }));

  // Resolve the drill button label from the i18n copy table. The schema
  // stores a plain string key so new drill labels don't require schema
  // updates.
  const drillButtonLabel = (drill: { labelKey: string }): string => {
    const labels = t as unknown as Record<string, string>;
    return labels[drill.labelKey] ?? drill.labelKey;
  };

  const blockTitleById = (id: string): string => {
    const found = learningBlocks.find((b) => b.id === id);
    return found ? found.title : id;
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
        <aside className="chapter-index" aria-label="學習章節">
          <div className="dashboard-card" aria-label={t.dashboardEyebrow}>
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
              <p className="dashboard-review-empty">{t.dashboardReviewEmpty}</p>
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
            <p className="eyebrow">課程章節</p>
            <h2>一章一章解鎖</h2>
            <p>選一章看規則、例子與常見陷阱，再到挑戰頁練。</p>
          </div>

          <div className="chapter-list">
            {chapterGroups.map(({ category, cards }) => (
              <div className="chapter-group" key={category}>
                <p className="chapter-group-title">{category}</p>
                {cards.map(({ block, complete, incompletePrereqs }) => {
                  // Card no longer carries the category kicker (the group
                  // header owns it); keep only a status marker when relevant.
                  // Reference chapters always read "參考" (they're material,
                  // not drillable), even once their prereqs are done.
                  const status = block.completionMode === "reference"
                    ? "參考"
                    : complete
                    ? "完成"
                    : null;
                  return (
                    <button
                      key={block.id}
                      type="button"
                      className={`chapter-list-button${block.id === active.id ? " selected" : ""}${complete ? " complete" : ""}`}
                      aria-label={`查看：${block.title}`}
                      aria-pressed={block.id === active.id}
                      onClick={() => setSelectedBlockId(block.id)}
                    >
                      {status ? <span>{status}</span> : null}
                      <strong>{block.title}</strong>
                      <small>
                        {incompletePrereqs.length > 0
                          ? `建議先看：${incompletePrereqs.map(blockTitleById).join("、")}`
                          : block.subtitle}
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

        <section className="chapter-content" aria-labelledby="active-chapter-title">
          <div className="chapter-content-head">
            <p className="eyebrow">{active.kicker ?? active.category}</p>
            <h3 id="active-chapter-title">{active.title}</h3>
            <p>{active.explanation}</p>
            {active.subtitle ? (
              <div className="focus-formula" aria-label={`${active.title}例子`}>
                <span>{active.subtitle}</span>
              </div>
            ) : null}
          </div>

          <div className="chapter-lesson">
            <div className="pipeline-grid">
              {active.examples.map((example) => (
                <article className="pipeline-card" key={example.formula}>
                  <code>{example.formula}</code>
                  {example.note ? <p>{example.note}</p> : null}
                </article>
              ))}
            </div>

            {active.pitfalls && active.pitfalls.length > 0 ? (
              <div className="block-pitfalls">
                <p className="block-pitfalls-title">常見陷阱</p>
                <ul>
                  {active.pitfalls.map((pitfall) => (
                    <li key={pitfall}>{pitfall}</li>
                  ))}
                </ul>
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
      </div>
    </section>
  );
}
