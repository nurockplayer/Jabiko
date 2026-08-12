// ops/analytics — #745 desired-state model and diff logic (pure, unit-tested).
//
// The single source of truth for "what production analytics should look like":
// the forwarded custom events, the promo_click contract, the GA4 managed tool
// wiring, and the event-scoped custom dimensions. plan/apply/smoke all share
// this module so a desired-state change is edited once.

import desiredJson from "../config/desired.json" with { type: "json" };

// ---------------------------------------------------------------------------
// Desired contract (#745)
// ---------------------------------------------------------------------------

export const ZONE_NAME = desiredJson.zoneName;
export const FORWARDED_EVENTS = desiredJson.forwardedEvents;
export const PROMO_PARAMS = desiredJson.promoClick.params;
export const PROMO_ACTIONS = desiredJson.promoClick.actions;
export const PROMO_PLACEMENTS = desiredJson.promoClick.placements;
export const GA4_COMPONENT = desiredJson.ga4.component;
export const GA4_DIMENSIONS = desiredJson.ga4.customDimensions;

// Analytics clients forbidden by #745 ("no second analytics stack").
export const FORBIDDEN_ANALYTICS_COMPONENTS = new Set([
  "gtag",
  "google-tag-manager",
  "google-analytics-3",
  "google-analytics-ua",
  "segment",
  "amplitude",
  "mixpanel"
]);

// Managed component permissions required by google-analytics-4 (from its
// manifest: client KV + server network requests are required).
const GA4_PERMISSIONS = ["access_client_kv", "server_network_requests"];

// Custom-event trigger shape. Cloudflare's dashboard stores the "Event Name"
// match under `custom_event_name`; op values in real configs are short forms
// ("Eq"). plan probes the live config first and apply mirrors existing shapes
// when present, so these defaults are only used for a from-scratch build.
const CUSTOM_EVENT_MATCH = "custom_event_name";
const OP_EQ = "Eq";

// ---------------------------------------------------------------------------
// Zaraz config analysis
// ---------------------------------------------------------------------------

/** Flatten a Zaraz config into tools/triggers plus convenience subsets. */
export function analyzeZaraz(config = {}) {
  const tools = Object.entries(config.tools ?? {}).map(([id, t]) => ({
    id,
    name: t?.name ?? "(unnamed)",
    component: t?.component ?? null,
    enabled: t?.enabled ?? false,
    type: t?.type ?? null,
    settings: t?.settings ?? {},
    actions: t?.actions ?? {}
  }));
  const ga4Tools = tools.filter((t) => t.component === GA4_COMPONENT);
  const forbidden = tools.filter((t) =>
    FORBIDDEN_ANALYTICS_COMPONENTS.has(t.component)
  );
  const triggers = Object.entries(config.triggers ?? {}).map(([id, tr]) => ({
    id,
    ...tr
  }));
  const autoInject = config.settings?.autoInjectScript === true;
  return { tools, ga4Tools, forbidden, triggers, autoInject };
}

/** True when a trigger fires on a `zaraz.track(eventName, ...)` custom event. */
export function triggerFiresOnCustomEvent(trigger, eventName) {
  if (!trigger) return false;
  return (trigger.loadRules ?? []).some(
    (r) => r?.match === CUSTOM_EVENT_MATCH && String(r.value) === eventName
  );
}

function isAutomaticPageviewAction(config, action) {
  if (action?.actionType === "pageview") return true;
  const triggers = config.triggers ?? {};
  return (action?.firingTriggers ?? []).some(
    (tid) => (triggers[tid]?.system ?? "") === "pageload"
  );
}

/** True when the GA4 tool would emit an automatic page view on load. */
export function automaticPageviewActive(config = {}) {
  return analyzeZaraz(config).ga4Tools.some((tool) =>
    Object.values(tool.actions ?? {}).some((action) =>
      isAutomaticPageviewAction(config, action)
    )
  );
}

/** True when a track action on the GA4 tool forwards `eventName` to GA4. */
function hasTrackActionFor(config, tool, eventName) {
  const triggers = config.triggers ?? {};
  return Object.values(tool.actions ?? {}).some((action) => {
    if (action?.actionType !== "track") return false;
    if ((action?.data ?? {}).en !== eventName) return false;
    return (action?.firingTriggers ?? []).some((tid) =>
      triggerFiresOnCustomEvent(triggers[tid], eventName)
    );
  });
}

// ---------------------------------------------------------------------------
// Zaraz desired-state diff
// ---------------------------------------------------------------------------

/**
 * Read-only diff of a live Zaraz config against the #745 desired state.
 * Returns an array of findings; an empty array means "converged".
 */
export function zarazDesiredDiff(config, measurementId) {
  const findings = [];
  if (!measurementId) {
    findings.push({
      severity: "blocking",
      code: "MEASUREMENT_ID_UNSPECIFIED",
      message:
        "No GA4 Measurement ID is available. Resolve it via Google discovery or pass --measurement-id."
    });
    return findings;
  }
  const a = analyzeZaraz(config);
  if (a.autoInject !== true) {
    findings.push({
      severity: "blocking",
      code: "ZARAZ_AUTO_INJECT_OFF",
      message: "Zaraz auto-injection is off; the snippet will not load on jabiko.app."
    });
  }
  if (a.ga4Tools.length === 0) {
    findings.push({
      severity: "blocking",
      code: "GA4_TOOL_MISSING",
      message: "No Google Analytics 4 tool is configured in Zaraz."
    });
  } else {
    for (const t of a.ga4Tools) {
      if (!t.enabled) {
        findings.push({
          severity: "blocking",
          code: "GA4_TOOL_DISABLED",
          toolId: t.id
        });
      }
      if (t.settings.tid !== measurementId) {
        findings.push({
          severity: "blocking",
          code: "GA4_TOOL_TID_MISMATCH",
          toolId: t.id,
          actual: t.settings.tid ?? "(none)",
          expected: measurementId
        });
      }
      for (const ev of FORWARDED_EVENTS) {
        if (!hasTrackActionFor(config, t, ev)) {
          findings.push({
            severity: "blocking",
            code: "TRACK_ACTION_MISSING",
            event: ev,
            toolId: t.id
          });
        }
      }
    }
  }
  for (const ev of FORWARDED_EVENTS) {
    if (
      !Object.values(config.triggers ?? {}).some((tr) =>
        triggerFiresOnCustomEvent(tr, ev)
      )
    ) {
      findings.push({
        severity: "blocking",
        code: "TRIGGER_MISSING",
        event: ev
      });
    }
  }
  if (automaticPageviewActive(config)) {
    findings.push({
      severity: "blocking",
      code: "AUTO_PAGEVIEW_ACTIVE",
      message:
        "The GA4 tool has an automatic page view that would duplicate the explicit SPA page_view."
    });
  }
  for (const f of a.forbidden) {
    findings.push({
      severity: "blocking",
      code: "SECOND_ANALYTICS_CLIENT",
      component: f.component,
      message: `A second analytics client (${f.component}) is present; #745 forbids gtag/GTM/second analytics stacks.`
    });
  }
  return findings;
}

// ---------------------------------------------------------------------------
// Zaraz desired-config builder (apply)
// ---------------------------------------------------------------------------

function unusedId(obj, base) {
  if (!obj || !(base in obj)) return base;
  let i = 1;
  while (obj[`${base}-${i}`]) i += 1;
  return `${base}-${i}`;
}

function findTriggerIdFor(config, eventName) {
  const entry = Object.entries(config.triggers ?? {}).find(([, t]) =>
    triggerFiresOnCustomEvent(t, eventName)
  );
  return entry ? entry[0] : null;
}

/** Human-readable id for a generated entity keyed by event name. */
function idFor(prefix, eventName) {
  return `${prefix}-${eventName.replaceAll("_", "-")}`;
}

/**
 * Build the minimal mutated config that satisfies the desired state.
 * Idempotent: applying to an already-converged config returns it unchanged.
 * Never deletes unrelated config. gtag/GTM removal only with removeForbidden.
 *
 * @returns {{ config: object, mutations: object[], findings: object[] }}
 */
export function buildZarazDesiredConfig(
  config,
  { measurementId, autoInject = true, removeForbidden = false } = {}
) {
  const out = structuredClone(config);
  const mutations = [];
  const findings = [];

  if (!measurementId) {
    findings.push({
      severity: "blocking",
      code: "MEASUREMENT_ID_UNSPECIFIED",
      message: "Cannot build the desired config without a Measurement ID."
    });
    return { config: out, mutations, findings };
  }

  if (!out.settings) out.settings = {};
  if (autoInject && out.settings.autoInjectScript !== true) {
    out.settings.autoInjectScript = true;
    mutations.push({
      code: "ZARAZ_AUTO_INJECT_ON",
      message: "Enabled Zaraz automatic script injection."
    });
  }

  // Custom-event triggers for every forwarded event.
  out.triggers = out.triggers ?? {};
  for (const ev of FORWARDED_EVENTS) {
    if (
      Object.values(out.triggers).some((t) => triggerFiresOnCustomEvent(t, ev))
    ) {
      continue;
    }
    const id = unusedId(out.triggers, idFor("trg", ev));
    out.triggers[id] = {
      name: `Jabiko ${ev}`,
      loadRules: [
        { id: idFor("rule", ev), match: CUSTOM_EVENT_MATCH, op: OP_EQ, value: ev }
      ],
      excludeRules: []
    };
    mutations.push({ code: "TRIGGER_ADDED", event: ev, id });
  }

  // GA4 tool.
  const ga4Tools = analyzeZaraz(out).ga4Tools;
  let ga4ToolId = ga4Tools.length ? ga4Tools[0].id : null;
  if (!ga4ToolId) {
    out.tools = out.tools ?? {};
    ga4ToolId = unusedId(out.tools, "ga4");
    out.tools[ga4ToolId] = {
      component: GA4_COMPONENT,
      name: "Google Analytics 4",
      type: "component",
      enabled: true,
      settings: { tid: measurementId },
      permissions: GA4_PERMISSIONS,
      blockingTriggers: [],
      actions: {}
    };
    mutations.push({ code: "GA4_TOOL_ADDED", id: ga4ToolId });
  } else {
    const tool = out.tools[ga4ToolId];
    if (tool.settings?.tid !== measurementId) {
      tool.settings = { ...(tool.settings ?? {}), tid: measurementId };
      mutations.push({
        code: "GA4_TOOL_TID_SET",
        id: ga4ToolId,
        message: `Set GA4 tool Measurement ID to ${measurementId}.`
      });
    }
    if (tool.enabled !== true) {
      tool.enabled = true;
      mutations.push({ code: "GA4_TOOL_ENABLED", id: ga4ToolId });
    }
  }

  // One track action per forwarded event, firing on its trigger.
  const tool = out.tools[ga4ToolId];
  tool.actions = tool.actions ?? {};
  for (const ev of FORWARDED_EVENTS) {
    if (hasTrackActionFor(out, tool, ev)) continue;
    const triggerId = findTriggerIdFor(out, ev);
    if (!triggerId) continue;
    const id = unusedId(tool.actions, idFor("act", ev));
    tool.actions[id] = {
      actionType: "track",
      data: { en: ev },
      firingTriggers: [triggerId],
      blockingTriggers: []
    };
    mutations.push({ code: "TRACK_ACTION_ADDED", event: ev, id });
  }

  // Remove the automatic page-view action (duplicate page view guard).
  for (const [aid, action] of Object.entries(tool.actions)) {
    if (isAutomaticPageviewAction(out, action)) {
      delete tool.actions[aid];
      mutations.push({
        code: "AUTO_PAGEVIEW_REMOVED",
        id: aid,
        message:
          "Removed the automatic page-view action so one logical page_view per SPA navigation is kept."
      });
    }
  }

  // Second-analytics-client handling: never auto-delete; surface a finding.
  for (const f of analyzeZaraz(out).forbidden) {
    if (removeForbidden) {
      delete out.tools[f.id];
      mutations.push({
        code: "SECOND_ANALYTICS_CLIENT_REMOVED",
        component: f.component,
        id: f.id
      });
    } else {
      findings.push({
        severity: "blocking",
        code: "SECOND_ANALYTICS_CLIENT",
        component: f.component,
        message: `A second analytics client (${f.component}) is present. Pass --yes-remove-gtag to remove it.`
      });
    }
  }

  return { config: out, mutations, findings };
}

// ---------------------------------------------------------------------------
// GA4 custom-dimension diff
// ---------------------------------------------------------------------------

/**
 * Diff the event-scoped custom dimensions GA4 already has against the desired
 * four. `missing` can be created; `conflicts` cannot (a dimension with the
 * same parameterName already exists under a different scope).
 */
export function ga4DesiredDiff(property, existingDims = []) {
  const byParam = new Map(
    existingDims.map((d) => [d.parameterName, d])
  );
  const missing = GA4_DIMENSIONS.filter((d) => !byParam.has(d.parameterName));
  const present = GA4_DIMENSIONS.filter((d) => {
    const e = byParam.get(d.parameterName);
    return e && e.scope === "EVENT";
  });
  const conflicts = GA4_DIMENSIONS.filter((d) => {
    const e = byParam.get(d.parameterName);
    return e && e.scope !== "EVENT";
  }).map((d) => ({
    parameterName: d.parameterName,
    existingScope: byParam.get(d.parameterName).scope,
    desiredScope: "EVENT"
  }));
  return { property, missing, present, conflicts };
}

/** Properties that plausibly are the Jabiko production GA4 property. */
export function plausibleProductionProperties(properties = []) {
  return properties.filter((p) => {
    const displayName = String(p.displayName ?? "");
    const url = String(p.url ?? "");
    if (/test|staging|scratch|demo|sandbox/i.test(displayName)) return false;
    return /jabiko/i.test(displayName) || /jabiko\.app/i.test(url);
  });
}
