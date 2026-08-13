// ops/analytics — credential resolution, redaction and human-gate metadata.
//
// Security model: tokens are resolved into an opaque `{ token }` object that
// callers must never print. Every user-visible string that could contain a
// credential goes through `redact()` before reaching the terminal.

import { readFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const OPS_DIR = fileURLToPath(new URL("..", import.meta.url));

export function redact(value, { visible = 4 } = {}) {
  if (value == null || value === "") return value;
  const s = String(value);
  if (s.length <= visible) return "*".repeat(s.length);
  return s.slice(0, visible) + "*".repeat(8);
}

export const ALLOWED_GATES = [
  "CLOUDFLARE_AUTH",
  "CLOUDFLARE_PUBLISH",
  "CLOUDFLARE_PREVIEW_PENDING",
  "CLOUDFLARE_WORKFLOW_UNKNOWN",
  "CLOUDFLARE_ZONE_NOT_FOUND",
  "GA4_READ_FAILURE",
  "GOOGLE_OAUTH",
  "GA4_PROPERTY_AMBIGUITY",
  "GA4_MEASUREMENT_ID_MISMATCH",
  "PRODUCTION_INTERACTION"
];

export const GATE_DEFS = {
  CLOUDFLARE_AUTH: {
    action:
      "Create a scoped Cloudflare API token with Zone > Zaraz : Edit and Zone > Zone : Read for jabiko.app, then export CLOUDFLARE_API_TOKEN.",
    scope:
      "Zone:Zaraz Edit + Zone:Read, scoped to jabiko.app. This is enough for realtime workflow mutation and workflow reads; preview publishing is a separate gate.",
    unlocks: "Reading the workflow and published Zaraz config, and applying Zaraz configuration changes."
  },
  CLOUDFLARE_PUBLISH: {
    action:
      "Publish the pending Zaraz preview in the Cloudflare Zaraz History UI, or rerun apply with a token that has Zone > Zaraz : Admin.",
    scope:
      "Zaraz Admin is required only for the publish API. Do not broaden the normal edit token unless automated publishing is desired.",
    unlocks: "Moving an already-applied preview configuration into the published production state."
  },
  CLOUDFLARE_PREVIEW_PENDING: {
    action:
      "Review the existing unpublished Zaraz preview changes in the Cloudflare Zaraz History UI — publish or discard them — before re-running apply.",
    scope:
      "Zaraz History read. The operator decides whether the pending preview is intended; the script will not overwrite or publish over it.",
    unlocks: "A clean preview state so apply can safely write and publish only its own change without clobbering someone else's unpublished work."
  },
  CLOUDFLARE_WORKFLOW_UNKNOWN: {
    action:
      "Confirm the Zaraz workflow setting in the Cloudflare Zaraz dashboard — it must be Real-time or Preview & Publish.",
    scope: "Zaraz Settings read. The workflow API returned a value other than realtime/preview.",
    unlocks: "A production-readiness conclusion that never assumes an unknown workflow is safe."
  },
  CLOUDFLARE_ZONE_NOT_FOUND: {
    action:
      "Use a Cloudflare credential that can see the jabiko.app zone (correct account + Zone:Read), or confirm the zone exists.",
    scope: "Zone:Read on an account that owns jabiko.app.",
    unlocks: "Reading the jabiko.app Zaraz workflow and published config so plan/apply/smoke can reason about production state."
  },
  GA4_READ_FAILURE: {
    action:
      "Make the Google Analytics Admin/Data API reachable and readable (network, quota, or service availability), then re-run plan.",
    scope: "GA4 Admin + Data read on the Jabiko property.",
    unlocks: "GA4 property/stream discovery, the Measurement ID, and the custom-dimension diff that plan needs for a readiness conclusion."
  },
  GOOGLE_OAUTH: {
    action:
      "Provide GA4 access: (a) a service-account JSON added to the GA4 property, or (b) gcloud application-default login, or (c) export GA4_ACCESS_TOKEN.",
    scope: "Google Analytics Admin + Data API, read (and edit for apply) on the Jabiko property.",
    unlocks: "Discovering the GA4 property/stream, reading Measurement ID and custom dimensions, and running the bounded Realtime event-name check."
  },
  GA4_PROPERTY_AMBIGUITY: {
    action: "Pick which GA4 property is the intended Jabiko production property.",
    scope: "Read access to the candidate properties is already available.",
    unlocks: "A single Measurement ID to configure in Zaraz and against which smoke verifies."
  },
  GA4_MEASUREMENT_ID_MISMATCH: {
    action:
      "Pass the correct --measurement-id — the Measurement ID of the unique jabiko.app production web stream — or drop the flag to use discovery.",
    scope: "The supplied --measurement-id must equal the jabiko.app production stream's Measurement ID.",
    unlocks: "A plan/apply/smoke run that never mixes Zaraz target A with GA4 property B."
  },
  PRODUCTION_INTERACTION: {
    action:
      "Run smoke with --placement-action-verified, enable Cloudflare Zaraz Debug Mode in a fresh jabiko.app tab, then perform the printed Stay.D interaction while the smoke watch is running and manually verify the seven promo_click placement/action payloads and GA4 action firings.",
    scope:
      "One normal production browser interaction during the smoke watch plus Cloudflare's documented Zaraz debugger; no production credential is stored by the script.",
    unlocks:
      "The placement/action evidence that GA4 Realtime cannot expose through its supported schema."
  }
};

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
  return {
    token: oauthToken,
    accountId: String(accountId),
    scopes: Array.isArray(scopes) ? scopes : []
  };
}

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

const SECRETS_DIR = join(OPS_DIR, ".secrets");

function readJsonOrNull(file) {
  if (!file || !existsSync(file)) return null;
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

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
  const adcPath = adcCandidates.find((p) => existsSync(p));
  const adc = readJsonOrNull(adcPath);
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
