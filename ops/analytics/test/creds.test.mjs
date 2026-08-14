// ops/analytics credential resolution + redaction + gate + .env contract tests.
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  redact,
  resolveCloudflareAuth,
  readWranglerOAuth,
  resolveGoogleCredential,
  GATE_DEFS,
  ALLOWED_GATES
} from "../src/creds.mjs";

const OPS_DIR = fileURLToPath(new URL("..", import.meta.url));

function wranglerToml(extra = "") {
  const dir = mkdtempSync(join(tmpdir(), "ops-an-"));
  mkdirSync(join(dir, "config"), { recursive: true });
  const path = join(dir, "config", "default.toml");
  writeFileSync(
    path,
    `oauth_token = "abcdefgh-token"\nexpiration_time = "2026-08-13T00:00:00.000Z"\nrefresh_token = "refresh-secret"\nscopes = ["account:read", "zone:read"]\n${extra}\n`
  );
  return { dir, path };
}

test("redact never exposes a full token", () => {
  const token = "G-ABCDEF123456";
  const out = redact(token);
  assert.ok(out.length < token.length);
  assert.ok(out.startsWith("G-"));
  assert.ok(!out.includes("123456"));
});

test("redact handles short strings and empty input", () => {
  assert.equal(redact("ab"), "**");
  assert.equal(redact(""), "");
  assert.equal(redact(undefined), undefined);
});

test("redact hides the middle of a long api token", () => {
  assert.ok(!redact("super-secret-api-token").includes("secret-api"));
});

test("CLOUDFLARE_API_TOKEN env yields edit/read capability", () => {
  const auth = resolveCloudflareAuth({ env: { CLOUDFLARE_API_TOKEN: "tok" } });
  assert.equal(auth.source, "CLOUDFLARE_API_TOKEN");
  assert.equal(auth.token, "tok");
  assert.ok(auth.capabilities.includes("zarazEdit"));
  assert.ok(auth.capabilities.includes("zarazRead"));
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
  assert.equal(
    resolveCloudflareAuth({ env: {}, wranglerConfigPath: "/nonexistent/none.toml" }),
    null
  );
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

test("GA4_ACCESS_TOKEN env is the simplest google credential", () => {
  const credential = resolveGoogleCredential({ env: { GA4_ACCESS_TOKEN: "ya29.abc" } });
  assert.equal(credential.type, "access-token");
  assert.equal(credential.token, "ya29.abc");
});

test("service account JSON path is detected", () => {
  const dir = mkdtempSync(join(tmpdir(), "ops-an-"));
  const path = join(dir, "sa.json");
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
    const credential = resolveGoogleCredential({
      env: { GOOGLE_APPLICATION_CREDENTIALS: path }
    });
    assert.equal(credential.type, "service-account");
    assert.equal(credential.clientEmail, "sa@proj.iam.gserviceaccount.com");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("no google credential yields null", () => {
  assert.equal(resolveGoogleCredential({ env: {} }), null);
});

test("only documented human gates exist, including preview publication", () => {
  assert.deepEqual(
    ALLOWED_GATES.toSorted(),
    [
      "CLOUDFLARE_AUTH",
      "CLOUDFLARE_PREVIEW_CHANGED",
      "CLOUDFLARE_PREVIEW_PENDING",
      "CLOUDFLARE_PUBLISH",
      "CLOUDFLARE_WORKFLOW_UNKNOWN",
      "CLOUDFLARE_ZONE_AMBIGUITY",
      "CLOUDFLARE_ZONE_NOT_FOUND",
      "GA4_DIMENSION_SCOPE_CONFLICT",
      "GA4_MEASUREMENT_ID_MISMATCH",
      "GA4_PROPERTY_AMBIGUITY",
      "GA4_READ_FAILURE",
      "GOOGLE_OAUTH",
      "PRODUCTION_INTERACTION"
    ].toSorted()
  );
});

test("each gate carries an action, scope and unlock description", () => {
  for (const code of ALLOWED_GATES) {
    const gate = GATE_DEFS[code];
    assert.ok(gate, `gate ${code} defined`);
    assert.ok(typeof gate.action === "string" && gate.action.length > 0);
    assert.ok(typeof gate.scope === "string" && gate.scope.length > 0);
    assert.ok(typeof gate.unlocks === "string" && gate.unlocks.length > 0);
  }
});

test("credential documentation matches runtime: no undocumented ops/analytics/.env auto-load", () => {
  const envExample = readFileSync(join(OPS_DIR, ".env.example"), "utf8");
  const readme = readFileSync(join(OPS_DIR, "README.md"), "utf8");
  assert.doesNotMatch(envExample, /Copy to ops\/analytics\/\.env/);
  assert.match(envExample, /do NOT auto-load ops\/analytics\/\.env/);
  assert.match(envExample, /export CLOUDFLARE_API_TOKEN/);
  assert.match(readme, /variable-name reference only/);

  for (const command of ["plan", "apply", "smoke", "google-auth"]) {
    const wrapper = readFileSync(join(OPS_DIR, "bin", command), "utf8");
    assert.doesNotMatch(wrapper, /--env-file|\.env/, `${command} does not claim to load an .env file`);
  }
});
