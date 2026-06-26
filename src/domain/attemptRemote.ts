import type { SupabaseClient } from "@supabase/supabase-js";
import { attemptKey, mergeAttempts } from "./attemptSync";
import type { Attempt } from "./types";

// Cross-device attempt sync -- Phase 2 (remote repo), Part of #151.
//
// Thin, side-effecty wrapper over the Supabase `attempts` table plus one
// pure planner. The pure merge/identity rules live in attemptSync.ts; this
// module only translates them to/from rows. All functions tolerate a null
// client (Supabase unconfigured / not yet loaded) so the anon, no-login
// path stays a zero-cost no-op and the SDK never leaves its lazy chunk.

// Shape of a stored row. `payload` is the whole Attempt; `id` is its
// deterministic attemptKey so the composite PK (user_id, id) makes uploads
// idempotent.
interface AttemptRow {
  id: string;
  user_id: string;
  payload: Attempt;
}

// Read this user's attempts back from Supabase. Null client (unconfigured)
// -> []. Surfaces query errors to the caller (login sync treats a throw as
// "couldn't sync" and leaves local untouched).
export async function fetchRemoteAttempts(
  client: SupabaseClient | null,
  userId: string
): Promise<Attempt[]> {
  if (!client) {
    return [];
  }

  // PostgREST caps a single select at ~1000 rows (the project's max-rows),
  // so a heavy learner's full history wouldn't all come back on a fresh
  // device. Page through with .range() (ordered by the stable PK column `id`
  // so pages don't overlap or skip) until a short page signals the end.
  const PAGE = 1000;
  const attempts: Attempt[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await client
      .from("attempts")
      .select("payload")
      .eq("user_id", userId)
      .order("id", { ascending: true })
      .range(from, from + PAGE - 1);

    if (error) {
      throw error;
    }

    const rows = data ?? [];
    attempts.push(...rows.map((row) => (row as { payload: Attempt }).payload));
    if (rows.length < PAGE) {
      break;
    }
  }

  return attempts;
}

// Append the given attempts for this user. No-op on a null client or empty
// list (so callers don't have to guard). Rows are keyed by attemptKey and
// upserted with ignoreDuplicates so re-pushing an already-stored attempt is
// a harmless no-op (the table is append-only; PK collisions are skipped).
export async function pushAttempts(
  client: SupabaseClient | null,
  userId: string,
  attempts: Attempt[]
): Promise<void> {
  if (!client || attempts.length === 0) {
    return;
  }

  const rows: AttemptRow[] = attempts.map((attempt) => ({
    id: attemptKey(attempt),
    user_id: userId,
    payload: attempt
  }));

  const { error } = await client
    .from("attempts")
    .upsert(rows, { onConflict: "user_id,id", ignoreDuplicates: true });

  if (error) {
    throw error;
  }
}

// Pure login-sync planner. Given the local attempt history and what the
// remote already holds, produce:
//   - `merged`:   the union to write into the local store (mergeAttempts:
//                 dedup by key, local wins, deterministically sorted).
//   - `toUpload`: exactly the local-only attempts (those whose key is not
//                 already remote). This never overwrites remote and never
//                 loses local; uploading only the delta keeps the push
//                 small and idempotent (re-running with merged as both
//                 inputs yields toUpload []).
export function planLoginSync(
  local: Attempt[],
  remote: Attempt[]
): { merged: Attempt[]; toUpload: Attempt[] } {
  const remoteKeys = new Set(remote.map(attemptKey));
  const toUpload = local.filter((attempt) => !remoteKeys.has(attemptKey(attempt)));
  return { merged: mergeAttempts(local, remote), toUpload };
}
