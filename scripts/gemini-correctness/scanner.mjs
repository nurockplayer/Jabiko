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
//
// Path security rules are imported from policy.mjs — this is the ONLY
// source of isProtected/isAllowlisted logic.
// =============================================================================

import fs from "node:fs";
import path from "node:path";
import { isAllowlisted, isProtected, isPathSafe } from "./policy.mjs";

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
        if ((real.startsWith(repoReal + path.sep) || real === repoReal) && !isAllowlisted(relPath, allowlist)) {
          continue;
        }
        if (isProtected(relPath, protectedPaths)) continue;
        if (!seenPaths.has(relPath)) {
          try {
            const stat = fs.statSync(real);
            if (stat.isFile()) {
              seenPaths.add(relPath);
              candidates.push({ relPath, fullPath: real });
            }
          } catch { /* skip unreadable */ }
        }
      } catch { /* skip nonexistent */ }
      continue;
    }

    // Directory-based pattern
    const baseDir = pattern.endsWith("/**") ? pattern.slice(0, -3) : (pattern.endsWith("/*") ? pattern.slice(0, -2) : pattern);
    const absDir = path.resolve(repoRoot, baseDir);
    if (!fs.existsSync(absDir)) continue;
    const isFlat = pattern.endsWith("/*") || (!pattern.includes("**") && !pattern.includes("*"));

    try {
      walkDirectory(absDir, repoRoot, repoReal, allowlist, protectedPaths, seenPaths, candidates, isFlat);
    } catch {
      continue;
    }
  }

  // Stable sort by relative path
  candidates.sort((a, b) => a.relPath.localeCompare(b.relPath));

  const scannedFiles = [];
  let totalAccumulatedBytes = 0;
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

    // Per-file size limit — use UTF-8 byte count, slice safely at char boundary
    if (byteSize > maxBytesPerFile) {
      // Truncate to byte limit by decoding only as many bytes as fit
      const truncatedBuf = Buffer.from(content, "utf8").subarray(0, maxBytesPerFile);
      // Decode back to string; Buffer handles multi-byte safely
      content = truncatedBuf.toString("utf8");
      // Remove any trailing broken multi-byte character (replacement char)
      content = content.replace(/�+$/, "");
      fileTruncated = true;
      truncated.maxBytesPerFile = true;
    }

    // Total size limit — use UTF-8 byte count
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
      protectedExcluded: candidates.length - scannedFiles.length // Will be updated after read-phase filtering
    },
    truncated
  };
}

// ---------------------------------------------------------------------------
// walkDirectory — recursive directory traversal
// ---------------------------------------------------------------------------
function walkDirectory(absDir, repoRoot, repoReal, allowlist, protectedPaths, seenPaths, candidates, flat) {
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
      walkDirectory(entryPath, repoRoot, repoReal, allowlist, protectedPaths, seenPaths, candidates, false);
      continue;
    }

    if (!entry.isFile()) continue;

    // Skip protected paths (uses canonical isProtected from policy.mjs)
    if (isProtected(relPath, protectedPaths)) continue;

    // Skip duplicates
    if (seenPaths.has(relPath)) continue;
    seenPaths.add(relPath);

    candidates.push({ relPath, fullPath: real });
  }
}
