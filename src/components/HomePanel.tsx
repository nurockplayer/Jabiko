import { AlertTriangle, ArrowRight, BookOpen } from "lucide-react";
import { copy, type Language } from "../i18n";
import type { Attempt } from "../domain/types";
import { isLearningBlockComplete, learningBlocks } from "../domain/learningBlocks";
import { CONTENT_STATS } from "../domain/contentStats";

// Content-volume snapshot rendered above the entry cards. The exam /
// pattern / vocab counts come from CONTENT_STATS (hardcoded, drift-
// guarded by contentStats.test.ts) so the eager home view never has to
// import the heavy question-pool / vocabulary data modules -- that data
// loads only when the learner enters the practice flow. Only `chapters`
// is read live, from the lightweight learningBlocks module the home
// progress badges already depend on.
const HOME_CONTENT_STATS = {
  chapters: learningBlocks.filter((block) => block.group === "basic").length,
  examItems: CONTENT_STATS.examItems,
  n1Grammar: CONTENT_STATS.n1Grammar,
  patternChecks: CONTENT_STATS.patternChecks,
  vocab: CONTENT_STATS.vocab
};

// First view the learner lands on. Three layers:
//   1. Context-aware banner ("review N items" if any, else "continue
//      chapter XX" if there's an incomplete one). Suppressed entirely
//      when nothing meaningful to surface, to avoid noise.
//   2. Lifetime stats strip (only shown after the first attempt).
//   3. Five entry cards.
//
// HomePanel is intentionally read-only of the learner state -- mutating
// callbacks (onNavigate, onStartReview) live on the parent so the panel
// stays a presentational component.
export function HomePanel({
  language,
  progressAttempts,
  reviewCount,
  onNavigate,
  onStartReview,
  onStartVocab
}: {
  language: Language;
  progressAttempts: Attempt[];
  reviewCount: number;
  onNavigate: (target: "learn" | "challenge" | "mock") => void;
  onStartReview: () => void;
  onStartVocab: () => void;
}) {
  const t = copy[language];

  const totalAttempts = progressAttempts.length;
  const correctAttempts = progressAttempts.filter((attempt) => attempt.isCorrect).length;
  const accuracyPercent =
    totalAttempts === 0 ? 0 : Math.round((correctAttempts / totalAttempts) * 100);

  // Only count "trackable" basic chapters towards the X / Y badge --
  // reference chapters (verb-types + the four sentence-pattern reading
  // chapters) are reading material, not drillable units.
  const trackableChapters = learningBlocks.filter(
    (block) => block.group === "basic" && block.completionMode !== "reference"
  );
  const completedChapters = trackableChapters.filter((block) =>
    isLearningBlockComplete(progressAttempts, block)
  ).length;

  const nextIncompleteChapter = trackableChapters.find(
    (block) => !isLearningBlockComplete(progressAttempts, block)
  );

  return (
    <section className="home-panel" aria-label={t.home}>
      <header className="home-hero">
        {/* Decorative hero -- the heading below carries the actual
            message, so alt is intentionally empty (avoids the screen
            reader saying "image, hero" which adds nothing). */}
        <img
          className="home-hero-image"
          src="/hero.webp"
          alt=""
          width={1600}
          height={900}
        />
        <div className="home-hero-text">
          <h1>{t.homeHeroTitle}</h1>
          <p>{t.homeHeroIntro}</p>
        </div>
      </header>

      {/* Content-volume strip: tells first-time visitors what they're
          walking into without resorting to SaaS-style metric tiles.
          Counts are derived live from the data modules so this stays
          honest whenever a content batch lands. */}
      <p className="home-content-stats">
        {t.homeContentStats(
          HOME_CONTENT_STATS.chapters,
          HOME_CONTENT_STATS.examItems,
          HOME_CONTENT_STATS.n1Grammar,
          HOME_CONTENT_STATS.patternChecks,
          HOME_CONTENT_STATS.vocab
        )}
      </p>

      {reviewCount > 0 ? (
        <button type="button" className="home-banner home-banner-review" onClick={onStartReview}>
          <AlertTriangle aria-hidden="true" />
          <span className="home-banner-text">
            <strong>{t.homeBannerReviewMain(reviewCount)}</strong>
            <small>{t.homeBannerReviewSub}</small>
          </span>
          <ArrowRight aria-hidden="true" />
        </button>
      ) : nextIncompleteChapter ? (
        <button
          type="button"
          className="home-banner home-banner-continue"
          onClick={() => onNavigate("learn")}
        >
          <BookOpen aria-hidden="true" />
          <span className="home-banner-text">
            <strong>{t.homeBannerContinueMain(nextIncompleteChapter.title)}</strong>
            <small>{t.homeBannerContinueSub}</small>
          </span>
          <ArrowRight aria-hidden="true" />
        </button>
      ) : null}

      {totalAttempts > 0 ? (
        <div className="home-stats-strip" aria-label={t.homeStatsLabel}>
          <div className="home-stats-cell">
            <strong>{totalAttempts}</strong>
            <small>{t.homeStatsAttempts}</small>
          </div>
          <div className="home-stats-cell">
            <strong>{accuracyPercent}%</strong>
            <small>{t.homeStatsAccuracy}</small>
          </div>
          <div className="home-stats-cell">
            <strong>
              {completedChapters} / {trackableChapters.length}
            </strong>
            <small>{t.homeStatsChapters}</small>
          </div>
        </div>
      ) : null}

      <div className="home-grid">
        {/* Each card carries a single-CJK "stage badge" (學 / 練 / 背 /
            考 / 補) instead of a lucide-react icon. The icons read as
            tech-product chrome; the kanji read as editorial. Stages
            suggest a natural progression but the cards stay
            independently entry-able -- a returning learner who only
            wants today's mock exam can still jump straight to 考. */}
        <button type="button" className="home-card" onClick={() => onNavigate("learn")}>
          <span className="home-card-stage" aria-hidden="true">{t.homeCardStageLearn}</span>
          <h2>{t.homeCardLearnTitle}</h2>
          <p>{t.homeCardLearnSub}</p>
          <span className="home-card-meta">
            {t.homeCardLearnMeta(completedChapters, trackableChapters.length)}
          </span>
          <ArrowRight className="home-card-arrow" aria-hidden="true" />
        </button>
        <button type="button" className="home-card" onClick={() => onNavigate("challenge")}>
          <span className="home-card-stage" aria-hidden="true">{t.homeCardStageChallenge}</span>
          <h2>{t.homeCardChallengeTitle}</h2>
          <p>{t.homeCardChallengeSub}</p>
          <span className="home-card-meta">{t.homeCardChallengeMeta}</span>
          <ArrowRight className="home-card-arrow" aria-hidden="true" />
        </button>
        <button type="button" className="home-card" onClick={onStartVocab}>
          <span className="home-card-stage" aria-hidden="true">{t.homeCardStageVocab}</span>
          <h2>{t.homeCardVocabTitle}</h2>
          <p>{t.homeCardVocabSub}</p>
          <span className="home-card-meta">{t.homeCardVocabMeta}</span>
          <ArrowRight className="home-card-arrow" aria-hidden="true" />
        </button>
        <button type="button" className="home-card" onClick={() => onNavigate("mock")}>
          <span className="home-card-stage" aria-hidden="true">{t.homeCardStageMock}</span>
          <h2>{t.homeCardMockTitle}</h2>
          <p>{t.homeCardMockSub}</p>
          <span className="home-card-meta">{t.homeCardMockMeta}</span>
          <ArrowRight className="home-card-arrow" aria-hidden="true" />
        </button>
        <button type="button" className="home-card" onClick={onStartReview}>
          <span className="home-card-stage" aria-hidden="true">{t.homeCardStageReview}</span>
          <h2>{t.homeCardReviewTitle}</h2>
          <p>
            {reviewCount > 0 ? t.homeCardReviewSubActive(reviewCount) : t.homeCardReviewSubEmpty}
          </p>
          <span className="home-card-meta">{t.homeCardReviewMeta}</span>
          <ArrowRight className="home-card-arrow" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
