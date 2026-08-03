// =============================================================================
// red-prompt-builder.mjs — bounded test-only prompt for the RED stage
// =============================================================================

import path from "node:path";
import ts from "typescript";

export const MAX_RED_PROMPT_CHARS = 300_000;

const EXISTING_TEST_RE = /\.test\.tsx?$/;
const IMPORT_EXTENSIONS = [".ts", ".tsx", ".mjs"];
const MAX_RELATED_TEST_ROOTS = 4;

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

function isCorrespondingTest(testPath, productionPath) {
  const productionStem = productionPath.replace(/\.(?:ts|tsx|mjs)$/, "");
  return testPath === `${productionStem}.test.ts` ||
    testPath === `${productionStem}.test.tsx`;
}

function selectPromptFileGroups(finding, scannedFiles) {
  const fileMap = new Map(
    scannedFiles.map(file => [normalize(file.path), { ...file, path: normalize(file.path) }])
  );
  const productionPaths = finding.productionFiles.map(normalize);

  for (const productionPath of productionPaths) {
    const file = fileMap.get(productionPath);
    if (!file) {
      throw new Error(`production file is absent from scanner manifest: ${productionPath}`);
    }
  }

  const requiredPaths = collectImportClosure(productionPaths, fileMap);
  const reproductionPath = normalize(finding.reproduction.testFile);
  const candidates = [];

  for (const [filePath, file] of fileMap) {
    if (!EXISTING_TEST_RE.test(filePath) || filePath === reproductionPath) continue;
    const corresponding = productionPaths.some(productionPath =>
      isCorrespondingTest(filePath, productionPath)
    );
    const directlyImportsProduction = relativeImports(file).some(specifier => {
      const resolved = resolveImport(filePath, specifier, fileMap);
      return resolved !== null && productionPaths.includes(resolved);
    });
    if (corresponding || directlyImportsProduction) {
      candidates.push({
        path: filePath,
        priority: corresponding ? 0 : 1
      });
    }
  }

  candidates.sort((left, right) =>
    left.priority - right.priority || comparePaths(left.path, right.path)
  );

  return {
    fileMap,
    requiredPaths,
    optionalGroups: candidates
      .slice(0, MAX_RELATED_TEST_ROOTS)
      .map(candidate => collectImportClosure([candidate.path], fileMap))
  };
}

function filesForPaths(paths, fileMap) {
  return [...paths]
    .sort(comparePaths)
    .map(filePath => fileMap.get(filePath));
}

function hasTruncatedFile(paths, fileMap) {
  for (const filePath of paths) {
    const file = fileMap.get(filePath);
    if (file?.truncated) {
      return file;
    }
  }
  return null;
}

function addPaths(target, additions) {
  const combined = new Set(target);
  for (const filePath of additions) {
    combined.add(filePath);
  }
  return combined;
}

function renderFile(file) {
  const numbered = String(file.content)
    .split("\n")
    .map((line, index) => `${index + 1}|${line}`)
    .join("\n");
  return `### ${file.path}\n\`\`\`ts\n${numbered}\n\`\`\``;
}

function renderPrompt({ baselineSha, finding, selectedFiles }) {
  const manifest = selectedFiles.map(file => file.path);
  const fileBlocks = selectedFiles.map(renderFile).join("\n\n");
  const exactCandidate = {
    schemaVersion: 1,
    status: "regression-test",
    testFile: finding.reproduction.testFile,
    testName: finding.reproduction.testName,
    source: "<complete TypeScript test source>"
  };

  return `You are writing the RED regression test for one already-validated correctness finding.

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

Visible repository file count: ${manifest.length}
Visible repository manifest:
${manifest.join("\n")}

Visible files:
${fileBlocks}
`;
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

  const {
    fileMap,
    requiredPaths,
    optionalGroups
  } = selectPromptFileGroups(finding, scannedFiles);
  const truncatedRequired = hasTruncatedFile(requiredPaths, fileMap);
  if (truncatedRequired) {
    throw new Error(`required prompt file was truncated: ${truncatedRequired.path}`);
  }

  let selectedPaths = requiredPaths;
  let selectedFiles = filesForPaths(selectedPaths, fileMap);
  let prompt = renderPrompt({ baselineSha, finding, selectedFiles });
  if (prompt.length > MAX_RED_PROMPT_CHARS) {
    throw new Error(`RED prompt exceeds ${MAX_RED_PROMPT_CHARS} characters`);
  }

  for (const group of optionalGroups) {
    if (hasTruncatedFile(group, fileMap)) continue;
    const candidatePaths = addPaths(selectedPaths, group);
    const candidateFiles = filesForPaths(candidatePaths, fileMap);
    const candidatePrompt = renderPrompt({
      baselineSha,
      finding,
      selectedFiles: candidateFiles
    });
    if (candidatePrompt.length <= MAX_RED_PROMPT_CHARS) {
      selectedPaths = candidatePaths;
      selectedFiles = candidateFiles;
      prompt = candidatePrompt;
    }
  }

  const manifest = selectedFiles.map(file => file.path);
  return {
    prompt,
    manifest,
    fileCount: manifest.length,
    length: prompt.length
  };
}
