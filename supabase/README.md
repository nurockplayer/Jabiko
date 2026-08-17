# Supabase (cross-device progress sync / #151)

This folder holds the database structure for Jabiko's cross-device "mistakes and progress (attempts) sync". The app normally stores data in localStorage on the device (`src/domain/storage.ts`); after login it two-way syncs with the `attempts` table here.

## migrations

- [`migrations/0001_create_attempts.sql`](migrations/0001_create_attempts.sql) — creates the `attempts` table (one row per attempt, **composite primary key `(user_id, id)`**, `id` is a deterministic key/hash, append-only) + enables RLS (each user can only read/write their own rows). The composite primary key means identical attempts from different users don't collide and lose data.

## Manual steps (the agent has no project login; you must run these)

1. **Create the table**: paste the full contents of `migrations/0001_create_attempts.sql` into Supabase Dashboard → SQL Editor → Run (or `supabase db push`). Idempotent, safe to re-run.
2. **End-to-end verification** (after the sync code P2/P3 ships): a real user signs in with Google (ideally on two browsers/devices) and confirms the progress actually syncs — the "synced" UI copy (P5) ships only after this verification passes.
3. Confirm Supabase Auth's redirect / allowed URLs include your deployed origin (usually already OK).

**No new environment variables or secrets needed**: the anon key is already set; access relies entirely on RLS + the user JWT.

> Related code: `src/domain/attemptSync.ts` (merge logic, #153), later `attemptRemote.ts` (P2 remote repo), `useProgressAttempts.ts` (P3 wiring). Tracked in issue #151.
