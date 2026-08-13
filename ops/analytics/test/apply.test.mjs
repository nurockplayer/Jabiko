// ops/analytics apply CLI tests (stubbed fetch, no real credentials).
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runApply } from "../src/cli/apply.mjs";
import { FORWARDED_EVENTS } from "../src/desired.mjs";

const ZONE_ID = "z1";

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
  putConflict = false,
  conflictFreshBlocker = false,
  dataStreamMeasurementId = "G-TEST",
  draftConfig = exportConfig()
} = {}) {
  const calls = [];
  let putApplied = false;
  let published = false;
  let exportReads = 0;

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
        exportReads += 1;
        if (exportFails) return respond(403, { success: false, errors: [{ code: 10000, message: "Authentication error" }] });
        if (conflictFreshBlocker && exportReads >= 2) {
          // The fresh published export (after a PUT conflict) now carries a
          // tool-level blocker — the retry must fail closed.
          const blocker = convergedConfig();
          blocker.tools.ga4.blockingTriggers = ["trg-something"];
          return respond(200, { success: true, result: blocker });
        }
        const liveAfterMutation = workflow === "realtime" ? putApplied : published;
        const result = liveAfterMutation && !postApplyUnconverged ? convergedConfig() : exportConfig();
        return respond(200, { success: true, result });
      }
      if (u.includes("/settings/zaraz/config") && method === "PUT") {
        if (putConflict) {
          return respond(409, { success: false, errors: [{ code: 7204, message: "config version conflict" }] });
        }
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
          dataStreams: [{ name: "properties/2/dataStreams/3", type: "WEB_DATA_STREAM", webStreamData: { measurementId: dataStreamMeasurementId, defaultUri: "https://jabiko.app" } }]
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

function tempStateDir() {
  return mkdtempSync(join(tmpdir(), "ops-an-state-"));
}

test("dry-run writes no snapshot/state files and never PUTs (boolean true)", async () => {
  const stateDir = tempStateDir();
  try {
    const { calls, impl } = makeFetch({ dimsList: NO_DIMS });
    const result = await withFetch(impl, () =>
      runApply({ ...BASE_ARGS, flags: { ...BASE_ARGS.flags, dryRun: true }, stateDir })
    );
    assert.equal(result.exitCode, 0, "dry-run succeeds without writing");
    assert.ok(!calls.some((c) => c.method === "PUT"), "dry-run never issues a Zaraz PUT");
    assert.deepEqual(readdirSync(stateDir), [], "no snapshot/state files are created during a dry-run");
  } finally {
    rmSync(stateDir, { recursive: true, force: true });
  }
});

test("the string form 'true' for --dry-run is treated as a dry run (no writes, no PUT)", async () => {
  const stateDir = tempStateDir();
  try {
    const { calls, impl } = makeFetch({ dimsList: NO_DIMS });
    const result = await withFetch(impl, () =>
      runApply({ ...BASE_ARGS, flags: { ...BASE_ARGS.flags, dryRun: "true" }, stateDir })
    );
    assert.equal(result.exitCode, 0);
    assert.ok(!calls.some((c) => c.method === "PUT"), "string 'true' must not invert the safety flag into a real mutation");
    assert.deepEqual(readdirSync(stateDir), []);
  } finally {
    rmSync(stateDir, { recursive: true, force: true });
  }
});

test("an invalid boolean value for --dry-run fails closed and never writes", async () => {
  const stateDir = tempStateDir();
  try {
    const { calls, impl } = makeFetch({ dimsList: NO_DIMS });
    const result = await withFetch(impl, () =>
      runApply({ ...BASE_ARGS, flags: { ...BASE_ARGS.flags, dryRun: "maybe" }, stateDir })
    );
    assert.notEqual(result.exitCode, 0, "invalid boolean value must fail closed");
    assert.ok(!calls.some((c) => c.method === "PUT"), "no PUT on an invalid dry-run value");
    assert.deepEqual(readdirSync(stateDir), [], "no snapshot/state files are created");
  } finally {
    rmSync(stateDir, { recursive: true, force: true });
  }
});

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

test("preview workflow fails closed on PUT conflict and never retries from published /export", async () => {
  const { calls, impl } = makeFetch({ workflow: "preview", putConflict: true });
  const result = await withFetch(impl, () => runApply(BASE_ARGS));
  assert.notEqual(result.exitCode, 0, "a preview PUT conflict must fail closed");
  const puts = calls.filter((c) => c.method === "PUT" && c.url.includes("/settings/zaraz/config"));
  assert.equal(puts.length, 1, "no retry PUT is issued in preview workflow");
  assert.ok(!calls.some((c) => c.method === "POST" && c.url.includes("/settings/zaraz/publish")), "a conflicted PUT must not be published");
});

test("apply fails closed when --measurement-id does not match the discovered production stream", async () => {
  const { calls, impl } = makeFetch({ dataStreamMeasurementId: "G-OTHER" });
  const result = await withFetch(impl, () => runApply(BASE_ARGS));
  assert.notEqual(result.exitCode, 0, "a mismatched measurement-id must fail before any Zaraz mutation");
  assert.ok(!calls.some((c) => c.method === "PUT"), "no Zaraz PUT when the measurement-id is not bound to the production stream");
});

test("apply succeeds when --measurement-id matches the discovered production stream", async () => {
  const { impl } = makeFetch({ dataStreamMeasurementId: "G-TEST" });
  const result = await withFetch(impl, () => runApply(BASE_ARGS));
  assert.equal(result.exitCode, 0, "a matching measurement-id proceeds");
});

test("realtime conflict rebuild fails closed when the fresh export introduces a blocker", async () => {
  // The first PUT conflicts; the re-read published /export now has a tool-level
  // blocker. apply must inspect the rebuild findings and stop BEFORE a second PUT.
  const { calls, impl } = makeFetch({ workflow: "realtime", putConflict: true, conflictFreshBlocker: true });
  const result = await withFetch(impl, () => runApply(BASE_ARGS));
  assert.notEqual(result.exitCode, 0, "a blocker in the rebuilt state must fail closed");
  const puts = calls.filter((c) => c.method === "PUT" && c.url.includes("/settings/zaraz/config"));
  assert.equal(puts.length, 1, "no second PUT is issued when the rebuild introduces a blocker");
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
