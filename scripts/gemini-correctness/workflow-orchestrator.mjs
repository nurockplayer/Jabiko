// =============================================================================
// workflow-orchestrator.mjs — GitHub-independent deterministic orchestration
// state machine (Issue #688)
// =============================================================================
//
// Serializes the already-merged discovery / RED / GREEN stages (#635/#636/#637)
// into a deterministic, GitHub-independent state machine that produces a
// sanitized machine-readable WorkflowResult.  This module never creates a
// workflow, never opens a PR, never commits/pushes, and never calls a real
// GitHub write API.
//
// Public contract:
//   runWorkflowOrchestration({ mode, baselineSha, adapters, limits })
//     => Promise<WorkflowResult>
//
// adapters is the fixed injection boundary — tests always use fakes:
//   openAiPrGate({ baselineSha, limits }) -> { valid, openPrs? } | throws
//   baseline({ baselineSha, limits })     -> { valid, baselineSha?, checks }
//   discovery({ baselineSha, limits })    -> { valid, result? } | throws
//   red({ baselineSha, finding, limits }) -> { valid, result? } | throws
//   green({ baselineSha, finding, redResult, limits }) -> { valid, result? }
//   cleanup({ baselineSha, redResult })   -> { valid } | throws
//   clock()                               -> number (completion timestamp)
//
// The orchestrator never spawns a model-provided command, never reads a secret
// on its own (an injected environment is only used for result redaction, and is
// never forwarded to adapters), and never calls a GitHub write command.  Every
// stage hand-off carries only the validated contract of the previous stage;
// raw model responses never reach the next stage or the summary.
//
// Modes:
//   off     — immediate safe skip; zero baseline/Gemini/repository writes.
//   observe — open-PR gate -> baseline -> discovery/validation -> sanitized
//             result.  Never enters RED/GREEN.
//   repair  — open-PR gate -> baseline -> discovery -> RED -> clean reset ->
//             GREEN -> deterministic result.  Even a verified repair only
//             returns a publication candidate; it is never published here.
// =============================================================================

import { validateFinding } from "./finding-schema.mjs";
import { redactForOutput } from "./discover.mjs";
import path from "node:path";

const REQUIRED_BASELINE_CHECKS = ["lint", "typecheck", "test", "build", "diff-check"];
const BASELINE_SHA_RE = /^[0-9a-f]{40,64}$/i;
const HEX64_RE = /^[0-9a-f]{64}$/i;
const GEMINI_AI_PR_PREFIX = "gemini/auto-fix-";
const MODES = new Set(["off", "observe", "repair"]);
const REQUIRED_ADAPTERS = [
  "openAiPrGate",
  "baseline",
  "discovery",
  "red",
  "green",
  "cleanup",
  "clock"
];

const WORKFLOW_STATUS = Object.freeze({
  OFF_SKIP: "off-skip",
  OPEN_PR_BLOCKED: "open-pr-blocked",
  BASELINE_BLOCKED: "baseline-blocked",
  NO_FINDING: "no-finding",
  FINDING_REJECTED: "finding-rejected",
  QUOTA_API_ERROR: "quota-api-error",
  OBSERVED: "observed",
  RED_FAILED: "red-failed",
  CLEANUP_FAILED: "cleanup-failed",
  GREEN_FAILED: "green-failed",
  REPAIR_VERIFIED: "repair-verified",
  CONFIG_ERROR: "config-error"
});

function invalid(message) {
  return { valid: false, error: message };
}

function errorMessage(error) {
  return error?.message ?? "unknown error";
}

// ---------------------------------------------------------------------------
// Sensitive-value collection from an injected environment.  The orchestrator
// never reads a secret store or process.env on its own; the caller decides what
// to inject for result redaction.  These values are used only for scrubbing the
// result and are never forwarded to any stage adapter.
// ---------------------------------------------------------------------------
function collectSensitiveValues(environment) {
  const values = new Set();
  for (const [key, value] of Object.entries(environment ?? {})) {
    if (typeof value !== "string" || value.length === 0) continue;
    if (
      /(?:KEY|TOKEN|SECRET|PASSWORD|CREDENTIAL|AUTH|COOKIE)/i.test(key) ||
      value.length >= 8
    ) {
      values.add(value);
    }
  }
  if (typeof environment?.PATH === "string") {
    for (const entry of environment.PATH.split(path.delimiter)) {
      if (entry.length >= 4) values.add(entry);
    }
  }
  return [...values].filter((value) => typeof value === "string" && value.length > 0);
}

// ---------------------------------------------------------------------------
// Unified result redaction.  Starts from the shared redactForOutput (AIza keys
// + exact secrets), then applies deterministic scrub patterns for common leak
// shapes: GitHub/OpenAI/AWS tokens, env-dump assignments, and absolute POSIX
// paths.  The result must never contain a raw prompt/response, an env dump, or
// an absolute path.
// ---------------------------------------------------------------------------
function scrubResult(value, sensitiveValues) {
  const base = redactForOutput(value, sensitiveValues);
  let json = JSON.stringify(base);
  json = json
    .replace(/ghp_[A-Za-z0-9]{20,}/g, "REDACTED_KEY")
    .replace(/sk-[A-Za-z0-9]{20,}/g, "REDACTED_KEY")
    .replace(/AKIA[0-9A-Z]{16}/g, "REDACTED_KEY")
    .replace(/\b[A-Z][A-Z0-9_]{2,}=[^\s,;"']{4,}/g, "REDACTED_KEY")
    .replace(/\/[A-Za-z0-9._~-]+(?:\/[A-Za-z0-9._~-]+)+/g, "REDACTED_KEY");
  try {
    return JSON.parse(json);
  } catch {
    // The result is always JSON-safe; this is an unreachable safety net.
    return value;
  }
}

// ---------------------------------------------------------------------------
// Stage contract validators — every hand-off must be a validated contract.
// ---------------------------------------------------------------------------
function validateBaselineResult(result, expectedBaselineSha) {
  if (!result || typeof result !== "object" || Array.isArray(result)) {
    return invalid("baseline result must be an object");
  }
  if (
    result.baselineSha !== undefined &&
    result.baselineSha !== expectedBaselineSha
  ) {
    return invalid("baseline SHA does not match the trusted baseline");
  }
  if (!Array.isArray(result.checks)) {
    return invalid("baseline checks must be an array");
  }
  for (const name of REQUIRED_BASELINE_CHECKS) {
    const check = result.checks.find(
      (entry) => entry && typeof entry === "object" && entry.name === name
    );
    if (!check || check.status !== "passed") {
      return invalid(`baseline check ${name} did not pass`);
    }
  }
  return { valid: true, checks: result.checks };
}

function validateRedResult(result, trustedBaseline) {
  if (!result || typeof result !== "object" || Array.isArray(result)) {
    return invalid("RED result must be an object");
  }
  if (result.schemaVersion !== 1) return invalid("RED schemaVersion must be 1");
  if (result.status !== "red-confirmed") {
    return invalid("RED status must be red-confirmed");
  }
  if (!BASELINE_SHA_RE.test(String(result.baselineSha ?? ""))) {
    return invalid("RED baselineSha is invalid");
  }
  if (result.baselineSha !== trustedBaseline) {
    return invalid("RED baselineSha does not match the trusted baseline");
  }
  if (!HEX64_RE.test(String(result.patchSha256 ?? ""))) {
    return invalid("RED patchSha256 is invalid");
  }
  if (result.replayConfirmed !== true) {
    return invalid("RED must be replay-confirmed");
  }
  if (typeof result.testFile !== "string" || result.testFile.trim() === "") {
    return invalid("RED testFile is invalid");
  }
  if (typeof result.testName !== "string" || result.testName.trim() === "") {
    return invalid("RED testName is invalid");
  }
  return { valid: true, result };
}

function validateGreenResult(result, trustedBaseline) {
  if (!result || typeof result !== "object" || Array.isArray(result)) {
    return invalid("GREEN result must be an object");
  }
  if (result.schemaVersion !== 1) return invalid("GREEN schemaVersion must be 1");
  if (result.status !== "repair-verified") {
    return invalid("GREEN status must be repair-verified");
  }
  if (!BASELINE_SHA_RE.test(String(result.baselineSha ?? ""))) {
    return invalid("GREEN baselineSha is invalid");
  }
  if (result.baselineSha !== trustedBaseline) {
    return invalid("GREEN baselineSha does not match the trusted baseline");
  }
  if (!Number.isFinite(result.changedFiles) || result.changedFiles < 0) {
    return invalid("GREEN changedFiles is invalid");
  }
  if (!Number.isFinite(result.changedLines) || result.changedLines < 0) {
    return invalid("GREEN changedLines is invalid");
  }
  if (!HEX64_RE.test(String(result.finalDiffSha256 ?? ""))) {
    return invalid("GREEN finalDiffSha256 is invalid");
  }
  if (!Array.isArray(result.checks)) {
    return invalid("GREEN checks must be an array");
  }
  return { valid: true, result };
}

// ---------------------------------------------------------------------------
// runWorkflowOrchestration
// ---------------------------------------------------------------------------
export async function runWorkflowOrchestration({
  mode,
  baselineSha,
  adapters = {},
  limits = {}
} = {}) {
  const sensitiveValues = collectSensitiveValues(limits?.environment);
  const now = () => {
    const value = typeof adapters.clock === "function" ? adapters.clock() : undefined;
    return typeof value === "number" && Number.isFinite(value) ? value : undefined;
  };

  const failClosed = (status, reasonCode, message) =>
    scrubResult(
      {
        schemaVersion: 1,
        mode: String(mode ?? ""),
        status,
        reasonCode,
        reason: String(message ?? ""),
        publicationAllowed: false,
        baselineSha: typeof baselineSha === "string" ? baselineSha : undefined,
        completedAt: now()
      },
      sensitiveValues
    );

  // --- Bounded configuration validation --------------------------------
  if (!MODES.has(mode)) {
    return failClosed(
      WORKFLOW_STATUS.CONFIG_ERROR,
      "invalid-mode",
      "mode must be one of off|observe|repair"
    );
  }
  if (!BASELINE_SHA_RE.test(String(baselineSha ?? ""))) {
    return failClosed(
      WORKFLOW_STATUS.CONFIG_ERROR,
      "invalid-baseline-sha",
      "baselineSha must be a git commit SHA"
    );
  }
  if (!limits || typeof limits !== "object" || Array.isArray(limits)) {
    return failClosed(
      WORKFLOW_STATUS.CONFIG_ERROR,
      "invalid-limits",
      "limits must be a plain object"
    );
  }
  for (const adapterName of REQUIRED_ADAPTERS) {
    if (typeof adapters[adapterName] !== "function") {
      return failClosed(
        WORKFLOW_STATUS.CONFIG_ERROR,
        "missing-adapter",
        `adapter ${adapterName} is required`
      );
    }
  }

  // --- off: immediate safe skip, zero adapter calls --------------------
  if (mode === "off") {
    return {
      schemaVersion: 1,
      mode,
      status: WORKFLOW_STATUS.OFF_SKIP,
      reasonCode: "safe-skip",
      reason: "safe skip",
      publicationAllowed: false,
      baselineSha
    };
  }

  // The injected environment is only for result redaction; adapters never see
  // it, so no secret value can leak into a stage invocation.
  const forwardableLimits = {};
  for (const [key, value] of Object.entries(limits)) {
    if (key !== "environment") forwardableLimits[key] = value;
  }

  // --- Stage 1: open-AI-PR read gate ----------------------------------
  let gate;
  try {
    gate = await adapters.openAiPrGate({ baselineSha, limits: forwardableLimits });
  } catch (error) {
    return failClosed(WORKFLOW_STATUS.OPEN_PR_BLOCKED, "open-pr-blocked", errorMessage(error));
  }
  if (!gate || gate.valid !== true) {
    return failClosed(
      WORKFLOW_STATUS.OPEN_PR_BLOCKED,
      "open-pr-blocked",
      gate?.error ?? "open AI PR gate failed closed"
    );
  }
  const openPrs = Array.isArray(gate.openPrs) ? gate.openPrs : [];
  const hasAiPr = openPrs.some(
    (pr) => pr && typeof pr.ref === "string" && pr.ref.startsWith(GEMINI_AI_PR_PREFIX)
  );
  if (hasAiPr) {
    return failClosed(
      WORKFLOW_STATUS.OPEN_PR_BLOCKED,
      "open-pr-blocked",
      "open AI PR exists; skipping before baseline and Gemini"
    );
  }

  // --- Stage 2: baseline (lint/typecheck/test/build/diff-check) --------
  let baselineOutcome;
  try {
    baselineOutcome = await adapters.baseline({ baselineSha, limits: forwardableLimits });
  } catch (error) {
    return failClosed(WORKFLOW_STATUS.BASELINE_BLOCKED, "baseline-blocked", errorMessage(error));
  }
  if (!baselineOutcome || baselineOutcome.valid !== true) {
    return failClosed(
      WORKFLOW_STATUS.BASELINE_BLOCKED,
      "baseline-blocked",
      baselineOutcome?.error ?? "baseline failed closed"
    );
  }
  const baselineCheck = validateBaselineResult(baselineOutcome, baselineSha);
  if (!baselineCheck.valid) {
    return failClosed(
      WORKFLOW_STATUS.BASELINE_BLOCKED,
      "baseline-blocked",
      baselineCheck.error
    );
  }

  // --- Stage 3: discovery + finding validation -------------------------
  let discoveryOutcome;
  try {
    discoveryOutcome = await adapters.discovery({ baselineSha, limits: forwardableLimits });
  } catch (error) {
    return failClosed(
      WORKFLOW_STATUS.QUOTA_API_ERROR,
      "quota-api-error",
      errorMessage(error)
    );
  }
  if (!discoveryOutcome || discoveryOutcome.valid !== true) {
    return failClosed(
      WORKFLOW_STATUS.FINDING_REJECTED,
      "finding-rejected",
      discoveryOutcome?.error ?? "discovery failed closed"
    );
  }
  // The orchestrator only accepts a re-validated finding contract; a tampered
  // schema (unknown fields, bad hashes, non-finding status) is rejected here.
  // The no-finding path is also validated before it is trusted.
  const schemaCheck = validateFinding(discoveryOutcome.result);
  if (!schemaCheck.valid) {
    return failClosed(
      WORKFLOW_STATUS.FINDING_REJECTED,
      "finding-rejected",
      schemaCheck.error ?? "finding schema rejected"
    );
  }
  if (schemaCheck.result.status === "no-finding") {
    return failClosed(
      WORKFLOW_STATUS.NO_FINDING,
      "no-finding",
      schemaCheck.result.reason ?? "no finding"
    );
  }
  const finding = schemaCheck.result;

  if (mode === "observe") {
    return scrubResult(
      {
        schemaVersion: 1,
        mode,
        status: WORKFLOW_STATUS.OBSERVED,
        reasonCode: "observed",
        reason: "discovery validated a finding; observation complete",
        publicationAllowed: false,
        baselineSha,
        checks: baselineCheck.checks,
        findingTitle: finding.title,
        findingCategory: finding.category,
        completedAt: now()
      },
      sensitiveValues
    );
  }

  // --- Stage 4 (repair): RED -------------------------------------------
  let redOutcome;
  try {
    redOutcome = await adapters.red({ baselineSha, finding, limits: forwardableLimits });
  } catch (error) {
    return failClosed(WORKFLOW_STATUS.RED_FAILED, "red-failed", errorMessage(error));
  }
  if (!redOutcome || redOutcome.valid !== true) {
    const signal = redOutcome?.signal ? ` (signal: ${redOutcome.signal})` : "";
    return failClosed(
      WORKFLOW_STATUS.RED_FAILED,
      "red-failed",
      `${redOutcome?.error ?? "RED stage failed closed"}${signal}`
    );
  }
  const redCheck = validateRedResult(redOutcome.result, baselineSha);
  if (!redCheck.valid) {
    return failClosed(WORKFLOW_STATUS.RED_FAILED, "red-failed", redCheck.error);
  }
  const redResult = redCheck.result;

  // --- Stage 5 (repair): clean reset -----------------------------------
  let cleanupOutcome;
  try {
    cleanupOutcome = await adapters.cleanup({ baselineSha, redResult });
  } catch (error) {
    return failClosed(
      WORKFLOW_STATUS.CLEANUP_FAILED,
      "cleanup-failed",
      errorMessage(error)
    );
  }
  if (!cleanupOutcome || cleanupOutcome.valid !== true) {
    return failClosed(
      WORKFLOW_STATUS.CLEANUP_FAILED,
      "cleanup-failed",
      cleanupOutcome?.error ?? "clean reset failed closed"
    );
  }

  // --- Stage 6 (repair): GREEN -----------------------------------------
  let greenOutcome;
  try {
    greenOutcome = await adapters.green({
      baselineSha,
      finding,
      redResult,
      limits: forwardableLimits
    });
  } catch (error) {
    return failClosed(WORKFLOW_STATUS.GREEN_FAILED, "green-failed", errorMessage(error));
  }
  if (!greenOutcome || greenOutcome.valid !== true) {
    return failClosed(
      WORKFLOW_STATUS.GREEN_FAILED,
      "green-failed",
      greenOutcome?.error ?? "GREEN stage failed closed"
    );
  }
  const greenCheck = validateGreenResult(greenOutcome.result, baselineSha);
  if (!greenCheck.valid) {
    const isBaseline = /baseline/i.test(String(greenCheck.error));
    return failClosed(
      isBaseline ? WORKFLOW_STATUS.BASELINE_BLOCKED : WORKFLOW_STATUS.GREEN_FAILED,
      isBaseline ? "baseline-blocked" : "green-failed",
      greenCheck.error
    );
  }
  const green = greenCheck.result;

  // publicationAllowed=true only when the repair is validated, the clean reset
  // succeeded, and the baseline is still consistent.  This is a publication
  // candidate — it is never published from this module.
  return scrubResult(
    {
      schemaVersion: 1,
      mode,
      status: WORKFLOW_STATUS.REPAIR_VERIFIED,
      reasonCode: "repair-verified",
      reason: "repair verified; publication candidate (not published)",
      publicationAllowed: true,
      baselineSha,
      checks: baselineCheck.checks,
      findingTitle: finding.title,
      findingCategory: finding.category,
      red: {
        testFile: redResult.testFile,
        testName: redResult.testName,
        failureKind: redResult.failureKind,
        patchSha256: redResult.patchSha256,
        replayConfirmed: redResult.replayConfirmed
      },
      green: {
        findingTitle: green.findingTitle,
        productionFiles: green.productionFiles,
        rootCause: green.rootCause,
        fixSummary: green.fixSummary,
        checks: green.checks,
        changedFiles: green.changedFiles,
        changedLines: green.changedLines,
        finalDiffSha256: green.finalDiffSha256
      },
      changedFiles: green.changedFiles,
      changedLines: green.changedLines,
      finalDiffSha256: green.finalDiffSha256,
      completedAt: now()
    },
    sensitiveValues
  );
}
