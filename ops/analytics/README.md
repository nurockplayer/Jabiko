# ops/analytics — Jabiko production analytics automation (#745)

Repository-owned operator tooling for the remaining Cloudflare Zaraz → GA4
production setup and verification in #745.

The application-side analytics code is already in the repository. These tools
manage and verify the external production configuration without committing
credentials or inventing unsupported GA4 reporting behavior.

## Operator interface

```bash
./ops/analytics/bin/plan          # read-only discovery + desired-state diff + gates
./ops/analytics/bin/apply         # idempotent production reconciliation
./ops/analytics/bin/smoke         # published-config + production traffic verification
./ops/analytics/bin/google-auth   # inspect/set up Google GA4 access
```

Run from the repository root. `plan` never writes. `apply` snapshots the
published Zaraz export in `ops/analytics/state/` with mode `0600` before any
mutation and refuses to remove a second analytics client unless
`--yes-remove-gtag` is explicit.

## Evidence contract

The smoke intentionally separates evidence by what each official surface can
actually prove.

| Surface | What it proves | What it does **not** claim |
|---|---|---|
| Production HTML | Zaraz is injected on `jabiko.app` | GA4 delivery or event payload correctness |
| Zaraz `GET /workflow` | zone workflow is `realtime` or `preview` | production publication by itself |
| Zaraz `GET /export` | current **published** config, including secrets | a newer preview is live |
| GA4 Admin API | intended property/stream + four event-scoped custom dimensions exist | recent event delivery |
| GA4 Realtime Data API | recent `page_view` / `promo_click` event names reached GA4 | session identity, route path, placement/action/custom-event values |
| Zaraz Debug Mode, human gate | the guided interaction carries the seven expected placement/action payloads and fires the GA4 actions | unattended API verification |

### Why Realtime is deliberately narrow

For a standard GA4 property, `runRealtimeReport` is limited to the latest 30
minutes. The Realtime schema supports `eventName` and `eventCount`, but does
not expose `sessionId`, `pagePath`, or event-scoped `customEvent:*` dimensions.
The smoke therefore hard-limits every Realtime request to:

```text
dimension: eventName
metric:    eventCount
window:    <= 30 minutes
```

The code rejects unsupported Realtime dimensions before issuing a network
request.

### Why placement/action is one human gate

Two documented API alternatives were evaluated:

- GA4 Core Reporting (`runReport`) supports event-scoped `customEvent:*`
  dimensions, but Core report data is processed/aggregated and is not a
  reliable immediate proof of one just-completed guided interaction.
- Cloudflare Zaraz Monitoring API can report events, pageviews, triggers,
  actions, and server-side request statuses, but its documented datasets are
  monitoring/aggregate surfaces and do not provide a supported contract for
  querying all seven arbitrary `placement` values and correlating them to one
  guided visitor interaction.

Rather than turn either limitation into a false automated PASS, `smoke` keeps
one explicit `HUMAN_GATE:PRODUCTION_INTERACTION`. Run:

```bash
./ops/analytics/bin/smoke --placement-action-verified
```

The command first captures a supported GA4 Realtime `eventName` baseline, then
prints the guided sequence and watches for a new `page_view` / `promo_click`
count delta. During that same watch, enable Cloudflare Zaraz Debug Mode and
verify the seven payload/action pairs. The flag is the operator attestation for
that debugger observation; it never causes Realtime to query unsupported fields.
Pre-existing ambient traffic cannot satisfy the automated check because only
the post-baseline count delta is evaluated.

## Human gates

| Gate | When | Minimum scope / action |
|---|---|---|
| `HUMAN_GATE:CLOUDFLARE_AUTH` | no usable Zaraz token | `Zone > Zaraz : Edit` + `Zone > Zone : Read`, restricted to `jabiko.app` |
| `HUMAN_GATE:CLOUDFLARE_PUBLISH` | preview config changed but API publish cannot run | publish in Zaraz History, or use a token with `Zone > Zaraz : Admin` for the publish call only |
| `HUMAN_GATE:GOOGLE_OAUTH` | no GA4 access | Analytics Admin/Data read; edit is needed when `apply` creates dimensions |
| `HUMAN_GATE:GA4_PROPERTY_AMBIGUITY` | several plausible GA4 properties | select the intended Jabiko production property |
| `HUMAN_GATE:PRODUCTION_INTERACTION` | placement/action production proof | one guided production interaction with Zaraz Debug Mode |

`CLOUDFLARE_PUBLISH` is intentionally separate from normal Cloudflare auth.
Cloudflare accepts Zaraz Edit/Read/Admin for workflow reads, while the publish
endpoint requires Zaraz Admin. The normal token does not need to be broadened
unless automated preview publication is desired.

## Credentials

Credentials stay outside git. Tokens are never printed.

`ops/analytics/.env.example` is a **variable-name reference only**. The
operator wrappers do not auto-load `ops/analytics/.env` and do not shell-source
`.env.example`. Export credentials in the shell, which matches the executable
behavior:

```bash
export CLOUDFLARE_API_TOKEN=...
export GA4_ACCESS_TOKEN=...
# or: export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
```

### Cloudflare

Normal `plan`/`apply`/`smoke` operation uses a zone-scoped token with Zaraz Edit
and Zone Read. If the zone is in Preview & Publish and `apply` changed the
config, automated publication additionally requires Zaraz Admin. If publish
fails, `apply` exits non-zero and gives the precise manual publish gate.

The existing Wrangler OAuth login may be used for account/zone discovery, but
it does not provide Zaraz mutation permission.

### Google

Any one of:

1. exported `GA4_ACCESS_TOKEN` for a one-shot run;
2. exported `GOOGLE_APPLICATION_CREDENTIALS` pointing at a service-account JSON;
3. `ops/analytics/.secrets/gcp-service-account.json`;
4. `ops/analytics/.secrets/google-oauth.json`;
5. gcloud ADC, including the Docker helper in `docker-compose.yml`.

Use `./ops/analytics/bin/google-auth` to inspect the active source without
printing secret values.

## Apply workflow and production publication

```bash
./ops/analytics/bin/plan
./ops/analytics/bin/apply
./ops/analytics/bin/smoke
```

`apply` follows these publication rules:

1. Resolve the zone.
2. `GET /settings/zaraz/workflow`. Any read failure or unknown value fails
   closed before a mutation. It never assumes `realtime`.
3. Read the mutation base from `GET /settings/zaraz/export` only. This is the
   current **published** configuration and retains secret variable values.
4. Build and PUT only the desired delta.
5. If workflow is `preview`, production completion requires successful
   `POST /settings/zaraz/publish`. Publish failure is a non-zero human gate.
6. Re-read `/export` and require the **published** configuration to converge.
   `/config` is not accepted as production proof because Cloudflare documents
   it as the latest config, which may be preview or published.
7. Reconcile the four GA4 event-scoped custom dimensions independently.

A preview-only change is never reported as production success.

## Desired state

- One GA4 managed tool (`google-analytics-4`) with the intended Measurement ID.
- Custom-event triggers forward `page_view` and `promo_click`.
- One `track` action per event.
- No automatic page-view action in parallel with Jabiko's explicit SPA
  `page_view`.
- `promo_click` parameters remain `promoId`, `action`, `placement`, `locale`.
- Event-scoped GA4 custom dimensions exist for those four fields.
- A second analytics client is reported and is only removed with explicit
  `--yes-remove-gtag`.

## Smoke coverage

`smoke` requires all of the following before exit 0:

1. production Zaraz injection;
2. readable `realtime|preview` workflow;
3. converged **published** Zaraz `/export`;
4. all four GA4 custom dimensions registered;
5. GA4 Realtime captures a baseline, then shows a new delta of at least two
   `page_view` and seven `promo_click` events during the guided watch, using
   only `eventName` + `eventCount` and a <=30-minute window;
6. during that same watch the operator completes the single Zaraz Debug Mode
   placement/action verification under `--placement-action-verified`.

Step 5 is deliberately an event-arrival delta, not a session identifier. It
does not claim route/session identity or page-view deduplication because those
dimensions are not available on the supported Realtime surface used here.

## Tests

```bash
node --test ops/analytics/test/
pnpm lint
pnpm typecheck
pnpm build
git diff --check
```

The contract suite includes regressions for the Realtime 30-minute limit,
forbidden Realtime dimensions, workflow-read fail-closed behavior, preview
publication, published-state verification, and `.env` documentation/runtime
agreement.

## Security notes

- No production credential is used by the test suite; HTTP is stubbed.
- `.env`, `.secrets/`, and `state/` are gitignored.
- Published Zaraz snapshots may contain secrets and are written mode `0600`.
- A full config PUT is never based on secret-stripped `/config`.
- `/export` failure is fatal; there is no destructive fallback.
- No `curl | bash`, no remote one-shot executor, and no new package dependency.
