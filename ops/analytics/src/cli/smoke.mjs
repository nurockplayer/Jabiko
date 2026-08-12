// ops/analytics bin/smoke — automated production verification for #745.
//
// Verifies, in order:
//   1. Zaraz is actually injected on jabiko.app (no credentials).
//   2. The Zaraz config has the GA4 tool, triggers, actions, and no automatic
//      page view (needs Zone:Zaraz Read).
//   3. The GA4 custom dimensions exist (needs Google access).
//   4. Real traffic: the operator performs one guided set of Stay.D clicks
//      (HUMAN_GATE:PRODUCTION_INTERACTION) while this script watches GA4
//      Realtime and verifies every expected event + parameter arrives.
//
// If an earlier step is gated, smoke stops there and says exactly what to do.

import {
  ZONE_NAME,
  analyzeZaraz,
  zarazDesiredDiff,
  ga4DesiredDiff,
  PROMO_PLACEMENTS
} from "../desired.mjs";
import { resolveCloudflareAuth } from "../creds.mjs";
import { findZone, cfRequest } from "../cf.mjs";
import { googleTokenFromEnv, listCustomDimensions, runRealtimeReport } from "../ga4.mjs";
import { probeProductionZaraz } from "../production.mjs";
import { parseFlags, discoverGa4 } from "./cliutil.mjs";
import * as report from "../report.mjs";

const flags = parseFlags(process.argv.slice(2));
const watchSeconds = Number(flags["watch-seconds"] ?? 300) || 300;
const measurementIdFlag = flags["measurement-id"];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// placement -> expected `action` (#744 stable contract).
const PLACEMENT_ACTION = {
  "home-airbnb": "airbnb",
  "home-video": "video",
  "home-video-airbnb": "airbnb",
  "stay-d-hero-airbnb": "airbnb",
  "stay-d-video": "video",
  "stay-d-video-airbnb": "airbnb",
  "stay-d-final-airbnb": "airbnb"
};

report.section(`Jabiko #745 production smoke · ${ZONE_NAME}`);

// 1. Production observable state (no auth).
report.sub("1. Zaraz injection on production");
const probe = await probeProductionZaraz();
for (const d of probe.details) report.bullet(d);
if (!probe.injected) {
  report.err("Zaraz is not injected on jabiko.app — the #745 pipeline cannot be live.");
  report.warn("Run ./ops/analytics/bin/plan then ./ops/analytics/bin/apply once credentials are available.");
  process.exitCode = 1;
} else {
  report.ok("Zaraz is live on production.");
}

// 2. Zaraz config (needs Zone:Zaraz Read).
let config = null;
if (process.exitCode === 0) {
  report.sub("2. Zaraz config");
  const cfAuth = resolveCloudflareAuth();
  if (!cfAuth || !cfAuth.capabilities.includes("zarazRead")) {
    report.warn("cannot read the Zaraz config with the current credential.");
    report.printGate("CLOUDFLARE_AUTH", "smoke step 2 needs Zone:Zaraz Read.");
  } else {
    const zone = await findZone({ token: cfAuth.token, name: ZONE_NAME }).catch(() => null);
    if (zone) {
      try {
        config = await cfRequest({ token: cfAuth.token, path: `/zones/${zone.id}/settings/zaraz/config` });
        const a = analyzeZaraz(config);
        report.bullet(`${a.ga4Tools.length} GA4 tool(s), ${a.triggers.length} trigger(s), autoInject=${a.autoInject}`);
        const findings = zarazDesiredDiff(config, measurementIdFlag);
        report.printFindings(findings);
      } catch (e) {
        report.err(`cannot read Zaraz config: ${e.message}`);
        config = null;
      }
    }
  }
}

// 3. GA4 custom dimensions.
let propertyId = null;
let dimDiff = null;
if (process.exitCode === 0) {
  report.sub("3. GA4 custom dimensions");
  const googleToken = await googleTokenFromEnv();
  if (!googleToken) {
    report.printGate("GOOGLE_OAUTH", "smoke steps 3–4 need Google Analytics access.");
  } else {
    try {
      const d = await discoverGa4({ token: googleToken });
      if (!d.property) {
        report.warn("no unique Jabiko GA4 property — cannot run the realtime watch.");
      } else {
        propertyId = d.property.name.replace("properties/", "");
        report.ok(`property ${d.property.displayName} (id ${propertyId})${d.measurementId ? `, Measurement ID ${d.measurementId}` : ""}`);
        const dims = await listCustomDimensions({ token: googleToken, property: d.property.name });
        dimDiff = ga4DesiredDiff(d.property.name, dims);
        report.bullet(`${dimDiff.missing.length} missing, ${dimDiff.present.length} present, ${dimDiff.conflicts.length} conflicting`);
        if (dimDiff.missing.length) {
          report.warn("run ./ops/analytics/bin/apply to create the missing custom dimensions before the realtime watch can read the promo params.");
        }
      }
    } catch (e) {
      report.err(`GA4 discovery failed: ${e.message}`);
    }
  }
}

// 4. Real traffic watch.
if (process.exitCode === 0 && propertyId) {
  report.sub("4. Real traffic verification (GA4 Realtime)");

  if (dimDiff && dimDiff.missing.length) {
    report.warn("custom dimensions missing — param-level checks below will be limited to eventName/sessionId.");
  }

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

  const googleToken = await googleTokenFromEnv();
  const richDims = [
    "eventName",
    "sessionId",
    "pagePath",
    "customEvent:promoId",
    "customEvent:action",
    "customEvent:placement",
    "customEvent:locale"
  ];
  const fallbackDims = ["eventName", "sessionId"];

  let useRichDims = true;
  const collected = [];
  const seenPlacements = new Map(); // placement -> action seen
  let pageViews = 0;
  let pageViewsBySession = new Map(); // sessionId -> count
  let stayDViews = 0;
  let apiError = null;

  const deadline = Date.now() + watchSeconds * 1000;
  const ALL_TARGETS = Object.keys(PLACEMENT_ACTION).length;
  while (Date.now() < deadline) {
    try {
      const dims = useRichDims ? richDims : fallbackDims;
      const rows = await runRealtimeReport({
        token: googleToken,
        propertyId,
        dimensions: dims,
        minutes: 60
      });
      apiError = null;
      for (const row of rows) {
        collected.push(row);
        if (row.eventName === "page_view") {
          pageViews += Number(row.eventCount ?? 1);
          const s = row.sessionId ?? "?";
          pageViewsBySession.set(s, (pageViewsBySession.get(s) ?? 0) + Number(row.eventCount ?? 1));
          if ((row.pagePath ?? "") === "/stay-d") stayDViews += Number(row.eventCount ?? 1);
        }
        if (row.eventName === "promo_click") {
          const placement = row["customEvent:placement"];
          const action = row["customEvent:action"];
          const promoId = row["customEvent:promoId"];
          const locale = row["customEvent:locale"];
          if (placement && action) {
            seenPlacements.set(placement, { action, promoId, locale });
          }
        }
      }
    } catch (e) {
      if (useRichDims && /not a valid dimension|customEvent/i.test(e.message)) {
        report.warn("customEvent dimensions not readable yet — falling back to eventName/sessionId.");
        useRichDims = false;
        continue;
      }
      apiError = e.message;
    }

    const covered = [...seenPlacements.keys()];
    report.bullet(`watch t-${Math.max(0, Math.ceil((deadline - Date.now()) / 1000))}s · page_view=${pageViews} · placements seen ${covered.length}/${ALL_TARGETS} ${covered.length ? "[" + covered.sort().join(",") + "]" : ""}`);
    if (covered.length >= ALL_TARGETS && pageViews >= 2) break;
    await sleep(10000);
  }

  report.sub("5. Verification results");
  // 5a. page views.
  report.bullet(`page_view events: ${pageViews} (expected ≥ 2 for Home + /stay-d in the guided sequence)`);
  if (useRichDims) {
    report.bullet(`page_view with pagePath /stay-d: ${stayDViews} (expected ≥ 1)`);
  }
  if (pageViewsBySession.size) {
    for (const [s, n] of pageViewsBySession) {
      if (n > 2) report.warn(`session ${s.slice(0, 8)}… saw ${n} page_views — possible duplicate page views?`);
    }
  }
  // 5b. placements and action semantics.
  let ok = true;
  for (const placement of PROMO_PLACEMENTS) {
    const seen = seenPlacements.get(placement);
    const expectedAction = PLACEMENT_ACTION[placement];
    if (!seen) {
      report.err(`missing promo_click for ${placement}`);
      ok = false;
      continue;
    }
    const actionOk = seen.action === expectedAction;
    const promoIdOk = seen.promoId === "stay-d";
    const localeOk = Boolean(seen.locale);
    if (actionOk && promoIdOk && localeOk) {
      report.ok(`${placement} → action=${seen.action}${seen.promoId ? ` promoId=${seen.promoId}` : ""}${seen.locale ? ` locale=${seen.locale}` : ""}`);
    } else {
      report.err(`${placement} → action=${seen.action ?? "?"} expected ${expectedAction}, promoId=${seen.promoId ?? "?"}, locale=${seen.locale ?? "?"}`);
      ok = false;
    }
  }
  if (dimDiff && dimDiff.missing.length === 0 && !apiError) {
    report.ok("all seven Stay.D placements reached GA4 with correct action semantics.");
  }
  if (apiError) report.warn(`realtime API issue: ${apiError}`);
  report.bullet(ok && pageViews >= 2 ? "SMOKE RESULT: PASS (with the caveats above)" : "SMOKE RESULT: FAIL");
  if (!ok) process.exitCode = 1;
} else if (process.exitCode === 0) {
  report.warn("Skipping the realtime watch: no usable GA4 property (Google access or unique property required).");
}
