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

        // INITIAL_SESSION reflects locally persisted auth state. Ignore that
        // event here because restored identities are validated below before
        // they are exposed to account-backed features.
        const {
          data: { subscription }
        } = client.auth.onAuthStateChange((event, session) => {
          if (!active || event === "INITIAL_SESSION") return;
          setUser(session?.user ?? null);
          setError(null); // clear errors on successful auth change
        });
        unsubscribe = () => subscription.unsubscribe();

        // A missing session is the normal signed-out state: Jabiko does not
        // require login. If a persisted session exists, do not trust its user
        // object for authorization. Ask Supabase Auth to validate it first.
        client.auth
          .getSession()
          .then(({ data: { session }, error: sessionError }) => {
            if (!active) return;
            if (sessionError) {
              console.error("Supabase getSession error:", sessionError);
              setUser(null);
              setError("sessionFetchFailed");
              return;
            }
            if (!session) {
              setUser(null);
              setError(null);
              return;
            }

            client.auth
              .getUser()
              .then(({ data: { user }, error: userError }) => {
                if (!active) return;
                if (userError) {
                  console.error("Supabase getUser error:", userError);
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
          })
          .catch((e: unknown) => {
            console.error("Supabase getSession exception:", e);
            if (!active) return;
            setUser(null);
            setError("sessionFetchFailed");
          });
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
