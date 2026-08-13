// ops/analytics — Google Analytics 4 Admin + Data API client.
//
// Uses the official APIs only, against the CURRENT contract (v1beta):
//   Admin:  analyticsadmin.googleapis.com/v1beta
//     - accounts:            GET /v1beta/accounts
//     - properties:          GET /v1beta/properties?filter=parent:accounts/{id}
//     - data streams:        GET /v1beta/properties/{property}/dataStreams
//     - custom dimensions:   GET/POST /v1beta/properties/{property}/customDimensions
//     - web Measurement ID:  dataStream.webStreamData.measurementId
//   Data:   analyticsdata.googleapis.com/v1beta (runRealtimeReport)
//
// Realtime is intentionally narrow here. The production smoke needs
// eventName + minutesAgo + eventCount to prove that event TYPES reach GA4 and
// to bound the delta to events that arrived after the baseline (so rolling-
// window expiry of pre-baseline events cannot subtract from the guided
// interaction). It does not try to query sessionId, pagePath, or event-scoped
// customEvent:* dimensions, because those are not part of the GA4 Realtime
// schema. Standard-property requests are capped at 30 minutes.

import crypto from "node:crypto";
import { resolveGoogleCredential } from "./creds.mjs";

const ADMIN_BASE = "https://analyticsadmin.googleapis.com/v1beta";
const DATA_BASE = "https://analyticsdata.googleapis.com/v1beta";
const TOKEN_URL = "https://oauth2.googleapis.com/token";

const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/analytics.readonly",
  "https://www.googleapis.com/auth/analytics.edit"
];

export const REALTIME_SMOKE_DIMENSIONS = Object.freeze(["eventName", "minutesAgo"]);
const REALTIME_SMOKE_DIMENSION_SET = new Set(REALTIME_SMOKE_DIMENSIONS);
export const STANDARD_REALTIME_MAX_MINUTES = 30;

export const gaAdminUrl = (path) => {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${ADMIN_BASE}${path}`;
};
export const gaDataUrl = (propertyId, endpoint) =>
  `${DATA_BASE}/properties/${propertyId}:${endpoint}`;

function stripResourcePrefix(name, kind) {
  return String(name).replace(new RegExp(`^${kind}/`), "");
}

function toResourceName(name, kind) {
  const s = String(name);
  return s.startsWith(`${kind}/`) ? s : `${kind}/${s}`;
}

export const propertiesListUrl = (parent) =>
  `${ADMIN_BASE}/properties?filter=${encodeURIComponent(`parent:${toResourceName(parent, "accounts")}`)}`;
export const dataStreamsUrl = (property) =>
  `${ADMIN_BASE}/properties/${stripResourcePrefix(property, "properties")}/dataStreams`;
export const customDimensionsUrl = (property) =>
  `${ADMIN_BASE}/properties/${stripResourcePrefix(property, "properties")}/customDimensions`;

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

export async function getGoogleAccessToken({ credential }) {
  if (!credential) return null;
  if (credential.type === "access-token") return credential.token;
  if (credential.type === "service-account") return exchangeServiceAccount(credential);
  if (credential.type === "user-oauth") return refreshUserOAuth(credential);
  return null;
}

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
  const data = await adminRequest({ token, path: propertiesListUrl(account) });
  return data.properties ?? [];
}

export async function listDataStreams({ token, property }) {
  const data = await adminRequest({ token, path: dataStreamsUrl(property) });
  return data.dataStreams ?? [];
}

export async function listCustomDimensions({ token, property }) {
  const base = `/properties/${stripResourcePrefix(property, "properties")}/customDimensions`;
  const all = [];
  let pageToken = null;
  do {
    const path = pageToken ? `${base}?pageToken=${encodeURIComponent(pageToken)}` : base;
    const data = await adminRequest({ token, path });
    all.push(...(data.customDimensions ?? []));
    pageToken = data.nextPageToken ?? null;
  } while (pageToken);
  return all;
}

export async function createCustomDimension({ token, property, dimension }) {
  return adminRequest({
    token,
    path: `/properties/${stripResourcePrefix(property, "properties")}/customDimensions`,
    method: "POST",
    body: createCustomDimensionBody(dimension)
  });
}

export function createCustomDimensionBody(dimension) {
  return {
    parameterName: dimension.parameterName,
    displayName: dimension.displayName,
    scope: dimension.scope
  };
}

/**
 * Build the only Realtime request shape that the production smoke is allowed
 * to use. This is deliberately stricter than GA4's full Realtime schema so a
 * future refactor cannot accidentally reintroduce unsupported session/path or
 * event-scoped custom dimensions.
 */
export function realtimeReportBody({ dimensions = REALTIME_SMOKE_DIMENSIONS, minutes = STANDARD_REALTIME_MAX_MINUTES } = {}) {
  if (!Number.isInteger(minutes) || minutes < 1 || minutes > STANDARD_REALTIME_MAX_MINUTES) {
    throw new RangeError(
      `GA4 standard Realtime window must be an integer from 1 to ${STANDARD_REALTIME_MAX_MINUTES} minutes; got ${minutes}`
    );
  }
  const unsupported = dimensions.filter((name) => !REALTIME_SMOKE_DIMENSION_SET.has(name));
  if (unsupported.length) {
    throw new Error(`Unsupported dimension(s) for Jabiko GA4 Realtime smoke: ${unsupported.join(", ")}`);
  }
  return {
    dimensions: dimensions.map((name) => ({ name })),
    metrics: [{ name: "eventCount" }],
    minuteRanges: [
      { startMinutesAgo: minutes - 1, endMinutesAgo: 0 }
    ]
  };
}

export async function runRealtimeReport({ token, propertyId, dimensions = REALTIME_SMOKE_DIMENSIONS, minutes = STANDARD_REALTIME_MAX_MINUTES }) {
  const body = realtimeReportBody({ dimensions, minutes });
  const res = await fetch(gaDataUrl(propertyId, "runRealtimeReport"), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
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

export async function googleTokenFromEnv(env = process.env) {
  const credential = resolveGoogleCredential({ env });
  if (!credential) return null;
  return getGoogleAccessToken({ credential });
}
