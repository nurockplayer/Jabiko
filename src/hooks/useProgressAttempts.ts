import { useState } from "react";
import { createAttemptStore } from "../domain/storage";
import type { Attempt } from "../domain/types";

// One persistent attempt store for the app session.
const attemptStore = createAttemptStore();

// Owns the lifetime attempt history (loaded from storage on mount,
// appended on every answer). Lifted OUT of usePracticeSession so it can
// live in the always-mounted App shell: the home/learn dashboards read
// it for progress + the review badge, while the lazily-loaded challenge
// view only needs to append to it via recordAttempt. Keeping it here is
// also what lets usePracticeSession (and the heavy question-pool data it
// imports) stay out of the initial bundle.
export function useProgressAttempts() {
  const [progressAttempts, setProgressAttempts] = useState<Attempt[]>(() => attemptStore.list());

  const recordAttempt = (attempt: Attempt) => {
    setProgressAttempts((current) => [...current, attempt]);
    attemptStore.add(attempt);
  };

  return { progressAttempts, recordAttempt };
}
