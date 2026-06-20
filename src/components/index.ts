// Barrel for the EAGERLY-loaded view panels + leaf presentational
// components. ChallengePanel and MockExamPanel are intentionally NOT
// re-exported here: they pull in the heavy question-pool data, so App
// lazy-loads them with React.lazy directly from their modules. Listing
// them in this barrel would make that data eager again (any App import
// from the barrel would drag them into the initial bundle).
export { HomePanel } from "./HomePanel";
export { LearningPanel } from "./LearningPanel";
export { RulesPanel } from "./RulesPanel";
export { ExamPrompt } from "./ExamPrompt";
export { FeedbackPanel } from "./FeedbackPanel";
export { SpeakButton } from "./SpeakButton";
export type { Feedback } from "./types";
