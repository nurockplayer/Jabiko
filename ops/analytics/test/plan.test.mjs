// plan tests: read-only contract + Measurement-ID recompute.
import test from "node:test";
import assert from "node:assert/strict";
import { runPlan } from "../src/cli/plan.mjs";

function fakeFetch(router) {
  const calls = [];
  const impl = async (url, opts = {}) => {
    const method = opts.method || "GET";
    calls.push({ method, url: String(url) });
    const route = router(String(url));
    return {
      ok: route.status >= 200 && route.status < 300,
      status: route.status,
      text: async () => route.text ?? "",
      json: async () => route.json ?? {}
    };
  };
  return { calls, impl };
}

// Run `fn` with plan's verbose console output suppressed. plan writes a large
// report to the console; the Node 22/24 test runner's child-process IPC
// ("Unable to deserialize cloned data") can trip when that output is large,
// even though every individual test passes. The tests assert runPlan's return
// value, not its console output, so suppressing the logs is safe.
async function withQuietLogs(fn) {
  const original = console.log;
  console.log = () => {};
  try {
    return await fn();
  } finally {
    console.log = original;
  }
}

// A router factory that returns a zone, Zaraz workflow/published export/draft
// config, and GA4 discovery with measurementId "G-X".
function makeRouter({ workflow = "realtime", exportConfig = {}, draftConfig = null } = {}) {
  return (url) => {
    if (url.startsWith("https://jabiko.app/")) {
      if (url.includes("cdn-cgi/zaraz")) return { status: 404, text: "Not found" };
      return { status: 200, text: "<html><head></head><body>no zaraz here</body></html>" };
    }
    if (url.includes("api.cloudflare.com")) {
      if (url.includes("/settings/zaraz/workflow")) {
        return { status: 200, json: { success: true, result: workflow } };
      }
      if (url.includes("/settings/zaraz/export")) {
        return { status: 200, json: { success: true, result: exportConfig } };
      }
      if (url.includes("/settings/zaraz/config")) {
        return { status: 200, json: { success: true, result: draftConfig ?? exportConfig } };
      }
      if (url.includes("/zones?name=")) {
        return { status: 200, json: { success: true, result: [{ id: "zone1", name: "jabiko.app", account: { name: "Acct" } }] } };
      }
      return { status: 404, json: { success: false, errors: [{ message: "unexpected" }] } };
    }
    if (url.includes("analyticsadmin.googleapis.com")) {
      if (url.endsWith("/v1beta/accounts")) {
        return { status: 200, json: { accounts: [{ name: "accounts/1", displayName: "Acct" }] } };
      }
      if (url.includes("/v1beta/properties?filter=")) {
        return { status: 200, json: { properties: [{ name: "properties/2", displayName: "Jabiko", url: "https://jabiko.app" }] } };
      }
      if (url.includes("/v1beta/properties/2/dataStreams")) {
        return { status: 200, json: { dataStreams: [{ name: "properties/2/dataStreams/3", type: "WEB_DATA_STREAM", webStreamData: { measurementId: "G-X", defaultUri: "https://jabiko.app" } }] } };
      }
      if (url.includes("/v1beta/properties/2/customDimensions")) {
        return { status: 200, json: { customDimensions: [] } };
      }
      return { status: 404, json: { error: { message: "unexpected" } } };
    }
    return { status: 404, text: "Not found" };
  };
}

test("plan issues only GET requests even with full credentials (plan-no-write)", async () => {
  const { calls, impl } = fakeFetch(makeRouter());
  const prev = globalThis.fetch;
  globalThis.fetch = impl;
  try {
    await withQuietLogs(() => runPlan({ env: { CLOUDFLARE_API_TOKEN: "tok", GA4_ACCESS_TOKEN: "gtok" }, repoRoot: process.cwd() }));
  } finally {
    globalThis.fetch = prev;
  }
  assert.ok(calls.length > 0, "plan made network calls");
  for (const c of calls) {
    assert.equal(c.method, "GET", `plan issued a ${c.method} ${c.url} — plan must be read-only`);
  }
  // listCustomDimensions is a read-only GET; the only custom-dimension
  // mutation is a POST. Confirm plan never issues it.
  assert.ok(
    calls.every((c) => !(c.url.includes("/customDimensions") && c.method !== "GET")),
    "plan never mutates custom dimensions (no POST/PUT/DELETE)"
  );
});

test("plan recomputes the Zaraz desired-state diff with the discovered Measurement ID", async () => {
  const { calls, impl } = fakeFetch(makeRouter({ exportConfig: {} }));
  const prev = globalThis.fetch;
  globalThis.fetch = impl;
  let result;
  try {
    result = await withQuietLogs(() => runPlan({ env: { CLOUDFLARE_API_TOKEN: "tok", GA4_ACCESS_TOKEN: "gtok" }, repoRoot: process.cwd() }));
  } finally {
    globalThis.fetch = prev;
  }
  assert.equal(result.effectiveMeasurementId, "G-X", "the discovered Measurement ID is adopted");
  assert.ok(result.zarazFindings.length > 0, "the Zaraz diff is reported");
  assert.ok(
    !result.zarazFindings.some((f) => f.code === "MEASUREMENT_ID_UNSPECIFIED"),
    "the Zaraz diff was recomputed with the discovered Measurement ID (not reported as unspecified)"
  );
  assert.ok(
    result.zarazFindings.some((f) => f.code === "GA4_TOOL_MISSING"),
    "with an empty config and a known Measurement ID, the diff reports the missing GA4 tool"
  );
  assert.ok(calls.some((c) => c.url.includes("/v1beta/properties?filter=")), "GA4 discovery used the v1beta contract");
});

test("plan exposes CLOUDFLARE_PREVIEW_PENDING when the draft differs from the published export", async () => {
  // Preview workflow: the unpublished draft has an extra tool the published
  // /export does not — production is not converged, so plan must gate.
  const published = {};
  const draft = {
    tools: { extra: { component: "custom-html", name: "Extra", type: "component", settings: {}, actions: {} } },
    settings: {},
    triggers: {}
  };
  const { impl } = fakeFetch(makeRouter({ workflow: "preview", exportConfig: published, draftConfig: draft }));
  const prev = globalThis.fetch;
  globalThis.fetch = impl;
  let result;
  try {
    result = await withQuietLogs(() => runPlan({ env: { CLOUDFLARE_API_TOKEN: "tok", GA4_ACCESS_TOKEN: "gtok" }, repoRoot: process.cwd() }));
  } finally {
    globalThis.fetch = prev;
  }
  assert.ok(result.gatesHit.includes("CLOUDFLARE_PREVIEW_PENDING"), "pending preview changes gate the plan");
});

test("plan does not gate when the preview draft equals the published export", async () => {
  const published = {};
  const { impl } = fakeFetch(makeRouter({ workflow: "preview", exportConfig: published, draftConfig: published }));
  const prev = globalThis.fetch;
  globalThis.fetch = impl;
  let result;
  try {
    result = await withQuietLogs(() => runPlan({ env: { CLOUDFLARE_API_TOKEN: "tok", GA4_ACCESS_TOKEN: "gtok" }, repoRoot: process.cwd() }));
  } finally {
    globalThis.fetch = prev;
  }
  assert.ok(!result.gatesHit.includes("CLOUDFLARE_PREVIEW_PENDING"), "no pending-preview gate when draft == published");
});

test("plan rejects a --measurement-id that does not match the discovered production stream", async () => {
  const { impl } = fakeFetch(makeRouter());
  const prev = globalThis.fetch;
  globalThis.fetch = impl;
  let result;
  try {
    result = await withQuietLogs(() =>
      runPlan({
        env: { CLOUDFLARE_API_TOKEN: "tok", GA4_ACCESS_TOKEN: "gtok" },
        flags: { measurementId: "G-OTHER" },
        repoRoot: process.cwd()
      })
    );
  } finally {
    globalThis.fetch = prev;
  }
  assert.ok(result.gatesHit.includes("GA4_MEASUREMENT_ID_MISMATCH"), "a mismatched --measurement-id gates the plan");
  assert.equal(result.effectiveMeasurementId, null, "no diff is computed against mismatched targets");
});

test("plan blocks readiness when the workflow value is unknown", async () => {
  const { impl } = fakeFetch(makeRouter({ workflow: "weird" }));
  const prev = globalThis.fetch;
  globalThis.fetch = impl;
  let result;
  try {
    result = await withQuietLogs(() =>
      runPlan({ env: { CLOUDFLARE_API_TOKEN: "tok", GA4_ACCESS_TOKEN: "gtok" }, repoRoot: process.cwd() })
    );
  } finally {
    globalThis.fetch = prev;
  }
  assert.ok(result.gatesHit.includes("CLOUDFLARE_WORKFLOW_UNKNOWN"), "an unknown workflow must block plan readiness");
});
