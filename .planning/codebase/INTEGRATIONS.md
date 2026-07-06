# External Integrations

**Analysis Date:** 2026-07-07

## APIs & External Services

### Database & Sync

**Supabase:**
- What it's used for: Cross-device attempt sync (#151) and anonymous feedback submission (#218). Not used for primary data storage -- localStorage is the source of truth.
- SDK/Client: `@supabase/supabase-js` 2.108.2, lazy-loaded via dynamic `import()` from `src/lib/supabase.ts` (keeps ~210KB SDK out of initial bundle)
- Client singleton pattern: `getSupabase()` returns `Promise<SupabaseClient | null>` -- null when env vars are unset (graceful degradation for anon users)
- Config: Auth with `autoRefreshToken: true`, `persistSession: true`, `detectSessionInUrl: true`, `flowType: "pkce"`
- Env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

**Database tables:**
| Table | Purpose | Access Pattern |
|-------|---------|---------------|
| `attempts` | Practice attempt history, keyed on `(user_id, id)` composite PK | Authenticated users: SELECT/INSERT/DELETE own rows (RLS). Append-only (no UPDATE policy). `grant select, insert, delete to authenticated` |
| `feedback` | Anonymous feedback and question reports | Anyone (anon + authenticated): INSERT only. NO SELECT/UPDATE/DELETE through API. `grant insert to anon, authenticated` |

**RLS policies (defined in `supabase/migrations/`):**
- `0001_create_attempts.sql` -- attempts table + RLS + explicit grants
- `0002_create_feedback.sql` -- feedback table + INSERT-only RLS + explicit grants
- `0003_rls_perf.sql` -- performance optimization (auth.uid() subselect) + tighten SECURITY DEFINER exposure

### Authentication & Identity

**Auth Provider:**
- Supabase Auth with Google OAuth (PKCE flow)
- Implementation: `src/hooks/useAuth.ts` (session management, `onAuthStateChange` subscription, signInWithGoogle, signOut)
- Error codes: `sessionFetchFailed`, `authUnavailable`, `signOutFailed` (rendered through i18n `Copy.authErrors`)
- Redirect target: `window.location.origin` (post-login return)
- Auth gate: `isSupabaseConfigured` guard in `src/lib/supabase.ts` -- short-circuits before SDK import when env vars are unset

### AI-Assisted Translation

**Google Gemini:**
- What it's used for: Batch translation of exam content overlays (i18n fields like `meaningI18n`, `instructionI18n`, etc.) -- issue #378/#400
- Implementation: `scripts/ai-translate-content.mjs` (Node.js CLI script, NOT bundled in the app)
- Invoked: CI-only via GitHub Actions workflow `.github/workflows/ai-i18n-translation.yml` (manual `workflow_dispatch`)
- Auth: `GEMINI_API_KEY` GitHub repository secret -- never exposed to the browser
- Output: Writes i18n overlay objects directly into `src/domain/exam/items/*.ts` source files, opens a PR for human review
- Validation: Script validates Gemini JSON response against request, rejects on any mismatch

### Donation

**ECPay (綠界):**
- What it's used for: Static donate link from `src/components/HomePanel.tsx`
- Integration type: Simple external hyperlink, no SDK or API integration
- URL: `https://payment.ecpay.com.tw/Broadcaster/Donate/57DD8DC811013DF1C576D7ED22ACF911`
- No dynamic payment processing, no webhooks, no client-side SDK

## Data Storage

**Primary (local):**
- localStorage via `src/domain/storage.ts` (`createAttemptStore` factory)
- Key: `jabiko:attempts` (JSON-encoded `Attempt[]`)
- Graceful degradation: falls back to in-memory store on quota errors or missing localStorage
- localStorage keys used across the app:
  - `jabiko:attempts` -- practice history
  - `jabiko.lang` -- language preference
  - `jabiko.theme` -- light/dark theme preference
  - `jabiko.furigana` -- furigana toggle state
  - `jabiko.levelRange` -- JLPT level range preference
  - `jabiko.chapter-progress` -- learning chapter progress
  - `jabiko.how-it-works-dismissed` -- onboarding banner dismissal

**Remote (sync only):**
- Supabase PostgreSQL (`attempts` table) -- append-only, user-scoped via RLS
- Sync strategy: local source of truth, remote as backup (login merges via `planLoginSync` in `src/domain/attemptRemote.ts`)

**File Storage:**
- None -- no external file storage integrated

**Caching:**
- Cloudflare CDN cache (configured via `public/_headers`):
  - `Cache-Control: public, max-age=31536000, immutable` for `/assets/*` (content-hashed)
  - `Cache-Control: public, max-age=0, must-revalidate` for `/index.html`, `/sw.js`, manifest
  - `Cache-Control: public, max-age=86400, stale-while-revalidate=604800` for images/icons

## Monitoring & Observability

**Error Tracking:**
- None external -- errors are logged to `console.error` only (Auth failures, sync failures)
- No Sentry, LogRocket, or similar service integrated

**Analytics:**
- Not yet on main branch -- Cloudflare Zaraz integration (#404) exists in worktree `zaraz-analytics-404` only
  - Typed event system: `trackEvent(name, payload)` with `ALLOWED_PAYLOAD_KEYS` runtime allowlist
  - Events: `page_view`, `practice_started`, `answer_submitted`, `practice_completed`, `study_page_viewed`, `level_changed`, `locale_changed`, `weak_review_started`
  - Privacy: per-event payload allowlist, `window.zaraz.track` failure swallowed (never breaks UI)
  - Env gate: `import.meta.env.PROD && VITE_ZARAZ_ENABLED === "true"`

**Logs:**
- Console-based logging in development (`import.meta.env.DEV` guarded warnings for missing Supabase config)
- No structured logging or log aggregation

## CI/CD & Deployment

**Hosting:**
- Cloudflare Pages (static site hosting + Functions)
- Custom domain: `jabiko.app`
- Redirect from `jabiko.pages.dev` to `jabiko.app` via `functions/_middleware.js` (301 redirect, exempts `/migration-bridge` path)
- Static asset caching via `public/_headers`

**CI Pipeline:**
- GitHub Actions (`.github/workflows/ci.yml`)
  - Triggered on: PR to main, push to main
  - Runs on: ubuntu-latest, Node 22, pnpm (frozen lockfile)
  - Steps: Check exam bank (`pnpm check:exam`) -> Run tests (`pnpm test`) -> Build (`pnpm build`)
  - Only gate: `Test and build` job (CodeRabbit/Cloudflare are rate-limit skips, not blocking)

**AI Translation Pipeline:**
- GitHub Actions (`.github/workflows/ai-i18n-translation.yml`)
  - Manual trigger only (`workflow_dispatch`)
  - Inputs: locale, JLPT level, item limit, dry-run toggle
  - Requires `GEMINI_API_KEY` secret
  - Opens PR for human review -- never auto-merges

**Deployment:**
- Cloudflare Pages auto-deploys on push to main (Git integration)
- Pre-push hook: `pnpm build` via simple-git-hooks (as pre-commit, runs before push)
- No Docker, no container registry

## Environment Configuration

**Required env vars (development):**
- `VITE_SUPABASE_URL` -- Supabase project URL
- `VITE_SUPABASE_ANON_KEY` -- Supabase anonymous API key

**Optional env vars:**
- `VITE_ZARAZ_ENABLED` -- enables Zaraz analytics in production (not yet on main, set to `"true"` when ready)

**Secrets location:**
- Local: `.env` file (gitignored, never committed)
- CI: GitHub repository secrets (`GEMINI_API_KEY`)
- Template: `.env.example` documents available vars (committed)

## Webhooks & Callbacks

**Incoming:**
- None -- the app is client-side only with no server endpoints. Supabase Auth redirect (Google OAuth callback) is handled by the Supabase hosted auth service, not the app.

**Outgoing:**
- None -- no outbound webhook calls from the application

## Browser APIs Used (no external SDK)

**Web Speech API:**
- `window.SpeechSynthesis` + `SpeechSynthesisUtterance` for Japanese TTS in `src/lib/speech.ts`
- Voice selection: `pickJapaneseVoice()` prefers local `ja-JP` voice (fixes iOS reading Japanese with Chinese voice)
- Used by `src/components/SpeakButton.tsx` to read example sentences aloud
- No external TTS service, no audio assets

**Service Worker API:**
- `navigator.serviceWorker` lifecycle managed by `vite-plugin-pwa` (workbox)
- Update detection: `src/hooks/usePwaUpdate.ts` polls for new SW hourly, shows toast when new version available
- Register type: `"prompt"` -- user sees "new version" toast rather than silent reload

**localStorage:**
- Primary persistence layer for all user data (attempts, preferences, progress)
- See Data Storage section above for key list

---

*Integration audit: 2026-07-07*
