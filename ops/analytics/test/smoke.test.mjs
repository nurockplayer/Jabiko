// Production smoke CLI tests with stubbed fetch only. No real credentials.
import test from "node:test";
import assert from "node:assert/strict";
import { runSmoke } from "../src/cli/smoke.mjs";

const DIMS = [
  { parameterName: "promoId", name: "promoId", scope: "EVENT" },
  { parameterName: "action", name: "action", scope: "EVENT" },
  { parameterName: "placement", name: "placement", scope: "EVENT" },
  { parameterName: "locale", name: "locale", scope: "EVENT" }
];

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

function unconvergedConfig() {
  return {
    settings: { autoInjectScript: true },
    tools: {},
    triggers: {},
    zarazVersion: 3
  };
}

function realtimeResponse({ pageViews = 2, promoClicks = 7 } = {}) {
  return {
    dimensionHeaders: [{ name: "eventName" }],
    rows: [
      { dimensionValues: [{ value: "page_view" }], metricValues: [{ value: String(pageViews) }] },
      { dimensionValues: [{ value: "promo_click" }], metricValues: [{ value: String(promoClicks) }] }
    ]
  };
}

function makeFetch({
  html = "<html>zaraz injected</html>",
  workflow = "realtime",
  workflowFails = false,
  publishedConfig = convergedConfig(),
  baselineRealtime = realtimeResponse({ pageViews: 3, promoClicks: 4 }),
  realtime = realtimeResponse({ pageViews: 5, promoClicks: 11 })
} = {}) {
  const calls = [];
  let realtimeReads = 0;
  const impl = async (url, options = {}) => {
    const u = String(url);
    const method = options.method || "GET";
    const body = options.body ? JSON.parse(options.body) : undefined;
    calls.push({ url: u, method, body });
    const json = (status, payload) => ({
      ok: status < 400,
      status,
      json: async () => payload,
      text: async () => JSON.stringify(payload)
    });
    const text = (status, payload) => ({
      ok: status < 400,
      status,
      json: async () => ({}),
      text: async () => payload
    });

    if (u.startsWith("https://jabiko.app/")) {
      if (u.includes("cdn-cgi/zaraz")) return text(404, "not found");
      return text(200, html);
    }
    if (u.includes("api.cloudflare.com")) {
      if (u.includes("/zones?name=")) {
        return json(200, { success: true, result: [{ id: "z1", name: "jabiko.app", account: { name: "Acct" } }] });
      }
      if (u.includes("/settings/zaraz/workflow")) {
        if (workflowFails) return json(500, { success: false, errors: [{ message: "workflow unavailable" }] });
        return json(200, { success: true, result: workflow });
      }
      if (u.includes("/settings/zaraz/export")) {
        return json(200, { success: true, result: publishedConfig });
      }
      if (u.includes("/settings/zaraz/config")) {
        return json(200, { success: true, result: convergedConfig() });
      }
      return json(404, { success: false, errors: [{ message: "unexpected" }] });
    }
    if (u.includes("analyticsadmin.googleapis.com")) {
      if (u.endsWith("/v1beta/accounts")) {
        return json(200, { accounts: [{ name: "accounts/1", displayName: "Acct" }] });
      }
      if (u.includes("/v1beta/properties?filter=")) {
        return json(200, { properties: [{ name: "properties/2", displayName: "Jabiko", url: "https://jabiko.app" }] });
      }
      if (u.includes("/v1beta/properties/2/dataStreams")) {
        return json(200, {
          dataStreams: [{ name: "properties/2/dataStreams/3", type: "WEB_DATA_STREAM", webStreamData: { measurementId: "G-TEST" } }]
        });
      }
      if (u.includes("/v1beta/properties/2/customDimensions")) {
        return json(200, { customDimensions: DIMS });
      }
      return json(404, { error: { message: "unexpected admin request" } });
    }
    if (u.includes("analyticsdata.googleapis.com")) {
      realtimeReads += 1;
      return json(200, realtimeReads === 1 ? baselineRealtime : realtime);
    }
    return text(404, "not found");
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

const ENV = { CLOUDFLARE_API_TOKEN: "test-cf", GA4_ACCESS_TOKEN: "test-ga" };

test("smoke never requests unsupported Realtime dimensions or a window beyond 30 minutes", async () => {
  const { calls, impl } = makeFetch();
  const result = await withFetch(impl, () =>
    runSmoke({ env: ENV, flags: { placementActionVerified: true }, watchSeconds: 0, pollIntervalMs: 1 })
  );
  assert.equal(result.exitCode, 0);
  const realtimeCalls = calls.filter((call) => call.url.includes(":runRealtimeReport"));
  assert.ok(realtimeCalls.length >= 1);
  for (const call of realtimeCalls) {
    assert.deepEqual(call.body.dimensions, [{ name: "eventName" }]);
    assert.ok(call.body.minuteRanges[0].startMinutesAgo <= 29);
    const requested = call.body.dimensions.map((d) => d.name);
    for (const forbidden of ["sessionId", "pagePath", "customEvent:promoId", "customEvent:action", "customEvent:placement", "customEvent:locale"]) {
      assert.ok(!requested.includes(forbidden), `${forbidden} must never be requested from Realtime`);
    }
  }
});

test("placement/action proof remains one explicit human gate instead of an automated fake pass", async () => {
  const { impl } = makeFetch();
  const result = await withFetch(impl, () =>
    runSmoke({ env: ENV, flags: {}, watchSeconds: 0, pollIntervalMs: 1 })
  );
  assert.equal(result.exitCode, 2);
  assert.equal(result.failed, false);
  assert.equal(result.gateBlocked, true);
  assert.deepEqual(result.gates, ["PRODUCTION_INTERACTION"]);
  assert.equal(result.eventCounts.page_view, 2);
  assert.equal(result.eventCounts.promo_click, 7);
  assert.equal(result.baselineCounts.page_view, 3);
  assert.equal(result.baselineCounts.promo_click, 4);
});

test("verified human placement/action gate + supported Realtime event signal can pass", async () => {
  const { impl } = makeFetch({ workflow: "preview" });
  const result = await withFetch(impl, () =>
    runSmoke({ env: ENV, flags: { placementActionVerified: true }, watchSeconds: 0, pollIntervalMs: 1 })
  );
  assert.equal(result.exitCode, 0);
  assert.equal(result.workflow, "preview");
  assert.equal(result.placementActionVerified, true);
});

test("workflow read failure fails closed and cannot become production success", async () => {
  const { calls, impl } = makeFetch({ workflowFails: true });
  const result = await withFetch(impl, () =>
    runSmoke({ env: ENV, flags: { placementActionVerified: true }, watchSeconds: 0, pollIntervalMs: 1 })
  );
  assert.equal(result.exitCode, 1);
  assert.equal(result.workflow, null);
  assert.ok(!calls.some((call) => call.url.includes(":runRealtimeReport")), "no Realtime success after unknown workflow");
});

test("smoke verifies published /export, not a newer preview /config", async () => {
  const { calls, impl } = makeFetch({ workflow: "preview", publishedConfig: unconvergedConfig() });
  const result = await withFetch(impl, () =>
    runSmoke({ env: ENV, flags: { placementActionVerified: true }, watchSeconds: 0, pollIntervalMs: 1 })
  );
  assert.equal(result.exitCode, 1);
  assert.ok(calls.some((call) => call.url.includes("/settings/zaraz/export")));
  assert.ok(!calls.some((call) => call.url.includes("/settings/zaraz/config")), "preview-capable /config is not production proof");
});

test("Realtime event delta failure is non-zero even after human verification", async () => {
  const { impl } = makeFetch({
    baselineRealtime: realtimeResponse({ pageViews: 10, promoClicks: 20 }),
    realtime: realtimeResponse({ pageViews: 11, promoClicks: 26 })
  });
  const result = await withFetch(impl, () =>
    runSmoke({ env: ENV, flags: { placementActionVerified: true }, watchSeconds: 0, pollIntervalMs: 1 })
  );
  assert.equal(result.exitCode, 1);
});


test("pre-existing ambient traffic cannot satisfy the guided Realtime proof without a new delta", async () => {
  const same = realtimeResponse({ pageViews: 50, promoClicks: 80 });
  const { impl } = makeFetch({ baselineRealtime: same, realtime: same });
  const result = await withFetch(impl, () =>
    runSmoke({ env: ENV, flags: { placementActionVerified: true }, watchSeconds: 0, pollIntervalMs: 1 })
  );
  assert.equal(result.exitCode, 1);
  assert.equal(result.eventCounts.page_view, 0);
  assert.equal(result.eventCounts.promo_click, 0);
});
