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
    ".github/", ".env*", "pnpm-lock.yaml", "package.json",
    "src/domain/contentGuard.ts", "src/domain/types.ts", "src/i18n.ts",
    "src/domain/exam/items/", "scripts/exam-batches/",
    "src/domain/furiganaData*", "supabase/", "functions/",
    "src/domain/furiganaExplanationData*", "src/domain/furiganaLearningData*",
    "src/domain/examBlocks*", "src/domain/*.i18n.*",
    "src/domain/cloze-data*", "src/domain/contentStats*",
    "src/domain/grammarDatabase*", "src/domain/grammarNotes*",
    "src/domain/kanjiOnyomi*", "src/domain/learningBlocks*",
    "src/domain/legalContent*", "src/domain/legalLabels*",
    "src/domain/sentencePatterns*",
    "src/domain/starterPatterns*", "src/domain/starterVocabulary*",
    "src/domain/localizedContent*",
    "src/domain/grammarNoteText*", "src/domain/learningBlockText*",
    "src/domain/questionReport*", "src/domain/prerender/",
    "src/domain/seo*", "src/domain/sitemap*",
    "src/hooks/useAuth*", "src/hooks/useProgressAttempts*",
    "src/hooks/useOriginMigration*", "src/hooks/useLanguage*",
    "src/hooks/usePwaUpdate*",
    "src/domain/attemptRemote*",
    "src/domain/feedbackRemote*", "src/domain/originMigration*",
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
    if (pp.includes("*")) {
      const escaped = pp.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
      const pattern = "^" + escaped.replace(/\*/g, "[^/]*") + "$";
      if (new RegExp(pattern).test(normalized)) return true;
    } else if (pp.endsWith("/")) {
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
      try {
        const stat = fs.lstatSync(current);
        if (stat.isSymbolicLink()) {
          try { real = fs.realpathSync(current); } catch { return false; }
        } else {
          real = fs.realpathSync(current);
        }
      } catch (error) {
        if (error?.code === "ENOENT") continue;
        return false;
      }
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
    // Ensure allowedDir exists first. The allowed directory itself must never
    // be a symlink, even when its target remains inside the repository: output
    // is specifically constrained to the lexical artifact directory.
    if (!fs.existsSync(allowedDir)) {
      fs.mkdirSync(allowedDir, { recursive: true });
    }
    const allowedStat = fs.lstatSync(allowedDir);
    if (allowedStat.isSymbolicLink() || !allowedStat.isDirectory()) return null;

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

    // Walk existing parent dirs (skip final file which may not exist). Reject
    // every symlink component rather than following an alias.
    const segments = relative.split(path.sep);
    const dirSegments = segments.slice(0, -1);
    let current = allowedReal;
    for (const seg of dirSegments) {
      current = path.join(current, seg);
      try {
        const currentStat = fs.lstatSync(current);
        if (currentStat.isSymbolicLink() || !currentStat.isDirectory()) return null;
        let real;
        try { real = fs.realpathSync(current); } catch { return null; }
        if (!real.startsWith(allowedReal + path.sep) && real !== allowedReal) return null;
      } catch (error) {
        if (error?.code !== "ENOENT") return null;
      }
    }

    // lstat sees dangling symlinks that existsSync intentionally follows and
    // therefore reports as missing. Never follow a final symlink.
    try {
      const finalStat = fs.lstatSync(candidate);
      if (finalStat.isSymbolicLink() || finalStat.isDirectory()) return null;
      let finalReal;
      try { finalReal = fs.realpathSync(candidate); } catch { return null; }
      if (!finalReal.startsWith(allowedReal + path.sep) && finalReal !== allowedReal) return null;
    } catch (error) {
      if (error?.code !== "ENOENT") return null;
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

export function isProductionFilePath(filePath) {
  if (!filePath || typeof filePath !== "string") return false;
  const normalized = filePath.replace(/\\/g, "/");
  return !/(?:\.regression)?\.test\.tsx?$/.test(normalized);
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

// ---------------------------------------------------------------------------
// GREEN hard constants (#637) — budgets that a Gemini repair diff must satisfy
// ---------------------------------------------------------------------------
export const MAX_GREEN_PRODUCTION_FILES = 3;
export const MAX_GREEN_DIFF_LINES = 250;

// ---------------------------------------------------------------------------
// parseUnifiedDiff — parse a Gemini-authored unified production diff into
// per-file add/delete counts.  Pure function (no filesystem access): rejects
// empty/non-string input, missing file headers, rename/binary markers, and any
// referenced path that is not a safe repo-relative path.
// ---------------------------------------------------------------------------
export function parseUnifiedDiff(diff) {
  if (typeof diff !== "string") {
    return { valid: false, error: "unified diff must be a string" };
  }
  if (/\r/.test(diff)) {
    return { valid: false, error: "unified diff contains carriage returns (EOL churn)" };
  }
  if (diff.trim() === "") {
    return { valid: false, error: "unified diff is empty" };
  }

  const files = [];
  let current = null;
  let inHunk = false;

  const lines = diff.split("\n");
  for (const rawLine of lines) {
    const line = rawLine.replace(/[ \t]+$/, "");
    if (line.startsWith("@@ ")) {
      inHunk = true;
      continue;
    }
    if (inHunk) {
      // A hunk body is only context (' '), added ('+'), removed ('-'), or a
      // trailing '\ No newline' marker. Any other line ends the hunk and is
      // processed below as a header/marker.
      const isHunkBody =
        line.startsWith(" ") ||
        line.startsWith("+") ||
        line.startsWith("-") ||
        line.startsWith("\\");
      if (!isHunkBody) inHunk = false;
      else {
        // A hunk body without a preceding `+++ b/` attribution cannot be
        // attributed to a file.  A well-formed git diff always pairs a hunk
        // with a `+++ b/` header, so reaching this branch means the input is
        // malformed or hostile: fail closed instead of silently dropping the
        // lines (which would let an attacker bypass line budgets and
        // escape-hatch scanning).
        if (!current) return { valid: false, error: "hunk body has no file attribution" };
        if (line.startsWith("+")) {
          current.additions += 1;
          current.addedLines.push(line.slice(1));
        } else if (line.startsWith("-")) {
          current.deletions += 1;
          current.removedLines.push(line.slice(1));
        }
        continue;
      }
    }
    if (
      /^new\s+file\s+mode\s/.test(line) ||
      /^deleted\s+file\s+mode\s/.test(line) ||
      /^old\s+mode\s/.test(line) ||
      /^new\s+mode\s/.test(line) ||
      /^Subproject\s+commit\s/.test(line)
    ) {
      return { valid: false, error: "add/delete/mode/submodule diffs are forbidden" };
    }
    if (line.startsWith("diff --git ")) {
      current = null;
      inHunk = false;
      continue;
    }
    if (/^similarity index\s/.test(line) || /^rename (?:from|to)\s/.test(line)) {
      return { valid: false, error: "rename/similarity diffs are forbidden" };
    }
    if (/^Binary files\s/.test(line) || /^GIT binary patch\b/.test(line)) {
      return { valid: false, error: "binary diffs are forbidden" };
    }
    if (line.startsWith("+++ b/")) {
      const candidatePath = line.slice(6);
      if (!isPathSafe(candidatePath)) {
        return { valid: false, error: `diff references an unsafe path: ${candidatePath}` };
      }
      current = files.find(file => file.path === candidatePath);
      if (!current) {
        current = { path: candidatePath, additions: 0, deletions: 0, addedLines: [], removedLines: [] };
        files.push(current);
      }
      continue;
    }
  }

  if (files.length === 0) {
    return { valid: false, error: "unified diff has no file header" };
  }
  for (const file of files) {
    if (file.additions === 0 && file.deletions === 0) {
      return { valid: false, error: `diff for ${file.path} has no hunks` };
    }
  }

  const totalAdditions = files.reduce((sum, file) => sum + file.additions, 0);
  const totalDeletions = files.reduce((sum, file) => sum + file.deletions, 0);
  return {
    valid: true,
    files,
    totalAdditions,
    totalDeletions,
    changedFiles: files.length
  };
}
