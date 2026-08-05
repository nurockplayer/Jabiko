import { useCallback, useEffect, useRef, useState } from "react";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createAttemptStore } from "../domain/storage";
import {
  deleteRemoteAttempts,
  fetchRemoteAttempts,
  planLoginSync,
  pushAttempts
} from "../domain/attemptRemote";
import { mergeAttempts } from "../domain/attemptSync";
import {
  readDeletionMarker,
  removeDeletionMarker,
  writeDeletionMarker
} from "../domain/practiceHistoryDeletion";
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

// Status of the synced-history deletion protocol (#692). Like SyncStatus it is
// DERIVED (never set synchronously by an effect): `deletionInFlight` drives
// "deleting" and `lastDeletionResult` (keyed to its user) drives the terminal
// states, so a previous user's outcome can never leak into the current user's
// status (the #681 user-scoped terminal-result pattern).
//   idle     -- no user, nothing in flight, or no outcome for the current user
//   deleting -- the current user's delete (or pending-marker resume) is running
//   deleted  -- the last delete for the current user completed fully
//   error    -- the last delete for the current user failed
export type HistoryDeletionStatus = "idle" | "deleting" | "deleted" | "error";

type DeletionResult = {
  userId: string;
  status: "deleted" | "error";
};

// A single in-flight delete operation. Only one runs at a time per user;
// repeated calls share the same promise (no parallel deletes). `active` goes
// false when the captured user logs out / switches away, so a stale operation
// bails before it can touch the current user's state or store.
type DeletionOp = {
  userId: string;
  promise: Promise<boolean>;
  settled: boolean;
  active: boolean;
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
//
// #692 adds a remote-first delete of the CURRENT user's synced history:
//   - deleteSyncedPracticeHistory() writes a per-user pending marker, deletes
//     the remote rows, clears the local store + React state, then removes the
//     marker. While a marker exists, no local attempts are pushed back remote.
//   - on login with a leftover marker, the delete is resumed (remote + local)
//     BEFORE the normal fetch/merge, and sync only resumes once the marker is
//     gone -- so a half-finished delete can never be re-synced back up.
export function useProgressAttempts(user: User | null) {
  const [progressAttempts, setProgressAttempts] = useState<Attempt[]>(() => attemptStore.list());
  // Only the last COMPLETED sync result is held in state; "in flight" and
  // "logged out" are derived, so the login effect never needs to set state
  // synchronously (it just starts the async flow, which writes the terminal
  // result once a generation finishes).
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);
  // Terminal outcome of the deletion protocol, keyed to its user (see above).
  const [lastDeletionResult, setLastDeletionResult] = useState<DeletionResult | null>(null);
  // The deletion operation currently in flight (a logged-in user may never
  // request a delete, so "deleting" cannot be derived as "no result yet").
  const [deletionInFlight, setDeletionInFlight] = useState<{ userId: string; gen: number } | null>(
    null
  );

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

  // Derived deletion status -- only the current user's own op/result counts.
  const historyDeletionStatus: HistoryDeletionStatus =
    userId === null
      ? "idle"
      : deletionInFlight !== null && deletionInFlight.userId === userId
        ? "deleting"
        : lastDeletionResult !== null && lastDeletionResult.userId === userId
          ? lastDeletionResult.status
          : "idle";

  // Keep the latest userId for recordAttempt's best-effort push without
  // making the callback's identity depend on it (identity must stay stable
  // so the lazy challenge view doesn't re-render on every answer).
  const userIdRef = useRef<string | null>(userId);
  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  // Deletion protocol bookkeeping:
  //   deletionOpRef    -- the in-flight user-initiated delete (dedup target)
  //   deletionGenRef   -- monotonic gen so a stale op's finally can't clear a
  //                       newer op's "deleting" status for the same user
  //   dataGenRef       -- bumped whenever a delete clears the store; a login
  //                       sync anchored to an older gen must not commit its
  //                       stale pre-delete merge (prevents resurrection)
  const deletionOpRef = useRef<DeletionOp | null>(null);
  const deletionGenRef = useRef(0);
  const dataGenRef = useRef(0);

  // Shared tail of the delete protocol: remote delete, then (only on success)
  // clear the persistent store + React state, then remove the marker. Returns
  // true only when the marker was actually removed (full cleanup confirmed).
  // `dropMarkerOnRemoteFail`: the user-initiated flow drops the marker when
  // the remote delete fails (nothing was deleted, so there is nothing to
  // resume); the login-resume flow keeps it so the next login retries.
  const runDeleteCleanup = useCallback(
    async (
      client: SupabaseClient,
      userId: string,
      isActive: () => boolean,
      dropMarkerOnRemoteFail: boolean
    ): Promise<boolean> => {
      const remote = await deleteRemoteAttempts(client, userId);
      // Stale (logout / user switch while parked on the remote delete): bail
      // WITHOUT touching store/state -- A's late completion must never clear
      // B's data or change B's status.
      if (!isActive()) {
        return false;
      }
      if (!remote.ok) {
        if (dropMarkerOnRemoteFail) {
          removeDeletionMarker(userId);
        }
        setLastDeletionResult({ userId, status: "error" });
        return false;
      }
      // Remote succeeded: wipe local (persistent store first, then React),
      // then commit the marker removal. The marker removal is the durable
      // "cleanup confirmed" signal: when persistent storage is blocked it
      // fails together with the attempts-key removal above, so a kept marker
      // is the honest record that the local persistent copy may have survived
      // and must not be re-pushed.
      dataGenRef.current += 1;
      attemptStore.clear();
      setProgressAttempts([]);
      const removed = removeDeletionMarker(userId);
      setLastDeletionResult({ userId, status: removed ? "deleted" : "error" });
      return removed;
    },
    []
  );

  // Deletes the CURRENT user's synced practice history, remote-first. Returns
  // true only when the whole protocol completed (remote rows gone AND local
  // store + React cleared AND the marker removed). Never throws: failures are
  // reported via the boolean and the terminal status.
  const deleteSyncedPracticeHistory = useCallback((): Promise<boolean> => {
    const capturedUserId = userIdRef.current;
    if (!capturedUserId) {
      // Not logged in: nothing to do, and no marker / supabase mutation.
      return Promise.resolve(false);
    }

    // Single-flight: an in-flight delete for this same user is shared, never
    // duplicated. A settled or stale (inactive) op is replaced by a fresh one.
    const existing = deletionOpRef.current;
    if (
      existing &&
      existing.userId === capturedUserId &&
      !existing.settled &&
      existing.active
    ) {
      return existing.promise;
    }
    if (existing) {
      existing.active = false;
    }

    // The marker is the durable intent record; if we can't write it we must
    // not touch remote at all.
    if (!writeDeletionMarker(capturedUserId)) {
      return Promise.resolve(false);
    }

    const gen = ++deletionGenRef.current;
    setDeletionInFlight({ userId: capturedUserId, gen });

    const op: DeletionOp = {
      userId: capturedUserId,
      settled: false,
      active: true,
      promise: Promise.resolve(false)
    };
    op.promise = (async (): Promise<boolean> => {
      try {
        const client = await getSupabase();
        if (!op.active) {
          // Logout / user switch invalidated this operation before it ran.
          return false;
        }
        if (!client) {
          // Supabase unconfigured: nothing remote to delete; complete the
          // intent locally.
          dataGenRef.current += 1;
          attemptStore.clear();
          setProgressAttempts([]);
          removeDeletionMarker(capturedUserId);
          setLastDeletionResult({ userId: capturedUserId, status: "deleted" });
          return true;
        }
        return await runDeleteCleanup(client, capturedUserId, () => op.active, true);
      } catch {
        if (op.active) {
          // Unexpected failure: leave local untouched, drop the marker (no
          // confirmed cleanup), surface the error.
          removeDeletionMarker(capturedUserId);
          setLastDeletionResult({ userId: capturedUserId, status: "error" });
        }
        return false;
      } finally {
        op.settled = true;
        setDeletionInFlight((prev) => (prev && prev.gen === gen ? null : prev));
      }
    })();
    deletionOpRef.current = op;
    return op.promise;
  }, [runDeleteCleanup]);

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

      // Generation anchor: a delete that clears the store bumps dataGenRef;
      // a sync that parked on an await while that happened must not commit
      // its pre-delete history (resurrection guard).
      let gen = dataGenRef.current;

      // Pending-deletion resume (#692): a previous delete for this user was
      // requested but never confirmed. Complete it (remote delete + local
      // clear) BEFORE any normal fetch/merge, and only continue to sync once
      // the marker is gone.
      if (readDeletionMarker(userId)) {
        // Reuse an in-flight user-initiated delete for this user if one exists
        // (never run two deletes in parallel).
        const inFlight = deletionOpRef.current;
        if (inFlight && inFlight.userId === userId && !inFlight.settled) {
          await inFlight.promise;
          if (!active) {
            return;
          }
        }
        if (readDeletionMarker(userId)) {
          const resumeGen = ++deletionGenRef.current;
          setDeletionInFlight({ userId, gen: resumeGen });
          try {
            let done = false;
            if (client) {
              done = await runDeleteCleanup(client, userId, () => active, false);
            } else {
              dataGenRef.current += 1;
              attemptStore.clear();
              setProgressAttempts([]);
              removeDeletionMarker(userId);
              setLastDeletionResult({ userId, status: "deleted" });
              done = true;
            }
            if (!active) {
              return;
            }
            if (!done) {
              // Marker stays: the local persistent copy may have survived, so
              // do NOT fetch/merge/push stale local data back to remote.
              return;
            }
          } finally {
            setDeletionInFlight((prev) =>
              prev && prev.gen === resumeGen ? null : prev
            );
          }
          // Re-anchor after OUR OWN resume clear so the sync below is not
          // (wrongly) treated as stale.
          gen = dataGenRef.current;
        }
      }

      // fetch + push run BEFORE any local mutation, so a throw from either
      // (offline, RLS, push conflict, ...) lands in the catch with the local
      // store completely untouched.
      const remote = await fetchRemoteAttempts(client, userId);
      if (!active) {
        return;
      }
      // A delete happened while we were fetching: never merge/push the stale
      // pre-delete history on top of the cleared store.
      if (dataGenRef.current !== gen || readDeletionMarker(userId)) {
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
      if (dataGenRef.current !== gen || readDeletionMarker(userId)) {
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
      // A user-initiated delete for this user is abandoned on logout/switch:
      // it must not clear the next user's store or change their status.
      const op = deletionOpRef.current;
      if (op && op.userId === userId && !op.settled) {
        op.active = false;
      }
      // Drop the "deleting" status entry for this user so a later re-login
      // of the same user doesn't read a stale in-flight flag as "deleting".
      setDeletionInFlight((prev) => (prev && prev.userId === userId ? null : prev));
    };
  }, [userId, runDeleteCleanup]);

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
    // While a pending-delete marker exists for this user, never push live
    // attempts back to remote (#692): the cleanup must leave history empty.
    if (id && !readDeletionMarker(id)) {
      void getSupabase()
        .then((client) => pushAttempts(client, id, [attempt]))
        .catch(() => {
          /* best-effort; safe in local store */
        });
    }
  }, []);

  return {
    progressAttempts,
    recordAttempt,
    syncStatus,
    historyDeletionStatus,
    deleteSyncedPracticeHistory
  };
}
