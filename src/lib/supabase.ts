import type { SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// Pure env check -- no SDK import -- so the login button can render and
// callers can short-circuit without pulling @supabase/supabase-js into the
// bundle.
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured && import.meta.env.DEV) {
  console.warn(
    "Supabase not configured: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env"
  );
}

// Lazy singleton. The @supabase/supabase-js SDK (~210 KB raw / ~55 KB gzip)
// is dynamically imported on first use, so it lands in its own chunk rather
// than the initial bundle -- the app shell / home view stay light and the SDK
// only loads when the learner actually signs in. A static import from the
// eager App entry would otherwise force the whole SDK into index.js. Returns
// null when env is unset (graceful degradation).
let clientPromise: Promise<SupabaseClient | null> | null = null;

export function getSupabase(): Promise<SupabaseClient | null> {
  if (!isSupabaseConfigured) return Promise.resolve(null);
  if (!clientPromise) {
    clientPromise = import("@supabase/supabase-js").then(({ createClient }) =>
      createClient(supabaseUrl!, supabaseAnonKey!, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
          flowType: "pkce"
        }
      })
    );
  }
  return clientPromise;
}
