// ops/analytics desired-state pure logic tests.
// Run: node --test ops/analytics/test/
import test from "node:test";
import assert from "node:assert/strict";
import {
  ZONE_NAME,
  FORWARDED_EVENTS,
  PROMO_PARAMS,
  PROMO_ACTIONS,
  PROMO_PLACEMENTS,
  GA4_COMPONENT,
  GA4_DIMENSIONS,
  analyzeZaraz,
  triggerFiresOnCustomEvent,
  automaticPageviewActive,
  zarazDesiredDiff,
  ga4DesiredDiff,
  buildZarazDesiredConfig,
  plausibleProductionProperties,
  stripSecretValues,
  hasPendingPreview
} from "../src/desired.mjs";

const MEASUREMENT_ID = "G-ABCDEF123";

// --- contract constants (#745) ---
test("desired contract: exactly the four #745 promo params", () => {
  assert.deepEqual(PROMO_PARAMS, ["promoId", "action", "placement", "locale"]);
});

test("desired contract: seven frozen Stay.D placements", () => {
  assert.deepEqual(PROMO_PLACEMENTS, [
    "home-airbnb",
    "home-video",
    "home-video-airbnb",
    "stay-d-hero-airbnb",
    "stay-d-video",
    "stay-d-video-airbnb",
    "stay-d-final-airbnb"
  ]);
});

test("desired contract: only airbnb | video actions", () => {
  assert.deepEqual(PROMO_ACTIONS, ["airbnb", "video"]);
});

test("desired contract: forward page_view and promo_click only", () => {
  assert.deepEqual(FORWARDED_EVENTS, ["page_view", "promo_click"]);
});

test("desired contract: GA4 component is google-analytics-4", () => {
  assert.equal(GA4_COMPONENT, "google-analytics-4");
});

test("desired contract: four event-scoped custom dimensions", () => {
  const params = GA4_DIMENSIONS.map((d) => d.parameterName).sort();
  assert.deepEqual(params, ["action", "locale", "placement", "promoId"]);
  assert.ok(GA4_DIMENSIONS.every((d) => d.scope === "EVENT"));
});

test("desired contract: zone is jabiko.app", () => {
  assert.equal(ZONE_NAME, "jabiko.app");
});

// --- fixtures ---
function convergedConfig() {
  return {
    dataLayer: true,
    settings: { autoInjectScript: true },
    tools: {
      ga4: {
        component: "google-analytics-4",
        name: "Google Analytics 4",
        type: "component",
        enabled: true,
        settings: { tid: MEASUREMENT_ID },
        permissions: ["access_client_kv", "server_network_requests"],
        blockingTriggers: [],
        actions: {
          "act-page-view": {
            actionType: "track",
            data: { en: "page_view" },
            firingTriggers: ["trg-page-view"],
            blockingTriggers: []
          },
          "act-promo-click": {
            actionType: "track",
            data: { en: "promo_click" },
            firingTriggers: ["trg-promo-click"],
            blockingTriggers: []
          }
        }
      }
    },
    triggers: {
      "trg-page-view": {
        name: "page_view",
        loadRules: [
          { id: "r1", match: "custom_event_name", op: "Eq", value: "page_view" }
        ],
        excludeRules: []
      },
      "trg-promo-click": {
        name: "promo_click",
        loadRules: [
          { id: "r2", match: "custom_event_name", op: "Eq", value: "promo_click" }
        ],
        excludeRules: []
      }
    },
    zarazVersion: 3
  };
}

// --- analyzeZaraz ---
test("analyzeZaraz finds GA4 tool, triggers, auto-inject", () => {
  const a = analyzeZaraz(convergedConfig());
  assert.equal(a.autoInject, true);
  assert.equal(a.ga4Tools.length, 1);
  assert.equal(a.ga4Tools[0].settings.tid, MEASUREMENT_ID);
  assert.equal(a.triggers.length, 2);
  assert.deepEqual(a.forbidden, []);
});

test("analyzeZaraz flags a gtag second analytics client", () => {
  const cfg = convergedConfig();
  cfg.tools.gtag1 = {
    component: "gtag",
    name: "GTag",
    type: "component",
    enabled: true,
    settings: {},
    actions: {}
  };
  const a = analyzeZaraz(cfg);
  assert.equal(a.forbidden.length, 1);
  assert.equal(a.forbidden[0].component, "gtag");
});

test("triggerFiresOnCustomEvent matches event name", () => {
  const tr = convergedConfig().triggers["trg-promo-click"];
  assert.ok(triggerFiresOnCustomEvent(tr, "promo_click"));
  assert.ok(!triggerFiresOnCustomEvent(tr, "page_view"));
});

// --- automaticPageviewActive ---
test("automatic pageview action is detected", () => {
  const cfg = convergedConfig();
  cfg.tools.ga4.actions["act-pageview"] = {
    actionType: "pageview",
    data: {},
    firingTriggers: ["trg-page-load"],
    blockingTriggers: []
  };
  cfg.triggers["trg-page-load"] = {
    name: "pageload",
    system: "pageload",
    loadRules: [],
    excludeRules: []
  };
  assert.ok(automaticPageviewActive(cfg));
});

test("no automatic pageview in converged config", () => {
  assert.ok(!automaticPageviewActive(convergedConfig()));
});

// --- zarazDesiredDiff ---
test("converged config produces no diff", () => {
  assert.deepEqual(zarazDesiredDiff(convergedConfig(), MEASUREMENT_ID), []);
});

test("empty config reports the missing pieces", () => {
  const findings = zarazDesiredDiff({}, MEASUREMENT_ID);
  const codes = findings.map((f) => f.code);
  assert.ok(codes.includes("ZARAZ_AUTO_INJECT_OFF"));
  assert.ok(codes.includes("GA4_TOOL_MISSING"));
  assert.ok(codes.includes("TRIGGER_MISSING"));
});

test("missing measurement id is a blocking finding", () => {
  const findings = zarazDesiredDiff(convergedConfig(), undefined);
  assert.ok(findings.some((f) => f.code === "MEASUREMENT_ID_UNSPECIFIED"));
});

test("wrong tid reports mismatch", () => {
  const cfg = convergedConfig();
  cfg.tools.ga4.settings.tid = "G-OTHER123";
  const findings = zarazDesiredDiff(cfg, MEASUREMENT_ID);
  assert.ok(findings.some((f) => f.code === "GA4_TOOL_TID_MISMATCH"));
});

test("missing promo_click trigger reports TRIGGER_MISSING", () => {
  const cfg = convergedConfig();
  delete cfg.triggers["trg-promo-click"];
  const findings = zarazDesiredDiff(cfg, MEASUREMENT_ID);
  const f = findings.find((x) => x.code === "TRIGGER_MISSING");
  assert.ok(f);
  assert.equal(f.event, "promo_click");
});

test("missing track action reports TRACK_ACTION_MISSING", () => {
  const cfg = convergedConfig();
  delete cfg.tools.ga4.actions["act-promo-click"];
  const findings = zarazDesiredDiff(cfg, MEASUREMENT_ID);
  assert.ok(findings.some((f) => f.code === "TRACK_ACTION_MISSING"));
});

test("automatic pageview reports AUTO_PAGEVIEW_ACTIVE", () => {
  const cfg = convergedConfig();
  cfg.tools.ga4.actions["act-pageview"] = {
    actionType: "pageview",
    data: {},
    firingTriggers: [],
    blockingTriggers: []
  };
  const findings = zarazDesiredDiff(cfg, MEASUREMENT_ID);
  assert.ok(findings.some((f) => f.code === "AUTO_PAGEVIEW_ACTIVE"));
});

test("gtag reports SECOND_ANALYTICS_CLIENT", () => {
  const cfg = convergedConfig();
  cfg.tools.gtag1 = {
    component: "gtag",
    name: "GTag",
    type: "component",
    enabled: true,
    settings: {},
    actions: {}
  };
  const findings = zarazDesiredDiff(cfg, MEASUREMENT_ID);
  assert.ok(findings.some((f) => f.code === "SECOND_ANALYTICS_CLIENT"));
});

// --- buildZarazDesiredConfig ---
test("build on empty config creates GA4 tool, triggers, actions, auto-inject", () => {
  const { config, mutations, findings } = buildZarazDesiredConfig(
    {},
    { measurementId: MEASUREMENT_ID }
  );
  assert.ok(config.settings.autoInjectScript === true);
  assert.ok(config.tools.ga4, "ga4 tool created");
  assert.equal(config.tools.ga4.component, "google-analytics-4");
  assert.equal(config.tools.ga4.settings.tid, MEASUREMENT_ID);
  assert.ok(config.triggers["trg-page-view"]);
  assert.ok(config.triggers["trg-promo-click"]);
  assert.ok(config.tools.ga4.actions["act-page-view"]);
  assert.ok(config.tools.ga4.actions["act-promo-click"]);
  assert.ok(mutations.length > 0);
  assert.deepEqual(findings, []);
});

test("build is idempotent on a converged config", () => {
  const before = convergedConfig();
  const { config, mutations } = buildZarazDesiredConfig(before, {
    measurementId: MEASUREMENT_ID
  });
  assert.deepEqual(config, before, "config unchanged when already converged");
  assert.deepEqual(mutations, []);
});

test("build preserves unrelated tools, triggers, variables", () => {
  const cfg = {
    settings: { autoInjectScript: true },
    tools: { other: { component: "custom-html", name: "Other", type: "component", settings: {}, actions: {} } },
    triggers: { "trg-other": { name: "other", loadRules: [], excludeRules: [] } },
    variables: { v1: { name: "v1", type: "string", value: "x" } },
    zarazVersion: 5
  };
  const { config } = buildZarazDesiredConfig(cfg, { measurementId: MEASUREMENT_ID });
  assert.ok(config.tools.other, "unrelated tool preserved");
  assert.ok(config.triggers["trg-other"], "unrelated trigger preserved");
  assert.ok(config.variables.v1, "variables preserved");
  assert.equal(config.zarazVersion, 5, "zarazVersion preserved");
});

test("build removes the automatic pageview action only", () => {
  const cfg = convergedConfig();
  cfg.tools.ga4.actions["act-pageview"] = {
    actionType: "pageview",
    data: {},
    firingTriggers: [],
    blockingTriggers: []
  };
  const { config, mutations } = buildZarazDesiredConfig(cfg, {
    measurementId: MEASUREMENT_ID
  });
  assert.ok(
    !config.tools.ga4.actions["act-pageview"],
    "automatic pageview action removed"
  );
  assert.ok(
    mutations.some((m) => m.code === "AUTO_PAGEVIEW_REMOVED"),
    "removal logged"
  );
});

test("build does NOT delete a gtag tool (returns finding instead)", () => {
  const cfg = convergedConfig();
  cfg.tools.gtag1 = {
    component: "gtag",
    name: "GTag",
    type: "component",
    enabled: true,
    settings: {},
    actions: {}
  };
  const { config, findings } = buildZarazDesiredConfig(cfg, {
    measurementId: MEASUREMENT_ID
  });
  assert.ok(config.tools.gtag1, "gtag tool preserved by default");
  assert.ok(findings.some((f) => f.code === "SECOND_ANALYTICS_CLIENT"));
});

test("build honours explicit removal of the forbidden tool", () => {
  const cfg = convergedConfig();
  cfg.tools.gtag1 = {
    component: "gtag",
    name: "GTag",
    type: "component",
    enabled: true,
    settings: {},
    actions: {}
  };
  const { config } = buildZarazDesiredConfig(cfg, {
    measurementId: MEASUREMENT_ID,
    removeForbidden: true
  });
  assert.ok(!config.tools.gtag1, "forbidden tool removed when authorised");
});

// --- ga4DesiredDiff ---
test("ga4 diff lists all missing dimensions", () => {
  const d = ga4DesiredDiff("12345", []);
  assert.equal(d.missing.length, 4);
  assert.deepEqual(d.present, []);
  assert.deepEqual(d.conflicts, []);
});

test("ga4 diff is empty when all dimensions exist (idempotent)", () => {
  const existing = GA4_DIMENSIONS.map((x) => ({ ...x, name: x.parameterName }));
  const d = ga4DesiredDiff("12345", existing);
  assert.deepEqual(d.missing, []);
  assert.equal(d.present.length, 4);
});

test("ga4 diff prevents duplicate creation when a param already exists", () => {
  const existing = GA4_DIMENSIONS.slice(0, 1).map((x) => ({
    ...x,
    name: x.parameterName
  }));
  const d = ga4DesiredDiff("12345", existing);
  assert.deepEqual(
    d.missing.map((x) => x.parameterName),
    ["action", "placement", "locale"]
  );
});

test("ga4 diff flags an existing dimension with the wrong scope", () => {
  const existing = [{ parameterName: "promoId", scope: "USER", name: "promoId" }];
  const d = ga4DesiredDiff("12345", existing);
  assert.ok(d.conflicts.some((c) => c.parameterName === "promoId"));
});

// --- plausibleProductionProperties ---
test("property plausibility picks the jabiko production property", () => {
  const props = [
    { displayName: "Jabiko Production", url: "https://jabiko.app" },
    { displayName: "Jabiko Test", url: "https://test.jabiko.app" },
    { displayName: "Other App", url: "https://other.app" }
  ];
  const picked = plausibleProductionProperties(props);
  assert.equal(picked.length, 1);
  assert.equal(picked[0].displayName, "Jabiko Production");
});

// --- pending-preview detection (Preview & Publish mutation safety) ---
test("hasPendingPreview ignores secret-variable values (draft is secret-stripped)", () => {
  const published = {
    tools: { ga4: { component: "google-analytics-4", settings: { tid: "G-1" } } },
    variables: { s1: { name: "s1", type: "secret", value: "real-secret" } }
  };
  const draft = {
    tools: { ga4: { component: "google-analytics-4", settings: { tid: "G-1" } } },
    variables: { s1: { name: "s1", type: "secret" } }
  };
  assert.equal(hasPendingPreview(draft, published), false);
});

test("hasPendingPreview detects an added tool in the draft", () => {
  const published = { tools: { a: { component: "custom-html" } } };
  const draft = {
    tools: { a: { component: "custom-html" }, b: { component: "custom-html" } }
  };
  assert.equal(hasPendingPreview(draft, published), true);
});

test("hasPendingPreview detects a changed non-secret variable value", () => {
  const published = { variables: { v1: { name: "v1", type: "string", value: "old" } } };
  const draft = { variables: { v1: { name: "v1", type: "string", value: "new" } } };
  assert.equal(hasPendingPreview(draft, published), true);
});

test("stripSecretValues drops secret values but keeps non-secret values", () => {
  const stripped = stripSecretValues({
    variables: {
      s1: { name: "s1", type: "secret", value: "hidden" },
      v1: { name: "v1", type: "string", value: "visible" }
    }
  });
  assert.equal("value" in stripped.variables.s1, false);
  assert.equal(stripped.variables.v1.value, "visible");
});

// --- trigger operator equality (custom-event matching) ---
test("triggerFiresOnCustomEvent requires the Eq operator, not just match/value", () => {
  const withEq = { loadRules: [{ id: "r", match: "custom_event_name", op: "Eq", value: "promo_click" }] };
  assert.ok(triggerFiresOnCustomEvent(withEq, "promo_click"));

  const missingOp = { loadRules: [{ id: "r", match: "custom_event_name", value: "promo_click" }] };
  assert.ok(!triggerFiresOnCustomEvent(missingOp, "promo_click"), "missing op must not match");

  const wrongOp = { loadRules: [{ id: "r", match: "custom_event_name", op: "Neq", value: "promo_click" }] };
  assert.ok(!triggerFiresOnCustomEvent(wrongOp, "promo_click"), "non-Eq op must not match");
});

test("triggerFiresOnCustomEvent rejects a trigger whose exclude rules suppress the target event", () => {
  const suppressed = {
    loadRules: [{ id: "r", match: "custom_event_name", op: "Eq", value: "promo_click" }],
    excludeRules: [{ id: "rx", match: "custom_event_name", op: "Eq", value: "promo_click" }]
  };
  assert.ok(!triggerFiresOnCustomEvent(suppressed, "promo_click"), "an exclude rule for the target event makes the trigger invalid");
});

test("ANY exclude rule makes a managed trigger non-converged, regardless of the matched field", () => {
  // A managed trigger must forward the event unconditionally. An exclude rule
  // matching a different field (e.g. page_path) can still suppress the event in
  // some contexts, so a non-empty excludeRules is never converged.
  const pagePathExclude = {
    loadRules: [{ id: "r", match: "custom_event_name", op: "Eq", value: "promo_click" }],
    excludeRules: [{ id: "rx", match: "page_path", op: "Eq", value: "/stay-d" }]
  };
  assert.ok(!triggerFiresOnCustomEvent(pagePathExclude, "promo_click"), "a page_path exclude rule still makes the trigger invalid");

  const otherEventExclude = {
    loadRules: [{ id: "r", match: "custom_event_name", op: "Eq", value: "promo_click" }],
    excludeRules: [{ id: "rx", match: "custom_event_name", op: "Eq", value: "page_view" }]
  };
  assert.ok(!triggerFiresOnCustomEvent(otherEventExclude, "promo_click"), "ANY exclude rule makes the trigger non-converged");
});

test("a trigger with a page_path exclude rule yields TRIGGER_MISSING in the diff", () => {
  const cfg = convergedConfig();
  cfg.triggers["trg-promo-click"].excludeRules = [
    { id: "rx", match: "page_path", op: "Eq", value: "/stay-d" }
  ];
  const findings = zarazDesiredDiff(cfg, MEASUREMENT_ID);
  assert.ok(findings.some((f) => f.code === "TRIGGER_MISSING" && f.event === "promo_click"));
});

test("triggerFiresOnCustomEvent requires EXACTLY one load rule for the target event", () => {
  // A trigger with the correct rule PLUS an extra rule is over-constrained or
  // over-broad and must not be treated as an exact event trigger.
  const extraRule = {
    loadRules: [
      { id: "r1", match: "custom_event_name", op: "Eq", value: "promo_click" },
      { id: "r2", match: "custom_event_name", op: "Eq", value: "page_view" }
    ],
    excludeRules: []
  };
  assert.ok(!triggerFiresOnCustomEvent(extraRule, "promo_click"), "extra load rules make the trigger non-converged");

  // Zero rules is also not exact.
  const empty = { loadRules: [], excludeRules: [] };
  assert.ok(!triggerFiresOnCustomEvent(empty, "promo_click"));
});

test("a trigger that suppresses the target event yields TRIGGER_MISSING in the diff", () => {
  const cfg = convergedConfig();
  cfg.triggers["trg-promo-click"].excludeRules = [
    { id: "rx", match: "custom_event_name", op: "Eq", value: "promo_click" }
  ];
  const findings = zarazDesiredDiff(cfg, MEASUREMENT_ID);
  assert.ok(findings.some((f) => f.code === "TRIGGER_MISSING" && f.event === "promo_click"));
});

// --- exactly one GA4 tool ---
test("multiple GA4 tools is a blocking finding, never silently converged", () => {
  const cfg = convergedConfig();
  cfg.tools.ga4second = structuredClone(cfg.tools.ga4);
  const findings = zarazDesiredDiff(cfg, MEASUREMENT_ID);
  assert.ok(findings.some((f) => f.code === "GA4_TOOL_DUPLICATE"), "two GA4 tools must be blocking");
});

test("build on a config with multiple GA4 tools surfaces a blocking finding instead of picking the first", () => {
  const cfg = convergedConfig();
  cfg.tools.ga4second = structuredClone(cfg.tools.ga4);
  const { findings } = buildZarazDesiredConfig(cfg, { measurementId: MEASUREMENT_ID });
  assert.ok(findings.some((f) => f.code === "GA4_TOOL_DUPLICATE" && f.severity === "blocking"));
});

// --- exactly one track action per forwarded event ---
test("duplicate track action for the same event is a blocking finding", () => {
  const cfg = convergedConfig();
  cfg.tools.ga4.actions["act-promo-click-2"] = structuredClone(
    cfg.tools.ga4.actions["act-promo-click"]
  );
  const findings = zarazDesiredDiff(cfg, MEASUREMENT_ID);
  const dup = findings.find((f) => f.code === "TRACK_ACTION_DUPLICATE");
  assert.ok(dup, "duplicate forwarding actions must be blocking");
  assert.equal(dup.event, "promo_click");
});

test("build on a config with a duplicate track action surfaces a blocking finding", () => {
  const cfg = convergedConfig();
  cfg.tools.ga4.actions["act-promo-click-2"] = structuredClone(
    cfg.tools.ga4.actions["act-promo-click"]
  );
  const { findings } = buildZarazDesiredConfig(cfg, { measurementId: MEASUREMENT_ID });
  assert.ok(findings.some((f) => f.code === "TRACK_ACTION_DUPLICATE" && f.severity === "blocking"));
});

// --- action blockingTriggers ---
test("a track action with non-empty blockingTriggers does not satisfy forwarding", () => {
  const cfg = convergedConfig();
  cfg.tools.ga4.actions["act-promo-click"].blockingTriggers = ["trg-any-exclusion"];
  const findings = zarazDesiredDiff(cfg, MEASUREMENT_ID);
  assert.ok(
    findings.some((f) => f.code === "TRACK_ACTION_MISSING" && f.event === "promo_click"),
    "an action that can be blocked must be treated as missing"
  );
});

test("build reconciles an action that is blocked by non-empty blockingTriggers", () => {
  const cfg = convergedConfig();
  cfg.tools.ga4.actions["act-promo-click"].blockingTriggers = ["trg-any-exclusion"];
  const { config, mutations } = buildZarazDesiredConfig(cfg, { measurementId: MEASUREMENT_ID });
  const candidates = Object.values(config.tools.ga4.actions).filter(
    (a) => a.actionType === "track" && a.data?.en === "promo_click"
  );
  assert.ok(candidates.some((a) => (a.blockingTriggers ?? []).length === 0), "an unconditional action is created");
  assert.ok(mutations.some((m) => m.code === "TRACK_ACTION_ADDED" && m.event === "promo_click"));
});

// --- wrong-wired same-name actions ---
function miswiredPromoClick() {
  return {
    actionType: "track",
    data: { en: "promo_click" },
    firingTriggers: ["trg-page-view"],
    blockingTriggers: []
  };
}

test("a same-name action wired to another trigger is a blocking finding", () => {
  const cfg = convergedConfig();
  cfg.tools.ga4.actions["act-promo-miswired"] = miswiredPromoClick();
  const findings = zarazDesiredDiff(cfg, MEASUREMENT_ID);
  const f = findings.find((x) => x.code === "TRACK_ACTION_MISWIRED");
  assert.ok(f, "a miswired same-name action must be blocking");
  assert.equal(f.event, "promo_click");
});

test("a same-name action with blocking wiring is a blocking finding", () => {
  const cfg = convergedConfig();
  cfg.tools.ga4.actions["act-promo-miswired"] = {
    actionType: "track",
    data: { en: "promo_click" },
    firingTriggers: ["trg-promo-click"],
    blockingTriggers: ["trg-any-exclusion"]
  };
  const findings = zarazDesiredDiff(cfg, MEASUREMENT_ID);
  assert.ok(findings.some((f) => f.code === "TRACK_ACTION_MISWIRED" && f.event === "promo_click"));
});

test("build removes a miswired same-name action so no false event can be emitted", () => {
  const cfg = convergedConfig();
  cfg.tools.ga4.actions["act-promo-miswired"] = miswiredPromoClick();
  const { config, mutations } = buildZarazDesiredConfig(cfg, { measurementId: MEASUREMENT_ID });
  const promoActions = Object.values(config.tools.ga4.actions).filter(
    (a) => a.actionType === "track" && a.data?.en === "promo_click"
  );
  assert.equal(promoActions.length, 1, "only the correctly-wired promo_click action remains");
  assert.deepEqual(promoActions[0].firingTriggers, ["trg-promo-click"]);
  assert.ok(mutations.some((m) => m.code === "TRACK_ACTION_MISWIRED_REMOVED" && m.event === "promo_click"));
});

// --- automatic pageview: only demonstrable page_view emission is removed ---
test("build preserves a non-page_view track action on the pageload system trigger", () => {
  const cfg = convergedConfig();
  cfg.tools.ga4.actions["act-login-impression"] = {
    actionType: "track",
    data: { en: "login_impression" },
    firingTriggers: ["trg-page-load"],
    blockingTriggers: []
  };
  cfg.triggers["trg-page-load"] = {
    name: "pageload",
    system: "pageload",
    loadRules: [],
    excludeRules: []
  };
  const { config, mutations } = buildZarazDesiredConfig(cfg, { measurementId: MEASUREMENT_ID });
  assert.ok(
    config.tools.ga4.actions["act-login-impression"],
    "a login_impression track action on pageload is NOT an automatic page view and must survive"
  );
  assert.ok(
    !mutations.some((m) => m.code === "AUTO_PAGEVIEW_REMOVED" && m.id === "act-login-impression"),
    "the unrelated pageload action is never removed"
  );
});

test("automaticPageviewActive detects only demonstrable page_view emission", () => {
  // actionType === pageview is an automatic page view
  const pageviewCfg = convergedConfig();
  pageviewCfg.tools.ga4.actions["act-pv"] = { actionType: "pageview", data: {}, firingTriggers: [], blockingTriggers: [] };
  assert.ok(automaticPageviewActive(pageviewCfg));

  // a track action forwarding page_view on a pageload system trigger is one too
  const trackPvCfg = convergedConfig();
  trackPvCfg.tools.ga4.actions["act-track-pv"] = {
    actionType: "track",
    data: { en: "page_view" },
    firingTriggers: ["trg-page-load"],
    blockingTriggers: []
  };
  trackPvCfg.triggers["trg-page-load"] = { name: "pageload", system: "pageload", loadRules: [], excludeRules: [] };
  assert.ok(automaticPageviewActive(trackPvCfg));

  // a login_impression track action on pageload is NOT an automatic page view
  const loginCfg = convergedConfig();
  loginCfg.tools.ga4.actions["act-login"] = {
    actionType: "track",
    data: { en: "login_impression" },
    firingTriggers: ["trg-page-load"],
    blockingTriggers: []
  };
  loginCfg.triggers["trg-page-load"] = { name: "pageload", system: "pageload", loadRules: [], excludeRules: [] };
  assert.ok(!automaticPageviewActive(loginCfg));
});

// --- over-wiring: an action must bind EXACTLY the expected trigger ---
test("a same-name action over-wired to an extra trigger is blocking", () => {
  const cfg = convergedConfig();
  cfg.tools.ga4.actions["act-promo-click"].firingTriggers = ["trg-promo-click", "trg-page-view"];
  const findings = zarazDesiredDiff(cfg, MEASUREMENT_ID);
  const f = findings.find((x) => x.code === "TRACK_ACTION_MISWIRED");
  assert.ok(f, "an over-wired action (expected trigger + extra) must be blocking");
  assert.equal(f.event, "promo_click");
});

// --- GA4 tool-level blockingTriggers ---
test("a reused GA4 tool with non-empty blockingTriggers is not converged", () => {
  const cfg = convergedConfig();
  cfg.tools.ga4.blockingTriggers = ["trg-something"];
  const findings = zarazDesiredDiff(cfg, MEASUREMENT_ID);
  assert.ok(findings.some((f) => f.code === "GA4_TOOL_BLOCKING_TRIGGERS"), "tool-level blocking wiring is not converged");
});

test("build surfaces a blocking finding for a reused tool with non-empty blockingTriggers (does not delete)", () => {
  const cfg = convergedConfig();
  cfg.tools.ga4.blockingTriggers = ["trg-something"];
  const { config, findings } = buildZarazDesiredConfig(cfg, { measurementId: MEASUREMENT_ID });
  assert.ok(
    findings.some((f) => f.code === "GA4_TOOL_BLOCKING_TRIGGERS" && f.severity === "blocking"),
    "reused tool blocking wiring is a blocking finding"
  );
  assert.deepEqual(
    config.tools.ga4.blockingTriggers,
    ["trg-something"],
    "unrelated blocking logic is preserved, not silently deleted"
  );
});

// --- GA4 tool permissions ---
test("missing GA4 permissions is a blocking finding", () => {
  const cfg = convergedConfig();
  cfg.tools.ga4.permissions = ["access_client_kv"]; // missing server_network_requests
  const findings = zarazDesiredDiff(cfg, MEASUREMENT_ID);
  assert.ok(findings.some((f) => f.code === "GA4_TOOL_MISSING_PERMISSIONS"));
});

test("build reconciles missing GA4 permissions on an existing tool", () => {
  const cfg = convergedConfig();
  cfg.tools.ga4.permissions = ["access_client_kv"];
  const { config, mutations } = buildZarazDesiredConfig(cfg, { measurementId: MEASUREMENT_ID });
  assert.ok(config.tools.ga4.permissions.includes("server_network_requests"));
  assert.ok(mutations.some((m) => m.code === "GA4_TOOL_PERMISSIONS_ADDED"));
});
