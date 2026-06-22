-- Cross-device attempt sync — Phase 0 schema + RLS (Part of #151).
--
-- One row per practice attempt, owned by the authenticated user. The app's
-- source of truth stays in localStorage (src/domain/storage.ts); this table
-- is the sync backend. `id` is a deterministic key derived from the attempt
-- (see src/domain/attemptSync.ts → attemptKey, hashed in the remote layer),
-- so re-uploading the same attempt is an idempotent upsert (ON CONFLICT DO
-- NOTHING) and two devices union without overwriting each other. Append-only:
-- there is no UPDATE policy, so rows are immutable once written.
--
-- HOW TO RUN (manual — an agent has no Supabase project login):
--   • Supabase Dashboard → SQL Editor → paste this whole file → Run, OR
--   • supabase db push  (if the Supabase CLI is linked to the project).
-- Idempotent: safe to re-run. No new env vars / keys needed (the anon key is
-- already configured; access is gated by RLS + the user's JWT).

create table if not exists public.attempts (
  id          text        primary key,
  user_id     uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  payload     jsonb       not null,
  created_at  timestamptz not null default now()
);

create index if not exists attempts_user_id_idx on public.attempts (user_id);

alter table public.attempts enable row level security;

-- A user may only read / insert / delete their own rows. (No UPDATE policy:
-- attempts are append-only; the client upserts with ON CONFLICT DO NOTHING.)
drop policy if exists "attempts_select_own" on public.attempts;
create policy "attempts_select_own" on public.attempts
  for select using (auth.uid() = user_id);

drop policy if exists "attempts_insert_own" on public.attempts;
create policy "attempts_insert_own" on public.attempts
  for insert with check (auth.uid() = user_id);

drop policy if exists "attempts_delete_own" on public.attempts;
create policy "attempts_delete_own" on public.attempts
  for delete using (auth.uid() = user_id);
