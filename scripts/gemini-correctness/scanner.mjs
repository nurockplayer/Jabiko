// =============================================================================
// scanner.mjs — Deterministic repository scanner for correctness discovery
// =============================================================================
//
// Enumerates allowlisted source/test files, excludes protected paths,
// validates filesystem containment (realpath, symlink escape), reads
// regular UTF-8 text files with content, and enforces hard size limits.
//
// The scan result is fully deterministic: same repo + same config =
// same output order and same content.
// =============================================================================

import fs from "node:fs";
import path from "node:path";

// ---------------------------------------------------------------------------
// Hard defaults (CLI options cannot exceed these)
// ---------------------------------------------------------------------------
export const DEFAULT_MAX_FILES = 200;
export const DEFAULT_MAX_BYTES_PER_FILE = 128 * 1024; // 128 KiB
export const DEFAULT_MAX_TOTAL_BYTES = 2 * 1024 * 1024; // 2 MiB

const BINARY_RE = /[\x00-\x08\x0E-\x1F]/; // Detect null / control chars

// ---------------------------------------------------------------------------
// isTextFile — quick heuristic: reject files with null bytes or heavy control
// chars in the first 8 KiB.
// ---------------------------------------------------------------------------
function isTextFile(content) {
  return !BINARY_RE.test(content.slice(0, 8192));
}

// ---------------------------------------------------------------------------
// isProtected — inline version so scanner doesn't import policy circularly
// ---------------------------------------------------------------------------
function isProtectedPath(filePath, protectedPaths) {
  if (!filePath) return true;
  const normalized = filePath.replace(/\\/g, "/");
  for (const pp of protectedPaths) {
    const cleanDir = pp.replace(/\/+$/, "");
    if (pp.endsWith("/")) {
      if (normalized.startsWith(pp) || normalized === cleanDir || normalized.startsWith(cleanDir + "/")) return true;
    } else if (pp.startsWith(".")) {
      if (normalized === pp || normalized.startsWith(pp + ".") || normalized.startsWith(pp + "/")) return true;
    } else {
      if (normalized === pp || normalized.startsWith(pp + "/")) return true;
    }
  }
  return false;
}

// ---------------------------------------------------------------------------
// matchGlob — simple glob match for allowlist patterns
// ---------------------------------------------------------------------------
function matchGlob(filePath, patterns) {
  const normalized = filePath.replace(/\\/g, "/");
  for (const pattern of patterns) {
    if (pattern.endsWith("/**")) {
      const dir = pattern.slice(0, -3);
      if (normalized === dir || normalized.startsWith(dir + "/")) return true;
    } else if (pattern.endsWith("/*")) {
      const dir = pattern.slice(0, -2);
      if (normalized.startsWith(dir + "/") && !normalized.slice(dir.length + 1).includes("/")) return true;
    } else {
      if (normalized === pattern) return true;
    }
  }
  return false;
}

// ---------------------------------------------------------------------------
// scanRepository — main entry point
// ---------------------------------------------------------------------------
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

  const repoReal = fs.realpathSync(repoRoot);

  // Collect candidate files by walking the allowlist directories recursively
  const candidates = [];
  const seenPaths = new Set();

  for (const pattern of allowlist) {
    if (!pattern.endsWith("/**") && !pattern.endsWith("/*") && !pattern.includes("*")) {
      // Exact file pattern
      const absPath = path.resolve(repoRoot, pattern);
      try {
        const real = fs.realpathSync(absPath);
        const relPath = path.relative(repoRoot, real);
        if (real.startsWith(repoReal + path.sep) || real === repoReal) {
          if (!seenPaths.has(relPath) && !isProtectedPath(relPath, protectedPaths)) {
            try {
              const stat = fs.statSync(real);
              if (stat.isFile()) {
                seenPaths.add(relPath);
                candidates.push({ relPath, fullPath: real });
              }
            } catch { /* skip unreadable */ }
          }
        }
      } catch { /* skip nonexistent */ }
      continue;
    }

    // Directory-based pattern
    const baseDir = pattern.endsWith("/**") ? pattern.slice(0, -3) : (pattern.endsWith("/*") ? pattern.slice(0, -2) : pattern);
    const absDir = path.resolve(repoRoot, baseDir);

    if (!fs.existsSync(absDir)) continue;

    const isFlat = pattern.endsWith("/*") || (!pattern.includes("**") && !pattern.includes("*"));

    // Walk the directory
    try {
      walkDirectory(absDir, repoRoot, repoReal, protectedPaths, seenPaths, candidates, isFlat);
    } catch {
      continue;
    }
  }

  // Stable sort by relative path
  candidates.sort((a, b) => a.relPath.localeCompare(b.relPath));

  const scannedFiles = [];
  let totalAccumulated = 0;
  const truncated = { maxFiles: false, maxBytesPerFile: false, maxTotalBytes: false };

  for (const c of candidates) {
    if (scannedFiles.length >= maxFiles) {
      truncated.maxFiles = true;
      break;
    }

    // Read file content
    let content;
    try {
      content = fs.readFileSync(c.fullPath, "utf8");
    } catch {
      continue;
    }

    // Reject binary content
    if (!isTextFile(content)) continue;

    const byteSize = Buffer.byteLength(content, "utf8");
    let fileTruncated = false;

    // Per-file size limit
    if (byteSize > maxBytesPerFile) {
      content = content.slice(0, maxBytesPerFile);
      fileTruncated = true;
      truncated.maxBytesPerFile = true;
    }

    // Total size limit — if adding this file would exceed, stop
    if (totalAccumulated + content.length > maxTotalBytes) {
      truncated.maxTotalBytes = true;
      break;
    }

    const lineCount = content.split("\n").length;
    const effectiveLines = content.endsWith("\n") ? Math.max(0, lineCount - 1) : lineCount;

    scannedFiles.push({
      path: c.relPath,
      content,
      lineCount: effectiveLines,
      byteSize,
      truncated: fileTruncated
    });

    totalAccumulated += content.length;
  }

  const manifest = scannedFiles.map(f => f.path);

  return {
    scannedFiles,
    manifest,
    stats: {
      totalFiles: scannedFiles.length,
      totalBytes: totalAccumulated,
      protectedExcluded: 0 // Placeholder; exact count requires scanning all files
    },
    truncated
  };
}

// ---------------------------------------------------------------------------
// walkDirectory — recursive directory traversal
// ---------------------------------------------------------------------------
function walkDirectory(absDir, repoRoot, repoReal, protectedPaths, seenPaths, candidates, flat) {
  let entries;
  try {
    entries = fs.readdirSync(absDir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    // Skip hidden files and node_modules
    if (entry.name.startsWith(".") || entry.name === "node_modules") continue;

    const entryPath = path.join(absDir, entry.name);
    const relPath = path.relative(repoRoot, entryPath);

    // Reject traversal
    if (!relPath || relPath.startsWith("..")) continue;

    // Resolve realpath for containment check
    let real;
    try {
      real = fs.realpathSync(entryPath);
    } catch {
      continue;
    }
    if (!real.startsWith(repoReal + path.sep) && real !== repoReal) continue;

    if (entry.isDirectory() && !flat) {
      walkDirectory(entryPath, repoRoot, repoReal, protectedPaths, seenPaths, candidates, false);
      continue;
    }

    if (!entry.isFile()) continue;

    // Skip protected paths
    if (isProtectedPath(relPath, protectedPaths)) continue;

    // Skip duplicates
    if (seenPaths.has(relPath)) continue;
    seenPaths.add(relPath);

    candidates.push({ relPath, fullPath: real });
  }
}
