// ops/analytics gcloud-in-Docker helper contract tests.
//
// Guards the host-gcloud-free ADC bootstrap surface (image, scopes, mount) and
// the operator guidance printed by google-auth against drift. Mechanical only:
// no live Google credentials, no network access, no YAML parser dependency.
import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const OPS_DIR = fileURLToPath(new URL("..", import.meta.url));
const REPO_ROOT = join(OPS_DIR, "..", "..");

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

// #767: gcloud's default OAuth client is blocked by Google for the GA4 scopes,
// so the operator contract now requires a Jabiko-owned Desktop OAuth client
// JSON mounted read-only and passed via --client-id-file.

test("compose mounts the Desktop OAuth client JSON read-only and keeps it gitignored", () => {
  const compose = readFileSync(join(OPS_DIR, "docker-compose.yml"), "utf8");
  const gitignore = readFileSync(join(OPS_DIR, ".gitignore"), "utf8");
  // The operator-provided Desktop OAuth client lives under .secrets/, so it is
  // never committed.
  assert.match(gitignore, /^\.secrets\//m, ".secrets/ must stay gitignored");
  // Compose bind-mounts exactly that file, read-only, at the container path
  // that --client-id-file points at.
  assert.match(
    compose,
    /\.\/\.secrets\/google-oauth-client\.json:.*google-oauth-client\.json:ro/,
    "client JSON must be mounted read-only from .secrets/"
  );
  // Git itself must classify the path as ignored even before the file exists.
  const ignored = spawnSync(
    "git",
    ["check-ignore", "ops/analytics/.secrets/google-oauth-client.json"],
    { cwd: REPO_ROOT }
  );
  assert.equal(ignored.status, 0, "git check-ignore must report the client JSON as ignored");
});

test("compose ADC login passes --client-id-file pointing at the mounted path", () => {
  const compose = readFileSync(join(OPS_DIR, "docker-compose.yml"), "utf8");
  assert.match(
    compose,
    /--client-id-file=\/root\/google-oauth-client\.json/,
    "login must use --client-id-file with the mounted path"
  );
  assert.match(
    compose,
    /\/root\/google-oauth-client\.json:ro/,
    "the mounted path must be read-only"
  );
});

test("compose ADC login fails fast with a clear message when the client JSON is absent", () => {
  const compose = readFileSync(join(OPS_DIR, "docker-compose.yml"), "utf8");
  assert.match(
    compose,
    /\[ ! -f \/root\/google-oauth-client\.json \]/,
    "guard must check for the mounted client JSON before invoking gcloud"
  );
  assert.match(compose, /exit 1/, "guard must exit non-zero when the client JSON is absent");
  assert.match(
    compose,
    /\.secrets\/google-oauth-client\.json/,
    "the error must name the operator-side file path"
  );
});

test("compose ADC login has exactly one gcloud invocation and no default-client fallback", () => {
  const compose = readFileSync(join(OPS_DIR, "docker-compose.yml"), "utf8");
  const logins = compose.match(/gcloud\s+auth\s+application-default\s+login/g) ?? [];
  assert.ok(logins.length >= 1, "compose must invoke gcloud application-default login");
  assert.equal(
    logins.length,
    1,
    "there must be exactly one login invocation, and it must carry --client-id-file (no scope-less default-client fallback)"
  );
  assert.match(compose, /--client-id-file=/);
});

test("google-auth guidance directs operators to a Desktop OAuth client JSON and --client-id-file", () => {
  const auth = readFileSync(join(OPS_DIR, "src/cli/google-auth.mjs"), "utf8");
  assert.match(auth, /google-oauth-client\.json/, "guidance must name the Desktop client JSON path");
  assert.match(auth, /--client-id-file/, "guidance must explain --client-id-file");
  assert.match(auth, /Desktop app|Desktop OAuth client/i, "guidance must say to create a Desktop app OAuth client");
});

test("README documents the Desktop OAuth client bootstrap and the canonical command", () => {
  const readme = readFileSync(join(OPS_DIR, "README.md"), "utf8");
  assert.match(readme, /docker compose run --rm gcloud/, "README must keep the canonical command");
  assert.match(readme, /google-oauth-client\.json/, "README must name the client JSON path");
  assert.match(readme, /\.secrets\//, "README must say the JSON lives under gitignored .secrets/");
  assert.match(readme, /Desktop app|Desktop OAuth client/i, "README must say to create a Desktop app OAuth client");
  assert.match(readme, /--client-id-file/, "README must explain the --client-id-file flag");
  assert.doesNotMatch(readme, /run --rm gcloud\s+gcloud auth/, "README must not append a raw scope-less gcloud command");
});
