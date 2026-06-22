-- Cross-device attempt sync — Phase 0 schema + RLS (Part of #151).
--
-- One row per practice attempt, owned by the authenticated user. The app's
-- source of truth stays in localStorage (src/domain/storage.ts); this table
-- is the sync backend. `id` is a deterministic key derived from the attempt
-- (see src/domain/attemptSync.ts → attemptKey, hashed in the remote layer).
--
-- The primary key is COMPOSITE (user_id, id), not id alone: attemptKey is
-- derived from attempt content only (no user_id), so two different users
-- could in principle produce the same `id`. A global PK would let the first
-- writer's row block the second user's insert (ON CONFLICT DO NOTHING) while
-- RLS hides it from them — silently losing that attempt. Scoping the key to
-- (user_id, id) keeps each user's attempts independent: re-uploading your own
-- attempt is still an idempotent no-op, but two users never collide.
-- Append-only: there is no UPDATE policy, so rows are immutable once written.
--
-- HOW TO RUN (manual — an agent has no Supabase project login):
--   • Supabase Dashboard → SQL Editor → paste this whole file → Run, OR
--   • supabase db push  (if the Supabase CLI is linked to the project).
-- Idempotent: safe to re-run. No new env vars / keys needed (the anon key is
-- already configured; access is gated by RLS + the user's JWT).
--
-- Phase-2 client writes with upsert(..., { onConflict: 'user_id,id',
-- ignoreDuplicates: true }) and reads its own rows via select() (RLS-scoped).

create table if not exists public.attempts (
  id          text        not null,
  user_id     uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  payload     jsonb       not null,
  created_at  timestamptz not null default now(),
  primary key (user_id, id)
);

-- No separate user_id index needed: the composite primary key (user_id, id)
-- already indexes user_id as its leading column, covering "select my rows"
-- (where user_id = auth.uid()).

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
