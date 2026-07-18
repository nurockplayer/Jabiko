// =============================================================================
// policy.mjs — Path safety, allowlist, protected-path, and regression-test rules
// =============================================================================
//
// CANONICAL implementation of all path security rules.
// =============================================================================

import fs from "node:fs";
import path from "node:path";

export function getDefaultProtectedPaths() {
  return [
    ".github/", ".env", ".env.", "pnpm-lock.yaml", "package.json",
    "src/domain/contentGuard.ts", "src/domain/types.ts", "src/i18n.ts",
    "src/domain/exam/items/", "scripts/exam-batches/",
    "src/domain/furiganaData.ts", "supabase/", "functions/",
    "src/domain/furiganaExplanationData.ts", "src/domain/furiganaLearningData.ts",
    "src/domain/furigana", "src/domain/examBlocks.ts",
    "public/", "vite.config.ts", "tsconfig.json", "tsconfig.node.json"
  ];
}

export function getDefaultAllowlist() {
  return ["src/domain/**", "src/hooks/**"];
}

export function isProtected(filePath, protectedPaths) {
  const paths = protectedPaths ?? getDefaultProtectedPaths();
  if (!filePath) return true;
  const normalized = String(filePath).replace(/\\/g, "/");
  for (const pp of paths) {
    const cleanDir = pp.replace(/\/+$/, "");
    if (pp.endsWith("/")) {
      if (normalized.startsWith(pp)) return true;
      if (normalized === cleanDir) return true;
      if (normalized.startsWith(cleanDir + "/")) return true;
    } else if (pp.startsWith(".")) {
      if (normalized === pp) return true;
      if (normalized.startsWith(pp + ".")) return true;
      if (normalized.startsWith(pp + "/")) return true;
    } else {
      if (normalized === pp) return true;
      if (normalized.startsWith(pp + "/")) return true;
    }
  }
  return false;
}

export function isAllowlisted(filePath, allowlist) {
  if (!filePath) return false;
  const normalized = String(filePath).replace(/\\/g, "/");
  for (const pattern of (allowlist ?? getDefaultAllowlist())) {
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

export function isPathSafe(filePath) {
  if (filePath === null || filePath === undefined || typeof filePath !== "string") return false;
  if (filePath.trim() === "") return false;
  const normalized = filePath.replace(/\\/g, "/");
  if (normalized.startsWith("/")) return false;
  if (/^[A-Za-z]:[/\\]/i.test(normalized)) return false;
  if (normalized.startsWith("//")) return false;
  for (const seg of normalized.split("/")) { if (seg === "..") return false; }
  if (normalized.includes("->") || normalized.includes("→")) return false;
  return true;
}

// ---------------------------------------------------------------------------
// isPathWithinRepo — realpath-based symlink containment
// ---------------------------------------------------------------------------
export function isPathWithinRepo(filePath, repoRoot) {
  if (!filePath) return false;
  try {
    const resolved = path.resolve(repoRoot, String(filePath));
    const repoReal = fs.realpathSync(repoRoot);
    const relative = path.relative(repoRoot, resolved);
    if (!relative || relative.startsWith("..")) return false;
    const segments = relative.split(path.sep);
    let current = repoRoot;
    for (const seg of segments) {
      current = path.join(current, seg);
      let real;
      try { real = fs.realpathSync(current); } catch { real = current; }
      if (!real.startsWith(repoReal + path.sep) && real !== repoReal) return false;
    }
    return true;
  } catch { return false; }
}

// ---------------------------------------------------------------------------
// safeWritePath — restricts output paths to a temp/artifact directory.
// Accepts repoRoot.  After resolving allowedDir, verifies its realpath
// is still inside the repoRoot realpath (rejects symlink escape at the
// allowedDir level).  Does NOT realpathSync on a non-existent output file.
// ---------------------------------------------------------------------------
export function safeWritePath(targetPath, allowedDir, repoRoot) {
  if (!targetPath) return null;
  try {
    // Ensure allowedDir exists first
    if (!fs.existsSync(allowedDir)) {
      fs.mkdirSync(allowedDir, { recursive: true });
    }

    // Resolve allowedDir
    let allowedReal;
    try { allowedReal = fs.realpathSync(allowedDir); }
    catch { return null; }

    // Verify allowedReal is inside repoRoot (if provided)
    if (repoRoot) {
      const repoReal = fs.realpathSync(repoRoot);
      if (!allowedReal.startsWith(repoReal + path.sep) && allowedReal !== repoReal) {
        return null; // allowedDir symlink escaped outside repo
      }
    }

    const candidate = path.resolve(allowedReal, String(targetPath));
    const relative = path.relative(allowedReal, candidate);
    if (!relative || relative.startsWith("..")) return null;

    // Walk existing parent dirs (skip final file which may not exist)
    const segments = relative.split(path.sep);
    const dirSegments = segments.slice(0, -1);
    let current = allowedReal;
    for (const seg of dirSegments) {
      current = path.join(current, seg);
      if (fs.existsSync(current)) {
        let real;
        try { real = fs.realpathSync(current); } catch { return null; }
        if (!real.startsWith(allowedReal + path.sep) && real !== allowedReal) return null;
      }
    }

    // Only check final file if it exists
    if (fs.existsSync(candidate)) {
      let finalReal;
      try { finalReal = fs.realpathSync(candidate); } catch { return null; }
      if (!finalReal.startsWith(allowedReal + path.sep) && finalReal !== allowedReal) return null;
    }

    return candidate;
  } catch { return null; }
}

export function resolveProductionDir(filePath) {
  if (!filePath) throw new Error("resolveProductionDir: filePath is required");
  const normalized = String(filePath).replace(/\\/g, "/");
  const dir = path.posix.dirname(normalized);
  return dir === "." ? normalized : dir;
}

export function isValidRegressionTest(testFile, productionFile) {
  if (!testFile || !productionFile) return false;
  if (!/\.regression\.test\.tsx?$/.test(testFile)) return false;
  try {
    const testDir = path.posix.dirname(testFile.replace(/\\/g, "/"));
    const prodDir = path.posix.dirname(productionFile.replace(/\\/g, "/"));
    return testDir === prodDir;
  } catch { return false; }
}
