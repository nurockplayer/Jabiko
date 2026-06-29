import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Languages, Moon, Sun } from "lucide-react";
import type { LearningBlockDrillPreset } from "./domain/learningBlocks";
import type { SentencePatternId } from "./domain/sentencePatterns";
import { countDueReviews } from "./domain/srs";
import { copy, type Language } from "./i18n";
import { HomePanel, LearningPanel, RulesPanel, AboutPanel } from "./components";
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
import { readLevelPreference, writeLevelPreference } from "./domain/levelPreference";
import type { LevelRange } from "./domain/levelRange";
import "./styles.css";

// Lazy routes. The challenge view owns the practice engine, which
// statically imports the entire question bank (examBlocks alone is
// ~288 KB); the mock-exam picker reads the exam pool too. Loading them
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

type AppView = "home" | "learn" | "rules" | "kanji" | "challenge" | "mock" | "about";
type DrillPreset = LearningBlockDrillPreset;

// The five UI locales, in menu order, for the header language <select>. Each
// option's label is that locale's own native name (copy[code].languageName).
const LANGUAGE_OPTIONS: readonly Language[] = ["zh-Hant", "en"];

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
  about: "/about"
};

function viewFromPath(pathname: string): AppView {
  const match = (Object.entries(VIEW_PATHS) as [AppView, string][]).find(
    ([, path]) => path === pathname
  );
  return match ? match[0] : "home";
}

export default function App() {
  const [appView, setAppView] = useState<AppView>(() => viewFromPath(window.location.pathname));

  // Keep the URL in sync when the view changes (push a history entry only
  // when the path actually differs, so popstate-driven changes don't loop).
  useEffect(() => {
    const target = VIEW_PATHS[appView];
    if (window.location.pathname !== target) {
      window.history.pushState({ view: appView }, "", target);
    }
  }, [appView]);

  // Back/forward: read the view back off the URL.
  useEffect(() => {
    const onPopState = () => setAppView(viewFromPath(window.location.pathname));
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  // Per-view <title>/description/canonical/og so each route surfaces its own
  // metadata to crawlers (SPA otherwise shares one static shell). See seo.ts.
  useSeoMeta(appView);

  // UI language: stored preference > navigator detection > zh-Hant default
  // (#299). The hook owns the <html lang> side-effect and persistence; the
  // header <select> below lets the learner switch. copy[language] re-renders
  // the whole tree on change, so the prop-drilled `language` stays a seam.
  const { language, setLanguage } = useLanguage();
  const t = copy[language];

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
  const [launch, setLaunch] = useState<SessionInit | undefined>(undefined);
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
      <div className="app-heading" aria-label={t.appIntroLabel}>
        <div className="app-brand">
          <JabikoMark className="app-brand-mark" />
          <div>
            <p className="eyebrow">Your JLPT self-study room.</p>
            <h1>{t.appTitle}</h1>
          </div>
        </div>
        <div className="heading-actions">
          <p>{t.appTagline}</p>
          {isSupabaseConfigured && (
            <div className="heading-auth">
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
                  {authError}
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
          {LANGUAGE_OPTIONS.length > 1 && (
            <div className="lang-switch">
              <Languages aria-hidden="true" className="lang-switch-icon" />
              <select
                className="lang-switch-select"
                aria-label={t.languageSwitchLabel}
                value={language}
                onChange={(event) => setLanguage(event.target.value as Language)}
              >
                {LANGUAGE_OPTIONS.map((code) => (
                  <option key={code} value={code}>
                    {copy[code].languageName}
                  </option>
                ))}
              </select>
            </div>
          )}
          <button
            className={`theme-toggle furigana-toggle${furiganaEnabled ? " active" : ""}`}
            type="button"
            aria-pressed={furiganaEnabled}
            onClick={toggleFurigana}
          >
            <Languages aria-hidden="true" />
            {furiganaToggleLabel}
          </button>
          <button className="theme-toggle" type="button" onClick={toggleTheme}>
            <ThemeIcon aria-hidden="true" />
            {themeToggleLabel}
          </button>
        </div>
      </div>

      <nav className="view-switch segmented" aria-label={t.flowLabel}>
        <button
          type="button"
          className={appView === "home" ? "selected" : ""}
          onClick={() => setAppView("home")}
        >
          {t.home}
        </button>
        <button
          type="button"
          className={appView === "learn" ? "selected" : ""}
          onClick={() => setAppView("learn")}
        >
          {t.learn}
        </button>
        <button
          type="button"
          className={appView === "rules" ? "selected" : ""}
          onClick={() => setAppView("rules")}
        >
          {t.rules}
        </button>
        <button
          type="button"
          className={appView === "kanji" ? "selected" : ""}
          onClick={() => setAppView("kanji")}
        >
          {t.kanji}
        </button>
        <button
          type="button"
          className={appView === "challenge" ? "selected" : ""}
          onClick={() => openChallenge({ mode: "daily" })}
        >
          {t.challenge}
        </button>
        <button
          type="button"
          className={appView === "mock" ? "selected" : ""}
          onClick={() => setAppView("mock")}
        >
          {t.mockExam}
        </button>
        <button
          type="button"
          className={appView === "about" ? "selected" : ""}
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
          onNavigate={(target) => (target === "challenge" ? openChallenge() : setAppView(target))}
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
      ) : (
        <Suspense fallback={<PanelFallback label={t.loading} />}>
          <ChallengePanel
            init={launch}
            progressAttempts={progressAttempts}
            recordAttempt={recordAttempt}
            language={language}
            targetLevel={targetLevel}
            onExit={() => setAppView("home")}
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
