// =============================================================================
// publication-adapter.mjs — GitHub publication adapter for verified repairs
// (Issue #689)
// =============================================================================
//
// Publishes a #688-validated, publicationAllowed=true repair candidate as an
// isolated branch + one commit + one Draft PR on GitHub.  This module never
// runs Gemini stages and never creates a workflow.
//
// Public contract:
//   publishVerifiedRepair({ candidate, runId, repository, adapters, limits })
//     => Promise<PublicationResult>
//
// Security posture (fail closed):
//   - candidate is re-validated locally (schema/hash/file list/line stats)
//     before ANY write; the adapter never re-interprets the finding or widens
//     scope.
//   - remote main is re-read immediately before publication; a mismatch with
//     candidate.baselineSha returns baseline-stale with zero writes.
//   - the branch is created only from candidate.baselineSha.
//   - commit contains exactly the verified regression test + allowlisted
//     production diff; .tmp/** and other generated/raw/secret content is never
//     included.
//   - the PR body is built from validated candidate fields only; raw model
//     Markdown is never spliced in.
//   - read/create/commit/push/PR/delete each use a fixed bounded retry of 3;
//     there is no infinite loop and no background process.
//   - push-success-but-PR-failure triggers remote branch cleanup for this run
//     only; successful cleanup => publication-cleaned-up, failure => hard
//     failure naming the orphan branch.
//   - the adapter never force-pushes, never merges/rebases, never auto-approves
//     or auto-merges, and never uses --admin.
//
// adapters is the fixed injection boundary — tests always use fakes:
//   readRemoteHead({ ref })                       -> { valid, sha? } | throws
//   createBranch({ name, baseSha })               -> { valid } | throws
//   commit({ branch, message, regressionTest, productionDiff }) -> { valid, sha? } | throws
//   push({ branch })                              -> { valid } | throws
//   createPullRequest({ title, body, base, head, draft }) -> { valid, number?, url? } | throws
//   deleteBranch({ name })                        -> { valid } | throws
//   clock()                                       -> number (completion timestamp)
// =============================================================================

import { createHash } from "node:crypto";
import path from "node:path";
import { redactForOutput } from "./discover.mjs";
import {
  getDefaultAllowlist,
  getDefaultProtectedPaths,
  isAllowlisted,
  isPathSafe,
  isProtected,
  parseUnifiedDiff
} from "./policy.mjs";

const MAX_ADAPTER_ATTEMPTS = 3;
const MAX_TITLE_LENGTH = 140;
const GEMINI_AI_PR_PREFIX = "gemini/auto-fix-";
const HEX64_RE = /^[0-9a-f]{64}$/i;
const SHA_RE = /^[0-9a-f]{40,64}$/i;
const SECRET_VALUE_RE = /(?:AIza[0-9A-Za-z_-]{35}|ghp_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16})/;
const REQUIRED_ADAPTERS = [
  "readRemoteHead",
  "createBranch",
  "commit",
  "push",
  "createPullRequest",
  "deleteBranch",
  "clock"
];

export const PUBLICATION_STATUS = Object.freeze({
  PUBLISHED: "published",
  INVALID_CANDIDATE: "invalid-candidate",
  BASELINE_STALE: "baseline-stale",
  BRANCH_EXISTS: "branch-exists",
  CLEANED_UP: "publication-cleaned-up",
  CLEANUP_FAILED: "cleanup-failed",
  CONFIG_ERROR: "config-error",
  PUBLICATION_FAILED: "publication-failed"
});

const PR_BODY_FIXED_KEYS = [
  "schemaVersion",
  "status",
  "publicationAllowed",
  "baselineSha",
  "findingTitle",
  "findingCategory",
  "model",
  "runUrl",
  "finalDiffSha256",
  "changedFiles",
  "changedLines",
  "productionDiff",
  "regressionTest",
  "red",
  "green"
];

function invalid(error) {
  return { valid: false, error };
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function errorMessage(error) {
  return error?.message ?? "unknown error";
}

function normalizePath(filePath) {
  return String(filePath).replace(/\\/g, "/");
}

// Strips C0/C1 control characters (including newline/tab) from a single-line
// narrative string.  Avoids a control-character regex entirely (no-control-regex).
function stripControlCharacters(value) {
  let out = "";
  for (const char of String(value ?? "")) {
    const code = char.codePointAt(0) ?? 0;
    if (code === 0x7f || (code < 0x20) || (code >= 0x80 && code <= 0x9f)) continue;
    out += char;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Sensitive-value collection from an injected environment (same policy as the
// orchestrator: used only for output redaction, never forwarded to adapters).
// ---------------------------------------------------------------------------
function collectSensitiveValues(environment) {
  const values = new Set();
  if (
    environment === null ||
    environment === undefined ||
    typeof environment !== "object" ||
    Array.isArray(environment)
  ) {
    return [];
  }
  for (const [key, value] of Object.entries(environment)) {
    if (typeof value !== "string" || value.length === 0) continue;
    if (
      /(?:KEY|TOKEN|SECRET|PASSWORD|CREDENTIAL|AUTH|COOKIE)/i.test(key) ||
      value.length >= 8
    ) {
      values.add(value);
    }
  }
  if (typeof environment.PATH === "string") {
    for (const entry of environment.PATH.split(path.delimiter)) {
      if (entry.length >= 4) values.add(entry);
    }
  }
  return [...values].filter((value) => typeof value === "string" && value.length > 0);
}

// ---------------------------------------------------------------------------
// Unified result redaction.  Shares the redactForOutput base, then scrubs
// common token/env-dump/absolute-path leak shapes.  The POSIX absolute-path
// scrub anchors on a system root and never spans "://", so GitHub PR URLs
// (https://github.com/...) survive intact.
// ---------------------------------------------------------------------------
function scrubResult(value, sensitiveValues) {
  const base = redactForOutput(value, sensitiveValues);
  let json = JSON.stringify(base);
  json = json
    .replace(/ghp_[A-Za-z0-9]{20,}/g, "REDACTED_KEY")
    .replace(/sk-[A-Za-z0-9]{20,}/g, "REDACTED_KEY")
    .replace(/AKIA[0-9A-Z]{16}/g, "REDACTED_KEY")
    .replace(/\b[A-Z][A-Z0-9_]{2,}=[^\s,;"']{4,}/g, "REDACTED_KEY")
    .replace(
      /(?:\/|~\/)(?:tmp|var|home|Users|etc|usr|opt|root|private|Applications|Library)(?:\/[A-Za-z0-9._~/-]+)*/g,
      "REDACTED_PATH"
    );
  try {
    return JSON.parse(json);
  } catch {
    return value;
  }
}

// ---------------------------------------------------------------------------
// Narrative-field scrubber for the PR body.  Model-authored strings (finding
// title, root cause, fix summary, test name) are the only place a secret,
// token, or host absolute path could appear; structural body content (repo
// paths, URLs, branch, hashes) is adapter-generated and must survive intact.
// System-root absolute paths (/tmp, /var, /home, /Users, ...) are scrubbed;
// URLs and repo-relative paths are not.  Control characters (including
// newline/tab) are collapsed to spaces so a narrative field cannot inject
// Markdown structure into the PR body.
// ---------------------------------------------------------------------------
function scrubNarrative(value, sensitiveValues = []) {
  const base = redactForOutput(String(value ?? ""), sensitiveValues);
  const scrubbed = String(base)
    .replace(/ghp_[A-Za-z0-9]{20,}/g, "REDACTED_KEY")
    .replace(/sk-[A-Za-z0-9]{20,}/g, "REDACTED_KEY")
    .replace(/AKIA[0-9A-Z]{16}/g, "REDACTED_KEY")
    .replace(
      /(?:\/|~\/)(?:tmp|var|home|Users|etc|usr|opt|root|private|Applications|Library)\/[A-Za-z0-9._~/-]+/g,
      "REDACTED_PATH"
    );
  return stripControlCharacters(scrubbed.replace(/\s+/g, " ")).trim();
}

// ---------------------------------------------------------------------------
// Candidate validation — the ONLY interpretation of the publication input.
// The candidate must already be a #688-verified result with
// publicationAllowed === true; this validator never re-interprets a finding or
// widens scope.  Any mismatch (schema/hash/file list/line stats) fails closed
// before a single write.
// ---------------------------------------------------------------------------
export function validatePublicationCandidate(candidate, options = {}) {
  if (candidate === null || candidate === undefined || typeof candidate !== "object" || Array.isArray(candidate)) {
    return invalid("candidate must be a plain object");
  }
  const keys = Object.keys(candidate);
  const unknown = keys.filter((key) => !PR_BODY_FIXED_KEYS.includes(key));
  if (unknown.length > 0) {
    return invalid(`candidate has unknown fields: ${unknown.join(", ")}`);
  }

  if (candidate.schemaVersion !== 1) return invalid("candidate schemaVersion must be 1");
  if (candidate.status !== "repair-verified") {
    return invalid('candidate status must be "repair-verified"');
  }
  if (candidate.publicationAllowed !== true) {
    return invalid("candidate publicationAllowed must be exactly true");
  }
  if (!SHA_RE.test(String(candidate.baselineSha ?? ""))) {
    return invalid("candidate baselineSha is invalid");
  }
  if (!HEX64_RE.test(String(candidate.finalDiffSha256 ?? ""))) {
    return invalid("candidate finalDiffSha256 is invalid");
  }
  if (typeof candidate.findingTitle !== "string" || candidate.findingTitle.trim() === "") {
    return invalid("candidate findingTitle must be a non-empty string");
  }
  if (typeof candidate.model !== "string" || candidate.model.trim() === "") {
    return invalid("candidate model must be a non-empty string");
  }
  if (typeof candidate.runUrl !== "string" || candidate.runUrl.trim() === "") {
    return invalid("candidate runUrl must be a non-empty string");
  }
  if (!Number.isFinite(candidate.changedFiles) || candidate.changedFiles < 0) {
    return invalid("candidate changedFiles is invalid");
  }
  if (!Number.isFinite(candidate.changedLines) || candidate.changedLines < 0) {
    return invalid("candidate changedLines is invalid");
  }
  if (typeof candidate.productionDiff !== "string" || candidate.productionDiff.trim() === "") {
    return invalid("candidate productionDiff must be a non-empty unified diff");
  }

  const allowlist = options.allowlist ?? getDefaultAllowlist();
  const protectedPaths = options.protectedPaths ?? getDefaultProtectedPaths();

  const regression = candidate.regressionTest;
  if (typeof regression !== "object" || regression === null || Array.isArray(regression)) {
    return invalid("candidate regressionTest must be an object");
  }
  const regressionKeys = Object.keys(regression);
  const unknownRegression = regressionKeys.filter((key) => !["path", "source"].includes(key));
  if (unknownRegression.length > 0) {
    return invalid(`candidate regressionTest has unknown fields: ${unknownRegression.join(", ")}`);
  }
  if (typeof regression.path !== "string" || regression.path.trim() === "") {
    return invalid("candidate regressionTest.path must be a non-empty string");
  }
  if (!isPathSafe(regression.path)) {
    return invalid(`candidate regressionTest.path "${regression.path}" is not a safe relative path`);
  }
  if (!/\.regression\.test\.tsx?$/.test(normalizePath(regression.path))) {
    return invalid(`candidate regressionTest.path "${regression.path}" must end with .regression.test.ts or .regression.test.tsx`);
  }
  const regressionNormalized = normalizePath(regression.path);
  if (isProtected(regressionNormalized, protectedPaths)) {
    return invalid(`candidate regressionTest.path "${regression.path}" is a protected path`);
  }
  if (!isAllowlisted(regressionNormalized, allowlist)) {
    return invalid(`candidate regressionTest.path "${regression.path}" is outside the allowlist`);
  }
  if (typeof regression.source !== "string" || regression.source.trim() === "") {
    return invalid("candidate regressionTest.source must be a non-empty string");
  }

  const red = candidate.red;
  if (typeof red !== "object" || red === null || Array.isArray(red)) {
    return invalid("candidate red must be an object");
  }
  if (red.testFile !== regression.path) {
    return invalid("candidate red.testFile does not match regressionTest.path");
  }
  if (typeof red.testName !== "string" || red.testName.trim() === "") {
    return invalid("candidate red.testName must be a non-empty string");
  }
  if (red.failureKind !== "assertion") {
    return invalid('candidate red.failureKind must be "assertion"');
  }
  if (red.replayConfirmed !== true) {
    return invalid("candidate red.replayConfirmed must be true");
  }
  if (!HEX64_RE.test(String(red.patchSha256 ?? ""))) {
    return invalid("candidate red.patchSha256 is invalid");
  }

  const green = candidate.green;
  if (typeof green !== "object" || green === null || Array.isArray(green)) {
    return invalid("candidate green must be an object");
  }
  if (!Array.isArray(green.productionFiles) || green.productionFiles.length === 0) {
    return invalid("candidate green.productionFiles must be a non-empty array");
  }
  for (const filePath of green.productionFiles) {
    if (typeof filePath !== "string" || filePath.trim() === "") {
      return invalid("candidate green.productionFiles entries must be non-empty strings");
    }
    if (!isPathSafe(filePath)) {
      return invalid(`candidate green.productionFiles "${filePath}" is not a safe relative path`);
    }
    const normalized = normalizePath(filePath);
    if (isProtected(normalized, protectedPaths)) {
      return invalid(`candidate green.productionFiles "${filePath}" is a protected path`);
    }
    if (!isAllowlisted(normalized, allowlist)) {
      return invalid(`candidate green.productionFiles "${filePath}" is outside the allowlist`);
    }
  }
  if (!Array.isArray(green.checks) || green.checks.length === 0) {
    return invalid("candidate green.checks must be a non-empty array");
  }
  for (const check of green.checks) {
    if (typeof check !== "object" || check === null || check.status !== "passed") {
      return invalid("candidate green.checks entries must all be passed");
    }
  }
  if (green.finalDiffSha256 !== candidate.finalDiffSha256) {
    return invalid("candidate green.finalDiffSha256 does not match the top-level finalDiffSha256");
  }
  if (green.changedFiles !== candidate.changedFiles) {
    return invalid("candidate green.changedFiles does not match the top-level changedFiles");
  }
  if (green.changedLines !== candidate.changedLines) {
    return invalid("candidate green.changedLines does not match the top-level changedLines");
  }
  if (typeof green.rootCause !== "string" || green.rootCause.trim() === "") {
    return invalid("candidate green.rootCause must be a non-empty string");
  }
  if (typeof green.fixSummary !== "string" || green.fixSummary.trim() === "") {
    return invalid("candidate green.fixSummary must be a non-empty string");
  }

  // --- Content hash guard: productionDiff must match finalDiffSha256. -------
  if (sha256(candidate.productionDiff) !== candidate.finalDiffSha256) {
    return invalid("candidate productionDiff sha256 does not match finalDiffSha256");
  }

  // --- Diff interpretation (reuse the shared unified-diff parser). ----------
  const parsed = parseUnifiedDiff(candidate.productionDiff);
  if (!parsed.valid) return parsed;
  if (parsed.changedFiles !== candidate.changedFiles) {
    return invalid(`production diff touches ${parsed.changedFiles} files but candidate claims ${candidate.changedFiles}`);
  }
  const parsedLines = parsed.totalAdditions + parsed.totalDeletions;
  if (parsedLines !== candidate.changedLines) {
    return invalid(`production diff changes ${parsedLines} lines but candidate claims ${candidate.changedLines}`);
  }

  // --- Scope containment: diff may only touch finding production files. -----
  const productionFileSet = new Set(green.productionFiles.map(normalizePath));
  for (const file of parsed.files) {
    const normalized = normalizePath(file.path);
    if (!productionFileSet.has(normalized)) {
      return invalid(`production diff file "${file.path}" is not in candidate green.productionFiles`);
    }
    if (!isPathSafe(file.path)) {
      return invalid(`production diff file "${file.path}" is not a safe relative path`);
    }
    if (isProtected(normalized, protectedPaths)) {
      return invalid(`production diff file "${file.path}" is a protected path`);
    }
    if (!isAllowlisted(normalized, allowlist)) {
      return invalid(`production diff file "${file.path}" is outside the allowlist`);
    }
  }

  // --- Secret scan on commit payload (diff + regression test source + the
  // path fields that render into the commit and PR body). ---------------------
  const sensitiveValues = (options.sensitiveValues ?? []).filter(
    (value) => typeof value === "string" && value.length >= 4
  );
  const payloadText = [
    candidate.productionDiff,
    regression.source,
    regression.path,
    ...green.productionFiles,
    red.testFile
  ].join("\n");
  if (SECRET_VALUE_RE.test(payloadText)) {
    return invalid("commit payload contains secret-like content");
  }
  if (redactForOutput(payloadText, sensitiveValues) !== payloadText) {
    return invalid("commit payload contains sensitive content");
  }

  return {
    valid: true,
    result: {
      schemaVersion: 1,
      status: "repair-verified",
      publicationAllowed: true,
      baselineSha: candidate.baselineSha,
      findingTitle: candidate.findingTitle,
      findingCategory: candidate.findingCategory,
      model: candidate.model,
      runUrl: candidate.runUrl,
      finalDiffSha256: candidate.finalDiffSha256,
      changedFiles: candidate.changedFiles,
      changedLines: candidate.changedLines,
      productionDiff: candidate.productionDiff,
      regressionTest: { path: regression.path, source: regression.source },
      red: { ...red },
      green: { ...green }
    }
  };
}

// ---------------------------------------------------------------------------
// Title / branch sanitization — fixed prefixes, control-character scrubbing,
// and a hard length bound.
// ---------------------------------------------------------------------------
function sanitizeTitle(rawTitle, sensitiveValues = []) {
  const scrubbed = scrubNarrative(rawTitle, sensitiveValues);
  const collapsed = stripControlCharacters(
    String(scrubbed ?? "").replace(/\s+/g, " ")
  )
    .trim()
    .replace(/^fix:\s*/i, "")
    .slice(0, MAX_TITLE_LENGTH)
    .replace(/\.{3,}$/, "")
    .trim();
  return `fix: ${collapsed || "verified repair"}`;
}

function sanitizeBranch(runId) {
  const base = stripControlCharacters(runId);
  const slug = base.replace(/[^A-Za-z0-9._-]+/g, "-").replace(/-{2,}/g, "-").replace(/^[._-]+|[._-]+$/g, "").slice(0, 80);
  const suffix = slug || "run";
  return `${GEMINI_AI_PR_PREFIX}${suffix}`;
}

// ---------------------------------------------------------------------------
// PR body — deterministic, built only from validated candidate fields.
// ---------------------------------------------------------------------------
export function buildPullRequestBody(candidate, { runId, repository, sensitiveValues = [] }) {
  const checks = (candidate.green?.checks ?? []).map(
    (check) => `- [x] ${scrubNarrative(check.name ?? "", sensitiveValues)}: ${check.status}`
  );
  const productionFiles = (candidate.green?.productionFiles ?? []).map(
    (filePath) => `- \`${scrubNarrative(filePath ?? "", sensitiveValues)}\``
  );
  const scrub = (value) => scrubNarrative(value, sensitiveValues);
  return [
    `fix: ${scrub(candidate.findingTitle ?? "verified repair")}`,
    "",
    "> **Automated Gemini repair — human review required before merge.**",
    "> This Draft PR was created by an automated pipeline. Do not auto-merge.",
    "",
    "## Finding",
    `- **Title**: ${scrub(candidate.findingTitle ?? "unknown")}`,
    `- **Category**: ${scrub(candidate.findingCategory ?? "unknown")}`,
    `- **Baseline**: \`${candidate.baselineSha ?? "unknown"}\``,
    `- **Final diff sha256**: \`${candidate.finalDiffSha256 ?? "unknown"}\``,
    "",
    "## RED evidence",
    `- Test file: \`${scrub(candidate.red?.testFile ?? "unknown")}\``,
    `- Test name: ${scrub(candidate.red?.testName ?? "unknown")}`,
    `- Failure kind: ${scrub(candidate.red?.failureKind ?? "unknown")}`,
    `- Replay confirmed: ${candidate.red?.replayConfirmed === true ? "yes" : "no"}`,
    "",
    "## GREEN evidence",
    `- Production files:`,
    ...productionFiles,
    `- Root cause: ${scrub(candidate.green?.rootCause ?? "unknown")}`,
    `- Fix summary: ${scrub(candidate.green?.fixSummary ?? "unknown")}`,
    "",
    "## Checks",
    ...checks,
    "",
    "## Stats",
    `- Changed files: ${candidate.changedFiles ?? "unknown"}`,
    `- Changed lines: ${candidate.changedLines ?? "unknown"}`,
    "",
    `## Run`,
    `- Branch: \`gemini/auto-fix-${runId ?? "unknown"}\``,
    `- Repository: ${repository?.owner ?? "unknown"}/${repository?.repo ?? "unknown"}`,
    `- Run URL: ${scrub(candidate.runUrl ?? "unknown")}`,
    `- Model: ${scrub(candidate.model ?? "unknown")}`,
    "",
    `_Generated by the Gemini correctness publication adapter. PR number: _`
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Bounded retry helper — exactly MAX_ADAPTER_ATTEMPTS attempts, no infinite
// loop, no background process.
// ---------------------------------------------------------------------------
async function withBoundedRetry(fn, label) {
  let lastError = "";
  for (let attempt = 1; attempt <= MAX_ADAPTER_ATTEMPTS; attempt += 1) {
    try {
      const outcome = await fn();
      if (outcome && outcome.valid === true) return { ok: true, value: outcome };
      lastError = outcome?.error ?? `${label} failed closed (attempt ${attempt})`;
      if (outcome?.code === "branch-exists") {
        return { ok: false, code: "branch-exists", error: lastError };
      }
    } catch (error) {
      lastError = errorMessage(error);
    }
  }
  return { ok: false, error: lastError };
}

// ---------------------------------------------------------------------------
// publishVerifiedRepair
// ---------------------------------------------------------------------------
export async function publishVerifiedRepair({
  candidate,
  runId,
  repository,
  adapters = {},
  limits = {}
} = {}) {
  const sensitiveValues = collectSensitiveValues(limits?.environment);
  const now = () => {
    const value = typeof adapters.clock === "function" ? adapters.clock() : undefined;
    return typeof value === "number" && Number.isFinite(value) ? value : undefined;
  };

  const failClosed = (status, reasonCode, message, extra = {}) =>
    scrubResult(
      {
        schemaVersion: 1,
        status,
        reasonCode,
        reason: String(message ?? ""),
        publicationAllowed: false,
        baselineSha: typeof candidate?.baselineSha === "string" ? candidate.baselineSha : undefined,
        completedAt: now(),
        ...extra
      },
      sensitiveValues
    );

  const branch = sanitizeBranch(runId);

  for (const adapterName of REQUIRED_ADAPTERS) {
    if (typeof adapters[adapterName] !== "function") {
      return failClosed(
        PUBLICATION_STATUS.CONFIG_ERROR,
        "missing-adapter",
        `adapter ${adapterName} is required`
      );
    }
  }
  if (!repository || typeof repository !== "object" || typeof repository.owner !== "string" || typeof repository.repo !== "string") {
    return failClosed(PUBLICATION_STATUS.CONFIG_ERROR, "invalid-repository", "repository must include owner and repo");
  }
  if (typeof runId !== "string" || runId.trim() === "") {
    return failClosed(PUBLICATION_STATUS.CONFIG_ERROR, "invalid-run-id", "runId must be a non-empty string");
  }

  // --- 1. Re-validate the candidate locally before ANY write. ---------------
  const candidateCheck = validatePublicationCandidate(candidate, { sensitiveValues });
  if (!candidateCheck.valid) {
    return failClosed(
      PUBLICATION_STATUS.INVALID_CANDIDATE,
      "invalid-candidate",
      candidateCheck.error ?? "publication candidate validation failed"
    );
  }
  const trusted = candidateCheck.result;
  const defaultBranch = repository.defaultBranch ?? "main";

  // --- 2. Re-read remote main; equal to baseline or fail closed. ------------
  let headOutcome;
  try {
    headOutcome = await adapters.readRemoteHead({ ref: defaultBranch });
  } catch (error) {
    return failClosed(
      PUBLICATION_STATUS.PUBLICATION_FAILED,
      "read-head-failed",
      errorMessage(error)
    );
  }
  if (!headOutcome || headOutcome.valid !== true) {
    return failClosed(
      PUBLICATION_STATUS.PUBLICATION_FAILED,
      "read-head-failed",
      headOutcome?.error ?? "could not read remote head"
    );
  }
  if (headOutcome.sha !== trusted.baselineSha) {
    return failClosed(
      PUBLICATION_STATUS.BASELINE_STALE,
      "baseline-stale",
      "remote main no longer equals the verified baseline; no rebase, merge, or model rerun is attempted"
    );
  }

  // --- 3. Create the isolated branch (bounded retry). -----------------------
  const branchOutcome = await withBoundedRetry(
    () => adapters.createBranch({ name: branch, baseSha: trusted.baselineSha }),
    "createBranch"
  );
  if (!branchOutcome.ok) {
    if (branchOutcome.code === "branch-exists") {
      return failClosed(
        PUBLICATION_STATUS.BRANCH_EXISTS,
        "branch-exists",
        `branch ${branch} already exists; failing closed without overwriting`,
        { branch }
      );
    }
    return failClosed(
      PUBLICATION_STATUS.PUBLICATION_FAILED,
      "create-branch-failed",
      branchOutcome.error,
      { branch }
    );
  }

  // --- 4. Create exactly one commit with the verified payload only. ---------
  const commitOutcome = await withBoundedRetry(
    () =>
      adapters.commit({
        branch,
        message: sanitizeTitle(trusted.findingTitle, sensitiveValues),
        regressionTest: {
          path: trusted.regressionTest.path,
          source: trusted.regressionTest.source
        },
        productionDiff: trusted.productionDiff
      }),
    "commit"
  );
  if (!commitOutcome.ok) {
    return failClosed(
      PUBLICATION_STATUS.PUBLICATION_FAILED,
      "commit-failed",
      commitOutcome.error,
      { branch }
    );
  }

  // --- 5. Push the branch (bounded retry). ----------------------------------
  const pushOutcome = await withBoundedRetry(() => adapters.push({ branch }), "push");
  if (!pushOutcome.ok) {
    // The branch may or may not exist remotely; attempt best-effort cleanup of
    // this run's branch so no orphan is left behind.
    const cleanup = await withBoundedRetry(() => adapters.deleteBranch({ name: branch }), "deleteBranch");
    const reason = `${pushOutcome.error ?? "push failed closed"}; branch ${branch} was not pushed`;
    return failClosed(PUBLICATION_STATUS.PUBLICATION_FAILED, "push-failed", reason, {
      branch,
      cleanupSucceeded: cleanup.ok === true
    });
  }

  // --- 6. Create the Draft PR (bounded retry). ------------------------------
  const prOutcome = await withBoundedRetry(
    () =>
      adapters.createPullRequest({
        title: sanitizeTitle(trusted.findingTitle, sensitiveValues),
        body: buildPullRequestBody(trusted, { runId, repository, sensitiveValues }),
        base: defaultBranch,
        head: branch,
        draft: true
      }),
    "createPullRequest"
  );
  if (prOutcome.ok) {
    return scrubResult(
      {
        schemaVersion: 1,
        status: PUBLICATION_STATUS.PUBLISHED,
        reasonCode: "published",
        reason: `draft PR created on ${defaultBranch}`,
        publicationAllowed: true,
        baselineSha: trusted.baselineSha,
        branch,
        pullRequest: {
          number: prOutcome.value?.number ?? undefined,
          url: prOutcome.value?.url ?? undefined,
          draft: true,
          base: defaultBranch
        },
        completedAt: now()
      },
      sensitiveValues
    );
  }

  // --- 7. Push succeeded but PR creation failed: clean up this run's branch.
  // Delete only the branch this run created; never touch other AI branches.
  const cleanup = await withBoundedRetry(() => adapters.deleteBranch({ name: branch }), "deleteBranch");
  if (cleanup.ok) {
    return failClosed(
      PUBLICATION_STATUS.CLEANED_UP,
      "publication-cleaned-up",
      `draft PR creation failed; deleted remote branch ${branch}`,
      { branch }
    );
  }
  return failClosed(
    PUBLICATION_STATUS.CLEANUP_FAILED,
    "cleanup-failed",
    `draft PR creation failed and remote branch ${branch} could not be deleted (orphan branch remains)`,
    { branch }
  );
}
