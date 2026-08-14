// ops/analytics production-probe tests: Zaraz injection evidence must be a real
// script reference or a served edge resource, never arbitrary HTML text.
import test from "node:test";
import assert from "node:assert/strict";
import { probeProductionZaraz } from "../src/production.mjs";

async function withFetch(impl, fn) {
  const previous = globalThis.fetch;
  globalThis.fetch = impl;
  try {
    return await fn();
  } finally {
    globalThis.fetch = previous;
  }
}

// Stub: the index HTML at https://jabiko.app/, and 404 for every /cdn-cgi/zaraz
// edge resource so only the HTML marker can be the source of truth.
function makeFetch(html) {
  return async (url) => {
    const u = String(url);
    if (u.includes("/cdn-cgi/zaraz")) {
      return { ok: false, status: 404, text: async () => "Not found" };
    }
    return { ok: true, status: 200, text: async () => html };
  };
}

test("HTML text/comment mentioning Zaraz with 404 edge probes is NOT injection", async () => {
  const result = await withFetch(
    makeFetch("<html><body><!-- Zaraz comment --> Zaraz is mentioned in prose</body></html>"),
    () => probeProductionZaraz()
  );
  assert.equal(result.injected, false);
});

test("a genuine Zaraz script reference is proof of injection", async () => {
  const result = await withFetch(
    makeFetch('<html><head><script src="/cdn-cgi/zaraz/i.js"></script></head><body></body></html>'),
    () => probeProductionZaraz()
  );
  assert.equal(result.injected, true);
});

test("a served Zaraz edge resource is proof of injection even without an HTML script marker", async () => {
  const impl = async (url) => {
    const u = String(url);
    if (u.includes("/cdn-cgi/zaraz")) {
      return { ok: true, status: 200, text: async () => "zaraz script" };
    }
    return { ok: true, status: 200, text: async () => "<html><body>no script tag</body></html>" };
  };
  const result = await withFetch(impl, () => probeProductionZaraz());
  assert.equal(result.injected, true);
});
