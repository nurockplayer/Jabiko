import type { Attempt } from "./types";

// Cross-device attempt sync -- Phase 1 (pure merge logic), Part of #151.
//
// Attempts are append-only practice records (see storage.ts). To sync them
// across devices via Supabase we need a deterministic identity per attempt
// (so the same record uploaded then re-downloaded de-dupes, and two devices
// union without overwriting each other). This module is pure + offline: it
// owns only the key + merge; the remote repo (Phase 2) and hook wiring
// (Phase 3) build on it.

// Deterministic identity for an attempt. Same logical record -> same key;
// two genuinely different attempts -> different keys. The tuple includes
// responseTimeMs as well as the timestamp: questionId is derived from
// vocabularyId+targetForm (so it adds no entropy), and two distinct attempts
// on the same word/form/answer can land in the same millisecond (e.g. a
// double-fired MCQ keypress, or two devices), so timestamp alone is not
// unique -- responseTimeMs makes a real collision effectively impossible,
// preventing silent loss in the merge. JSON-encodes the tuple so arbitrary
// answer text can't collide via a separator char. Doubles as the DB row id
// (or, preferably, its hash -- see Phase 2) for the idempotent upsert.
export function attemptKey(attempt: Attempt): string {
  return JSON.stringify([
    attempt.questionId ?? null,
    attempt.vocabularyId,
    attempt.targetForm,
    attempt.timestamp,
    attempt.submittedAnswer,
    attempt.responseTimeMs
  ]);
}

// Union of two attempt lists, de-duplicated by attemptKey, sorted by
// timestamp (ascending). Pure -- inputs are not mutated. First occurrence
// wins, and `local` is listed first so a local record takes precedence over
// an identical remote one (never overwrites local). Idempotent: merging in
// an already-merged remote set adds nothing.
//
// The equal-timestamp tiebreak is a plain binary string compare on the key
// (NOT localeCompare): the merged order must be identical on every device so
// SRS, which replays same-timestamp attempts in array order, can't diverge
// across devices.
export function mergeAttempts(local: Attempt[], remote: Attempt[]): Attempt[] {
  const byKey = new Map<string, Attempt>();
  for (const attempt of [...local, ...remote]) {
    const key = attemptKey(attempt);
    if (!byKey.has(key)) {
      byKey.set(key, attempt);
    }
  }
  return [...byKey.values()].sort((a, b) => {
    if (a.timestamp !== b.timestamp) {
      return a.timestamp - b.timestamp;
    }
    const ka = attemptKey(a);
    const kb = attemptKey(b);
    return ka < kb ? -1 : ka > kb ? 1 : 0;
  });
}
