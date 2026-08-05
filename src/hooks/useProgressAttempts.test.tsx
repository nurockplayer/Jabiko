import { StrictMode } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Attempt } from "../domain/types";

// The hook talks to Supabase only through these two seams, both mocked so
// the test stays offline and the SDK never loads. getSupabase returns a
// sentinel "client" object that the mocked remote fns ignore.
const fakeClient = {} as unknown as SupabaseClient;
const getSupabase = vi.fn<() => Promise<SupabaseClient | null>>();
const fetchRemoteAttempts = vi.fn<(client: SupabaseClient | null, userId: string) => Promise<Attempt[]>>();
const pushAttempts =
  vi.fn<(client: SupabaseClient | null, userId: string, attempts: Attempt[]) => Promise<void>>();
const deleteRemoteAttempts = vi.fn<
  (client: SupabaseClient, userId: string) => Promise<{ ok: true } | { ok: false; message: string }>
>();
const readDeletionMarker = vi.fn<(userId: string) => boolean>();
const writeDeletionMarker = vi.fn<(userId: string) => boolean>();
const removeDeletionMarker = vi.fn<(userId: string) => boolean>();

vi.mock("../lib/supabase", () => ({
  getSupabase: () => getSupabase(),
  isSupabaseConfigured: true
}));

vi.mock("../domain/attemptRemote", async () => {
  // Keep the real planLoginSync (pure) -- only the IO is faked.
  const real = await vi.importActual<typeof import("../domain/attemptRemote")>(
    "../domain/attemptRemote"
  );
  return {
    ...real,
    fetchRemoteAttempts: (client: SupabaseClient | null, userId: string) =>
      fetchRemoteAttempts(client, userId),
    pushAttempts: (client: SupabaseClient | null, userId: string, attempts: Attempt[]) =>
      pushAttempts(client, userId, attempts),
    deleteRemoteAttempts: (client: SupabaseClient, userId: string) =>
      deleteRemoteAttempts(client, userId)
  };
});

vi.mock("../domain/practiceHistoryDeletion", () => ({
  readDeletionMarker: (userId: string) => readDeletionMarker(userId),
  writeDeletionMarker: (userId: string) => writeDeletionMarker(userId),
  removeDeletionMarker: (userId: string) => removeDeletionMarker(userId)
}));

// Imported AFTER the mocks are registered. The hook owns a module-singleton
// attemptStore backed by window.localStorage (jsdom), so each test clears it.
import { useProgressAttempts } from "./useProgressAttempts";
import { attemptKey } from "../domain/attemptSync";

const ATTEMPTS_KEY = "jabiko:attempts";

// The module-singleton attemptStore persists into window.localStorage (jsdom),
// so we observe whether the store was mutated by reading the raw persisted set
// (rather than spying on a private singleton). `null` -> never written.
function readStore(): Attempt[] | null {
  const raw = window.localStorage.getItem(ATTEMPTS_KEY);
  return raw ? (JSON.parse(raw) as Attempt[]) : null;
}

// A manually-resolved promise so a test can unmount / rerender with a
// different user BEFORE the sync's awaits settle.
function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void; reject: (err: unknown) => void } {
  let resolve!: (value: T) => void;
  let reject!: (err: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function makeAttempt(overrides: Partial<Attempt> = {}): Attempt {
  return {
    vocabularyId: "kaku",
    targetForm: "te",
    prompt: "書く",
    expectedAnswers: ["書いて"],
    submittedAnswer: "書いて",
    isCorrect: true,
    timestamp: 1000,
    responseTimeMs: 500,
    ...overrides
  };
}

function makeUser(id: string): User {
  return { id } as unknown as User;
}

beforeEach(() => {
  window.localStorage.clear();
  getSupabase.mockResolvedValue(fakeClient);
  fetchRemoteAttempts.mockResolvedValue([]);
  pushAttempts.mockResolvedValue(undefined);
  deleteRemoteAttempts.mockResolvedValue({ ok: true });
  // Default: no pending-deletion marker.
  readDeletionMarker.mockReturnValue(false);
  writeDeletionMarker.mockReturnValue(true);
  removeDeletionMarker.mockReturnValue(true);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("useProgressAttempts -- anon (no user)", () => {
  it("behaves as before: idle status, local-only, no remote calls", async () => {
    const { result } = renderHook(() => useProgressAttempts(null));

    expect(result.current.syncStatus).toBe("idle");

    const attempt = makeAttempt();
    act(() => {
      result.current.recordAttempt(attempt);
    });

    expect(result.current.progressAttempts).toEqual([attempt]);
    // Nothing reached the network seams.
    expect(getSupabase).not.toHaveBeenCalled();
    expect(fetchRemoteAttempts).not.toHaveBeenCalled();
    expect(pushAttempts).not.toHaveBeenCalled();
  });

  it("keeps recordAttempt identity stable across renders", () => {
    const { result, rerender } = renderHook(() => useProgressAttempts(null));
    const first = result.current.recordAttempt;
    rerender();
    expect(result.current.recordAttempt).toBe(first);
  });

  it("anon -> logout-idle is DERIVED: no sync setState in the login effect, no supabase call", async () => {
    const { result, rerender } = renderHook(
      ({ user }: { user: User | null }) => useProgressAttempts(user),
      { initialProps: { user: null as User | null } }
    );

    expect(result.current.syncStatus).toBe("idle");
    expect(getSupabase).not.toHaveBeenCalled();

    // A user who logs in and back out (logout) leaves syncStatus DERIVED idle
    // -- no effect-time setState("idle") required, and the local store survives.
    rerender({ user: makeUser("user-1") });
    await waitFor(() => expect(result.current.syncStatus).toBe("synced"));
    const storeAtLogin = readStore();

    rerender({ user: null });
    expect(result.current.syncStatus).toBe("idle");
    expect(readStore()).toEqual(storeAtLogin);
  });

  it("already-logged-in first render exposes syncing immediately (no effect-time setState)", async () => {
    // Login is already the INITIAL render (the effect runs AFTER the first
    // paint), so the very first exposed syncStatus is the derived "syncing" --
    // the hook must not synchronously setState("syncing") inside the effect.
    const { result } = renderHook(() => useProgressAttempts(makeUser("user-1")));
    expect(result.current.syncStatus).toBe("syncing");
    await waitFor(() => expect(result.current.syncStatus).toBe("synced"));
  });
});

describe("useProgressAttempts -- login sync", () => {
  it("merges remote into local, replaces local with merged, uploads only local-only, ends synced", async () => {
    const localOnly = makeAttempt({ timestamp: 2, submittedAnswer: "local" });
    const remoteOnly = makeAttempt({ timestamp: 3, submittedAnswer: "remote" });

    // Seed local store before login by recording while anon.
    const { result, rerender } = renderHook(
      ({ user }: { user: User | null }) => useProgressAttempts(user),
      { initialProps: { user: null as User | null } }
    );
    act(() => {
      result.current.recordAttempt(localOnly);
    });

    fetchRemoteAttempts.mockResolvedValue([remoteOnly]);

    // Transition to a logged-in user.
    rerender({ user: makeUser("user-1") });

    await waitFor(() => expect(result.current.syncStatus).toBe("synced"));

    // Local state now holds the merged union (sorted by timestamp).
    expect(result.current.progressAttempts).toEqual([localOnly, remoteOnly]);
    expect(fetchRemoteAttempts).toHaveBeenCalledWith(fakeClient, "user-1");
    // Only the local-only attempt is uploaded (remoteOnly already remote).
    expect(pushAttempts).toHaveBeenCalledWith(fakeClient, "user-1", [localOnly]);
  });

  it("on sync failure sets error and leaves local untouched", async () => {
    const localOnly = makeAttempt({ timestamp: 5, submittedAnswer: "local" });

    const { result, rerender } = renderHook(
      ({ user }: { user: User | null }) => useProgressAttempts(user),
      { initialProps: { user: null as User | null } }
    );
    act(() => {
      result.current.recordAttempt(localOnly);
    });

    fetchRemoteAttempts.mockRejectedValue(new Error("offline"));

    rerender({ user: makeUser("user-1") });

    await waitFor(() => expect(result.current.syncStatus).toBe("error"));
    // Local untouched -- not cleared, not overwritten.
    expect(result.current.progressAttempts).toEqual([localOnly]);
  });

  it("recordAttempt while logged in fire-and-forget pushes that single attempt", async () => {
    const { result } = renderHook(() => useProgressAttempts(makeUser("user-1")));
    await waitFor(() => expect(result.current.syncStatus).toBe("synced"));
    pushAttempts.mockClear();

    const attempt = makeAttempt({ timestamp: 9, submittedAnswer: "new" });
    act(() => {
      result.current.recordAttempt(attempt);
    });

    expect(result.current.progressAttempts).toContainEqual(attempt);
    await waitFor(() =>
      expect(pushAttempts).toHaveBeenCalledWith(fakeClient, "user-1", [attempt])
    );
  });

  it("uses attemptKey-based identity (no duplicate upload on re-login)", async () => {
    const a = makeAttempt({ timestamp: 1 });
    const { result, rerender } = renderHook(
      ({ user }: { user: User | null }) => useProgressAttempts(user),
      { initialProps: { user: null as User | null } }
    );
    act(() => {
      result.current.recordAttempt(a);
    });

    // Remote already has `a` -> nothing to upload.
    fetchRemoteAttempts.mockResolvedValue([a]);
    rerender({ user: makeUser("user-1") });

    await waitFor(() => expect(result.current.syncStatus).toBe("synced"));
    expect(pushAttempts).toHaveBeenCalledWith(fakeClient, "user-1", []);
    // sanity: keys match
    expect(attemptKey(result.current.progressAttempts[0])).toBe(attemptKey(a));
  });
});

describe("useProgressAttempts -- login sync commit safety (codex review)", () => {
  // BUG 1: a stale async run (unmount / logout / user switch) must NOT mutate
  // the local store. Using a deferred fetch we unmount BEFORE it resolves,
  // then resolve -- the store must never be replaced and no state update
  // must run after unmount.
  it("unmount before sync resolves -> store NOT replaced, no post-unmount state write", async () => {
    const localOnly = makeAttempt({ timestamp: 2, submittedAnswer: "local" });
    const remoteOnly = makeAttempt({ timestamp: 3, submittedAnswer: "remote" });

    const fetchGate = deferred<Attempt[]>();
    fetchRemoteAttempts.mockReturnValue(fetchGate.promise);

    const { result, rerender, unmount } = renderHook(
      ({ user }: { user: User | null }) => useProgressAttempts(user),
      { initialProps: { user: null as User | null } }
    );
    act(() => {
      result.current.recordAttempt(localOnly);
    });
    // Local store now holds exactly the local attempt.
    expect(readStore()).toEqual([localOnly]);

    // Begin login sync; it parks on the deferred fetch.
    rerender({ user: makeUser("user-1") });
    await waitFor(() => expect(fetchRemoteAttempts).toHaveBeenCalled());

    // Unmount while the sync is still in flight, THEN let the fetch resolve.
    unmount();
    await act(async () => {
      fetchGate.resolve([remoteOnly]);
      await fetchGate.promise;
    });

    // The stale run must not have written the merged set into the store.
    expect(readStore()).toEqual([localOnly]);
    // The merged remote attempt must not have leaked into the (unmounted) store.
    expect(readStore()).not.toContainEqual(remoteOnly);
  });

  // BUG 1 variant: user A -> B switch (and logout A -> null) before A's sync
  // resolves. A's remote/merged must never be written into B's (or the anon)
  // local store.
  it("user switch (A->B) before A's sync resolves -> A's merged NOT written", async () => {
    const aRemote = makeAttempt({ timestamp: 4, submittedAnswer: "A-remote" });

    const aFetch = deferred<Attempt[]>();
    const bFetch = deferred<Attempt[]>();
    fetchRemoteAttempts
      .mockReturnValueOnce(aFetch.promise) // user A
      .mockReturnValueOnce(bFetch.promise); // user B

    const { result, rerender } = renderHook(
      ({ user }: { user: User | null }) => useProgressAttempts(user),
      { initialProps: { user: makeUser("user-A") as User | null } }
    );
    await waitFor(() => expect(fetchRemoteAttempts).toHaveBeenCalledWith(fakeClient, "user-A"));

    // Switch to user B while A's fetch is still parked.
    rerender({ user: makeUser("user-B") });
    await waitFor(() => expect(fetchRemoteAttempts).toHaveBeenCalledWith(fakeClient, "user-B"));

    // Now resolve A's (stale) fetch first, then B's.
    await act(async () => {
      aFetch.resolve([aRemote]);
      await aFetch.promise;
    });
    await act(async () => {
      bFetch.resolve([]);
      await bFetch.promise;
    });

    await waitFor(() => expect(result.current.syncStatus).toBe("synced"));
    // A's remote attempt must NOT have been written by the stale A run.
    expect(readStore() ?? []).not.toContainEqual(aRemote);
    expect(result.current.progressAttempts).not.toContainEqual(aRemote);
  });

  // BUG 3 (codex re-review): a stale run must NOT push to the OLD user's
  // remote either. If A's sync is parked on the fetch await and the user logs
  // out (-> null) before it resolves, A's stale continuation must bail right
  // after the fetch -- BEFORE reading the (now-anon) local store and uploading
  // it to user A's remote account (a cross-account data leak).
  it("logout before A's fetch resolves -> stale A run does NOT push to A's remote", async () => {
    const localOnly = makeAttempt({ timestamp: 13, submittedAnswer: "local" });
    const aRemote = makeAttempt({ timestamp: 14, submittedAnswer: "A-remote" });

    const aFetch = deferred<Attempt[]>();
    fetchRemoteAttempts.mockReturnValue(aFetch.promise);

    const { result, rerender } = renderHook(
      ({ user }: { user: User | null }) => useProgressAttempts(user),
      { initialProps: { user: null as User | null } }
    );
    // Seed local while anon.
    act(() => {
      result.current.recordAttempt(localOnly);
    });

    // Begin user A's login sync; it parks on the deferred fetch.
    rerender({ user: makeUser("user-A") });
    await waitFor(() => expect(fetchRemoteAttempts).toHaveBeenCalledWith(fakeClient, "user-A"));

    // Log out (-> null) while A's fetch is still parked, THEN resolve it.
    rerender({ user: null });
    await act(async () => {
      aFetch.resolve([aRemote]);
      await aFetch.promise;
    });

    // The stale A run must have bailed after the fetch -- no upload to A.
    expect(pushAttempts).not.toHaveBeenCalled();
    // And of course the local store is untouched by the stale run.
    expect(readStore()).toEqual([localOnly]);
    expect(readStore()).not.toContainEqual(aRemote);
  });

  // BUG 2: push failure (fetch ok) must leave local untouched. The old code
  // replaced local BEFORE the push, so a push reject lost the "untouched"
  // guarantee.
  it("pushAttempts rejects (fetch ok) -> error AND local untouched", async () => {
    const localOnly = makeAttempt({ timestamp: 6, submittedAnswer: "local" });
    const remoteOnly = makeAttempt({ timestamp: 7, submittedAnswer: "remote" });

    const { result, rerender } = renderHook(
      ({ user }: { user: User | null }) => useProgressAttempts(user),
      { initialProps: { user: null as User | null } }
    );
    act(() => {
      result.current.recordAttempt(localOnly);
    });

    fetchRemoteAttempts.mockResolvedValue([remoteOnly]);
    pushAttempts.mockRejectedValue(new Error("push failed"));

    rerender({ user: makeUser("user-1") });

    await waitFor(() => expect(result.current.syncStatus).toBe("error"));
    // Local untouched -- the merged set was NOT committed because push failed.
    expect(readStore()).toEqual([localOnly]);
    expect(result.current.progressAttempts).toEqual([localOnly]);
    // No data loss: the local-only attempt is still present.
    expect(result.current.progressAttempts).toContainEqual(localOnly);
  });

  // Happy path through the fixed ordering: commit only after fetch + push
  // both succeed and the effect is still active.
  it("happy path -> store replaced with merged, state merged, synced, push got delta", async () => {
    const localOnly = makeAttempt({ timestamp: 8, submittedAnswer: "local" });
    const remoteOnly = makeAttempt({ timestamp: 9, submittedAnswer: "remote" });

    const { result, rerender } = renderHook(
      ({ user }: { user: User | null }) => useProgressAttempts(user),
      { initialProps: { user: null as User | null } }
    );
    act(() => {
      result.current.recordAttempt(localOnly);
    });

    fetchRemoteAttempts.mockResolvedValue([remoteOnly]);

    rerender({ user: makeUser("user-1") });

    await waitFor(() => expect(result.current.syncStatus).toBe("synced"));
    const merged = [localOnly, remoteOnly];
    expect(readStore()).toEqual(merged);
    expect(result.current.progressAttempts).toEqual(merged);
    // Push received exactly the local-only delta.
    expect(pushAttempts).toHaveBeenCalledWith(fakeClient, "user-1", [localOnly]);
  });

  // RE-READ guard: an attempt recorded DURING the awaits must survive the
  // commit. The old code planned the merge from a snapshot taken before the
  // awaits, so a concurrently recorded attempt would be clobbered by replace.
  it("attempt recorded during the awaits -> final merged INCLUDES it (no clobber)", async () => {
    const localOnly = makeAttempt({ timestamp: 10, submittedAnswer: "local" });
    const remoteOnly = makeAttempt({ timestamp: 11, submittedAnswer: "remote" });
    const recordedDuringSync = makeAttempt({ timestamp: 12, submittedAnswer: "mid-sync" });

    const fetchGate = deferred<Attempt[]>();
    fetchRemoteAttempts.mockReturnValue(fetchGate.promise);

    const { result, rerender } = renderHook(
      ({ user }: { user: User | null }) => useProgressAttempts(user),
      { initialProps: { user: null as User | null } }
    );
    act(() => {
      result.current.recordAttempt(localOnly);
    });

    rerender({ user: makeUser("user-1") });
    await waitFor(() => expect(fetchRemoteAttempts).toHaveBeenCalled());

    // Record a new attempt WHILE the sync is parked on the fetch await.
    act(() => {
      result.current.recordAttempt(recordedDuringSync);
    });

    // Now resolve the fetch and let the commit run.
    await act(async () => {
      fetchGate.resolve([remoteOnly]);
      await fetchGate.promise;
    });

    await waitFor(() => expect(result.current.syncStatus).toBe("synced"));
    // The concurrently recorded attempt must NOT have been clobbered.
    expect(readStore()).toContainEqual(recordedDuringSync);
    expect(result.current.progressAttempts).toContainEqual(recordedDuringSync);
    // All three records survive.
    expect(result.current.progressAttempts).toEqual([
      localOnly,
      remoteOnly,
      recordedDuringSync
    ]);
  });

  // Derived-status semantics: while A's sync is still in flight, B must read
  // "syncing" (A's terminal result must not leak into B's status), and once B
  // completes, A's late terminal write must stay inert.
  it("A->B switch mid-sync: B reads syncing until its own merge completes", async () => {
    const aFetch = deferred<Attempt[]>();
    const bFetch = deferred<Attempt[]>();
    fetchRemoteAttempts
      .mockReturnValueOnce(aFetch.promise) // user A
      .mockReturnValueOnce(bFetch.promise); // user B

    const { result, rerender } = renderHook(
      ({ user }: { user: User | null }) => useProgressAttempts(user),
      { initialProps: { user: makeUser("user-A") as User | null } }
    );
    await waitFor(() => expect(fetchRemoteAttempts).toHaveBeenCalledWith(fakeClient, "user-A"));

    // Switch to B while A is still parked on its fetch.
    rerender({ user: makeUser("user-B") });
    expect(result.current.syncStatus).toBe("syncing");
    await waitFor(() => expect(fetchRemoteAttempts).toHaveBeenCalledWith(fakeClient, "user-B"));
    // Still syncing -- B has not completed yet.
    expect(result.current.syncStatus).toBe("syncing");

    // Resolve A's stale fetch. A's terminal result must NOT surface on B.
    await act(async () => {
      aFetch.resolve([makeAttempt({ timestamp: 30, submittedAnswer: "A-late" })]);
      await aFetch.promise;
    });
    expect(result.current.syncStatus).toBe("syncing");

    // B completes -> synced.
    await act(async () => {
      bFetch.resolve([]);
      await bFetch.promise;
    });
    await waitFor(() => expect(result.current.syncStatus).toBe("synced"));
  });

  // Derived-status semantics: A's late success must not flip B's status, and
  // the (stale, resolved) A generation must not mutate the store.
  it("A late success after B completed -> B stays synced, store unchanged", async () => {
    const aRemote = makeAttempt({ timestamp: 40, submittedAnswer: "A-remote" });
    const bRemote = makeAttempt({ timestamp: 41, submittedAnswer: "B-remote" });

    const aFetch = deferred<Attempt[]>();
    const bFetch = deferred<Attempt[]>();
    fetchRemoteAttempts
      .mockReturnValueOnce(aFetch.promise) // user A
      .mockReturnValueOnce(bFetch.promise); // user B

    const { result, rerender } = renderHook(
      ({ user }: { user: User | null }) => useProgressAttempts(user),
      { initialProps: { user: makeUser("user-A") as User | null } }
    );
    await waitFor(() => expect(fetchRemoteAttempts).toHaveBeenCalledWith(fakeClient, "user-A"));

    rerender({ user: makeUser("user-B") });
    await waitFor(() => expect(fetchRemoteAttempts).toHaveBeenCalledWith(fakeClient, "user-B"));

    // B completes first (its merge lands).
    await act(async () => {
      bFetch.resolve([bRemote]);
      await bFetch.promise;
    });
    await waitFor(() => expect(result.current.syncStatus).toBe("synced"));
    expect(readStore() ?? []).toContainEqual(bRemote);

    // Now A's stale run resolves: its terminal write must be a no-op.
    await act(async () => {
      aFetch.resolve([aRemote]);
      await aFetch.promise;
    });
    expect(result.current.syncStatus).toBe("synced");
    expect(readStore() ?? []).not.toContainEqual(aRemote);
    expect(result.current.progressAttempts).not.toContainEqual(aRemote);
  });

  // StrictMode: the effect runs -> unmounts -> re-runs (double-invoke). The
  // second (replay) run must be the only one that mutates remote/local: no
  // duplicate fetch/push of the same delta, no duplicate local replace.
  it("StrictMode replay -> second generation is the only one that commits (no dup push / replace)", async () => {
    const localOnly = makeAttempt({ timestamp: 50, submittedAnswer: "local" });

    // Seed the local store while anon, under a StrictMode wrapper.
    const { result: anon } = renderHook(() => useProgressAttempts(null), {
      wrapper: StrictMode
    });
    act(() => {
      anon.current.recordAttempt(localOnly);
    });

    fetchRemoteAttempts.mockResolvedValue([]);

    // Login is the INITIAL render under StrictMode: the effect double-invokes
    // (run -> teardown -> replay), and the replay generation is the one that
    // may commit.
    const { result } = renderHook(() => useProgressAttempts(makeUser("user-1")), {
      wrapper: StrictMode
    });
    await waitFor(() => expect(result.current.syncStatus).toBe("synced"));

    // The replay's effect teardown must have invalidated the first run, so
    // only the replay generation pushed (exactly one push of the delta).
    const user1Pushes = pushAttempts.mock.calls.filter(([, id]) => id === "user-1");
    expect(user1Pushes).toHaveLength(1);
    expect(user1Pushes[0][2]).toEqual([localOnly]);
    expect(fetchRemoteAttempts.mock.calls.filter(([, id]) => id === "user-1")).toHaveLength(1);
    expect(readStore()).toEqual([localOnly]);
  });
});

// --- deleteSyncedPracticeHistory (#692) ------------------------------------

type DeleteResult = { ok: true } | { ok: false; message: string };

describe("useProgressAttempts -- deleteSyncedPracticeHistory", () => {
  it("not logged in -> false, zero supabase/marker mutation", async () => {
    const { result } = renderHook(() => useProgressAttempts(null));
    let ok = true;
    await act(async () => {
      ok = await result.current.deleteSyncedPracticeHistory();
    });
    expect(ok).toBe(false);
    expect(result.current.historyDeletionStatus).toBe("idle");
    expect(getSupabase).not.toHaveBeenCalled();
    expect(deleteRemoteAttempts).not.toHaveBeenCalled();
    expect(writeDeletionMarker).not.toHaveBeenCalled();
    expect(removeDeletionMarker).not.toHaveBeenCalled();
  });

  it("marker write fails -> false, no remote delete, no local mutation", async () => {
    const localOnly = makeAttempt({ timestamp: 1, submittedAnswer: "local" });
    const { result, rerender } = renderHook(
      ({ user }: { user: User | null }) => useProgressAttempts(user),
      { initialProps: { user: null as User | null } }
    );
    act(() => {
      result.current.recordAttempt(localOnly);
    });
    rerender({ user: makeUser("user-1") });
    await waitFor(() => expect(result.current.syncStatus).toBe("synced"));

    writeDeletionMarker.mockReturnValue(false);

    let ok = true;
    await act(async () => {
      ok = await result.current.deleteSyncedPracticeHistory();
    });
    expect(ok).toBe(false);
    expect(deleteRemoteAttempts).not.toHaveBeenCalled();
    expect(removeDeletionMarker).not.toHaveBeenCalled();
    // Local store and React state are completely untouched.
    expect(readStore()).toEqual([localOnly]);
    expect(result.current.progressAttempts).toEqual([localOnly]);
    expect(result.current.historyDeletionStatus).toBe("idle");
  });

  it("remote fail -> local untouched, marker removed, status error", async () => {
    const localOnly = makeAttempt({ timestamp: 1, submittedAnswer: "local" });
    const { result, rerender } = renderHook(
      ({ user }: { user: User | null }) => useProgressAttempts(user),
      { initialProps: { user: null as User | null } }
    );
    act(() => {
      result.current.recordAttempt(localOnly);
    });
    rerender({ user: makeUser("user-1") });
    await waitFor(() => expect(result.current.syncStatus).toBe("synced"));

    deleteRemoteAttempts.mockResolvedValue({
      ok: false,
      message: "Failed to delete remote practice history."
    });

    let ok = true;
    await act(async () => {
      ok = await result.current.deleteSyncedPracticeHistory();
    });
    expect(ok).toBe(false);
    expect(deleteRemoteAttempts).toHaveBeenCalledWith(fakeClient, "user-1");
    expect(writeDeletionMarker).toHaveBeenCalledWith("user-1");
    // Marker was dropped (nothing was deleted, so nothing to resume).
    expect(removeDeletionMarker).toHaveBeenCalledWith("user-1");
    // Local store/state untouched.
    expect(readStore()).toEqual([localOnly]);
    expect(result.current.progressAttempts).toEqual([localOnly]);
    expect(result.current.historyDeletionStatus).toBe("error");
  });

  it("remote success -> store + React cleared, marker removed, status deleted", async () => {
    const localOnly = makeAttempt({ timestamp: 1, submittedAnswer: "local" });
    const { result, rerender } = renderHook(
      ({ user }: { user: User | null }) => useProgressAttempts(user),
      { initialProps: { user: null as User | null } }
    );
    act(() => {
      result.current.recordAttempt(localOnly);
    });
    rerender({ user: makeUser("user-1") });
    await waitFor(() => expect(result.current.syncStatus).toBe("synced"));

    let ok = false;
    await act(async () => {
      ok = await result.current.deleteSyncedPracticeHistory();
    });
    expect(ok).toBe(true);
    expect(deleteRemoteAttempts).toHaveBeenCalledWith(fakeClient, "user-1");
    expect(removeDeletionMarker).toHaveBeenCalledWith("user-1");
    // Persistent store cleared and React attempts cleared.
    expect(readStore()).toBeNull();
    expect(result.current.progressAttempts).toEqual([]);
    expect(result.current.historyDeletionStatus).toBe("deleted");
  });

  it("historyDeletionStatus is deleting while a delete is in flight, then deleted", async () => {
    const deleteGate = deferred<DeleteResult>();
    deleteRemoteAttempts.mockReturnValue(deleteGate.promise);
    const { result } = renderHook(() => useProgressAttempts(makeUser("user-1")));
    await waitFor(() => expect(result.current.syncStatus).toBe("synced"));

    let pending!: Promise<boolean>;
    act(() => {
      pending = result.current.deleteSyncedPracticeHistory();
    });
    await waitFor(() => expect(result.current.historyDeletionStatus).toBe("deleting"));

    await act(async () => {
      deleteGate.resolve({ ok: true });
      await pending;
    });
    expect(result.current.historyDeletionStatus).toBe("deleted");
  });

  it("double call -> one remote delete, same operation result shared", async () => {
    const deleteGate = deferred<DeleteResult>();
    deleteRemoteAttempts.mockReturnValue(deleteGate.promise);
    const { result } = renderHook(() => useProgressAttempts(makeUser("user-1")));
    await waitFor(() => expect(result.current.syncStatus).toBe("synced"));

    let p1!: Promise<boolean>;
    let p2!: Promise<boolean>;
    act(() => {
      p1 = result.current.deleteSyncedPracticeHistory();
      p2 = result.current.deleteSyncedPracticeHistory();
    });
    await waitFor(() => expect(deleteRemoteAttempts).toHaveBeenCalledTimes(1));
    // Single-flight: no parallel deletes, and both callers share the op.
    expect(p2).toBe(p1);

    await act(async () => {
      deleteGate.resolve({ ok: true });
      await p1;
    });
    expect(result.current.historyDeletionStatus).toBe("deleted");
  });

  it("login with a pending marker -> resumes delete (remote + local) BEFORE fetch/merge", async () => {
    const staleLocal = makeAttempt({ timestamp: 1, submittedAnswer: "stale-local" });
    // Seed the persistent store with pre-delete history and the marker on.
    window.localStorage.setItem(ATTEMPTS_KEY, JSON.stringify([staleLocal]));
    readDeletionMarker.mockReturnValue(true);
    // Removing the marker flips the read back to false (mirrors the real
    // module removing the localStorage flag), so the resumed sync proceeds.
    removeDeletionMarker.mockImplementation(() => {
      readDeletionMarker.mockReturnValue(false);
      return true;
    });

    const { result } = renderHook(() => useProgressAttempts(makeUser("user-1")));

    // The resume runs the remote delete first.
    await waitFor(() => expect(deleteRemoteAttempts).toHaveBeenCalledWith(fakeClient, "user-1"));
    await waitFor(() => expect(result.current.historyDeletionStatus).toBe("deleted"));

    // The stale local history was cleared and never merged/pushed back.
    expect(result.current.progressAttempts).toEqual([]);
    expect(readStore()).toEqual([]);
    expect(pushAttempts).toHaveBeenCalledWith(fakeClient, "user-1", []);
    // Normal fetch/merge resumed after the marker was cleared.
    expect(fetchRemoteAttempts).toHaveBeenCalledWith(fakeClient, "user-1");
  });

  it("login with pending marker, remote fails -> keeps marker, no fetch/push of stale local", async () => {
    const staleLocal = makeAttempt({ timestamp: 1, submittedAnswer: "stale-local" });
    window.localStorage.setItem(ATTEMPTS_KEY, JSON.stringify([staleLocal]));
    readDeletionMarker.mockReturnValue(true);
    removeDeletionMarker.mockReturnValue(false); // marker stuck
    deleteRemoteAttempts.mockResolvedValue({
      ok: false,
      message: "Failed to delete remote practice history."
    });

    const { result } = renderHook(() => useProgressAttempts(makeUser("user-1")));

    await waitFor(() => expect(result.current.historyDeletionStatus).toBe("error"));
    // The stale local must not be pushed back while the marker is on.
    expect(pushAttempts).not.toHaveBeenCalled();
    expect(fetchRemoteAttempts).not.toHaveBeenCalled();
  });

  it("recordAttempt while marker present -> no remote push; marker cleared -> push resumes", async () => {
    const { result } = renderHook(() => useProgressAttempts(makeUser("user-1")));
    await waitFor(() => expect(result.current.syncStatus).toBe("synced"));
    pushAttempts.mockClear(); // drop the login-sync's empty push

    // Marker present: a new attempt stays local-only.
    readDeletionMarker.mockReturnValue(true);
    const duringMarker = makeAttempt({ timestamp: 5, submittedAnswer: "during-marker" });
    act(() => {
      result.current.recordAttempt(duringMarker);
    });
    expect(result.current.progressAttempts).toContainEqual(duringMarker);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(pushAttempts).not.toHaveBeenCalled();

    // Marker cleared: live push resumes.
    pushAttempts.mockClear();
    readDeletionMarker.mockReturnValue(false);
    const afterClear = makeAttempt({ timestamp: 6, submittedAnswer: "after-clear" });
    act(() => {
      result.current.recordAttempt(afterClear);
    });
    await waitFor(() =>
      expect(pushAttempts).toHaveBeenCalledWith(fakeClient, "user-1", [afterClear])
    );
  });

  it("A delete in flight, switch to B -> A's late success does NOT clear B or change B status", async () => {
    const bAttempt = makeAttempt({ timestamp: 60, submittedAnswer: "B-data" });
    const aDeleteGate = deferred<DeleteResult>();
    deleteRemoteAttempts.mockReturnValue(aDeleteGate.promise);

    const { result, rerender } = renderHook(
      ({ user }: { user: User | null }) => useProgressAttempts(user),
      { initialProps: { user: null as User | null } }
    );
    rerender({ user: makeUser("user-A") });
    await waitFor(() => expect(result.current.syncStatus).toBe("synced"));

    // A starts a delete; it parks on the remote delete gate.
    let aDelete!: Promise<boolean>;
    act(() => {
      aDelete = result.current.deleteSyncedPracticeHistory();
    });
    await waitFor(() => expect(deleteRemoteAttempts).toHaveBeenCalledWith(fakeClient, "user-A"));

    // Switch to B while A's delete is still in flight.
    rerender({ user: makeUser("user-B") });
    await waitFor(() => expect(result.current.syncStatus).toBe("synced"));
    act(() => {
      result.current.recordAttempt(bAttempt);
    });
    expect(result.current.progressAttempts).toContainEqual(bAttempt);

    // A's late delete completes (successfully) -- it must be inert on B.
    await act(async () => {
      aDeleteGate.resolve({ ok: true });
      await aDelete;
    });

    expect(result.current.progressAttempts).toContainEqual(bAttempt);
    expect(result.current.historyDeletionStatus).toBe("idle");
    expect(result.current.syncStatus).toBe("synced");
  });

  it("A delete in flight, logout -> A's late success does NOT clear the anon store", async () => {
    const anonAttempt = makeAttempt({ timestamp: 65, submittedAnswer: "anon-data" });
    const aDeleteGate = deferred<DeleteResult>();
    deleteRemoteAttempts.mockReturnValue(aDeleteGate.promise);

    const { result, rerender } = renderHook(
      ({ user }: { user: User | null }) => useProgressAttempts(user),
      { initialProps: { user: null as User | null } }
    );
    act(() => {
      result.current.recordAttempt(anonAttempt);
    });
    rerender({ user: makeUser("user-A") });
    await waitFor(() => expect(result.current.syncStatus).toBe("synced"));

    let aDelete!: Promise<boolean>;
    act(() => {
      aDelete = result.current.deleteSyncedPracticeHistory();
    });
    await waitFor(() => expect(deleteRemoteAttempts).toHaveBeenCalledWith(fakeClient, "user-A"));

    // Logout while A's delete is parked.
    rerender({ user: null });
    expect(result.current.syncStatus).toBe("idle");

    await act(async () => {
      aDeleteGate.resolve({ ok: true });
      await aDelete;
    });

    // The anon store keeps its pre-delete data; A's delete is inert.
    expect(result.current.progressAttempts).toContainEqual(anonAttempt);
    expect(result.current.historyDeletionStatus).toBe("idle");
    expect(result.current.syncStatus).toBe("idle");
  });

  it("delete during login-sync await -> stale sync does NOT commit old remote (no resurrection)", async () => {
    const oldRemote = makeAttempt({ timestamp: 70, submittedAnswer: "old-remote" });
    const fetchGate = deferred<Attempt[]>();
    fetchRemoteAttempts.mockReturnValue(fetchGate.promise);

    const { result, rerender } = renderHook(
      ({ user }: { user: User | null }) => useProgressAttempts(user),
      { initialProps: { user: null as User | null } }
    );
    rerender({ user: makeUser("user-1") });
    await waitFor(() => expect(fetchRemoteAttempts).toHaveBeenCalled());

    // The delete completes while the sync is parked on the fetch await.
    await act(async () => {
      await result.current.deleteSyncedPracticeHistory();
    });
    expect(result.current.progressAttempts).toEqual([]);

    // The stale sync's fetch now resolves with pre-delete remote data.
    await act(async () => {
      fetchGate.resolve([oldRemote]);
      await fetchGate.promise;
    });

    // The old remote must NOT be merged back in.
    expect(result.current.progressAttempts).not.toContainEqual(oldRemote);
    expect(readStore() ?? []).not.toContainEqual(oldRemote);
  });

  it("StrictMode replay -> no duplicate delete or local replace", async () => {
    const staleLocal = makeAttempt({ timestamp: 1, submittedAnswer: "stale-local" });
    window.localStorage.setItem(ATTEMPTS_KEY, JSON.stringify([staleLocal]));
    readDeletionMarker.mockReturnValue(true);
    removeDeletionMarker.mockImplementation(() => {
      readDeletionMarker.mockReturnValue(false);
      return true;
    });

    const { result } = renderHook(() => useProgressAttempts(makeUser("user-1")), {
      wrapper: StrictMode
    });
    await waitFor(() => expect(result.current.historyDeletionStatus).toBe("deleted"));

    // Only the replay generation ran the delete (no duplicate remote delete).
    expect(deleteRemoteAttempts).toHaveBeenCalledTimes(1);
    expect(deleteRemoteAttempts).toHaveBeenCalledWith(fakeClient, "user-1");
    // Cleared once and the empty merge committed once.
    expect(result.current.progressAttempts).toEqual([]);
    expect(readStore()).toEqual([]);
  });

  // LAST in this describe: the Storage.prototype.removeItem spy below flips
  // the module-singleton attemptStore into memory mode (clear()'s fallback),
  // which would corrupt the storage-backed assertions of any later test.
  it("remote ok but persistent clear fails -> React cleared, marker kept, status error, old data not pushed", async () => {
    const localOnly = makeAttempt({ timestamp: 1, submittedAnswer: "local" });
    const { result, rerender } = renderHook(
      ({ user }: { user: User | null }) => useProgressAttempts(user),
      { initialProps: { user: null as User | null } }
    );
    act(() => {
      result.current.recordAttempt(localOnly);
    });
    rerender({ user: makeUser("user-1") });
    await waitFor(() => expect(result.current.syncStatus).toBe("synced"));

    // From here the marker is stuck present and unremovable.
    readDeletionMarker.mockReturnValue(true);
    removeDeletionMarker.mockReturnValue(false);

    // Blocked persistent store: the attempts key survives while memory clears.
    const removeSpy = vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    try {
      let ok = true;
      await act(async () => {
        ok = await result.current.deleteSyncedPracticeHistory();
      });
      expect(ok).toBe(false);
      // React state was still cleared.
      expect(result.current.progressAttempts).toEqual([]);
      expect(result.current.historyDeletionStatus).toBe("error");
      // The persistent copy survived (clear failed) -- marker was kept.
      expect(readStore()).toEqual([localOnly]);

      // While the marker is present, a fresh live attempt is NOT pushed remote.
      pushAttempts.mockClear();
      const postDelete = makeAttempt({ timestamp: 9, submittedAnswer: "post-delete" });
      act(() => {
        result.current.recordAttempt(postDelete);
      });
      expect(result.current.progressAttempts).toContainEqual(postDelete);
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(pushAttempts).not.toHaveBeenCalled();
    } finally {
      removeSpy.mockRestore();
    }
  });
});
