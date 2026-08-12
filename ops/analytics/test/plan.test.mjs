// plan-no-write contract test: bin/plan must be strictly read-only. Runs the
// plan CLI with full (fake) credentials and a recording fetch, then asserts
// every issued request is a GET and no mutation endpoint is ever reached.

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

function router(url) {
  if (url.startsWith("https://jabiko.app/")) {
    if (url.includes("cdn-cgi/zaraz")) {
      return { status: 404, text: "Not found" };
    }
    return { status: 200, text: "<html><head></head><body>no zaraz here</body></html>" };
  }
  if (url.includes("api.cloudflare.com")) {
    if (url.includes("/settings/zaraz/config")) {
      return { status: 200, json: { success: true, result: {} } };
    }
    if (url.includes("/zones?name=")) {
      return {
        status: 200,
        json: {
          success: true,
          result: [
            { id: "zone1", name: "jabiko.app", account: { name: "Acct" } }
          ]
        }
      };
    }
    return { status: 404, json: { success: false, errors: [{ message: "unexpected" }] } };
  }
  if (url.includes("analyticsadmin.googleapis.com")) {
    return { status: 200, json: { accounts: [] } };
  }
  return { status: 404, text: "Not found" };
}

test("plan issues only GET requests even with full credentials (plan-no-write)", async () => {
  const { calls, impl } = fakeFetch(router);
  const prev = globalThis.fetch;
  globalThis.fetch = impl;
  try {
    await runPlan({
      env: { CLOUDFLARE_API_TOKEN: "tok", GA4_ACCESS_TOKEN: "gtok" },
      repoRoot: process.cwd()
    });
  } finally {
    globalThis.fetch = prev;
  }

  assert.ok(calls.length > 0, "plan made network calls");
  for (const c of calls) {
    assert.equal(
      c.method,
      "GET",
      `plan issued a ${c.method} ${c.url} — plan must be read-only`
    );
  }
  assert.ok(
    calls.every((c) => !c.url.includes("/customDimensions")),
    "plan never touches the customDimensions mutation endpoint"
  );
});
