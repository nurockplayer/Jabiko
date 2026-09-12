-- Auth hardening: authenticated account data stays account-only.
--
-- Sign-in is optional for Jabiko, but synced practice attempts are not public.
-- RLS remains the authorization boundary: authenticated users may only read,
-- insert, or delete rows whose user_id matches auth.uid().

alter table public.attempts enable row level security;

drop policy if exists "attempts_select_own" on public.attempts;
create policy "attempts_select_own" on public.attempts
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "attempts_insert_own" on public.attempts;
create policy "attempts_insert_own" on public.attempts
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "attempts_delete_own" on public.attempts;
create policy "attempts_delete_own" on public.attempts
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);
