// ops/analytics GA4 Admin + Data API client contract tests.
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
  runRealtimeReport,
  extractGoogleError,
  propertiesListUrl,
  dataStreamsUrl,
  customDimensionsUrl,
  listProperties,
  listAccounts,
  listDataStreams,
  listCustomDimensions,
  REALTIME_SMOKE_DIMENSIONS,
  STANDARD_REALTIME_MAX_MINUTES
} from "../src/ga4.mjs";
import { discoverGa4, selectProductionWebStream } from "../src/cli/cliutil.mjs";

const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const PRIVATE_KEY_PEM = privateKey.export({ type: "pkcs8", format: "pem" });

test("Admin API base is /v1beta, Data API stays /v1beta", () => {
  assert.equal(gaAdminUrl("/accounts"), "https://analyticsadmin.googleapis.com/v1beta/accounts");
  assert.equal(gaDataUrl("123", "runRealtimeReport"), "https://analyticsdata.googleapis.com/v1beta/properties/123:runRealtimeReport");
});

test("propertiesListUrl uses top-level properties.list with parent filter", () => {
  assert.equal(
    propertiesListUrl("accounts/1"),
    "https://analyticsadmin.googleapis.com/v1beta/properties?filter=parent%3Aaccounts%2F1"
  );
  assert.equal(
    propertiesListUrl("123"),
    "https://analyticsadmin.googleapis.com/v1beta/properties?filter=parent%3Aaccounts%2F123"
  );
});

test("dataStreamsUrl uses dataStreams", () => {
  assert.equal(dataStreamsUrl("properties/7"), "https://analyticsadmin.googleapis.com/v1beta/properties/7/dataStreams");
  assert.equal(dataStreamsUrl("7"), "https://analyticsadmin.googleapis.com/v1beta/properties/7/dataStreams");
});

test("customDimensionsUrl remains under /v1beta", () => {
  assert.equal(customDimensionsUrl("properties/7"), "https://analyticsadmin.googleapis.com/v1beta/properties/7/customDimensions");
});

test("listProperties issues top-level properties.list with a parent filter", async () => {
  const seen = [];
  const previous = globalThis.fetch;
  globalThis.fetch = async (url) => {
    seen.push(String(url));
    return { ok: true, status: 200, json: async () => ({ properties: [] }) };
  };
  try {
    await listProperties({ token: "t", account: "accounts/123" });
  } finally {
    globalThis.fetch = previous;
  }
  assert.deepEqual(seen, [
    "https://analyticsadmin.googleapis.com/v1beta/properties?filter=parent%3Aaccounts%2F123"
  ]);
});

test("listDataStreams reads dataStreams", async () => {
  const seen = [];
  const previous = globalThis.fetch;
  globalThis.fetch = async (url) => {
    seen.push(String(url));
    return { ok: true, status: 200, json: async () => ({ dataStreams: [] }) };
  };
  try {
    await listDataStreams({ token: "t", property: "properties/7" });
  } finally {
    globalThis.fetch = previous;
  }
  assert.equal(seen[0], "https://analyticsadmin.googleapis.com/v1beta/properties/7/dataStreams");
});

test("listCustomDimensions follows nextPageToken until exhausted", async () => {
  const seen = [];
  const previous = globalThis.fetch;
  globalThis.fetch = async (url) => {
    const u = String(url);
    seen.push(u);
    if (u.includes("pageToken=page2")) {
      return {
        ok: true,
        status: 200,
        json: async () => ({ customDimensions: [{ parameterName: "promoId", name: "promoId", scope: "EVENT" }] })
      };
    }
    return {
      ok: true,
      status: 200,
      json: async () => ({
        customDimensions: [{ parameterName: "action", name: "action", scope: "EVENT" }],
        nextPageToken: "page2"
      })
    };
  };
  try {
    const dims = await listCustomDimensions({ token: "t", property: "properties/7" });
    assert.deepEqual(dims.map((d) => d.parameterName), ["action", "promoId"]);
  } finally {
    globalThis.fetch = previous;
  }
  assert.equal(seen.length, 2, "the page token is followed once");
  assert.ok(seen[0].includes("/v1beta/properties/7/customDimensions"), "the base path is preserved");
  assert.ok(seen[1].includes("pageToken=page2"), "the page token is appended for the next page");
});

test("listAccounts follows nextPageToken until exhausted", async () => {
  const seen = [];
  const previous = globalThis.fetch;
  globalThis.fetch = async (url) => {
    const u = String(url);
    seen.push(u);
    if (u.includes("pageToken=acct2")) {
      return { ok: true, status: 200, json: async () => ({ accounts: [{ name: "accounts/2" }] }) };
    }
    return { ok: true, status: 200, json: async () => ({ accounts: [{ name: "accounts/1" }], nextPageToken: "acct2" }) };
  };
  try {
    const accounts = await listAccounts({ token: "t" });
    assert.deepEqual(accounts.map((a) => a.name), ["accounts/1", "accounts/2"]);
  } finally {
    globalThis.fetch = previous;
  }
  assert.equal(seen.length, 2);
  assert.ok(seen[0].endsWith("/v1beta/accounts"), "the base path is preserved");
  assert.ok(seen[1].includes("pageToken=acct2"), "the page token is appended");
});

test("listProperties preserves the parent filter query when paginating", async () => {
  const seen = [];
  const previous = globalThis.fetch;
  globalThis.fetch = async (url) => {
    const u = String(url);
    seen.push(u);
    if (u.includes("pageToken=p2")) {
      return { ok: true, status: 200, json: async () => ({ properties: [{ name: "properties/9" }] }) };
    }
    return { ok: true, status: 200, json: async () => ({ properties: [{ name: "properties/2" }], nextPageToken: "p2" }) };
  };
  try {
    const properties = await listProperties({ token: "t", account: "accounts/1" });
    assert.deepEqual(properties.map((p) => p.name), ["properties/2", "properties/9"]);
  } finally {
    globalThis.fetch = previous;
  }
  assert.ok(seen[0].includes("filter=parent%3Aaccounts%2F1"), "the parent filter is preserved");
  assert.ok(seen[1].includes("filter=parent%3Aaccounts%2F1"), "the filter survives page 2");
  assert.ok(seen[1].includes("pageToken=p2"), "the page token is appended");
});

test("discoverGa4 finds the production web stream on page 2 of dataStreams", async () => {
  const previous = globalThis.fetch;
  globalThis.fetch = async (url) => {
    const u = String(url);
    if (u.endsWith("/v1beta/accounts")) {
      return { ok: true, status: 200, json: async () => ({ accounts: [{ name: "accounts/1" }] }) };
    }
    if (u.includes("/v1beta/properties?filter=")) {
      return { ok: true, status: 200, json: async () => ({ properties: [{ name: "properties/2", displayName: "Jabiko", url: "https://jabiko.app" }] }) };
    }
    if (u.includes("/v1beta/properties/2/dataStreams")) {
      if (u.includes("pageToken=s2")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ dataStreams: [{ name: "properties/2/dataStreams/9", type: "WEB_DATA_STREAM", webStreamData: { measurementId: "G-PROD", defaultUri: "https://jabiko.app" } }] })
        };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({ dataStreams: [{ name: "properties/2/dataStreams/3", type: "WEB_DATA_STREAM", webStreamData: { measurementId: "G-OLD" } }], nextPageToken: "s2" })
      };
    }
    return { ok: false, status: 404, json: async () => ({ error: { message: `unexpected ${u}` } }) };
  };
  let discovered;
  try {
    discovered = await discoverGa4({ token: "t" });
  } finally {
    globalThis.fetch = previous;
  }
  assert.equal(discovered.measurementId, "G-PROD", "the production stream on page 2 is discovered");
});

test("discoverGa4 finds the production property by its web stream URI even with a generic displayName", async () => {
  const previous = globalThis.fetch;
  globalThis.fetch = async (url) => {
    const u = String(url);
    if (u.endsWith("/v1beta/accounts")) {
      return { ok: true, status: 200, json: async () => ({ accounts: [{ name: "accounts/1" }] }) };
    }
    if (u.includes("/v1beta/properties?filter=")) {
      // Generic property name with NO displayName/url signal.
      return { ok: true, status: 200, json: async () => ({ properties: [{ name: "properties/2", displayName: "Production" }] }) };
    }
    if (u.includes("/v1beta/properties/2/dataStreams")) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          dataStreams: [{ name: "properties/2/dataStreams/3", type: "WEB_DATA_STREAM", webStreamData: { measurementId: "G-PROD", defaultUri: "https://jabiko.app" } }]
        })
      };
    }
    return { ok: false, status: 404, json: async () => ({ error: { message: `unexpected ${u}` } }) };
  };
  let discovered;
  try {
    discovered = await discoverGa4({ token: "t" });
  } finally {
    globalThis.fetch = previous;
  }
  assert.equal(discovered.measurementId, "G-PROD", "a generic property whose web stream points at jabiko.app is the production property");
  assert.equal(discovered.property.displayName, "Production");
});

test("discoverGa4 fails closed when multiple properties have jabiko.app production streams", async () => {
  const previous = globalThis.fetch;
  globalThis.fetch = async (url) => {
    const u = String(url);
    if (u.endsWith("/v1beta/accounts")) {
      return { ok: true, status: 200, json: async () => ({ accounts: [{ name: "accounts/1" }] }) };
    }
    if (u.includes("/v1beta/properties?filter=")) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          properties: [
            { name: "properties/2", displayName: "Jabiko A" },
            { name: "properties/3", displayName: "Jabiko B" }
          ]
        })
      };
    }
    if (u.includes("/dataStreams")) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          dataStreams: [{ name: "x", type: "WEB_DATA_STREAM", webStreamData: { measurementId: "G-X", defaultUri: "https://jabiko.app" } }]
        })
      };
    }
    return { ok: false, status: 404, json: async () => ({ error: { message: `unexpected ${u}` } }) };
  };
  let discovered;
  try {
    discovered = await discoverGa4({ token: "t" });
  } finally {
    globalThis.fetch = previous;
  }
  assert.equal(discovered.property, null, "two production properties is ambiguous — fail closed");
  assert.equal(discovered.candidates.length, 2);
});

test("discoverGa4 resolves a single candidate via --measurement-id when multiple jabiko.app properties exist", async () => {
  const previous = globalThis.fetch;
  globalThis.fetch = async (url) => {
    const u = String(url);
    if (u.endsWith("/v1beta/accounts")) {
      return { ok: true, status: 200, json: async () => ({ accounts: [{ name: "accounts/1" }] }) };
    }
    if (u.includes("/v1beta/properties?filter=")) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          properties: [
            { name: "properties/2", displayName: "Jabiko A" },
            { name: "properties/3", displayName: "Jabiko B" }
          ]
        })
      };
    }
    if (u.includes("/v1beta/properties/2/dataStreams")) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          dataStreams: [{ name: "x", type: "WEB_DATA_STREAM", webStreamData: { measurementId: "G-A", defaultUri: "https://jabiko.app" } }]
        })
      };
    }
    if (u.includes("/v1beta/properties/3/dataStreams")) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          dataStreams: [{ name: "y", type: "WEB_DATA_STREAM", webStreamData: { measurementId: "G-B", defaultUri: "https://jabiko.app" } }]
        })
      };
    }
    return { ok: false, status: 404, json: async () => ({ error: { message: `unexpected ${u}` } }) };
  };
  let discovered;
  try {
    discovered = await discoverGa4({ token: "t", measurementId: "G-B" });
  } finally {
    globalThis.fetch = previous;
  }
  assert.equal(discovered.property?.name, "properties/3", "--measurement-id picks the matching production property");
  assert.equal(discovered.measurementId, "G-B");
});

test("discoverGa4 fails closed when --measurement-id matches zero jabiko.app candidates", async () => {
  const previous = globalThis.fetch;
  globalThis.fetch = async (url) => {
    const u = String(url);
    if (u.endsWith("/v1beta/accounts")) {
      return { ok: true, status: 200, json: async () => ({ accounts: [{ name: "accounts/1" }] }) };
    }
    if (u.includes("/v1beta/properties?filter=")) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          properties: [
            { name: "properties/2", displayName: "Jabiko A" },
            { name: "properties/3", displayName: "Jabiko B" }
          ]
        })
      };
    }
    if (u.includes("/dataStreams")) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          dataStreams: [{ name: "x", type: "WEB_DATA_STREAM", webStreamData: { measurementId: "G-A", defaultUri: "https://jabiko.app" } }]
        })
      };
    }
    return { ok: false, status: 404, json: async () => ({ error: { message: `unexpected ${u}` } }) };
  };
  let discovered;
  try {
    discovered = await discoverGa4({ token: "t", measurementId: "G-NOPE" });
  } finally {
    globalThis.fetch = previous;
  }
  assert.equal(discovered.property, null, "a measurement-id matching no candidate must fail closed");
});

test("discoverGa4 uses v1beta contract and webStreamData.measurementId", async () => {
  const seen = [];
  const previous = globalThis.fetch;
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
  let discovered;
  try {
    discovered = await discoverGa4({ token: "t" });
  } finally {
    globalThis.fetch = previous;
  }
  assert.equal(discovered.measurementId, "G-X");
  assert.ok(seen.some((u) => u.endsWith("/v1beta/accounts")));
  assert.ok(seen.some((u) => u.includes("/v1beta/properties?filter=parent%3Aaccounts%2F1")));
  assert.ok(seen.some((u) => u.endsWith("/v1beta/properties/2/dataStreams")));
  assert.ok(!seen.some((u) => u.includes("webDataStreams")));
});

test("selectProductionWebStream picks the unique jabiko.app web stream and fails closed otherwise", () => {
  const prodWeb = { type: "WEB_DATA_STREAM", webStreamData: { defaultUri: "https://jabiko.app", measurementId: "G-PROD" } };
  const prodWeb2 = { type: "WEB_DATA_STREAM", webStreamData: { defaultUri: "https://jabiko.app/en", measurementId: "G-PROD2" } };
  const stagingWeb = { type: "WEB_DATA_STREAM", webStreamData: { defaultUri: "https://staging.jabiko.app", measurementId: "G-STAGE" } };
  const noUriWeb = { type: "WEB_DATA_STREAM", webStreamData: { measurementId: "G-NOURI" } };
  const ios = { type: "IOS_APP_DATA_STREAM", webStreamData: { measurementId: "G-IOS" } };

  assert.equal(selectProductionWebStream([prodWeb])?.webStreamData?.measurementId, "G-PROD");
  assert.equal(selectProductionWebStream([prodWeb, stagingWeb])?.webStreamData?.measurementId, "G-PROD", "staging subdomain is ignored");
  assert.equal(selectProductionWebStream([prodWeb, prodWeb2]), null, "two production web streams is ambiguous");
  assert.equal(selectProductionWebStream([stagingWeb]), null, "staging-only is not production");
  assert.equal(selectProductionWebStream([noUriWeb]), null, "missing defaultUri cannot be identified");
  assert.equal(selectProductionWebStream([ios]), null, "non-web stream is never a production web stream");
});

test("buildSignedJwt produces a verifiable JWT header + claim", () => {
  const sa = {
    client_email: "sa@proj.iam.gserviceaccount.com",
    private_key: PRIVATE_KEY_PEM,
    token_uri: "https://oauth2.googleapis.com/token"
  };
  const now = 1_700_000_000;
  const jwt = buildSignedJwt(sa, { now });
  const [header, claim] = decodeJwtPayload(jwt);
  assert.equal(jwt.split(".").length, 3);
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

test("createCustomDimensionBody matches Admin API contract", () => {
  assert.deepEqual(
    createCustomDimensionBody({ parameterName: "promoId", displayName: "Promo ID", scope: "EVENT" }),
    { parameterName: "promoId", displayName: "Promo ID", scope: "EVENT" }
  );
});

test("Realtime smoke uses only the supported eventName + minutesAgo dimensions and a maximum 30-minute standard-property window", () => {
  const body = realtimeReportBody();
  assert.deepEqual(body.dimensions, REALTIME_SMOKE_DIMENSIONS.map((name) => ({ name })));
  assert.deepEqual(body.metrics, [{ name: "eventCount" }]);
  assert.equal(body.minuteRanges[0].startMinutesAgo, STANDARD_REALTIME_MAX_MINUTES - 1);
  assert.equal(body.minuteRanges[0].endMinutesAgo, 0);
  assert.ok(body.minuteRanges[0].startMinutesAgo <= 29);
});

test("Realtime request rejects any window beyond the standard 30-minute contract", () => {
  for (const minutes of [0, 31, 60, 30.5]) {
    assert.throws(() => realtimeReportBody({ dimensions: ["eventName"], minutes }), /Realtime window/);
  }
});

test("unsupported Realtime dimensions are rejected before a network request", async () => {
  const unsupported = ["sessionId", "pagePath", "customEvent:promoId", "customEvent:action", "customEvent:placement", "customEvent:locale"];
  for (const dimension of unsupported) {
    assert.throws(
      () => realtimeReportBody({ dimensions: ["eventName", dimension], minutes: 30 }),
      /Unsupported dimension/
    );
  }

  let fetchCalls = 0;
  const previous = globalThis.fetch;
  globalThis.fetch = async () => {
    fetchCalls += 1;
    throw new Error("should not be reached");
  };
  try {
    await assert.rejects(
      () => runRealtimeReport({ token: "t", propertyId: "1", dimensions: ["sessionId"], minutes: 30 }),
      /Unsupported dimension/
    );
  } finally {
    globalThis.fetch = previous;
  }
  assert.equal(fetchCalls, 0);
});

test("runRealtimeReport emits only the supported bounded request", async () => {
  let body;
  const previous = globalThis.fetch;
  globalThis.fetch = async (_url, options) => {
    body = JSON.parse(options.body);
    return {
      ok: true,
      status: 200,
      json: async () => ({
        dimensionHeaders: [{ name: "eventName" }, { name: "minutesAgo" }],
        rows: [{ dimensionValues: [{ value: "promo_click" }, { value: "0" }], metricValues: [{ value: "7" }] }]
      })
    };
  };
  try {
    const rows = await runRealtimeReport({ token: "t", propertyId: "1" });
    assert.equal(rows[0].eventName, "promo_click");
    assert.equal(rows[0].minutesAgo, "0");
    assert.equal(rows[0].eventCount, 7);
  } finally {
    globalThis.fetch = previous;
  }
  assert.deepEqual(body.dimensions, [{ name: "eventName" }, { name: "minutesAgo" }]);
  assert.ok(body.minuteRanges[0].startMinutesAgo <= 29);
});

test("extractGoogleError surfaces API error message", () => {
  assert.match(extractGoogleError({ error: { message: "Permission denied", code: 403 } }), /Permission denied/);
});
