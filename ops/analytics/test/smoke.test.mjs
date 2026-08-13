// Production smoke CLI tests with stubbed fetch only. No real credentials.
import test from "node:test";
import assert from "node:assert/strict";
import { runSmoke, recentDelta, realtimeMaxAgeMinutes, acquireBaseline, baselineSameMinute } from "../src/cli/smoke.mjs";
import { FORWARDED_EVENTS } from "../src/desired.mjs";

const DIMS = [
  { parameterName: "promoId", name: "promoId", scope: "EVENT" },
  { parameterName: "action", name: "action", scope: "EVENT" },
  { parameterName: "placement", name: "placement", scope: "EVENT" },
  { parameterName: "locale", name: "locale", scope: "EVENT" }
];

/** A converged Zaraz config: a trigger + track action for EVERY forwarded event. */
function convergedConfig() {
  const triggers = {};
  const actions = {};
  for (const ev of FORWARDED_EVENTS) {
    const id = ev.replaceAll("_", "-");
    triggers[`trg-${id}`] = {
      name: ev,
      loadRules: [{ id: `rule-${id}`, match: "custom_event_name", op: "Eq", value: ev }],
      excludeRules: []
    };
    actions[`act-${id}`] = {
      actionType: "track",
      data: { en: ev },
      firingTriggers: [`trg-${id}`],
      blockingTriggers: []
    };
  }
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
        actions
      }
    },
    triggers,
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

function realtimeResponse({ pageViews = 2, promoClicks = 7, minutesAgo = 0 } = {}) {
  return {
    dimensionHeaders: [{ name: "eventName" }, { name: "minutesAgo" }],
    rows: [
      { dimensionValues: [{ value: "page_view" }, { value: String(minutesAgo) }], metricValues: [{ value: String(pageViews) }] },
      { dimensionValues: [{ value: "promo_click" }, { value: String(minutesAgo) }], metricValues: [{ value: String(promoClicks) }] }
    ]
  };
}

function makeFetch({
  html = '<html><head><script src="/cdn-cgi/zaraz/i.js"></script></head><body>injected</body></html>',
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
          dataStreams: [{ name: "properties/2/dataStreams/3", type: "WEB_DATA_STREAM", webStreamData: { measurementId: "G-TEST", defaultUri: "https://jabiko.app" } }]
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
    assert.deepEqual(call.body.dimensions, [{ name: "eventName" }, { name: "minutesAgo" }]);
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

test("smoke fails closed when --measurement-id does not match the discovered production stream", async () => {
  // The published Zaraz config carries the flag's TID (so the config diff would
  // converge), but the discovered jabiko.app production stream has a different
  // Measurement ID — smoke must reject the flag BEFORE any config/Realtime step.
  const mismatchedConfig = convergedConfig();
  mismatchedConfig.tools.ga4.settings.tid = "G-OTHER";
  const { calls, impl } = makeFetch({ publishedConfig: mismatchedConfig });
  const result = await withFetch(impl, () =>
    runSmoke({
      env: ENV,
      flags: { placementActionVerified: true, measurementId: "G-OTHER" },
      watchSeconds: 0,
      pollIntervalMs: 1
    })
  );
  assert.equal(result.exitCode, 1, "a mismatched measurement-id must fail smoke");
  assert.ok(!calls.some((call) => call.url.includes(":runRealtimeReport")), "no Realtime verification runs on a measurement-id mismatch");
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
    realtime: realtimeResponse({ pageViews: 1, promoClicks: 6 })
  });
  const result = await withFetch(impl, () =>
    runSmoke({ env: ENV, flags: { placementActionVerified: true }, watchSeconds: 0, pollIntervalMs: 1 })
  );
  assert.equal(result.exitCode, 1);
});


test("pre-existing ambient traffic (older than the watch) cannot satisfy the guided Realtime proof", async () => {
  const ambient = realtimeResponse({ pageViews: 50, promoClicks: 80, minutesAgo: 5 });
  const { impl } = makeFetch({ baselineRealtime: ambient, realtime: ambient });
  const result = await withFetch(impl, () =>
    runSmoke({ env: ENV, flags: { placementActionVerified: true }, watchSeconds: 0, pollIntervalMs: 1 })
  );
  assert.equal(result.exitCode, 1);
  assert.equal(result.eventCounts.page_view ?? 0, 0);
  assert.equal(result.eventCounts.promo_click ?? 0, 0);
});

test("expiry of pre-baseline events does not subtract from the guided interaction", async () => {
  // 8 promo clicks about to expire from the 30-minute rolling window (minutesAgo
  // 29) must not cancel the operator's 7 new clicks (minutesAgo 0).
  const { impl } = makeFetch({
    baselineRealtime: realtimeResponse({ pageViews: 1, promoClicks: 8, minutesAgo: 29 }),
    realtime: realtimeResponse({ pageViews: 2, promoClicks: 7, minutesAgo: 0 })
  });
  const result = await withFetch(impl, () =>
    runSmoke({ env: ENV, flags: { placementActionVerified: true }, watchSeconds: 0, pollIntervalMs: 1 })
  );
  assert.equal(result.exitCode, 0);
  assert.equal(result.eventCounts.promo_click, 7, "the 7 new promo clicks are counted, not clamped to 0");
});

test("pre-baseline same-minute traffic cannot satisfy the guided Realtime proof", async () => {
  // The baseline already contains >=2 page_view and >=7 promo_click in the same
  // minutesAgo=0 bucket; with no new guided events, smoke must NOT pass.
  const preExisting = realtimeResponse({ pageViews: 2, promoClicks: 7, minutesAgo: 0 });
  const { impl } = makeFetch({ baselineRealtime: preExisting, realtime: preExisting });
  const result = await withFetch(impl, () =>
    runSmoke({ env: ENV, flags: { placementActionVerified: true }, watchSeconds: 0, pollIntervalMs: 1 })
  );
  assert.equal(result.exitCode, 1);
  assert.equal(result.eventCounts.page_view, 0);
  assert.equal(result.eventCounts.promo_click, 0);
});

test("recentDelta ages baseline buckets: only the baseline age-0 bucket is subtracted", () => {
  // Baseline has 5 promo clicks at minutesAgo=1 (about to leave the window) and
  // 3 at minutesAgo=0 (pre-baseline traffic in the same bucket as the guide).
  // One minute later the operator adds 7 new promo clicks (minutesAgo=0).
  const baselineRows = [
    { eventName: "promo_click", minutesAgo: "1", eventCount: 5 },
    { eventName: "promo_click", minutesAgo: "0", eventCount: 3 }
  ];
  const currentRows = [{ eventName: "promo_click", minutesAgo: "0", eventCount: 10 }];
  const delta = recentDelta(currentRows, baselineRows, 1);
  // current(0..1) = 10, baseline age-0 bucket = 3 → 7 new clicks. The aged-out
  // age-1 baseline bucket (5) must NOT be subtracted.
  assert.equal(delta.get("promo_click"), 7, "only the baseline age-0 bucket is subtracted");
});

test("calendar-minute buckets align the Realtime window (baseline at 12:34:59)", () => {
  // 62 real seconds elapse, but two GA minute buckets roll (12:35, 12:36).
  // floor(62/60)=1 would under-represent the window and subtract live guided
  // traffic as if it were pre-baseline.
  const baselineAt = Date.UTC(2026, 7, 12, 12, 34, 59);
  const now = Date.UTC(2026, 7, 12, 12, 36, 1);
  assert.equal(realtimeMaxAgeMinutes({ baselineAt, now }), 2);
  assert.equal(
    Math.floor((now - baselineAt) / 60000),
    1,
    "sanity: floor(elapsed/60000) is only 1 — this is exactly the bug the calendar alignment fixes"
  );
});

test("bucket rollover cannot subtract valid guided traffic into false failure", () => {
  // Baseline captured at 12:34:59. Its age-0 bucket (12:34) holds 7 pre-baseline
  // promo clicks; an older age-1 bucket holds 9 more.
  const baselineRows = [
    { eventName: "promo_click", minutesAgo: "0", eventCount: 7 },
    { eventName: "promo_click", minutesAgo: "1", eventCount: 9 }
  ];
  // At 12:36:01 (calendar delta 2) the guided 7 promo clicks landed in 12:35
  // (age 1); the 12:34 pre-baseline is now age 2 (still inside a 2-minute
  // window). The floor-based window (1) would exclude the age-2 pre-baseline
  // while still subtracting it -> false 0.
  const currentRows = [
    { eventName: "promo_click", minutesAgo: "1", eventCount: 7 },
    { eventName: "promo_click", minutesAgo: "2", eventCount: 7 }
  ];
  const delta = recentDelta(currentRows, baselineRows, 2);
  assert.equal(delta.get("promo_click"), 7, "calendar-aligned window keeps the 7 guided clicks");
  const buggy = recentDelta(currentRows, baselineRows, 1);
  assert.equal(buggy.get("promo_click"), 0, "the floor-based window produces a false failure");
});

test("baselineSameMinute accepts a request within one calendar minute", () => {
  const t = Date.UTC(2026, 7, 12, 12, 34, 10);
  assert.ok(baselineSameMinute({ requestStart: t, requestEnd: t + 40000 }));
});

test("baselineSameMinute rejects a request crossing a calendar-minute boundary", () => {
  const t = Date.UTC(2026, 7, 12, 12, 34, 59);
  assert.ok(!baselineSameMinute({ requestStart: t, requestEnd: t + 2000 }), "12:34:59 -> 12:35:01 crosses a bucket");
});

test("acquireBaseline accepts a same-minute request and returns rows + baselineAt", async () => {
  const rows = [{ eventName: "page_view", minutesAgo: "0", eventCount: 2 }];
  let calls = 0;
  const now = () => {
    calls += 1;
    return Date.UTC(2026, 7, 12, 12, 34, 30) + (calls - 1) * 1000;
  };
  const result = await acquireBaseline({ fetchRealtime: async () => rows, maxAttempts: 3, now });
  assert.equal(result.rows, rows);
  assert.equal(result.baselineAt, Date.UTC(2026, 7, 12, 12, 34, 30));
  assert.equal(calls, 2, "requestStart and requestEnd are both recorded");
});

test("acquireBaseline discards a cross-minute attempt and accepts the next stable one", async () => {
  let calls = 0;
  const now = () => {
    calls += 1;
    if (calls === 1) return Date.UTC(2026, 7, 12, 12, 34, 59); // attempt 1 start
    if (calls === 2) return Date.UTC(2026, 7, 12, 12, 35, 1); // attempt 1 end -> crosses
    return Date.UTC(2026, 7, 12, 12, 35, 10) + (calls - 3) * 1000; // attempt 2: 12:35:10, 12:35:11
  };
  let fetchCalls = 0;
  const result = await acquireBaseline({
    fetchRealtime: async () => { fetchCalls += 1; return [{ eventName: "promo_click", minutesAgo: "0", eventCount: 7 }]; },
    maxAttempts: 3,
    now
  });
  assert.equal(fetchCalls, 2, "the cross-minute attempt is discarded and re-fetched");
  assert.equal(result.baselineAt, Date.UTC(2026, 7, 12, 12, 35, 10), "the next stable attempt is authoritative");
});

test("acquireBaseline fails closed after repeated calendar-minute crossings", async () => {
  let calls = 0;
  const now = () => {
    calls += 1;
    const base = Date.UTC(2026, 7, 12, 12, 34, 59);
    return base + (calls % 2 === 1 ? 0 : 2000); // every attempt start 12:34:59, end 12:35:01
  };
  await assert.rejects(
    () => acquireBaseline({ fetchRealtime: async () => [], maxAttempts: 3, now }),
    /boundary|baseline/i
  );
});
