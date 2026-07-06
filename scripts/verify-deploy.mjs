// Post-deploy synthetic check (#507, born from the 2026-07-06 cache-poison
// outage). Run after every production deploy:
//
//   pnpm verify:deploy                 # checks https://jabiko.app
//   DEPLOY_URL=https://... pnpm verify:deploy
//
// It asserts the five invariants that, together, would have caught both the
// original poisoning AND the _routes.json wildcard regression that silently
// disabled the /assets guard:
//   1. the entry HTML serves and references hashed assets
//   2. the referenced CSS really is text/css (not a cached HTML fallback)
//   3. the referenced JS really is JavaScript
//   4. a MISSING /assets file returns 404 + no-store (the poison window)
//   5. an SPA route still serves the app shell with 200
//
// Exit code 0 = all green; 1 = any failure (prints each check).

const BASE = (process.env.DEPLOY_URL || "https://jabiko.app").replace(/\/$/, "");

const results = [];
function record(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`);
}

async function main() {
  // 1. entry HTML + asset references
  const htmlRes = await fetch(`${BASE}/?verify=${Date.now()}`, {
    headers: { "cache-control": "no-cache" }
  });
  const html = await htmlRes.text();
  const cssPath = html.match(/\/assets\/index-[\w-]+\.css/)?.[0];
  const jsPath = html.match(/\/assets\/index-[\w-]+\.js/)?.[0];
  record("entry HTML 200 + hashed asset refs", htmlRes.status === 200 && !!cssPath && !!jsPath,
    `status=${htmlRes.status} css=${cssPath ?? "?"} js=${jsPath ?? "?"}`);

  // 2. referenced CSS is really CSS
  if (cssPath) {
    const res = await fetch(BASE + cssPath);
    const type = res.headers.get("content-type") ?? "";
    record("entry CSS is text/css", res.status === 200 && type.includes("text/css"),
      `status=${res.status} type=${type}`);
  }

  // 3. referenced JS is really JavaScript
  if (jsPath) {
    const res = await fetch(BASE + jsPath);
    const type = res.headers.get("content-type") ?? "";
    record("entry JS is javascript", res.status === 200 && type.includes("javascript"),
      `status=${res.status} type=${type}`);
  }

  // 4. THE poison-window check: a missing asset must be an uncacheable 404,
  //    never the SPA fallback (200 text/html + immutable = the outage).
  const missing = await fetch(`${BASE}/assets/verify-missing-${Date.now()}.js`);
  const missType = missing.headers.get("content-type") ?? "";
  const missCache = missing.headers.get("cache-control") ?? "";
  record("missing /assets/* -> 404 + no-store",
    missing.status === 404 && missCache.includes("no-store"),
    `status=${missing.status} type=${missType} cache=${missCache}`);

  // 5. SPA routes still fall back to the app shell
  const spa = await fetch(`${BASE}/challenge?verify=${Date.now()}`);
  const spaType = spa.headers.get("content-type") ?? "";
  record("SPA route serves app shell", spa.status === 200 && spaType.includes("text/html"),
    `status=${spa.status} type=${spaType}`);

  const failed = results.filter((r) => !r.ok);
  console.log(failed.length === 0 ? "\nDEPLOY VERIFIED ✓" : `\nDEPLOY BROKEN ✗ (${failed.length} failed)`);
  process.exit(failed.length === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error("verify-deploy crashed:", error);
  process.exit(1);
});
