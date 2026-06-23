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
      pushAttempts(client, userId, attempts)
  };
});

// Imported AFTER the mocks are registered. The hook owns a module-singleton
// attemptStore backed by window.localStorage (jsdom), so each test clears it.
import { useProgressAttempts } from "./useProgressAttempts";
import { attemptKey } from "../domain/attemptSync";

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
