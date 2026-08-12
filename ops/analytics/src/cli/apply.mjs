// ops/analytics bin/apply — apply only the missing/incorrect #745 Zaraz + GA4
// configuration. Idempotent, snapshots the Zaraz config before mutation, and
// refuses to delete a second analytics client without --yes-remove-gtag.
//
// The mutation base is read from the Zaraz *export* endpoint (which includes
// secret variable values) so that a full-config PUT never clobbers unrelated
// secrets. It falls back to /config (secrets excluded) with a warning only
// when the export endpoint is unavailable.

import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import {
  buildZarazDesiredConfig,
  zarazDesiredDiff,
  ga4DesiredDiff,
  ZONE_NAME
} from "../desired.mjs";
import { resolveCloudflareAuth } from "../creds.mjs";
import { findZone, cfRequest, zarazConfigUrl, zarazExportUrl, zarazWorkflowUrl, zarazPublishUrl } from "../cf.mjs";
import { googleTokenFromEnv, listCustomDimensions, createCustomDimension } from "../ga4.mjs";
import { parseFlags, discoverGa4 } from "./cliutil.mjs";
import * as report from "../report.mjs";

const STATE_DIR = fileURLToPath(new URL("../../state", import.meta.url));

const flags = parseFlags(process.argv.slice(2));
const measurementIdFlag = flags["measurement-id"];
const dryRun = flags["dry-run"] === true;
const yesRemoveGtag = flags["yes-remove-gtag"] === true;

/** Idempotent GA4 custom-dimension reconciliation. dryRun only reports. */
async function reconcileGa4Dimensions({ googleToken, property, dryRun }) {
  const dims = await listCustomDimensions({ token: googleToken, property });
  const diff = ga4DesiredDiff(property, dims);
  if (diff.conflicts.length) {
    for (const c of diff.conflicts) {
      report.warn(`skip ${c.parameterName}: exists as scope ${c.existingScope} (want ${c.desiredScope})`);
    }
  }
  if (diff.missing.length === 0) {
    report.ok("all desired GA4 custom dimensions already present.");
    return;
  }
  for (const dim of diff.missing) {
    if (dryRun) {
      report.bullet(`would create custom dimension ${dim.parameterName}`);
    } else {
      try {
        await createCustomDimension({ token: googleToken, property, dimension: dim });
        report.ok(`created custom dimension ${dim.parameterName}`);
      } catch (e) {
        report.err(`failed to create ${dim.parameterName}: ${e.message}`);
      }
    }
  }
}

report.section(`Jabiko #745 analytics apply · zone ${ZONE_NAME}`);

// 1. Credential gate — Zaraz mutation requires an API token.
const cfAuth = resolveCloudflareAuth();
if (!cfAuth || !cfAuth.capabilities.includes("zarazEdit")) {
  report.err("apply requires CLOUDFLARE_API_TOKEN with Zone:Zaraz Edit (the wrangler OAuth token cannot mutate Zaraz).");
  report.printGate("CLOUDFLARE_AUTH");
  process.exitCode = 2;
} else {
  report.bullet(`auth source: ${cfAuth.source}`);

  const zone = await findZone({ token: cfAuth.token, name: ZONE_NAME });
  if (!zone) {
    report.err(`zone ${ZONE_NAME} not found.`);
    process.exitCode = 2;
  } else {
    report.ok(`zone ${zone.name} (id ${zone.id})`);

    // 2. Read current config — prefer /export so unrelated secret variable
    //    values survive the full-config PUT round-trip.
    let current;
    let baseFrom = "export";
    try {
      current = await cfRequest({ token: cfAuth.token, path: zarazExportUrl(zone.id) });
      report.ok("base config from /export (secret values preserved on PUT).");
    } catch {
      baseFrom = "config";
      try {
        current = await cfRequest({ token: cfAuth.token, path: zarazConfigUrl(zone.id) });
      } catch (e2) {
        report.err(`cannot read Zaraz config: ${e2.message}`);
        process.exitCode = 2;
        current = null;
      }
    }

    if (current) {
      // Snapshot the pre-mutation state (gitignored; may contain secrets from
      // /export — written with owner-only permissions).
      mkdirSync(STATE_DIR, { recursive: true });
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      const snapshotPath = join(STATE_DIR, `zaraz-config-preview-${stamp}.json`);
      writeFileSync(snapshotPath, JSON.stringify(current, null, 2), { mode: 0o600 });
      writeFileSync(join(STATE_DIR, "zaraz-config-last.json"), JSON.stringify(current, null, 2), { mode: 0o600 });
      report.ok(`snapshot saved to state/${snapshotPath.split("/").pop()}`);
      if (baseFrom === "config") {
        report.warn("base came from /config (secrets excluded). If the zone has secret variables unrelated to #745, re-run with a token that can call /export, or configure in the dashboard.");
      }

      // 3. Resolve the Measurement ID.
      let measurementId = measurementIdFlag;
      if (!measurementId) {
        report.bullet("resolving Measurement ID from GA4 …");
        const googleToken = await googleTokenFromEnv();
        if (!googleToken) {
          report.printGate("GOOGLE_OAUTH");
          report.warn("Cannot resolve the Measurement ID without Google access; pass --measurement-id.");
          process.exitCode = 2;
        } else {
          try {
            const d = await discoverGa4({ token: googleToken });
            if (!d.property) {
              if (d.candidates.length === 0) {
                report.err("no plausible Jabiko GA4 property found; pass --measurement-id.");
              } else {
                report.printGate("GA4_PROPERTY_AMBIGUITY");
                for (const c of d.candidates) report.bullet(`${c.displayName} (${c.name})`);
              }
              process.exitCode = 2;
            } else {
              measurementId = d.measurementId;
              if (!measurementId) {
                report.err(`property ${d.property.displayName} has no web-stream Measurement ID; pass --measurement-id.`);
                process.exitCode = 2;
              } else {
                report.ok(`using Measurement ID ${measurementId} from ${d.property.displayName}`);
              }
            }
          } catch (e) {
            report.err(`GA4 discovery failed: ${e.message}`);
            process.exitCode = 2;
          }
        }
      } else {
        report.bullet(`using --measurement-id ${measurementId}`);
      }

      if (measurementId && process.exitCode !== 2) {
        // 4. Diff and build.
        const before = zarazDesiredDiff(current, measurementId);
        report.sub("Zaraz diff vs desired state");
        report.printFindings(before);
        let { config: desired, mutations, findings } = buildZarazDesiredConfig(current, {
          measurementId,
          removeForbidden: yesRemoveGtag
        });
        for (const f of findings) {
          if (f.code === "SECOND_ANALYTICS_CLIENT") {
            report.err(f.message);
            report.warn("Re-run with --yes-remove-gtag to remove the second analytics client, or fix it in the dashboard.");
            process.exitCode = 2;
          }
        }

        if (process.exitCode !== 2) {
          if (mutations.length === 0) {
            report.ok("Zaraz config already converged.");
          } else {
            report.sub("Zaraz mutations");
            for (const m of mutations) report.bullet(`${m.code}${m.event ? ` [${m.event}]` : ""}${m.id ? ` (${m.id})` : ""}${m.message ? ` — ${m.message}` : ""}`);
          }

          if (dryRun) {
            report.ok("--dry-run: no changes written. Remove --dry-run to apply.");
            process.exitCode = 0;
          } else {
            // 5. PUT (with one retry on a concurrent-version conflict).
            let putOk = mutations.length === 0;
            for (let attempt = 0; attempt < 2 && !putOk; attempt += 1) {
              try {
                await cfRequest({
                  token: cfAuth.token,
                  path: zarazConfigUrl(zone.id),
                  method: "PUT",
                  body: desired
                });
                putOk = true;
              } catch (e) {
                if (attempt === 0 && /version|conflict|stale/i.test(e.message)) {
                  report.warn(`PUT conflicted (${e.message}) — re-reading and retrying once.`);
                  const fresh = await cfRequest({ token: cfAuth.token, path: zarazExportUrl(zone.id) });
                  const rebuilt = buildZarazDesiredConfig(fresh, { measurementId, removeForbidden: yesRemoveGtag });
                  desired = rebuilt.config;
                } else {
                  report.err(`PUT failed: ${e.message}`);
                  report.warn("restore the snapshot from state/ or re-run apply; the snapshot is untouched.");
                  process.exitCode = 2;
                  break;
                }
              }
            }

            if (putOk && mutations.length > 0) {
              report.ok("Zaraz config updated.");
              // 6. Workflow: realtime is live immediately; preview needs publish.
              let workflow = null;
              try {
                workflow = await cfRequest({ token: cfAuth.token, path: zarazWorkflowUrl(zone.id) });
              } catch {
                // workflow endpoint not always exposed — default realtime.
              }
              if (String(workflow) === "preview") {
                report.warn("zone uses the Preview & Publish workflow — attempting publish.");
                try {
                  await cfRequest({ token: cfAuth.token, path: zarazPublishUrl(zone.id), method: "POST" });
                  report.ok("published.");
                } catch (e) {
                  report.warn(`auto-publish failed (${e.message}); publish manually in the Zaraz History page.`);
                }
              } else {
                report.ok("zone is in realtime workflow — changes are live.");
              }

              // 7. Verify.
              const after = await cfRequest({ token: cfAuth.token, path: zarazConfigUrl(zone.id) });
              const remaining = zarazDesiredDiff(after, measurementId);
              report.sub("Zaraz verification");
              report.printFindings(remaining);
            }
          }
        }
      }
    }
  }
}

// 8. GA4 custom dimensions — reconciled unconditionally (even when the Zaraz
//    config was already converged), because dimensions are independent state.
if (process.exitCode !== 2) {
  report.sub("GA4 custom dimensions");
  const googleToken = await googleTokenFromEnv();
  if (!googleToken) {
    report.printGate("GOOGLE_OAUTH");
    report.warn("Zaraz part done. Custom dimensions need Google access — re-run apply after configuring Google credentials.");
  } else {
    try {
      const d = await discoverGa4({ token: googleToken });
      if (!d.property) {
        report.warn("no unique Jabiko GA4 property; custom dimensions not applied.");
      } else {
        report.ok(`property ${d.property.displayName} (${d.property.name})`);
        await reconcileGa4Dimensions({ googleToken, property: d.property.name, dryRun });
      }
    } catch (e) {
      report.err(`GA4 custom-dimension step failed: ${e.message}`);
    }
  }
}

report.section("Apply summary");
report.bullet(dryRun ? "dry-run — nothing was written." : `apply finished with exit code ${process.exitCode ?? 0}.`);
