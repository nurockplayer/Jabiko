import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, it } from "vitest";

const source = readFileSync(new URL("./wait-cloudflare-check.mjs", import.meta.url), "utf8");
const sha = "a".repeat(40);
const complete = {
  id: 7, name: "Cloudflare Pages", head_sha: sha,
  app: { id: 85455, slug: "cloudflare-workers-and-pages" },
  status: "completed", conclusion: "success"
};
const payload = (checks: unknown[]) => ({ total_count: checks.length, check_runs: checks });
type Reply = { body?: unknown; status?: number; error?: string };

async function runGate(replies: Reply[], env: Record<string, string> = {}) {
  let now = 0;
  const lines: string[] = [];
  const requests: { url: string; init: RequestInit }[] = [];
  const process = { env: { GITHUB_REPOSITORY: "nurockplayer/Jabiko", GITHUB_SHA: sha, GITHUB_EVENT_NAME: "push", PR_HEAD_REPOSITORY: "nurockplayer/Jabiko", GH_TOKEN: "test-only-token", ...env }, exitCode: 0 };
  await runInNewContext(source, {
    process, URL, AbortSignal, Date: { now: () => now },
    setTimeout: (callback: () => void, milliseconds: number) => { now += milliseconds; callback(); },
    console: { log: (line: string) => lines.push(line), error: (line: string) => lines.push(line) },
    fetch: async (url: string, init: RequestInit) => {
      requests.push({ url, init });
      const reply = replies[Math.min(requests.length - 1, replies.length - 1)];
      if (reply.error) throw new Error(reply.error);
      return new Response(JSON.stringify(reply.body), { status: reply.status ?? 200 });
    }
  });
  assert.ok(!lines.join("\n").includes("test-only-token"));
  return { code: process.exitCode, requests, lines, now };
}

describe("Cloudflare deployment wait gate", () => {
  it("accepts only the exact successful app/SHA check and uses the existing token", async () => {
    const result = await runGate([{ body: payload([complete]) }]);
    assert.equal(result.code, 0);
    assert.equal(result.requests.length, 1);
    assert.equal(result.requests[0].url, `https://api.github.com/repos/nurockplayer/Jabiko/commits/${sha}/check-runs?check_name=Cloudflare%20Pages&filter=latest&per_page=100`);
    assert.equal(new Headers(result.requests[0].init.headers).get("authorization"), "Bearer test-only-token");
    assert.ok(result.requests[0].init.signal);
  });

  it("uses the PR head rather than the workflow merge or base SHA", async () => {
    const prHead = "b".repeat(40);
    const result = await runGate([{ body: payload([{ ...complete, head_sha: prHead }]) }], {
      GITHUB_EVENT_NAME: "pull_request", PR_HEAD_SHA: prHead, GITHUB_BASE_SHA: "c".repeat(40)
    });
    assert.equal(result.code, 0);
    assert.equal(result.requests.length, 1);
    assert.ok(result.requests[0].url.includes(`/commits/${prHead}/`));
    assert.ok(!result.requests[0].url.includes(`/commits/${sha}/`));
  });

  it("does not fall back to the merge SHA when a PR head is missing", async () => {
    const result = await runGate([{ body: payload([complete]) }], { GITHUB_EVENT_NAME: "pull_request", PR_HEAD_SHA: "" });
    assert.equal(result.code, 1);
    assert.equal(result.requests.length, 0);
  });

  it("does not wait for an unavailable Pages preview on a verified fork PR", async () => {
    const result = await runGate([{ body: payload([]) }], {
      GITHUB_EVENT_NAME: "pull_request", PR_HEAD_SHA: sha, PR_HEAD_REPOSITORY: "contributor/Jabiko"
    });
    assert.equal(result.code, 0);
    assert.equal(result.requests.length, 0);
    assert.equal(result.now, 0);
    assert.match(result.lines.join("\n"), /Fork PR.*no Pages preview/);
    assert.ok(!result.lines.join("\n").includes("Pages succeeded"));
  });

  for (const prRepository of ["", "../wrong"]) {
    it(`rejects missing or malformed PR repository identity ${JSON.stringify(prRepository)}`, async () => {
      const result = await runGate([{ body: payload([complete]) }], {
        GITHUB_EVENT_NAME: "pull_request", PR_HEAD_SHA: sha, PR_HEAD_REPOSITORY: prRepository
      });
      assert.equal(result.code, 1);
      assert.equal(result.requests.length, 0);
    });
  }

  it("retains the check for the same PR repository with case differences", async () => {
    const result = await runGate([{ body: payload([complete]) }], {
      GITHUB_EVENT_NAME: "pull_request", PR_HEAD_SHA: sha, PR_HEAD_REPOSITORY: "NUROCKPLAYER/jabiko"
    });
    assert.equal(result.code, 0);
    assert.equal(result.requests.length, 1);
  });

  it("still fails when a same-repository PR has no Pages check", async () => {
    const result = await runGate([{ body: payload([]) }], {
      GITHUB_EVENT_NAME: "pull_request", PR_HEAD_SHA: sha
    });
    assert.equal(result.code, 1);
    assert.equal(result.now, 15 * 60 * 1000);
    assert.match(result.lines.join("\n"), /Timed out/);
  });

  it("does not allow fork detection to conceal a missing PR head", async () => {
    const result = await runGate([{ body: payload([complete]) }], {
      GITHUB_EVENT_NAME: "pull_request", PR_HEAD_SHA: "", PR_HEAD_REPOSITORY: "contributor/Jabiko"
    });
    assert.equal(result.code, 1);
    assert.equal(result.requests.length, 0);
  });

  it("wires PR repository identity into both workflow gates", () => {
    for (const file of ["ci.yml", "browser-acceptance.yml"]) {
      const workflow = readFileSync(new URL(`../.github/workflows/${file}`, import.meta.url), "utf8");
      assert.ok(workflow.includes("PR_HEAD_REPOSITORY: ${{ github.event.pull_request.head.repo.full_name }}"));
    }
  });

  it("preserves the original browser validation budget in addition to the gate budget", () => {
    const workflow = readFileSync(new URL("../.github/workflows/browser-acceptance.yml", import.meta.url), "utf8");
    const jobMinutes = Number(workflow.match(/^    timeout-minutes: (\d+)$/m)?.[1]);
    const gateMinutes = Number(workflow.match(/^        timeout-minutes: (\d+)$/m)?.[1]);
    assert.equal(gateMinutes, 16);
    assert.ok(jobMinutes >= 20 + gateMinutes);
  });

  it("keeps push validation bound to the workflow SHA despite an unrelated PR head", async () => {
    const result = await runGate([{ body: payload([complete]) }], { PR_HEAD_SHA: "b".repeat(40) });
    assert.equal(result.code, 0);
    assert.equal(result.requests.length, 1);
    assert.ok(result.requests[0].url.includes(`/commits/${sha}/`));
  });

  it("rejects an unsupported event before reading checks", async () => {
    const result = await runGate([{ body: payload([complete]) }], { GITHUB_EVENT_NAME: "workflow_dispatch" });
    assert.equal(result.code, 1);
    assert.equal(result.requests.length, 0);
  });

  it("waits through absence and a running check before success", async () => {
    const result = await runGate([
      { body: payload([]) },
      { body: payload([{ ...complete, status: "in_progress", conclusion: null }]) },
      { body: payload([complete]) }
    ]);
    assert.equal(result.code, 0);
    assert.equal(result.requests.length, 3);
    assert.equal(result.now, 10000);
  });

  for (const check of [
    { ...complete, head_sha: "b".repeat(40) },
    { ...complete, app: { id: 1, slug: "cloudflare-workers-and-pages" } },
    { ...complete, app: { id: 85455, slug: "impostor" } },
    { ...complete, name: "another check" }
  ]) {
    it(`does not accept a mismatched check ${JSON.stringify(check)}`, async () => {
      const result = await runGate([{ body: payload([check]) }]);
      assert.equal(result.code, 1);
      assert.equal(result.now, 15 * 60 * 1000);
      assert.match(result.lines.join("\n"), /Timed out/);
    });
  }

  for (const conclusion of ["failure", "cancelled", "skipped", "neutral", null]) {
    it(`fails on unsuccessful terminal conclusion ${conclusion}`, async () => {
      const result = await runGate([{ body: payload([{ ...complete, conclusion }]) }]);
      assert.equal(result.code, 1);
      assert.equal(result.requests.length, 1);
      assert.match(result.lines.join("\n"), /not successful/);
    });
  }

  for (const entry of [
    null, {},
    { name: "Cloudflare Pages", head_sha: sha, status: "in_progress", conclusion: null },
    { ...complete, app: { id: 85455 } },
    { ...complete, head_sha: "malformed" }
  ]) {
    it(`rejects an unidentifiable entry beside a valid success ${JSON.stringify(entry)}`, async () => {
      const result = await runGate([{ body: payload([complete, entry]) }]);
      assert.equal(result.code, 1);
      assert.equal(result.requests.length, 1);
      assert.match(result.lines.join("\n"), /Malformed check identity/);
    });
  }

  it("ignores fully identified nonmatching checks without concealing unknown identities", async () => {
    const result = await runGate([{ body: payload([
      complete,
      { ...complete, app: { id: 1, slug: "other-app" }, status: "in_progress", conclusion: null },
      { ...complete, head_sha: "b".repeat(40), status: "in_progress", conclusion: null }
    ]) }]);
    assert.equal(result.code, 0);
    assert.equal(result.requests.length, 1);
  });

  it("does not ignore a second matching running check", async () => {
    const result = await runGate([{ body: payload([complete, { ...complete, id: 8, status: "in_progress", conclusion: null }]) }]);
    assert.equal(result.code, 1);
    assert.equal(result.now, 15 * 60 * 1000);
  });

  for (const reply of [
    { body: {}, status: 403 }, { error: "request timeout" },
    { body: {} }, { body: { total_count: 101, check_runs: [complete] } }
  ]) {
    it(`fails closed on unavailable or incomplete API data ${JSON.stringify(reply)}`, async () => {
      const result = await runGate([reply]);
      assert.equal(result.code, 1);
      assert.equal(result.requests.length, 1);
    });
  }

  it("times out when no Cloudflare check exists", async () => {
    const result = await runGate([{ body: payload([]) }]);
    assert.equal(result.code, 1);
    assert.equal(result.requests.length, 180);
    assert.match(result.lines.join("\n"), /Timed out/);
  });

  for (const env of [{ GH_TOKEN: "" }, { GITHUB_SHA: "bad" }, { GITHUB_REPOSITORY: "../wrong" }]) {
    it(`rejects invalid required configuration ${Object.keys(env)}`, async () => {
      const result = await runGate([{ body: payload([complete]) }], env);
      assert.equal(result.code, 1);
      assert.equal(result.requests.length, 0);
    });
  }
});
