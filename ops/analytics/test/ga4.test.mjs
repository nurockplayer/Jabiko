// ops/analytics GA4 Admin + Data API client tests.
import test from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import {
  gaAdminUrl,
  gaDataUrl,
  buildSignedJwt,
  decodeJwtPayload,
  refreshTokenBody,
  createCustomDimensionBody,
  realtimeReportBody,
  extractGoogleError,
  propertiesUrl,
  webStreamsUrl,
  customDimensionsUrl,
  listProperties
} from "../src/ga4.mjs";
import { discoverGa4 } from "../src/cli/cliutil.mjs";

// Runtime-generated key so the JWT is actually signed (no key material in
// source, nothing secret committed).
const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const PRIVATE_KEY_PEM = privateKey.export({ type: "pkcs8", format: "pem" });

test("admin API url helpers", () => {
  assert.equal(gaAdminUrl("/accounts"), "https://analyticsadmin.googleapis.com/v1/accounts");
  assert.equal(gaDataUrl("123", "runRealtimeReport"), "https://analyticsdata.googleapis.com/v1beta/properties/123:runRealtimeReport");
  assert.equal(propertiesUrl("accounts/1"), "https://analyticsadmin.googleapis.com/v1/accounts/1/properties");
  assert.equal(webStreamsUrl("properties/7"), "https://analyticsadmin.googleapis.com/v1/properties/7/webDataStreams");
  assert.equal(customDimensionsUrl("properties/7"), "https://analyticsadmin.googleapis.com/v1/properties/7/customDimensions");
});

test("GA4 resource names accept both prefixed and bare ids (no accounts/accounts or properties/properties)", () => {
  assert.equal(propertiesUrl("123"), "https://analyticsadmin.googleapis.com/v1/accounts/123/properties");
  assert.equal(propertiesUrl("accounts/123"), "https://analyticsadmin.googleapis.com/v1/accounts/123/properties");
  assert.equal(webStreamsUrl("7"), "https://analyticsadmin.googleapis.com/v1/properties/7/webDataStreams");
  assert.equal(webStreamsUrl("properties/7"), "https://analyticsadmin.googleapis.com/v1/properties/7/webDataStreams");
  assert.equal(customDimensionsUrl("properties/7"), "https://analyticsadmin.googleapis.com/v1/properties/7/customDimensions");
});

test("listProperties normalizes an accounts/{id} parent", async () => {
  const seen = [];
  const prev = globalThis.fetch;
  globalThis.fetch = async (url) => {
    seen.push(String(url));
    return { ok: true, status: 200, json: async () => ({ properties: [] }) };
  };
  try {
    await listProperties({ token: "t", account: "accounts/123" });
  } finally {
    globalThis.fetch = prev;
  }
  assert.equal(seen.length, 1);
  assert.equal(
    seen[0],
    "https://analyticsadmin.googleapis.com/v1/accounts/123/properties"
  );
});

test("discoverGa4 never produces accounts/accounts or properties/properties paths", async () => {
  const seen = [];
  const prev = globalThis.fetch;
  globalThis.fetch = async (url) => {
    const u = String(url);
    seen.push(u);
    if (u.endsWith("/v1/accounts")) {
      return { ok: true, status: 200, json: async () => ({ accounts: [{ name: "accounts/1", displayName: "Acct" }] }) };
    }
    if (u.includes("/v1/accounts/1/properties")) {
      return { ok: true, status: 200, json: async () => ({ properties: [{ name: "properties/2", displayName: "Jabiko", url: "https://jabiko.app" }] }) };
    }
    if (u.includes("/v1/properties/2/webDataStreams")) {
      return { ok: true, status: 200, json: async () => ({ webDataStreams: [{ name: "properties/2/webDataStreams/3", type: "WEB_DATA_STREAM", measurementId: "G-X" }] }) };
    }
    return { ok: false, status: 404, json: async () => ({ error: { message: `unexpected ${u}` } }) };
  };
  let d;
  try {
    d = await discoverGa4({ token: "t" });
  } finally {
    globalThis.fetch = prev;
  }
  assert.equal(d.measurementId, "G-X");
  assert.ok(seen.some((u) => u.endsWith("/v1/accounts/1/properties")));
  assert.ok(seen.some((u) => u.endsWith("/v1/properties/2/webDataStreams")));
  assert.ok(
    !seen.some((u) => u.includes("/accounts/accounts/") || u.includes("/properties/properties/")),
    "no duplicated resource-name prefixes"
  );
});

test("buildSignedJwt produces a verifiable JWT header + claim", () => {
  const sa = {
    client_email: "sa@proj.iam.gserviceaccount.com",
    private_key: PRIVATE_KEY_PEM,
    token_uri: "https://oauth2.googleapis.com/token"
  };
  const now = 1_700_000_000;
  const jwt = buildSignedJwt(sa, { now });
  const parts = jwt.split(".");
  assert.equal(parts.length, 3);
  const [header, claim] = decodeJwtPayload(jwt);
  assert.equal(header.alg, "RS256");
  assert.equal(header.typ, "JWT");
  assert.equal(claim.iss, "sa@proj.iam.gserviceaccount.com");
  assert.equal(claim.aud, "https://oauth2.googleapis.com/token");
  assert.ok(claim.scope.includes("analytics.readonly"));
  assert.ok(claim.scope.includes("analytics.edit"));
  assert.equal(claim.exp - claim.iat, 3600);
});

test("refreshTokenBody encodes the user-oauth refresh flow", () => {
  const body = refreshTokenBody("cid", "csecret", "rtoken");
  assert.equal(body.get("grant_type"), "refresh_token");
  assert.equal(body.get("client_id"), "cid");
  assert.equal(body.get("client_secret"), "csecret");
  assert.equal(body.get("refresh_token"), "rtoken");
});

test("createCustomDimensionBody matches the Admin API contract", () => {
  const body = createCustomDimensionBody({ parameterName: "promoId", displayName: "Promo ID", scope: "EVENT" });
  assert.deepEqual(body, {
    parameterName: "promoId",
    displayName: "Promo ID",
    scope: "EVENT"
  });
});

test("realtimeReportBody builds a bounded event report", () => {
  const body = realtimeReportBody({
    dimensions: ["eventName", "customEvent:promoId"],
    minutes: 10
  });
  assert.deepEqual(body.dimensions, [
    { name: "eventName" },
    { name: "customEvent:promoId" }
  ]);
  assert.ok(Array.isArray(body.metrics));
  assert.equal(body.minuteRanges[0].startMinutesAgo, 9);
  assert.equal(body.minuteRanges[0].endMinutesAgo, 0);
});

test("extractGoogleError surfaces the API error message", () => {
  const msg = extractGoogleError({
    error: { message: "Permission denied", code: 403 }
  });
  assert.match(msg, /Permission denied/);
});
