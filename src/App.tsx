import { lazy, Suspense, useMemo, useState } from "react";
import { Moon, Sun } from "lucide-react";
import type { LearningBlockDrillPreset } from "./domain/learningBlocks";
import type { SentencePatternId } from "./domain/sentencePatterns";
import { countDueReviews } from "./domain/srs";
import { copy, type Language } from "./i18n";
import { HomePanel, LearningPanel, RulesPanel } from "./components";
import { useTheme } from "./hooks/useTheme";
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

type AppView = "home" | "learn" | "rules" | "challenge" | "mock";
type DrillPreset = LearningBlockDrillPreset;

export default function App() {
  const [appView, setAppView] = useState<AppView>("home");
  // Single-language app (zh-Hant). The `language` seam is kept so the
  // copy[language] call sites and component props don't have to change;
  // re-adding a locale later is just restoring entries in i18n.ts.
  const language: Language = "zh-Hant";
  const t = copy[language];

  const { theme, toggleTheme } = useTheme();
  const { progressAttempts, recordAttempt } = useProgressAttempts();
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

  const openChallenge = (request?: SessionInit) => {
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
          className={appView === "challenge" ? "selected" : ""}
          onClick={() => openChallenge()}
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

      {appView === "home" ? (
        <HomePanel
          language={language}
          progressAttempts={progressAttempts}
          reviewCount={reviewCount}
          onNavigate={(target) => (target === "challenge" ? openChallenge() : setAppView(target))}
          onStartReview={() => openChallenge({ mode: "review" })}
          onStartVocab={() => openChallenge({ mode: "vocab" })}
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
