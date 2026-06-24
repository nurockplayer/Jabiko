import { lazy, Suspense, useMemo, useState } from "react";
import { Languages, Moon, Sun } from "lucide-react";
import type { LearningBlockDrillPreset } from "./domain/learningBlocks";
import type { SentencePatternId } from "./domain/sentencePatterns";
import { countDueReviews } from "./domain/srs";
import { copy, type Language } from "./i18n";
import { HomePanel, LearningPanel, RulesPanel } from "./components";
import { FuriganaContext } from "./components/furiganaContext";
import { useTheme } from "./hooks/useTheme";
import { useFurigana } from "./hooks/useFurigana";
import { isSupabaseConfigured } from "./lib/supabase";
import { useAuth } from "./hooks/useAuth";
import { useProgressAttempts } from "./hooks/useProgressAttempts";
import type { SessionInit } from "./hooks/usePracticeSession";
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

type AppView = "home" | "learn" | "rules" | "kanji" | "challenge" | "mock";
type DrillPreset = LearningBlockDrillPreset;

export default function App() {
  const [appView, setAppView] = useState<AppView>("home");
  // Single-language app (zh-Hant). The `language` seam is kept so the
  // copy[language] call sites and component props don't have to change;
  // re-adding a locale later is just restoring entries in i18n.ts.
  const language: Language = "zh-Hant";
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
        <div>
          <p className="eyebrow">Minna no Nihongo practice</p>
          <h1>{t.appTitle}</h1>
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
        />
      ) : appView === "rules" ? (
        <RulesPanel language={language} />
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
