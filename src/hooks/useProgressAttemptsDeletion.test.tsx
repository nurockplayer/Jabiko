import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createAttemptStore } from "../domain/storage";
import type { Attempt } from "../domain/types";
import { deletionMarkerKey } from "../domain/practiceHistoryDeletion";

const io = vi.hoisted(() => ({
  getSupabase: vi.fn<() => Promise<SupabaseClient | null>>(),
  fetchRemoteAttempts: vi.fn<(client: SupabaseClient | null, userId: string) => Promise<Attempt[]>>(),
  pushAttempts: vi.fn<(client: SupabaseClient | null, userId: string, attempts: Attempt[]) => Promise<void>>(),
  deleteRemoteAttempts: vi.fn<
    (client: SupabaseClient, userId: string) => Promise<{ ok: true } | { ok: false; message: string }>
  >()
}));

vi.mock("../lib/supabase", () => ({
  getSupabase: io.getSupabase,
  isSupabaseConfigured: true
}));

vi.mock("../domain/attemptRemote", async () => {
  const actual = await vi.importActual<typeof import("../domain/attemptRemote")>("../domain/attemptRemote");
  return {
    ...actual,
    fetchRemoteAttempts: (client: SupabaseClient | null, userId: string) =>
      io.fetchRemoteAttempts(client, userId),
    pushAttempts: (client: SupabaseClient | null, userId: string, attempts: Attempt[]) =>
      io.pushAttempts(client, userId, attempts),
    deleteRemoteAttempts: (client: SupabaseClient, userId: string) =>
      io.deleteRemoteAttempts(client, userId)
  };
});

import { useProgressAttempts } from "./useProgressAttempts";

const ATTEMPTS_KEY = "jabiko:attempts";
const fakeClient = {} as unknown as SupabaseClient;

function makeAttempt(timestamp: number, submittedAnswer = `answer-${timestamp}`): Attempt {
  return {
    vocabularyId: "kaku",
    targetForm: "te",
    prompt: "書く",
    expectedAnswers: ["書いて"],
    submittedAnswer,
    isCorrect: true,
    timestamp,
    responseTimeMs: 500
  };
}

function makeUser(id: string): User {
  return { id } as unknown as User;
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function diskAttempts(): Attempt[] | null {
  const raw = window.localStorage.getItem(ATTEMPTS_KEY);
  return raw ? (JSON.parse(raw) as Attempt[]) : null;
}

beforeEach(() => {
  window.localStorage.clear();
  io.getSupabase.mockResolvedValue(fakeClient);
  io.fetchRemoteAttempts.mockResolvedValue([]);
  io.pushAttempts.mockResolvedValue(undefined);
  io.deleteRemoteAttempts.mockResolvedValue({ ok: true });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("useProgressAttempts deletion durability and upload ordering", () => {
  it("waits for a live upload already in flight before deleting remote history", async () => {
    const { result } = renderHook(() => useProgressAttempts(makeUser("delete-live-drain")));
    await waitFor(() => expect(result.current.syncStatus).toBe("synced"));
    io.pushAttempts.mockClear();

    const upload = deferred<void>();
    io.pushAttempts.mockReturnValue(upload.promise);
    const attempt = makeAttempt(8101);
    act(() => result.current.recordAttempt(attempt));
    await waitFor(() => expect(io.pushAttempts).toHaveBeenCalledWith(fakeClient, "delete-live-drain", [attempt]));

    let deletion!: Promise<boolean>;
    act(() => {
      deletion = result.current.deleteSyncedPracticeHistory();
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    const waitedForUpload = io.deleteRemoteAttempts.mock.calls.length === 0;

    await act(async () => {
      upload.resolve(undefined);
      await deletion;
    });
    expect(waitedForUpload).toBe(true);
    expect(io.deleteRemoteAttempts).toHaveBeenCalledTimes(1);
    expect(window.localStorage.getItem(deletionMarkerKey("delete-live-drain"))).toBeNull();
  });

  it("waits for a login-sync upload already in flight before deleting remote history", async () => {
    const attempt = makeAttempt(8201);
    window.localStorage.setItem(ATTEMPTS_KEY, JSON.stringify([attempt]));
    const { result } = renderHook(() => useProgressAttempts(makeUser("delete-login-drain")));

    const upload = deferred<void>();
    io.pushAttempts.mockReturnValue(upload.promise);
    await waitFor(() => expect(io.pushAttempts).toHaveBeenCalledWith(fakeClient, "delete-login-drain", [attempt]));

    let deletion!: Promise<boolean>;
    act(() => {
      deletion = result.current.deleteSyncedPracticeHistory();
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    const waitedForUpload = io.deleteRemoteAttempts.mock.calls.length === 0;

    await act(async () => {
      upload.resolve(undefined);
      await deletion;
    });
    expect(waitedForUpload).toBe(true);
    expect(io.deleteRemoteAttempts).toHaveBeenCalledTimes(1);
    expect(diskAttempts()).toBeNull();
  });

  it("cancels an old live SDK callback before it can upload after deletion admission", async () => {
    const { result } = renderHook(() => useProgressAttempts(makeUser("delete-sdk-gate")));
    await waitFor(() => expect(result.current.syncStatus).toBe("synced"));
    io.pushAttempts.mockClear();

    const sdk = deferred<SupabaseClient | null>();
    io.getSupabase.mockImplementationOnce(() => sdk.promise);
    const attempt = makeAttempt(8301);
    act(() => result.current.recordAttempt(attempt));
    await waitFor(() => expect(io.getSupabase).toHaveBeenCalledTimes(2));

    let deletion!: Promise<boolean>;
    act(() => {
      deletion = result.current.deleteSyncedPracticeHistory();
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    const waitedForSdkCallback = io.deleteRemoteAttempts.mock.calls.length === 0;

    await act(async () => {
      sdk.resolve(fakeClient);
      await deletion;
    });
    expect(waitedForSdkCallback).toBe(true);
    expect(io.pushAttempts).not.toHaveBeenCalledWith(fakeClient, "delete-sdk-gate", [attempt]);
    expect(io.deleteRemoteAttempts).toHaveBeenCalledTimes(1);
  });

  it("keeps fresh remote-failure behavior local and releases only the new intent", async () => {
    const attempt = makeAttempt(8351);
    window.localStorage.setItem(ATTEMPTS_KEY, JSON.stringify([attempt]));
    io.deleteRemoteAttempts.mockResolvedValue({ ok: false, message: "remote unavailable" });
    const { result } = renderHook(() => useProgressAttempts(makeUser("delete-fresh-failure")));
    await waitFor(() => expect(result.current.syncStatus).toBe("synced"));

    let deleted = true;
    await act(async () => {
      deleted = await result.current.deleteSyncedPracticeHistory();
    });

    expect(deleted).toBe(false);
    expect(result.current.historyDeletionStatus).toBe("error");
    expect(diskAttempts()).toEqual([attempt]);
    expect(window.localStorage.getItem(deletionMarkerKey("delete-fresh-failure"))).toBeNull();
  });

  it("keeps a fresh intent after an ambiguous thrown remote failure", async () => {
    const stale = makeAttempt(8356);
    const later = makeAttempt(8357);
    const userId = "delete-thrown-remote-failure";
    window.localStorage.setItem(ATTEMPTS_KEY, JSON.stringify([stale]));
    io.deleteRemoteAttempts.mockRejectedValue(new Error("request outcome unknown"));
    const { result } = renderHook(() => useProgressAttempts(makeUser(userId)));
    await waitFor(() => expect(result.current.syncStatus).toBe("synced"));

    let deleted = true;
    await act(async () => {
      deleted = await result.current.deleteSyncedPracticeHistory();
    });
    expect(deleted).toBe(false);
    expect(result.current.historyDeletionStatus).toBe("error");
    expect(window.localStorage.getItem(deletionMarkerKey(userId))).not.toBeNull();
    expect(diskAttempts()).toEqual([stale]);

    io.pushAttempts.mockClear();
    act(() => result.current.recordAttempt(later));
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(io.pushAttempts).not.toHaveBeenCalledWith(fakeClient, userId, [later]);

    io.deleteRemoteAttempts.mockResolvedValue({ ok: true });
    await act(async () => {
      deleted = await result.current.deleteSyncedPracticeHistory();
    });
    expect(deleted).toBe(true);
    expect(window.localStorage.getItem(deletionMarkerKey(userId))).toBeNull();
  });

  it("preserves retry intent after resume failure and uses it to block uploads if marker reads fail", async () => {
    const stale = makeAttempt(8361);
    const later = makeAttempt(8362);
    window.localStorage.setItem(ATTEMPTS_KEY, JSON.stringify([stale]));
    window.localStorage.setItem(deletionMarkerKey("delete-retry-read-failure"), "1");
    io.deleteRemoteAttempts.mockResolvedValue({ ok: false, message: "remote unavailable" });
    const { result } = renderHook(() => useProgressAttempts(makeUser("delete-retry-read-failure")));
    await waitFor(() => expect(result.current.historyDeletionStatus).toBe("error"));
    expect(window.localStorage.getItem(deletionMarkerKey("delete-retry-read-failure"))).not.toBeNull();

    const originalGet = Storage.prototype.getItem;
    const getSpy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(function (
      this: Storage,
      key: string
    ) {
      if (key === deletionMarkerKey("delete-retry-read-failure")) {
        throw new Error("marker read blocked");
      }
      return originalGet.call(this, key);
    });
    try {
      io.pushAttempts.mockClear();
      act(() => result.current.recordAttempt(later));
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });
      expect(io.pushAttempts).not.toHaveBeenCalledWith(fakeClient, "delete-retry-read-failure", [later]);
    } finally {
      getSpy.mockRestore();
    }

    // A later retry succeeds, proving the in-memory intent can be released
    // only after durable local cleanup and marker removal both succeed.
    io.deleteRemoteAttempts.mockResolvedValue({ ok: true });
    let deleted = false;
    await act(async () => {
      deleted = await result.current.deleteSyncedPracticeHistory();
    });
    expect(deleted).toBe(true);
    expect(window.localStorage.getItem(deletionMarkerKey("delete-retry-read-failure"))).toBeNull();
  });

  it("serializes an inactive same-user delete across remount and preserves later uploads", async () => {
    const oldDelete = deferred<{ ok: true } | { ok: false; message: string }>();
    const resumedDelete = deferred<{ ok: true } | { ok: false; message: string }>();
    const deleteGates = [oldDelete, resumedDelete];
    io.deleteRemoteAttempts.mockImplementation(() => {
      const gate = deleteGates.shift();
      return gate ? gate.promise : Promise.resolve({ ok: true });
    });

    const first = renderHook(() => useProgressAttempts(makeUser("delete-remount-A")));
    await waitFor(() => expect(first.result.current.syncStatus).toBe("synced"));
    let oldOperation!: Promise<boolean>;
    act(() => {
      oldOperation = first.result.current.deleteSyncedPracticeHistory();
    });
    await waitFor(() => expect(io.deleteRemoteAttempts).toHaveBeenCalledTimes(1));
    first.unmount();

    const second = renderHook(() => useProgressAttempts(makeUser("delete-remount-A")));
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    const waitedForOldDelete = io.deleteRemoteAttempts.mock.calls.length === 1;

    // New local activity stays behind the in-memory/persisted delete gate.
    const afterResume = makeAttempt(8371);
    act(() => second.result.current.recordAttempt(afterResume));
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(io.pushAttempts).not.toHaveBeenCalledWith(fakeClient, "delete-remount-A", [afterResume]);

    await act(async () => {
      oldDelete.resolve({ ok: true });
      await oldOperation;
    });
    await waitFor(() => expect(io.deleteRemoteAttempts).toHaveBeenCalledTimes(2));
    await act(async () => {
      resumedDelete.resolve({ ok: true });
    });
    await waitFor(() => expect(second.result.current.historyDeletionStatus).toBe("deleted"));
    expect(waitedForOldDelete).toBe(true);
    expect(window.localStorage.getItem(deletionMarkerKey("delete-remount-A"))).toBeNull();

    const postDelete = makeAttempt(8372);
    act(() => second.result.current.recordAttempt(postDelete));
    await waitFor(() =>
      expect(io.pushAttempts).toHaveBeenCalledWith(fakeClient, "delete-remount-A", [postDelete])
    );
    expect(diskAttempts()).toEqual([postDelete]);
  });

  it("keeps an A to B to A resume behind a rejected inactive delete", async () => {
    const oldDelete = deferred<{ ok: true } | { ok: false; message: string }>();
    io.deleteRemoteAttempts.mockImplementationOnce(() => oldDelete.promise);
    const { result, rerender } = renderHook(
      ({ user }: { user: User | null }) => useProgressAttempts(user),
      { initialProps: { user: makeUser("delete-account-A") as User | null } }
    );
    await waitFor(() => expect(result.current.syncStatus).toBe("synced"));

    let oldOperation!: Promise<boolean>;
    act(() => {
      oldOperation = result.current.deleteSyncedPracticeHistory();
    });
    await waitFor(() => expect(io.deleteRemoteAttempts).toHaveBeenCalledTimes(1));

    rerender({ user: makeUser("delete-account-B") });
    await waitFor(() => expect(result.current.syncStatus).toBe("synced"));
    rerender({ user: makeUser("delete-account-A") });
    await waitFor(() => expect(result.current.historyDeletionStatus).toBe("deleting"));
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(io.deleteRemoteAttempts).toHaveBeenCalledTimes(1);

    await act(async () => {
      oldDelete.reject(new Error("old request failed after account switch"));
      await oldOperation;
    });
    await waitFor(() => expect(io.deleteRemoteAttempts).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(result.current.historyDeletionStatus).toBe("deleted"));
    expect(window.localStorage.getItem(deletionMarkerKey("delete-account-A"))).toBeNull();
  });

  it("keeps the real pending marker when marker removal throws, then releases it on retry", async () => {
    const attempt = makeAttempt(8381);
    const userId = "delete-marker-removal-retry";
    window.localStorage.setItem(ATTEMPTS_KEY, JSON.stringify([attempt]));
    const { result } = renderHook(() => useProgressAttempts(makeUser(userId)));
    await waitFor(() => expect(result.current.syncStatus).toBe("synced"));

    const markerKey = deletionMarkerKey(userId);
    const originalRemove = Storage.prototype.removeItem;
    const removeSpy = vi.spyOn(Storage.prototype, "removeItem").mockImplementation(function (
      this: Storage,
      key: string
    ) {
      if (key === markerKey) throw new Error("marker removal blocked");
      originalRemove.call(this, key);
    });

    let firstResult = true;
    try {
      await act(async () => {
        firstResult = await result.current.deleteSyncedPracticeHistory();
      });
      expect(firstResult).toBe(false);
      expect(result.current.historyDeletionStatus).toBe("error");
      expect(window.localStorage.getItem(markerKey)).not.toBeNull();
      expect(diskAttempts()).toBeNull();
    } finally {
      removeSpy.mockRestore();
    }

    let retryResult = false;
    await act(async () => {
      retryResult = await result.current.deleteSyncedPracticeHistory();
    });
    expect(retryResult).toBe(true);
    expect(window.localStorage.getItem(markerKey)).toBeNull();

    const postDelete = makeAttempt(8382);
    act(() => result.current.recordAttempt(postDelete));
    await waitFor(() => expect(io.pushAttempts).toHaveBeenCalledWith(fakeClient, userId, [postDelete]));
  });

  // Keep last: simulating the storage failure puts the production singleton
  // into its existing memory-fallback mode for the rest of this test module.
  it("does not report deletion success when attempts removal fails but marker removal works", async () => {
    const persisted = makeAttempt(8401);
    window.localStorage.setItem(ATTEMPTS_KEY, JSON.stringify([persisted]));
    const { result } = renderHook(() => useProgressAttempts(makeUser("delete-attempt-key-fails")));
    await waitFor(() => expect(result.current.syncStatus).toBe("synced"));

    const originalRemove = Storage.prototype.removeItem;
    const removeSpy = vi.spyOn(Storage.prototype, "removeItem").mockImplementation(function (
      this: Storage,
      key: string
    ) {
      if (key === ATTEMPTS_KEY) throw new Error("attempts key removal blocked");
      originalRemove.call(this, key);
    });

    try {
      let deleted = true;
      await act(async () => {
        deleted = await result.current.deleteSyncedPracticeHistory();
      });
      expect(deleted).toBe(false);
      expect(result.current.historyDeletionStatus).toBe("error");
      expect(window.localStorage.getItem(deletionMarkerKey("delete-attempt-key-fails"))).not.toBeNull();
      expect(diskAttempts()).toEqual([persisted]);
      expect(createAttemptStore(window.localStorage).list()).toEqual([persisted]);
    } finally {
      removeSpy.mockRestore();
    }
  });
});
