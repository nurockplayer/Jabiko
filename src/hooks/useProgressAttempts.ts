import { useCallback, useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createAttemptStore } from "../domain/storage";
import { fetchRemoteAttempts, planLoginSync, pushAttempts } from "../domain/attemptRemote";
import { getSupabase } from "../lib/supabase";
import type { Attempt } from "../domain/types";

// One persistent attempt store for the app session.
const attemptStore = createAttemptStore();

// Status of cross-device sync (Phase 3, Part of #151):
//   idle    -- no user / anon path (or before any login this session)
//   syncing -- a login merge is in flight
//   synced  -- the last login merge completed (writes are best-effort after)
//   error   -- the last login merge failed; local was left untouched
export type SyncStatus = "idle" | "syncing" | "synced" | "error";

// Owns the lifetime attempt history (loaded from storage on mount,
// appended on every answer). Lifted OUT of usePracticeSession so it can
// live in the always-mounted App shell: the home/learn dashboards read
// it for progress + the review badge, while the lazily-loaded challenge
// view only needs to append to it via recordAttempt. Keeping it here is
// also what lets usePracticeSession (and the heavy question-pool data it
// imports) stay out of the initial bundle.
//
// `user` (from useAuth) drives cross-device sync: on a transition to a
// logged-in user we merge the remote history into the local store and push
// the local-only delta back up. The anon (no-user) path is unchanged --
// local only, never cleared, and the Supabase SDK stays in its lazy chunk.
export function useProgressAttempts(user: User | null) {
  const [progressAttempts, setProgressAttempts] = useState<Attempt[]>(() => attemptStore.list());
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");

  const userId = user?.id ?? null;

  // Keep the latest userId for recordAttempt's best-effort push without
  // making the callback's identity depend on it (identity must stay stable
  // so the lazy challenge view doesn't re-render on every answer).
  const userIdRef = useRef<string | null>(userId);
  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  // Login sync: runs when the user id transitions to a non-null value.
  useEffect(() => {
    if (!userId) {
      // Logout / anon: behaviour exactly as before -- local untouched,
      // status back to idle.
      setSyncStatus("idle");
      return;
    }

    let active = true;
    setSyncStatus("syncing");

    (async () => {
      const client = await getSupabase();
      const remote = await fetchRemoteAttempts(client, userId);
      const { merged, toUpload } = planLoginSync(attemptStore.list(), remote);
      attemptStore.replace(merged);
      if (!active) {
        return;
      }
      setProgressAttempts(merged);
      await pushAttempts(client, userId, toUpload);
      if (!active) {
        return;
      }
      setSyncStatus("synced");
    })().catch(() => {
      // Any failure (offline, RLS, etc.): keep local untouched, surface the
      // error. The local store still holds everything; the next login retries.
      if (active) {
        setSyncStatus("error");
      }
    });

    return () => {
      active = false;
    };
  }, [userId]);

  // Stable identity (setProgressAttempts is stable; attemptStore is a
  // module singleton; user id read via ref) so passing it down to the
  // challenge view doesn't change on every answer.
  const recordAttempt = useCallback((attempt: Attempt) => {
    setProgressAttempts((current) => [...current, attempt]);
    attemptStore.add(attempt);

    // Best-effort live upload when logged in. The attempt is already safe in
    // the local store, so a failed push is swallowed -- it will sync on the
    // next login. Fire-and-forget: never blocks recording.
    const id = userIdRef.current;
    if (id) {
      void getSupabase()
        .then((client) => pushAttempts(client, id, [attempt]))
        .catch(() => {
          /* best-effort; safe in local store */
        });
    }
  }, []);

  return { progressAttempts, recordAttempt, syncStatus };
}
