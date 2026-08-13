// End-to-end smoke CLI tests with a stubbed global fetch. These catch the
// control-flow, session-isolation, polling-accumulation and exit-status bugs
// without any real credentials or network.

import test from "node:test";
import assert from "node:assert/strict";
import { runSmoke } from "../src/cli/smoke.mjs";
import { PLACEMENT_ACTION } from "../src/smokelogic.mjs";

const PLACEMENTS = Object.keys(PLACEMENT_ACTION);

const DIMS = [
  { parameterName: "promoId", name: "promoId", scope: "EVENT" },
  { parameterName: "action", name: "action", scope: "EVENT" },
  { parameterName: "placement", name: "placement", scope: "EVENT" },
  { parameterName: "locale", name: "locale", scope: "EVENT" }
];

const RICH_DIMS = [
  "eventName",
  "sessionId",
  "pagePath",
  "customEvent:promoId",
  "customEvent:action",
  "customEvent:placement",
  "customEvent:locale"
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

function row(eventName, sessionId, overrides = {}) {
  return { eventName, sessionId, pagePath: "/", eventCount: 1, ...overrides };
}
function pageView(sessionId, pagePath = "/") {
  return row("page_view", sessionId, { pagePath });
}
function promo(sessionId, placement, action) {
  return row("promo_click", sessionId, {
    "customEvent:promoId": "stay-d",
    "customEvent:action": action,
    "customEvent:placement": placement,
    "customEvent:locale": "zh-Hant"
  });
}
function guidedRows(sessionId, { pageViews = true, stayD = true } = {}) {
  const rows = [];
  if (pageViews) {
    rows.push(pageView(sessionId, "/"));
    if (stayD) rows.push(pageView(sessionId, "/stay-d"));
  }
  for (const placement of PLACEMENTS) {
    rows.push(promo(sessionId, placement, PLACEMENT_ACTION[placement]));
  }
  return rows;
}

function richResponse(rows) {
  return {
    dimensionHeaders: RICH_DIMS.map((name) => ({ name })),
    rows: rows.map((r) => ({
      dimensionValues: RICH_DIMS.map((k) => ({ value: r[k] ?? "" })),
      metricValues: [{ value: String(r.eventCount ?? 1) }]
    }))
  };
}

function baselineResponse(sessionIds) {
  return {
    dimensionHeaders: [{ name: "sessionId" }],
    rows: sessionIds.map((sid) => ({
      dimensionValues: [{ value: sid }],
      metricValues: [{ value: "1" }]
    }))
  };
}

function makeFetch({ richRows, baselineSessions, realtimeCalls, html = "zaraz injected", baselineFails = false, richDimsFail = false }) {
  const calls = [];
  const impl = async (url, opts = {}) => {
    const method = opts.method || "GET";
    const u = String(url);
    calls.push({ method, url: u });
    const respond = (status, json) => ({
      ok: status < 400,
      status,
      json: async () => json,
      text: async () => JSON.stringify(json)
    });
    const respondText = (status, text) => ({
      ok: status < 400,
      status,
      json: async () => ({}),
      text: async () => text
    });

    if (u.startsWith("https://jabiko.app/")) {
      if (u.includes("cdn-cgi/zaraz")) return respondText(404, "Not found");
      return respondText(200, html);
    }
    if (u.includes("api.cloudflare.com")) {
      if (u.includes("/settings/zaraz/config")) {
        return respond(200, { success: true, result: convergedConfig() });
      }
      if (u.includes("/zones?name=")) {
        return respond(200, {
          success: true,
          result: [{ id: "z1", name: "jabiko.app", account: { name: "Acct" } }]
        });
      }
      return respond(404, { success: false, errors: [{ message: "unexpected" }] });
    }
    if (u.includes("analyticsadmin.googleapis.com")) {
      if (u.includes("/v1beta/properties/2/customDimensions")) {
        return respond(200, { customDimensions: DIMS });
      }
      if (u.includes("/v1beta/properties/2/dataStreams")) {
        return respond(200, {
          dataStreams: [
            { name: "properties/2/dataStreams/3", type: "WEB_DATA_STREAM", webStreamData: { measurementId: "G-TEST" } }
          ]
        });
      }
      if (u.includes("/v1beta/properties?filter=")) {
        return respond(200, {
          properties: [{ name: "properties/2", displayName: "Jabiko", url: "https://jabiko.app" }]
        });
      }
      if (u.endsWith("/v1beta/accounts")) {
        return respond(200, { accounts: [{ name: "accounts/1", displayName: "Acct" }] });
      }
      return respond(404, { error: { message: "unexpected" } });
    }
    if (u.includes("analyticsdata.googleapis.com")) {
      const body = opts.body ? JSON.parse(opts.body) : {};
      const dims = (body.dimensions ?? []).map((d) => d.name);
      realtimeCalls.push({ dims });
      if (dims.length === 1 && dims[0] === "sessionId") {
        if (baselineFails) return respond(500, { error: { message: "internal error" } });
        return respond(200, baselineResponse(baselineSessions));
      }
      if (richDimsFail) return respond(400, { error: { message: "not a valid dimension: customEvent:promoId" } });
      return respond(200, richResponse(richRows));
    }
    return respondText(404, "Not found");
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

test("smoke success continues through config, GA4 dimensions and Realtime, isolating the new session", async () => {
  const realtimeCalls = [];
  // Old pre-existing traffic (in the baseline) also carries all seven
  // placements — it must be excluded. Only smoke-session counts.
  const richRows = [...guidedRows("old-session"), ...guidedRows("smoke-session")];
  const { calls, impl } = makeFetch({
    richRows,
    baselineSessions: ["old-session"],
    realtimeCalls
  });
  const result = await withFetch(impl, () =>
    runSmoke({
      env: { CLOUDFLARE_API_TOKEN: "t", GA4_ACCESS_TOKEN: "g" },
      watchSeconds: 30,
      pollIntervalMs: 20
    })
  );

  assert.ok(calls.some((c) => c.url.includes("/settings/zaraz/config")), "step 3 read the Zaraz config");
  assert.ok(calls.some((c) => c.url.includes("/customDimensions")), "step 4 checked GA4 custom dimensions");
  assert.ok(calls.some((c) => c.url.includes(":runRealtimeReport")), "step 5 ran the Realtime watch");
  assert.equal(result.guidedSession, "smoke-session", "guided session is the newly observed one");
  assert.equal(result.exitCode, 0, "a complete guided session passes");
  assert.deepEqual(result.failures, []);
});

test("smoke exits non-zero when Home or /stay-d page views are missing from the guided session", async () => {
  const realtimeCalls = [];
  const richRows = [
    pageView("smoke-session", "/"), // only ONE page view — Home + /stay-d requirement fails
    ...PLACEMENTS.map((p) => promo("smoke-session", p, PLACEMENT_ACTION[p]))
  ];
  const { impl } = makeFetch({ richRows, baselineSessions: [], realtimeCalls });
  const result = await withFetch(impl, () =>
    runSmoke({
      env: { CLOUDFLARE_API_TOKEN: "t", GA4_ACCESS_TOKEN: "g" },
      watchSeconds: 1,
      pollIntervalMs: 10
    })
  );
  assert.equal(result.exitCode, 1, "missing page views must fail smoke");
  assert.ok(result.failures.some((f) => /Home page view/.test(f)));
  assert.ok(result.failures.some((f) => /\/stay-d page view/.test(f)));
});

test("smoke stops with a non-zero exit when Zaraz is not injected", async () => {
  const realtimeCalls = [];
  // The HTML must NOT contain the literal "zaraz" (the probe greps for it).
  const { calls, impl } = makeFetch({
    richRows: [],
    baselineSessions: [],
    realtimeCalls,
    html: "<html><body>hello</body></html>"
  });
  const result = await withFetch(impl, () =>
    runSmoke({
      env: { CLOUDFLARE_API_TOKEN: "t", GA4_ACCESS_TOKEN: "g" },
      watchSeconds: 5,
      pollIntervalMs: 10
    })
  );
  assert.equal(result.exitCode, 1);
  assert.ok(!calls.some((c) => c.url.includes(":runRealtimeReport")), "no realtime watch when not injected");
});

test("smoke fails closed when the baseline Realtime read fails (no empty baseline)", async () => {
  const realtimeCalls = [];
  const { impl } = makeFetch({
    richRows: guidedRows("smoke-session"),
    baselineSessions: [],
    realtimeCalls,
    baselineFails: true
  });
  const result = await withFetch(impl, () =>
    runSmoke({
      env: { CLOUDFLARE_API_TOKEN: "t", GA4_ACCESS_TOKEN: "g" },
      watchSeconds: 5,
      pollIntervalMs: 10
    })
  );
  assert.ok(result.exitCode !== 0, "baseline failure must fail smoke, not proceed with an empty baseline");
  assert.ok(!result.placements.length || result.guidedSession === null, "no verification from an empty baseline");
});

test("smoke fails clearly when the rich custom dimensions are not queryable (no degraded fallback)", async () => {
  const realtimeCalls = [];
  const { impl } = makeFetch({
    richRows: guidedRows("smoke-session"),
    baselineSessions: [],
    realtimeCalls,
    richDimsFail: true
  });
  const result = await withFetch(impl, () =>
    runSmoke({
      env: { CLOUDFLARE_API_TOKEN: "t", GA4_ACCESS_TOKEN: "g" },
      watchSeconds: 5,
      pollIntervalMs: 10
    })
  );
  assert.ok(result.exitCode !== 0, "unverifiable placements must fail smoke, not degrade to a non-verifying mode");
});
