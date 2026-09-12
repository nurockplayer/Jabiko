import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthError, AuthChangeEvent, Session, SupabaseClient, User } from "@supabase/supabase-js";

type SessionResult = Awaited<ReturnType<SupabaseClient["auth"]["getSession"]>>;
type UserResult = Awaited<ReturnType<SupabaseClient["auth"]["getUser"]>>;
type AuthCallback = Parameters<SupabaseClient["auth"]["onAuthStateChange"]>[0];

const getSupabase = vi.fn<() => Promise<SupabaseClient | null>>();

vi.mock("../lib/supabase", () => ({
  getSupabase: () => getSupabase(),
  isSupabaseConfigured: true
}));

import { useAuth } from "./useAuth";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function makeUser(id: string): User {
  return { id } as User;
}

function makeSession(user: User): Session {
  return { user } as Session;
}

function authError(message: string): AuthError {
  return { message } as AuthError;
}

function sessionResult(session: Session | null, error: AuthError | null = null): SessionResult {
  return { data: { session }, error } as SessionResult;
}

function userResult(user: User | null, error: AuthError | null = null): UserResult {
  return { data: { user }, error } as UserResult;
}

describe("useAuth", () => {
  let getSession: ReturnType<typeof vi.fn<() => Promise<SessionResult>>>;
  let getUser: ReturnType<typeof vi.fn<() => Promise<UserResult>>>;
  let authCallback: AuthCallback | undefined;
  let unsubscribe: ReturnType<typeof vi.fn>;

  function emit(event: AuthChangeEvent, session: Session | null) {
    if (!authCallback) throw new Error("Auth subscription was not registered");
    authCallback(event, session);
  }

  beforeEach(() => {
    getSession = vi.fn<() => Promise<SessionResult>>();
    getUser = vi.fn<() => Promise<UserResult>>();
    unsubscribe = vi.fn();
    authCallback = undefined;

    const client = {
      auth: {
        getSession,
        getUser,
        onAuthStateChange: vi.fn((callback: AuthCallback) => {
          authCallback = callback;
          return { data: { subscription: { unsubscribe } } };
        })
      }
    } as unknown as SupabaseClient;

    getSupabase.mockResolvedValue(client);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it("exposes only the server-validated user from a restored session", async () => {
    const persistedUser = makeUser("persisted-user");
    const validatedUser = makeUser("validated-user");
    getSession.mockResolvedValue(sessionResult(makeSession(persistedUser)));
    getUser.mockResolvedValue(userResult(validatedUser));

    const { result } = renderHook(() => useAuth());

    await waitFor(() => expect(result.current.user).toBe(validatedUser));
    expect(result.current.error).toBeNull();
  });

  it("keeps a missing restored session signed out without an error", async () => {
    getSession.mockResolvedValue(sessionResult(null));

    const { result } = renderHook(() => useAuth());

    await waitFor(() => expect(getSession).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(result.current.error).toBeNull());
    expect(result.current.user).toBeNull();
    expect(getUser).not.toHaveBeenCalled();
  });

  it("reports a getSession response error without exposing a user", async () => {
    getSession.mockResolvedValue(sessionResult(null, authError("session unavailable")));

    const { result } = renderHook(() => useAuth());

    await waitFor(() => expect(result.current.error).toBe("sessionFetchFailed"));
    expect(result.current.user).toBeNull();
    expect(getUser).not.toHaveBeenCalled();
  });

  it("reports a rejected getSession call without exposing a user", async () => {
    getSession.mockRejectedValue(new Error("network failure"));

    const { result } = renderHook(() => useAuth());

    await waitFor(() => expect(result.current.error).toBe("sessionFetchFailed"));
    expect(result.current.user).toBeNull();
  });

  it("reports a getUser response error without trusting the persisted user", async () => {
    getSession.mockResolvedValue(sessionResult(makeSession(makeUser("persisted-user"))));
    getUser.mockResolvedValue(userResult(null, authError("token expired")));

    const { result } = renderHook(() => useAuth());

    await waitFor(() => expect(result.current.error).toBe("sessionFetchFailed"));
    expect(result.current.user).toBeNull();
  });

  it("reports a rejected getUser call without trusting the persisted user", async () => {
    getSession.mockResolvedValue(sessionResult(makeSession(makeUser("persisted-user"))));
    getUser.mockRejectedValue(new Error("network failure"));

    const { result } = renderHook(() => useAuth());

    await waitFor(() => expect(result.current.error).toBe("sessionFetchFailed"));
    expect(result.current.user).toBeNull();
  });

  it("ignores a late INITIAL_SESSION event until validation succeeds", async () => {
    const validation = deferred<UserResult>();
    const persistedUser = makeUser("persisted-user");
    const validatedUser = makeUser("validated-user");
    getSession.mockResolvedValue(sessionResult(makeSession(persistedUser)));
    getUser.mockReturnValue(validation.promise);

    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(getUser).toHaveBeenCalledTimes(1));

    act(() => {
      emit("INITIAL_SESSION", makeSession(persistedUser));
    });
    expect(result.current.user).toBeNull();

    await act(async () => {
      validation.resolve(userResult(validatedUser));
    });
    expect(result.current.user).toBe(validatedUser);
  });

  it("does not trust the storage-backed SIGNED_IN emitted before INITIAL_SESSION", async () => {
    const validation = deferred<UserResult>();
    const storedUser = makeUser("stored-user");
    const validatedUser = makeUser("validated-user");
    const session = deferred<SessionResult>();
    getSession.mockReturnValue(session.promise);
    getUser.mockReturnValue(validation.promise);

    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(getSession).toHaveBeenCalledTimes(1));

    // This is the installed SDK's startup sequence: recovery publishes its
    // storage payload as SIGNED_IN before the subscription gets INITIAL_SESSION.
    act(() => {
      emit("SIGNED_IN", makeSession(storedUser));
      emit("INITIAL_SESSION", makeSession(storedUser));
    });

    expect(result.current.user).toBeNull();
    await waitFor(() => expect(getUser).toHaveBeenCalledTimes(1));

    await act(async () => {
      validation.resolve(userResult(validatedUser));
    });
    expect(result.current.user).toBe(validatedUser);
  });

  it("keeps a sign-out event when an older restoration validates later", async () => {
    const validation = deferred<UserResult>();
    getSession.mockResolvedValue(sessionResult(makeSession(makeUser("persisted-user"))));
    getUser.mockReturnValue(validation.promise);

    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(getUser).toHaveBeenCalledTimes(1));

    act(() => {
      emit("SIGNED_OUT", null);
    });
    await act(async () => {
      validation.resolve(userResult(makeUser("persisted-user")));
    });

    expect(result.current.user).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("keeps a sign-out event when an older restoration rejects later", async () => {
    const validation = deferred<UserResult>();
    getSession.mockResolvedValue(sessionResult(makeSession(makeUser("persisted-user"))));
    getUser.mockReturnValue(validation.promise);

    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(getUser).toHaveBeenCalledTimes(1));

    act(() => {
      emit("SIGNED_OUT", null);
    });
    await act(async () => {
      validation.reject(new Error("stale validation failed"));
    });

    expect(result.current.user).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("keeps a sign-in event when an older restoration validates later", async () => {
    const oldValidation = deferred<UserResult>();
    const newValidation = deferred<UserResult>();
    const signedInUser = makeUser("new-user");
    getSession.mockResolvedValue(sessionResult(makeSession(makeUser("persisted-user"))));
    getUser.mockReturnValueOnce(oldValidation.promise).mockReturnValueOnce(newValidation.promise);

    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(getUser).toHaveBeenCalledTimes(1));

    act(() => {
      emit("SIGNED_IN", makeSession(signedInUser));
    });
    await act(async () => {
      oldValidation.resolve(userResult(makeUser("persisted-user")));
    });

    expect(result.current.user).toBeNull();
    await waitFor(() => expect(getUser).toHaveBeenCalledTimes(2));
    await act(async () => {
      newValidation.resolve(userResult(signedInUser));
    });

    expect(result.current.user).toBe(signedInUser);
    expect(result.current.error).toBeNull();
  });

  it("unsubscribes and ignores restoration work after unmount", async () => {
    const session = deferred<SessionResult>();
    getSession.mockReturnValue(session.promise);

    const { unmount } = renderHook(() => useAuth());
    await waitFor(() => expect(getSession).toHaveBeenCalledTimes(1));
    unmount();

    await act(async () => {
      session.resolve(sessionResult(makeSession(makeUser("persisted-user"))));
    });

    expect(unsubscribe).toHaveBeenCalledTimes(1);
    expect(getUser).not.toHaveBeenCalled();
  });
});
