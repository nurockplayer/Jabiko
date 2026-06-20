import type { PracticeQuestion } from "../domain/types";

// Post-answer feedback state for the current practice question.
// null = not yet answered. Shared between the challenge view (which owns
// the state) and FeedbackPanel / choiceOptionClass (which render it).
export type Feedback =
  | { status: "correct"; question: PracticeQuestion }
  | { status: "incorrect"; question: PracticeQuestion }
  | { status: "revealed"; question: PracticeQuestion }
  | null;
