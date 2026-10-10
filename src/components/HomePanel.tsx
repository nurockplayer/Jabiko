import { useEffect, useState, type ReactNode } from "react";
import { ArrowRight, BookOpen, Bug, ChevronDown, ChevronRight, Heart, RotateCcw, Sparkles, Target } from "lucide-react";
import { copy, type Language } from "../i18n";
import type { Attempt } from "../domain/types";
import type { LevelRange } from "../domain/levelRange";
import { isLearningBlockComplete, learningBlocks } from "../domain/learningBlocks";
import { localizeLearningBlock, type LearningBlockOverlays } from "../domain/learningBlockText";
import { CONTENT_STATS } from "../domain/contentStats";
import { computeProgressStats } from "../domain/stats";
import { computeEarnedPoints } from "../domain/points";
import { computeActivityTrend } from "../domain/analytics/trend";
import { computeErrorsByQuestionType } from "../domain/analytics/weakness";
import { greetingLine, todayGreeting, type TodayGreeting } from "../domain/todayGreeting";
import { buddyEnergy } from "../domain/buddyReaction";
import { AccuracyRing } from "./dashboard/AccuracyRing";
import { LevelBars } from "./dashboard/LevelBars";
import { ActivityTrend } from "./dashboard/ActivityTrend";
import { TypeBars } from "./dashboard/TypeBars";
import { FeedbackForm } from "./FeedbackForm";
import { ShareButtons } from "./challenge/ShareButtons";
import { LegalLinks } from "./LegalLinks";
import { JabikoBuddy } from "./JabikoBuddy";
import type { FeedbackCategory } from "../domain/feedbackRemote";
import { getBookmarkedIds } from "../domain/bookmarks";
import { StayDHomeRecommendation } from "./StayDHomeRecommendation";
import { gamePreviewCopyFor } from "../domain/gamePreviewCopy";
import { ToriiSpot, OmamoriSpot, LanternSpot } from "../illustrations";

// External walkthrough / 使用說明書: the author's blog post about Jabiko.
// Surfaced in the about section so first-time visitors can read how to use the app.
const GUIDE_URL = "https://hanayukii.dev/blog/jabiko-jlpt-app";

// Content-volume snapshot rendered in the about section. The exam /
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

function greetingGloss(greeting: TodayGreeting, t: (typeof copy)[Language]): string {
  switch (greeting.kind) {
    case "welcome":
      return t.today.gloss.welcome;
    case "keepGoing":
      return t.today.gloss.keepGoing(greeting.streakDays);
    case "practicedToday":
      return t.today.gloss.practicedToday(greeting.answeredToday);
    case "streakWaiting":
      return t.today.gloss.streakWaiting(greeting.streakDays);
    default:
      return t.today.gloss.returning;
  }
}

// One practice destination in a Today list (#866). The leading kanji keycap
// is Jabiko's wayfinding mark (a word the learner can read, not an icon in a
// tinted circle); it is decorative, so the row's name is its title + line.
function TodayRow({
  glyph,
  title,
  sub,
  meta,
  onClick,
  className
}: {
  glyph: string;
  title: ReactNode;
  sub: ReactNode;
  meta?: ReactNode;
  onClick: () => void;
  className?: string;
}) {
  return (
    <li>
      <button type="button" className={className ? `today-row ${className}` : "today-row"} onClick={onClick}>
        <span className="today-row-glyph" lang="ja" aria-hidden="true">
          {glyph}
        </span>
        <span className="today-row-text">
          <strong>{title}</strong>
          <small>{sub}</small>
        </span>
        {meta != null ? <span className="today-row-meta">{meta}</span> : null}
        <ChevronRight className="today-row-chevron" aria-hidden="true" />
      </button>
    </li>
  );
}

// Today (#866): the first view the learner lands on, in the order of the
// learner's job --
//   1. The Today hero: ジャビ子's greeting, the real momentum (streak, today's
//      count), one primary action and one quiet suggestion. A brand-new
//      visitor sees the level choices instead; each choice starts the round.
//   2. Practice rows, then conversation & story rows.
//   3. Reference links, the progress dashboard, then "about Jabiko".
//
// HomePanel is intentionally read-only of the learner state -- mutating
// callbacks (onNavigate, onStartReview) live on the parent so the panel
// stays a presentational component.
export function HomePanel({
  language,
  progressAttempts,
  reviewCount,
  onNavigate,
  onOpenGame,
  onStartReview,
  onStartVocab,
  onStartBookmarks,
  onStartDaily,
  onStartConjugation,
  onStartExamPreset,
  targetLevel,
  onChooseLevel
}: {
  language: Language;
  progressAttempts: Attempt[];
  reviewCount: number;
  // 2026-07 grid refresh: the picker block also links the reference views
  // (grammar / kanji / rules / kana) via the quick-links row.
  onNavigate: (
    target: "learn" | "challenge" | "mock" | "grammar" | "kanji" | "rules" | "kana" | "conversation"
  ) => void;
  onOpenGame: () => void;
  onStartReview: () => void;
  onStartVocab: () => void;
  // Starts the starred-questions pass (#470) from the bookmarks row.
  onStartBookmarks: () => void;
  onStartDaily: () => void;
  onStartConjugation: () => void;
  // Launches the 綜合/備考 exam session for a band -- the 下一步 suggestion's
  // target for non-starter learners (level-aware funnel).
  onStartExamPreset: (range: LevelRange) => void;
  // Global target-level preference (#199): null = not chosen yet. Drives the
  // first-run level choice; selecting a band persists it via onChooseLevel.
  targetLevel: LevelRange | null;
  onChooseLevel: (range: LevelRange) => void;
}) {
  const t = copy[language];
  // Render-time snapshot (same semantics as the review count): the row's
  // number refreshes when home re-renders, which is enough for an entry row.
  const bookmarkCount = getBookmarkedIds().length;
  // Chapter titles are localized via the learningBlocks.i18n overlay chunk,
  // so it's dynamically imported (same pattern as LearningPanel) to keep the
  // eager home bundle light. Until it resolves, the continue suggestion shows
  // the zh source title and re-renders on arrival (#427).
  const [chapterOverlays, setChapterOverlays] = useState<LearningBlockOverlays>({});
  useEffect(() => {
    let alive = true;
    import("../domain/learningBlocks.i18n").then((module) => {
      if (alive) setChapterOverlays(module.learningBlockI18n);
    });
    return () => {
      alive = false;
    };
  }, []);

  // First-run level choice: only for a brand-new learner -- no saved
  // preference AND no answer history. Each label maps to an existing
  // LevelRange band; options stay in easy → hard order.
  const showLevelOnboarding = targetLevel === null && progressAttempts.length === 0;
  const onboardingOptions: { range: LevelRange; label: string; hint: string }[] = [
    // 完全新手 first (#532): easy -> hard reading order, and the zero-base
    // learner is exactly who must not mis-classify themselves.
    { range: "starter", label: t.levelOnboarding.starter, hint: t.levelOnboarding.starterHint },
    { range: "n4n5", label: t.levelOnboarding.beginner, hint: t.levelOnboarding.beginnerHint },
    {
      range: "n3n4",
      label: t.levelOnboarding.lowerIntermediate,
      hint: t.levelOnboarding.lowerIntermediateHint
    },
    { range: "n2n3", label: t.levelOnboarding.intermediate, hint: t.levelOnboarding.intermediateHint },
    { range: "n1n2", label: t.levelOnboarding.advanced, hint: t.levelOnboarding.advancedHint }
  ];

  const totalAttempts = progressAttempts.length;
  // ジャビ子's greeting and the hero readouts, from the real history (#866).
  // The clock is read once per visit to Today (render must stay pure), and
  // again whenever the page comes back into view, so a Today left open
  // overnight (a tab or the installed PWA) moves to the new local day.
  const [openedAt, setOpenedAt] = useState(() => Date.now());
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") setOpenedAt(Date.now());
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);
  const greeting = todayGreeting(progressAttempts, openedAt);

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

  // Progress / mastery overview (#133): due + mastered + per-level accuracy,
  // all aggregated from attempts (+ SRS state) with no heavy bank import.
  // Only shown once the learner has a history.
  const progress = computeProgressStats(progressAttempts);
  // Daily practice volume for the last fortnight (dashboard v1, #243).
  const activityTrend = computeActivityTrend(progressAttempts, TREND_DAYS);
  // Per-question-type accuracy, weakest first (dashboard phase 2, #243).
  const typeWeakness = computeErrorsByQuestionType(progressAttempts);

  // 許願 / 問題回報: which feedback form is open (null = closed). Opened by the
  // footer buttons; the form submits anonymously to Supabase.
  const [feedbackKind, setFeedbackKind] = useState<FeedbackCategory | null>(null);

  // Level-aware funnel: the vocab row's destination content. 完全新手 (starter)
  // drills the 入門 deck (kana + starter vocab), never JLPT 単字. The n4n5
  // band keeps the same 基礎詞彙 entry for now -- its real N4/N5 単字讀音
  // entry is the challenge mode picker (#668).
  const vocabCardIsStarter = targetLevel === "starter" || targetLevel === "n4n5";

  // 你的下一步 (level-aware funnel): the hero's quiet second action. Review
  // and continue-chapter keep priority; when neither applies but a band IS
  // chosen, suggest the band's natural next stop -- 入門 chapters for a
  // starter, the band's 備考 pool for everyone else.
  const showNextStep =
    reviewCount === 0 &&
    targetLevel !== null &&
    !(totalAttempts > 0 && nextIncompleteChapter);

  // Persistent "目標級別" control (#526): once the first-run choice is gone,
  // this compact control is the only way to see and re-pick the target level.
  // Collapsed by default; 變更 expands the picker.
  const [levelEditing, setLevelEditing] = useState(false);
  const currentLevelOption = onboardingOptions.find((option) => option.range === targetLevel);

  // Daily CTA level gate (#532): without a target level the daily session
  // used to fall back to the "all" (N1/N2-heavy) pool -- a brand-new
  // visitor's first tap served questions they couldn't read. A brand-new
  // visitor therefore never sees a level-less CTA (#866): the level choices
  // start the round. A returning learner without a preference who taps the
  // CTA gets the band picker opened, and the choice CONTINUES into the daily
  // session (one flow, no second tap).
  const [dailyPending, setDailyPending] = useState(false);
  const handleStartDaily = () => {
    if (targetLevel !== null) {
      onStartDaily();
      return;
    }
    setDailyPending(true);
    setLevelEditing(true);
  };

  const chooseLevel = (range: LevelRange) => {
    onChooseLevel(range);
    setLevelEditing(false);
    if (dailyPending) {
      setDailyPending(false);
      onStartDaily();
    }
  };

  // A brand-new visitor's level choice starts the first round -- except
  // 完全新手: nobody can answer kana questions before learning kana, so the
  // app lands them on lesson 1 (五十音) instead (#532 learn-landing).
  const chooseFirstLevel = (range: LevelRange) => {
    onChooseLevel(range);
    if (range !== "starter") onStartDaily();
  };

  const nextStep = (() => {
    if (reviewCount > 0) {
      return (
        <button type="button" className="today-next today-next-review" onClick={onStartReview}>
          <RotateCcw aria-hidden="true" />
          <span>{t.homeBannerReviewMain(reviewCount)}</span>
        </button>
      );
    }
    if (totalAttempts > 0 && nextIncompleteChapter) {
      return (
        <button
          type="button"
          className="today-next home-banner-continue"
          onClick={() => onNavigate("learn")}
          aria-describedby="today-next-note"
        >
          <BookOpen aria-hidden="true" />
          <span>
            {t.homeBannerContinueMain(
              localizeLearningBlock(nextIncompleteChapter, language, chapterOverlays).title
            )}
          </span>
          <small id="today-next-note">{t.homeBannerContinueSub}</small>
        </button>
      );
    }
    if (showNextStep && targetLevel === "starter") {
      return (
        <button type="button" className="today-next home-banner-continue" onClick={() => onNavigate("learn")}>
          <BookOpen aria-hidden="true" />
          <span>{t.homeBannerNextLearnMain}</span>
        </button>
      );
    }
    if (showNextStep && targetLevel !== null) {
      return (
        <button
          type="button"
          className="today-next home-banner-continue"
          onClick={() => onStartExamPreset(targetLevel)}
        >
          <Target aria-hidden="true" />
          <span>
            {targetLevel === "all"
              ? t.homeBannerNextExamAllMain
              : t.homeBannerNextExamMain(t.levelRangeOptions[targetLevel])}
          </span>
        </button>
      );
    }
    return null;
  })();

  const gameCopy = gamePreviewCopyFor(language);

  return (
    <section className="home-panel today" aria-label={t.home}>
      <section className="today-hero" aria-labelledby="today-title" data-greeting={greeting.kind}>
        <div className="today-hero-voice">
          <JabikoBuddy mood="happy" energy={buddyEnergy(greeting.streakDays)} className="today-buddy" />
          <p className="today-hero-greeting">
            <span className="today-hero-line" lang="ja">
              {greetingLine(greeting)}
            </span>
            <span className="today-hero-gloss">{greetingGloss(greeting, t)}</span>
          </p>
        </div>
        <h2 id="today-title" className="today-hero-title">
          {t.homeHeroTitle}
        </h2>

        {showLevelOnboarding ? (
          <>
            <p className="today-hero-lead">{t.today.firstVisitLead}</p>
            <div className="home-level-card" role="group" aria-label={t.levelOnboarding.title}>
              <p className="today-level-label">{t.levelOnboarding.title}</p>
              <div className="home-level-card-options">
                {onboardingOptions.map((option) => (
                  <button
                    key={option.range}
                    type="button"
                    className="home-level-option"
                    onClick={() => chooseFirstLevel(option.range)}
                  >
                    <strong>{option.label}</strong>
                    <small>{option.hint}</small>
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            {greeting.streakDays > 0 || greeting.answeredToday > 0 ? (
              <p className="today-momentum">
                {greeting.streakDays > 0 ? (
                  <span className="today-momentum-streak">{t.today.streak(greeting.streakDays)}</span>
                ) : null}
                {greeting.answeredToday > 0 ? <span>{t.today.answeredToday(greeting.answeredToday)}</span> : null}
              </p>
            ) : null}

            <button type="button" className="home-banner home-banner-daily today-start" onClick={handleStartDaily}>
              <span className="home-banner-text">
                <strong>{t.homeDailyMain}</strong>
                <small>{t.homeDailySub}</small>
              </span>
              <ArrowRight aria-hidden="true" />
            </button>
            {dailyPending ? (
              <p className="home-level-gate-hint" role="status">
                {t.levelOnboarding.chooseFirst}
              </p>
            ) : null}

            {nextStep}

            {/* Persistent target-level control (#526): reflects the current
                band and, when expanded, re-uses the level picker so the
                level can be changed at any time. */}
            <div className="home-level-manage" role="group" aria-label={t.levelOnboarding.manageTitle}>
              <button
                type="button"
                className="home-level-chip"
                aria-expanded={levelEditing}
                onClick={() => setLevelEditing((open) => !open)}
              >
                <span className="home-level-chip-label">{t.levelOnboarding.manageTitle}</span>
                <span className="home-level-chip-value">
                  {currentLevelOption ? (
                    <>
                      <strong>{currentLevelOption.label}</strong>
                      <small>{currentLevelOption.hint}</small>
                    </>
                  ) : (
                    <em>{t.levelOnboarding.notSet}</em>
                  )}
                </span>
                <span className="home-level-chip-action">{t.levelOnboarding.change}</span>
                <ChevronDown className="home-level-chip-caret" aria-hidden="true" />
              </button>
              {levelEditing ? (
                <div className="home-level-card-options">
                  {onboardingOptions.map((option) => (
                    <button
                      key={option.range}
                      type="button"
                      className="home-level-option"
                      aria-pressed={option.range === targetLevel}
                      onClick={() => chooseLevel(option.range)}
                    >
                      <strong>{option.label}</strong>
                      <small>{option.hint}</small>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </>
        )}
      </section>

      <section className="today-section" aria-labelledby="today-practice-title">
        <h2 id="today-practice-title" className="today-section-title">
          {t.today.practiceSection}
        </h2>
        <ul className="today-rows">
          <TodayRow
            glyph="学"
            title={t.homeCardLearnTitle}
            sub={t.homeCardLearnSub}
            meta={`${completedChapters} / ${trackableChapters.length}`}
            onClick={() => onNavigate("learn")}
          />
          <TodayRow
            glyph="活"
            className="home-conjugation-launch"
            title={t.homeConjugationMain}
            sub={t.homeConjugationSub}
            onClick={onStartConjugation}
          />
          <TodayRow
            glyph={vocabCardIsStarter ? "語" : "読"}
            title={vocabCardIsStarter ? t.homeCardVocabTitleStarter : t.homeCardVocabTitle}
            sub={vocabCardIsStarter ? t.homeCardVocabSubStarter : t.homeCardVocabSub}
            onClick={onStartVocab}
          />
          <TodayRow
            glyph="試"
            title={t.homeCardMockTitle}
            sub={t.homeCardMockSub}
            onClick={() => onNavigate("mock")}
          />
          <TodayRow
            glyph="復"
            title={t.homeCardReviewTitle}
            sub={reviewCount > 0 ? t.homeCardReviewSubActive(reviewCount) : t.homeCardReviewSubEmpty}
            meta={reviewCount > 0 ? reviewCount : undefined}
            onClick={onStartReview}
          />
          <TodayRow
            glyph="栞"
            title={t.homeCardBookmarksTitle}
            sub={bookmarkCount > 0 ? t.homeCardBookmarksSubActive(bookmarkCount) : t.homeCardBookmarksSubEmpty}
            meta={bookmarkCount > 0 ? bookmarkCount : undefined}
            onClick={onStartBookmarks}
          />
          <TodayRow
            glyph="練"
            title={t.homeCardChallengeTitle}
            sub={t.homeCardChallengeSub}
            onClick={() => onNavigate("challenge")}
          />
        </ul>
      </section>

      <StayDHomeRecommendation language={language} />

      <section className="today-section" aria-labelledby="today-talk-title">
        <h2 id="today-talk-title" className="today-section-title">
          {t.today.talkSection}
        </h2>
        <ul className="today-rows">
          {/* #814 Small Talk Lab: a separate short-conversation practice path
              (everyday scenes, curated feedback), not another JLPT entry. */}
          <TodayRow
            glyph="話"
            title={t.homeCardConversationTitle}
            sub={t.homeCardConversationSub}
            meta={t.homeCardConversationMeta}
            onClick={() => onNavigate("conversation")}
          />
          <li>
            <a
              className="today-row home-game-preview-entry"
              href="/game"
              onClick={(event) => {
                if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                event.preventDefault();
                onOpenGame();
              }}
            >
              <span className="today-row-glyph" lang="ja" aria-hidden="true">
                町
              </span>
              <span className="today-row-text">
                <strong className="home-game-preview-label">{gameCopy.entry}</strong>
                <small className="home-game-preview-copy">{gameCopy.entryHint}</small>
              </span>
              <ChevronRight className="today-row-chevron" aria-hidden="true" />
            </a>
          </li>
        </ul>
      </section>

      {/* Reference views (no session to start, just look things up). Labels
          are deliberately DISTINCT from the nav tabs (文型資料庫 vs 文型 …) --
          two identically-named buttons on one page would be an
          accessible-name collision. kana reuses its page title (not a tab). */}
      <nav className="home-quicklinks" aria-label={t.homeQuickLinksLabel}>
        <span className="home-quicklinks-label">{t.homeQuickLinksLabel}</span>
        <button type="button" onClick={() => onNavigate("grammar")}>{t.quickLinkGrammar}</button>
        <button type="button" onClick={() => onNavigate("kanji")}>{t.quickLinkKanji}</button>
        <button type="button" onClick={() => onNavigate("rules")}>{t.quickLinkRules}</button>
        <button type="button" onClick={() => onNavigate("kana")}>{t.kanaPageTitle}</button>
      </nav>

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
            {/* Same local-day streak as the hero, so the page never shows
                two different streaks (#866). */}
            <div className="home-stats-cell">
              <strong>{greeting.streakDays}</strong>
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
            {/* Points economy foundation: 1 point per correct answer, derived
                from the same attempt history as the other tiles (points.ts). */}
            <div className="home-stats-cell home-stats-cell-points">
              <strong>{computeEarnedPoints(progressAttempts)}</strong>
              <small>{t.homeStatsPoints}</small>
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

      <section className="today-about" aria-labelledby="today-about-title">
        {/* Decorative art -- the heading and text carry the message, so alt
            is intentionally empty. */}
        <img className="home-hero-image" src="/hero.webp" alt="" width={1600} height={900} loading="lazy" />
        <div className="today-about-text">
          <h2 id="today-about-title" className="today-section-title">
            {t.today.aboutSection}
          </h2>
          <p className="home-hero-kicker">{t.homeHeroKicker}</p>
          <p>{t.homeHeroIntro}</p>
          {/* Content-volume line: counts are derived from the data modules
              so it stays honest whenever a content batch lands. */}
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
          <a className="home-hero-guide" href={GUIDE_URL} target="_blank" rel="noopener noreferrer">
            <BookOpen aria-hidden="true" />
            {t.homeGuideLink}
          </a>
        </div>
      </section>

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
        <LegalLinks language={language} />
      </footer>
    </section>
  );
}
