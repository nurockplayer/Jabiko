-- Reproducibility diagnostics for anonymous feedback (#654).
--
-- Vague reports ("排版亂掉" / "ne 發音怪怪的") can't be reproduced without the
-- render environment. General feedback now attaches a small, content-free blob
-- (route / build / viewport / browser / os / pwa / furigana / tts voice+rate,
-- and question id+type when in the practice flow) in a DEDICATED column -- never
-- mixed into `message`. The client (src/domain/diagnostics.ts) is the privacy
-- gate: no raw UA, IP, arbitrary storage, other-page content or question text.
--
-- HOW TO RUN (manual -- an agent has no Supabase project login):
--   • Supabase Dashboard → SQL Editor → paste this whole file → Run, OR
--   • supabase db push  (if the Supabase CLI is linked to the project).
-- Idempotent: safe to re-run.
--
-- No new grant: INSERT was granted table-level in 0002, which already covers a
-- new column. Old rows keep diagnostics = NULL; the client omits the key for
-- per-question reports and older callers, so their row shape is unchanged.

alter table public.feedback
  add column if not exists diagnostics jsonb;

-- Re-create the insert policy to add a size bound on the blob, so the column
-- can't be abused as free storage. (Same validation as 0002, plus the clause.)
drop policy if exists "feedback_insert_any" on public.feedback;
create policy "feedback_insert_any" on public.feedback
  for insert
  with check (
    char_length(message) between 1 and 4000
    and char_length(coalesce(contact, '')) <= 200
    and category in ('wish', 'bug', 'other')
    and (diagnostics is null or char_length(diagnostics::text) <= 4000)
  );
