// ops/analytics Cloudflare API client tests.
import test from "node:test";
import assert from "node:assert/strict";
import {
  cfApiUrl,
  zarazConfigUrl,
  zarazExportUrl,
  zarazWorkflowUrl,
  zarazDefaultUrl,
  zarazPublishUrl,
  cfHeaders,
  parseCfResponse,
  CfApiError,
  cfRequest
} from "../src/cf.mjs";

const ZONE = "abc123";

test("cfApiUrl prefixes the client v4 base", () => {
  assert.equal(cfApiUrl("/zones"), "https://api.cloudflare.com/client/v4/zones");
});

test("zaraz endpoints resolve under /zones/{zone}/settings/zaraz", () => {
  assert.equal(
    zarazConfigUrl(ZONE),
    "https://api.cloudflare.com/client/v4/zones/abc123/settings/zaraz/config"
  );
  assert.equal(
    zarazExportUrl(ZONE),
    "https://api.cloudflare.com/client/v4/zones/abc123/settings/zaraz/export"
  );
  assert.equal(
    zarazWorkflowUrl(ZONE),
    "https://api.cloudflare.com/client/v4/zones/abc123/settings/zaraz/workflow"
  );
  assert.equal(
    zarazDefaultUrl(ZONE),
    "https://api.cloudflare.com/client/v4/zones/abc123/settings/zaraz/default"
  );
  assert.equal(
    zarazPublishUrl(ZONE),
    "https://api.cloudflare.com/client/v4/zones/abc123/settings/zaraz/publish"
  );
});

test("cfHeaders uses bearer auth", () => {
  const h = cfHeaders("secret-token");
  assert.equal(h.Authorization, "Bearer secret-token");
  assert.equal(h["Content-Type"], "application/json");
});

test("parseCfResponse returns result on success", () => {
  const res = parseCfResponse({ success: true, result: { tools: {} } });
  assert.deepEqual(res, { tools: {} });
});

test("parseCfResponse throws a CfApiError with the message on failure", () => {
  try {
    parseCfResponse({
      success: false,
      errors: [{ code: 10000, message: "Authentication error" }]
    });
    assert.fail("should have thrown");
  } catch (e) {
    assert.ok(e instanceof CfApiError);
    assert.match(e.message, /Authentication error/);
  }
});

test("cfApiUrl is idempotent on a full Cloudflare URL (no double prefix)", () => {
  const full = "https://api.cloudflare.com/client/v4/zones/abc/settings/zaraz/config";
  assert.equal(cfApiUrl(full), full);
});

test("cfRequest sends a full Zaraz URL without double-prefixing it", async () => {
  const seen = [];
  const prev = globalThis.fetch;
  globalThis.fetch = async (url, opts) => {
    seen.push({ url: String(url), opts });
    return {
      ok: true,
      status: 200,
      json: async () => ({ success: true, result: {} })
    };
  };
  try {
    await cfRequest({ token: "t", path: zarazConfigUrl("z1") });
  } finally {
    globalThis.fetch = prev;
  }
  assert.equal(seen.length, 1);
  const url = seen[0].url;
  assert.equal(
    url,
    "https://api.cloudflare.com/client/v4/zones/z1/settings/zaraz/config"
  );
  assert.ok(!url.includes("client/v4client/v4"), "no duplicated base prefix");
  assert.ok(!url.includes("client/v4https://"), "no scheme-in-path prefixing");
});
