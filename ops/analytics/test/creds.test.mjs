// ops/analytics credential resolution + redaction + gate tests.
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  redact,
  resolveCloudflareAuth,
  readWranglerOAuth,
  resolveGoogleCredential,
  GATE_DEFS,
  ALLOWED_GATES
} from "../src/creds.mjs";

function wranglerToml(extra = "") {
  const dir = mkdtempSync(join(tmpdir(), "ops-an-"));
  mkdirSync(join(dir, "config"), { recursive: true });
  const path = join(dir, "config", "default.toml");
  writeFileSync(
    path,
    `oauth_token = "abcdefgh-token"
expiration_time = "2026-08-13T00:00:00.000Z"
refresh_token = "refresh-secret"
scopes = ["account:read", "zone:read"]
${extra}
`
  );
  return { dir, path };
}

// --- redaction ---
test("redact never exposes a full token", () => {
  const token = "G-ABCDEF123456";
  const out = redact(token);
  assert.ok(out.length < token.length, "redacted output is shorter");
  assert.ok(out.startsWith("G-"), "keeps a tiny readable prefix");
  assert.ok(!out.includes("123456"), "sensitive tail is gone");
});

test("redact handles short strings and empty input", () => {
  assert.equal(redact("ab"), "**");
  assert.equal(redact(""), "");
  assert.equal(redact(undefined), undefined);
});

test("redact hides the middle of a long api token", () => {
  const value = "super-secret-api-token";
  assert.ok(!redact(value).includes("secret-api"));
});

// --- cloudflare resolution ---
test("CLOUDFLARE_API_TOKEN env yields full capability", () => {
  const auth = resolveCloudflareAuth({ env: { CLOUDFLARE_API_TOKEN: "tok" } });
  assert.equal(auth.source, "CLOUDFLARE_API_TOKEN");
  assert.equal(auth.token, "tok");
  assert.ok(auth.capabilities.includes("zarazEdit"));
  assert.ok(auth.capabilities.includes("zoneRead"));
});

test("wrangler OAuth is detected but lacks Zaraz capability", () => {
  const { dir, path } = wranglerToml();
  try {
    const auth = resolveCloudflareAuth({ env: {}, wranglerConfigPath: path });
    assert.equal(auth.source, "wrangler-oauth");
    assert.ok(auth.capabilities.includes("zoneRead"));
    assert.ok(!auth.capabilities.includes("zarazEdit"));
    assert.ok(!auth.capabilities.includes("zarazRead"));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("no cloudflare auth yields null", () => {
  const auth = resolveCloudflareAuth({
    env: {},
    wranglerConfigPath: "/nonexistent/none.toml"
  });
  assert.equal(auth, null);
});

test("readWranglerOAuth extracts only the oauth token", () => {
  const { dir, path } = wranglerToml();
  try {
    const oauth = readWranglerOAuth(path);
    assert.equal(oauth.token, "abcdefgh-token");
    assert.equal(typeof oauth.accountId, "string");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("readWranglerOAuth returns null when the file is missing", () => {
  assert.equal(readWranglerOAuth("/nonexistent/nope.toml"), null);
});

// --- google resolution ---
test("GA4_ACCESS_TOKEN env is the simplest google credential", () => {
  const g = resolveGoogleCredential({ env: { GA4_ACCESS_TOKEN: "ya29.abc" } });
  assert.equal(g.type, "access-token");
  assert.equal(g.token, "ya29.abc");
});

test("service account JSON path is detected", () => {
  const dir = mkdtempSync(join(tmpdir(), "ops-an-"));
  const path = join(dir, "sa.json");
  // The private_key here is a placeholder — credential resolution only reads
  // the metadata fields; the real key never leaves the resolved file.
  writeFileSync(
    path,
    JSON.stringify({
      type: "service_account",
      client_email: "sa@proj.iam.gserviceaccount.com",
      private_key: "PLACEHOLDER-NOT-A-REAL-KEY",
      project_id: "proj"
    })
  );
  try {
    const g = resolveGoogleCredential({
      env: { GOOGLE_APPLICATION_CREDENTIALS: path }
    });
    assert.equal(g.type, "service-account");
    assert.equal(g.clientEmail, "sa@proj.iam.gserviceaccount.com");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("no google credential yields null", () => {
  assert.equal(resolveGoogleCredential({ env: {} }), null);
});

// --- gates ---
test("only the four allowed human gates exist", () => {
  assert.deepEqual(
    ALLOWED_GATES.sort(),
    [
      "CLOUDFLARE_AUTH",
      "GA4_PROPERTY_AMBIGUITY",
      "GOOGLE_OAUTH",
      "PRODUCTION_INTERACTION"
    ].sort()
  );
});

test("each gate carries an action, scope and unlock description", () => {
  for (const code of ALLOWED_GATES) {
    const g = GATE_DEFS[code];
    assert.ok(g, `gate ${code} defined`);
    assert.ok(typeof g.action === "string" && g.action.length > 0);
    assert.ok(typeof g.scope === "string" && g.scope.length > 0);
    assert.ok(typeof g.unlocks === "string" && g.unlocks.length > 0);
  }
});
