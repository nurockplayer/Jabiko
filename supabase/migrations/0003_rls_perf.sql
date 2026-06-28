-- Supabase advisor follow-ups (#294 Phase 1): RLS performance + SECURITY DEFINER
-- exposure. NO schema/data change — only re-defines the `attempts` RLS policies
-- and tightens execute on a leftover helper function.
--
-- HOW TO RUN (manual — an agent has no Supabase project login):
--   • Supabase Dashboard → SQL Editor → paste this whole file → Run, OR
--   • supabase db push  (if the Supabase CLI is linked to the project).
-- Idempotent: safe to re-run.
--
-- 1) PERFORMANCE — wrap auth.uid() in a scalar subselect.
--    `auth.uid() = user_id` re-evaluates the auth helper once PER ROW; the
--    advisor-recommended `(select auth.uid()) = user_id` evaluates it ONCE per
--    statement (Postgres treats the uncorrelated subselect as an initplan).
--    Semantics are identical; only the per-row cost goes away. Fixes the
--    "auth_rls_initplan" warnings on attempts_{select,insert,delete}_own.

drop policy if exists "attempts_select_own" on public.attempts;
create policy "attempts_select_own" on public.attempts
  for select using ((select auth.uid()) = user_id);

drop policy if exists "attempts_insert_own" on public.attempts;
create policy "attempts_insert_own" on public.attempts
  for insert with check ((select auth.uid()) = user_id);

drop policy if exists "attempts_delete_own" on public.attempts;
create policy "attempts_delete_own" on public.attempts
  for delete using ((select auth.uid()) = user_id);

-- 2) SECURITY — `public.rls_auto_enable()` is a SECURITY DEFINER function that
--    lives only in the live DB (it is NOT defined by any repo migration — part
--    of the schema drift noted in #294). It is an internal helper, never called
--    as a client RPC, so anon/authenticated have no reason to EXECUTE it.
--    Guarded so a fresh DB / `supabase db reset` (where the function is absent)
--    is unaffected.
do $$
begin
  if exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'rls_auto_enable'
  ) then
    revoke execute on function public.rls_auto_enable() from anon, authenticated, public;
  end if;
end $$;
