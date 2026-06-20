import { useState } from "react";
import { Moon, Sun } from "lucide-react";
import type { LearningBlockDrillPreset } from "./domain/learningBlocks";
import type { SentencePatternId } from "./domain/sentencePatterns";
import { copy, type Language } from "./i18n";
import {
  ChallengePanel,
  HomePanel,
  LearningPanel,
  MockExamPanel,
  RulesPanel
} from "./components";
import { useTheme } from "./hooks/useTheme";
import { usePracticeSession } from "./hooks/usePracticeSession";
import "./styles.css";

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
  const session = usePracticeSession(language);
  const {
    reviewQueue,
    progressAttempts,
    setPartOfSpeech,
    setVerbGroup,
    setTargetForm,
    setPracticeFocus,
    setPracticeMode,
    setPracticeFilter,
    resetSession
  } = session;

  const themeToggleLabel = theme === "dark" ? t.themeLight : t.themeDark;
  const ThemeIcon = theme === "dark" ? Sun : Moon;

  const startDrill = (preset: DrillPreset) => {
    setPracticeMode("basic");
    setPracticeFilter({});
    setPartOfSpeech(preset.partOfSpeech);
    setVerbGroup(preset.verbGroup ?? "all");
    setPracticeFocus(preset.practiceFocus);
    setTargetForm(preset.targetForm);
    resetSession();
    setAppView("challenge");
  };

  const startPatternDrill = (patternIds: SentencePatternId[]) => {
    setPracticeMode("pattern");
    setPracticeFilter({ patternIds });
    resetSession();
    setAppView("challenge");
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
          onClick={() => setAppView("challenge")}
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
          reviewCount={reviewQueue.length}
          onNavigate={(target) => setAppView(target)}
          onStartReview={() => {
            setPracticeMode("review");
            setPracticeFilter({});
            resetSession();
            setAppView("challenge");
          }}
          onStartVocab={() => {
            setPracticeMode("vocab");
            setPracticeFilter({});
            resetSession();
            setAppView("challenge");
          }}
        />
      ) : appView === "learn" ? (
        <LearningPanel
          language={language}
          progressAttempts={progressAttempts}
          reviewCount={reviewQueue.length}
          onStartChallenge={() => setAppView("challenge")}
          onStartReview={() => {
            setPracticeMode("review");
            setPracticeFilter({});
            resetSession();
            setAppView("challenge");
          }}
          onStartDrill={startDrill}
          onStartPatternDrill={startPatternDrill}
        />
      ) : appView === "rules" ? (
        <RulesPanel language={language} />
      ) : appView === "mock" ? (
        <MockExamPanel
          language={language}
          onStartSection={(level, promptLabel) => {
            setPracticeMode("exam");
            setPracticeFilter({ examSection: { level, promptLabel } });
            resetSession();
            setAppView("challenge");
          }}
        />
      ) : (
        <ChallengePanel
          session={session}
          language={language}
          onExit={() => setAppView("home")}
        />
      )}
    </main>
  );
}
