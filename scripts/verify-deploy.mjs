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

function headerToken(value) {
  return value.replace(/^[ \t]+|[ \t]+$/g, "").toLowerCase();
}

function mediaType(value) {
  return headerToken(value.split(";", 1)[0]);
}

// Exact browser-supported essences, not a substring in another type/parameter.
// https://mimesniff.spec.whatwg.org/#javascript-mime-type
const JAVASCRIPT_TYPES = new Set([
  "application/ecmascript", "application/javascript", "application/x-ecmascript", "application/x-javascript",
  "text/ecmascript", "text/javascript", "text/javascript1.0", "text/javascript1.1", "text/javascript1.2",
  "text/javascript1.3", "text/javascript1.4", "text/javascript1.5", "text/jscript", "text/livescript",
  "text/x-ecmascript", "text/x-javascript"
]);

function hasNoStore(value) {
  // RFC 9111: match a directive, not an extension name or a quoted argument.
  const directives = [];
  let current = "";
  let quoted = false;
  let escaped = false;
  for (const char of value) {
    if (char === "," && !quoted) {
      directives.push(headerToken(current));
      current = "";
      continue;
    }
    current += char;
    if (escaped) escaped = false;
    else if (quoted && char === "\\") escaped = true;
    else if (char === '"') quoted = !quoted;
  }
  directives.push(headerToken(current));
  return !quoted && !escaped && directives.includes("no-store");
}

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
    record("entry CSS is text/css", res.status === 200 && mediaType(type) === "text/css",
      `status=${res.status} type=${type}`);
  }

  // 3. referenced JS is really JavaScript
  if (jsPath) {
    const res = await fetch(BASE + jsPath);
    const type = res.headers.get("content-type") ?? "";
    record("entry JS is javascript", res.status === 200 && JAVASCRIPT_TYPES.has(mediaType(type)),
      `status=${res.status} type=${type}`);
  }

  // 4. THE poison-window check: a missing asset must be an uncacheable 404,
  //    never the SPA fallback (200 text/html + immutable = the outage).
  const missing = await fetch(`${BASE}/assets/verify-missing-${Date.now()}.js`);
  const missType = missing.headers.get("content-type") ?? "";
  const missCache = missing.headers.get("cache-control") ?? "";
  record("missing /assets/* -> 404 + no-store",
    missing.status === 404 && hasNoStore(missCache),
    `status=${missing.status} type=${missType} cache=${missCache}`);

  // 5. SPA routes still fall back to the app shell
  const spa = await fetch(`${BASE}/challenge?verify=${Date.now()}`);
  const spaType = spa.headers.get("content-type") ?? "";
  record("SPA route serves app shell", spa.status === 200 && mediaType(spaType) === "text/html",
    `status=${spa.status} type=${spaType}`);

  const failed = results.filter((r) => !r.ok);
  console.log(failed.length === 0 ? "\nDEPLOY VERIFIED ✓" : `\nDEPLOY BROKEN ✗ (${failed.length} failed)`);
  process.exit(failed.length === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error("verify-deploy crashed:", error);
  process.exit(1);
});
