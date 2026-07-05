import { useEffect, useRef } from "react";
import { copy, type Language } from "../i18n";
import type { Attempt } from "../domain/types";
import type { LevelRange } from "../domain/levelRange";
import { usePracticeSession, type SessionInit } from "../hooks/usePracticeSession";
import { trackEvent } from "../lib/analytics";
import { ModePicker } from "./challenge/ModePicker";
import { DrillPanel } from "./challenge/DrillPanel";
import { ScoreReport } from "./challenge/ScoreReport";
import { ReviewList } from "./challenge/ReviewList";
import { SessionLengthPicker } from "./challenge/SessionLengthPicker";

// The challenge workspace: the three-column practice layout (mode/setup
// controls, the active drill, and the running mistake list). This is the
// lazily-loaded view that owns the practice session -- usePracticeSession
// (and the heavy question-data it imports) only loads when the learner
// enters the challenge. This module is the assembly layer: it runs the
// session hook and wires its state/handlers into the three column
// subcomponents (ModePicker / DrillPanel / ScoreReport + ReviewList),
// which live in ./challenge and are imported ONLY from here so the heavy
// challenge chunk (examBlocks etc.) stays out of the initial bundle.
// `init` is the launch request (which drill to start); `progressAttempts`
// / `recordAttempt` are the App-owned attempt history; `onExit` returns to
// the home dashboard from the review completion / empty screens.
export function ChallengePanel({
  init,
  progressAttempts,
  recordAttempt,
  language,
  targetLevel = null,
  onExit,
  onOpenGrammar
}: {
  init?: SessionInit;
  progressAttempts: Attempt[];
  recordAttempt: (attempt: Attempt) => void;
  language: Language;
  // The learner's global target-level preference (#199), forwarded to the
  // session hook to seed the daily / 綜合 / 単字 level range.
  targetLevel?: LevelRange | null;
  onExit: () => void;
  // Navigate to a grammar point's study page from the post-answer feedback (#282).
  onOpenGrammar?: (surface: string) => void;
}) {
  const t = copy[language];
  const session = usePracticeSession({ language, init, progressAttempts, recordAttempt, targetLevel });

  // Phase 1 analytics (#404): fire practice_completed once when a finite
  // session is exhausted (rising edge of sessionExhausted). resetSession
  // brings sessionExhausted back to false, so the next completion re-fires.
  // level uses "all" here (the per-session band is practiceMode-scoped, and
  // the fixed mock-section level is already captured per-answer via
  // answer_submitted).
  const prevExhaustedRef = useRef(false);
  useEffect(() => {
    const exhausted = session.sessionExhausted;
    if (!prevExhaustedRef.current && exhausted) {
      trackEvent("practice_completed", {
        source: session.practiceMode,
        level: "all",
        totalQuestions: session.sessionTotal ?? session.attempts.length,
        correctCount: session.correctCount,
        locale: language
      });
    }
    prevExhaustedRef.current = exhausted;
  }, [
    session.sessionExhausted,
    session.practiceMode,
    session.sessionTotal,
    session.attempts.length,
    session.correctCount,
    language
  ]);

  return (
    <section className="practice-layout" aria-label="Jabiko practice">
      <ModePicker language={language} {...session} />

      <DrillPanel language={language} onExit={onExit} onOpenGrammar={onOpenGrammar} {...session} />

      <aside className="review-panel" aria-label={t.mistakesLabel}>
        {session.showSessionLength ? (
          <SessionLengthPicker
            language={language}
            sessionLength={session.sessionLength}
            onChange={session.handleSessionLengthChange}
          />
        ) : null}
        <ScoreReport
          language={language}
          attempts={session.attempts}
          correctCount={session.correctCount}
          accuracy={session.accuracy}
          mistakeCount={session.mistakeQuestions.length}
        />
        <ReviewList language={language} mistakeQuestions={session.mistakeQuestions} />
      </aside>
    </section>
  );
}
