// ops/analytics — Google Analytics 4 Admin + Data API client.
//
// Uses the official APIs only:
//   Admin:  analyticsadmin.googleapis.com  (accounts/properties/webDataStreams/customDimensions)
//   Data:   analyticsdata.googleapis.com    (runRealtimeReport)
// No `gcloud analytics` workflow is invented.

import crypto from "node:crypto";
import { resolveGoogleCredential } from "./creds.mjs";

const ADMIN_BASE = "https://analyticsadmin.googleapis.com/v1";
const DATA_BASE = "https://analyticsdata.googleapis.com/v1beta";
const TOKEN_URL = "https://oauth2.googleapis.com/token";

const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/analytics.readonly",
  "https://www.googleapis.com/auth/analytics.edit"
];

// ---------------------------------------------------------------------------
// URL helpers (pure, unit-tested)
// ---------------------------------------------------------------------------

export const gaAdminUrl = (path) => `${ADMIN_BASE}${path}`;
export const gaDataUrl = (propertyId, endpoint) =>
  `${DATA_BASE}/properties/${propertyId}:${endpoint}`;

/**
 * GA4 Admin API resource names arrive already prefixed (accounts/123,
 * properties/456). Strip the prefix so callers can never build
 * accounts/accounts/… or properties/properties/… paths; bare ids work too.
 */
function stripResourcePrefix(name, kind) {
  return String(name).replace(new RegExp(`^${kind}/`), "");
}

export const propertiesUrl = (parent) =>
  `${ADMIN_BASE}/accounts/${stripResourcePrefix(parent, "accounts")}/properties`;
export const webStreamsUrl = (property) =>
  `${ADMIN_BASE}/properties/${stripResourcePrefix(property, "properties")}/webDataStreams`;
export const customDimensionsUrl = (property) =>
  `${ADMIN_BASE}/properties/${stripResourcePrefix(property, "properties")}/customDimensions`;

// ---------------------------------------------------------------------------
// Auth primitives (pure, unit-tested)
// ---------------------------------------------------------------------------

export function buildSignedJwt(sa, { now = Math.floor(Date.now() / 1000) } = {}) {
  const header = { alg: "RS256", typ: "JWT" };
  const claim = {
    iss: sa.client_email,
    scope: GOOGLE_SCOPES.join(" "),
    aud: sa.token_uri || TOKEN_URL,
    iat: now,
    exp: now + 3600
  };
  const enc = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const signingInput = `${enc(header)}.${enc(claim)}`;
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(signingInput);
  const signature = signer.sign(sa.private_key, "base64url");
  return `${signingInput}.${signature}`;
}

export function decodeJwtPayload(jwt) {
  const [header, claim] = jwt.split(".");
  const dec = (seg) => JSON.parse(Buffer.from(seg, "base64url").toString("utf8"));
  return [dec(header), dec(claim)];
}

export function refreshTokenBody(clientId, clientSecret, refreshToken) {
  const body = new URLSearchParams();
  body.set("grant_type", "refresh_token");
  body.set("client_id", clientId);
  body.set("client_secret", clientSecret);
  body.set("refresh_token", refreshToken);
  return body;
}

export function extractGoogleError(body) {
  if (body?.error?.message) {
    return `${body.error.message} (code ${body.error.code ?? "?"})`;
  }
  return `Google API error: ${JSON.stringify(body)}`;
}

// ---------------------------------------------------------------------------
// Access-token resolution
// ---------------------------------------------------------------------------

async function exchangeServiceAccount(credential) {
  const jwt = buildSignedJwt({
    client_email: credential.clientEmail,
    private_key: credential.privateKey,
    token_uri: credential.tokenUri
  });
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt
    })
  });
  const data = await res.json();
  if (!data.access_token) {
    throw new Error(`Google service-account exchange failed: ${JSON.stringify(data)}`);
  }
  return data.access_token;
}

async function refreshUserOAuth(credential) {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: refreshTokenBody(
      credential.clientId,
      credential.clientSecret,
      credential.refreshToken
    )
  });
  const data = await res.json();
  if (!data.access_token) {
    throw new Error(`Google refresh-token exchange failed: ${JSON.stringify(data)}`);
  }
  return data.access_token;
}

/** Turn a resolved credential (see creds.mjs) into a usable access token. */
export async function getGoogleAccessToken({ credential }) {
  if (!credential) return null;
  if (credential.type === "access-token") return credential.token;
  if (credential.type === "service-account") return exchangeServiceAccount(credential);
  if (credential.type === "user-oauth") return refreshUserOAuth(credential);
  return null;
}

// ---------------------------------------------------------------------------
// Admin + Data request helpers
// ---------------------------------------------------------------------------

async function adminRequest({ token, path, method = "GET", body = undefined }) {
  const res = await fetch(gaAdminUrl(path), {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(extractGoogleError(data));
  return data;
}

export async function listAccounts({ token }) {
  const data = await adminRequest({ token, path: "/accounts" });
  return data.accounts ?? [];
}

export async function listProperties({ token, account }) {
  const data = await adminRequest({
    token,
    path: `/accounts/${stripResourcePrefix(account, "accounts")}/properties`
  });
  return data.properties ?? [];
}

export async function listWebStreams({ token, property }) {
  const data = await adminRequest({
    token,
    path: `/properties/${stripResourcePrefix(property, "properties")}/webDataStreams`
  });
  return data.webDataStreams ?? [];
}

export async function listCustomDimensions({ token, property }) {
  const data = await adminRequest({
    token,
    path: `/properties/${stripResourcePrefix(property, "properties")}/customDimensions`
  });
  return data.customDimensions ?? [];
}

export async function createCustomDimension({ token, property, dimension }) {
  const data = await adminRequest({
    token,
    path: `/properties/${stripResourcePrefix(property, "properties")}/customDimensions`,
    method: "POST",
    body: createCustomDimensionBody(dimension)
  });
  return data;
}

export function createCustomDimensionBody(dimension) {
  return {
    parameterName: dimension.parameterName,
    displayName: dimension.displayName,
    scope: dimension.scope
  };
}

export function realtimeReportBody({ dimensions = [], minutes = 30 } = {}) {
  return {
    dimensions: dimensions.map((name) => ({ name })),
    metrics: [{ name: "eventCount" }],
    minuteRanges: [
      { startMinutesAgo: Math.max(0, minutes - 1), endMinutesAgo: 0 }
    ]
  };
}

/** Run a GA4 Realtime report and return rows. */
export async function runRealtimeReport({ token, propertyId, dimensions, minutes }) {
  const res = await fetch(gaDataUrl(propertyId, "runRealtimeReport"), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(realtimeReportBody({ dimensions, minutes }))
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(extractGoogleError(data));
  const header = data.dimensionHeaders ?? [];
  return (data.rows ?? []).map((row) => {
    const out = {};
    row.dimensionValues.forEach((v, i) => {
      out[header[i]?.name ?? `dim${i}`] = v.value;
    });
    out.eventCount = Number(row.metricValues?.[0]?.value ?? 0);
    return out;
  });
}

/** Highest-level convenience: resolve a Google credential + token from env. */
export async function googleTokenFromEnv(env = process.env) {
  const credential = resolveGoogleCredential({ env });
  if (!credential) return null;
  return getGoogleAccessToken({ credential });
}
