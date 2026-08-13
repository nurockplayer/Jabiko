// ops/analytics bin/apply — apply only the missing/incorrect #745 Zaraz + GA4
// configuration. Idempotent, snapshots the Zaraz config before mutation, and
// refuses to delete a second analytics client without --yes-remove-gtag.
//
// Production-safety invariants:
//   - The full-config PUT base is read from the Zaraz *export* endpoint (secret
//     variable values included). If /export is unavailable, apply FAILS CLOSED
//     before any mutation — it never falls back to the secret-stripped /config
//     as the PUT base.
//   - If any required GA4 custom dimension creation fails, apply exits non-zero.

import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
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

/** Idempotent GA4 custom-dimension reconciliation. Returns { failures }. */
async function reconcileGa4Dimensions({ googleToken, property, dryRun }) {
  const dims = await listCustomDimensions({ token: googleToken, property });
  const diff = ga4DesiredDiff(property, dims);
  const failures = [];
  if (diff.conflicts.length) {
    for (const c of diff.conflicts) {
      report.warn(`skip ${c.parameterName}: exists as scope ${c.existingScope} (want ${c.desiredScope})`);
    }
  }
  if (diff.missing.length === 0) {
    report.ok("all desired GA4 custom dimensions already present.");
    return { failures };
  }
  for (const dim of diff.missing) {
    if (dryRun) {
      report.bullet(`would create custom dimension ${dim.parameterName}`);
      continue;
    }
    try {
      await createCustomDimension({ token: googleToken, property, dimension: dim });
      report.ok(`created custom dimension ${dim.parameterName}`);
    } catch (e) {
      report.err(`failed to create ${dim.parameterName}: ${e.message}`);
      failures.push({ parameterName: dim.parameterName, message: e.message });
    }
  }
  return { failures };
}

/**
 * Run the full apply sequence. `env` and `flags` are injectable for tests.
 * Returns { exitCode, failed, mutations, dimFailures }.
 */
export async function runApply({
  env = process.env,
  flags = {}
} = {}) {
  const measurementIdFlag = flags.measurementId;
  const dryRun = flags.dryRun === true;
  const yesRemoveGtag = flags.yesRemoveGtag === true;
  let failed = false;
  let mutations = [];
  let dimFailures = [];

  report.section(`Jabiko #745 analytics apply · zone ${ZONE_NAME}`);

  // 1. Credential gate — Zaraz mutation requires an API token.
  const cfAuth = resolveCloudflareAuth({ env });
  if (!cfAuth || !cfAuth.capabilities.includes("zarazEdit")) {
    report.err("apply requires CLOUDFLARE_API_TOKEN with Zone:Zaraz Edit (the wrangler OAuth token cannot mutate Zaraz).");
    report.printGate("CLOUDFLARE_AUTH");
    return { exitCode: 2, failed: true, mutations, dimFailures };
  }
  report.bullet(`auth source: ${cfAuth.source}`);

  const zone = await findZone({ token: cfAuth.token, name: ZONE_NAME });
  if (!zone) {
    report.err(`zone ${ZONE_NAME} not found.`);
    return { exitCode: 2, failed: true, mutations, dimFailures };
  }
  report.ok(`zone ${zone.name} (id ${zone.id})`);

  // 2. Read the mutation base from /export ONLY. Fail closed if unavailable —
  //    a secret-stripped /config must never become the full-config PUT body.
  let current;
  try {
    current = await cfRequest({ token: cfAuth.token, path: zarazExportUrl(zone.id) });
    report.ok("base config from /export (secret values preserved on PUT).");
  } catch (e) {
    report.err(`cannot read the Zaraz /export config: ${e.message}`);
    report.err("fail closed: refusing to mutate Zaraz without a secret-complete export.");
    report.warn("Provide a Cloudflare API token that can call /settings/zaraz/export and re-run.");
    return { exitCode: 2, failed: true, mutations, dimFailures };
  }

  // Snapshot the pre-mutation state (gitignored; may contain secrets from
  // /export — written with owner-only permissions).
  mkdirSync(STATE_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const snapshotPath = join(STATE_DIR, `zaraz-config-preview-${stamp}.json`);
  writeFileSync(snapshotPath, JSON.stringify(current, null, 2), { mode: 0o600 });
  writeFileSync(join(STATE_DIR, "zaraz-config-last.json"), JSON.stringify(current, null, 2), { mode: 0o600 });
  report.ok(`snapshot saved to state/${snapshotPath.split("/").pop()}`);

  // 3. Resolve the Measurement ID.
  let measurementId = measurementIdFlag;
  if (!measurementId) {
    report.bullet("resolving Measurement ID from GA4 …");
    const googleToken = await googleTokenFromEnv(env);
    if (!googleToken) {
      report.printGate("GOOGLE_OAUTH");
      report.warn("Cannot resolve the Measurement ID without Google access; pass --measurement-id.");
      return { exitCode: 2, failed: true, mutations, dimFailures };
    }
    try {
      const d = await discoverGa4({ token: googleToken });
      if (!d.property) {
        if (d.candidates.length === 0) {
          report.err("no plausible Jabiko GA4 property found; pass --measurement-id.");
        } else {
          report.printGate("GA4_PROPERTY_AMBIGUITY");
          for (const c of d.candidates) report.bullet(`${c.displayName} (${c.name})`);
        }
        return { exitCode: 2, failed: true, mutations, dimFailures };
      }
      measurementId = d.measurementId;
      if (!measurementId) {
        report.err(`property ${d.property.displayName} has no web-stream Measurement ID; pass --measurement-id.`);
        return { exitCode: 2, failed: true, mutations, dimFailures };
      }
      report.ok(`using Measurement ID ${measurementId} from ${d.property.displayName}`);
    } catch (e) {
      report.err(`GA4 discovery failed: ${e.message}`);
      return { exitCode: 2, failed: true, mutations, dimFailures };
    }
  } else {
    report.bullet(`using --measurement-id ${measurementId}`);
  }

  // 4. Diff and build.
  const before = zarazDesiredDiff(current, measurementId);
  report.sub("Zaraz diff vs desired state");
  report.printFindings(before);
  const built = buildZarazDesiredConfig(current, {
    measurementId,
    removeForbidden: yesRemoveGtag
  });
  let desired = built.config;
  mutations = built.mutations;
  for (const f of built.findings) {
    if (f.code === "SECOND_ANALYTICS_CLIENT") {
      report.err(f.message);
      report.warn("Re-run with --yes-remove-gtag to remove the second analytics client, or fix it in the dashboard.");
      return { exitCode: 2, failed: true, mutations, dimFailures };
    }
  }

  // 5. Mutate (idempotent; only when there is something to change).
  if (mutations.length === 0) {
    report.ok("Zaraz config already converged.");
  } else {
    report.sub("Zaraz mutations");
    for (const m of mutations) report.bullet(`${m.code}${m.event ? ` [${m.event}]` : ""}${m.id ? ` (${m.id})` : ""}${m.message ? ` — ${m.message}` : ""}`);
    if (dryRun) {
      report.ok("--dry-run: no changes written. Remove --dry-run to apply.");
    } else {
      let putOk = false;
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
            report.warn(`PUT conflicted (${e.message}) — re-reading /export and retrying once.`);
            const fresh = await cfRequest({ token: cfAuth.token, path: zarazExportUrl(zone.id) });
            const rebuilt = buildZarazDesiredConfig(fresh, { measurementId, removeForbidden: yesRemoveGtag });
            desired = rebuilt.config;
          } else {
            report.err(`PUT failed: ${e.message}`);
            report.warn("restore the snapshot from state/ or re-run apply; the snapshot is untouched.");
            return { exitCode: 2, failed: true, mutations, dimFailures };
          }
        }
      }

      report.ok("Zaraz config updated.");
      // Workflow: realtime is live immediately; preview needs publish.
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

      // Verify.
      const after = await cfRequest({ token: cfAuth.token, path: zarazConfigUrl(zone.id) });
      const remaining = zarazDesiredDiff(after, measurementId);
      report.sub("Zaraz verification");
      report.printFindings(remaining);
    }
  }

  // 6. GA4 custom dimensions — reconciled unconditionally (independent state).
  report.sub("GA4 custom dimensions");
  const googleToken = await googleTokenFromEnv(env);
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
        const res = await reconcileGa4Dimensions({ googleToken, property: d.property.name, dryRun });
        dimFailures = res.failures;
        if (dimFailures.length) failed = true;
      }
    } catch (e) {
      report.err(`GA4 custom-dimension step failed: ${e.message}`);
      failed = true;
    }
  }

  report.section("Apply summary");
  const exitCode = failed ? 1 : 0;
  report.bullet(dryRun ? "dry-run — nothing was written." : `apply finished with exit code ${exitCode}.`);
  return { exitCode, failed, mutations, dimFailures };
}

// CLI entry (only when executed directly, not when imported by a test).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const flags = parseFlags(process.argv.slice(2));
  const result = await runApply({
    flags: {
      measurementId: flags["measurement-id"],
      dryRun: flags["dry-run"] === true,
      yesRemoveGtag: flags["yes-remove-gtag"] === true
    }
  });
  process.exitCode = result.exitCode;
}
