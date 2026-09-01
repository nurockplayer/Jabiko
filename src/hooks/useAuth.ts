import { useCallback, useEffect, useState } from "react";
import type { AuthError, User } from "@supabase/supabase-js";
import { getSupabase, isSupabaseConfigured } from "../lib/supabase";

/**
 * Machine-readable auth failure codes (#427). The hook has no UI language,
 * so it never produces display text -- the render site maps these through
 * the locale Copy (`t.authErrors[code]`).
 */
export type AuthErrorCode = "sessionFetchFailed" | "authUnavailable" | "signOutFailed";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<AuthErrorCode | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    let active = true;
    let unsubscribe: (() => void) | undefined;

    getSupabase()
      .then((client) => {
        if (!client || !active) return;

        // Do not trust the user object from getSession() as an authorization
        // decision. getUser() validates the access token with Supabase Auth and
        // gives this hook a server-confirmed identity for account-backed data.
        client.auth
          .getUser()
          .then(({ data: { user }, error: err }) => {
            if (!active) return;
            if (err) {
              console.error("Supabase getUser error:", err);
              setUser(null);
              setError("sessionFetchFailed");
              return;
            }
            setUser(user ?? null);
            setError(null);
          })
          .catch((e: unknown) => {
            console.error("Supabase getUser exception:", e);
            if (!active) return;
            setUser(null);
            setError("sessionFetchFailed");
          });

        const {
          data: { subscription }
        } = client.auth.onAuthStateChange((_event, session) => {
          if (!active) return;
          setUser(session?.user ?? null);
          setError(null); // clear errors on successful auth change
        });
        unsubscribe = () => subscription.unsubscribe();
      })
      .catch((e: unknown) => {
        console.error("Supabase load error:", e);
        if (!active) return;
        setUser(null);
        setError("sessionFetchFailed");
      });

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const client = await getSupabase();
    if (!client) {
      setError("authUnavailable");
      return { error: new Error("Supabase not configured") as AuthError };
    }
    return client.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin
      }
    });
  }, []);

  const signOut = useCallback(async () => {
    const client = await getSupabase();
    if (!client) return;
    const { error: err } = await client.auth.signOut();
    if (err) {
      console.error("Sign out error:", err);
      setError("signOutFailed");
    }
  }, []);

  return { user, error, signInWithGoogle, signOut };
}
