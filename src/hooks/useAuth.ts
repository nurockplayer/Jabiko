import { useCallback, useEffect, useState } from "react";
import type { AuthError, User } from "@supabase/supabase-js";
import { getSupabase, isSupabaseConfigured } from "../lib/supabase";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    let active = true;
    let unsubscribe: (() => void) | undefined;

    getSupabase()
      .then((client) => {
        if (!client || !active) return;

        client.auth
          .getSession()
          .then(({ data: { session }, error: err }) => {
            if (err) {
              console.error("Supabase getSession error:", err);
              setError("無法取得登入狀態");
            }
            setUser(session?.user ?? null);
          })
          .catch((e: unknown) => {
            console.error("Supabase getSession exception:", e);
          });

        const {
          data: { subscription }
        } = client.auth.onAuthStateChange((_event, session) => {
          setUser(session?.user ?? null);
          setError(null); // clear errors on successful auth change
        });
        unsubscribe = () => subscription.unsubscribe();
      })
      .catch((e: unknown) => {
        console.error("Supabase load error:", e);
      });

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const client = await getSupabase();
    if (!client) {
      setError("登入服務不可用");
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
      setError("登出失敗");
    }
  }, []);

  return { user, error, signInWithGoogle, signOut };
}
