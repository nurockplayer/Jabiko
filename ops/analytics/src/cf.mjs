// ops/analytics — Cloudflare API client.
//
// Uses the documented Zaraz zone-level endpoints:
//   GET/PUT /zones/{zone_id}/settings/zaraz/config
//   GET     /zones/{zone_id}/settings/zaraz/export   (full config incl. secrets)
//   GET     /zones/{zone_id}/settings/zaraz/default  (default config)
//   PUT     /zones/{zone_id}/settings/zaraz/workflow (realtime | preview)
//   POST    /zones/{zone_id}/settings/zaraz/publish  (preview workflow only)

const CF_BASE = "https://api.cloudflare.com/client/v4";

export class CfApiError extends Error {
  constructor(message, { code, errors = [] } = {}) {
    super(message);
    this.name = "CfApiError";
    this.code = code;
    this.errors = errors;
  }
}

export function cfApiUrl(path) {
  // Idempotent: a full URL (e.g. from the zaraz*Url helpers) is used as-is so
  // callers can never double-prefix the base twice.
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${CF_BASE}${path}`;
}

const zarazPath = (zoneId, sub) =>
  `/zones/${zoneId}/settings/zaraz/${sub}`;

export const zarazConfigUrl = (zoneId) => cfApiUrl(zarazPath(zoneId, "config"));
export const zarazExportUrl = (zoneId) => cfApiUrl(zarazPath(zoneId, "export"));
export const zarazDefaultUrl = (zoneId) => cfApiUrl(zarazPath(zoneId, "default"));
export const zarazWorkflowUrl = (zoneId) => cfApiUrl(zarazPath(zoneId, "workflow"));
export const zarazPublishUrl = (zoneId) => cfApiUrl(zarazPath(zoneId, "publish"));

export function cfHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "User-Agent": "jabiko-ops-analytics"
  };
}

/** Return the Cloudflare API `result`, or throw CfApiError on `success: false`. */
export function parseCfResponse(body) {
  if (body?.success === true) return body.result;
  const errors = body?.errors ?? [];
  const message =
    errors.map((e) => e.message).join("; ") ||
    `Cloudflare API error${body?.success === false ? "" : " (non-JSON response)"}`;
  throw new CfApiError(message, { code: errors[0]?.code, errors });
}

/** One Cloudflare API request with JSON body handling. */
export async function cfRequest({ token, path, method = "GET", body = undefined }) {
  const res = await fetch(cfApiUrl(path), {
    method,
    headers: cfHeaders(token),
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  let json;
  try {
    json = await res.json();
  } catch {
    throw new CfApiError(`Cloudflare API returned non-JSON (HTTP ${res.status})`);
  }
  if (!res.ok && json?.success === false) {
    parseCfResponse(json); // throws CfApiError with the API message
  }
  return parseCfResponse(json);
}

/** Resolve the jabiko.app zone; returns { id, name, accountName } or null. */
export async function findZone({ token, name }) {
  const result = await cfRequest({
    token,
    path: `/zones?name=${encodeURIComponent(name)}`
  });
  const zone = Array.isArray(result) ? result[0] : null;
  if (!zone) return null;
  return {
    id: zone.id,
    name: zone.name,
    accountName: zone.account?.name ?? null
  };
}
