// ops/analytics bin/smoke — automated production verification for #745.
//
// Verifies, in order:
//   1. Zaraz is actually injected on jabiko.app (no credentials).
//   2. The GA4 property is discoverable and yields a Measurement ID (Google).
//   3. The Zaraz config has the GA4 tool, triggers, actions, and no automatic
//      page view (needs Zone:Zaraz Read).
//   4. The GA4 custom dimensions exist (needs Google access).
//   5. Real traffic: the operator performs one guided set of Stay.D clicks
//      (HUMAN_GATE:PRODUCTION_INTERACTION) while this script watches GA4
//      Realtime and verifies every expected event + parameter arrives from ONE
//      newly observed session.
//
// Any failed step produces a non-zero exit code.

import { pathToFileURL } from "node:url";
import { ZONE_NAME, analyzeZaraz, zarazDesiredDiff, ga4DesiredDiff } from "../desired.mjs";
import { resolveCloudflareAuth } from "../creds.mjs";
import { findZone, cfRequest, zarazConfigUrl } from "../cf.mjs";
import { googleTokenFromEnv, listCustomDimensions, runRealtimeReport } from "../ga4.mjs";
import {
  PLACEMENT_ACTION,
  computeSmokeState,
  verifySmokeState,
  smokeTargetReached
} from "../smokelogic.mjs";
import { probeProductionZaraz } from "../production.mjs";
import { parseFlags, discoverGa4 } from "./cliutil.mjs";
import * as report from "../report.mjs";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const RICH_DIMS = [
  "eventName",
  "sessionId",
  "pagePath",
  "customEvent:promoId",
  "customEvent:action",
  "customEvent:placement",
  "customEvent:locale"
];
const REQUIRED_PLACEMENTS = Object.keys(PLACEMENT_ACTION);

/**
 * Run the full smoke sequence. `env`, `watchSeconds` and `pollIntervalMs` are
 * injectable for tests. Sets process.exitCode (1 on any failure) and returns a
 * structured result.
 */
export async function runSmoke({
  env = process.env,
  watchSeconds = 300,
  pollIntervalMs = 10000
} = {}) {
  const measurementIdFlag = parseFlags(process.argv.slice(2))["measurement-id"];
  let failed = false;
  const gates = [];
  let propertyId = null;
  let propertyName = null;
  let measurementId = measurementIdFlag;
  let dimDiff = null;
  let configFindings = [];
  let apiError = null;
  let state = {
    guidedSession: null,
    pageViews: 0,
    stayDViews: 0,
    placements: new Map()
  };
  let failures = [];

  report.section(`Jabiko #745 production smoke · ${ZONE_NAME}`);
  // 1. Production observable state (no auth).
  report.sub("1. Zaraz injection on production");
  const probe = await probeProductionZaraz();
  for (const d of probe.details) report.bullet(d);
  if (!probe.injected) {
    report.err("Zaraz is not injected on jabiko.app — the #745 pipeline cannot be live.");
    report.warn("Run ./ops/analytics/bin/plan then ./ops/analytics/bin/apply once credentials are available.");
    failed = true;
  } else {
    report.ok("Zaraz is live on production.");
  }

  // 2. GA4 property discovery (needed for the Measurement ID + Realtime).
  let googleToken = null;
  if (!failed) {
    report.sub("2. GA4 property discovery");
    googleToken = await googleTokenFromEnv(env);
    if (!googleToken) {
      report.printGate("GOOGLE_OAUTH", "smoke steps 2, 4 and 5 need Google Analytics access.");
      gates.push("GOOGLE_OAUTH");
      failed = true;
    } else {
      try {
        const d = await discoverGa4({ token: googleToken });
        if (!d.property) {
          report.err("no unique Jabiko GA4 property — cannot run smoke.");
          failed = true;
        } else {
          propertyName = d.property.name;
          propertyId = d.property.name.replace("properties/", "");
          measurementId = measurementId || d.measurementId;
          report.ok(`property ${d.property.displayName} (id ${propertyId})${d.measurementId ? `, Measurement ID ${d.measurementId}` : ""}`);
        }
      } catch (e) {
        report.err(`GA4 discovery failed: ${e.message}`);
        failed = true;
      }
    }
  }

  // 3. Zaraz config (needs Zone:Zaraz Read).
  if (!failed) {
    report.sub("3. Zaraz config");
    const cfAuth = resolveCloudflareAuth({ env });
    if (!cfAuth || !cfAuth.capabilities.includes("zarazRead")) {
      report.printGate("CLOUDFLARE_AUTH", "smoke step 3 needs Zone:Zaraz Read.");
      gates.push("CLOUDFLARE_AUTH");
      failed = true;
    } else {
      const zone = await findZone({ token: cfAuth.token, name: ZONE_NAME }).catch(() => null);
      if (!zone) {
        report.err(`zone ${ZONE_NAME} not found.`);
        failed = true;
      } else {
        try {
          const config = await cfRequest({ token: cfAuth.token, path: zarazConfigUrl(zone.id) });
          const a = analyzeZaraz(config);
          report.bullet(`${a.ga4Tools.length} GA4 tool(s), ${a.triggers.length} trigger(s), autoInject=${a.autoInject}`);
          configFindings = zarazDesiredDiff(config, measurementId);
          report.printFindings(configFindings);
          if (configFindings.some((f) => f.severity === "blocking")) {
            report.warn("Zaraz config is not converged — run ./ops/analytics/bin/apply first.");
            failed = true;
          }
        } catch (e) {
          report.err(`cannot read Zaraz config: ${e.message}`);
          failed = true;
        }
      }
    }
  }

  // 4. GA4 custom dimensions.
  if (!failed) {
    report.sub("4. GA4 custom dimensions");
    try {
      const dims = await listCustomDimensions({ token: googleToken, property: propertyName });
      dimDiff = ga4DesiredDiff(propertyName, dims);
      report.bullet(`${dimDiff.missing.length} missing, ${dimDiff.present.length} present, ${dimDiff.conflicts.length} conflicting`);
      if (dimDiff.missing.length) {
        report.warn("run ./ops/analytics/bin/apply to create the missing custom dimensions; the realtime watch cannot fully read the promo params.");
        failed = true;
      }
    } catch (e) {
      report.err(`GA4 custom-dimension check failed: ${e.message}`);
      failed = true;
    }
  }

  // 5. Real traffic watch + verification.
  if (!failed) {
    report.sub("5. Real traffic verification (GA4 Realtime)");
    report.printGate(
      "PRODUCTION_INTERACTION",
      `Watch window: ${watchSeconds}s. Perform the guided clicks below exactly once in a fresh browser tab.`
    );
    report.bullet("Guided clicks (exactly once, in order):");
    report.bullet("  1. Open https://jabiko.app/ → wait for Home to render (one page_view).");
    report.bullet("  2. Click the direct Airbnb CTA on Home  (placement home-airbnb).");
    report.bullet("  3. Open the Home video               (placement home-video).");
    report.bullet("  4. Click the Airbnb CTA under the video (placement home-video-airbnb).");
    report.bullet("  5. Navigate to https://jabiko.app/stay-d → wait for the page (page_view /stay-d).");
    report.bullet("  6. Click the hero Airbnb CTA         (placement stay-d-hero-airbnb).");
    report.bullet("  7. Open the /stay-d video            (placement stay-d-video).");
    report.bullet("  8. Click the video-section Airbnb CTA (placement stay-d-video-airbnb).");
    report.bullet("  9. Click the final Airbnb CTA        (placement stay-d-final-airbnb).");
    report.bullet("That is the whole interaction. The script verifies backend arrival automatically.");

    // Baseline: sessions already present before the guided interaction. A
    // failed baseline must NOT degrade to an empty baseline — retry boundedly,
    // then fail closed (otherwise unrelated recent traffic would be counted).
    let baselineSessions = new Set();
    let baselineOk = false;
    for (let attempt = 0; attempt < 3 && !baselineOk; attempt += 1) {
      try {
        const baselineRows = await runRealtimeReport({
          token: googleToken,
          propertyId,
          dimensions: ["sessionId"],
          minutes: 60
        });
        baselineSessions = new Set(baselineRows.map((r) => r.sessionId).filter(Boolean));
        baselineOk = true;
      } catch (e) {
        report.warn(`baseline realtime read failed (attempt ${attempt + 1}/3): ${e.message}`);
        if (attempt < 2) await sleep(pollIntervalMs);
      }
    }
    if (!baselineOk) {
      report.err("baseline realtime read failed after retries — aborting smoke (cannot isolate the guided session).");
      failed = true;
    }

    if (baselineOk) {
      const deadline = Date.now() + watchSeconds * 1000;
      while (Date.now() < deadline) {
        let rows = [];
        try {
          rows = await runRealtimeReport({ token: googleToken, propertyId, dimensions: RICH_DIMS, minutes: 60 });
          apiError = null;
        } catch (e) {
          if (/not a valid dimension|customEvent/i.test(e.message)) {
            report.err(`custom event dimensions are not queryable: ${e.message}`);
            report.err("failing smoke: a degraded mode cannot verify the seven placements/action parameters.");
            failed = true;
            break;
          }
          apiError = e.message;
          report.warn(`realtime poll failed: ${e.message}`);
          await sleep(pollIntervalMs);
          continue;
        }
        state = computeSmokeState({ rows, baselineSessions });
        const covered = state.placements.size;
        report.bullet(`watch t-${Math.max(0, Math.ceil((deadline - Date.now()) / 1000))}s · page_view=${state.pageViews} · placements ${covered}/${REQUIRED_PLACEMENTS.length}${state.guidedSession ? ` · session=${state.guidedSession.slice(0, 8)}…` : ""}`);
        if (smokeTargetReached({ ...state, useRichDims: true })) break;
        await sleep(pollIntervalMs);
      }
    }

    // Verification results.
    report.sub("Verification results");
    report.bullet(`guided session: ${state.guidedSession ? state.guidedSession.slice(0, 8) + "…" : "(none observed)"}`);
    report.bullet(`page_view events: ${state.pageViews} (expected ≥ 2 for Home + /stay-d in the guided sequence)`);
    report.bullet(`page_view with pagePath /stay-d: ${state.stayDViews} (expected ≥ 1)`);
    for (const placement of REQUIRED_PLACEMENTS) {
      const seen = state.placements.get(placement);
      const expectedAction = PLACEMENT_ACTION[placement];
      if (!seen) {
        report.err(`missing promo_click for ${placement}`);
        continue;
      }
      if (seen.action === expectedAction && seen.promoId === "stay-d" && seen.locale) {
        report.ok(`${placement} → action=${seen.action} promoId=${seen.promoId} locale=${seen.locale}`);
      } else {
        report.err(`${placement} → action=${seen.action ?? "?"} expected ${expectedAction}, promoId=${seen.promoId ?? "?"}, locale=${seen.locale ?? "?"}`);
      }
    }
    if (apiError) report.warn(`realtime API issue: ${apiError}`);

    const verification = verifySmokeState({ ...state, useRichDims: true });
    failures = verification.failures;
    for (const f of failures) report.err(f);
    if (failures.length) failed = true;
    report.bullet(verification.ok ? "SMOKE RESULT: PASS" : "SMOKE RESULT: FAIL");
  } else {
    report.warn("Skipping the realtime watch because an earlier step failed.");
  }

  return {
    exitCode: failed ? 1 : 0,
    failed,
    gates,
    guidedSession: state.guidedSession,
    pageViews: state.pageViews,
    stayDViews: state.stayDViews,
    placements: [...state.placements.entries()],
    failures,
    configFindings
  };
}

// CLI entry (only when executed directly, not when imported by a test).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = await runSmoke();
  process.exitCode = result.exitCode;
}
