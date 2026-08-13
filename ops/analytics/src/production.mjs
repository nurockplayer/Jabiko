// ops/analytics — production probes that need no credentials. These verify
// observable public behavior of jabiko.app (Zaraz script injection) so smoke
// can fail fast before any authenticated step.

const ZARAZ_PATHS = [
  "/cdn-cgi/zaraz/__zs_script__",
  "/cdn-cgi/zaraz/"
];

/**
 * Fetch with an abort timeout whose timer is always cleared on settle. Using
 * AbortSignal.timeout() here leaves a dangling node:timers Timeout that breaks
 * Node 22's test-runner message deserialization ("Unable to deserialize cloned
 * data due to invalid or unsupported version") when this module is imported by
 * a test.
 */
async function fetchWithTimeout(url, { ms, headers } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { headers, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Probe whether Cloudflare Zaraz is injected on the production origin.
 * Returns { injected, details: string[] }.
 */
export async function probeProductionZaraz({ baseUrl = "https://jabiko.app" } = {}) {
  const details = [];
  let html = "";
  try {
    const res = await fetchWithTimeout(`${baseUrl}/`, {
      ms: 15000,
      headers: { "User-Agent": "jabiko-ops-analytics" }
    });
    html = await res.text();
    details.push(`GET ${baseUrl}/ -> HTTP ${res.status}`);
  } catch (e) {
    details.push(`GET ${baseUrl}/ failed: ${e.message}`);
    return { injected: false, details, reachable: false };
  }

  // Require a structural script-reference marker (a <script src> pointing at the
  // Zaraz edge resource), not arbitrary HTML text that merely mentions "zaraz".
  const htmlHasZaraz = /<script[^>]*\bsrc=["'][^"']*cdn-cgi\/zaraz\//i.test(html);
  details.push(
    htmlHasZaraz
      ? "index HTML contains a Zaraz script reference"
      : "index HTML has no Zaraz script reference"
  );

  let edgeServesZaraz = false;
  for (const path of ZARAZ_PATHS) {
    try {
      const res = await fetchWithTimeout(`${baseUrl}${path}`, { ms: 10000 });
      if (res.ok) {
        edgeServesZaraz = true;
        details.push(`GET ${path} -> HTTP ${res.status} (served)`);
      } else {
        details.push(`GET ${path} -> HTTP ${res.status}`);
      }
    } catch {
      details.push(`GET ${path} -> unreachable`);
    }
  }

  const injected = htmlHasZaraz || edgeServesZaraz;
  return { injected, details, reachable: true };
}
