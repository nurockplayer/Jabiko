import { useCallback, useEffect, useState } from "react";
import type { AuthError, User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession()
      .then(({ data: { session }, error: err }) => {
        if (err) {
          console.error("Supabase getSession error:", err);
          setError("無法取得登入狀態");
        }
        setUser(session?.user ?? null);
        setLoading(false);
      })
      .catch((e: unknown) => {
        console.error("Supabase getSession exception:", e);
        setLoading(false);
      });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setError(null); // clear errors on successful auth change
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (!supabase) {
      setError("登入服務不可用");
      return { error: new Error("Supabase not configured") as AuthError };
    }
    return supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin
      }
    });
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    const { error: err } = await supabase.auth.signOut();
    if (err) {
      console.error("Sign out error:", err);
      setError("登出失敗");
    }
  }, []);

  return { user, loading, error, signInWithGoogle, signOut };
}
