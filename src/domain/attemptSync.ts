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
// two genuinely different attempts (different word / form / time / answer)
// -> different keys. JSON-encodes the identifying tuple so arbitrary answer
// text can't collide via a separator char. Doubles as the DB row id (or its
// hash) for the idempotent upsert in Phase 0/2.
export function attemptKey(attempt: Attempt): string {
  return JSON.stringify([
    attempt.questionId ?? null,
    attempt.vocabularyId,
    attempt.targetForm,
    attempt.timestamp,
    attempt.submittedAnswer
  ]);
}

// Union of two attempt lists, de-duplicated by attemptKey, sorted by
// timestamp (ascending; key as a stable tiebreak). Pure -- inputs are not
// mutated. First occurrence wins, and `local` is listed first so a local
// record takes precedence over an identical remote one (never overwrites
// local). Idempotent: merging in an already-merged remote set adds nothing.
export function mergeAttempts(local: Attempt[], remote: Attempt[]): Attempt[] {
  const byKey = new Map<string, Attempt>();
  for (const attempt of [...local, ...remote]) {
    const key = attemptKey(attempt);
    if (!byKey.has(key)) {
      byKey.set(key, attempt);
    }
  }
  return [...byKey.values()].sort(
    (a, b) => a.timestamp - b.timestamp || attemptKey(a).localeCompare(attemptKey(b))
  );
}
