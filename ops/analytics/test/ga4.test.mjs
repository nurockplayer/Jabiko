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
  customDimensionsUrl
} from "../src/ga4.mjs";

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
