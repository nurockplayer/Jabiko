// ops/analytics apply CLI tests (stubbed fetch, no real credentials).
//
// Encodes two production-safety contracts:
//   1. A full Zaraz PUT must be based on the /export payload (secret values
//      included). If /export fails, apply fails closed BEFORE any mutation —
//      it never falls back to the secret-stripped /config as the PUT base.
//   2. If any required GA4 custom dimension creation fails, apply exits
//      non-zero.

import test from "node:test";
import assert from "node:assert/strict";
import { runApply } from "../src/cli/apply.mjs";

const ZONE_ID = "z1";

const DIMS = [
  { parameterName: "promoId", name: "promoId", scope: "EVENT" },
  { parameterName: "action", name: "action", scope: "EVENT" },
  { parameterName: "placement", name: "placement", scope: "EVENT" },
  { parameterName: "locale", name: "locale", scope: "EVENT" }
];

function exportConfig() {
  return {
    settings: { autoInjectScript: true },
    tools: {
      other: { component: "custom-html", name: "Other", type: "component", settings: {}, actions: {} }
    },
    triggers: {},
    variables: { secret1: { name: "secret1", type: "secret", value: "s3cret" } },
    zarazVersion: 3
  };
}

function makeFetch({ exportFails = false, dimsFails = false }) {
  const calls = [];
  const impl = async (url, opts = {}) => {
    const method = opts.method || "GET";
    const u = String(url);
    calls.push({ method, url: u, body: opts.body ? JSON.parse(opts.body) : undefined });
    const respond = (status, json) => ({
      ok: status < 400,
      status,
      json: async () => json,
      text: async () => JSON.stringify(json)
    });

    if (u.includes("api.cloudflare.com")) {
      if (u.includes("/zones?name=")) {
        return respond(200, { success: true, result: [{ id: ZONE_ID, name: "jabiko.app", account: { name: "Acct" } }] });
      }
      if (u.includes("/settings/zaraz/export")) {
        if (exportFails) return respond(403, { success: false, errors: [{ code: 10000, message: "Authentication error" }] });
        return respond(200, { success: true, result: exportConfig() });
      }
      if (u.includes("/settings/zaraz/config")) {
        // Reflect back a converged-ish config so verification doesn't loop.
        return respond(200, { success: true, result: exportConfig() });
      }
      if (u.includes("/settings/zaraz/workflow")) {
        return respond(200, { success: true, result: "realtime" });
      }
      return respond(404, { success: false, errors: [{ message: "unexpected" }] });
    }
    if (u.includes("analyticsadmin.googleapis.com")) {
      if (u.endsWith("/v1beta/accounts")) {
        return respond(200, { accounts: [{ name: "accounts/1", displayName: "Acct" }] });
      }
      if (u.includes("/v1beta/properties?filter=")) {
        return respond(200, { properties: [{ name: "properties/2", displayName: "Jabiko", url: "https://jabiko.app" }] });
      }
      if (u.includes("/v1beta/properties/2/dataStreams")) {
        return respond(200, { dataStreams: [{ name: "properties/2/dataStreams/3", type: "WEB_DATA_STREAM", webStreamData: { measurementId: "G-X" } }] });
      }
      if (u.includes("/v1beta/properties/2/customDimensions")) {
        if (method === "POST") {
          if (dimsFails) return respond(403, { error: { message: "PERMISSION_DENIED", code: 403 } });
          return respond(200, { name: "properties/2/customDimensions/4" });
        }
        // GET list: none exist yet, so all four are "missing".
        return respond(200, { customDimensions: [] });
      }
      return respond(404, { error: { message: "unexpected" } });
    }
    return respond(404, { error: { message: "not found" } });
  };
  return { calls, impl };
}

async function withFetch(impl, fn) {
  const prev = globalThis.fetch;
  globalThis.fetch = impl;
  try {
    return await fn();
  } finally {
    globalThis.fetch = prev;
  }
}

test("apply fails closed when /export is unavailable and never mutates via /config", async () => {
  const { calls, impl } = makeFetch({ exportFails: true });
  const result = await withFetch(impl, () =>
    runApply({
      env: { CLOUDFLARE_API_TOKEN: "t", GA4_ACCESS_TOKEN: "g" },
      flags: { measurementId: "G-TEST", dryRun: false, yesRemoveGtag: false }
    })
  );
  assert.ok(result.exitCode !== 0, "apply exits non-zero when /export fails");
  assert.ok(
    !calls.some((c) => c.method === "PUT"),
    "no Zaraz PUT is issued when /export is unavailable"
  );
  assert.ok(
    !calls.some((c) => c.url.includes("/settings/zaraz/config") && c.method === "GET"),
    "/config is never read as a mutation base"
  );
});

test("apply exits non-zero when a required GA4 custom dimension creation fails", async () => {
  const { impl } = makeFetch({ dimsFails: true });
  const result = await withFetch(impl, () =>
    runApply({
      env: { CLOUDFLARE_API_TOKEN: "t", GA4_ACCESS_TOKEN: "g" },
      flags: { measurementId: "G-TEST", dryRun: false, yesRemoveGtag: false }
    })
  );
  assert.ok(result.exitCode !== 0, "apply exits non-zero when a custom dimension creation fails");
  assert.ok(
    (result.dimFailures ?? []).length > 0,
    "the failed dimension is recorded"
  );
});

test("apply succeeds (exit 0) when /export works and all dimensions are created", async () => {
  const { calls, impl } = makeFetch({ dimsFails: false });
  const result = await withFetch(impl, () =>
    runApply({
      env: { CLOUDFLARE_API_TOKEN: "t", GA4_ACCESS_TOKEN: "g" },
      flags: { measurementId: "G-TEST", dryRun: false, yesRemoveGtag: false }
    })
  );
  assert.equal(result.exitCode, 0, "apply succeeds end-to-end");
  // The four required dimensions were each created.
  const posts = calls.filter((c) => c.method === "POST" && c.url.includes("/customDimensions"));
  assert.equal(posts.length, DIMS.length, "all four custom dimensions are created");
});
