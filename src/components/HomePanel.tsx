import { useState } from "react";
import { AlertTriangle, ArrowRight, BookOpen, Bug, CalendarCheck, Heart, Sparkles } from "lucide-react";
import { copy, type Language } from "../i18n";
import type { Attempt } from "../domain/types";
import type { LevelRange } from "../domain/levelRange";
import { isLearningBlockComplete, learningBlocks } from "../domain/learningBlocks";
import { CONTENT_STATS } from "../domain/contentStats";
import { computeProgressStats } from "../domain/stats";
import { computeActivityTrend } from "../domain/analytics/trend";
import { computeErrorsByQuestionType } from "../domain/analytics/weakness";
import { AccuracyRing } from "./dashboard/AccuracyRing";
import { LevelBars } from "./dashboard/LevelBars";
import { ActivityTrend } from "./dashboard/ActivityTrend";
import { TypeBars } from "./dashboard/TypeBars";
import { FeedbackForm } from "./FeedbackForm";
import { ShareButtons } from "./challenge/ShareButtons";
import type { FeedbackCategory } from "../domain/feedbackRemote";

// External walkthrough / 使用說明書: the author's blog post about Jabiko.
// Surfaced in the hero so first-time visitors can read how to use the app.
const GUIDE_URL = "https://hanayukii.dev/blog/jabiko-jlpt-app";
import {
  ToriiSpot,
  OmamoriSpot,
  LanternSpot,
  BooksSpot,
  BrushSpot,
  SpeechSpot,
  ExamPaperSpot,
  TargetSpot
} from "../illustrations";

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
  patternChecks: CONTENT_STATS.patternChecks,
  vocab: CONTENT_STATS.vocab,
  kanjiReadings: CONTENT_STATS.kanjiReadings
};

// Authoritative site-wide question total, summed from the drift-guarded
// CONTENT_STATS so it can never go stale as content batches land. n1Grammar
// is deliberately excluded -- it's a subset of examItems, not a separate
// pool -- and chapters are learning units, listed but not counted as 題.
const HOME_CONTENT_TOTAL =
  HOME_CONTENT_STATS.examItems +
  HOME_CONTENT_STATS.vocab +
  HOME_CONTENT_STATS.kanjiReadings +
  HOME_CONTENT_STATS.patternChecks;

// Window for the home activity-trend strip (#243). Two weeks reads as a
// glanceable "recent habit" without crowding the home page.
const TREND_DAYS = 14;

// Cap the weakness breakdown to the few weakest types -- a "weakness" callout
// is the soft spots, not an exhaustive list of every type practised.
const TYPE_WEAKNESS_ROWS = 5;

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
  onStartVocab,
  onStartDaily,
  targetLevel,
  onChooseLevel
}: {
  language: Language;
  progressAttempts: Attempt[];
  reviewCount: number;
  onNavigate: (target: "learn" | "challenge" | "mock") => void;
  onStartReview: () => void;
  onStartVocab: () => void;
  onStartDaily: () => void;
  // Global target-level preference (#199): null = not chosen yet. Drives the
  // first-run onboarding card; selecting a band persists it via onChooseLevel.
  targetLevel: LevelRange | null;
  onChooseLevel: (range: LevelRange) => void;
}) {
  const t = copy[language];

  // First-run "choose your level" card: only for a brand-new learner -- no
  // saved preference AND no answer history -- so it's a one-time nudge, never
  // shown to returning learners. Selecting a band stores it and the card
  // disappears (targetLevel becomes non-null). 初級/中級/高級 map to the
  // existing LevelRange bands (n4n5 / n2n3 / n1n2); easy → hard order.
  const showLevelOnboarding = targetLevel === null && progressAttempts.length === 0;
  const onboardingOptions: { range: LevelRange; label: string; hint: string }[] = [
    { range: "n4n5", label: t.levelOnboarding.beginner, hint: t.levelOnboarding.beginnerHint },
    { range: "n2n3", label: t.levelOnboarding.intermediate, hint: t.levelOnboarding.intermediateHint },
    { range: "n1n2", label: t.levelOnboarding.advanced, hint: t.levelOnboarding.advancedHint }
  ];

  const totalAttempts = progressAttempts.length;

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

  // Progress / mastery overview (#133): streak + due + mastered + per-level
  // accuracy, all aggregated from attempts (+ SRS state) with no heavy bank
  // import. Only shown once the learner has a history.
  const progress = computeProgressStats(progressAttempts);
  // Daily practice volume for the last fortnight (dashboard v1, #243).
  const activityTrend = computeActivityTrend(progressAttempts, TREND_DAYS);
  // Per-question-type accuracy, weakest first (dashboard phase 2, #243).
  const typeWeakness = computeErrorsByQuestionType(progressAttempts);

  // 許願 / 問題回報: which feedback form is open (null = closed). Opened by the
  // footer buttons; the form submits anonymously to Supabase.
  const [feedbackKind, setFeedbackKind] = useState<FeedbackCategory | null>(null);

  return (
    <section className="home-panel" aria-label={t.home}>
      {showLevelOnboarding ? (
        <div className="home-level-card" role="group" aria-label={t.levelOnboarding.title}>
          <div className="home-level-card-copy">
            <strong>{t.levelOnboarding.title}</strong>
            <small>{t.levelOnboarding.subtitle}</small>
          </div>
          <div className="home-level-card-options">
            {onboardingOptions.map((option) => (
              <button
                key={option.range}
                type="button"
                className="home-level-option"
                onClick={() => onChooseLevel(option.range)}
              >
                <strong>{option.label}</strong>
                <small>{option.hint}</small>
              </button>
            ))}
          </div>
        </div>
      ) : null}

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
          <a
            className="home-hero-guide"
            href={GUIDE_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            <BookOpen aria-hidden="true" />
            {t.homeGuideLink}
          </a>
        </div>
      </header>

      {/* Primary daily entry: the one-tap "今日練習" that builds a
          due-reviews-first + mixed-section session. Top of the page so
          it's the default action a returning learner reaches for. */}
      <button type="button" className="home-banner home-banner-daily" onClick={onStartDaily}>
        <CalendarCheck aria-hidden="true" />
        <span className="home-banner-text">
          <strong>{t.homeDailyMain}</strong>
          <small>{t.homeDailySub}</small>
        </span>
        <ArrowRight aria-hidden="true" />
      </button>

      {/* Content-volume strip: tells first-time visitors what they're
          walking into without resorting to SaaS-style metric tiles.
          Counts are derived live from the data modules so this stays
          honest whenever a content batch lands. */}
      <p className="home-content-stats">
        {t.homeContentStats(
          HOME_CONTENT_TOTAL,
          HOME_CONTENT_STATS.examItems,
          HOME_CONTENT_STATS.vocab,
          HOME_CONTENT_STATS.kanjiReadings,
          HOME_CONTENT_STATS.patternChecks,
          HOME_CONTENT_STATS.chapters
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

      <div className="home-grid">
        {/* Each card carries a single-CJK "stage badge" (學 / 練 / 背 /
            考 / 補) instead of a lucide-react icon. The icons read as
            tech-product chrome; the kanji read as editorial. Stages
            suggest a natural progression but the cards stay
            independently entry-able -- a returning learner who only
            wants today's mock exam can still jump straight to 考. */}
        <button type="button" className="home-card" onClick={() => onNavigate("learn")}>
          <BooksSpot className="home-card-spot" />
          <h2>{t.homeCardLearnTitle}</h2>
          <p>{t.homeCardLearnSub}</p>
          <span className="home-card-meta">
            {t.homeCardLearnMeta(completedChapters, trackableChapters.length)}
          </span>
          <ArrowRight className="home-card-arrow" aria-hidden="true" />
        </button>
        <button type="button" className="home-card" onClick={() => onNavigate("challenge")}>
          <BrushSpot className="home-card-spot" />
          <h2>{t.homeCardChallengeTitle}</h2>
          <p>{t.homeCardChallengeSub}</p>
          <span className="home-card-meta">{t.homeCardChallengeMeta}</span>
          <ArrowRight className="home-card-arrow" aria-hidden="true" />
        </button>
        <button type="button" className="home-card" onClick={onStartVocab}>
          <SpeechSpot className="home-card-spot" />
          <h2>{t.homeCardVocabTitle}</h2>
          <p>{t.homeCardVocabSub}</p>
          <span className="home-card-meta">{t.homeCardVocabMeta}</span>
          <ArrowRight className="home-card-arrow" aria-hidden="true" />
        </button>
        <button type="button" className="home-card" onClick={() => onNavigate("mock")}>
          <ExamPaperSpot className="home-card-spot" />
          <h2>{t.homeCardMockTitle}</h2>
          <p>{t.homeCardMockSub}</p>
          <span className="home-card-meta">{t.homeCardMockMeta}</span>
          <ArrowRight className="home-card-arrow" aria-hidden="true" />
        </button>
        <button type="button" className="home-card" onClick={onStartReview}>
          <TargetSpot className="home-card-spot" />
          <h2>{t.homeCardReviewTitle}</h2>
          <p>
            {reviewCount > 0 ? t.homeCardReviewSubActive(reviewCount) : t.homeCardReviewSubEmpty}
          </p>
          <span className="home-card-meta">{t.homeCardReviewMeta}</span>
          <ArrowRight className="home-card-arrow" aria-hidden="true" />
        </button>
      </div>

      {/* Stats sit BELOW the entry cards: the actionable cards are the
          headline; the progress dashboard is a glance-down afterthought. */}
      {totalAttempts > 0 ? (
        <section className="home-progress">
          {/* One headed stats group: overall accuracy lives in the ring below,
              so it's intentionally NOT repeated as a tile here. */}
          <h2 className="home-progress-title">{t.homeProgressLabel}</h2>
          <div className="home-stats-strip is-wrap" aria-label={t.homeStatsLabel}>
            <div className="home-stats-cell">
              <strong>{totalAttempts}</strong>
              <small>{t.homeStatsAttempts}</small>
            </div>
            <div className="home-stats-cell">
              <strong>
                {completedChapters} / {trackableChapters.length}
              </strong>
              <small>{t.homeStatsChapters}</small>
            </div>
            <div className="home-stats-cell">
              <strong>{progress.streakDays}</strong>
              <small>{t.homeStatsStreak}</small>
            </div>
            <div className="home-stats-cell">
              <strong>{reviewCount}</strong>
              <small>{t.homeStatsDue}</small>
            </div>
            <div className="home-stats-cell">
              <strong>{progress.masteredCount}</strong>
              <small>{t.homeStatsMastered}</small>
            </div>
          </div>

          <div className="home-overview-row">
            <AccuracyRing percent={progress.overallAccuracy} caption={t.homeStatsAccuracy} />
            <LevelBars
              levels={progress.perLevel}
              caption={t.homeLevelLabel}
              answeredLabel={t.homeLevelAnswered}
            />
          </div>

          <ActivityTrend
            points={activityTrend}
            title={t.homeTrendTitle}
            rangeLabel={t.homeTrendRange(TREND_DAYS)}
            peakLabel={t.homeTrendPeak}
            dayLabel={t.homeTrendDay}
          />

          <TypeBars
            stats={typeWeakness.slice(0, TYPE_WEAKNESS_ROWS)}
            caption={t.homeTypeWeaknessTitle}
            label={(type) => t.questionTypeLabels[type]}
            answeredLabel={t.homeLevelAnswered}
            bandLabels={t.typeBandLabels}
          />
        </section>
      ) : null}

      <footer className="home-footer">
        <div className="home-footer-spots" aria-hidden="true">
          <ToriiSpot size={40} />
          <OmamoriSpot size={40} />
          <LanternSpot size={40} />
        </div>
        <p>{t.homeFooterWish}</p>
        <div className="home-feedback">
          <button type="button" className="home-feedback-link" onClick={() => setFeedbackKind("wish")}>
            <Sparkles aria-hidden="true" />
            {t.feedbackWish}
          </button>
          <button type="button" className="home-feedback-link" onClick={() => setFeedbackKind("bug")}>
            <Bug aria-hidden="true" />
            {t.feedbackBug}
          </button>
        </div>
        {feedbackKind ? (
          <FeedbackForm
            language={language}
            category={feedbackKind}
            onClose={() => setFeedbackKind(null)}
          />
        ) : null}
        <a
          className="home-donate-link"
          href="https://payment.ecpay.com.tw/Broadcaster/Donate/57DD8DC811013DF1C576D7ED22ACF911"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Heart aria-hidden="true" />
          {t.donate}
        </a>
        <div className="home-footer-share">
          <ShareButtons language={language} text={t.shareSiteText} title={t.shareSiteTitle} />
        </div>
      </footer>
    </section>
  );
}
