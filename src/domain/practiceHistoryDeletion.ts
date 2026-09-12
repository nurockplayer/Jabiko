import { readStored, writeStored } from "./safeStorage";

// Pending deletion marker for a user's synced practice history (#692).
//
// When the learner deletes their synced history we follow a remote-first
// protocol: delete the Supabase rows, then clear the local persistent store,
// then (only if both landed) remove this marker. The marker is written up
// front so that a crash, tab close or offline failure mid-protocol leaves a
// durable record that the cleanup was *requested* but not yet *confirmed*.
// On the next login (or a later attempt to delete), the hook must resume the
// remote delete + local clear BEFORE any normal fetch/merge, and must not
// re-push local attempts to remote while the marker is present.
//
// Deliberately minimal: the marker is a boolean flag keyed per user. It never
// holds attempt payload, email or token. Written through the crash-safe
// safeStorage abstraction (blocked storage reads back as "no marker" and a
// failed write reports failure to the caller instead of throwing).

const DELETION_MARKER_PREFIX = "jabiko.attempt-history-delete-pending";

/** Fixed per-user storage key for the pending-deletion marker. */
export function deletionMarkerKey(userId: string): string {
  return `${DELETION_MARKER_PREFIX}:${userId}`;
}

/** True when this user's delete is still pending completion. */
export function readDeletionMarker(userId: string): boolean {
  return readStored(deletionMarkerKey(userId)) !== null;
}

/** Record that a delete for this user is pending. Returns success. */
export function writeDeletionMarker(userId: string): boolean {
  try {
    writeStored(deletionMarkerKey(userId), "1");
  } catch {
    return false;
  }
  return readDeletionMarker(userId);
}

/** Clear the pending marker once cleanup is confirmed. Returns success. */
export function removeDeletionMarker(userId: string): boolean {
  try {
    if (typeof window === "undefined") {
      return true;
    }
    window.localStorage.removeItem(deletionMarkerKey(userId));
  } catch {
    return false;
  }
  return !readDeletionMarker(userId);
}
