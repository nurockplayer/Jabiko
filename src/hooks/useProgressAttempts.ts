import { useCallback, useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createAttemptStore } from "../domain/storage";
import { fetchRemoteAttempts, planLoginSync, pushAttempts } from "../domain/attemptRemote";
import { mergeAttempts } from "../domain/attemptSync";
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

// The terminal outcome of a single login-sync generation, keyed to the user
// whose merge it belongs to. React state stores ONLY the latest completed
// result; `syncStatus` is derived from it (never set synchronously in the
// login effect -- see below), so an expired result for a previous user can
// never surface on the current one.
type SyncResult = {
  userId: string;
  status: "synced" | "error";
};

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
  // Only the last COMPLETED sync result is held in state; "in flight" and
  // "logged out" are derived, so the login effect never needs to set state
  // synchronously (it just starts the async flow, which writes the terminal
  // result once a generation finishes).
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);

  const userId = user?.id ?? null;

  // Derived syncStatus (pure function of {lastSyncResult, current userId}):
  //   no user        -> idle            (logout needs no setState; local kept)
  //   result missing -> syncing         (login effect is starting a merge)
  //   result for the CURRENT user -> its terminal status (synced | error)
  //   result for a PREVIOUS user -> syncing (A's outcome must not leak to B)
  const syncStatus: SyncStatus =
    userId === null
      ? "idle"
      : lastSyncResult === null || lastSyncResult.userId !== userId
        ? "syncing"
        : lastSyncResult.status;

  // Keep the latest userId for recordAttempt's best-effort push without
  // making the callback's identity depend on it (identity must stay stable
  // so the lazy challenge view doesn't re-render on every answer).
  const userIdRef = useRef<string | null>(userId);
  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  // Login sync: runs when the user id transitions to a non-null value.
  // NOTE: no synchronous setState in the effect body (react-hooks v7
  // `set-state-in-effect`). "syncing" is DERIVED while the merge is in flight;
  // only the async terminal outcome writes state, and only while this
  // generation is still active.
  useEffect(() => {
    if (!userId) {
      // Logout / anon: behaviour exactly as before -- local untouched.
      // No setState("idle") needed: derived syncStatus is naturally idle.
      return;
    }

    let active = true;

    (async () => {
      // Re-check `active` after EVERY await: if the effect went stale
      // (unmount, logout -> null, or A->B user switch) while we were parked
      // on an await, a stale run must bail immediately so it touches NEITHER
      // remote NOR local. In particular it must bail after the fetch and
      // BEFORE reading the (now anon's/new user's) live attemptStore and
      // pushing it to the OLD user's remote -- otherwise A's stale
      // continuation would upload the now-current local set to user A's
      // account (a cross-account data leak).
      const client = await getSupabase();
      if (!active) {
        return;
      }
      // fetch + push run BEFORE any local mutation, so a throw from either
      // (offline, RLS, push conflict, ...) lands in the catch with the local
      // store completely untouched.
      const remote = await fetchRemoteAttempts(client, userId);
      if (!active) {
        return;
      }
      const { toUpload } = planLoginSync(attemptStore.list(), remote);
      await pushAttempts(client, userId, toUpload);
      // Only commit once the effect is still current: a stale run (unmount,
      // logout, or A->B user switch) bails here BEFORE touching local, so it
      // can never write a previous user's remote history into the now-anon
      // or new-user store.
      if (!active) {
        return;
      }
      // Re-read the live local set at commit time (rather than reusing the
      // pre-await snapshot) so any attempt recorded during the awaits is
      // folded in instead of being clobbered by replace.
      const merged = mergeAttempts(attemptStore.list(), remote);
      attemptStore.replace(merged);
      setProgressAttempts(merged);
      setLastSyncResult({ userId, status: "synced" });
    })().catch(() => {
      // Any failure (offline, RLS, push conflict, etc.): the local store is
      // left untouched because mutation only happens after fetch + push both
      // succeed and the effect is still active. Nothing is lost; the next
      // login retries.
      if (active) {
        setLastSyncResult({ userId, status: "error" });
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
