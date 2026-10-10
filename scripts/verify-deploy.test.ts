import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, it } from "vitest";

const source = readFileSync(new URL("./verify-deploy.mjs", import.meta.url), "utf8");
type Headers = { css: string; js: string; cache: string; spa: string };

// Exercise the actual CLI without network requests or importing its auto-run entry.
async function runSmoke(overrides: Partial<Headers> = {}) {
  const headers = { css: "text/css", js: "application/javascript", cache: "no-store", spa: "text/html", ...overrides };
  const lines: string[] = [];
  const paths: string[] = [];
  let exitCode: number | undefined;
  const fetch = async (url: string) => {
    const path = new URL(url).pathname;
    paths.push(path);
    if (path === "/") {
      return new Response('<link href="/assets/index-test.css"><script src="/assets/index-test.js"></script>', {
        headers: { "content-type": "text/html" }
      });
    }
    if (path === "/assets/index-test.css") return new Response("body {}", { headers: { "content-type": headers.css } });
    if (path === "/assets/index-test.js") return new Response("export {};", { headers: { "content-type": headers.js } });
    if (path.startsWith("/assets/verify-missing-")) {
      return new Response("Not found", { status: 404, headers: { "cache-control": headers.cache } });
    }
    assert.equal(path, "/challenge");
    return new Response("<main>fixture</main>", { headers: { "content-type": headers.spa } });
  };
  await runInNewContext(source, {
    fetch,
    console: { log: (line: string) => lines.push(line), error: (line: string) => lines.push(line) },
    process: { env: { DEPLOY_URL: "https://fixture.invalid" }, exit: (code: number) => { exitCode = code; } }
  });
  return { exitCode, lines, paths };
}

describe("deployment smoke header contracts", () => {
  it("preserves all five checks for the existing deployment headers", async () => {
    const result = await runSmoke();
    assert.equal(result.exitCode, 0);
    assert.equal(result.paths.length, 5);
    assert.equal(result.lines.filter((line) => line.startsWith("PASS")).length, 5);
    assert.match(result.lines.at(-1) ?? "", /DEPLOY VERIFIED/);
  });

  const invalidHeaders = [
    ["css", "text/css-invalid"],
    ["css", "application/json; note=text/css"],
    ["js", "application/not-javascript"],
    ["js", "text/html; charset=javascript"],
    ["js", "application/javascript-invalid"],
    ["spa", "text/html-not-really"],
    ["spa", "application/json; note=text/html"],
    ["cache", "x-no-store"],
    ["cache", "no-store-invalid"],
    ["cache", "no-store=false"],
    ["cache", 'private="no-store"'],
    ["cache", 'private="field,no-store,other"'],
    ["cache", 'extension="escaped\\\",no-store,other"'],
    ["cache", 'extension="unterminated, no-store'],
    ["cache", "\u00a0no-store"],
    ["css", ""], ["js", ""], ["spa", ""], ["cache", ""]
  ] as const;
  for (const [field, value] of invalidHeaders) {
    it(`rejects ${field} lookalike ${JSON.stringify(value)}`, async () => {
      const result = await runSmoke({ [field]: value });
      assert.equal(result.exitCode, 1, result.lines.join("\n"));
      assert.equal(result.lines.filter((line) => line.startsWith("FAIL")).length, 1);
      assert.match(result.lines.at(-1) ?? "", /DEPLOY BROKEN/);
    });
  }

  it("accepts case-insensitive media types, parameters and cache directives", async () => {
    const result = await runSmoke({
      css: "Text/CSS; charset=utf-8", js: "Text/JavaScript; charset=utf-8",
      spa: "Text/HTML; charset=utf-8", cache: "private, \tNO-STORE\t, max-age=0"
    });
    assert.equal(result.exitCode, 0, result.lines.join("\n"));
  });

  for (const js of [
    "application/ecmascript", "application/javascript", "application/x-ecmascript", "application/x-javascript",
    "text/ecmascript", "text/javascript", "text/javascript1.0", "text/javascript1.1", "text/javascript1.2",
    "text/javascript1.3", "text/javascript1.4", "text/javascript1.5", "text/jscript", "text/livescript",
    "text/x-ecmascript", "text/x-javascript"
  ]) {
    it(`accepts the standard JavaScript MIME essence ${js}`, async () => {
      const result = await runSmoke({ js });
      assert.equal(result.exitCode, 0, result.lines.join("\n"));
    });
  }

  for (const cache of [
    'private="field,other", no-store',
    'extension="escaped\\\",still quoted", no-store',
    'no-store, extension="field,other"',
    "max-age=0, no-store, no-cache"
  ]) {
    it(`accepts a real no-store directive outside quoted values: ${cache}`, async () => {
      const result = await runSmoke({ cache });
      assert.equal(result.exitCode, 0, result.lines.join("\n"));
    });
  }
});
