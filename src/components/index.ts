// Barrel for the EAGERLY-loaded view panels only (HomePanel /
// LearningPanel / RulesPanel), which App imports directly.
//
// Everything else is intentionally NOT re-exported here:
//   - ChallengePanel / MockExamPanel pull in the heavy question-pool
//     data and are React.lazy'd in App.
//   - The leaf components (ExamPrompt / FeedbackPanel / SpeakButton) and
//     the Feedback type are used ONLY by the lazy ChallengePanel, which
//     imports them directly from their modules.
// Re-exporting any of them would make App's barrel import drag them --
// and their data (e.g. FeedbackPanel -> readingLookup -> jlptVocabulary)
// -- back into the initial bundle.
export { HomePanel } from "./HomePanel";
export { LearningPanel } from "./LearningPanel";
export { RulesPanel } from "./RulesPanel";
export { AboutPanel } from "./AboutPanel";
