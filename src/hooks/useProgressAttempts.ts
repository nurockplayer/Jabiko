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

type DeletionOwnerState = {
  userId: string | null;
  generation: number;
  active: boolean;
};

type DeletionOperation = {
  userId: string;
  ownerState: DeletionOwnerState;
  ownerGeneration: number;
  token: symbol;
  fresh: boolean;
  predecessor: DeletionOperation | null;
  promise: Promise<boolean>;
  settled: boolean;
};

// The marker survives reloads; these module records extend its protection
// across hook remounts in the same page lifetime. The operation map also
// serializes an already-sent DELETE against a resumed DELETE for that user.
const pendingDeletionIntents = new Set<string>();
const deletionGateOwners = new Map<string, symbol>();
const deletionOperations = new Map<string, DeletionOperation>();
const pendingUploadsByUser = new Map<string, Set<Promise<void>>>();

function markerExists(userId: string): boolean {
  try {
    return readDeletionMarker(userId);
  } catch {
    return false;
  }
}

function hasPendingDeletionIntent(userId: string): boolean {
  return pendingDeletionIntents.has(userId) || markerExists(userId);
}

function deletionOwnerIsLive(
  userId: string,
  ownerState: DeletionOwnerState,
  ownerGeneration: number
): boolean {
  return (
    ownerState.active &&
    ownerState.userId === userId &&
    ownerState.generation === ownerGeneration
  );
}

function deletionOperationIsCurrent(operation: DeletionOperation): boolean {
  return (
    deletionOperations.get(operation.userId) === operation &&
    deletionGateOwners.get(operation.userId) === operation.token &&
    deletionOwnerIsLive(
      operation.userId,
      operation.ownerState,
      operation.ownerGeneration
    )
  );
}

function releaseDeletionIntent(operation: DeletionOperation): boolean {
  if (!deletionOperationIsCurrent(operation)) {
    return false;
  }
  pendingDeletionIntents.delete(operation.userId);
  deletionGateOwners.delete(operation.userId);
  return true;
}

function trackUpload(userId: string, work: () => Promise<void>): Promise<void> {
  let tasks = pendingUploadsByUser.get(userId);
  if (!tasks) {
    tasks = new Set();
    pendingUploadsByUser.set(userId, tasks);
  }

  const task = Promise.resolve().then(work);
  const tracked = task
    .then(
      () => undefined,
      () => undefined
    )
    .finally(() => {
      const current = pendingUploadsByUser.get(userId);
      current?.delete(tracked);
      if (current?.size === 0) {
        pendingUploadsByUser.delete(userId);
      }
    });
  tasks.add(tracked);
  return task;
}

async function drainUploads(userId: string): Promise<void> {
  const tasks = [...(pendingUploadsByUser.get(userId) ?? [])];
  await Promise.allSettled(tasks);
}

// Status of cross-device sync (Phase 3, Part of #151):
//   idle    -- no user / anon path (or before any login this session)
//   syncing -- a login merge is in flight
//   synced  -- the last login merge completed (writes are best-effort after)
//   error   -- the last login merge failed; local was left untouched
type SyncStatus = "idle" | "syncing" | "synced" | "error";

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

  // Ownership survives StrictMode effect replay but expires on a real
  // account transition or unmount. Generations prevent A→B→A from reviving
  // an operation created for the first A lifetime.
  const deletionOwnerRef = useRef<DeletionOwnerState>({
    userId: null,
    generation: 0,
    active: false
  });

  // Deletion protocol bookkeeping:
  //   deletionGenRef   -- monotonic gen so a stale op's finally can't clear a
  //                       newer op's "deleting" status for the same user
  //   dataGenRef       -- bumped whenever a delete clears the store; a login
  //                       sync anchored to an older gen must not commit its
  //                       stale pre-delete merge (prevents resurrection)
  const deletionGenRef = useRef(0);
  const dataGenRef = useRef(0);

  // All deletion entry points share this owner-scoped operation. A new hook
  // lifetime captures an inactive predecessor before replacing the map entry,
  // then waits for that already-sent DELETE to settle before retrying it.
  const startDeletionOperation = useCallback(
    (
      capturedUserId: string,
      knownClient?: { client: SupabaseClient | null }
    ): Promise<boolean> => {
      const ownerState = deletionOwnerRef.current;
      const ownerGeneration = ownerState.generation;
      const priorIntent = hasPendingDeletionIntent(capturedUserId);
      const existing = deletionOperations.get(capturedUserId);

      if (
        existing &&
        !existing.settled &&
        existing.ownerState === ownerState &&
        existing.ownerGeneration === ownerGeneration &&
        deletionOperationIsCurrent(existing)
      ) {
        return existing.promise;
      }

      // Capture the one predecessor before installing a replacement. This
      // creates a same-user tail without making an operation wait on itself.
      const predecessor = existing && !existing.settled ? existing : null;
      let markerWritten = false;
      try {
        markerWritten = writeDeletionMarker(capturedUserId);
      } catch {
        markerWritten = false;
      }
      if (!markerWritten) {
        return Promise.resolve(false);
      }

      const token = Symbol("history-delete-owner");
      pendingDeletionIntents.add(capturedUserId);
      deletionGateOwners.set(capturedUserId, token);
      const operation: DeletionOperation = {
        userId: capturedUserId,
        ownerState,
        ownerGeneration,
        token,
        fresh: !priorIntent,
        predecessor,
        promise: Promise.resolve(false),
        settled: false
      };
      deletionOperations.set(capturedUserId, operation);
      const gen = ++deletionGenRef.current;
      setDeletionInFlight({ userId: capturedUserId, gen });

      const ownerIsLive = () =>
        deletionOwnerIsLive(capturedUserId, ownerState, ownerGeneration);
      const isCurrent = () => deletionOperationIsCurrent(operation);
      const setError = () => {
        if (isCurrent()) {
          setLastDeletionResult({ userId: capturedUserId, status: "error" });
        }
      };
      const removeFreshIntent = () => {
        let removed = false;
        try {
          removed = removeDeletionMarker(capturedUserId);
        } catch {
          removed = false;
        }
        if (removed) {
          releaseDeletionIntent(operation);
        }
      };

      operation.promise = (async (): Promise<boolean> => {
        try {
          if (predecessor) {
            // The prior operation may have been invalidated by unmount or an
            // account switch. Its result is irrelevant; its network tail is
            // not, because DELETE must remain ordered after it.
            try {
              await predecessor.promise;
            } catch {
              // The operation wrapper is fail-closed; still wait for settle.
            }
          }
          if (!isCurrent()) {
            return false;
          }

          const client = knownClient ? knownClient.client : await getSupabase();
          if (!isCurrent()) {
            return false;
          }

          // The intent gate is already installed, so this snapshot contains
          // every upload that could still reach the remote before the gate.
          await drainUploads(capturedUserId);
          if (!isCurrent()) {
            return false;
          }

          if (client) {
            const remote = await deleteRemoteAttempts(client, capturedUserId);
            if (!isCurrent()) {
              return false;
            }
            if (!remote.ok) {
              // Preserve the accepted fresh-request failure behavior. A retry
              // keeps the old marker/intent so stale local data stays gated.
              setError();
              if (operation.fresh) {
                removeFreshIntent();
              }
              return false;
            }
          }

          // A successful remote delete (or no-client local cleanup) is not a
          // success until persistent attempts removal and marker removal are
          // each independently confirmed.
          dataGenRef.current += 1;
          const attemptsCleared = attemptStore.clear();
          setProgressAttempts([]);
          if (!isCurrent()) {
            return false;
          }
          if (!attemptsCleared) {
            setError();
            return false;
          }

          let markerRemoved = false;
          try {
            markerRemoved = removeDeletionMarker(capturedUserId);
          } catch {
            markerRemoved = false;
          }
          if (!markerRemoved) {
            setError();
            return false;
          }
          if (!releaseDeletionIntent(operation)) {
            return false;
          }
          setLastDeletionResult({ userId: capturedUserId, status: "deleted" });
          return true;
        } catch {
          if (!isCurrent()) {
            return false;
          }
          // A thrown operation is ambiguous: keep the durable intent so a
          // later login can safely retry. Only an explicit fresh remote
          // rejection above is allowed to discard the new marker.
          setError();
          return false;
        } finally {
          operation.settled = true;
          if (deletionOperations.get(capturedUserId) === operation) {
            deletionOperations.delete(capturedUserId);
          }
          if (ownerIsLive()) {
            setDeletionInFlight((previous) =>
              previous && previous.gen === gen ? null : previous
            );
          }
        }
      })();
      return operation.promise;
    },
    []
  );

  // Deletes the CURRENT user's synced practice history, remote-first. Returns
  // true only when remote deletion (if configured), persistent local removal,
  // and marker removal all complete. Failures stay visible as false/error.
  const deleteSyncedPracticeHistory = useCallback((): Promise<boolean> => {
    const capturedUserId = userIdRef.current;
    if (!capturedUserId) {
      return Promise.resolve(false);
    }
    return startDeletionOperation(capturedUserId);
  }, [startDeletionOperation]);

  // Login sync: runs when the user id transitions to a non-null value.
  // NOTE: no synchronous setState in the effect body (react-hooks v7
  // `set-state-in-effect`). "syncing" is DERIVED while the merge is in flight;
  // only the async terminal outcome writes state, and only while this
  // generation is still active.
  useEffect(() => {
    const ownerState = deletionOwnerRef.current;
    if (ownerState.userId !== userId) {
      // The old user's operation becomes permanently stale. Incrementing the
      // generation means a later A→B→A transition cannot revive that owner.
      ownerState.active = false;
      ownerState.userId = userId;
      ownerState.generation += 1;
    }
    ownerState.active = true;
    const ownerGeneration = ownerState.generation;
    const ownerIsLive = () =>
      deletionOwnerIsLive(userId ?? "", ownerState, ownerGeneration);

    if (!userId) {
      // Logout / anon: behaviour exactly as before -- local untouched.
      // No setState("idle") needed: derived syncStatus is naturally idle.
      return () => {
        ownerState.active = false;
      };
    }

    let active = true;
    const isActive = () => active && ownerIsLive();
    // A persisted marker is already admitted intent. Mirror it in module
    // memory before the first SDK await so read failures later cannot open
    // an upload path in this page lifetime.
    if (hasPendingDeletionIntent(userId)) {
      pendingDeletionIntents.add(userId);
    }

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
      if (!isActive()) {
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
      if (hasPendingDeletionIntent(userId)) {
        const done = await startDeletionOperation(userId, { client });
        if (!isActive()) {
          return;
        }
        if (!done || hasPendingDeletionIntent(userId)) {
          // The marker and in-memory intent stay in force, so stale local
          // attempts cannot be fetched, merged, or pushed back to remote.
          return;
        }
        // Re-anchor after our own resume clear so this sync is not treated as
        // stale by the deletion generation guard.
        gen = dataGenRef.current;
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
      if (dataGenRef.current !== gen || hasPendingDeletionIntent(userId)) {
        return;
      }
      const { toUpload } = planLoginSync(attemptStore.list(), remote);
      // Register only the upload task (not this whole login/resume flow).
      // Deletion can drain this task without waiting on its own caller. Keep
      // the existing empty-delta push contract used by the sync path.
      await trackUpload(userId, async () => {
        if (
          !isActive() ||
          dataGenRef.current !== gen ||
          hasPendingDeletionIntent(userId)
        ) {
          return;
        }
        await pushAttempts(client, userId, toUpload);
      });
      // Only commit once the effect is still current: a stale run (unmount,
      // logout, or A->B user switch) bails here BEFORE touching local, so it
      // can never write a previous user's remote history into the now-anon
      // or new-user store.
      if (!isActive()) {
        return;
      }
      if (dataGenRef.current !== gen || hasPendingDeletionIntent(userId)) {
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
      if (isActive()) {
        setLastSyncResult({ userId, status: "error" });
      }
    });

    return () => {
      active = false;
      ownerState.active = false;
      // Drop the "deleting" status entry for this user so a later re-login
      // of the same user doesn't read a stale in-flight flag as "deleting".
      setDeletionInFlight((prev) => (prev && prev.userId === userId ? null : prev));
    };
  }, [userId, startDeletionOperation]);

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
    const ownerState = deletionOwnerRef.current;
    const ownerGeneration = ownerState.generation;
    if (
      id &&
      deletionOwnerIsLive(id, ownerState, ownerGeneration) &&
      !hasPendingDeletionIntent(id)
    ) {
      void trackUpload(id, async () => {
        if (
          !deletionOwnerIsLive(id, ownerState, ownerGeneration) ||
          hasPendingDeletionIntent(id)
        ) {
          return;
        }
        const client = await getSupabase();
        if (
          !deletionOwnerIsLive(id, ownerState, ownerGeneration) ||
          hasPendingDeletionIntent(id)
        ) {
          return;
        }
        await pushAttempts(client, id, [attempt]);
      }).catch(() => {
        // Live writes are best-effort; local history remains the retry source.
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
