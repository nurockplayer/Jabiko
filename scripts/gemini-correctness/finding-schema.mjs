// =============================================================================
// finding-schema.mjs — Deterministic validation of Gemini correctness findings
// =============================================================================
//
// Validates a raw finding input against the contract schema.  Returns
// { valid, result?, error? }.  This is the ONLY place that interprets the
// finding schema — neither the prompt nor Gemini's output should bypass it.
//
// The validator rejects unknown fields, unsupported versions, out-of-range
// confidence, non-low risk, path traversal, protected paths, and anything
// that doesn't match the "one finding per response" rule.
// =============================================================================

import { isPathSafe, isProtected, isAllowlisted, isValidRegressionTest, resolveProductionDir, getDefaultAllowlist, getDefaultProtectedPaths } from "./policy.mjs";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
export const SUPPORTED_SCHEMA_VERSIONS = [1];
export const DEFAULT_CONFIDENCE_THRESHOLD = 0.8;
export const FINDING_CATEGORIES = [
  "boundary-condition",
  "state-transition",
  "null-empty-input",
  "off-by-one",
  "stale-state",
  "error-fallback",
  "logic-error"
];
const ALLOWED_RISK_VALUES = ["low"];
const ALLOWED_STATUSES = ["finding", "no-finding"];

const NO_FINDING_ALLOWED_KEYS = ["schemaVersion", "status", "reason"];
const FINDING_REQUIRED_KEYS = [
  "schemaVersion", "status", "title", "confidence", "category",
  "evidence", "expectedBehavior", "actualBehavior", "reproduction",
  "productionFiles", "risk"
];
const EVIDENCE_REQUIRED_KEYS = ["file", "startLine", "endLine", "reason"];
const REPRODUCTION_REQUIRED_KEYS = ["testFile", "testName"];

const REGRESSION_TEST_RE = /\.regression\.test\.tsx?$/;

// ---------------------------------------------------------------------------
// validateFinding
// ---------------------------------------------------------------------------
export function validateFinding(input, options = {}) {
  const threshold = options.confidenceThreshold ?? DEFAULT_CONFIDENCE_THRESHOLD;
  const allowlist = options.allowlist ?? getDefaultAllowlist();
  const protectedPaths = options.protectedPaths ?? getDefaultProtectedPaths();

  // --- 1.  Input must be a non-null object (not array) ----------------------
  if (input === null || input === undefined) {
    return { valid: false, error: "input is null or undefined" };
  }
  if (typeof input === "string") {
    return { valid: false, error: "input is a raw string; JSON parsing must happen before validation" };
  }
  if (typeof input !== "object" || Array.isArray(input)) {
    return { valid: false, error: "input is not a plain object" };
  }

  const obj = input;

  // --- 2.  schemaVersion ----------------------------------------------------
  if (typeof obj.schemaVersion !== "number" || !Number.isInteger(obj.schemaVersion) || obj.schemaVersion < 1) {
    return { valid: false, error: `schemaVersion must be a positive integer; got ${JSON.stringify(obj.schemaVersion)}` };
  }
  if (!SUPPORTED_SCHEMA_VERSIONS.includes(obj.schemaVersion)) {
    return { valid: false, error: `unsupported schemaVersion ${obj.schemaVersion}; supported: ${SUPPORTED_SCHEMA_VERSIONS.join(", ")}` };
  }

  // --- 3.  status -----------------------------------------------------------
  if (!ALLOWED_STATUSES.includes(obj.status)) {
    return { valid: false, error: `status must be one of ${ALLOWED_STATUSES.join(", ")}; got ${JSON.stringify(obj.status)}` };
  }

  // --- 4a.  No-finding path -------------------------------------------------
  if (obj.status === "no-finding") {
    const keys = Object.keys(obj);
    const extra = keys.filter(k => !NO_FINDING_ALLOWED_KEYS.includes(k));
    if (extra.length > 0) {
      return { valid: false, error: `no-finding must only have keys [${NO_FINDING_ALLOWED_KEYS.join(", ")}]; extra: ${extra.join(", ")}` };
    }
    if (typeof obj.reason !== "string" || obj.reason.trim() === "") {
      return { valid: false, error: "no-finding must have a non-empty reason string" };
    }
    return { valid: true, result: { schemaVersion: obj.schemaVersion, status: "no-finding", reason: obj.reason } };
  }

  // --- 4b.  Finding path ----------------------------------------------------
  // --- 4b-i.   Unknown fields guard -----------------------------------------
  const findingKeys = Object.keys(obj);
  const extraKeys = findingKeys.filter(k => !FINDING_REQUIRED_KEYS.includes(k));
  if (extraKeys.length > 0) {
    return { valid: false, error: `unknown fields: ${extraKeys.join(", ")}` };
  }

  // --- 4b-ii.  Required fields present --------------------------------------
  for (const k of FINDING_REQUIRED_KEYS) {
    if (obj[k] === undefined || obj[k] === null) {
      return { valid: false, error: `missing required field: ${k}` };
    }
  }

  // --- 4b-iii.  Title -------------------------------------------------------
  if (typeof obj.title !== "string" || obj.title.trim() === "") {
    return { valid: false, error: "title must be a non-empty string" };
  }

  // --- 4b-iv.  Confidence ---------------------------------------------------
  const conf = obj.confidence;
  if (typeof conf !== "number" || !Number.isFinite(conf)) {
    return { valid: false, error: "confidence must be a finite number" };
  }
  if (conf < 0) {
    return { valid: false, error: `confidence ${conf} is negative; must be >= 0` };
  }
  if (conf > 1) {
    return { valid: false, error: `confidence ${conf} exceeds 1` };
  }
  if (conf < threshold) {
    return { valid: false, error: `confidence ${conf} is below threshold ${threshold}` };
  }

  // Validate threshold itself (if customised via options)
  if (threshold !== undefined && threshold !== null) {
    if (typeof threshold !== "number" || !Number.isFinite(threshold)) {
      return { valid: false, error: `confidenceThreshold must be a finite number; got ${typeof threshold === "number" ? String(threshold) : typeof threshold}` };
    }
    if (threshold < 0 || threshold > 1) {
      return { valid: false, error: `confidenceThreshold ${threshold} must be in [0, 1]` };
    }
  }

  // --- 4b-v.  Category ------------------------------------------------------
  if (!FINDING_CATEGORIES.includes(obj.category)) {
    return { valid: false, error: `unknown category "${obj.category}"; must be one of ${FINDING_CATEGORIES.join(", ")}` };
  }

  // --- 4b-vi.  Risk ---------------------------------------------------------
  if (!ALLOWED_RISK_VALUES.includes(obj.risk)) {
    return { valid: false, error: `risk must be one of ${ALLOWED_RISK_VALUES.join(", ")}; got "${obj.risk}"` };
  }

  // --- 4b-vii.  Evidence ----------------------------------------------------
  if (!Array.isArray(obj.evidence) || obj.evidence.length === 0) {
    return { valid: false, error: "evidence must be a non-empty array" };
  }

  for (let i = 0; i < obj.evidence.length; i++) {
    const ev = obj.evidence[i];
    if (typeof ev !== "object" || ev === null || Array.isArray(ev)) {
      return { valid: false, error: `evidence[${i}] must be an object` };
    }

    const evKeys = Object.keys(ev);
    const evExtra = evKeys.filter(k => !EVIDENCE_REQUIRED_KEYS.includes(k));
    if (evExtra.length > 0) {
      return { valid: false, error: `evidence[${i}] has unknown fields: ${evExtra.join(", ")}` };
    }

    for (const k of EVIDENCE_REQUIRED_KEYS) {
      if (ev[k] === undefined || ev[k] === null) {
        return { valid: false, error: `evidence[${i}] missing required field: ${k}` };
      }
    }

    if (typeof ev.file !== "string" || ev.file.trim() === "") {
      return { valid: false, error: `evidence[${i}].file must be a non-empty string` };
    }
    if (!isPathSafe(ev.file, [])) {
      return { valid: false, error: `evidence[${i}].file "${ev.file}" is not a safe relative path` };
    }
    if (isProtected(ev.file, protectedPaths)) {
      return { valid: false, error: `evidence[${i}].file "${ev.file}" is a protected path` };
    }

    if (typeof ev.startLine !== "number" || !Number.isInteger(ev.startLine) || ev.startLine < 1) {
      return { valid: false, error: `evidence[${i}].startLine must be a positive integer` };
    }
    if (typeof ev.endLine !== "number" || !Number.isInteger(ev.endLine) || ev.endLine < 1) {
      return { valid: false, error: `evidence[${i}].endLine must be a positive integer` };
    }
    if (ev.endLine < ev.startLine) {
      return { valid: false, error: `evidence[${i}].endLine (${ev.endLine}) < startLine (${ev.startLine})` };
    }
    if (typeof ev.reason !== "string" || ev.reason.trim() === "") {
      return { valid: false, error: `evidence[${i}].reason must be a non-empty string` };
    }
  }

  // --- 4b-viii.  Single-root-cause check ------------------------------------
  // If evidence items reference different files, it's likely multiple bugs.
  const evidenceFiles = new Set(obj.evidence.map(ev => ev.file));
  if (evidenceFiles.size > 1) {
    return { valid: false, error: `evidence references multiple files: [${[...evidenceFiles].join(", ")}]; must be a single root cause` };
  }

  // --- 4b-ix.  expectedBehavior / actualBehavior ----------------------------
  if (typeof obj.expectedBehavior !== "string" || obj.expectedBehavior.trim() === "") {
    return { valid: false, error: "expectedBehavior must be a non-empty string" };
  }
  if (typeof obj.actualBehavior !== "string" || obj.actualBehavior.trim() === "") {
    return { valid: false, error: "actualBehavior must be a non-empty string" };
  }

  // --- 4b-x.  Production files ----------------------------------------------
  if (!Array.isArray(obj.productionFiles) || obj.productionFiles.length === 0) {
    return { valid: false, error: "productionFiles must be a non-empty array" };
  }
  for (let i = 0; i < obj.productionFiles.length; i++) {
    const pf = obj.productionFiles[i];
    if (typeof pf !== "string" || pf.trim() === "") {
      return { valid: false, error: `productionFiles[${i}] must be a non-empty string` };
    }
    if (!isPathSafe(pf, [])) {
      return { valid: false, error: `productionFiles[${i}] "${pf}" is not a safe relative path` };
    }
    if (isProtected(pf, protectedPaths)) {
      return { valid: false, error: `productionFiles[${i}] "${pf}" is a protected path` };
    }
    if (!isAllowlisted(pf, allowlist)) {
      return { valid: false, error: `productionFiles[${i}] "${pf}" is outside the allowlist` };
    }
  }

  // --- 4b-xi.  Reproduction test -------------------------------------------
  const rep = obj.reproduction;
  if (typeof rep !== "object" || rep === null || Array.isArray(rep)) {
    return { valid: false, error: "reproduction must be an object" };
  }
  const repKeys = Object.keys(rep);
  const repExtra = repKeys.filter(k => !REPRODUCTION_REQUIRED_KEYS.includes(k));
  if (repExtra.length > 0) {
    return { valid: false, error: `reproduction has unknown fields: ${repExtra.join(", ")}` };
  }
  for (const k of REPRODUCTION_REQUIRED_KEYS) {
    if (rep[k] === undefined || rep[k] === null) {
      return { valid: false, error: `reproduction missing required field: ${k}` };
    }
  }
  if (typeof rep.testFile !== "string" || rep.testFile.trim() === "") {
    return { valid: false, error: "reproduction.testFile must be a non-empty string" };
  }
  if (!isPathSafe(rep.testFile, [])) {
    return { valid: false, error: `reproduction.testFile "${rep.testFile}" is not a safe relative path` };
  }
  if (isProtected(rep.testFile, protectedPaths)) {
    return { valid: false, error: `reproduction.testFile "${rep.testFile}" is a protected path` };
  }
  if (!REGRESSION_TEST_RE.test(rep.testFile)) {
    return { valid: false, error: `reproduction.testFile "${rep.testFile}" must end with .regression.test.ts or .regression.test.tsx` };
  }
  if (typeof rep.testName !== "string" || rep.testName.trim() === "") {
    return { valid: false, error: "reproduction.testName must be a non-empty string" };
  }

  // Validate test co-location: test must be in same dir as first production file
  if (obj.productionFiles.length > 0) {
    const prodDir = resolveProductionDir(obj.productionFiles[0]);
    const testDir = resolveProductionDir(rep.testFile);
    if (testDir !== prodDir) {
      return { valid: false, error: `reproduction.testFile "${rep.testFile}" is not in the same directory as production file "${obj.productionFiles[0]}"` };
    }
  }

  // --- 5.  All checks passed ------------------------------------------------
  return { valid: true, result: { ...obj } };
}
