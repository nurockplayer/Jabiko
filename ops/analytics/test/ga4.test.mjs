// ops/analytics GA4 Admin + Data API client tests.
//
// These tests encode the ACTUAL Google Analytics Admin API v1beta contract:
//   - Admin base is /v1beta (not /v1).
//   - Properties are listed via the top-level
//     GET /v1beta/properties?filter=parent:accounts/{id} (there is no nested
//     /accounts/{id}/properties in v1beta).
//   - Data streams are listed via GET /v1beta/properties/{property}/dataStreams
//     (webDataStreams is legacy UA naming, not GA4 v1beta).
//   - A web stream's Measurement ID lives at webStreamData.measurementId.
//   - Custom dimensions live at /v1beta/properties/{property}/customDimensions.
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
  propertiesListUrl,
  dataStreamsUrl,
  customDimensionsUrl,
  listProperties,
  listDataStreams
} from "../src/ga4.mjs";
import { discoverGa4 } from "../src/cli/cliutil.mjs";

// Runtime-generated key so the JWT is actually signed (no key material in
// source, nothing secret committed).
const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const PRIVATE_KEY_PEM = privateKey.export({ type: "pkcs8", format: "pem" });

test("Admin API base is /v1beta, Data API stays /v1beta", () => {
  assert.equal(gaAdminUrl("/accounts"), "https://analyticsadmin.googleapis.com/v1beta/accounts");
  assert.equal(gaDataUrl("123", "runRealtimeReport"), "https://analyticsdata.googleapis.com/v1beta/properties/123:runRealtimeReport");
});

test("propertiesListUrl uses the top-level properties.list with a parent filter (not /accounts/{id}/properties)", () => {
  assert.equal(
    propertiesListUrl("accounts/1"),
    "https://analyticsadmin.googleapis.com/v1beta/properties?filter=parent%3Aaccounts%2F1"
  );
  assert.equal(
    propertiesListUrl("123"),
    "https://analyticsadmin.googleapis.com/v1beta/properties?filter=parent%3Aaccounts%2F123"
  );
});

test("dataStreamsUrl uses dataStreams (not webDataStreams)", () => {
  assert.equal(
    dataStreamsUrl("properties/7"),
    "https://analyticsadmin.googleapis.com/v1beta/properties/7/dataStreams"
  );
  assert.equal(
    dataStreamsUrl("7"),
    "https://analyticsadmin.googleapis.com/v1beta/properties/7/dataStreams"
  );
});

test("customDimensionsUrl is unchanged under /v1beta", () => {
  assert.equal(
    customDimensionsUrl("properties/7"),
    "https://analyticsadmin.googleapis.com/v1beta/properties/7/customDimensions"
  );
});

test("listProperties issues the top-level properties.list with a parent filter", async () => {
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
    "https://analyticsadmin.googleapis.com/v1beta/properties?filter=parent%3Aaccounts%2F123"
  );
});

test("listDataStreams reads dataStreams (not webDataStreams)", async () => {
  const seen = [];
  const prev = globalThis.fetch;
  globalThis.fetch = async (url) => {
    seen.push(String(url));
    return { ok: true, status: 200, json: async () => ({ dataStreams: [] }) };
  };
  try {
    await listDataStreams({ token: "t", property: "properties/7" });
  } finally {
    globalThis.fetch = prev;
  }
  assert.equal(seen[0], "https://analyticsadmin.googleapis.com/v1beta/properties/7/dataStreams");
});

test("discoverGa4 uses the v1beta contract and extracts webStreamData.measurementId", async () => {
  const seen = [];
  const prev = globalThis.fetch;
  globalThis.fetch = async (url) => {
    const u = String(url);
    seen.push(u);
    if (u.endsWith("/v1beta/accounts")) {
      return { ok: true, status: 200, json: async () => ({ accounts: [{ name: "accounts/1", displayName: "Acct" }] }) };
    }
    if (u.includes("/v1beta/properties?filter=")) {
      return { ok: true, status: 200, json: async () => ({ properties: [{ name: "properties/2", displayName: "Jabiko", url: "https://jabiko.app" }] }) };
    }
    if (u.includes("/v1beta/properties/2/dataStreams")) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          dataStreams: [
            { name: "properties/2/dataStreams/3", type: "WEB_DATA_STREAM", webStreamData: { measurementId: "G-X", defaultUri: "https://jabiko.app" } }
          ]
        })
      };
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
  assert.ok(seen.some((u) => u.endsWith("/v1beta/accounts")), "lists accounts at /v1beta/accounts");
  assert.ok(seen.some((u) => u.includes("/v1beta/properties?filter=parent%3Aaccounts%2F1")), "lists properties via top-level filter");
  assert.ok(seen.some((u) => u.endsWith("/v1beta/properties/2/dataStreams")), "lists data streams via dataStreams");
  assert.ok(!seen.some((u) => u.includes("webDataStreams")), "webDataStreams is never used");
  assert.ok(!seen.some((u) => u.includes("/accounts/accounts/") || u.includes("/properties/properties/")), "no duplicated prefixes");
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
