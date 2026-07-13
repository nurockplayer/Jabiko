# Jabiko analytics (Cloudflare Zaraz, Phase 1)

This document describes the **Phase 1** anonymous learning analytics layer
introduced in issue #404. It is intentionally small: a single typed helper,
an environment gate, nine coarse events, and a hard privacy contract.

## Why Zaraz

Jabiko is a free, no-signup-first JLPT self-study app. The most valuable early
analytics signal is whether learners actually start practice, submit answers,
complete practice, change levels/locales, return to weak-point review, and
open published articles.
Cloudflare Zaraz is used as an event router / tag manager — it does **not**
replace Jabiko's own learning-progress data model or Supabase sync.

Zaraz provides 1,000,000 free events/month per Cloudflare account. Phase 1
event volume is kept intentionally small (nine coarse flow events, not
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

## Phase 1 events

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

`article_viewed` is emitted by `BlogArticlePage` after a published article has
committed to the UI. The component keeps the last displayed slug in a ref, so
StrictMode and re-renders do not duplicate an event; entering a different
slug, or leaving and later re-entering an article route, is a new view.

### `view` allowed values

`page_view.view` is the app view string (`home`, `learn`, `rules`, `kanji`,
`challenge`, `mock`, `about`, `grammar`). It is typed as `string` in the
payload (the lib layer intentionally does not import the App-internal
`AppView` union to keep layering clean — see decision boundaries in
`.codex-spec.md`).

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
carry article prose or visitor/navigation data.

This is enforced by a per-event allowlist of typed keys. To add a new payload
field, the shape in `AnalyticsPayloadMap` must be extended first; ad-hoc keys
are rejected by the compiler.

> Forbidden payload keys rejected by the type system (verified by tests):
> `userAnswer`, `userId`, and any key not on the event's allowlist.

## Out of scope (Phase 2+)

- GA4 or PostHog integration through Zaraz
- Cloudflare Zaraz Consent Management (consent banner)
- server-side events through the Zaraz HTTP Events API
- account/sync events (`sign_in_started`, `sync_enabled`, `sync_failed`, …)
- deeper learning analytics stored in Jabiko's own DB

## Tests

`src/lib/analytics.test.ts` covers: disabled no-op, enabled calls
`window.zaraz.track`, missing `window.zaraz`, `window.zaraz.track` throwing,
`window.zaraz.track` not a function, unknown event name (compile error),
wrong payload type (compile error), and sensitive-key rejection (compile
error), including the slug-only `article_viewed` allowlist. `BlogArticlePage`
tests cover published-only triggering, StrictMode/rerender deduplication, slug
changes, unknown/draft suppression, and re-entry after route departure.
