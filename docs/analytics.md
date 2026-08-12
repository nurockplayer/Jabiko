# Jabiko analytics (Cloudflare Zaraz)

This document describes the privacy-safe learning analytics layer
introduced in issue #404. It is intentionally small: a single typed helper,
an environment gate, ten coarse events, and a hard privacy contract.
Payloads are sanitized, metadata-only event shapes — no question text, user
answers, emails, raw user IDs, or arbitrary free-form strings. GA4 is
connected only as a downstream destination **through** the existing
Zaraz layer (issue #745) — application code never talks to Google directly.

## Why Zaraz

Jabiko is a free, no-signup-first JLPT self-study app. The most valuable early
analytics signal is whether learners actually start practice, submit answers,
complete practice, change levels/locales, return to weak-point review, and
open published articles.
Cloudflare Zaraz is used as an event router / tag manager — it does **not**
replace Jabiko's own learning-progress data model or Supabase sync.

Zaraz provides 1,000,000 free events/month per Cloudflare account. Event
volume is kept intentionally small (ten coarse flow events, not
per-interaction UI events).

## Helper

`src/lib/analytics.ts` exposes a single app-facing function:

```ts
trackEvent(name, payload)
```

- TypeScript strict compatible, no `any`.
- Safe no-op when `window.zaraz` is unavailable (dev / test / preview without
  the snippet).
- Safe no-op when analytics is disabled.
- Never throws to the caller — `window.zaraz.track` failures are swallowed.
- Never blocks learning UI flows; fire-and-forget.
- No React component calls `window.zaraz` directly — only `trackEvent`.

## Environment gate

Tracking is **off by default** in every environment and only turns on when the
Vite production build sees `VITE_ZARAZ_ENABLED` set to the literal string
`"true"`.

| environment        | gate state                          |
|--------------------|-------------------------------------|
| `pnpm dev`         | OFF (always; `import.meta.env.PROD` is false) |
| `vitest` (jsdom)   | OFF (always; `import.meta.env.PROD` is false) |
| `vite build` prod  | OFF unless `VITE_ZARAZ_ENABLED==="true"` |

The comparison is `=== "true"` (string), not truthy — so `VITE_ZARAZ_ENABLED=false`
is correctly treated as disabled.

> Setup note: `.env.example` documents `VITE_ZARAZ_ENABLED=true` as the
> production gate. Tracking stays OFF until that flag is `"true"` in the
> production build AND the Zaraz snippet is installed in the Cloudflare
> dashboard / `index.html`.

## Events

| event name           | when it fires                          | payload keys                                                    |
|----------------------|----------------------------------------|-----------------------------------------------------------------|
| `page_view`          | top-level app view changes             | `view` (string), `locale`                                        |
| `practice_started`   | a practice entry is launched            | `source` (practice mode), `levelRange?`, `locale`                |
| `answer_submitted`   | the learner submits an answer          | `source`, `level` (JlptLevel or "all"), `questionType`, `isCorrect`, `locale` |
| `practice_completed` | a finite practice session is exhausted | `source`, `level`, `totalQuestions`, `correctCount`, `locale`    |
| `study_page_viewed`  | a grammar point study page opens       | `surface` (grammar id, not text), `locale`                       |
| `level_changed`      | the learner changes the level range    | `scope` ("global" or "session"), `levelRange`, `locale`          |
| `locale_changed`     | the learner switches the UI language   | `from` (LocaleCode), `to` (LocaleCode)                          |
| `weak_review_started`| the learner opens weak-point review    | `dueCount` (a count, not content), `locale`                     |
| `article_viewed`     | a published article is successfully displayed | `slug` (canonical article slug only)                       |
| `promo_click`        | a Stay.D promotion interaction fires   | `promoId`, `action` (`"airbnb"` or `"video"`), `placement`, `locale` |

`article_viewed` is emitted by `BlogArticlePage` after a published article has
committed to the UI. The component keeps the last displayed slug in a ref, so
StrictMode and re-renders do not duplicate an event; entering a different
slug, or leaving and later re-entering an article route, is a new view.

### `promo_click`

Issue #745: one reusable outbound promotion interaction event, fired from the
real Stay.D CTAs already on `main` (#744, landed via #747/#749/#751). It
measures **interest** in the promoted destination — never a booking,
reservation, or purchase.

- `promoId` — bounded to approved promotion identifiers (`PROMO_IDENTIFIERS`;
  currently `stay-d`). A free-form string such as an email is rejected at
  compile time.
- `action` — narrowed to `"airbnb"` (outbound Airbnb CTA) or `"video"`
  (video-trigger interaction).
- `placement` — bounded to the stable Stay.D funnel interaction placements
  frozen by #744 (`PROMO_PLACEMENTS`):

  ```text
  home-airbnb          Home direct Airbnb CTA
  home-video           Home video trigger
  home-video-airbnb    Airbnb CTA with/after the Home video
  stay-d-hero-airbnb   /stay-d hero Airbnb CTA
  stay-d-video         /stay-d video trigger
  stay-d-video-airbnb  Airbnb CTA with the /stay-d video section
  stay-d-final-airbnb  /stay-d final Airbnb CTA
  ```

  Each placement is wired to the corresponding `data-stay-d-placement`
  interaction point; a new funnel step extends the union. URLs, surface
  slugs, or free text are rejected at compile time.
- `locale` — the active UI locale.

Firing is fire-and-forget: a missing or failing Zaraz must never block video
opening, `/stay-d` navigation, or the Airbnb link (no `preventDefault` on the
CTA; `trackEvent` swallows all failures).

### `view` allowed values

`page_view.view` is the app view string (`home`, `learn`, `rules`, `kanji`,
`kana`, `challenge`, `mock`, `about`, `privacy`, `terms`, `grammar`, `blog`,
or `stayD`). It is typed as `string` in the
payload (the lib layer intentionally does not import the App-internal
`AppView` union to keep layering clean — see decision boundaries in
`.codex-spec.md`). `/stay-d` uses the normal `page_view` (`view: "stayD"`);
there is no separate `stay_d_view` event.

### `source` / `questionType` vocabulary

- `source` is the `PracticeMode` value (`basic`, `cloze`, `daily`, `exam`,
  `pattern`, `review`, `vocab`). `daily` is 今日練習.
- `questionType` reuses the `PracticeMode` value (a coarse, content-free
  label). It is NOT the question's `surface` or any text — this avoids
  leaking question content. A finer question type may land in a later phase
  if it can be derived without content.

### `level` vs `levelRange`

- `answer_submitted` / `practice_completed` use `level: JlptLevel | "all"`:
  the fixed mock-section level when one is active, else `"all"`. The
  `levelRange` band (`n1n2`, `n2n3`, …) is a pool filter, not a single level,
  so it is not reported as a level here.
- `level_changed` uses `levelRange` directly (with a `scope` to distinguish
  the global target preference from an in-session picker change).

## Privacy rules

Payloads are **flat metadata objects only**. The type system makes sensitive
fields structurally untypeable: every payload shape is a fixed allowlist of
keys. The following are NOT present on any shape and cannot be passed through
`trackEvent` (a compile-time error):

- full question text (`questionText`, `surface` of a question)
- the learner's answer (`userAnswer`, `submittedAnswer`)
- AI conversation text
- email
- raw Supabase user id / any PII id
- IP address
- nested objects or arrays containing user-generated content
- article title, body, query string, referrer, or other navigation/free text

`article_viewed` is deliberately limited to the canonical `slug`; it must not
carry article prose or visitor/navigation data. `promo_click` is limited to
`promoId` / `action` / `placement` / `locale`; it must never carry the
destination URL, listing content, or account data.

This is enforced by a per-event allowlist of typed keys. To add a new payload
field, the shape in `AnalyticsPayloadMap` must be extended first; ad-hoc keys
are rejected by the compiler.

> Forbidden payload keys rejected by the type system (verified by tests):
> `userAnswer`, `userId`, and any key not on the event's allowlist.

## GA4 through Zaraz (issue #745)

GA4 is a **downstream destination** of Cloudflare Zaraz, not an application
dependency. Application code sends events only through `trackEvent` →
`window.zaraz.track(...)` → Zaraz; the GA4 managed tool and its Events action
forward those custom events. No component, helper, or script adds `gtag.js`,
Google Tag Manager, direct `gtag(...)` calls, or a GA SDK — a single app-facing
analytics API is preserved.

- Reuse the existing explicit `page_view` event. **Do not** enable the GA4
  managed tool's automatic Pageviews action alongside it, or a single SPA
  navigation would produce two logical page views (one automatic, one manual).
  Leave the automatic action disabled and rely on the existing
  `trackEvent("page_view", ...)` path.
- Do **not** rely on GA4 Enhanced Measurement's generic outbound `click` as the
  promotion source of truth. The #745 contract is the explicit `promo_click`
  event, which carries the stable product-level `promoId` / `placement`.
- `promo_click` measures Jabiko → Airbnb **interest only**. It is not a
  booking-conversion event and is not configured as one.

### GA4 reporting contract

GA4 must answer at minimum: how many `promo_click` events / users, which
`placement`, which `action`, which `promoId`, and which `locale`. Create
event-scoped custom dimensions only for parameters GA4 does not already
expose:

```text
promoId
action
placement
locale
```

Do **not** create high-cardinality dimensions from full URLs, arbitrary text,
question contents, user identifiers, timestamps, or session-specific values.

### Production operator steps (Cloudflare / GA4)

These are configuration steps performed in the Cloudflare dashboard and the
GA4 property by the owner — they cannot be completed by editing this repo:

1. Use the intended Jabiko GA4 property/data stream (owner supplies the
   Measurement ID).
2. In Cloudflare Zaraz, add/configure the native **Google Analytics 4** managed
   tool for the production domain.
3. Configure the Events action so `zaraz.track(...)` custom events reach GA4.
4. Ensure the page-view configuration does **not** double-count the explicit
   SPA `page_view` flow (disable the automatic pageview action if needed).
5. Create only the required event-scoped custom dimensions
   (`promoId`, `action`, `placement`, `locale`).
6. Verify the production stream with Zaraz Debugger/Monitoring and GA4
   Realtime/DebugView.

Do not commit GA credentials, secrets, cookies, or account identifiers to the
repository. If the GA4 Measurement ID/property has not yet been chosen,
repository implementation may proceed, but production activation stays blocked
until the owner supplies/configures the intended property in Cloudflare.

## Out of scope

- Cloudflare Zaraz Consent Management (consent banner) — if production
  activation legally or operationally requires a materially different consent
  architecture, stop activation and escalate rather than inventing one here.
- server-side events through the Zaraz HTTP Events API
- account/sync events (`sign_in_started`, `sync_enabled`, `sync_failed`, …)
- deeper learning analytics stored in Jabiko's own DB
- UTM / redirect / enhanced outbound tracking (#305 stays separate)

## Tests

`src/lib/analytics.test.ts` covers: disabled no-op, enabled calls
`window.zaraz.track`, missing `window.zaraz`, `window.zaraz.track` throwing,
`window.zaraz.track` not a function, unknown event name (compile error),
wrong payload type (compile error), and sensitive-key rejection (compile
error), including the slug-only `article_viewed` allowlist and the
four-key `promo_click` allowlist (accept for airbnb + video actions, smuggle
strip, compile-time rejection of destination URL / PII / non airbnb|video
action). `StayDPromoCard` / `StayDPage` tests assert each of the seven
funnel placements emits exactly one `promo_click` with the right
action/placement/locale. `BlogArticlePage` tests cover published-only
triggering, StrictMode/rerender deduplication, slug changes, unknown/draft
suppression, and re-entry after route departure.
`src/domain/legalContent.test.ts` asserts that every launched privacy locale
discloses GA4 routing through Zaraz without over-claiming booking-conversion
tracking or full anonymity.
