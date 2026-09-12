// =============================================================================
// scanner.mjs — Deterministic repository scanner for correctness discovery
// =============================================================================
import fs from "node:fs";
import path from "node:path";
import { isAllowlisted, isProtected } from "./policy.mjs";

export const DEFAULT_MAX_FILES = 200;
export const DEFAULT_MAX_BYTES_PER_FILE = 128 * 1024;
export const DEFAULT_MAX_TOTAL_BYTES = 2 * 1024 * 1024;
const HARD_MAX_FILES = 1000;
const HARD_MAX_BYTES_PER_FILE = 10 * 1024 * 1024;
const HARD_MAX_TOTAL_BYTES = 50 * 1024 * 1024;

// Control chars (except tab/LF/CR, which are legal in text) mark a file as
// binary. The class is intentionally explicit — it must match exactly these
// byte values, no \s shortcuts.
// eslint-disable-next-line no-control-regex
const BINARY_RE = /[\x00-\x08\x0E-\x1F]/;

function isTextFile(content) {
  return !BINARY_RE.test(content.slice(0, 8192));
}

export function normalizeRepositoryPath(filePath) {
  return String(filePath).replace(/\\/g, "/");
}

// ---------------------------------------------------------------------------
// validateScanOptions — rejects invalid or over-limit parameters
// ---------------------------------------------------------------------------
function validateScanOptions({
  maxFiles = DEFAULT_MAX_FILES,
  maxBytesPerFile = DEFAULT_MAX_BYTES_PER_FILE,
  maxTotalBytes = DEFAULT_MAX_TOTAL_BYTES
} = {}) {
  if (!Number.isFinite(maxFiles) || !Number.isInteger(maxFiles) || maxFiles < 1) {
    throw new Error(`maxFiles must be a positive integer; got ${JSON.stringify(maxFiles)}`);
  }
  if (maxFiles > HARD_MAX_FILES) {
    throw new Error(`maxFiles ${maxFiles} exceeds hard maximum ${HARD_MAX_FILES}`);
  }
  if (!Number.isFinite(maxBytesPerFile) || !Number.isInteger(maxBytesPerFile) || maxBytesPerFile < 1) {
    throw new Error(`maxBytesPerFile must be a positive integer; got ${JSON.stringify(maxBytesPerFile)}`);
  }
  if (maxBytesPerFile > HARD_MAX_BYTES_PER_FILE) {
    throw new Error(`maxBytesPerFile ${maxBytesPerFile} exceeds hard maximum ${HARD_MAX_BYTES_PER_FILE}`);
  }
  if (!Number.isFinite(maxTotalBytes) || !Number.isInteger(maxTotalBytes) || maxTotalBytes < 1) {
    throw new Error(`maxTotalBytes must be a positive integer; got ${JSON.stringify(maxTotalBytes)}`);
  }
  if (maxTotalBytes > HARD_MAX_TOTAL_BYTES) {
    throw new Error(`maxTotalBytes ${maxTotalBytes} exceeds hard maximum ${HARD_MAX_TOTAL_BYTES}`);
  }
}

// =============================================================================
// scanRepository
// =============================================================================
export function scanRepository({
  repoRoot,
  allowlist,
  protectedPaths,
  maxFiles = DEFAULT_MAX_FILES,
  maxBytesPerFile = DEFAULT_MAX_BYTES_PER_FILE,
  maxTotalBytes = DEFAULT_MAX_TOTAL_BYTES
} = {}) {
  if (!repoRoot) throw new Error("repoRoot is required");
  if (!fs.existsSync(repoRoot)) throw new Error(`repoRoot does not exist: ${repoRoot}`);

  validateScanOptions({ maxFiles, maxBytesPerFile, maxTotalBytes });

  const repoReal = fs.realpathSync(repoRoot);

  const candidates = [];
  const seenPaths = new Set();
  let protectedExcludedCount = 0;

  for (const pattern of allowlist) {
    if (!pattern.endsWith("/**") && !pattern.endsWith("/*") && !pattern.includes("*")) {
      // Exact file pattern
      const absPath = path.resolve(repoRoot, pattern);
      try {
        const real = fs.realpathSync(absPath);
        // Symlink containment: real path must be inside repo
        if (!real.startsWith(repoReal + path.sep) && real !== repoReal) continue;

        // Compute repoRoot-relative path from the symlink-resolved realpath.
        // On macOS /tmp → /private/tmp, path.relative(repoRoot, real) produces
        // a traversal path like "../../../private/tmp/...".  To normalize,
        // we compare against repoReal (the resolved repo root).
        const relPath = normalizeRepositoryPath(path.relative(repoReal, real));
        if (!relPath || relPath.startsWith("..")) continue;

        // The resolved path should still pass the allowlist (catches repo-internal
        // symlinks redirecting to non-allowlisted targets).
        if (!isAllowlisted(relPath, allowlist)) continue;

        // Protected check — patterns are written relative to repoRoot but
        // match against relPath (repoReal-relative).  The key invariant is
        // that both are consistent because walkDirectory also uses repoReal.
        if (isProtected(relPath, protectedPaths)) { protectedExcludedCount++; continue; }
        if (!seenPaths.has(relPath)) {
          try {
            if (fs.statSync(real).isFile()) {
              seenPaths.add(relPath);
              candidates.push({ relPath, fullPath: real });
            }
          } catch { /* skip */ }
        }
      } catch { /* skip nonexistent */ }
      continue;
    }

    const baseDir = pattern.endsWith("/**") ? pattern.slice(0, -3) : (pattern.endsWith("/*") ? pattern.slice(0, -2) : pattern);
    const absDir = path.resolve(repoRoot, baseDir);
    if (!fs.existsSync(absDir)) continue;
    const isFlat = pattern.endsWith("/*") || (!pattern.includes("**") && !pattern.includes("*"));
    try {
      const realDir = fs.realpathSync(absDir);
      if (!realDir.startsWith(repoReal + path.sep) && realDir !== repoReal) continue;

      const realBasePath = normalizeRepositoryPath(path.relative(repoReal, realDir));
      if (!realBasePath || realBasePath.startsWith("..")) continue;
      const requestedBasePath = normalizeRepositoryPath(baseDir);
      if (realBasePath !== requestedBasePath) continue;
      if (isProtected(realBasePath, protectedPaths)) {
        protectedExcludedCount++;
        continue;
      }

      walkDirectory(
        realDir,
        repoReal,
        allowlist,
        protectedPaths,
        seenPaths,
        candidates,
        isFlat,
        () => { protectedExcludedCount++; }
      );
    } catch { continue; }
  }

  candidates.sort((a, b) => a.relPath.localeCompare(b.relPath));

  const scannedFiles = [];
  let totalAccumulatedBytes = 0;
  const truncated = { maxFiles: false, maxBytesPerFile: false, maxTotalBytes: false };

  for (const c of candidates) {
    if (scannedFiles.length >= maxFiles) {
      truncated.maxFiles = true;
      break;
    }

    let content;
    try { content = fs.readFileSync(c.fullPath, "utf8"); } catch { continue; }
    if (!isTextFile(content)) continue;

    const byteSize = Buffer.byteLength(content, "utf8");
    let fileTruncated = false;

    if (byteSize > maxBytesPerFile) {
      const truncatedBuf = Buffer.from(content, "utf8").subarray(0, maxBytesPerFile);
      content = truncatedBuf.toString("utf8").replace(/�+$/, "");
      fileTruncated = true;
      truncated.maxBytesPerFile = true;
    }

    const contentBytes = Buffer.byteLength(content, "utf8");
    if (totalAccumulatedBytes + contentBytes > maxTotalBytes) {
      truncated.maxTotalBytes = true;
      break;
    }

    const lineCount = content.split("\n").length;
    const effectiveLines = content.endsWith("\n") ? Math.max(0, lineCount - 1) : lineCount;

    scannedFiles.push({
      path: c.relPath,
      content,
      lineCount: effectiveLines,
      byteSize: contentBytes,
      truncated: fileTruncated
    });

    totalAccumulatedBytes += contentBytes;
  }

  const manifest = scannedFiles.map(f => f.path);

  return {
    scannedFiles,
    manifest,
    stats: {
      totalFiles: scannedFiles.length,
      totalBytes: totalAccumulatedBytes,
      protectedExcluded: protectedExcludedCount
    },
    truncated
  };
}

function walkDirectory(absDir, repoReal, allowlist, protectedPaths, seenPaths, candidates, flat, onProtected) {
  let entries;
  try { entries = fs.readdirSync(absDir, { withFileTypes: true }); } catch { return; }

  for (const entry of entries) {
    if (entry.name.startsWith(".") || entry.name === "node_modules") continue;

    const entryPath = path.join(absDir, entry.name);

    let real;
    try { real = fs.realpathSync(entryPath); } catch { continue; }
    if (!real.startsWith(repoReal + path.sep) && real !== repoReal) continue;

    // Policy checks and manifest paths always use the canonical target path.
    // This prevents an allowlisted directory symlink from aliasing protected
    // or otherwise non-allowlisted content elsewhere inside the repository.
    const relPath = normalizeRepositoryPath(path.relative(repoReal, real));
    if (!relPath || relPath.startsWith("..")) continue;
    if (!isAllowlisted(relPath, allowlist)) continue;

    if (entry.isDirectory() && !flat) {
      walkDirectory(real, repoReal, allowlist, protectedPaths, seenPaths, candidates, false, onProtected);
      continue;
    }

    if (!entry.isFile()) continue;
    if (isProtected(relPath, protectedPaths)) { onProtected(); continue; }
    if (seenPaths.has(relPath)) continue;
    seenPaths.add(relPath);
    candidates.push({ relPath, fullPath: real });
  }
}
