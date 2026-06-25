// Snapshot of the content-volume counts shown on the home dashboard.
//
// These are hardcoded numbers, NOT computed at runtime, on purpose: the
// home screen is the eager landing view, and computing them live would
// force it to statically import the heavy question-pool / vocabulary
// data modules (examBlocks alone is ~288 KB) -- pulling all of that into
// the initial bundle just to render a one-line stat strip. Hardcoding
// lets the home view stay light; the heavy data is loaded only when the
// learner actually enters the practice flow.
//
// The counts only change when a content batch ships (which rebuilds the
// bundle anyway). `contentStats.test.ts` asserts these stay in sync with
// the live builders, so any drift fails CI until the numbers are
// updated here.
export const CONTENT_STATS = {
  examItems: 1113,
  n1Grammar: 265,
  patternChecks: 32,
  vocab: 579,
  kanjiReadings: 671
} as const;
