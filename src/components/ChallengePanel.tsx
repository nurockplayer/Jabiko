import { copy, type Language } from "../i18n";
import type { Attempt } from "../domain/types";
import { usePracticeSession, type SessionInit } from "../hooks/usePracticeSession";
import { ModePicker } from "./challenge/ModePicker";
import { DrillPanel } from "./challenge/DrillPanel";
import { ScoreReport } from "./challenge/ScoreReport";
import { ReviewList } from "./challenge/ReviewList";

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
  onExit
}: {
  init?: SessionInit;
  progressAttempts: Attempt[];
  recordAttempt: (attempt: Attempt) => void;
  language: Language;
  onExit: () => void;
}) {
  const t = copy[language];
  const session = usePracticeSession({ language, init, progressAttempts, recordAttempt });

  return (
    <section className="practice-layout" aria-label="Jabiko practice">
      <ModePicker language={language} {...session} />

      <DrillPanel language={language} onExit={onExit} {...session} />

      <aside className="review-panel" aria-label={t.mistakesLabel}>
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
