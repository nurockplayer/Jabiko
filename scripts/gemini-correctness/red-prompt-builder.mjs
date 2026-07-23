// =============================================================================
// red-prompt-builder.mjs — bounded test-only prompt for the RED stage
// =============================================================================

import path from "node:path";
import ts from "typescript";

export const MAX_RED_PROMPT_CHARS = 300_000;

const EXISTING_TEST_RE = /\.test\.tsx?$/;
const IMPORT_EXTENSIONS = [".ts", ".tsx", ".mjs"];

function normalize(filePath) {
  return String(filePath).replace(/\\/g, "/");
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

function selectPromptFiles(finding, scannedFiles) {
  const fileMap = new Map(
    scannedFiles.map(file => [normalize(file.path), { ...file, path: normalize(file.path) }])
  );
  const selected = new Set();
  const queue = [];

  for (const productionFile of finding.productionFiles) {
    const normalized = normalize(productionFile);
    const file = fileMap.get(normalized);
    if (!file) {
      throw new Error(`production file is absent from scanner manifest: ${normalized}`);
    }
    selected.add(normalized);
    queue.push(normalized);
  }

  const primaryDir = path.posix.dirname(normalize(finding.productionFiles[0]));
  for (const [filePath] of fileMap) {
    if (
      path.posix.dirname(filePath) === primaryDir &&
      EXISTING_TEST_RE.test(filePath) &&
      filePath !== normalize(finding.reproduction.testFile)
    ) {
      selected.add(filePath);
      queue.push(filePath);
    }
  }

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

  return [...selected]
    .sort((a, b) => a.localeCompare(b))
    .map(filePath => fileMap.get(filePath));
}

function renderFile(file) {
  const numbered = String(file.content)
    .split("\n")
    .map((line, index) => `${index + 1}|${line}`)
    .join("\n");
  return `### ${file.path}\n\`\`\`ts\n${numbered}\n\`\`\``;
}

export function buildRedPrompt({
  baselineSha,
  finding,
  scannedFiles
} = {}) {
  if (!/^[0-9a-f]{40,64}$/i.test(String(baselineSha ?? ""))) {
    throw new Error("baseline SHA is required");
  }
  if (!finding || finding.status !== "finding") {
    throw new Error("a validated finding is required");
  }
  if (!Array.isArray(scannedFiles)) {
    throw new Error("scanner manifest is required");
  }

  const selectedFiles = selectPromptFiles(finding, scannedFiles);
  const truncated = selectedFiles.find(file => file.truncated);
  if (truncated) {
    throw new Error(`required prompt file was truncated: ${truncated.path}`);
  }
  const manifest = selectedFiles.map(file => file.path);
  const fileBlocks = selectedFiles.map(renderFile).join("\n\n");
  const exactCandidate = {
    schemaVersion: 1,
    status: "regression-test",
    testFile: finding.reproduction.testFile,
    testName: finding.reproduction.testName,
    source: "<complete TypeScript test source>"
  };

  const prompt = `You are writing the RED regression test for one already-validated correctness finding.

You have no shell, filesystem, network, environment, secret, package-manager, Git, or GitHub authority.
Do not execute commands. Return strict JSON only; do not use markdown fences or trailing prose.

You must return exactly this object shape and no unknown fields:
${JSON.stringify(exactCandidate, null, 2)}

Contract:
- Add only the one designated test file. Do not propose or modify any other file.
- The source must declare exactly one Vitest test whose leaf name is exactly testName.
- Import Vitest through unaliased named imports limited to describe, expect, it, or test.
- Use exactly one expect() call. Its received value must directly observe an imported,
  prompt-visible repository interface and chain directly to one matcher; do not force failure
  with a literal, detached matcher, helper assertion, or unrelated comparison.
- The test must exercise one observable behavior from the finding through public interfaces.
- Do not mock the function under test.
- Do not use .only, .skip, .todo, timers, wall clock, randomness, child processes,
  filesystem writes, network, dynamic imports/downloads, environment values, secrets, snapshots,
  fixtures, configuration, package metadata, dependencies, or TypeScript any.
- Before the repair, the test must fail through a Vitest AssertionError, never through syntax,
  import, setup, timeout, worker, or unhandled errors.
- Give the failing expect() this custom assertion message so the runner can bind the failure
  to the finding:
  Expected behavior: ${finding.expectedBehavior} | Actual behavior: ${finding.actualBehavior}

Baseline SHA: ${baselineSha}

Validated finding:
${JSON.stringify(finding, null, 2)}

Visible repository manifest:
${manifest.join("\n")}

Visible files:
${fileBlocks}
`;

  if (prompt.length > MAX_RED_PROMPT_CHARS) {
    throw new Error(`RED prompt exceeds ${MAX_RED_PROMPT_CHARS} characters`);
  }
  return { prompt, manifest, length: prompt.length };
}
