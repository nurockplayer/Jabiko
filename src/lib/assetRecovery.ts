// Client-side recovery for poisoned build assets (2026-07-06 outage).
//
// During a deploy transition, a request for a not-yet-propagated /assets/*
// file fell through to the SPA fallback and came back as index.html with 200.
// public/_headers marks /assets/* as `immutable, max-age=1y`, so browsers
// pinned that HTML-as-JS/CSS in their HTTP disk cache — after which a plain
// location.reload() NEVER refetches it: dynamic import() keeps reading the
// poisoned entry and every challenge route dies with
// "Failed to fetch dynamically imported module" / a MIME-type refusal.
//
// The one call that can evict such an entry from the HTTP cache is
// `fetch(url, { cache: "reload" })`: it bypasses the cache, hits the network,
// and REPLACES the stored entry with the fresh response. We also unregister
// any service worker (a stale precache can keep serving an old app shell)
// and drop Cache Storage. Everything is best-effort: recovery must never
// throw, and partial repair + reload is still better than a dead page.
//
// This module is imported by RouteErrorBoundary (eager entry chunk) on
// purpose — recovery code must never live in a lazy chunk that can itself be
// poisoned.

const ASSET_URL_PATTERN = /https?:\/\/[^\s'"()]+\/assets\/[^\s'"()]+/g;

// Chunk-load failure messages of the major engines:
//   Chrome:  "Failed to fetch dynamically imported module: <url>"
//   Firefox: "error loading dynamically imported module"
//   Safari:  "Importing a module script failed."
const CHUNK_LOAD_PATTERN = /dynamically imported module|module script|loading chunk/i;

export function isChunkLoadError(error: unknown): boolean {
  return error instanceof Error && CHUNK_LOAD_PATTERN.test(error.message);
}

export function extractAssetUrls(error: unknown): string[] {
  if (!(error instanceof Error)) return [];
  return Array.from(new Set(error.message.match(ASSET_URL_PATTERN) ?? []));
}

// Repair the local caches that a plain reload cannot touch. Returns true when
// a repair attempt ran (callers then reload to pick the fresh assets up).
export async function recoverPoisonedAssets(error: unknown): Promise<boolean> {
  // Overwrite each poisoned HTTP-cache entry with the live response.
  for (const url of extractAssetUrls(error)) {
    try {
      await fetch(url, { cache: "reload" });
    } catch {
      // Offline / blocked: the reload that follows will surface it anyway.
    }
  }

  // A stale service worker can keep serving an old app shell whose chunk
  // URLs no longer exist; drop it and let the next load register fresh.
  try {
    const registrations = (await navigator.serviceWorker?.getRegistrations()) ?? [];
    await Promise.all(registrations.map((registration) => registration.unregister()));
  } catch {
    // No SW support / detached — fine.
  }

  // Workbox precache may hold the poisoned copy too.
  try {
    if (typeof caches !== "undefined" && caches) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
  } catch {
    // Cache Storage unavailable — fine.
  }

  return true;
}
