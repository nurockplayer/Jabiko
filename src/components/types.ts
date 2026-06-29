import type { PracticeQuestion } from "../domain/types";

// Post-answer feedback state for the current practice question.
// null = not yet answered. Shared between the challenge view (which owns
// the state) and FeedbackPanel / choiceOptionClass (which render it).
// `submittedAnswer` is the graded answer captured AT GRADE TIME (the chosen
// string on a correct/incorrect submit, null on a reveal), tied to the
// feedback so the per-question report can never read a stale live value.
export type Feedback =
  | { status: "correct"; question: PracticeQuestion; submittedAnswer: string | null }
  | { status: "incorrect"; question: PracticeQuestion; submittedAnswer: string | null }
  | { status: "revealed"; question: PracticeQuestion; submittedAnswer: string | null }
  | null;
