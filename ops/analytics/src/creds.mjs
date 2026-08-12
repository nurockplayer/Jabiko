// ops/analytics — credential resolution, redaction and human-gate metadata.
//
// Security model: tokens are resolved into an opaque `{ token }` object that
// callers must never print. Every user-visible string that could contain a
// credential goes through `redact()` before reaching the terminal.

import { readFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

// Directory of ops/analytics/ (src/.. from this module), so .secrets and
// state/ resolve regardless of the operator's current working directory.
const OPS_DIR = fileURLToPath(new URL("..", import.meta.url));

// ---------------------------------------------------------------------------
// Redaction
// ---------------------------------------------------------------------------

/** Mask a sensitive value, keeping only a short readable prefix. */
export function redact(value, { visible = 4 } = {}) {
  if (value == null || value === "") return value;
  const s = String(value);
  if (s.length <= visible) return "*".repeat(s.length);
  return s.slice(0, visible) + "*".repeat(8);
}

// ---------------------------------------------------------------------------
// Human gates (#745 automation contract)
// ---------------------------------------------------------------------------

export const ALLOWED_GATES = [
  "CLOUDFLARE_AUTH",
  "GOOGLE_OAUTH",
  "GA4_PROPERTY_AMBIGUITY",
  "PRODUCTION_INTERACTION"
];

export const GATE_DEFS = {
  CLOUDFLARE_AUTH: {
    action:
      "Create a scoped Cloudflare API token (Zone > Zaraz : Edit, Zone > Zone : Read) and export CLOUDFLARE_API_TOKEN.",
    scope: "Zone:Zaraz Edit + Zone:Read, scoped to the jabiko.app zone only.",
    unlocks: "Reading and mutating the jabiko.app Zaraz configuration."
  },
  GOOGLE_OAUTH: {
    action:
      "Provide GA4 access: (a) a service-account JSON added to the GA4 property, or (b) gcloud application-default login, or (c) export GA4_ACCESS_TOKEN.",
    scope: "Google Analytics Admin + Data API, read (and edit for apply) on the Jabiko property.",
    unlocks: "Discovering the GA4 property/stream, reading Measurement ID and custom dimensions, running Realtime smoke checks."
  },
  GA4_PROPERTY_AMBIGUITY: {
    action: "Pick which GA4 property is the intended Jabiko production property.",
    scope: "Read access to the candidate properties is already available.",
    unlocks: "A single Measurement ID to configure in Zaraz and against which smoke verifies."
  },
  PRODUCTION_INTERACTION: {
    action:
      "In a fresh production browser tab, perform the exact Stay.D clicks the smoke script prints.",
    scope: "One normal visitor session on jabiko.app — no credentials, no admin actions.",
    unlocks: "Realtime GA4 data proving page_view / promo_click reach GA4 with correct params."
  }
};

// ---------------------------------------------------------------------------
// Cloudflare auth
// ---------------------------------------------------------------------------

const WRANGLER_CONFIG_PATHS = [
  join(homedir(), "Library", "Preferences", ".wrangler", "config", "default.toml"),
  join(homedir(), ".config", ".wrangler", "config", "default.toml")
];

function parseTomlValue(line) {
  const m = line.match(/^\s*([A-Za-z0-9_-]+)\s*=\s*(.*)$/);
  if (!m) return null;
  const value = m[2].trim();
  if (value.startsWith('"')) {
    return value.replace(/^"|"$/g, "").replace(/\\"/g, '"');
  }
  if (value.startsWith("[")) {
    try {
      return JSON.parse(value.replace(/'/g, '"'));
    } catch {
      return value;
    }
  }
  return value;
}

/**
 * Read the wrangler OAuth access token from its on-disk config store.
 * Returns `{ token, accountId, scopes }` or null. Only the OAuth access token
 * is read — other fields (refresh token, secrets) are never returned.
 */
export function readWranglerOAuth(configPath) {
  const path = configPath || WRANGLER_CONFIG_PATHS.find((p) => existsSync(p));
  if (!path) return null;
  let raw;
  try {
    raw = readFileSync(path, "utf8");
  } catch {
    return null;
  }
  const oauthToken = parseTomlValue(raw.match(/^\s*oauth_token\s*=.*$/m)?.[0] ?? "");
  if (!oauthToken) return null;
  const accountId =
    parseTomlValue(raw.match(/^\s*account_id\s*=.*$/m)?.[0] ?? "") || "";
  const scopes = parseTomlValue(raw.match(/^\s*scopes\s*=.*$/m)?.[0] ?? "") || [];
  return { token: oauthToken, accountId: String(accountId), scopes: Array.isArray(scopes) ? scopes : [] };
}

/**
 * Resolve Cloudflare credentials. Returns an auth object or null:
 *   { source, token, capabilities: ["accountRead","zoneRead","zarazRead","zarazEdit"] }
 * The wrangler OAuth token can only read accounts/zones (it lacks Zaraz scope),
 * so Zaraz-capable operations must use CLOUDFLARE_API_TOKEN.
 */
export function resolveCloudflareAuth({ env = process.env, wranglerConfigPath = null } = {}) {
  if (env.CLOUDFLARE_API_TOKEN) {
    return {
      source: "CLOUDFLARE_API_TOKEN",
      token: env.CLOUDFLARE_API_TOKEN,
      capabilities: ["accountRead", "zoneRead", "zarazRead", "zarazEdit"]
    };
  }
  const oauth = readWranglerOAuth(wranglerConfigPath);
  if (oauth) {
    return {
      source: "wrangler-oauth",
      token: oauth.token,
      capabilities: ["accountRead", "zoneRead"]
    };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Google auth
// ---------------------------------------------------------------------------

const SECRETS_DIR = join(OPS_DIR, ".secrets");

function readJsonOrNull(file) {
  if (!file || !existsSync(file)) return null;
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

/**
 * Resolve a Google credential. Order:
 *   1. GA4_ACCESS_TOKEN (explicit, for automation)
 *   2. GOOGLE_APPLICATION_CREDENTIALS (service-account JSON)
 *   3. ops/analytics/.secrets/google-oauth.json (user refresh token)
 *   4. ~/.config/gcloud/application_default_credentials.json (ADC)
 * Returns an opaque credential object or null.
 */
export function resolveGoogleCredential({ env = process.env } = {}) {
  if (env.GA4_ACCESS_TOKEN) {
    return { type: "access-token", token: env.GA4_ACCESS_TOKEN };
  }
  if (env.GOOGLE_APPLICATION_CREDENTIALS) {
    const sa = readJsonOrNull(env.GOOGLE_APPLICATION_CREDENTIALS);
    if (sa?.type === "service_account") {
      return {
        type: "service-account",
        clientEmail: sa.client_email,
        privateKey: sa.private_key,
        tokenUri: sa.token_uri || "https://oauth2.googleapis.com/token",
        projectId: sa.project_id
      };
    }
  }
  const localSecrets = [
    join(SECRETS_DIR, "gcp-service-account.json"),
    join(SECRETS_DIR, "google-oauth.json")
  ];
  for (const file of localSecrets) {
    const cred = readJsonOrNull(file);
    if (!cred) continue;
    if (cred.type === "service_account" || cred.client_email) {
      return {
        type: "service-account",
        clientEmail: cred.client_email,
        privateKey: cred.private_key,
        tokenUri: cred.token_uri || "https://oauth2.googleapis.com/token",
        projectId: cred.project_id
      };
    }
    if (cred.refresh_token && cred.client_id) {
      return {
        type: "user-oauth",
        clientId: cred.client_id,
        clientSecret: cred.client_secret || "",
        refreshToken: cred.refresh_token
      };
    }
  }
  const adcCandidates = [
    env.GOOGLE_APPLICATION_CREDENTIALS,
    join(OPS_DIR, "state", "gcloud", "application_default_credentials.json"),
    join(homedir(), ".config", "gcloud", "application_default_credentials.json")
  ].filter(Boolean);
  const adc = readJsonOrNull(adcCandidates.find((p) => existsSync(p)));
  if (adc) {
    if (adc.type === "service_account" || adc.client_email) {
      return {
        type: "service-account",
        clientEmail: adc.client_email,
        privateKey: adc.private_key,
        tokenUri: adc.token_uri || "https://oauth2.googleapis.com/token",
        projectId: adc.project_id
      };
    }
    if (adc.type === "authorized_user" && adc.refresh_token) {
      return {
        type: "user-oauth",
        clientId: adc.client_id,
        clientSecret: adc.client_secret,
        refreshToken: adc.refresh_token
      };
    }
  }
  return null;
}
