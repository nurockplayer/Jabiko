// ops/analytics apply CLI tests (stubbed fetch, no real credentials).
import test from "node:test";
import assert from "node:assert/strict";
import { runApply } from "../src/cli/apply.mjs";

const ZONE_ID = "z1";

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
  postApplyUnconverged = false,
  workflow = "realtime",
  workflowFails = false,
  publishFails = false,
  draftConfig = exportConfig()
} = {}) {
  const calls = [];
  let putApplied = false;
  let published = false;

  const impl = async (url, options = {}) => {
    const method = options.method || "GET";
    const u = String(url);
    calls.push({ method, url: u, body: options.body ? JSON.parse(options.body) : undefined });
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
      if (u.includes("/settings/zaraz/workflow")) {
        if (workflowFails) return respond(500, { success: false, errors: [{ message: "workflow unavailable" }] });
        return respond(200, { success: true, result: workflow });
      }
      if (u.includes("/settings/zaraz/export")) {
        if (exportFails) return respond(403, { success: false, errors: [{ code: 10000, message: "Authentication error" }] });
        const liveAfterMutation = workflow === "realtime" ? putApplied : published;
        const result = liveAfterMutation && !postApplyUnconverged ? convergedConfig() : exportConfig();
        return respond(200, { success: true, result });
      }
      if (u.includes("/settings/zaraz/config") && method === "PUT") {
        putApplied = true;
        return respond(200, { success: true, result: convergedConfig() });
      }
      if (u.includes("/settings/zaraz/publish") && method === "POST") {
        if (publishFails) return respond(403, { success: false, errors: [{ message: "requires Zaraz Admin" }] });
        published = true;
        return respond(200, { success: true, result: "published" });
      }
      if (u.includes("/settings/zaraz/config") && method === "GET") {
        return respond(200, { success: true, result: draftConfig });
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
        return respond(200, {
          dataStreams: [{ name: "properties/2/dataStreams/3", type: "WEB_DATA_STREAM", webStreamData: { measurementId: "G-X" } }]
        });
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
  const previous = globalThis.fetch;
  globalThis.fetch = impl;
  try {
    return await fn();
  } finally {
    globalThis.fetch = previous;
  }
}

const BASE_ARGS = {
  env: { CLOUDFLARE_API_TOKEN: "test-cf", GA4_ACCESS_TOKEN: "test-ga" },
  flags: { measurementId: "G-TEST", dryRun: false, yesRemoveGtag: false }
};

test("workflow-read failure fails closed before any Zaraz mutation", async () => {
  const { calls, impl } = makeFetch({ workflowFails: true });
  const result = await withFetch(impl, () => runApply(BASE_ARGS));
  assert.notEqual(result.exitCode, 0);
  assert.equal(result.workflow, null);
  assert.ok(!calls.some((call) => call.method === "PUT"), "unknown workflow can never become realtime success");
});

test("apply fails closed when /export is unavailable and never mutates via /config", async () => {
  const { calls, impl } = makeFetch({ exportFails: true });
  const result = await withFetch(impl, () => runApply(BASE_ARGS));
  assert.notEqual(result.exitCode, 0);
  assert.ok(!calls.some((call) => call.method === "PUT"));
  assert.ok(!calls.some((call) => call.url.includes("/settings/zaraz/config") && call.method === "GET"));
});

test("preview workflow cannot report success if publication fails", async () => {
  const { calls, impl } = makeFetch({ workflow: "preview", publishFails: true });
  const result = await withFetch(impl, () => runApply(BASE_ARGS));
  assert.equal(result.exitCode, 2);
  assert.ok(result.gates.includes("CLOUDFLARE_PUBLISH"));
  assert.ok(calls.some((call) => call.method === "PUT" && call.url.includes("/settings/zaraz/config")));
  assert.ok(calls.some((call) => call.method === "POST" && call.url.includes("/settings/zaraz/publish")));
});

test("preview workflow is production-complete only after successful publish and published-export verification", async () => {
  const { calls, impl } = makeFetch({ workflow: "preview" });
  const result = await withFetch(impl, () => runApply(BASE_ARGS));
  assert.equal(result.exitCode, 0);
  const publishIndex = calls.findIndex((call) => call.method === "POST" && call.url.includes("/settings/zaraz/publish"));
  const finalExportIndex = calls.map((call, index) => [call, index]).filter(([call]) => call.url.includes("/settings/zaraz/export")).at(-1)[1];
  assert.ok(publishIndex >= 0);
  assert.ok(finalExportIndex > publishIndex, "published state is re-read after publish");
});

test("realtime workflow applies without publish but verifies the published export", async () => {
  const { calls, impl } = makeFetch({ workflow: "realtime" });
  const result = await withFetch(impl, () => runApply(BASE_ARGS));
  assert.equal(result.exitCode, 0);
  assert.ok(!calls.some((call) => call.url.includes("/settings/zaraz/publish")));
  assert.ok(calls.filter((call) => call.url.includes("/settings/zaraz/export")).length >= 2);
});

test("apply exits non-zero when a required GA4 custom dimension creation fails", async () => {
  const { impl } = makeFetch({ dimsFails: true });
  const result = await withFetch(impl, () => runApply(BASE_ARGS));
  assert.notEqual(result.exitCode, 0);
  assert.ok(result.dimFailures.length > 0);
});

test("apply exits non-zero when a required dimension has non-EVENT scope", async () => {
  const { impl } = makeFetch({
    dimsList: [
      { parameterName: "promoId", name: "promoId", scope: "USER" },
      { parameterName: "action", name: "action", scope: "EVENT" },
      { parameterName: "placement", name: "placement", scope: "EVENT" },
      { parameterName: "locale", name: "locale", scope: "EVENT" }
    ]
  });
  const result = await withFetch(impl, () => runApply(BASE_ARGS));
  assert.notEqual(result.exitCode, 0);
  assert.ok(result.dimFailures.some((failure) => failure.parameterName === "promoId"));
});

test("apply exits non-zero when Google auth is missing", async () => {
  const { impl } = makeFetch();
  const result = await withFetch(impl, () =>
    runApply({
      env: { CLOUDFLARE_API_TOKEN: "test-cf" },
      flags: BASE_ARGS.flags
    })
  );
  assert.notEqual(result.exitCode, 0);
});

test("apply exits non-zero if published export remains unconverged after mutation", async () => {
  const { impl } = makeFetch({ postApplyUnconverged: true });
  const result = await withFetch(impl, () => runApply(BASE_ARGS));
  assert.notEqual(result.exitCode, 0);
});

test("preview workflow with pending unpublished changes fails closed before any PUT", async () => {
  // The draft (/config) carries an unpublished extra tool; a full PUT based on
  // the published /export would overwrite it. apply must refuse and gate it.
  const draft = {
    ...exportConfig(),
    tools: {
      ...exportConfig().tools,
      pending: { component: "custom-html", name: "Pending", type: "component", settings: {}, actions: {} }
    }
  };
  const { calls, impl } = makeFetch({ workflow: "preview", draftConfig: draft });
  const result = await withFetch(impl, () => runApply(BASE_ARGS));
  assert.notEqual(result.exitCode, 0);
  assert.ok(result.gates.includes("CLOUDFLARE_PREVIEW_PENDING"));
  assert.ok(!calls.some((call) => call.method === "PUT"), "no PUT when pending preview changes exist");
});
