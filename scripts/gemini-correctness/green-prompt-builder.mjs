// =============================================================================
// green-prompt-builder.mjs — bounded repair-only prompt for the GREEN stage
// =============================================================================
//
// Builds the Gemini repair prompt from the validated finding, the replayed RED
// result, the regression test source, and the production files Gemini may edit.
// Gemini only ever sees:
//   - the validated finding
//   - the replay-confirmed RED result (baseline SHA, patch hash, assertion)
//   - the regression test source (read-only — never editable)
//   - the finding production files plus their import closure (the only files
//     Gemini may modify, still subject to policy allowlist / protected paths)
// =============================================================================

import path from "node:path";
import ts from "typescript";

export const MAX_GREEN_PROMPT_CHARS = 300_000;
const IMPORT_EXTENSIONS = [".ts", ".tsx", ".mjs"];

function normalize(filePath) {
  return String(filePath).replace(/\\/g, "/");
}

function comparePaths(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function relativeImports(file) {
  const sourceFile = ts.createSourceFile(
    file.path,
    file.content,
    ts.ScriptTarget.Latest,
    true,
    file.path.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  );
  const imports = [];
  for (const statement of sourceFile.statements) {
    if (
      (ts.isImportDeclaration(statement) || ts.isExportDeclaration(statement)) &&
      statement.moduleSpecifier &&
      ts.isStringLiteral(statement.moduleSpecifier) &&
      statement.moduleSpecifier.text.startsWith(".")
    ) {
      imports.push(statement.moduleSpecifier.text);
    }
  }
  return imports;
}

function resolveImport(fromPath, specifier, fileMap) {
  const base = path.posix.normalize(
    path.posix.join(path.posix.dirname(fromPath), specifier)
  );
  const candidates = path.posix.extname(base)
    ? [base]
    : [
        ...IMPORT_EXTENSIONS.map(extension => `${base}${extension}`),
        ...IMPORT_EXTENSIONS.map(extension => `${base}/index${extension}`)
      ];
  return candidates.find(candidate => fileMap.has(candidate)) ?? null;
}

function collectImportClosure(rootPaths, fileMap) {
  const selected = new Set(rootPaths);
  const queue = [...rootPaths];

  while (queue.length > 0) {
    const currentPath = queue.shift();
    const current = fileMap.get(currentPath);
    if (!current) continue;
    for (const specifier of relativeImports(current)) {
      const resolved = resolveImport(currentPath, specifier, fileMap);
      if (resolved && !selected.has(resolved)) {
        selected.add(resolved);
        queue.push(resolved);
      }
    }
  }

  return selected;
}

function renderFile(file) {
  const numbered = String(file.content)
    .split("\n")
    .map((line, index) => `${index + 1}|${line}`)
    .join("\n");
  return `### ${file.path}\n\`\`\`ts\n${numbered}\n\`\`\``;
}

function renderPrompt({ finding, redResult, regressionTestSource, selectedFiles, redTestFailure }) {
  const manifest = selectedFiles.map(file => file.path);
  const fileBlocks = selectedFiles.map(renderFile).join("\n\n");
  const exactCandidate = {
    schemaVersion: 1,
    status: "repair-diff",
    diff: "<unified git diff of production files only>",
    rootCause: "<one sentence: the root cause you are fixing>",
    fixSummary: "<one sentence: what your diff changes>"
  };
  const failureEvidence = redTestFailure
    ? `${redTestFailure.stderr ?? ""}\n${redTestFailure.stdout ?? ""}`.trim()
    : "";

  return `You are repairing the production code that causes ONE already-validated correctness finding.

You have no shell, filesystem, network, environment, secret, package-manager, Git, or GitHub authority.
Do not execute commands. Return strict JSON only; do not use markdown fences or trailing prose.

You must return exactly this object shape and no unknown fields:
${JSON.stringify(exactCandidate, null, 2)}

Repair scope:
- You may modify ONLY the production files listed in the finding.productionFiles
  and shown below. Do not propose or modify any other file.
- The regression test below is FIXED and MUST NOT be modified. Do not modify the regression test or any existing test file.
- Touching at most 3 production files and changing at most 250 added+deleted lines total.
- No file deletion, rename, binary, submodule, symlink, or new file creation.
- No .skip/.only, @ts-ignore, @ts-nocheck, @ts-expect-error, coverage or lint
  disables, or uncommented TypeScript any.
- No whitespace-only or EOL churn, no refactors, no public API renames, and no
  second root cause. Fix exactly the root cause below.
- Do not modify dependency, lockfile, workflow, config, migration, auth, RLS,
  generated/content/i18n files, or environment/secrets.
- The repair is only complete when the fixed regression test passes and
  lint, typecheck, the full test suite, and the build all pass.

RED replay confirmation (already verified, do not question it):
- baseline SHA: ${redResult.baselineSha}
- regression test patch SHA-256: ${redResult.patchSha256}
- replay status: ${String(redResult.replayConfirmed)} (replayConfirmed)
- failure kind: ${redResult.failureKind}

Validated finding (the ONE root cause to fix):
${JSON.stringify(finding, null, 2)}

Regression test (fixed — read it, never modify it):
### ${redResult.testFile}
\`\`\`ts
${regressionTestSource}
\`\`\`

Observed RED failure evidence (read-only):
${failureEvidence || "(regression test above fails until the root cause is fixed)"}

Visible repository file count: ${manifest.length}
Visible repository manifest:
${manifest.join("\n")}

Visible production files (the only files you may modify):
${fileBlocks}
`;
}

export function buildGreenPrompt({
  finding,
  redResult,
  regressionTestSource,
  scannedFiles,
  redTestFailure
} = {}) {
  if (!finding || finding.status !== "finding") {
    throw new Error("a validated finding is required");
  }
  if (
    !redResult ||
    typeof redResult !== "object" ||
    redResult.status !== "red-confirmed" ||
    redResult.replayConfirmed !== true ||
    redResult.testFile !== finding.reproduction?.testFile ||
    redResult.testName !== finding.reproduction?.testName
  ) {
    throw new Error("a red-confirmed, replay-confirmed RED result matching the finding reproduction test is required");
  }
  if (typeof regressionTestSource !== "string" || regressionTestSource.trim() === "") {
    throw new Error("regression test source is required");
  }
  if (!Array.isArray(scannedFiles)) {
    throw new Error("scanner manifest is required");
  }

  const fileMap = new Map(
    scannedFiles.map(file => [normalize(file.path), { ...file, path: normalize(file.path) }])
  );
  const productionPaths = (finding.productionFiles ?? []).map(normalize);
  for (const productionPath of productionPaths) {
    const file = fileMap.get(productionPath);
    if (!file) {
      throw new Error(`production file is absent from scanner manifest: ${productionPath}`);
    }
    if (file.truncated) {
      throw new Error(`required prompt file was truncated: ${productionPath}`);
    }
  }

  const selectedPaths = collectImportClosure(productionPaths, fileMap);
  const regressionPath = normalize(finding.reproduction.testFile);
  selectedPaths.add(regressionPath);

  const selectedFiles = [...selectedPaths]
    .sort(comparePaths)
    .map(filePath => fileMap.get(filePath))
    .filter(file => file !== undefined);

  if (selectedFiles.length !== selectedPaths.size) {
    throw new Error(`regression test is absent from scanner manifest: ${regressionPath}`);
  }

  const prompt = renderPrompt({
    finding,
    redResult,
    regressionTestSource,
    selectedFiles,
    redTestFailure
  });
  if (prompt.length > MAX_GREEN_PROMPT_CHARS) {
    throw new Error(`GREEN prompt exceeds ${MAX_GREEN_PROMPT_CHARS} characters`);
  }

  return {
    prompt,
    manifest: selectedFiles.map(file => file.path),
    fileCount: selectedFiles.length,
    length: prompt.length
  };
}
