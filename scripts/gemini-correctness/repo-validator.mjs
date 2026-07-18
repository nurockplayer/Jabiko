// =============================================================================
// repo-validator.mjs — Repository-aware semantic validation for findings
// =============================================================================
//
// This is the SECOND validation layer, running AFTER the pure JSON schema
// validator (finding-schema.mjs).  It checks:
//
//   - evidence.file exists, is a regular file, is within the repo
//   - evidence startLine/endLine are within the actual file line count
//   - productionFiles exist, are regular files, are allowlisted and not protected
//   - evidence files appear in the scanned manifest (Gemini only saw what we gave it)
//   - reproduction.testFile parent directory exists and matches production file dir
//
// All checks fail-closed on any fs error.
// =============================================================================

import fs from "node:fs";
import path from "node:path";
import { getDefaultAllowlist, getDefaultProtectedPaths } from "./policy.mjs";

// ---------------------------------------------------------------------------
// resolveFile
// ---------------------------------------------------------------------------
function resolveFile(filePath, repoRoot) {
  try {
    const repoResolved = fs.realpathSync(repoRoot);
    const candidate = path.resolve(repoRoot, filePath);

    // Resolve symlinks for the candidate too (handles /tmp -> /private/tmp)
    const real = fs.realpathSync(candidate);

    // Must be inside resolved repo root or equal to it
    if (real === repoResolved) return real;
    if (real.startsWith(repoResolved + path.sep)) return real;

    return null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// validateEvidenceExists
// ---------------------------------------------------------------------------
export function validateEvidenceExists(filePath, repoRoot) {
  const real = resolveFile(filePath, repoRoot);
  if (!real) return { valid: false, error: `evidence file does not exist or is outside repo: ${filePath}` };

  try {
    const stat = fs.statSync(real);
    if (!stat.isFile()) {
      return { valid: false, error: `evidence file is not a regular file: ${filePath}` };
    }
  } catch {
    return { valid: false, error: `cannot stat evidence file: ${filePath}` };
  }

  return { valid: true };
}

// ---------------------------------------------------------------------------
// validateEvidenceLines
// ---------------------------------------------------------------------------
export function validateEvidenceLines(filePath, startLine, endLine, repoRoot) {
  const real = resolveFile(filePath, repoRoot);
  if (!real) return { valid: false, error: `evidence file not found for line check: ${filePath}` };

  let content;
  try {
    content = fs.readFileSync(real, "utf8");
  } catch {
    return { valid: false, error: `cannot read evidence file: ${filePath}` };
  }

  const lineCount = content.split("\n").length;
  // Remove trailing empty line if file ends with newline
  const effectiveLines = content.endsWith("\n") ? lineCount - 1 : lineCount;

  if (startLine < 1) {
    return { valid: false, error: `startLine ${startLine} < 1` };
  }
  if (endLine < startLine) {
    return { valid: false, error: `endLine ${endLine} < startLine ${startLine}` };
  }
  if (endLine > effectiveLines) {
    return { valid: false, error: `endLine ${endLine} exceeds file line count ${effectiveLines} in ${filePath}` };
  }
  if (startLine > effectiveLines) {
    return { valid: false, error: `startLine ${startLine} exceeds file line count ${effectiveLines} in ${filePath}` };
  }

  return { valid: true };
}

// ---------------------------------------------------------------------------
// validateProductionFileExists
// ---------------------------------------------------------------------------
export function validateProductionFileExists(filePath, repoRoot, allowlist, protectedPaths) {
  const real = resolveFile(filePath, repoRoot);
  if (!real) return { valid: false, error: `production file does not exist or is outside repo: ${filePath}` };

  try {
    const stat = fs.statSync(real);
    if (!stat.isFile()) {
      return { valid: false, error: `production file is not a regular file: ${filePath}` };
    }
  } catch {
    return { valid: false, error: `cannot stat production file: ${filePath}` };
  }

  // Check allowlist
  const allowlistCheck = getDefaultAllowlist();
  const paths = allowlist ?? allowlistCheck;
  const normalized = filePath.replace(/\\/g, "/");

  let isAllowed = false;
  for (const pattern of paths) {
    if (pattern.endsWith("/**")) {
      const dir = pattern.slice(0, -3);
      if (normalized === dir || normalized.startsWith(dir + "/")) { isAllowed = true; break; }
    } else if (pattern.endsWith("/*")) {
      const dir = pattern.slice(0, -2);
      if (normalized.startsWith(dir + "/") && !normalized.slice(dir.length + 1).includes("/")) { isAllowed = true; break; }
    } else {
      if (normalized === pattern) { isAllowed = true; break; }
    }
  }
  if (!isAllowed) {
    return { valid: false, error: `production file is outside allowlist: ${filePath}` };
  }

  // Check protected
  const protectCheck = getDefaultProtectedPaths();
  const protPaths = protectedPaths ?? protectCheck;
  for (const pp of protPaths) {
    const cleanDir = pp.replace(/\/+$/, "");
    if (pp.endsWith("/")) {
      if (normalized.startsWith(pp)) return { valid: false, error: `production file is protected: ${filePath}` };
      if (normalized === cleanDir) return { valid: false, error: `production file is protected: ${filePath}` };
      if (normalized.startsWith(cleanDir + "/")) return { valid: false, error: `production file is protected: ${filePath}` };
    } else if (pp.startsWith(".")) {
      if (normalized === pp) return { valid: false, error: `production file is protected: ${filePath}` };
      if (normalized.startsWith(pp + ".")) return { valid: false, error: `production file is protected: ${filePath}` };
      if (normalized.startsWith(pp + "/")) return { valid: false, error: `production file is protected: ${filePath}` };
    } else {
      if (normalized === pp) return { valid: false, error: `production file is protected: ${filePath}` };
    }
  }

  return { valid: true };
}

// ---------------------------------------------------------------------------
// validateReproductionParentDir
// ---------------------------------------------------------------------------
export function validateReproductionParentDir(testFile, productionFile, repoRoot) {
  const normTest = testFile.replace(/\\/g, "/");
  const normProd = productionFile.replace(/\\/g, "/");
  const testDir = path.posix.dirname(normTest);
  const prodDir = path.posix.dirname(normProd);

  // Must be same directory
  if (testDir !== prodDir) {
    return { valid: false, error: `reproduction test dir "${testDir}" differs from production dir "${prodDir}"` };
  }

  // Parent directory must exist in repo
  const absTestDir = path.resolve(repoRoot, testDir);
  try {
    const stat = fs.statSync(absTestDir);
    if (!stat.isDirectory()) {
      return { valid: false, error: `reproduction parent dir is not a directory: ${testDir}` };
    }
  } catch {
    return { valid: false, error: `reproduction parent dir does not exist: ${testDir}` };
  }

  return { valid: true };
}

// ---------------------------------------------------------------------------
// isFileInManifest
// ---------------------------------------------------------------------------
export function isFileInManifest(filePath, manifest) {
  return manifest.includes(filePath.replace(/\\/g, "/"));
}

// ---------------------------------------------------------------------------
// validateFindingWithRepo — runs all repo-aware checks on a parsed finding
// ---------------------------------------------------------------------------
export function validateFindingWithRepo(finding, { repoRoot, manifest, allowlist, protectedPaths } = {}) {
  // For no-finding, no file validation needed
  if (finding.status === "no-finding") {
    return { valid: true };
  }

  // Check evidence files
  for (let i = 0; i < finding.evidence.length; i++) {
    const ev = finding.evidence[i];

    // Evidence file must be in the scanned manifest
    if (!isFileInManifest(ev.file, manifest)) {
      return { valid: false, error: `evidence[${i}].file "${ev.file}" was not in the scanned manifest; Gemini cannot reference unseen files` };
    }

    const exists = validateEvidenceExists(ev.file, repoRoot);
    if (!exists.valid) return exists;

    const lines = validateEvidenceLines(ev.file, ev.startLine, ev.endLine, repoRoot);
    if (!lines.valid) return lines;
  }

  // Check production files
  for (let i = 0; i < finding.productionFiles.length; i++) {
    const pf = finding.productionFiles[i];

    if (!isFileInManifest(pf, manifest)) {
      return { valid: false, error: `productionFiles[${i}] "${pf}" was not in the scanned manifest` };
    }

    const exists = validateProductionFileExists(pf, repoRoot, allowlist, protectedPaths);
    if (!exists.valid) return exists;
  }

  // Check reproduction test parent dir
  if (finding.productionFiles.length > 0) {
    const rep = finding.reproduction;
    const parentCheck = validateReproductionParentDir(rep.testFile, finding.productionFiles[0], repoRoot);
    if (!parentCheck.valid) return parentCheck;
  }

  return { valid: true };
}
