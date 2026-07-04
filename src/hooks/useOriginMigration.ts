import { useEffect } from "react";
import {
  applyMigrationPayload,
  BRIDGE_PATH,
  MIGRATED_FLAG_KEY,
  MIGRATION_ATTEMPTS_KEY,
  MIGRATION_MESSAGE_PAYLOAD,
  MIGRATION_MESSAGE_REQUEST,
  MIGRATION_SOURCE_ORIGIN,
  shouldAttemptMigration
} from "../domain/originMigration";

// How long we wait for the old origin's bridge to answer before giving up
// this attempt (offline, or a stale service worker served the old app shell
// instead of the bridge — see originMigration.ts for that failure mode).
const BRIDGE_TIMEOUT_MS = 5000;

/**
 * One-time pull of the visitor's localStorage from jabiko.pages.dev after the
 * domain move (#jabiko-app-domain). Runs at App mount; a no-op everywhere
 * except a fresh jabiko.app visit (see shouldAttemptMigration). On a
 * successful import it reloads once so the whole app re-initializes from the
 * migrated state (attempts, streaks, language, theme, Supabase session).
 *
 * `options` exists for tests: jsdom can neither run on the real hostname nor
 * be allowed to actually reload.
 */
export function useOriginMigration(options?: { hostname?: string; reload?: () => void }) {
  const hostname = options?.hostname ?? window.location.hostname;
  const reload = options?.reload ?? (() => window.location.reload());

  useEffect(() => {
    let storage: Storage;
    try {
      storage = window.localStorage;
    } catch {
      return; // storage blocked (private mode) -> nothing we could migrate into
    }
    if (!shouldAttemptMigration(hostname, storage)) return;

    // Count the attempt up front so a bridge that never answers still burns
    // one of the retries instead of looping forever.
    const attempts = Number(storage.getItem(MIGRATION_ATTEMPTS_KEY) ?? "0");
    storage.setItem(MIGRATION_ATTEMPTS_KEY, String(attempts + 1));

    let settled = false;
    const iframe = document.createElement("iframe");
    iframe.src = `${MIGRATION_SOURCE_ORIGIN}${BRIDGE_PATH}`;
    iframe.style.display = "none";
    iframe.setAttribute("aria-hidden", "true");
    iframe.tabIndex = -1;

    const cleanup = () => {
      window.removeEventListener("message", onMessage);
      window.clearTimeout(timer);
      iframe.remove();
    };

    const onMessage = (event: MessageEvent) => {
      // Only the real old origin may hand us data.
      if (event.origin !== MIGRATION_SOURCE_ORIGIN) return;
      const data: unknown = event.data;
      if (typeof data !== "object" || data === null) return;
      if ((data as { type?: unknown }).type !== MIGRATION_MESSAGE_PAYLOAD) return;
      if (settled) return;
      settled = true;

      const imported = applyMigrationPayload((data as { entries?: unknown }).entries, storage);
      storage.setItem(MIGRATED_FLAG_KEY, "1");
      cleanup();
      // Re-initialize the app only when something actually came across —
      // an empty old origin means this was already a fresh start.
      if (imported > 0) reload();
    };

    const timer = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup(); // attempt already counted; a later visit retries
    }, BRIDGE_TIMEOUT_MS);

    window.addEventListener("message", onMessage);
    const request = () => {
      iframe.contentWindow?.postMessage({ type: MIGRATION_MESSAGE_REQUEST }, MIGRATION_SOURCE_ORIGIN);
    };
    iframe.addEventListener("load", request);
    document.body.appendChild(iframe);

    return cleanup;
    // hostname/reload are stable for the lifetime of the app; this must run once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
