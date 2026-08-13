# Jabiko analytics (Cloudflare Zaraz)

Jabiko uses one privacy-bounded application analytics path:

```text
trackEvent(...) → window.zaraz.track(...) → Cloudflare Zaraz → GA4
```

Application code never calls `gtag`, Google Tag Manager, or a GA SDK directly.
The environment gate remains `VITE_ZARAZ_ENABLED === "true"` in production;
development and tests are no-op by design.

## Event contract

`src/lib/analytics.ts` exposes the typed `trackEvent(name, payload)` helper.
Payloads are flat metadata allowlists. They must not contain question text,
learner answers, email, raw user IDs, arbitrary URLs, or other free-form PII.

The current events are:

| Event | Purpose |
|---|---|
| `page_view` | top-level SPA view changes |
| `practice_started` | practice entry |
| `answer_submitted` | coarse answer result metadata |
| `practice_completed` | finite practice completion |
| `study_page_viewed` | grammar/study surface view |
| `level_changed` | target/session level change |
| `locale_changed` | UI locale change |
| `weak_review_started` | weak-point review entry |
| `article_viewed` | published article display |
| `promo_click` | Stay.D promotion interaction |

### `promo_click`

`promo_click` measures interest in a promoted destination, never a booking or
purchase. Its payload is bounded to:

- `promoId`: approved promotion identifier, currently `stay-d`;
- `action`: `airbnb` or `video`;
- `placement`: one of the seven stable Stay.D funnel placements;
- `locale`: active UI locale.

The seven placements are:

```text
home-airbnb
home-video
home-video-airbnb
stay-d-hero-airbnb
stay-d-video
stay-d-video-airbnb
stay-d-final-airbnb
```

The type system rejects ad-hoc destination URLs, arbitrary strings, and extra
payload keys. Tracking is fire-and-forget and must never block navigation,
video opening, or the outbound Airbnb link.

## GA4 through Zaraz

GA4 is downstream of Zaraz only. The production Zaraz desired state is:

- one native Google Analytics 4 managed tool with the intended Measurement ID;
- explicit `page_view` and `promo_click` custom-event triggers/actions;
- no second gtag/GTM analytics client;
- no automatic page-view action that would double-count Jabiko's explicit SPA
  `page_view`;
- event-scoped GA4 custom dimensions for `promoId`, `action`, `placement`, and
  `locale`.

## Production operator tooling

Repository-owned tooling lives under `ops/analytics`:

```bash
./ops/analytics/bin/plan
./ops/analytics/bin/apply
./ops/analytics/bin/smoke
./ops/analytics/bin/google-auth
```

See `ops/analytics/README.md` for the full runbook. That README is authoritative
for production credentials, publication workflow, and smoke evidence.

### Cloudflare publication contract

Production status is never inferred from a successful config write alone.

1. `GET /settings/zaraz/workflow` must succeed and return `realtime` or
   `preview`. A lookup failure fails closed.
2. Mutations are based on the secret-complete published `/export` payload.
3. In `preview` workflow, a changed config is not production-complete until
   `POST /settings/zaraz/publish` succeeds. The publish API requires Zaraz
   Admin. If that permission is unavailable, tooling returns the explicit
   `HUMAN_GATE:CLOUDFLARE_PUBLISH` instead of reporting success.
4. Post-mutation verification reads `/export` again because Cloudflare defines
   that surface as the current published configuration. `/config` may represent
   a newer preview and is not accepted as proof that production changed.

### Production smoke evidence

The smoke deliberately uses each official surface only for evidence it can
support:

| Surface | Responsibility |
|---|---|
| production HTML | prove Zaraz injection |
| Zaraz workflow + `/export` | prove workflow is known and desired config is published |
| GA4 Admin API | prove property/stream and custom-dimension registration |
| GA4 Realtime Data API | prove a new `page_view` / `promo_click` count delta reached GA4 during the guided watch |
| Zaraz Debug Mode | one human verification of the seven placement/action payloads and GA4 action firings |

For a standard GA4 property, this smoke constrains Realtime to a maximum
30-minute window and requests only:

```text
dimension: eventName
metric:    eventCount
```

It never requests `sessionId`, `pagePath`, or event-scoped `customEvent:*`
dimensions from `runRealtimeReport`. The helper rejects those dimensions before
issuing a request.

The smoke first captures a Realtime baseline, then watches for a new delta of at
least two `page_view` and seven `promo_click` events while the guided interaction
runs. This prevents pre-existing ambient traffic from satisfying the automated
check by itself. The delta is still an event-arrival signal, not a session ID or
route-level proof.

### Why placement/action remains one human gate

Two documented automated alternatives were evaluated and intentionally not
used as a false success condition:

- GA4 Core Reporting supports event-scoped `customEvent:*` dimensions, but Core
  report data is processed/aggregated and is not a reliable immediate proof of
  one just-completed guided interaction.
- Cloudflare Zaraz Monitoring exposes event/action/status monitoring datasets,
  but its documented API does not provide a contract for retrieving all seven
  arbitrary placement values and correlating them to one guided visitor.

Therefore the only placement/action gate is Cloudflare Zaraz Debug Mode. Run:

```bash
./ops/analytics/bin/smoke --placement-action-verified
```

The command captures the Realtime baseline first, then prints the guided
interaction. During the watch, inspect the seven `promo_click` payload/action
pairs in Zaraz Debug Mode. The flag is the operator attestation for that manual
observation; it does not enable unsupported GA4 queries.

## Credentials

Do not commit GA4 or Cloudflare tokens, cookies, keys, or account identifiers.
`ops/analytics/.env.example` is only a variable-name reference. The operator
wrappers do **not** auto-load `ops/analytics/.env`; export credentials in the
shell or use the documented Google credential files. Documentation and runtime
behavior intentionally match.

## Verification

The analytics operator contract is covered by stubbed tests, without real
production credentials:

```bash
node --test ops/analytics/test/
pnpm lint
pnpm typecheck
pnpm build
git diff --check
```

Contract regressions cover the Realtime 30-minute limit, forbidden Realtime
dimensions, baseline/delta behavior, workflow-read fail-closed behavior,
pending-preview detection, preview publication, published-state verification,
and credential-documentation agreement.

## Out of scope

- treating `promo_click` as booking conversion;
- server-side Zaraz HTTP Events API ingestion;
- arbitrary high-cardinality URLs/text/user identifiers in GA4 dimensions;
- a second analytics client;
- claiming route/session-level proof from the restricted Realtime smoke.
