// ops/analytics — production probes that need no credentials. These verify
// observable public behavior of jabiko.app (Zaraz script injection) so smoke
// can fail fast before any authenticated step.

const ZARAZ_PATHS = [
  "/cdn-cgi/zaraz/__zs_script__",
  "/cdn-cgi/zaraz/"
];

/**
 * Probe whether Cloudflare Zaraz is injected on the production origin.
 * Returns { injected, details: string[] }.
 */
export async function probeProductionZaraz({ baseUrl = "https://jabiko.app" } = {}) {
  const details = [];
  let html = "";
  try {
    const res = await fetch(`${baseUrl}/`, {
      headers: { "User-Agent": "jabiko-ops-analytics" },
      signal: AbortSignal.timeout(15000)
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
      const res = await fetch(`${baseUrl}${path}`, {
        signal: AbortSignal.timeout(10000)
      });
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
