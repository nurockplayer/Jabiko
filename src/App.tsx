import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  Globe,
  Languages,
  MessageCircle,
  Moon,
  Sun,
} from "lucide-react";
import type { LearningBlockDrillPreset } from "./domain/learningBlocks";
import type { SentencePatternId } from "./domain/sentencePatterns";
import type { JlptLevel } from "./domain/types";
import { countMistakes } from "./domain/srs";
import { copy, LAUNCHED_LANGUAGES, type Language } from "./i18n";
import { HomePanel, LearningPanel, RulesPanel, AboutPanel } from "./components";
import { LanguagePicker } from "./components/LanguagePicker";
import { LanguageFlag } from "./components/LanguageFlag";
import { FeedbackForm } from "./components/FeedbackForm";
import type { FeedbackCategory } from "./domain/feedbackRemote";
import { UpdateToast } from "./components/UpdateToast";
import { RouteErrorBoundary } from "./components/RouteErrorBoundary";
import { usePwaUpdate } from "./hooks/usePwaUpdate";
import { JabikoMark } from "./components/JabikoMark";
import { AppNavigation } from "./components/AppNavigation";
import { DeletePracticeHistoryDialog } from "./components/DeletePracticeHistoryDialog";
import { FuriganaContext } from "./components/furiganaContext";
import { useTheme } from "./hooks/useTheme";
import { useFurigana } from "./hooks/useFurigana";
import { useLanguage } from "./hooks/useLanguage";
import { useSeoMeta } from "./hooks/useSeoMeta";
import { useOriginMigration } from "./hooks/useOriginMigration";
import { isSupabaseConfigured } from "./lib/supabase";
import { useAuth } from "./hooks/useAuth";
import { useProgressAttempts } from "./hooks/useProgressAttempts";
import type { SessionInit } from "./hooks/usePracticeSession";
import { challengeInitFromQuery } from "./domain/challengeDeepLink";
import { readLevelPreference, writeLevelPreference } from "./domain/levelPreference";
import { kanjiDefaultLevel, type LevelRange } from "./domain/levelRange";
import { trackEvent } from "./lib/analytics";
import {
  grammarRoute,
  parseRoute,
  serializeRoute,
  staticRoute,
  type AppRoute
} from "./domain/routes";
import { resolveNavigation, type NavigationId } from "./domain/navigation";
import packageJson from "../package.json";
import "./styles.css";

// Lazy routes. The challenge view owns the practice engine, which
// statically imports the entire question bank (examBlocks alone is
// several MB and grows with each content locale, #420); the mock-exam
// picker reads the exam pool too. Loading them
// with React.lazy keeps that data out of the initial bundle -- it's
// fetched only when the learner actually opens those views. They're
// imported straight from their modules (not the components barrel) on
// purpose; see components/index.ts.
const ChallengePanel = lazy(() =>
  import("./components/ChallengePanel").then((module) => ({ default: module.ChallengePanel }))
);
const MockExamPanel = lazy(() =>
  import("./components/MockExamPanel").then((module) => ({ default: module.MockExamPanel }))
);
// 漢字音読み 速查 also pulls the vocab data (for example words), so it's
// lazy too -- imported directly from its module, not the barrel.
const KanjiOnyomiPanel = lazy(() =>
  import("./components/KanjiOnyomiPanel").then((module) => ({ default: module.KanjiOnyomiPanel }))
);
// 五十音表 standalone reference (#619). Small data, but lazy for consistency
// (only search-engine and kana-chapter traffic reaches it).
const KanaTablePage = lazy(() =>
  import("./components/KanaTablePage").then((module) => ({ default: module.KanaTablePage }))
);
// Per-grammar-point study page (#281). Pulls the exam bank + grammar notes via
// buildGrammarPoint, so it's lazy + imported directly (never via the barrel) to
// keep that data out of the initial bundle.
const GrammarPointPage = lazy(() =>
  import("./components/GrammarPointPage").then((module) => ({ default: module.GrammarPointPage }))
);
// Grammar index page (#437). Shows the grammar database overview, level browsing,
// and search. Lazy-loaded since it imports grammarDatabase.
const GrammarIndexPage = lazy(() =>
  import("./components/GrammarIndexPage").then((module) => ({ default: module.GrammarIndexPage }))
);
// Legal documents carry full zh-Hant, ja, and en policy text. Keep that prose
// out of the initial bundle; the footer labels live in a separate tiny module.
const LegalPanel = lazy(() =>
  import("./components/LegalPanel").then((module) => ({ default: module.LegalPanel }))
);
// Stay.D's long-form conversion copy remains isolated from the eager Home
// bundle. Home imports only its compact promotion card and shared essentials.
const StayDPage = lazy(() =>
  import("./components/StayDPage").then((module) => ({ default: module.StayDPage }))
);
const BUILD_VERSION = packageJson.version;

type DrillPreset = LearningBlockDrillPreset;

// The LAUNCHED locales, in menu order, for the header language picker. Each
// option's label is that locale's own native name (copy[code].languageName).
// Locales with untranslated content stay hidden until they ship (i18n.ts).
const LANGUAGE_OPTIONS: readonly Language[] = LAUNCHED_LANGUAGES;

export default function App() {
  const { language, setLanguage } = useLanguage();
  const t = copy[language];

  // Parsed once on mount. All three route-state initializers below share this
  // single route so they can never disagree.
  const initialRoute = useMemo(() => parseRoute(window.location.pathname), []);
  const [route, setRoute] = useState<AppRoute>(() => initialRoute);
  const { view: appView, grammarSurface } = route;
  // The drill the challenge view starts with on its next mount. This state
  // must exist before the popstate subscription below because back/forward
  // restores a challenge deep link through its setter.
  const [launch, setLaunch] = useState<SessionInit | undefined>(() =>
    initialRoute.view === "challenge"
      ? challengeInitFromQuery(window.location.search)
      : undefined
  );

  // #437: determine whether the current grammar path points to a JLPT level
  // (e.g., /grammar/n5) or a specific grammar point (/grammar/〜てもいい).
  const isGrammarLevelRoute =
    grammarSurface !== null && /^[Nn][1-5]$/.test(grammarSurface);
  const grammarLevel = isGrammarLevelRoute
    ? (grammarSurface!.toUpperCase() as JlptLevel)
    : null;

  // Keep the URL in sync when the view changes (push a history entry only
  // when the path actually differs, so popstate-driven changes don't loop).
  useEffect(() => {
    const target = serializeRoute(route);
    if (window.location.pathname !== target) {
      window.history.pushState({ view: route.view }, "", target);
    }
  }, [route]);

  // Back/forward: read the view (and grammar surface) back off the URL.
  useEffect(() => {
    const onPopState = () => {
      const route = parseRoute(window.location.pathname);
      setRoute(route);
      // Restore the drill from a /challenge?mode=&level= deep link on back/forward.
      if (route.view === "challenge") {
        setLaunch(challengeInitFromQuery(window.location.search));
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [language]);

  // Per-view <title>/description/canonical/og so each route surfaces its own
  // metadata to crawlers (SPA otherwise shares one static shell). See seo.ts.
  useSeoMeta(appView, grammarSurface);

  // Phase 1 analytics (#404): one page_view per top-level view change.
  // Keyed on appView only — grammar-surface drilldowns are covered by
  // study_page_viewed (below), and locale changes by locale_changed,
  // so neither re-fires page_view.
  useEffect(() => {
    trackEvent("page_view", { view: appView, locale: language });
    // language intentionally omitted: locale change fires locale_changed, not page_view
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appView]);

  // Phase 1 analytics (#404): fire study_page_viewed when a concrete grammar
  // point's study page opens — covers in-app openGrammar AND direct
  // /grammar/<surface> deep links / browser back-forward. Level-only routes
  // (e.g. /grammar/n5 — the index) are NOT study pages and are excluded.
  // lastSurface ref dedupes so re-renders with the same surface don't refire.
  const lastStudySurfaceRef = useRef<string | null>(null);
  useEffect(() => {
    if (
      appView === "grammar" &&
      grammarSurface !== null &&
      !isGrammarLevelRoute &&
      lastStudySurfaceRef.current !== grammarSurface
    ) {
      lastStudySurfaceRef.current = grammarSurface;
      trackEvent("study_page_viewed", { surface: grammarSurface, locale: language });
    }
    // Reset the dedupe ref when leaving the grammar view, going back to
    // the index (grammarSurface becomes null), or entering a level-route
    // index page — so returning to the same surface later still fires.
    if (appView !== "grammar" || grammarSurface === null || isGrammarLevelRoute) {
      lastStudySurfaceRef.current = null;
    }
  }, [appView, grammarSurface, isGrammarLevelRoute, language]);

  // One-time localStorage pull from jabiko.pages.dev after the domain move
  // (#jabiko-app-domain); no-op everywhere except a fresh jabiko.app visit.
  useOriginMigration();

  // UI language: pulled up above the analytics effects so they can read
  // `language` without a TDZ violation. The hook owns the <html lang>
  // side-effect and persistence; copy[language] re-renders the whole tree on
  // change, so the prop-drilled `language` stays a seam.

  // Show grammar index for all languages when at the grammar root or a level route.
  const showGrammarIndex = appView === "grammar" && (grammarSurface === null || isGrammarLevelRoute);

  // Language picker, opened from the header Globe button (#326).
  const [langPickerOpen, setLangPickerOpen] = useState(false);
  // Persistent feedback entry (#456): the suggestion box was only reachable from
  // the homepage footer; this opens the same form from the always-visible header.
  const [feedbackKind, setFeedbackKind] = useState<FeedbackCategory | null>(null);
  // Service-worker update lifecycle (#327): toast when a new build is ready,
  // plus safe-window auto apply — a pending update installs itself when the
  // tab is hidden or the view changes, but NEVER mid-practice (challenge /
  // mock own live question sets a reload would wipe), where the toast stays
  // the only path.
  const { needRefresh, updateApp } = usePwaUpdate(
    appView === "challenge" || appView === "mock" ? null : appView
  );

  const { theme, toggleTheme } = useTheme();
  // Global furigana (ruby) preference, default OFF (#134). The hook owns the
  // button state; FuriganaContext broadcasts `enabled` to every <Ruby>.
  const { enabled: furiganaEnabled, toggle: toggleFurigana, enable: enableFurigana } = useFurigana();
  const { user, error: authError, signInWithGoogle, signOut } = useAuth();
  // `user` drives cross-device sync: on login the hook merges the remote
  // attempt history into the local store and pushes the local-only delta.
  // `syncStatus` feeds the honest auth hint below (never says "synced"
  // until a login merge has actually completed -- #151).
  const { progressAttempts, recordAttempt, syncStatus, historyDeletionStatus, deleteSyncedPracticeHistory } =
    useProgressAttempts(user);
  // Lightweight, pool-free count for the home/learn review badge (see
  // countMistakes). The full review queue -- which needs the question pool to
  // resolve items -- is built inside the lazy challenge view.
  const reviewCount = useMemo(() => countMistakes(progressAttempts), [progressAttempts]);
  // #693: ONE shared delete-history dialog instance, opened by both the
  // desktop heading-auth action and the mobile 更多 menu entry. The entry
  // clicks record the actual trigger as the return-focus target and open the
  // user-owned UI state; the dialog closes itself on success/cancel, and a
  // failed delete stays open with a retryable error. The success flag is
  // one-shot so the localized status stays readable until the learner reopens
  // the dialog or the authenticated owner changes.
  const deletionOwnerId = user?.id ?? null;
  const [deletionUi, setDeletionUi] = useState(() => ({
    ownerId: deletionOwnerId,
    open: false,
    success: false
  }));
  // The confirmation protocol belongs to one authenticated user. Adjust the
  // local UI state during render when that owner changes so children never
  // commit stale dialog/success state for a signed-out or different account.
  if (deletionUi.ownerId !== deletionOwnerId) {
    setDeletionUi({ ownerId: deletionOwnerId, open: false, success: false });
  }
  const deleteHistoryReturnRef = useRef<HTMLButtonElement | null>(null);
  const openDeleteHistory = useCallback((trigger: HTMLButtonElement) => {
    deleteHistoryReturnRef.current = trigger;
    setDeletionUi({ ownerId: deletionOwnerId, open: true, success: false });
  }, [deletionOwnerId]);
  const handleDeleteHistoryConfirm = useCallback(async (): Promise<boolean> => {
    const ok = await deleteSyncedPracticeHistory();
    if (ok) {
      setDeletionUi((current) =>
        current.ownerId === deletionOwnerId ? { ...current, success: true } : current
      );
    }
    return ok;
  }, [deleteSyncedPracticeHistory, deletionOwnerId]);
  // Global target-level preference (#199), read once at startup. Seeds the
  // fresh-pool level range (今日練習 / 綜合 / 単字) and drives the first-run
  // onboarding card; the home card persists it.
  const [targetLevel, setTargetLevel] = useState<LevelRange | null>(() => readLevelPreference());
  const handleChooseLevel = (range: LevelRange) => {
    writeLevelPreference(range);
    setTargetLevel(range);
    trackEvent("level_changed", { scope: "global", levelRange: range, locale: language });
    if (range === "starter") {
      // 完全新手 (#532): a zero-base learner needs readings everywhere and
      // won't find the header toggle -- turn furigana on for them (their
      // choice stays overridable via the toggle; the global default is
      // untouched for everyone else).
      enableFurigana();
      // Land TRUE newcomers on the 入門 chapters (kana is the default-active
      // chapter for a fresh history). Returning learners switching bands via
      // the #526 chip keep their current view -- no surprise navigation.
      // DELIBERATE exception (same-batch override): when this choice answers
      // the daily-CTA gate, HomePanel's auto-continue fires openChallenge
      // right after and its complete challenge route wins the batch -- the
      // learner asked to START PRACTISING, and the starter daily serves 入門
      // questions, so honouring that intent beats detouring to the chapter
      // list. Locked by the "gate -> 完全新手" App test.
      if (progressAttempts.length === 0 && appView === "home") {
        setRoute(staticRoute("learn"));
      }
    }
  };

  const themeToggleLabel = theme === "dark" ? t.themeLight : t.themeDark;
  const ThemeIcon = theme === "dark" ? Sun : Moon;
  const furiganaToggleLabel = furiganaEnabled ? t.furiganaHide : t.furiganaShow;

  // One source for the sync-status line so the header auth block and the
  // mobile 更多 menu can't drift apart (#608).
  const authSyncHint = !user
    ? t.authSignInHint
    : syncStatus === "error"
      ? t.authSyncErrorHint
      : syncStatus === "synced"
        ? t.authSyncedHint
        : t.authSyncingHint;

  const openChallenge = (request?: SessionInit) => {
    // `request` seeds the session when ChallengePanel MOUNTS (its
    // usePracticeSession reads init via useState initializers). Every
    // init-carrying caller fires from a non-challenge panel (home /
    // learn / mock), so navigating in always mounts ChallengePanel fresh
    // and the seed applies. Don't call this with a non-undefined request
    // from INSIDE the challenge view -- the panel is already mounted, so
    // the seed would be silently ignored. (The nav-bar 挑戰 button seeds
    // 今日練習 as the default landing -- the guided mixed session, so the
    // learner practises on arrival instead of the raw 基礎變化 setup
    // cascade; re-clicking it while already in the challenge view is a
    // no-op since the mounted panel ignores re-seeds.)
    setLaunch(request);
    setRoute(staticRoute("challenge"));
    // Phase 1 analytics (#404): every practice entry funnels through here.
    // Weak-point review gets its own event so we can tell "open review" apart
    // from "start a fresh drill"; payloads are metadata only (no question text).
    // Skip tracking when already on the challenge view (re-clicking the nav
    // 挑戰 button while mounted) — the panel ignores re-seeds, so tracking
    // here would inflate practice-start metrics with no-op clicks.
    const isAlreadyInChallenge = appView === "challenge";
    if (!isAlreadyInChallenge) {
      if (request?.mode === "review") {
        trackEvent("weak_review_started", { dueCount: reviewCount, locale: language });
      } else {
        trackEvent("practice_started", {
          source: request?.mode ?? "daily",
          levelRange: request?.levelRange,
          locale: language
        });
      }
    }
  };

  const startDrill = (preset: DrillPreset) => {
    openChallenge({
      mode: "basic",
      partOfSpeech: preset.partOfSpeech,
      verbGroup: preset.verbGroup ?? "all",
      practiceFocus: preset.practiceFocus,
      targetForm: preset.targetForm
    });
  };

  const startPatternDrill = (patternIds: SentencePatternId[]) => {
    openChallenge({ mode: "pattern", filter: { patternIds } });
  };

  const navigation = resolveNavigation(route, language);
  const navigateFromAppNavigation = (id: NavigationId) => {
    if (id === "challenge") {
      openChallenge({ mode: "daily" });
      return;
    }
    if (id === "grammar") {
      setRoute(grammarRoute());
      return;
    }
    setRoute(staticRoute(id));
  };

  const routeResetKey = `${appView}:${grammarSurface ?? ""}`;

  return (
    <main className="app-shell">
      <RouteErrorBoundary
        resetKey={routeResetKey}
        title={t.routeErrorTitle}
        body={t.routeErrorBody}
        reloadLabel={t.routeErrorReload}
        clearCacheLabel={t.routeErrorClearCache}
        homeLabel={t.routeErrorGoHome}
        onGoHome={() => {
          setRoute(staticRoute("home"));
        }}
        context={{
          route: window.location.pathname,
          locale: language,
          buildVersion: BUILD_VERSION
        }}
      >
      {needRefresh && <UpdateToast label={t.updateAvailable} onUpdate={updateApp} />}
      {langPickerOpen && (
        <LanguagePicker
          current={language}
          options={LANGUAGE_OPTIONS}
          onChoose={(code) => {
            trackEvent("locale_changed", { from: language, to: code });
            setLanguage(code);
            setLangPickerOpen(false);
          }}
          onClose={() => setLangPickerOpen(false)}
          closeLabel={t.feedbackClose}
        />
      )}
      {feedbackKind ? (
        <FeedbackForm
          language={language}
          category={feedbackKind}
          onClose={() => setFeedbackKind(null)}
        />
      ) : null}
      {deletionUi.success ? (
        <p className="delete-history-status" role="status" aria-live="polite">
          {t.deleteHistorySuccess}
        </p>
      ) : null}
      <DeletePracticeHistoryDialog
        open={deletionUi.open}
        status={historyDeletionStatus}
        onConfirm={handleDeleteHistoryConfirm}
        onClose={() => setDeletionUi((current) => ({ ...current, open: false }))}
        returnFocusRef={deleteHistoryReturnRef}
        copy={{
          title: t.deleteHistoryTitle,
          description: t.deleteHistoryDescription,
          confirmLabel: t.deleteHistoryConfirm,
          confirmDeleting: t.deleteHistoryConfirming,
          cancelLabel: t.deleteHistoryCancel,
          closeLabel: t.deleteHistoryClose,
          checkboxLabel: t.deleteHistoryCheckbox,
          success: t.deleteHistorySuccess,
          error: t.deleteHistoryError
        }}
      />
      {/* #608: non-home views compress the heading to a one-line brand bar on
          phones (CSS-only; desktop and the home hero keep the full intro). */}
      <div
        className={`app-heading${appView === "home" ? "" : " app-heading-compact"}`}
        aria-label={t.appIntroLabel}
      >
        <div className="app-brand">
          <JabikoMark className="app-brand-mark" />
          <div>
            <p className="eyebrow">Your JLPT self-study room.</p>
            {/* The persistent brand title is the site's single h1 -- except on
                the /grammar/<surface> SEO landing route, where the grammar
                surface is the page-specific h1, so the brand title yields to h2
                to keep exactly one h1 per view. Styling rides the .app-title
                class, not the tag, so the level change is purely semantic. */}
            {appView === "grammar" || appView === "stayD" ? (
              <h2 className="app-title">{t.appTitle}</h2>
            ) : (
              <h1 className="app-title">{t.appTitle}</h1>
            )}
          </div>
        </div>
        <div className="heading-actions">
          <p>{t.appTagline}</p>
          {isSupabaseConfigured && (
            <div className={`heading-auth${user ? "" : " heading-auth-guest"}`}>
              {user ? (
                <div className="heading-auth-row">
                  <span className="heading-user">{t.authSignedInAs(user.user_metadata.full_name ?? user.email ?? "")}</span>
                  <button type="button" className="auth-button" onClick={signOut}>
                    {t.authSignOut}
                  </button>
                </div>
              ) : (
                <button type="button" className="auth-button" onClick={signInWithGoogle}>
                  {t.authSignIn}
                </button>
              )}
              {user ? (
                <button
                  type="button"
                  className="delete-history-text-action"
                  onClick={(event) => openDeleteHistory(event.currentTarget)}
                >
                  {t.deleteHistoryLabel}
                </button>
              ) : null}
              {authError ? (
                <span className="heading-auth-error" role="alert">
                  {t.authErrors[authError]}
                </span>
              ) : (
                <span className="auth-hint">{authSyncHint}</span>
              )}
            </div>
          )}
          <div className="utility-actions">
            {LANGUAGE_OPTIONS.length > 1 && (
              <button
                type="button"
                className="theme-toggle lang-switch-button"
                aria-label={t.languageSwitchLabel}
                aria-haspopup="dialog"
                onClick={() => setLangPickerOpen(true)}
              >
                <Globe aria-hidden="true" className="lang-switch-globe" />
                <LanguageFlag language={language} className="lang-switch-flag" />
                <span className="lang-switch-name">{copy[language].languageName}</span>
                <ChevronDown aria-hidden="true" className="lang-switch-caret" />
              </button>
            )}
            <button
              className={`theme-toggle furigana-toggle${furiganaEnabled ? " active" : ""}`}
              type="button"
              aria-pressed={furiganaEnabled}
              aria-label={furiganaToggleLabel}
              onClick={toggleFurigana}
            >
              <Languages aria-hidden="true" />
              <span className="toggle-text">{furiganaToggleLabel}</span>
            </button>
            <button className="theme-toggle" type="button" aria-label={themeToggleLabel} onClick={toggleTheme}>
              <ThemeIcon aria-hidden="true" />
              <span className="toggle-text">{themeToggleLabel}</span>
            </button>
            <button
              className="theme-toggle feedback-nav-button"
              type="button"
              aria-label={t.feedbackTitle}
              aria-haspopup="dialog"
              onClick={() => setFeedbackKind("wish")}
            >
              <MessageCircle aria-hidden="true" />
              <span className="toggle-text">{t.feedbackTitle}</span>
            </button>
          </div>
        </div>
      </div>

      <AppNavigation
        ariaLabel={t.flowLabel}
        navigation={navigation}
        labels={{
          home: t.home,
          learn: t.learn,
          challenge: t.challenge,
          mockExam: t.mockExam,
          grammar: t.grammar,
          rules: t.rules,
          kanji: t.kanji,
          kanaPageTitle: t.kanaPageTitle,
          about: t.about
        }}
        resourcesLabel={t.navResources}
        resourcesCurrentLabel={t.navResourcesWithCurrent}
        moreLabel={t.navMore}
        moreCurrentLabel={t.navMoreWithCurrent}
        onSelect={navigateFromAppNavigation}
        tools={{
            heading: t.navMoreTools,
            language:
              LANGUAGE_OPTIONS.length > 1
                ? { label: t.languageSwitchLabel, onOpen: () => setLangPickerOpen(true) }
                : undefined,
            furigana: {
              label: furiganaToggleLabel,
              pressed: furiganaEnabled,
              onToggle: toggleFurigana
            },
            theme: { label: themeToggleLabel, onToggle: toggleTheme },
            feedback: { label: t.feedbackTitle, onOpen: () => setFeedbackKind("wish") },
            auth: isSupabaseConfigured
              ? {
                  signedInAs: user ? (user.user_metadata.full_name ?? user.email ?? "") : null,
                  hint: authError ? t.authErrors[authError] : authSyncHint,
                  signInLabel: t.authSignIn,
                  signOutLabel: t.authSignOut,
                  onSignIn: signInWithGoogle,
                  onSignOut: signOut,
                  deleteHistoryLabel: t.deleteHistoryLabel,
                  onDeleteHistory: openDeleteHistory
                }
              : undefined
        }}
      />

      <FuriganaContext.Provider value={{ enabled: furiganaEnabled }}>
      {appView === "home" ? (
        <HomePanel
          language={language}
          progressAttempts={progressAttempts}
          reviewCount={reviewCount}
          onNavigate={(target) => {
            if (target === "challenge") {
              openChallenge({ mode: "daily" });
              return;
            }
            // Mirror the nav button: a stale grammar-point surface would
            // otherwise reopen the last-viewed point instead of the index.
            setRoute(target === "grammar" ? grammarRoute() : staticRoute(target));
          }}
          onStartReview={() => openChallenge({ mode: "review" })}
          onStartBookmarks={() => openChallenge({ mode: "bookmarks" })}
          onStartVocab={() =>
            // Level-aware funnel: jlptVocabulary has no N4/N5, so the 背 card
            // serves the 基礎詞彙 deck to the starter/n4n5 bands instead of
            // clamping them into the N1/N2 reading deck (swap back per-band
            // once #535 lands N5 vocab).
            openChallenge(
              targetLevel === "starter" || targetLevel === "n4n5"
                ? { mode: "starter" }
                : { mode: "vocab" }
            )
          }
          onStartDaily={() => openChallenge({ mode: "daily" })}
          onStartExamPreset={(range) => openChallenge({ mode: "exam", levelRange: range })}
          targetLevel={targetLevel}
          onChooseLevel={handleChooseLevel}
        />
      ) : appView === "learn" ? (
        <LearningPanel
          language={language}
          progressAttempts={progressAttempts}
          reviewCount={reviewCount}
          onStartChallenge={() => openChallenge()}
          onStartReview={() => openChallenge({ mode: "review" })}
          onStartDrill={startDrill}
          onStartPatternDrill={startPatternDrill}
          onStartExamSection={(level, promptLabel) =>
            openChallenge({ mode: "exam", filter: { examSection: { level, promptLabel } } })
          }
          onStartKanaDrill={(script) =>
            openChallenge({ mode: "kana", filter: { kanaScript: script } })
          }
          onStartStarterDrill={() => openChallenge({ mode: "starter" })}
          onOpenKana={() => setRoute(staticRoute("kana"))}
        />
      ) : appView === "rules" ? (
        <RulesPanel language={language} />
      ) : appView === "about" ? (
        <AboutPanel language={language} />
      ) : appView === "privacy" || appView === "terms" ? (
        <Suspense fallback={<PanelFallback label={t.loading} />}>
          <LegalPanel language={language} page={appView} />
        </Suspense>
      ) : appView === "stayD" ? (
        <Suspense fallback={<PanelFallback label={t.loading} />}>
          <StayDPage language={language} />
        </Suspense>
      ) : appView === "kanji" ? (
        <Suspense fallback={<PanelFallback label={t.loading} />}>
          <KanjiOnyomiPanel language={language} defaultLevel={kanjiDefaultLevel(targetLevel)} />
        </Suspense>
      ) : appView === "kana" ? (
        <Suspense fallback={<PanelFallback label={t.loading} />}>
          <KanaTablePage
            language={language}
            onStartKanaDrill={(script) =>
              openChallenge({ mode: "kana", filter: { kanaScript: script } })
            }
          />
        </Suspense>
      ) : appView === "mock" ? (
        <Suspense fallback={<PanelFallback label={t.loading} />}>
          <MockExamPanel
            language={language}
            onStartSection={(level, promptLabel) =>
              openChallenge({ mode: "exam", filter: { examSection: { level, promptLabel } } })
            }
          />
        </Suspense>
      ) : appView === "grammar" && showGrammarIndex ? (
        <Suspense fallback={<PanelFallback label={t.loading} />}>
          <GrammarIndexPage
            language={language}
            level={grammarLevel}
            onOpenPattern={(surface) => {
              setRoute(grammarRoute(surface));
            }}
            onBack={() => setRoute(staticRoute("home"))}
            onBackToOverview={() => {
              setRoute(grammarRoute());
            }}
            onSelectLevel={(lvl) => {
              setRoute(grammarRoute(lvl));
            }}
          />
        </Suspense>
      ) : appView === "grammar" ? (
        <Suspense fallback={<PanelFallback label={t.loading} />}>
          <GrammarPointPage
            surface={grammarSurface ?? ""}
            language={language}
            onPractice={() => openChallenge({ mode: "daily" })}
            onBack={() => {
              // Go back to grammar index (overview or level index)
              setRoute(grammarRoute());
            }}
            onNavigate={(surface) => setRoute(grammarRoute(surface))}
          />
        </Suspense>
      ) : (
        <Suspense fallback={<PanelFallback label={t.loading} />}>
          <ChallengePanel
            init={launch}
            progressAttempts={progressAttempts}
            recordAttempt={recordAttempt}
            language={language}
            targetLevel={targetLevel}
            onExit={() => setRoute(staticRoute("home"))}
            onOpenFeedback={() => setFeedbackKind("wish")}
          />
        </Suspense>
      )}
      </FuriganaContext.Provider>
      </RouteErrorBoundary>
    </main>
  );
}

// Suspense placeholder while a lazy view chunk loads. Sized minimally;
// the chunks are small enough that on a warm cache this is a single
// frame, but it keeps the layout from collapsing on first open.
function PanelFallback({ label }: { label: string }) {
  return (
    <div className="panel-loading" role="status" aria-live="polite">
      {label}
    </div>
  );
}
