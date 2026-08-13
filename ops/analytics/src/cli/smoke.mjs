// ops/analytics bin/smoke — production verification for #745.
//
// Evidence is deliberately split by what the official APIs can prove:
//   1. Production HTML: Zaraz is injected.
//   2. Cloudflare Zaraz API: workflow is readable and the PUBLISHED /export
//      configuration contains the desired GA4 tool/triggers/actions.
//   3. GA4 Admin API: the required event-scoped custom dimensions exist.
//   4. GA4 Realtime: ONLY eventName + eventCount, within a 30-minute window,
//      proves recent page_view / promo_click events reached GA4.
//   5. One explicit human gate verifies the seven placement/action payloads in
//      Cloudflare Zaraz Debug Mode. Realtime never pretends it can query
//      sessionId, pagePath, or event-scoped customEvent:* dimensions.

import { pathToFileURL } from "node:url";
import { ZONE_NAME, analyzeZaraz, zarazDesiredDiff, ga4DesiredDiff } from "../desired.mjs";
import { resolveCloudflareAuth } from "../creds.mjs";
import {
  findZone,
  cfRequest,
  zarazExportUrl,
  zarazWorkflowUrl
} from "../cf.mjs";
import {
  googleTokenFromEnv,
  listCustomDimensions,
  runRealtimeReport,
  REALTIME_SMOKE_DIMENSIONS,
  STANDARD_REALTIME_MAX_MINUTES
} from "../ga4.mjs";
import { probeProductionZaraz } from "../production.mjs";
import { parseFlags, discoverGa4 } from "./cliutil.mjs";
import * as report from "../report.mjs";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const REQUIRED_EVENT_COUNTS = Object.freeze({ page_view: 2, promo_click: 7 });

export function summarizeRealtimeEvents(rows) {
  const counts = new Map();
  for (const row of rows) {
    if (!row?.eventName) continue;
    counts.set(row.eventName, (counts.get(row.eventName) ?? 0) + Number(row.eventCount ?? 0));
  }
  return counts;
}

export function realtimeSignalReached(counts) {
  return Object.entries(REQUIRED_EVENT_COUNTS).every(
    ([eventName, minimum]) => (counts.get(eventName) ?? 0) >= minimum
  );
}

export function realtimeDelta(current, baseline) {
  const delta = new Map();
  for (const eventName of Object.keys(REQUIRED_EVENT_COUNTS)) {
    delta.set(eventName, Math.max(0, (current.get(eventName) ?? 0) - (baseline.get(eventName) ?? 0)));
  }
  return delta;
}

function printGuidedInteraction() {
  report.bullet("Guided interaction (once, in a fresh production tab with Zaraz Debug Mode enabled):");
  report.bullet("  1. Open https://jabiko.app/ and let Home render.");
  report.bullet("  2. Click Home direct Airbnb CTA            (home-airbnb → airbnb).");
  report.bullet("  3. Open the Home video                    (home-video → video).");
  report.bullet("  4. Click Home video-section Airbnb CTA    (home-video-airbnb → airbnb).");
  report.bullet("  5. Open https://jabiko.app/stay-d and let the page render.");
  report.bullet("  6. Click /stay-d hero Airbnb CTA          (stay-d-hero-airbnb → airbnb).");
  report.bullet("  7. Open the /stay-d video                 (stay-d-video → video).");
  report.bullet("  8. Click /stay-d video-section Airbnb CTA (stay-d-video-airbnb → airbnb).");
  report.bullet("  9. Click /stay-d final Airbnb CTA         (stay-d-final-airbnb → airbnb).");
}

/**
 * Run the production smoke. Tests inject env/timing/flags only; no production
 * credential is ever needed by the test suite.
 */
export async function runSmoke({
  env = process.env,
  flags = {},
  watchSeconds = 300,
  pollIntervalMs = 10000
} = {}) {
  const measurementIdFlag = flags.measurementId;
  const placementActionVerified = flags.placementActionVerified === true;
  let failed = false;
  let gateBlocked = false;
  const gates = [];
  let propertyId = null;
  let propertyName = null;
  let measurementId = measurementIdFlag;
  let workflow = null;
  let configFindings = [];
  let eventCounts = new Map();
  let baselineCounts = new Map();
  let realtimeError = null;

  report.section(`Jabiko #745 production smoke · ${ZONE_NAME}`);

  report.sub("1. Zaraz injection on production");
  const probe = await probeProductionZaraz();
  for (const detail of probe.details) report.bullet(detail);
  if (!probe.injected) {
    report.err("Zaraz is not injected on jabiko.app — the #745 pipeline cannot be live.");
    failed = true;
  } else {
    report.ok("Zaraz is injected on production.");
  }

  let googleToken = null;
  if (!failed) {
    report.sub("2. GA4 property discovery");
    googleToken = await googleTokenFromEnv(env);
    if (!googleToken) {
      report.printGate("GOOGLE_OAUTH", "smoke needs Google Analytics Admin/Data read access.");
      gates.push("GOOGLE_OAUTH");
      gateBlocked = true;
    } else {
      try {
        const discovered = await discoverGa4({ token: googleToken });
        if (!discovered.property) {
          if ((discovered.candidates ?? []).length > 1) {
            report.printGate("GA4_PROPERTY_AMBIGUITY");
            gates.push("GA4_PROPERTY_AMBIGUITY");
            gateBlocked = true;
          } else {
            report.err("no unique Jabiko GA4 property — cannot run smoke.");
            failed = true;
          }
        } else {
          propertyName = discovered.property.name;
          propertyId = propertyName.replace("properties/", "");
          measurementId = measurementId || discovered.measurementId;
          if (!measurementId) {
            report.err("the selected GA4 property has no web Measurement ID.");
            failed = true;
          } else {
            report.ok(`property ${discovered.property.displayName} (id ${propertyId}), Measurement ID ${measurementId}`);
          }
        }
      } catch (error) {
        report.err(`GA4 discovery failed: ${error.message}`);
        failed = true;
      }
    }
  }

  if (!failed && !gateBlocked) {
    report.sub("3. Published Zaraz config + workflow");
    const cfAuth = resolveCloudflareAuth({ env });
    if (!cfAuth || !cfAuth.capabilities.includes("zarazRead")) {
      report.printGate("CLOUDFLARE_AUTH", "smoke needs Zaraz Read to verify the published production config.");
      gates.push("CLOUDFLARE_AUTH");
      gateBlocked = true;
    } else {
      try {
        const zone = await findZone({ token: cfAuth.token, name: ZONE_NAME });
        if (!zone) throw new Error(`zone ${ZONE_NAME} not found`);

        workflow = await cfRequest({ token: cfAuth.token, path: zarazWorkflowUrl(zone.id) });
        if (workflow !== "realtime" && workflow !== "preview") {
          throw new Error(`unexpected Zaraz workflow ${JSON.stringify(workflow)}`);
        }
        report.bullet(`workflow=${workflow}`);

        // /export is explicitly the current PUBLISHED configuration. /config
        // may be a newer preview and therefore cannot prove production state.
        const publishedConfig = await cfRequest({ token: cfAuth.token, path: zarazExportUrl(zone.id) });
        const analysis = analyzeZaraz(publishedConfig);
        report.bullet(`${analysis.ga4Tools.length} GA4 tool(s), ${analysis.triggers.length} trigger(s), autoInject=${analysis.autoInject}`);
        configFindings = zarazDesiredDiff(publishedConfig, measurementId);
        report.printFindings(configFindings);
        if (configFindings.some((finding) => finding.severity === "blocking")) {
          report.err("published Zaraz config is not converged; preview-only changes are not production success.");
          failed = true;
        } else {
          report.ok("published Zaraz configuration matches the desired production state.");
        }
      } catch (error) {
        report.err(`cannot verify Zaraz workflow/published config: ${error.message}`);
        report.err("fail closed: workflow lookup or published-state verification is required.");
        failed = true;
      }
    }
  }

  if (!failed && !gateBlocked) {
    report.sub("4. GA4 custom dimensions");
    try {
      const dimensions = await listCustomDimensions({ token: googleToken, property: propertyName });
      const diff = ga4DesiredDiff(propertyName, dimensions);
      report.bullet(`${diff.missing.length} missing, ${diff.present.length} present, ${diff.conflicts.length} conflicting`);
      if (diff.missing.length || diff.conflicts.length) {
        report.err("required event-scoped reporting dimensions are not fully registered.");
        failed = true;
      } else {
        report.ok("required event-scoped custom dimensions are registered.");
      }
    } catch (error) {
      report.err(`GA4 custom-dimension check failed: ${error.message}`);
      failed = true;
    }
  }

  if (!failed && !gateBlocked) {
    report.sub("5. Production traffic evidence");
    report.bullet(
      `Automated GA4 evidence is intentionally limited to ${REALTIME_SMOKE_DIMENSIONS.join(", ")} + eventCount over <=${STANDARD_REALTIME_MAX_MINUTES} minutes.`
    );
    report.bullet("It proves a new page_view / promo_click count delta during this watch, not session, route, placement, or action values.");

    try {
      const baselineRows = await runRealtimeReport({
        token: googleToken,
        propertyId,
        dimensions: REALTIME_SMOKE_DIMENSIONS,
        minutes: STANDARD_REALTIME_MAX_MINUTES
      });
      baselineCounts = summarizeRealtimeEvents(baselineRows);
      report.bullet(
        `baseline · page_view=${baselineCounts.get("page_view") ?? 0} · promo_click=${baselineCounts.get("promo_click") ?? 0}`
      );
    } catch (error) {
      report.err(`cannot establish GA4 Realtime baseline: ${error.message}`);
      failed = true;
    }

    if (!failed) {
      if (!placementActionVerified) {
        report.printGate(
          "PRODUCTION_INTERACTION",
          "Rerun with --placement-action-verified, enable Cloudflare Zaraz Debug Mode, then perform and inspect the printed guided interaction while the smoke watch is running."
        );
        gates.push("PRODUCTION_INTERACTION");
      } else {
        report.ok("operator attests the Zaraz Debug Mode placement/action verification will be completed during this guided watch.");
      }
      printGuidedInteraction();

      const deadline = Date.now() + Math.max(0, watchSeconds) * 1000;
      let firstPoll = true;
      do {
        try {
          const rows = await runRealtimeReport({
            token: googleToken,
            propertyId,
            dimensions: REALTIME_SMOKE_DIMENSIONS,
            minutes: STANDARD_REALTIME_MAX_MINUTES
          });
          const currentCounts = summarizeRealtimeEvents(rows);
          eventCounts = realtimeDelta(currentCounts, baselineCounts);
          realtimeError = null;
          report.bullet(
            `GA4 Realtime delta · page_view=+${eventCounts.get("page_view") ?? 0} · promo_click=+${eventCounts.get("promo_click") ?? 0}`
          );
          if (realtimeSignalReached(eventCounts)) break;
        } catch (error) {
          realtimeError = error.message;
          report.warn(`Realtime read failed: ${error.message}`);
        }
        firstPoll = false;
        if (Date.now() < deadline) await sleep(pollIntervalMs);
      } while (firstPoll || Date.now() < deadline);

      if (!realtimeSignalReached(eventCounts)) {
        report.err("GA4 Realtime did not show the required new page_view/promo_click count delta after the baseline.");
        if (realtimeError) report.warn(`last Realtime error: ${realtimeError}`);
        failed = true;
      } else {
        report.ok("GA4 Realtime shows a new page_view and promo_click count delta during the guided watch.");
      }
    }

    if (!placementActionVerified) {
      gateBlocked = true;
      report.warn("placement/action verification remains a deliberate human gate; automated success is not reported.");
    }
  } else {
    report.warn("Skipping production traffic evidence because an earlier prerequisite failed or is gated.");
  }

  const exitCode = failed ? 1 : gateBlocked ? 2 : 0;
  report.section("Smoke summary");
  if (exitCode === 0) report.ok("SMOKE RESULT: PASS");
  else if (gateBlocked && !failed) report.warn("SMOKE RESULT: HUMAN GATE REQUIRED");
  else report.err("SMOKE RESULT: FAIL");

  return {
    exitCode,
    failed,
    gateBlocked,
    gates,
    workflow,
    eventCounts: Object.fromEntries(eventCounts),
    baselineCounts: Object.fromEntries(baselineCounts),
    configFindings,
    placementActionVerified
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const parsed = parseFlags(process.argv.slice(2));
  const result = await runSmoke({
    flags: {
      measurementId: parsed["measurement-id"],
      placementActionVerified: parsed["placement-action-verified"] === true
    }
  });
  process.exitCode = result.exitCode;
}
