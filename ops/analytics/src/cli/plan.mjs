// ops/analytics bin/plan — read-only discovery + desired-state diff + gates.
// Never mutates anything.

import { pathToFileURL } from "node:url";
import { ZONE_NAME, zarazDesiredDiff, ga4DesiredDiff, analyzeZaraz } from "../desired.mjs";
import { resolveCloudflareAuth } from "../creds.mjs";
import { findZone, cfRequest, CfApiError, zarazConfigUrl } from "../cf.mjs";
import { googleTokenFromEnv, listCustomDimensions } from "../ga4.mjs";
import { probeProductionZaraz } from "../production.mjs";
import { parseFlags, discoverGa4, repoStaticChecks } from "./cliutil.mjs";
import * as report from "../report.mjs";

/**
 * Read-only plan. `env` and `repoRoot` are injectable for tests. Returns
 * { gatesHit, effectiveMeasurementId, zarazFindings, dimDiff }.
 *
 * The Zaraz desired-state diff is computed AFTER GA4 discovery so that a
 * Measurement ID discovered from Google is used to recompute the diff, rather
 * than reporting it with an unresolved (undefined) Measurement ID.
 */
export async function runPlan({
  env = process.env,
  repoRoot = process.env.REPO_ROOT || process.cwd()
} = {}) {
  const measurementIdFlag = parseFlags(process.argv.slice(2))["measurement-id"];
  const gatesHit = [];
  let config = null;
  let cfZone = null;
  let effectiveMeasurementId = measurementIdFlag;
  let zarazFindings = [];
  let dimDiff = null;

  report.section(`Jabiko #745 analytics plan (read-only) · zone ${ZONE_NAME}`);

  // 1. Repo contract (no credentials needed).
  report.sub("Repository contract");
  const repoFindings = await repoStaticChecks({ repoRoot });
  if (repoFindings.length) {
    report.printFindings(repoFindings);
  } else {
    report.ok("analytics contract present; no gtag/GTM in index.html; promo_click + page_view in src/lib/analytics.ts");
  }

  // 2. Production observable state (no credentials needed).
  report.sub("Production (jabiko.app, no auth)");
  const probe = await probeProductionZaraz();
  for (const d of probe.details) report.bullet(d);
  if (probe.injected) {
    report.ok("Zaraz script is injected on production.");
  } else {
    report.warn("Zaraz is NOT injected on production — the #745 pipeline is not live yet.");
  }

  // 3. Cloudflare account/zone discovery + read the live Zaraz config.
  report.sub("Cloudflare");
  const cfAuth = resolveCloudflareAuth({ env });
  if (!cfAuth) {
    report.printGate("CLOUDFLARE_AUTH");
    gatesHit.push("CLOUDFLARE_AUTH");
  } else {
    report.bullet(`auth source: ${cfAuth.source}`);
    cfZone = await findZone({ token: cfAuth.token, name: ZONE_NAME }).catch((e) => {
      report.err(`zone discovery failed: ${e.message}`);
      return null;
    });
    if (cfZone) {
      report.ok(`zone ${cfZone.name} (id ${cfZone.id}, account "${cfZone.accountName ?? "?"}")`);
    } else {
      report.warn(`zone ${ZONE_NAME} not found under the current credential.`);
    }

    if (cfAuth.capabilities.includes("zarazRead") && cfZone) {
      try {
        config = await cfRequest({ token: cfAuth.token, path: zarazConfigUrl(cfZone.id) });
        const a = analyzeZaraz(config);
        report.bullet(`${a.tools.length} tool(s), ${a.triggers.length} trigger(s); autoInject=${a.autoInject}`);
      } catch (e) {
        if (e instanceof CfApiError) {
          report.err(`cannot read Zaraz config: ${e.message}`);
          if (/auth|permission/i.test(e.message)) {
            report.printGate("CLOUDFLARE_AUTH", "Zaraz read requires a token with Zone:Zaraz Read.");
            gatesHit.push("CLOUDFLARE_AUTH");
          }
        } else {
          report.err(`cannot read Zaraz config: ${e.message}`);
        }
      }
    } else if (cfZone) {
      report.warn("Current credential cannot read the Zaraz config (needs Zone:Zaraz Read).");
      report.printGate("CLOUDFLARE_AUTH");
      gatesHit.push("CLOUDFLARE_AUTH");
    }
  }

  // 4. GA4 discovery (property, stream, Measurement ID, custom dimensions).
  report.sub("Google Analytics 4");
  const googleToken = await googleTokenFromEnv(env);
  if (!googleToken) {
    report.printGate("GOOGLE_OAUTH");
    gatesHit.push("GOOGLE_OAUTH");
  } else {
    try {
      const discovered = await discoverGa4({ token: googleToken });
      if (!discovered.property) {
        if (discovered.candidates.length === 0) {
          report.warn("No plausible Jabiko GA4 property found. Create one or pass --measurement-id.");
        } else {
          report.warn(`${discovered.candidates.length} plausible GA4 properties found — ambiguous.`);
          for (const c of discovered.candidates) {
            report.bullet(`${c.displayName} (${c.name})`);
          }
          report.printGate("GA4_PROPERTY_AMBIGUITY");
          gatesHit.push("GA4_PROPERTY_AMBIGUITY");
        }
      } else {
        report.ok(`property ${discovered.property.displayName} (${discovered.property.name})`);
        if (discovered.measurementId) {
          report.ok(`web stream Measurement ID ${discovered.measurementId}`);
        } else {
          report.warn("property has no web data stream with a Measurement ID.");
        }
        effectiveMeasurementId = measurementIdFlag || discovered.measurementId;
        const dims = await listCustomDimensions({ token: googleToken, property: discovered.property.name });
        dimDiff = ga4DesiredDiff(discovered.property.name, dims);
        report.bullet(`custom dimensions: ${dimDiff.missing.length} missing, ${dimDiff.present.length} present, ${dimDiff.conflicts.length} conflicting`);
        for (const m of dimDiff.missing) report.bullet(`create ${m.parameterName} (${m.scope})`);
        for (const c of dimDiff.conflicts) report.warn(`conflict: ${c.parameterName} exists as scope ${c.existingScope}, want ${c.desiredScope}`);
      }
    } catch (e) {
      report.err(`GA4 discovery failed: ${e.message}`);
      if (/permission|unauthorized|forbidden|invalid_grant/i.test(e.message)) {
        report.printGate("GOOGLE_OAUTH");
        gatesHit.push("GOOGLE_OAUTH");
      }
    }
  }

  // 5. Zaraz desired-state diff — computed now, using the Measurement ID
  //    resolved from --measurement-id or GA4 discovery.
  report.sub("Zaraz config vs #745 desired state");
  if (config) {
    zarazFindings = zarazDesiredDiff(config, effectiveMeasurementId);
    report.printFindings(zarazFindings, { prefix: "  " });
    if (!effectiveMeasurementId) {
      report.warn("Measurement ID could not be resolved; supply --measurement-id.");
    }
  } else {
    report.warn("Zaraz config was not read — diff unavailable.");
  }

  // 6. Summary.
  report.section("Plan summary");
  if (gatesHit.length === 0) {
    report.ok("No human gates required — full desired-state diff available above.");
  } else {
    report.bullet(`Gates hit: ${gatesHit.join(", ")}`);
    for (const g of gatesHit) report.printGate(g);
  }
  report.bullet("plan is read-only — nothing was mutated.");
  return { gatesHit, effectiveMeasurementId, zarazFindings, dimDiff };
}

// CLI entry (only when executed directly, not when imported by a test).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await runPlan();
}
