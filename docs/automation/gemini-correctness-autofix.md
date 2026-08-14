# Gemini correctness autofix — owner / security runbook

> This document is an **owner / security runbook**: it describes how to roll out the merged
> Gemini correctness automation (#688 orchestration state machine + #689 publication adapter,
> wired up by the #690 workflow) from `off` → `observe` → manual `repair` → scheduled `repair`
> step by step, including rollout evidence, immediate-stop conditions and recovery, and orphan
> branch cleanup.
>
> This runbook **only describes the merged implementation (#690 / PR #736)**; it does not
> redesign any behavior. If this document disagrees with
> `.github/workflows/gemini-correctness-autofix.yml` or `scripts/gemini-correctness/**`, the
> workflow and scripts win — please report the discrepancy.

Related issues: #638 (parent), #688 (orchestration state machine), #689 (publication adapter),
#690 (workflow wiring), #691 (this runbook).

---

## 1. System overview

A single workflow: `.github/workflows/gemini-correctness-autofix.yml`
(name: `Gemini correctness autofix`), with two jobs:

- **`evaluate`** (Evaluate correctness (observe / repair))
  - read-only permissions: `contents: read` + `pull-requests: read`.
  - Runs #688's `runWorkflowOrchestration` state machine: open-PR gate → baseline →
    discovery → (repair mode only) RED → clean reset → GREEN.
  - `GEMINI_API_KEY` **is injected only into this job's `orchestrate` step**.
  - Outputs: `mode`, `publicationAllowed`, `status` as three job outputs.
- **`publish`** (Publish verified repair)
  - Runs only when `evaluate` outputs `publicationAllowed == 'true' && mode == 'repair'`
    (condition gate, workflow line 404).
  - Minimal write scopes: `contents: write` + `pull-requests: write`.
  - **Never sees the model secret**; it only calls #689's `publishVerifiedRepair`
    adapter and does not re-run the Gemini stage.
  - Behavior: re-validates the candidate → re-reads remote main and compares the baseline →
    creates a branch → a single commit → pushes → opens a **Draft PR**.

Triggers:

- `workflow_dispatch`: `mode` input (`observe` | `repair`, default `observe`).
  **The input can never adjust limits, model policy, or permissions.**
- `schedule`: fixed cron `17 19 * * *` (UTC 19:17 daily). Scheduled mode reads the repository
  variable `GEMINI_AUTOFIX_MODE`; missing/empty/unknown values are treated as `off` and
  safe-skip immediately after checkout (no Gemini call, no repo write).

Shared settings: `runs-on: ubuntu-latest`, `timeout-minutes: 30`, Node 22,
`pnpm/action-setup@v4` (10.33.0), `pnpm install --frozen-lockfile`,
concurrency group `gemini-correctness-autofix` (`cancel-in-progress: false`).

## 2. Repository settings (exact names)

Configure in GitHub repo **Settings → Secrets and variables → Actions**:

### Secret (`secrets.*`)

| Name | Purpose |
| --- | --- |
| `GEMINI_API_KEY` | Gemini REST API key (`AIza...`). Read only by the `evaluate.orchestrate` step. When missing, observe/repair **fail closed** (Gemini is not called). |

### Repository variables (`vars.*`)

| Name | Allowed values | Default behavior |
| --- | --- | --- |
| `GEMINI_AUTOFIX_MODE` | `off` \| `observe` \| `repair` | Read only by the **schedule** path; missing/empty/unknown → `off` (safe skip). The `workflow_dispatch` `mode` input takes precedence. |
| `GEMINI_AUTOFIX_MODEL` | must be in the model policy allowlist | allowlist: `gemini-2.5-flash`, `gemini-2.5-pro`, `gemini-2.5-flash-lite`. Missing/empty/unknown → **fail closed** (no implicit default). |
| `GEMINI_AUTOFIX_MIN_CONFIDENCE` | numeric, `[0,1]` | default `0.8`; **tighten-only**: cannot be below the code default. Non-numeric or out of range → fail closed. |
| `GEMINI_AUTOFIX_MAX_FILES` | integer, `[1,200]` | default `200`; hard cap `200` (**tighten-only**; the variable can never loosen it). |
| `GEMINI_AUTOFIX_MAX_LINES` | integer, `[1,250]` | default `250`; hard cap `250` (**tighten-only**). |

> These limits/model/secret are all validated **fail-closed** by the workflow's `orchestrate`
> step (model policy allowlist + tighten-only numeric limits + secret-missing fail closed); any
> non-compliant value fails the `evaluate` job and marks `config-error`, producing **no**
> candidate and no publish.

### Fixed constants (in code, cannot be loosened by variables)

- GREEN hard budgets (`policy.mjs`): `MAX_GREEN_PRODUCTION_FILES = 3`,
  `MAX_GREEN_DIFF_LINES = 250`.
- Prompt caps (`prompt-builder.mjs`): `MAX_TOTAL_CHARS = 500_000`,
  `MAX_PROJECT_RULES_CHARS = 100_000`; `DEFAULT_MODEL = "gemini-2.5-flash"`.
- Gemini client (`gemini-client.mjs`): `DEFAULT_TIMEOUT_MS = 30_000`,
  `DEFAULT_MAX_RETRIES = 2`; retryable HTTP `429, 500, 502, 503, 504`;
  exponential backoff (1s, 2s, 4s… capped at 30s).
- Path policy (`policy.mjs`): allowlist `src/domain/**` + `src/hooks/**`;
  a broad set of protected paths (`.github/`, `.env*`, `package.json`, `src/i18n.ts`,
  `src/domain/types.ts`, `src/domain/contentGuard.ts`, `src/domain/exam/items/`,
  `scripts/exam-batches/`, `supabase/`, `public/`, `vite.config.ts` …).

## 3. Four-phase rollout

### Phase 1 — manual observe (scheduled mode stays `off`)

1. Set the secret `GEMINI_API_KEY` (required).
2. **Do not** set `GEMINI_AUTOFIX_MODE` (or keep it `off`) → the daily cron only
   safe-skips; it will never call Gemini or write the repo on its own.
3. Set the remaining variables (`GEMINI_AUTOFIX_MODEL` etc.); you may leave them all blank
   initially and let the code use the tighten-only defaults.
4. Manually run **`workflow_dispatch` → mode = `observe`** (1–2 times) and verify:
   - The step summary shows `Status: observed` (or `no-finding` / a fail-closed reason).
   - The `gemini-correctness-results` artifact contains only allowlisted files.
   - **No** branch / commit / PR was created.
5. Review the discovery artifact quality; don't switch to repair yet.

Evidence threshold (before entering Phase 2):

- [ ] At least 1 successful manual observe with a reasonable finding (or a credible no-finding).
- [ ] The step summary shows no secrets, env values, absolute runner paths, or raw model responses.
- [ ] Confirmed no branch/PR was created by observe.

### Phase 2 — scheduled observe (owner opt-in)

1. Set `GEMINI_AUTOFIX_MODE = observe` (this is the owner's explicit opt-in signal).
2. Wait 1–2 cron periods (`17 19 * * *`) and verify:
   - The scheduled run's `mode` is indeed `observe` (step summary `## Gemini correctness observe`).
   - `evaluate` produces artifacts normally; the `publish` job does not run.
   - No branch/commit/PR.
3. If a scheduled run shows `mode=off`, check that the variable name is spelled correctly and stored at repo level.

Evidence threshold (before entering Phase 3):

- [ ] At least 2 consecutive scheduled observe periods run cleanly.
- [ ] The findings accumulated in observe are good enough to judge whether a candidate is worth fixing.
- [ ] No unexpected publish, no branch/PR, no sign of secret leaks.

### Phase 3 — manual repair (fixture-backed Draft PR + independent review)

> `repair` only opens **Draft** PRs. A human independent review is required before merging; the
> workflow **does not auto-approve / auto-merge**.

1. Keep `GEMINI_AUTOFIX_MODE = observe` (schedule stays in observe; do not schedule repair).
2. Manually run **`workflow_dispatch` → mode = `repair`**. Flow:
   - `evaluate`: open-PR gate → baseline (`pnpm lint` / `typecheck` / `test` /
     `build` / `git diff --check`) → discovery → RED (fixture-backed: writes a test patch in
     `.tmp`; both the initial run and the replay are replay-confirmed) → clean
     reset → GREEN (production diff constrained by the hard `3 files / 250 lines` budget).
   - `evaluate` produces a sanitized `candidate` (with the production diff and the regression
     test source embedded), `publicationAllowed=true`.
   - `publish`: re-validates the candidate → re-reads remote main and compares with `baselineSha` →
     branch → single commit → push → **one Draft PR**.
3. Expected branch / commit / PR contract:
   - Branch: `gemini/auto-fix-<runId>` (`runId` is a slugified `GITHUB_RUN_ID`,
     max 80 chars; fixed prefix `gemini/auto-fix-`).
   - Commit: **exactly one**, message `fix: <findingTitle>` (≤140 chars, control characters
     stripped), content = regression test (`.regression.test.ts` / `.regression.test.tsx`,
     same directory as the production file) + allowlisted production diff; **no** `.tmp/**`,
     raw, or secret content.
   - PR: **Draft** (`draft: true`), title `fix: <findingTitle>`, body deterministically generated
     from validated candidate fields, including RED/GREEN evidence, checks, stats, branch, run
     URL, model. The body never concatenates raw model Markdown.
4. **Independent review**: an owner / second person independently reviews the Draft PR's changes;
   merge manually only after approval. First check whether the regression test truly reproduces,
   whether the production diff only touches finding-related files, and whether there are leaks or
   test tampering.

Evidence threshold (before entering Phase 4):

- [ ] At least 1 manual repair produced a Draft PR whose branch/commit/diff matches the above contract.
- [ ] The Draft PR went through human independent review and was (optionally) merged, with no scope escape / test tampering / secret leak.
- [ ] No invalid/failed run during the process left an orphan branch or an unexpected PR.

### Phase 4 — scheduled repair (prior evidence passed + explicit owner opt-in)

1. Enable only after all three previous phases' evidence passes and the owner **explicitly** sets
   `GEMINI_AUTOFIX_MODE` to `repair`.
2. Set `GEMINI_AUTOFIX_MODE = repair`; every day at `17 19 * * *` it will:
   - Run the full discover → RED → GREEN; only if it passes is `publicationAllowed=true`.
   - `publish` opens one Draft PR only when that condition holds.
3. After each scheduled repair cycle, the owner should check:
   - Whether there is a new Draft PR (**at most one**) matching the contract.
   - No new PR = no-finding / fail-closed, **not** a problem.
4. **Rollback condition**: if any run violates this runbook's stop condition (see §4), immediately
   set `GEMINI_AUTOFIX_MODE` back to `observe` (or `off`) → return to a lower phase to re-accumulate evidence.

## 4. Per-run acceptance

Verify after each run (manual or scheduled):

1. **baseline SHA matches current main**: `evaluate`'s baseline = `git rev-parse
   HEAD` (current main after checkout); `publish` re-reads remote main before writing and, if it
   differs from `candidate.baselineSha` → `baseline-stale`, zero writes.
2. **no-finding / failure creates no branch/commit/PR**: only a `repair-verified`
   run with `publicationAllowed=true` enters `publish`.
3. **a successful repair creates at most one Draft PR**, with branch/commit/diff matching the §3
   contract (`gemini/auto-fix-<runId>`, single commit, allowlisted diff + regression test).
4. **No secrets / env values / absolute runner paths / raw model responses** appear in
   summaries, artifacts, or PR bodies (redaction + scrub enforced; see §6).
5. **No auto-approve / auto-merge**: Draft PRs are merged only after human review.

## 5. Immediate-stop conditions and recovery

When any of the following happens: **stop immediately** (cancel the in-flight run, set the mode
back to `off` / `observe`), recover per the table, log the event, and don't restart until the
root cause is confirmed.

| Situation | Stop action | Recovery |
| --- | --- | --- |
| **Suspected secret leak** (`AIza...`, `ghp_...`, `sk-...`, `AKIA...`, env values appear in step summary / artifact / PR body) | cancel the run immediately; close/delete the PR and branch | revoke and rotate `GEMINI_API_KEY` in GitHub **Settings → Secrets**; check the Actions run log (official logs mask secrets, but don't rely on it); review that run's artifact download permissions; restart only after finding the leak source |
| **Scope escape or test tampering** (production diff touches protected/non-allowlisted paths, or the regression test was rewritten so it doesn't really fail) | cancel the run; don't merge; close the PR | check the `publication-adapter` candidate validation failure reason (`invalid-candidate`); confirm the GREEN hard caps (3 files / 250 lines) and the allowlist; retry only after manually rebuilding the repro |
| **Stale-baseline publication** (`publish` reports `baseline-stale`) | the system already fail-closed with zero writes; no extra action | confirm the gap between remote main and the candidate; re-run repair once (it picks up the latest main as the baseline) |
| **Multiple PRs / orphan branch** (one run produced >1 PR, or a `gemini/auto-fix-*` branch with no PR) | stop subsequent runs; don't delete the branch directly | first run `gh pr list` to check **all open PRs' head branches and owners** (see §6 cleanup), confirm a branch truly has no open PR and belongs to this automation before deleting; use `gh pr close <n> --delete-branch` or `git push origin --delete`, **never force push** |
| **Publish despite failed checks** (baseline or GREEN checks failed yet a PR was produced) | close that PR immediately and flag it | this is a serious contract violation: check whether `evaluate` actually completed all five baseline items (lint/typecheck/test/build/diff-check) and the `publicationAllowed` gate; ban scheduled repair until the root cause is confirmed |
| **Workflow cancellation** (run cancelled / blocked by concurrency) | `cancel-in-progress: false`, existing runs aren't auto-cancelled; manually confirm no half-finished output | check whether the run left a branch (pushed before cancellation); if so, clean up per §6; re-trigger once |
| **Missing artifact** (`publish` can't find `command-summary.json` or the candidate) | system fail-closed (`invalid-candidate`) | re-check whether `evaluate`'s artifact upload succeeded (`if-no-files-found: warn`); when a stage artifact is missing, only the sanitized summary is uploaded; re-run the run |
| **Gemini quota / API failure** (429 / 5xx / timeout / network) | the client retries (429/5xx/network/timeout); non-retryable (400/401/403) stops immediately | confirm `GEMINI_API_KEY` quota; check `quota-api-error` / `finding-rejected` status; error messages are truncated + redacted and won't contain raw bodies or the key; also check the model allowlist before retrying |
| **GitHub outage** (`gh` / API failure) | the adapter has bounded retry (3 attempts), no infinite retry; still failing → fail closed | wait for GitHub to recover and re-trigger; check whether a push succeeded but PR creation failed, leaving a branch (`publication-cleaned-up` / `cleanup-failed` status; the latter = orphan, clean up per §6) |

## 6. Orphan branch cleanup (no force push)

Scenario: push succeeded but PR creation failed (the adapter itself tries to clean up **this run's
branch**; success → `publication-cleaned-up`, failure → `cleanup-failed` and an orphan is left); or
a run was cancelled after pushing.

Safe cleanup flow (**check open-PR ownership before deleting**):

1. List all open PRs and confirm the head branch of each `gemini/auto-fix-*` branch:
   ```bash
   gh pr list --state open --json headRefName,author,number
   ```
2. Delete a branch only when it has **no open PR pointing at it** (or is confirmed to be an orphan
   left by this automation).
3. Delete with one of these, **never force push**:
   ```bash
   gh pr close <number> --delete-branch   # has an open PR and confirmed to close
   git push origin --delete gemini/auto-fix-<runId>   # pure orphan branch
   ```
4. After deletion, confirm `gh pr list` / `git ls-remote --heads origin` has no residue.

## 7. Leak prevention and redaction guarantees (built into the implementation)

- `discover.mjs` / `workflow-orchestrator.mjs` / `publication-adapter.mjs` share
  `redactForOutput` (redacts `AIza...` + exact secrets), then layer pattern scrubbing:
  `ghp_*`, `sk-*`, `AKIA*`, env-dump assignments (`KEY=value`), absolute POSIX paths
  (`/tmp|/var|/home|/Users|/etc|/usr|/opt|/root|/private|/Applications|/Library`).
  URLs (`https://...`) are unaffected.
- `gemini-client.mjs`: the API key never enters logs / errors / artifacts; errors truncate the
  response body and redact the key; timeout + bounded retry.
- Artifact upload only allows allowlisted files: `finding.json`, `red-result.json`,
  `repair-result.json`, `command-summary.json`, `publication-result.json`
  (7-day retention). Raw prompt / response / env dump / headers / debug log / patch / source
  archive are never uploaded.
- The PR body is deterministically generated from validated candidate fields; narrative fields
  (title, root cause, fix summary, test name) are scrubbed and control characters flattened, so
  no Markdown structure or secret can be injected.

## 8. Rollout decision quick reference

| Phase | `GEMINI_AUTOFIX_MODE` | Trigger | Possible output |
| --- | --- | --- | --- |
| 1. manual observe | (leave blank / `off`) | manual `workflow_dispatch: observe` | artifacts + summary only |
| 2. scheduled observe | `observe` | cron `17 19 * * *` | artifacts + summary only |
| 3. manual repair | `observe` (schedule stays observe) | manual `workflow_dispatch: repair` | ≤1 Draft PR |
| 4. scheduled repair | `repair` | cron `17 19 * * *` | ≤1 Draft PR per cycle |

Any stop condition triggers → set the mode back to `observe` or `off` → re-run Phase 2/3 to
accumulate evidence before considering Phase 4 again.

---

_This runbook corresponds to the merged implementation #690 (PR #736). Any behavior description
takes `.github/workflows/gemini-correctness-autofix.yml` and `scripts/gemini-correctness/**` as
authoritative._
