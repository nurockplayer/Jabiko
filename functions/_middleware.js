// Cloudflare Pages Functions middleware, two jobs:
//
// 1. 301 the old shared origin (jabiko.pages.dev) to the canonical custom
//    domain (#jabiko-app-domain). Why a Function and not _redirects: Pages'
//    _redirects only supports path-based sources — Netlify-style
//    absolute-URL/host rules are silently ignored (verified in prod). Host
//    logic needs code. The origin-migration bridge is exempt: jabiko.app
//    iframes it ON the old origin to pull a visitor's localStorage across
//    (src/domain/originMigration.ts); redirecting would break that pull.
//
// 2. Guard /assets/* against the SPA-fallback poison (2026-07-06 outage,
//    #507): a request for a not-yet-propagated hashed asset used to fall
//    through to _redirects' `/* /index.html 200` and come back as HTML with
//    200 — which edges/browsers then cached AS the asset (public/_headers
//    marks /assets/* immutable for a year), breaking the app until a manual
//    purge. The guard turns that fallback into an uncacheable 404, so the
//    poison can never enter a cache. Trade-off: /assets/* now runs through
//    this Function (see public/_routes.json), which skips Cloudflare's edge
//    cache for assets — acceptable because browsers still cache them as
//    immutable; revisit with the Cache API if Function quota ever hurts.

const CANONICAL_ORIGIN = "https://jabiko.app";
const OLD_HOST = "jabiko.pages.dev";
const BRIDGE_PREFIX = "/migration-bridge";
const ASSETS_PREFIX = "/assets/";
const ADS_TXT_PATH = "/ads.txt";

/** Pure decision: the 301 target for `url`, or null to serve normally. */
export function redirectTargetFor(url) {
  const u = new URL(url);
  // Exact host only: previews (<hash>.jabiko.pages.dev) must keep working.
  if (u.hostname !== OLD_HOST) return null;
  if (u.pathname.startsWith(BRIDGE_PREFIX)) return null;
  return CANONICAL_ORIGIN + u.pathname + u.search;
}

/** Pure decision: the uncacheable 404 replacing a poisoned asset response,
 *  or null to serve the response as-is. Only /assets/* is guarded, and only
 *  when the "asset" came back as HTML (= the SPA fallback, never a real
 *  build file). */
function guardedAssetResponse(pathname, response) {
  if (!pathname.startsWith(ASSETS_PREFIX)) return null;
  const type = response.headers.get("content-type") || "";
  if (!type.includes("text/html")) return null;
  return new Response("Not found", {
    status: 404,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

export async function onRequest(context) {
  const { pathname } = new URL(context.request.url);

  // Assets are never host-redirected (old links' OG images on pages.dev must
  // keep resolving) — they only get the poisoned-fallback guard.
  if (pathname.startsWith(ASSETS_PREFIX)) {
    const response = await context.next();
    return guardedAssetResponse(pathname, response) ?? response;
  }

  const target = redirectTargetFor(context.request.url);
  if (target !== null) return Response.redirect(target, 301);
  const response = await context.next();
  if (
    pathname === ADS_TXT_PATH &&
    (response.headers.get("content-type") || "").includes("text/html")
  ) {
    return new Response("Not found", {
      status: 404,
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "no-store"
      }
    });
  }
  return response;
}
