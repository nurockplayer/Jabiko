-- Signed-in account capture for feedback / question reports (#468).
--
-- When the submitter is logged in, record WHO sent the feedback so the owner
-- can triage or follow up -- WITHOUT letting the client control it and WITHOUT
-- changing the anonymous-first design. The account columns are filled by
-- server-side DEFAULTs that read the request's JWT (auth.uid() / auth.jwt()),
-- so a client can neither spoof another account nor omit its own. Anonymous
-- users have no user JWT, so the columns stay null. The optional `contact`
-- field is unchanged -- it is NEVER auto-filled with the account email; the
-- user types it (or leaves it blank) as before.
--
-- Also adds `wants_reply` (the "I'd like a reply" checkbox), which the client
-- DOES send.
--
-- HOW TO RUN (manual -- an agent has no Supabase project login):
--   • Supabase Dashboard → SQL Editor → paste this whole file → Run, OR
--   • supabase db push  (if the Supabase CLI is linked to the project).
-- Idempotent: safe to re-run. MUST be applied BEFORE the app code that writes
-- `wants_reply` goes live, or those inserts fail on the missing column.

alter table public.feedback
  add column if not exists auth_user_id     uuid    default auth.uid(),
  add column if not exists account_email    text    default (auth.jwt() ->> 'email'),
  add column if not exists account_provider text    default (auth.jwt() -> 'app_metadata' ->> 'provider'),
  add column if not exists wants_reply       boolean not null default false;

-- Re-create the INSERT policy: keep the existing validation and additionally
-- pin auth_user_id to the caller so a client cannot spoof another account.
-- (The DEFAULT already fills it; this rejects any client-sent mismatch.)
drop policy if exists "feedback_insert_any" on public.feedback;
create policy "feedback_insert_any" on public.feedback
  for insert
  with check (
    char_length(message) between 1 and 4000
    and char_length(coalesce(contact, '')) <= 200
    and category in ('wish', 'bug', 'other')
    and (auth_user_id is null or auth_user_id = auth.uid())
  );

-- No new grants needed: the existing `grant insert ... to anon, authenticated`
-- (migration 0002) covers the added columns. Still NO select / update / delete
-- policy, so the inbox stays write-only from the app -- read it in the Supabase
-- Dashboard (service_role bypasses RLS). Account columns are therefore never
-- exposed through the public API.
