// Cloudflare Pages Functions middleware: 301 the old shared origin
// (jabiko.pages.dev) to the canonical custom domain (#jabiko-app-domain).
//
// Why a Function and not _redirects: Pages' _redirects only supports
// path-based sources — Netlify-style absolute-URL/host rules are silently
// ignored (verified in prod: the host rule never fired). Host logic needs
// code. _routes.json keeps static assets (hashed chunks, images, sw.js)
// out of this middleware, so old links' OG previews still resolve and the
// free Functions quota is only spent on navigations.
//
// The origin-migration bridge is exempt: jabiko.app iframes it ON the old
// origin to pull a visitor's localStorage across (see
// src/domain/originMigration.ts). Redirecting it would break that pull —
// the iframe would land same-origin and the origin check would reject it.

const CANONICAL_ORIGIN = "https://jabiko.app";
const OLD_HOST = "jabiko.pages.dev";
const BRIDGE_PREFIX = "/migration-bridge";

/** Pure decision: the 301 target for `url`, or null to serve normally. */
export function redirectTargetFor(url) {
  const u = new URL(url);
  // Exact host only: previews (<hash>.jabiko.pages.dev) must keep working.
  if (u.hostname !== OLD_HOST) return null;
  if (u.pathname.startsWith(BRIDGE_PREFIX)) return null;
  return CANONICAL_ORIGIN + u.pathname + u.search;
}

export async function onRequest(context) {
  const target = redirectTargetFor(context.request.url);
  if (target !== null) return Response.redirect(target, 301);
  return context.next();
}
