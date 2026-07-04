// One-time localStorage migration from the old shared-domain origin
// (jabiko.pages.dev) to the custom domain (jabiko.app).
//
// Why: localStorage is per-origin. The 301 redirect that moves users to
// jabiko.app would otherwise strand an anonymous learner's progress
// (attempts / streaks / preferences) on the old origin. On first load of the
// new origin, the app embeds a hidden iframe of the OLD origin's bridge page
// (public/migration-bridge.html, excluded from the 301 in public/_redirects),
// asks it for the allowlisted keys via postMessage, and imports them here.
//
// Security model: both origins are ours. The bridge only answers windows on
// MIGRATION_TARGET_ORIGIN, we only accept payloads from
// MIGRATION_SOURCE_ORIGIN, and only ALLOWLISTED keys ever cross — an
// arbitrary key can neither be exfiltrated nor injected.
//
// Known limit: a visitor whose old service worker still controls pages.dev
// gets the stale app shell instead of the bridge page (old workbox
// navigateFallback). That attempt times out harmlessly; the navigation
// itself triggers the SW update, so a later visit succeeds — hence the retry
// counter instead of a single shot. Logged-in users are covered by Supabase
// sync regardless.

export const MIGRATION_SOURCE_ORIGIN = "https://jabiko.pages.dev";
export const MIGRATION_TARGET_ORIGIN = "https://jabiko.app";
export const BRIDGE_PATH = "/migration-bridge.html";
export const MIGRATION_MESSAGE_REQUEST = "jabiko:migration-request";
export const MIGRATION_MESSAGE_PAYLOAD = "jabiko:migration-payload";

/** Local-only bookkeeping keys — never migrated themselves. */
export const MIGRATED_FLAG_KEY = "jabiko:migrated";
export const MIGRATION_ATTEMPTS_KEY = "jabiko:migrationAttempts";
export const MIGRATION_MAX_ATTEMPTS = 5;

// Exact app keys that may cross origins. Mirrored by hand in
// public/migration-bridge.html (plain JS can't import TS) — the
// originMigration.test.ts constants test guards the protocol side of that
// copy, and check-i18n/build don't touch it.
const EXACT_KEYS = new Set([
  "jabiko:attempts",
  "jabiko:targetLevel",
  "jabiko:howItWorksDismissed",
  "jabiko.lang",
  "jabiko.theme",
  "jabiko.furigana",
  "jabiko.sessionLength"
]);

// Supabase stores its session as `sb-<project-ref>-auth-token` (+ variants);
// migrating it keeps the learner signed in across the domain move.
const SUPABASE_PREFIX = "sb-";

export type MigrationEntry = { key: string; value: string };

export function isMigratableKey(key: string): boolean {
  return EXACT_KEYS.has(key) || key.startsWith(SUPABASE_PREFIX);
}

/** Bridge side: gather every allowlisted entry from the OLD origin's storage. */
export function collectMigrationEntries(storage: Storage): MigrationEntry[] {
  const entries: MigrationEntry[] = [];
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (key === null || !isMigratableKey(key)) continue;
    const value = storage.getItem(key);
    if (value === null) continue;
    entries.push({ key, value });
  }
  return entries;
}

/**
 * App side: import a bridge payload. Defensive about shape (it crossed a
 * postMessage boundary), re-filters by the allowlist, and NEVER overwrites a
 * value the new origin already has (a fresh local choice beats stale data).
 * Returns how many entries were written.
 */
export function applyMigrationPayload(payload: unknown, storage: Storage): number {
  if (!Array.isArray(payload)) return 0;
  let imported = 0;
  for (const entry of payload) {
    if (typeof entry !== "object" || entry === null) continue;
    const { key, value } = entry as Record<string, unknown>;
    if (typeof key !== "string" || typeof value !== "string") continue;
    if (!isMigratableKey(key)) continue;
    if (storage.getItem(key) !== null) continue;
    storage.setItem(key, value);
    imported++;
  }
  return imported;
}

/**
 * Run the migration only where it can help: on the new origin, before any
 * progress exists locally, not already done, and under the retry cap (see
 * the stale-service-worker note in the header).
 */
export function shouldAttemptMigration(hostname: string, storage: Storage): boolean {
  if (hostname !== "jabiko.app") return false;
  if (storage.getItem(MIGRATED_FLAG_KEY) !== null) return false;
  if (storage.getItem("jabiko:attempts") !== null) return false;
  const attempts = Number(storage.getItem(MIGRATION_ATTEMPTS_KEY) ?? "0");
  return attempts < MIGRATION_MAX_ATTEMPTS;
}
