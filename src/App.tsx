import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { BookOpen, ChevronDown, Globe, Languages, Moon, Sun } from "lucide-react";
import type { LearningBlockDrillPreset } from "./domain/learningBlocks";
import type { SentencePatternId } from "./domain/sentencePatterns";
import type { JlptLevel } from "./domain/types";
import { countDueReviews } from "./domain/srs";
import { copy, LAUNCHED_LANGUAGES, type Language } from "./i18n";
import { HomePanel, LearningPanel, RulesPanel, AboutPanel } from "./components";
import { LanguagePicker } from "./components/LanguagePicker";
import { LanguageFlag } from "./components/LanguageFlag";
import { UpdateToast } from "./components/UpdateToast";
import { usePwaUpdate } from "./hooks/usePwaUpdate";
import { JabikoMark } from "./components/JabikoMark";
import { FuriganaContext } from "./components/furiganaContext";
import { useTheme } from "./hooks/useTheme";
import { useFurigana } from "./hooks/useFurigana";
import { useLanguage } from "./hooks/useLanguage";
import { useSeoMeta } from "./hooks/useSeoMeta";
import { isSupabaseConfigured } from "./lib/supabase";
import { useAuth } from "./hooks/useAuth";
import { useProgressAttempts } from "./hooks/useProgressAttempts";
import type { SessionInit } from "./hooks/usePracticeSession";
import { challengeInitFromQuery } from "./domain/challengeDeepLink";
import { readLevelPreference, writeLevelPreference } from "./domain/levelPreference";
import type { LevelRange } from "./domain/levelRange";
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

type AppView = "home" | "learn" | "rules" | "kanji" | "challenge" | "mock" | "about" | "grammar";
type DrillPreset = LearningBlockDrillPreset;

// The LAUNCHED locales, in menu order, for the header language picker. Each
// option's label is that locale's own native name (copy[code].languageName).
// Locales with untranslated content stay hidden until they ship (i18n.ts).
const LANGUAGE_OPTIONS: readonly Language[] = LAUNCHED_LANGUAGES;

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
  grammar: "/grammar"
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
function parseRoute(pathname: string): { view: AppView; grammarSurface: string | null } {
  const grammar = pathname.match(/^\/grammar\/(.+)$/);
  if (grammar) {
    let surface = grammar[1];
    try {
      surface = decodeURIComponent(surface);
    } catch {
      // Malformed escape -- keep the raw segment rather than throwing.
    }
    return { view: "grammar", grammarSurface: surface };
  }
  return { view: viewFromPath(pathname), grammarSurface: null };
}

function pathForView(view: AppView, grammarSurface: string | null): string {
  if (view === "grammar" && grammarSurface) {
    return `/grammar/${encodeURIComponent(grammarSurface)}`;
  }
  return VIEW_PATHS[view];
}

export default function App() {
  const [appView, setAppView] = useState<AppView>(() => parseRoute(window.location.pathname).view);
  // The grammar-point surface for the active /grammar/<surface> route (#281).
  const [grammarSurface, setGrammarSurface] = useState<string | null>(
    () => parseRoute(window.location.pathname).grammarSurface
  );

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
  const showGrammarIndex = appView === "grammar" && (grammarSurface === null || isGrammarLevelRoute);

  // Keep the URL in sync when the view changes (push a history entry only
  // when the path actually differs, so popstate-driven changes don't loop).
  useEffect(() => {
    const target = pathForView(appView, grammarSurface);
    if (window.location.pathname !== target) {
      window.history.pushState({ view: appView }, "", target);
    }
  }, [appView, grammarSurface]);

  // Back/forward: read the view (and grammar surface) back off the URL.
  useEffect(() => {
    const onPopState = () => {
      const route = parseRoute(window.location.pathname);
      setAppView(route.view);
      setGrammarSurface(route.grammarSurface);
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
  useSeoMeta(appView, grammarSurface);

  // UI language: stored preference > ja default. The hook owns the <html lang>
  // side-effect and persistence; copy[language] re-renders the whole tree on
  // change, so the prop-drilled `language` stays a seam.
  const { language, setLanguage } = useLanguage();
  const t = copy[language];
  // Language picker, opened from the header Globe button (#326).
  const [langPickerOpen, setLangPickerOpen] = useState(false);
  // Service-worker update prompt (#327): toast when a new build is ready.
  const { needRefresh, updateApp } = usePwaUpdate();

  const { theme, toggleTheme } = useTheme();
  // Global furigana (ruby) preference, default OFF (#134). The hook owns the
  // button state; FuriganaContext broadcasts `enabled` to every <Ruby>.
  const { enabled: furiganaEnabled, toggle: toggleFurigana } = useFurigana();
  const { user, error: authError, signInWithGoogle, signOut } = useAuth();
  // `user` drives cross-device sync: on login the hook merges the remote
  // attempt history into the local store and pushes the local-only delta.
  // `syncStatus` feeds the honest auth hint below (never says "synced"
  // until a login merge has actually completed -- #151).
  const { progressAttempts, recordAttempt, syncStatus } = useProgressAttempts(user);
  // Lightweight, pool-free count for the home/learn review badge (see
  // countDueReviews). The full review queue -- which needs the question
  // pool to resolve due items -- is built inside the lazy challenge view.
  const reviewCount = useMemo(() => countDueReviews(progressAttempts), [progressAttempts]);
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

  return (
    <main className="app-shell">
      {needRefresh && <UpdateToast label={t.updateAvailable} onUpdate={updateApp} />}
      {langPickerOpen && (
        <LanguagePicker
          current={language}
          options={LANGUAGE_OPTIONS}
          onChoose={(code) => {
            setLanguage(code);
            setLangPickerOpen(false);
          }}
          onClose={() => setLangPickerOpen(false)}
          closeLabel={t.feedbackClose}
        />
      )}
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
          {t.home}
        </button>
        <button
          type="button"
          className={appView === "learn" ? "selected" : ""}
          aria-current={appView === "learn" ? "page" : undefined}
          onClick={() => setAppView("learn")}
        >
          {t.learn}
        </button>
        <button
          type="button"
          className={appView === "rules" ? "selected" : ""}
          aria-current={appView === "rules" ? "page" : undefined}
          onClick={() => setAppView("rules")}
        >
          {t.rules}
        </button>
        <button
          type="button"
          className={appView === "kanji" ? "selected" : ""}
          aria-current={appView === "kanji" ? "page" : undefined}
          onClick={() => setAppView("kanji")}
        >
          {t.kanji}
        </button>
        <button
          type="button"
          className={appView === "grammar" && grammarSurface === null ? "selected" : ""}
          aria-current={appView === "grammar" && grammarSurface === null ? "page" : undefined}
          onClick={() => { setGrammarSurface(null); setAppView("grammar"); }}
        >
          <BookOpen aria-hidden="true" size={16} style={{ verticalAlign: "middle", marginRight: "0.2rem" }} />
          文型
        </button>
        <button
          type="button"
          className={appView === "challenge" ? "selected" : ""}
          aria-current={appView === "challenge" ? "page" : undefined}
          onClick={() => openChallenge({ mode: "daily" })}
        >
          {t.challenge}
        </button>
        <button
          type="button"
          className={appView === "mock" ? "selected" : ""}
          aria-current={appView === "mock" ? "page" : undefined}
          onClick={() => setAppView("mock")}
        >
          {t.mockExam}
        </button>
        <button
          type="button"
          className={appView === "about" ? "selected" : ""}
          aria-current={appView === "about" ? "page" : undefined}
          onClick={() => setAppView("about")}
        >
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
          onStartVocab={() => openChallenge({ mode: "vocab" })}
          onStartDaily={() => openChallenge({ mode: "daily" })}
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
        />
      ) : appView === "rules" ? (
        <RulesPanel language={language} />
      ) : appView === "about" ? (
        <AboutPanel language={language} />
      ) : appView === "kanji" ? (
        <Suspense fallback={<PanelFallback label={t.loading} />}>
          <KanjiOnyomiPanel language={language} />
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
          />
        </Suspense>
      ) : appView === "grammar" ? (
        <Suspense fallback={<PanelFallback label={t.loading} />}>
          <GrammarPointPage
            surface={grammarSurface ?? ""}
            language={language}
            onPractice={() => openChallenge({ mode: "daily" })}
            onBack={() => {
              // Go back to the level index if the surface was a valid grammar point
              setGrammarSurface(null);
              setAppView("grammar");
            }}
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
            onOpenGrammar={openGrammar}
          />
        </Suspense>
      )}
      </FuriganaContext.Provider>
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
