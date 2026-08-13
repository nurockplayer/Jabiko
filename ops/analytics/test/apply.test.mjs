// ops/analytics apply CLI tests (stubbed fetch, no real credentials).
//
// Encodes the production-safety contracts:
//   1. A full Zaraz PUT must be based on the /export payload (secret values
//      included). If /export fails, apply fails closed BEFORE any mutation.
//   2. Any required GA4 custom dimension creation failure → non-zero exit.
//   3. A required dimension that already exists with a non-EVENT scope is a
//      conflict (incomplete desired state) → non-zero exit.
//   4. Missing Google auth / ambiguous or unusable GA4 property while the
//      four dimensions are unreconciled → non-zero exit (never exit 0).
//   5. After a PUT, if the config is still unconverged (blocking finding) →
//      non-zero exit.

import test from "node:test";
import assert from "node:assert/strict";
import { runApply } from "../src/cli/apply.mjs";

const ZONE_ID = "z1";

// A converged Zaraz config: GA4 tool with both track actions and triggers,
// auto-inject on, no automatic page view, no second analytics client.
function convergedConfig() {
  return {
    settings: { autoInjectScript: true },
    tools: {
      ga4: {
        component: "google-analytics-4",
        name: "Google Analytics 4",
        type: "component",
        enabled: true,
        settings: { tid: "G-TEST" },
        permissions: ["access_client_kv", "server_network_requests"],
        blockingTriggers: [],
        actions: {
          "act-page-view": {
            actionType: "track",
            data: { en: "page_view" },
            firingTriggers: ["trg-page-view"],
            blockingTriggers: []
          },
          "act-promo-click": {
            actionType: "track",
            data: { en: "promo_click" },
            firingTriggers: ["trg-promo-click"],
            blockingTriggers: []
          }
        }
      }
    },
    triggers: {
      "trg-page-view": {
        name: "page_view",
        loadRules: [{ id: "r1", match: "custom_event_name", op: "Eq", value: "page_view" }],
        excludeRules: []
      },
      "trg-promo-click": {
        name: "promo_click",
        loadRules: [{ id: "r2", match: "custom_event_name", op: "Eq", value: "promo_click" }],
        excludeRules: []
      }
    },
    zarazVersion: 3
  };
}

// The pre-apply export: unconverged (no GA4 tool) with an unrelated secret.
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

const NO_DIMS = [];

function makeFetch({
  exportFails = false,
  dimsFails = false,
  dimsList = NO_DIMS,
  postApplyUnconverged = false
} = {}) {
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
      if (u.includes("/settings/zaraz/config") && method === "PUT") {
        return respond(200, { success: true, result: convergedConfig() });
      }
      if (u.includes("/settings/zaraz/config") && method === "GET") {
        // Post-apply verification read: converged unless the test forces a
        // stuck-unconverged state.
        return respond(200, { success: true, result: postApplyUnconverged ? exportConfig() : convergedConfig() });
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
        return respond(200, { customDimensions: dimsList });
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
  assert.ok(!calls.some((c) => c.method === "PUT"), "no Zaraz PUT when /export is unavailable");
  assert.ok(!calls.some((c) => c.url.includes("/settings/zaraz/config") && c.method === "GET"), "/config is never read as a mutation base");
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
  assert.ok((result.dimFailures ?? []).length > 0, "the failed dimension is recorded");
});

test("apply exits non-zero when a required dimension exists with a non-EVENT scope", async () => {
  const { impl } = makeFetch({
    dimsList: [
      { parameterName: "promoId", name: "promoId", scope: "USER" },
      { parameterName: "action", name: "action", scope: "EVENT" },
      { parameterName: "placement", name: "placement", scope: "EVENT" },
      { parameterName: "locale", name: "locale", scope: "EVENT" }
    ]
  });
  const result = await withFetch(impl, () =>
    runApply({
      env: { CLOUDFLARE_API_TOKEN: "t", GA4_ACCESS_TOKEN: "g" },
      flags: { measurementId: "G-TEST", dryRun: false, yesRemoveGtag: false }
    })
  );
  assert.ok(result.exitCode !== 0, "a non-EVENT-scope conflict must not report success");
  assert.ok((result.dimFailures ?? []).some((f) => f.parameterName === "promoId"), "the conflict is recorded");
});

test("apply exits non-zero when Google auth is missing (dimensions unreconciled)", async () => {
  const { impl } = makeFetch({ dimsList: NO_DIMS });
  const result = await withFetch(impl, () =>
    runApply({
      env: { CLOUDFLARE_API_TOKEN: "t" }, // no GA4_ACCESS_TOKEN
      flags: { measurementId: "G-TEST", dryRun: false, yesRemoveGtag: false }
    })
  );
  assert.ok(result.exitCode !== 0, "missing Google auth must not result in exit 0 while dimensions are unreconciled");
});

test("apply exits non-zero when the post-apply config remains unconverged", async () => {
  const { impl } = makeFetch({ postApplyUnconverged: true });
  const result = await withFetch(impl, () =>
    runApply({
      env: { CLOUDFLARE_API_TOKEN: "t", GA4_ACCESS_TOKEN: "g" },
      flags: { measurementId: "G-TEST", dryRun: false, yesRemoveGtag: false }
    })
  );
  assert.ok(result.exitCode !== 0, "a PUT that leaves the config unconverged must fail apply");
});

test("apply succeeds (exit 0) when /export works, config converges, and all dimensions are created", async () => {
  const { calls, impl } = makeFetch({ dimsList: NO_DIMS });
  const result = await withFetch(impl, () =>
    runApply({
      env: { CLOUDFLARE_API_TOKEN: "t", GA4_ACCESS_TOKEN: "g" },
      flags: { measurementId: "G-TEST", dryRun: false, yesRemoveGtag: false }
    })
  );
  assert.equal(result.exitCode, 0, "apply succeeds end-to-end");
  const posts = calls.filter((c) => c.method === "POST" && c.url.includes("/customDimensions"));
  assert.equal(posts.length, 4, "all four custom dimensions are created");
});
