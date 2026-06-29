import { copy, type Language } from "../i18n";
import type { Attempt } from "../domain/types";
import type { LevelRange } from "../domain/levelRange";
import { usePracticeSession, type SessionInit } from "../hooks/usePracticeSession";
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
