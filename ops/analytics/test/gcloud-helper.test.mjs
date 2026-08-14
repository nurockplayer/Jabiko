// ops/analytics gcloud-in-Docker helper contract tests.
//
// Guards the host-gcloud-free ADC bootstrap surface (image, scopes, mount) and
// the operator guidance printed by google-auth against drift. Mechanical only:
// no live Google credentials, no network access, no YAML parser dependency.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const OPS_DIR = fileURLToPath(new URL("..", import.meta.url));

// Scopes required by the Jabiko operator contract (analytics.edit is needed
// when apply creates GA4 custom dimensions; analytics.readonly covers plan and
// smoke reads). Must stay aligned with docker-compose.yml.
const REQUIRED_SCOPES = [
  "https://www.googleapis.com/auth/cloud-platform",
  "https://www.googleapis.com/auth/analytics.readonly",
  "https://www.googleapis.com/auth/analytics.edit"
];

test("compose gcloud service uses the current official stable Google Cloud CLI image", () => {
  const compose = readFileSync(join(OPS_DIR, "docker-compose.yml"), "utf8");
  assert.match(
    compose,
    /image:\s*gcr\.io\/google\.com\/cloudsdktool\/google-cloud-cli:stable/
  );
  assert.doesNotMatch(compose, /google\/cloud-sdk/, "legacy cloud-sdk image must not remain");
});

test("compose ADC login explicitly requests the GA4 production scopes", () => {
  const compose = readFileSync(join(OPS_DIR, "docker-compose.yml"), "utf8");
  assert.match(compose, /--no-launch-browser/);
  const scopesMatch = compose.match(/--scopes=(\S+)/);
  assert.ok(scopesMatch, "compose command must pass --scopes=...");
  for (const scope of REQUIRED_SCOPES) {
    assert.ok(
      scopesMatch[1].includes(scope),
      `--scopes must include ${scope}`
    );
  }
});

test("compose persists ADC only under the gitignored state/gcloud mount", () => {
  const compose = readFileSync(join(OPS_DIR, "docker-compose.yml"), "utf8");
  assert.match(compose, /\.\/state\/gcloud:\/root\/\.config\/gcloud/);
  const gitignore = readFileSync(join(OPS_DIR, ".gitignore"), "utf8");
  assert.match(gitignore, /^state\//m, "state/ must stay gitignored");
});

test("compose mount and credential resolution agree on the state/gcloud ADC path", () => {
  const compose = readFileSync(join(OPS_DIR, "docker-compose.yml"), "utf8");
  const creds = readFileSync(join(OPS_DIR, "src/creds.mjs"), "utf8");
  assert.match(compose, /state\/gcloud/);
  // creds.mjs builds the ADC path via join(OPS_DIR, "state", "gcloud", ...).
  assert.match(creds, /"state",\s*"gcloud"/);
  assert.match(creds, /"application_default_credentials\.json"/);
});

test("google-auth guidance keeps docker compose run --rm gcloud canonical and scope-safe", () => {
  const auth = readFileSync(join(OPS_DIR, "src/cli/google-auth.mjs"), "utf8");
  // The canonical bootstrap command must not append a raw `gcloud ...` after
  // `run --rm gcloud`, which would override the Compose command and silently
  // drop the GA4 scopes.
  assert.match(auth, /docker compose -f .*run --rm gcloud/);
  assert.doesNotMatch(auth, /run --rm gcloud\s+gcloud\b/, "google-auth must not print a scope-less override of the Compose command");
  // The printed scope note must mirror the Compose scope set.
  for (const short of ["cloud-platform", "analytics.readonly", "analytics.edit"]) {
    assert.match(auth, new RegExp(short.replace(".", "\\.")));
  }
});
