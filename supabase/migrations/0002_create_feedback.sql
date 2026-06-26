-- Anonymous feedback box (#218 follow-up): 許願 / 問題回報 / 其他.
--
-- A write-only "suggestion box". ANYONE -- anonymous (anon) or logged-in
-- (authenticated) -- may INSERT a row; NOBODY may SELECT / UPDATE / DELETE
-- through the API. The owner reads submissions in the Supabase Dashboard
-- (the service_role bypasses RLS). No login required, so feedback can be
-- fully anonymous.
--
-- HOW TO RUN (manual -- an agent has no Supabase project login):
--   • Supabase Dashboard → SQL Editor → paste this whole file → Run, OR
--   • supabase db push  (if the Supabase CLI is linked to the project).
-- Idempotent: safe to re-run. No new env vars / keys needed (uses the
-- existing anon key; access is gated by RLS + the grants below).

create table if not exists public.feedback (
  id          uuid        not null default gen_random_uuid() primary key,
  category    text        not null default 'other',
  message     text        not null,
  contact     text,
  created_at  timestamptz not null default now()
);

alter table public.feedback enable row level security;

-- INSERT-only policy (applies to every role -- anon + authenticated). The
-- WITH CHECK doubles as light server-side validation / abuse bound: a
-- non-empty, length-capped message and a known category.
drop policy if exists "feedback_insert_any" on public.feedback;
create policy "feedback_insert_any" on public.feedback
  for insert
  with check (
    char_length(message) between 1 and 4000
    and char_length(coalesce(contact, '')) <= 200
    and category in ('wish', 'bug', 'other')
  );

-- Deliberately NO select / update / delete policies: with RLS on and no such
-- policy, the anon & authenticated roles can neither read nor modify rows via
-- the API. Only the Dashboard (service_role, which bypasses RLS) can read the
-- inbox. So submissions are write-only from the app and never publicly listable.

-- Table-level privileges, made explicit (don't rely on Supabase's implicit
-- default grants -- a fresh DB / `supabase db reset` may lack them). Grant
-- INSERT only; never SELECT/UPDATE/DELETE to anon/authenticated.
grant insert on public.feedback to anon, authenticated;
