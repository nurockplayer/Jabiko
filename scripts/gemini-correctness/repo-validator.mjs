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
// Path security rules (isProtected, isAllowlisted) are imported from policy.mjs.
// Do NOT duplicate path-matching logic here.
// =============================================================================

import fs from "node:fs";
import path from "node:path";
import { isAllowlisted, isProductionFilePath, isProtected } from "./policy.mjs";

// ---------------------------------------------------------------------------
// resolveFile
// ---------------------------------------------------------------------------
function resolveFile(filePath, repoRoot) {
  try {
    const repoResolved = fs.realpathSync(repoRoot);
    const candidate = path.resolve(repoRoot, filePath);

    // Resolve symlinks for the candidate
    const real = fs.realpathSync(candidate);

    // Must be inside resolved repo root and must resolve to the same canonical
    // repository path that the scanner placed in the manifest. This rejects
    // repo-internal symlink aliases and symlink swaps after scanning.
    if (!real.startsWith(repoResolved + path.sep)) return null;
    const repoPath = path.relative(repoResolved, real).replace(/\\/g, "/");
    const requestedPath = String(filePath).replace(/\\/g, "/");
    if (!repoPath || repoPath.startsWith("..") || repoPath !== requestedPath) return null;

    return { real, repoPath };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// validateEvidenceExists
// ---------------------------------------------------------------------------
export function validateEvidenceExists(filePath, repoRoot) {
  const resolved = resolveFile(filePath, repoRoot);
  if (!resolved) return { valid: false, error: `evidence file does not exist or is outside repo: ${filePath}` };

  try {
    const stat = fs.statSync(resolved.real);
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
export function validateEvidenceLines(filePath, startLine, endLine, repoRoot, { visibleLineCount } = {}) {
  const resolved = resolveFile(filePath, repoRoot);
  if (!resolved) return { valid: false, error: `evidence file not found for line check: ${filePath}` };

  let content;
  try {
    content = fs.readFileSync(resolved.real, "utf8");
  } catch {
    return { valid: false, error: `cannot read evidence file: ${filePath}` };
  }

  // Use visibleLineCount when provided (file was truncated in scanner)
  // Otherwise compute from actual file content.
  const effectiveLines = visibleLineCount != null
    ? visibleLineCount
    : (() => {
        const lineCount = content.split("\n").length;
        return content.endsWith("\n") ? lineCount - 1 : lineCount;
      })();

  if (startLine < 1) {
    return { valid: false, error: `startLine ${startLine} < 1` };
  }
  if (endLine < startLine) {
    return { valid: false, error: `endLine ${endLine} < startLine ${startLine}` };
  }
  if (endLine > effectiveLines) {
    return { valid: false, error: `endLine ${endLine} exceeds visible line count ${effectiveLines} in ${filePath} (file was truncated; Gemini only saw ${effectiveLines} lines)` };
  }
  if (startLine > effectiveLines) {
    return { valid: false, error: `startLine ${startLine} exceeds visible line count ${effectiveLines} in ${filePath} (file was truncated; Gemini only saw ${effectiveLines} lines)` };
  }

  return { valid: true };
}

// ---------------------------------------------------------------------------
// validateProductionFileExists
// ---------------------------------------------------------------------------
export function validateProductionFileExists(filePath, repoRoot, allowlist, protectedPaths) {
  if (!isProductionFilePath(filePath)) {
    return { valid: false, error: `production file is a test file: ${filePath}` };
  }

  const resolved = resolveFile(filePath, repoRoot);
  if (!resolved) return { valid: false, error: `production file does not exist or is outside repo: ${filePath}` };

  try {
    const stat = fs.statSync(resolved.real);
    if (!stat.isFile()) {
      return { valid: false, error: `production file is not a regular file: ${filePath}` };
    }
  } catch {
    return { valid: false, error: `cannot stat production file: ${filePath}` };
  }

  // Check allowlist (uses canonical isAllowlisted from policy.mjs)
  if (!isAllowlisted(resolved.repoPath, allowlist)) {
    return { valid: false, error: `production file is outside allowlist: ${filePath}` };
  }

  // Check protected (uses canonical isProtected from policy.mjs)
  if (isProtected(resolved.repoPath, protectedPaths)) {
    return { valid: false, error: `production file is protected: ${filePath}` };
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
//
// visibleLineCount comes from scannedFiles metadata, NOT from the finding.
// Each evidence file's visible line count is looked up by matching the
// evidence file path against the scannedFile entries provided by the scanner.
// =============================================================================
export function validateFindingWithRepo(finding, { repoRoot, manifest, allowlist, protectedPaths, scannedFiles } = {}) {
  // For no-finding, no file validation needed
  if (finding.status === "no-finding") {
    return { valid: true };
  }

  // Build a lookup from scanned file path → metadata
  const fileMeta = new Map();
  const hasScannerMetadata = Array.isArray(scannedFiles);
  if (hasScannerMetadata) {
    for (const sf of scannedFiles) {
      fileMeta.set(String(sf.path).replace(/\\/g, "/"), sf);
    }
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

    // visibleLineCount comes from scanner metadata, NOT from ev.visibleLineCount
    const meta = fileMeta.get(String(ev.file).replace(/\\/g, "/"));
    if (hasScannerMetadata && !meta) {
      return {
        valid: false,
        error: `evidence[${i}].file "${ev.file}" is missing scanner metadata for visible line validation`
      };
    }
    const vl = meta ? meta.lineCount : undefined;

    const lines = validateEvidenceLines(ev.file, ev.startLine, ev.endLine, repoRoot, { visibleLineCount: vl });
    if (!lines.valid) return lines;
  }

  // Check production files
  for (let i = 0; i < (finding.productionFiles || []).length; i++) {
    const pf = finding.productionFiles[i];
    if (!isFileInManifest(pf, manifest)) {
      return { valid: false, error: `productionFiles[${i}] "${pf}" was not in the scanned manifest` };
    }
    const exists = validateProductionFileExists(pf, repoRoot, allowlist, protectedPaths);
    if (!exists.valid) return exists;
  }

  // Check reproduction test parent dir
  if (finding.productionFiles && finding.productionFiles.length > 0) {
    const rep = finding.reproduction;
    if (!rep) return { valid: false, error: "reproduction is required" };
    const parentCheck = validateReproductionParentDir(rep.testFile, finding.productionFiles[0], repoRoot);
    if (!parentCheck.valid) return parentCheck;
  }

  return { valid: true };
}
