import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import {
  BookA,
  BookOpen,
  ChevronDown,
  ClipboardList,
  Globe,
  GraduationCap,
  Home,
  Info,
  Languages,
  MessageCircle,
  Moon,
  Newspaper,
  Sun,
  Table,
  Target
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
import { canonicalArticleSlug } from "./domain/articlesMeta";
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
// 文章 / blog (#483). Its article data (domain/articles) is zh-Hant content;
// lazy + imported straight from the module keeps that prose off the initial
// bundle, and the whole view is gated to zh-Hant below.
const BlogIndexPage = lazy(() =>
  import("./components/BlogIndexPage").then((module) => ({ default: module.BlogIndexPage }))
);
const BlogArticlePage = lazy(() =>
  import("./components/BlogArticlePage").then((module) => ({ default: module.BlogArticlePage }))
);
const BUILD_VERSION = packageJson.version;

type AppView = "home" | "learn" | "rules" | "kanji" | "challenge" | "mock" | "about" | "grammar" | "blog";
type DrillPreset = LearningBlockDrillPreset;

// The LAUNCHED locales, in menu order, for the header language picker. Each
// option's label is that locale's own native name (copy[code].languageName).
// Locales with untranslated content stay hidden until they ship (i18n.ts).
const LANGUAGE_OPTIONS: readonly Language[] = LAUNCHED_LANGUAGES;

// Every view-switch tab carries a small icon (user feedback 2026-07: only
// 文型/文章 had one, which looked half-finished). One shared style keeps
// the nine call sites identical.
const navIconStyle = { verticalAlign: "middle", marginRight: "0.2rem" } as const;

// Lightweight URL routing: each top-level view maps to a path so the browser
// back/forward buttons, refresh, and shareable/bookmarkable links all work
// (no router dependency). The challenge view's internal mode/filter stays as
// ephemeral state -- deep-linking a specific drill is out of scope here.
// Needs a SPA fallback on the host (public/_redirects) so a direct hit on a
// sub-path serves index.html.
const VIEW_PATHS: Record<AppView, string> = {
  home: "/",
  learn: "/learn",
  rules: "/rules",
  kanji: "/kanji",
  challenge: "/challenge",
  mock: "/mock",
  about: "/about",
  // Base path; the live grammar route carries a surface segment (see parseRoute
  // / pathForView). Bare /grammar with no surface falls back to home.
  grammar: "/grammar",
  // Blog index; individual articles carry a slug segment (/blog/<slug>).
  blog: "/blog"
};

function viewFromPath(pathname: string): AppView {
  const match = (Object.entries(VIEW_PATHS) as [AppView, string][]).find(
    ([, path]) => path === pathname
  );
  return match ? match[0] : "home";
}

// Per-grammar-point study pages (#281) live at /grammar/<encoded-surface>, the
// one dynamic route. parseRoute pulls both the view and (for grammar) the
// decoded surface off the path; pathForView is its inverse for URL sync.
function parseRoute(pathname: string): {
  view: AppView;
  grammarSurface: string | null;
  blogSlug: string | null;
} {
  const grammar = pathname.match(/^\/grammar\/(.+)$/);
  if (grammar) {
    let surface = grammar[1];
    try {
      surface = decodeURIComponent(surface);
    } catch {
      // Malformed escape -- keep the raw segment rather than throwing.
    }
    return { view: "grammar", grammarSurface: surface, blogSlug: null };
  }
  // Individual article route /blog/<slug> (#483); bare /blog is the index.
  const blog = pathname.match(/^\/blog\/(.+)$/);
  if (blog) {
    let slug = blog[1];
    try {
      slug = decodeURIComponent(slug);
    } catch {
      // Malformed escape -- keep the raw segment.
    }
    slug = canonicalArticleSlug(slug);
    return { view: "blog", grammarSurface: null, blogSlug: slug };
  }
  return { view: viewFromPath(pathname), grammarSurface: null, blogSlug: null };
}

function pathForView(view: AppView, grammarSurface: string | null, blogSlug: string | null): string {
  if (view === "grammar" && grammarSurface) {
    return `/grammar/${encodeURIComponent(grammarSurface)}`;
  }
  if (view === "blog" && blogSlug) {
    return `/blog/${encodeURIComponent(blogSlug)}`;
  }
  return VIEW_PATHS[view];
}

export default function App() {
  const [appView, setAppView] = useState<AppView>(() => parseRoute(window.location.pathname).view);
  // The grammar-point surface for the active /grammar/<surface> route (#281).
  const [grammarSurface, setGrammarSurface] = useState<string | null>(
    () => parseRoute(window.location.pathname).grammarSurface
  );
  // The article slug for the active /blog/<slug> route (#483); null = index.
  const [blogSlug, setBlogSlug] = useState<string | null>(
    () => parseRoute(window.location.pathname).blogSlug
  );

  // UI language is pulled up here so the analytics effects (page_view /
  // study_page_viewed) below can read `language` without a TDZ violation.
  const { language, setLanguage } = useLanguage();
  const t = copy[language];

  // Open a grammar point's study page (#282): from the post-answer feedback's
  // "深入學習這個文法 →" link, and deep-linkable directly via the URL.
  const openGrammar = (surface: string) => {
    setGrammarSurface(surface);
    setAppView("grammar");
  };

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
    const target = pathForView(appView, grammarSurface, blogSlug);
    if (window.location.pathname !== target) {
      window.history.pushState({ view: appView }, "", target);
    }
  }, [appView, grammarSurface, blogSlug]);

  // Back/forward: read the view (and grammar surface) back off the URL.
  useEffect(() => {
    const onPopState = () => {
      const route = parseRoute(window.location.pathname);
      setAppView(route.view);
      setGrammarSurface(route.grammarSurface);
      setBlogSlug(route.blogSlug);
      // Restore the drill from a /challenge?mode=&level= deep link on back/forward.
      if (route.view === "challenge") {
        setLaunch(challengeInitFromQuery(window.location.search));
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  // Per-view <title>/description/canonical/og so each route surfaces its own
  // metadata to crawlers (SPA otherwise shares one static shell). See seo.ts.
  useSeoMeta(appView, grammarSurface, blogSlug);

  // Phase 1 analytics (#404): one page_view per top-level view change.
  // Keyed on appView only — grammar-surface drilldowns are covered by
  // study_page_viewed (below), and locale changes by locale_changed,
  // so neither re-fires page_view.
  useEffect(() => {
    trackEvent("page_view", { view: appView, locale: language });
  }, [appView]); // language intentionally omitted: locale change fires locale_changed, not page_view

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

  // #483: the 文章 blog is zh-Hant-only original content (流行語 / 推し活 /
  // 歌詞解說…), so both the nav entry and the view are gated to zh-Hant like
  // the grammar index. A non-zh visitor who deep-links /blog or /blog/<slug>
  // gets sent home rather than an empty shell.
  const blogAvailable = language === "zh-Hant";
  useEffect(() => {
    if (appView === "blog" && !blogAvailable) {
      setBlogSlug(null);
      setAppView("home");
    }
  }, [appView, blogAvailable]);

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
  const { progressAttempts, recordAttempt, syncStatus } = useProgressAttempts(user);
  // Lightweight, pool-free count for the home/learn review badge (see
  // countMistakes). The full review queue -- which needs the question pool to
  // resolve items -- is built inside the lazy challenge view.
  const reviewCount = useMemo(() => countMistakes(progressAttempts), [progressAttempts]);
  // The drill the challenge view starts with on its next mount. Set by
  // the "start X" actions just before navigating; undefined = the default
  // basic drill. Read once when ChallengePanel mounts (it owns the
  // session), so changing it while already in the challenge is a no-op.
  // Seed from a /challenge?mode=&level= deep link on a direct hit / refresh
  // (#264), so a shared or bookmarked drill restores; a bare /challenge or any
  // other route stays undefined (default landing).
  const [launch, setLaunch] = useState<SessionInit | undefined>(() =>
    parseRoute(window.location.pathname).view === "challenge"
      ? challengeInitFromQuery(window.location.search)
      : undefined
  );
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
      // right after and its setAppView("challenge") wins the batch -- the
      // learner asked to START PRACTISING, and the starter daily serves 入門
      // questions, so honouring that intent beats detouring to the chapter
      // list. Locked by the "gate -> 完全新手" App test.
      if (progressAttempts.length === 0 && appView === "home") {
        setAppView("learn");
      }
    }
  };

  const themeToggleLabel = theme === "dark" ? t.themeLight : t.themeDark;
  const ThemeIcon = theme === "dark" ? Sun : Moon;
  const furiganaToggleLabel = furiganaEnabled ? t.furiganaHide : t.furiganaShow;

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
    setAppView("challenge");
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

  const routeResetKey = `${appView}:${grammarSurface ?? ""}:${blogSlug ?? ""}`;

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
          setGrammarSurface(null);
          setBlogSlug(null);
          setAppView("home");
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
      <div className="app-heading" aria-label={t.appIntroLabel}>
        <div className="app-brand">
          <JabikoMark className="app-brand-mark" />
          <div>
            <p className="eyebrow">Your JLPT self-study room.</p>
            {/* The persistent brand title is the site's single h1 -- except on
                the /grammar/<surface> SEO landing route, where the grammar
                surface is the page-specific h1, so the brand title yields to h2
                to keep exactly one h1 per view. Styling rides the .app-title
                class, not the tag, so the level change is purely semantic. */}
            {appView === "grammar" ? (
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
              {authError ? (
                <span className="heading-auth-error" role="alert">
                  {t.authErrors[authError]}
                </span>
              ) : (
                <span className="auth-hint">
                  {!user
                    ? t.authSignInHint
                    : syncStatus === "error"
                      ? t.authSyncErrorHint
                      : syncStatus === "synced"
                        ? t.authSyncedHint
                        : t.authSyncingHint}
                </span>
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

      <nav className="view-switch segmented" aria-label={t.flowLabel}>
        <button
          type="button"
          className={appView === "home" ? "selected" : ""}
          aria-current={appView === "home" ? "page" : undefined}
          onClick={() => setAppView("home")}
        >
          <Home aria-hidden="true" size={16} style={navIconStyle} />
          {t.home}
        </button>
        <button
          type="button"
          className={appView === "learn" ? "selected" : ""}
          aria-current={appView === "learn" ? "page" : undefined}
          onClick={() => setAppView("learn")}
        >
          <GraduationCap aria-hidden="true" size={16} style={navIconStyle} />
          {t.learn}
        </button>
        <button
          type="button"
          className={appView === "rules" ? "selected" : ""}
          aria-current={appView === "rules" ? "page" : undefined}
          onClick={() => setAppView("rules")}
        >
          <Table aria-hidden="true" size={16} style={navIconStyle} />
          {t.rules}
        </button>
        <button
          type="button"
          className={appView === "kanji" ? "selected" : ""}
          aria-current={appView === "kanji" ? "page" : undefined}
          onClick={() => setAppView("kanji")}
        >
          <BookA aria-hidden="true" size={16} style={navIconStyle} />
          {t.kanji}
        </button>
        <button
          type="button"
          className={appView === "grammar" && (grammarSurface === null || isGrammarLevelRoute) ? "selected" : ""}
          aria-current={appView === "grammar" && (grammarSurface === null || isGrammarLevelRoute) ? "page" : undefined}
          onClick={() => { setGrammarSurface(null); setAppView("grammar"); }}
        >
          <BookOpen aria-hidden="true" size={16} style={navIconStyle} />
          {t.grammar}
        </button>
        {blogAvailable ? (
          <button
            type="button"
            className={appView === "blog" ? "selected" : ""}
            aria-current={appView === "blog" ? "page" : undefined}
            onClick={() => { setBlogSlug(null); setAppView("blog"); }}
          >
            <Newspaper aria-hidden="true" size={16} style={navIconStyle} />
            {t.blog}
          </button>
        ) : null}
        <button
          type="button"
          className={appView === "challenge" ? "selected" : ""}
          aria-current={appView === "challenge" ? "page" : undefined}
          onClick={() => openChallenge({ mode: "daily" })}
        >
          <Target aria-hidden="true" size={16} style={navIconStyle} />
          {t.challenge}
        </button>
        <button
          type="button"
          className={appView === "mock" ? "selected" : ""}
          aria-current={appView === "mock" ? "page" : undefined}
          onClick={() => setAppView("mock")}
        >
          <ClipboardList aria-hidden="true" size={16} style={navIconStyle} />
          {t.mockExam}
        </button>
        <button
          type="button"
          className={appView === "about" ? "selected" : ""}
          aria-current={appView === "about" ? "page" : undefined}
          onClick={() => setAppView("about")}
        >
          <Info aria-hidden="true" size={16} style={navIconStyle} />
          {t.about}
        </button>
      </nav>

      <FuriganaContext.Provider value={{ enabled: furiganaEnabled }}>
      {appView === "home" ? (
        <HomePanel
          language={language}
          progressAttempts={progressAttempts}
          reviewCount={reviewCount}
          onNavigate={(target) =>
            target === "challenge" ? openChallenge({ mode: "daily" }) : setAppView(target)
          }
          onStartReview={() => openChallenge({ mode: "review" })}
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
        />
      ) : appView === "rules" ? (
        <RulesPanel language={language} />
      ) : appView === "about" ? (
        <AboutPanel language={language} />
      ) : appView === "kanji" ? (
        <Suspense fallback={<PanelFallback label={t.loading} />}>
          <KanjiOnyomiPanel language={language} defaultLevel={kanjiDefaultLevel(targetLevel)} />
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
              setGrammarSurface(surface);
            }}
            onBack={() => setAppView("home")}
            onBackToOverview={() => {
              setGrammarSurface(null);
            }}
            onSelectLevel={(lvl) => {
              setGrammarSurface(lvl);
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
              setGrammarSurface(null);
              setAppView("grammar");
            }}
            onNavigate={(surface) => setGrammarSurface(surface)}
          />
        </Suspense>
      ) : appView === "blog" && blogAvailable && blogSlug === null ? (
        <Suspense fallback={<PanelFallback label={t.loading} />}>
          <BlogIndexPage
            language={language}
            onOpenArticle={(slug) => setBlogSlug(slug)}
            onBack={() => setAppView("home")}
          />
        </Suspense>
      ) : appView === "blog" && blogAvailable ? (
        <Suspense fallback={<PanelFallback label={t.loading} />}>
          <BlogArticlePage
            slug={blogSlug ?? ""}
            language={language}
            onBack={() => setBlogSlug(null)}
            onCta={(cta) =>
              cta.kind === "challenge"
                ? openChallenge({ mode: cta.mode })
                : openGrammar(cta.surface)
            }
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
            onExit={() => setAppView("home")}
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
