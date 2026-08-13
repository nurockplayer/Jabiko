// ops/analytics bin/apply — reconcile #745 Zaraz + GA4 production config.
//
// Production-safety invariants:
//   - Full-config PUT is based only on /settings/zaraz/export (published config
//     with secrets). If export is unavailable, fail closed before mutation.
//   - GET /settings/zaraz/workflow is mandatory; lookup failure never defaults
//     to realtime.
//   - In preview workflow, a changed config is not production-complete until
//     POST /publish succeeds. Publish requires Zaraz Admin; if unavailable the
//     command returns a precise human publish gate and non-zero status.
//   - Post-mutation verification reads /export again, because /config may be a
//     newer preview and cannot prove the published production state.
//   - Any required GA4 custom-dimension failure is non-zero.

import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { join } from "node:path";
import {
  buildZarazDesiredConfig,
  zarazDesiredDiff,
  ga4DesiredDiff,
  hasPendingPreview,
  configsEqualSemantically,
  ZONE_NAME
} from "../desired.mjs";
import { resolveCloudflareAuth } from "../creds.mjs";
import {
  findZone,
  cfRequest,
  zarazConfigUrl,
  zarazExportUrl,
  zarazWorkflowUrl,
  zarazPublishUrl
} from "../cf.mjs";
import { googleTokenFromEnv, listCustomDimensions, createCustomDimension } from "../ga4.mjs";
import { parseFlags, discoverGa4, normalizeBooleanFlag, unknownFlags } from "./cliutil.mjs";
import * as report from "../report.mjs";

const STATE_DIR = fileURLToPath(new URL("../../state", import.meta.url));

/**
 * Persist a secret-complete Zaraz config snapshot into `stateDir` with
 * owner-only (0o600) permissions. `config` is typically the published /export —
 * the exact mutation base — so a rollback restores the real pre-mutation state.
 * Returns the timestamped snapshot path.
 */
export function persistZarazSnapshot(config, stateDir) {
  mkdirSync(stateDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const snapshotPath = join(stateDir, `zaraz-config-published-${stamp}.json`);
  writeFileSync(snapshotPath, JSON.stringify(config, null, 2), { mode: 0o600 });
  writeFileSync(join(stateDir, "zaraz-config-last.json"), JSON.stringify(config, null, 2), { mode: 0o600 });
  return snapshotPath;
}

async function reconcileGa4Dimensions({ googleToken, property, dryRun }) {
  const dims = await listCustomDimensions({ token: googleToken, property });
  const diff = ga4DesiredDiff(property, dims);
  const failures = [];
  for (const conflict of diff.conflicts) {
    report.err(`conflict: ${conflict.parameterName} exists with scope ${conflict.existingScope} (want ${conflict.desiredScope}) — not fixable automatically.`);
    failures.push({
      parameterName: conflict.parameterName,
      conflict: true,
      existingScope: conflict.existingScope
    });
  }
  for (const dim of diff.missing) {
    if (dryRun) {
      report.bullet(`would create custom dimension ${dim.parameterName}`);
      continue;
    }
    try {
      await createCustomDimension({ token: googleToken, property, dimension: dim });
      report.ok(`created custom dimension ${dim.parameterName}`);
    } catch (error) {
      report.err(`failed to create ${dim.parameterName}: ${error.message}`);
      failures.push({ parameterName: dim.parameterName, message: error.message });
    }
  }
  if (failures.length === 0) {
    report.ok("all desired GA4 custom dimensions present with EVENT scope.");
  }
  return { failures };
}

export async function runApply({ env = process.env, flags = {}, stateDir = STATE_DIR } = {}) {
  const measurementIdFlag = flags.measurementId;
  let failed = false;
  const gates = [];
  let mutations = [];
  let dimFailures = [];
  let workflow = null;
  let googleToken = null;
  let resolvedProperty = null;

  report.section(`Jabiko #745 analytics apply · zone ${ZONE_NAME}`);

  // Boolean flags are normalized centrally and fail closed on invalid values:
  // --dry-run / --dry-run=true are both true, and a typo like --dry-run=maybe
  // must never be silently guessed into a real mutation.
  let dryRun;
  let yesRemoveGtag;
  try {
    dryRun = normalizeBooleanFlag(flags.dryRun, "--dry-run");
    yesRemoveGtag = normalizeBooleanFlag(flags.yesRemoveGtag, "--yes-remove-gtag");
  } catch (error) {
    report.err(error.message);
    report.err("fail closed: invalid boolean flag value; nothing was written.");
    return { exitCode: 2, failed: true, gates, mutations, dimFailures, workflow };
  }

  const cfAuth = resolveCloudflareAuth({ env });
  if (!cfAuth || !cfAuth.capabilities.includes("zarazEdit")) {
    report.err("apply requires CLOUDFLARE_API_TOKEN with Zone:Zaraz Edit (plus Zone:Read for zone discovery).");
    report.printGate("CLOUDFLARE_AUTH");
    gates.push("CLOUDFLARE_AUTH");
    return { exitCode: 2, failed: true, gates, mutations, dimFailures, workflow };
  }
  report.bullet(`auth source: ${cfAuth.source}`);

  const zone = await findZone({ token: cfAuth.token, name: ZONE_NAME });
  if (zone?.ambiguous) {
    report.err("multiple active jabiko.app zones — ambiguous; refusing to bind to an arbitrary one.");
    report.printGate(
      "CLOUDFLARE_ZONE_AMBIGUITY",
      "Resolve which active jabiko.app zone is the intended production zone (archive/rename the others), then re-run."
    );
    gates.push("CLOUDFLARE_ZONE_AMBIGUITY");
    return { exitCode: 2, failed: true, gates, mutations, dimFailures, workflow };
  }
  if (!zone?.id) {
    report.err(`zone ${ZONE_NAME} not found.`);
    return { exitCode: 2, failed: true, gates, mutations, dimFailures, workflow };
  }
  report.ok(`zone ${zone.name} (id ${zone.id})`);

  // Workflow is a required production-state input. Never infer realtime.
  try {
    workflow = await cfRequest({ token: cfAuth.token, path: zarazWorkflowUrl(zone.id) });
    if (workflow !== "realtime" && workflow !== "preview") {
      throw new Error(`unexpected workflow ${JSON.stringify(workflow)}`);
    }
    report.ok(`workflow=${workflow}`);
  } catch (error) {
    report.err(`cannot read Zaraz workflow: ${error.message}`);
    report.err("fail closed: refusing to mutate without knowing realtime vs preview semantics.");
    return { exitCode: 2, failed: true, gates, mutations, dimFailures, workflow: null };
  }

  // The mutation base MUST be the current published export so secret values are
  // preserved. /config may be secret-stripped and/or preview-only.
  let current;
  try {
    current = await cfRequest({ token: cfAuth.token, path: zarazExportUrl(zone.id) });
    report.ok("base config from published /export (secret values preserved on PUT).");
  } catch (error) {
    report.err(`cannot read the Zaraz /export config: ${error.message}`);
    report.err("fail closed: refusing to mutate Zaraz without a secret-complete published export.");
    return { exitCode: 2, failed: true, gates, mutations, dimFailures, workflow };
  }

  // In Preview & Publish mode the published /export is the mutation base, but a
  // full PUT + publish would silently destroy any unpublished draft changes.
  // Compare the secret-stripped draft (/config) against the published /export;
  // if they differ, fail closed and expose the smallest human gate.
  if (workflow === "preview") {
    let draftConfig;
    try {
      draftConfig = await cfRequest({ token: cfAuth.token, path: zarazConfigUrl(zone.id) });
    } catch (error) {
      report.err(`cannot read the Zaraz /config (draft) surface: ${error.message}`);
      report.err("fail closed: cannot confirm there are no pending preview changes to preserve.");
      gates.push("CLOUDFLARE_PREVIEW_PENDING");
      return { exitCode: 2, failed: true, gates, mutations, dimFailures, workflow };
    }
    if (hasPendingPreview(draftConfig, current)) {
      report.err("pending unpublished Preview & Publish changes detected — a full PUT + publish would overwrite them.");
      report.printGate(
        "CLOUDFLARE_PREVIEW_PENDING",
        "Publish or discard the pending preview changes in Zaraz History, then re-run apply."
      );
      gates.push("CLOUDFLARE_PREVIEW_PENDING");
      return { exitCode: 2, failed: true, gates, mutations, dimFailures, workflow };
    }
    report.ok("no pending preview changes — the published /export is the current draft.");
  }

  // Resolve and verify the Measurement ID BEFORE any Zaraz mutation. The ID (from
  // --measurement-id or discovery) must belong to the unique jabiko.app
  // production web stream: a mismatch, ambiguity, or no matching stream fails
  // closed, so Zaraz and GA4 custom dimensions always target the same property.
  let measurementId = measurementIdFlag;
  report.bullet("verifying the GA4 production property/stream for the Measurement ID …");
  googleToken = await googleTokenFromEnv(env);
  if (!googleToken) {
    report.printGate("GOOGLE_OAUTH");
    gates.push("GOOGLE_OAUTH");
    return { exitCode: 2, failed: true, gates, mutations, dimFailures, workflow };
  }
  try {
    const discovered = await discoverGa4({ token: googleToken, measurementId: measurementIdFlag });
    if (!discovered.property) {
      const matched = discovered.matched ?? [];
      if (measurementIdFlag && matched.length === 0) {
        report.err(`--measurement-id ${measurementIdFlag} matches no jabiko.app production web stream; refusing to split Zaraz from GA4.`);
        report.printGate(
          "GA4_MEASUREMENT_ID_MISMATCH",
          "Pass the correct --measurement-id (a jabiko.app production stream's Measurement ID) or drop the flag to use discovery."
        );
        gates.push("GA4_MEASUREMENT_ID_MISMATCH");
        return { exitCode: 2, failed: true, gates, mutations, dimFailures, workflow };
      }
      if (matched.length > 1) {
        report.printGate("GA4_PROPERTY_AMBIGUITY");
        gates.push("GA4_PROPERTY_AMBIGUITY");
        for (const candidate of matched) {
          report.bullet(`${candidate.displayName} (${candidate.stream?.webStreamData?.measurementId})`);
        }
      } else {
        report.err("no jabiko.app production web stream found; pass --measurement-id.");
      }
      return { exitCode: 2, failed: true, gates, mutations, dimFailures, workflow };
    }
    if (!discovered.measurementId) {
      report.err(`property ${discovered.property.displayName} has no web-stream Measurement ID; pass --measurement-id.`);
      return { exitCode: 2, failed: true, gates, mutations, dimFailures, workflow };
    }
    measurementId = discovered.measurementId;
    resolvedProperty = discovered.property;
    report.ok(`using Measurement ID ${measurementId} from ${discovered.property.displayName}`);
  } catch (error) {
    report.err(`GA4 discovery failed: ${error.message}`);
    return { exitCode: 2, failed: true, gates, mutations, dimFailures, workflow };
  }

  const before = zarazDesiredDiff(current, measurementId);
  report.sub("Zaraz diff vs published desired state");
  report.printFindings(before);
  const built = buildZarazDesiredConfig(current, {
    measurementId,
    removeForbidden: yesRemoveGtag
  });
  let desired = built.config;
  mutations = built.mutations;
  for (const finding of built.findings) {
    if (finding.severity === "blocking") {
      report.err(finding.message ?? finding.code);
      if (finding.code === "SECOND_ANALYTICS_CLIENT") {
        report.warn("Re-run with --yes-remove-gtag to remove the second analytics client, or fix it in the dashboard.");
      }
      return { exitCode: 2, failed: true, gates, mutations, dimFailures, workflow };
    }
  }

  if (mutations.length === 0) {
    report.ok("published Zaraz config already converged.");
  } else {
    report.sub("Zaraz mutations");
    for (const mutation of mutations) {
      report.bullet(`${mutation.code}${mutation.event ? ` [${mutation.event}]` : ""}${mutation.id ? ` (${mutation.id})` : ""}${mutation.message ? ` — ${mutation.message}` : ""}`);
    }

    if (dryRun) {
      report.ok("--dry-run: no changes written. Remove --dry-run to apply.");
    } else {
      // Persist a secret-complete snapshot only in the real-mutation path —
      // a dry-run must not create state/ or write the /export secrets.
      const snapshotPath = persistZarazSnapshot(current, stateDir);
      report.ok(`snapshot saved to ${snapshotPath}`);

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
        } catch (error) {
          const isConflict = /version|conflict|stale/i.test(error.message);
          if (isConflict && workflow === "preview") {
            // A conflict means another operator changed the draft after our
            // pending-preview check. Retrying a full PUT from published /export
            // could overwrite their new draft, so fail closed instead.
            report.err(`PUT conflicted (${error.message}); preview workflow fails closed to avoid overwriting another operator's unpublished draft.`);
            report.warn("Re-run apply after the other preview change is published or discarded.");
            return { exitCode: 2, failed: true, gates, mutations, dimFailures, workflow };
          }
          if (attempt === 0 && isConflict) {
            report.warn(`PUT conflicted (${error.message}) — re-reading published /export and retrying once.`);
            const fresh = await cfRequest({ token: cfAuth.token, path: zarazExportUrl(zone.id) });
            const rebuilt = buildZarazDesiredConfig(fresh, {
              measurementId,
              removeForbidden: yesRemoveGtag
            });
            // The other operator's fresh state may have introduced a blocker
            // (duplicate GA4 tool, tool-level blocking, second analytics
            // client). Inspect the rebuild findings BEFORE the retry PUT.
            const blocker = rebuilt.findings.find((f) => f.severity === "blocking");
            if (blocker) {
              report.err(`the re-read published /export introduced a blocker (${blocker.code}): ${blocker.message ?? ""}`);
              report.err("fail closed: refusing to retry the PUT against a state with blocking findings.");
              return { exitCode: 2, failed: true, gates, mutations, dimFailures, workflow };
            }
            // `fresh` becomes the retry mutation base — persist it as the
            // rollback snapshot now, so a rollback after a successful retry
            // restores the actual pre-retry production state (not the stale
            // pre-conflict `current`).
            const freshSnapshot = persistZarazSnapshot(fresh, stateDir);
            report.ok(`rollback snapshot refreshed from the fresh published export: ${freshSnapshot}`);
            desired = rebuilt.config;
          } else {
            report.err(`PUT failed: ${error.message}`);
            return { exitCode: 2, failed: true, gates, mutations, dimFailures, workflow };
          }
        }
      }
      report.ok(workflow === "preview" ? "Zaraz preview config updated." : "Zaraz realtime config updated.");

      if (workflow === "preview") {
        report.warn("Preview & Publish workflow detected; production completion requires publish.");
        // TOCTOU guard: another operator may have edited the preview between
        // our successful PUT and this publish. Re-read the draft and only
        // publish if it still equals the exact desired config we produced;
        // otherwise fail closed without publishing over their unreviewed work.
        try {
          const draftNow = await cfRequest({ token: cfAuth.token, path: zarazConfigUrl(zone.id) });
          if (!configsEqualSemantically(draftNow, desired)) {
            report.err("the preview draft changed after our PUT — refusing to publish another operator's unreviewed changes.");
            report.printGate(
              "CLOUDFLARE_PREVIEW_CHANGED",
              "Re-run apply to rebase on the current preview, or resolve the pending preview in Zaraz History first."
            );
            gates.push("CLOUDFLARE_PREVIEW_CHANGED");
            return { exitCode: 2, failed: true, gates, mutations, dimFailures, workflow };
          }
          report.ok("preview still matches the desired config — publishing.");
        } catch (error) {
          report.err(`cannot re-read the preview draft before publish: ${error.message}`);
          report.err("fail closed: refusing to publish without confirming the draft is unchanged.");
          report.printGate(
            "CLOUDFLARE_PREVIEW_CHANGED",
            "Re-run apply once the preview draft is readable and unchanged."
          );
          gates.push("CLOUDFLARE_PREVIEW_CHANGED");
          return { exitCode: 2, failed: true, gates, mutations, dimFailures, workflow };
        }
        try {
          await cfRequest({
            token: cfAuth.token,
            path: zarazPublishUrl(zone.id),
            method: "POST"
          });
          report.ok("preview published to production.");
        } catch (error) {
          report.err(`publish failed: ${error.message}`);
          report.printGate(
            "CLOUDFLARE_PUBLISH",
            "The preview contains the requested change but production has not been updated. Publish it in Zaraz History, then rerun apply/smoke."
          );
          gates.push("CLOUDFLARE_PUBLISH");
          return { exitCode: 2, failed: true, gates, mutations, dimFailures, workflow };
        }
      } else {
        report.ok("realtime workflow: the successful PUT is live immediately.");
      }

      // Verify PUBLISHED state, never the possibly-preview /config surface.
      try {
        const publishedAfter = await cfRequest({ token: cfAuth.token, path: zarazExportUrl(zone.id) });
        const remaining = zarazDesiredDiff(publishedAfter, measurementId);
        report.sub("Published Zaraz verification");
        report.printFindings(remaining);
        if (remaining.some((finding) => finding.severity === "blocking")) {
          report.err("published Zaraz config is still not converged after apply/publish.");
          failed = true;
        }
      } catch (error) {
        report.err(`cannot verify published Zaraz config after mutation: ${error.message}`);
        failed = true;
      }
    }
  }

  report.sub("GA4 custom dimensions");
  // Use the property already resolved and bound to the Measurement ID above, so
  // Zaraz and GA4 custom dimensions always target the same property/stream.
  report.ok(`property ${resolvedProperty.displayName} (${resolvedProperty.name})`);
  const reconciled = await reconcileGa4Dimensions({
    googleToken,
    property: resolvedProperty.name,
    dryRun
  });
  dimFailures = reconciled.failures;
  if (dimFailures.length) failed = true;

  report.section("Apply summary");
  const exitCode = failed ? 1 : 0;
  report.bullet(dryRun ? "dry-run — nothing was written." : `apply finished with exit code ${exitCode}.`);
  return { exitCode, failed, gates, mutations, dimFailures, workflow };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const flags = parseFlags(process.argv.slice(2), { booleans: ["dry-run", "yes-remove-gtag"] });
  // Reject unknown options so a typo like `--dryrun=true` (a safety flag) fails
  // closed instead of being silently dropped into a real mutation.
  const unknown = unknownFlags(flags, ["measurement-id", "dry-run", "yes-remove-gtag"]);
  if (unknown.length) {
    report.err(`unknown option(s) for apply: ${unknown.join(", ")}`);
    process.exitCode = 2;
  } else {
    const result = await runApply({
      flags: {
        measurementId: flags["measurement-id"],
        dryRun: flags["dry-run"],
        yesRemoveGtag: flags["yes-remove-gtag"]
      }
    });
    process.exitCode = result.exitCode;
  }
}
