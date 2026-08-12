# ops/analytics — Jabiko production analytics automation (#745)

Automates the Cloudflare Zaraz → GA4 production setup and smoke verification for
issue #745 (measure the Stay.D funnel without a second analytics stack).

The repository code for #745 is merged (PR #756). This tool automates the
**remaining production configuration steps** that used to be manual dashboard
work:

1. discover the jabiko.app Cloudflare zone and its Zaraz config;
2. diff it against the #745 desired state;
3. apply only the missing/incorrect bits (GA4 tool + triggers + actions, no
   duplicate page views, event-scoped custom dimensions);
4. smoke-verify real production traffic against GA4 Realtime.

## Operator interface

```bash
./ops/analytics/bin/plan          # read-only: discover + desired-state diff + gates
./ops/analytics/bin/apply         # idempotent: apply only missing/incorrect config
./ops/analytics/bin/smoke         # production verification (config + real traffic)
./ops/analytics/bin/google-auth   # inspect/set up Google GA4 access
```

Run everything from the repository root. `plan` never writes; `apply` takes a
Zaraz-config snapshot in `ops/analytics/state/` before every mutation
(gitignored) and refuses to delete a second analytics client without
`--yes-remove-gtag`.

## Human gates (the only things this automation will ask you for)

| Gate | When | Minimum scope | Unlocks |
|------|------|---------------|---------|
| `HUMAN_GATE:CLOUDFLARE_AUTH` | No `CLOUDFLARE_API_TOKEN` with Zaraz permission | Zone:Zaraz Edit + Zone:Read, scoped to jabiko.app | Reading/mutating the Zaraz config |
| `HUMAN_GATE:GOOGLE_OAUTH` | No GA4 access | analytics.readonly (+ edit for apply) on the Jabiko property | Property discovery, Measurement ID, custom dimensions, Realtime checks |
| `HUMAN_GATE:GA4_PROPERTY_AMBIGUITY` | Several plausible GA4 properties | read access to the candidates | A single Measurement ID |
| `HUMAN_GATE:PRODUCTION_INTERACTION` | Real-traffic smoke | one normal visitor session | Realtime proof the funnel reaches GA4 |

Values that can be discovered programmatically are never asked for.

## Credentials

Credentials live **outside git** — no token, key, or cookie is ever committed.

- **Cloudflare**: create a scoped API token in the Cloudflare dashboard
  (My Profile → API Tokens → Create Token → "Edit zone DNS"/custom, add
  `Zone > Zaraz : Edit` and `Zone > Zone : Read` for the `jabiko.app` zone).
  Export it: `export CLOUDFLARE_API_TOKEN=…`.
  - The existing `wrangler` OAuth login is auto-detected and used for zone
    discovery, but it only has `account:read`/`zone:read` and **cannot** read
    or write Zaraz — that part needs the scoped token.
- **Google**: any one of
  1. `export GA4_ACCESS_TOKEN=…` (one-shot);
  2. a service-account JSON (see below) via `GOOGLE_APPLICATION_CREDENTIALS`;
  3. `ops/analytics/.secrets/gcp-service-account.json` or
     `ops/analytics/.secrets/google-oauth.json`;
  4. ADC from `gcloud auth application-default login`:
     ```bash
     docker compose -f ops/analytics/docker-compose.yml run --rm gcloud
     ```
     (Docker only — no host `gcloud` needed. The ADC lands in
     `ops/analytics/state/gcloud/`.)

  Run `./ops/analytics/bin/google-auth` to check which source is active and get
  exact setup steps. Service-account flow is pure Node (RSA JWT) — no Docker
  required.

## Workflow

```bash
./ops/analytics/bin/plan
# → diff + gates; nothing mutated
./ops/analytics/bin/apply                 # needs CLOUDFLARE_API_TOKEN (+ Google for the Measurement ID / dims)
./ops/analytics/bin/apply --dry-run       # preview without writing
./ops/analytics/bin/smoke                 # production verification
```

### Desired state applied by `apply`

- GA4 is downstream of **Zaraz only** — no gtag/GTM/second analytics client
  (a second client is reported and only removed with `--yes-remove-gtag`).
- The GA4 managed tool (`google-analytics-4`) uses the Jabiko Measurement ID.
- Custom-event triggers forward `page_view` and `promo_click`; one `track`
  action per event with `data.en` = the event name.
- The automatic page-view action is **not** enabled — Jabiko's explicit SPA
  `page_view` stays authoritative, so one logical page view per SPA navigation.
- `promo_click` parameters are exactly `promoId`, `action`, `placement`,
  `locale` (the app-side allowlist in `src/lib/analytics.ts` already enforces
  this).
- Event-scoped GA4 custom dimensions exist for those four fields (idempotent,
  never duplicated).

### Smoke coverage

1. Zaraz is injected on jabiko.app (no credentials).
2. Zaraz config has the GA4 tool, both triggers, both actions, no automatic
   page view.
3. The four GA4 custom dimensions exist.
4. Real traffic: the operator performs one guided set of Stay.D clicks
   (`HUMAN_GATE:PRODUCTION_INTERACTION`); the script watches GA4 Realtime and
   verifies `page_view` (Home + /stay-d), all seven placements, and the
   `airbnb`/`video` action semantics, and flags any session with suspicious
   duplicate page views.

## Tests

Pure logic (diff, idempotency, redaction, duplicate-dimension prevention, safe
config mutation) is unit-tested with Node's built-in runner — no extra deps:

```bash
node --test ops/analytics/test/*.test.mjs
```

## Security notes

- Tokens are resolved into opaque objects; every printed value passes through
  `redact()` (`src/creds.mjs`). `plan`/`apply`/`smoke` never print secrets.
- `apply` snapshots the Zaraz config to `ops/analytics/state/` (gitignored)
  before mutation, with owner-only file permissions. The mutation base is read
  from the **export** endpoint (secret variable values included) so a full-config
  PUT never clobbers unrelated secrets; it falls back to `/config` (secrets
  excluded) with a warning when export is unavailable.
- No `curl | bash`, no one-shot remote executors, no new dependencies.
- The GA4 workflow stays the documented Admin + Data APIs only.

## Known limitations

- If the zone uses Zaraz's **Preview & Publish** workflow, the API applies to
  preview and the tool attempts the publish endpoint; if that endpoint is not
  exposed it tells you to publish in the dashboard History page.
- `apply` builds the from-scratch tool/trigger shapes from Cloudflare's
  documented schema; `plan` probes the live config first and `apply` mirrors
  existing shapes when a GA4 tool is already present, so the two only diverge
  on a truly empty zone.
- Realtime param-level smoke checks need the GA4 custom dimensions registered
  first (run `apply` once with Google access).
