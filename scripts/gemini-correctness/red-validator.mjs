// =============================================================================
// red-validator.mjs — deterministic validation for Gemini-authored RED tests
// =============================================================================

import ts from "typescript";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import {
  isPathSafe,
  isPathWithinRepo,
  isValidRegressionTest
} from "./policy.mjs";
import { redactForOutput } from "./discover.mjs";

export const MAX_REGRESSION_TEST_LINES = 250;
export const MAX_REGRESSION_TEST_BYTES = 64 * 1024;

const CANDIDATE_KEYS = [
  "schemaVersion",
  "status",
  "testFile",
  "testName",
  "source"
];

function invalid(error) {
  return { valid: false, error };
}

function runGit(repoRoot, args) {
  const result = spawnSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    maxBuffer: 2 * 1024 * 1024,
    shell: false,
    stdio: ["ignore", "pipe", "pipe"]
  });
  if (result.error || result.status !== 0) {
    throw new Error(`git ${args[0]} failed`);
  }
  return result.stdout;
}

function isCanonicalTestPath(testFile, repoRoot, { mustExist }) {
  if (
    typeof testFile !== "string" ||
    testFile.includes("\\") ||
    !isPathSafe(testFile) ||
    !isPathWithinRepo(testFile, repoRoot)
  ) {
    return false;
  }

  const repoReal = fs.realpathSync(repoRoot);
  const segments = testFile.split("/");
  let current = repoReal;
  for (const segment of segments) {
    current = path.join(current, segment);
    try {
      const stat = fs.lstatSync(current);
      if (stat.isSymbolicLink()) return false;
    } catch (error) {
      if (error?.code !== "ENOENT") return false;
      if (mustExist) return false;
    }
  }

  if (!mustExist) return true;
  try {
    const stat = fs.lstatSync(current);
    if (!stat.isFile() || stat.isSymbolicLink()) return false;
    const fileReal = fs.realpathSync(current);
    const canonicalRelative = path.relative(repoReal, fileReal).replace(/\\/g, "/");
    return canonicalRelative === testFile;
  } catch {
    return false;
  }
}

function hasPathAtLstat(testFile, repoRoot) {
  try {
    fs.lstatSync(path.join(repoRoot, testFile));
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    return true;
  }
}

export function captureCleanBaseline({ repoRoot, testFile } = {}) {
  try {
    if (!repoRoot || !fs.statSync(repoRoot).isDirectory()) {
      return invalid("repoRoot must be an existing directory");
    }
    const repoReal = fs.realpathSync(repoRoot);
    const topLevel = fs.realpathSync(runGit(repoRoot, ["rev-parse", "--show-toplevel"]).trim());
    if (topLevel !== repoReal) return invalid("repoRoot must be the git worktree root");
    if (!isCanonicalTestPath(testFile, repoRoot, { mustExist: false })) {
      return invalid("testFile is not a canonical contained path");
    }
    if (hasPathAtLstat(testFile, repoRoot)) {
      return invalid("testFile already exists at baseline");
    }
    const status = runGit(repoRoot, [
      "status",
      "--porcelain=v1",
      "--untracked-files=all",
      "-z"
    ]);
    if (status !== "") return invalid("worktree must be clean at baseline");
    const baselineSha = runGit(repoRoot, ["rev-parse", "HEAD"]).trim();
    if (!/^[0-9a-f]{40,64}$/i.test(baselineSha)) {
      return invalid("baseline SHA is invalid");
    }
    return { valid: true, baselineSha };
  } catch {
    return invalid("failed to capture a clean git baseline");
  }
}

export function validateTestOnlyWorktree({
  repoRoot,
  baselineSha,
  testFile
} = {}) {
  try {
    if (!/^[0-9a-f]{40,64}$/i.test(String(baselineSha ?? ""))) {
      return invalid("baseline SHA is invalid");
    }
    if (runGit(repoRoot, ["rev-parse", "HEAD"]).trim() !== baselineSha) {
      return invalid("HEAD no longer matches baseline SHA");
    }
    if (!isCanonicalTestPath(testFile, repoRoot, { mustExist: true })) {
      return invalid("candidate test is not a regular canonical file");
    }

    const source = fs.readFileSync(path.join(repoRoot, testFile));
    if (
      source.includes(0) ||
      source.byteLength > MAX_REGRESSION_TEST_BYTES ||
      source.toString("utf8").split("\n").length > MAX_REGRESSION_TEST_LINES
    ) {
      return invalid("candidate test is binary or exceeds size limits");
    }

    const status = runGit(repoRoot, [
      "status",
      "--porcelain=v1",
      "--untracked-files=all",
      "-z"
    ]);
    if (status !== `?? ${testFile}\0`) {
      return invalid("worktree contains changes other than one untracked candidate test");
    }
    return { valid: true };
  } catch {
    return invalid("failed to validate test-only worktree");
  }
}

export function createTestOnlyPatch({
  repoRoot,
  baselineSha,
  testFile
} = {}) {
  const validation = validateTestOnlyWorktree({
    repoRoot,
    baselineSha,
    testFile
  });
  if (!validation.valid) return validation;

  let resetSucceeded = false;
  try {
    runGit(repoRoot, ["add", "--intent-to-add", "--", testFile]);
    const nameStatus = runGit(repoRoot, [
      "diff",
      "--name-status",
      "--no-renames",
      "--",
      testFile
    ]).trim();
    if (nameStatus !== `A\t${testFile}`) {
      return invalid("candidate diff is not exactly one added file");
    }

    const numstat = runGit(repoRoot, ["diff", "--numstat", "--", testFile]).trim();
    const [added, removed, changedPath] = numstat.split("\t");
    if (
      changedPath !== testFile ||
      added === "-" ||
      removed === "-" ||
      !/^\d+$/.test(added) ||
      removed !== "0" ||
      Number(added) > MAX_REGRESSION_TEST_LINES
    ) {
      return invalid("candidate diff is binary, deletes content, or exceeds line limits");
    }

    const patch = runGit(repoRoot, [
      "diff",
      "--binary",
      "--no-ext-diff",
      "--no-renames",
      "--",
      testFile
    ]);
    if (!patch || Buffer.byteLength(patch, "utf8") > MAX_REGRESSION_TEST_BYTES * 2) {
      return invalid("candidate patch is empty or exceeds size limits");
    }
    return { valid: true, patch };
  } catch {
    return invalid("failed to create test-only patch");
  } finally {
    try {
      runGit(repoRoot, ["reset", "-q", "--", testFile]);
      resetSucceeded = true;
    } catch {
      resetSucceeded = false;
    }
    if (!resetSucceeded) {
      try {
        runGit(repoRoot, ["reset", "-q", "HEAD", "--", testFile]);
      } catch {
        // The caller will fail its subsequent worktree validation closed.
      }
    }
  }
}

const BANNED_IMPORTS = new Set([
  "child_process",
  "node:child_process",
  "fs",
  "fs/promises",
  "node:fs",
  "node:fs/promises",
  "http",
  "node:http",
  "https",
  "node:https",
  "net",
  "node:net",
  "tls",
  "node:tls",
  "dns",
  "node:dns",
  "dgram",
  "node:dgram",
  "worker_threads",
  "node:worker_threads",
  "cluster",
  "node:cluster"
]);

const BANNED_TEST_MODIFIERS = new Set([
  "only",
  "skip",
  "todo",
  "skipIf",
  "runIf"
]);

const BANNED_CALLS = new Set([
  "assert",
  "assertType",
  "eval",
  "expectTypeOf",
  "fetch",
  "queueMicrotask",
  "require",
  "setImmediate",
  "setInterval",
  "setTimeout"
]);

const BANNED_CONSTRUCTORS = new Set([
  "EventSource",
  "Function",
  "Object",
  "WebSocket",
  "Worker"
]);
const BANNED_GLOBAL_IDENTIFIERS = new Set([
  ...BANNED_CALLS,
  "Bun",
  "Date",
  "Deno",
  "EventSource",
  "Function",
  "Object",
  "Proxy",
  "Reflect",
  "WebSocket",
  "XMLHttpRequest",
  "crypto",
  "document",
  "fetch",
  "global",
  "globalThis",
  "navigator",
  "performance",
  "process",
  "self",
  "Temporal",
  "window"
]);
const BANNED_GLOBAL_PROPERTIES = new Set([
  "__proto__",
  "constructor",
  "defaultView",
  "EventSource",
  "Function",
  "WebSocket",
  "XMLHttpRequest",
  "eval",
  "fail",
  "fetch",
  "getBuiltinModule",
  "hasAssertions",
  "prototype",
  "sendBeacon",
  "unreachable"
]);

const NON_EXECUTING_METHODS = new Set([
  "bind",
  "call",
  "apply",
  "toString",
  "valueOf"
]);
const ALLOWED_VITEST_IMPORTS = new Set([
  "describe",
  "expect",
  "it",
  "test"
]);
const ALLOWED_MATCHERS = new Set([
  "toBe",
  "toBeCloseTo",
  "toBeDefined",
  "toBeFalsy",
  "toBeGreaterThan",
  "toBeGreaterThanOrEqual",
  "toBeLessThan",
  "toBeLessThanOrEqual",
  "toBeNull",
  "toBeTruthy",
  "toBeUndefined",
  "toContain",
  "toEqual",
  "toHaveLength",
  "toMatch",
  "toStrictEqual",
  "toThrow"
]);
const ALLOWED_TEST_PACKAGES = new Set([
  "@testing-library/jest-dom",
  "@testing-library/jest-dom/vitest",
  "@testing-library/react",
  "@testing-library/user-event",
  "react",
  "react-dom",
  "react/jsx-runtime",
  "vitest"
]);

function resolveVisibleCandidates(specifier, testFile) {
  if (!specifier.startsWith(".")) return null;
  const base = path.posix.normalize(
    path.posix.join(path.posix.dirname(testFile), specifier)
  );
  if (!base || base === ".." || base.startsWith("../") || base.startsWith("/")) {
    return null;
  }
  const extension = path.posix.extname(base);
  if (extension === ".js" || extension === ".jsx") {
    const withoutJs = base.slice(0, -extension.length);
    return [`${withoutJs}.ts`, `${withoutJs}.tsx`];
  }
  if (extension) return [base];
  return [
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.mjs`,
    `${base}/index.ts`,
    `${base}/index.tsx`,
    `${base}/index.mjs`
  ];
}

function resolvesToVisibleRepositoryFile(
  specifier,
  testFile,
  allowedRepositoryFiles
) {
  if (!specifier.startsWith(".")) {
    return ALLOWED_TEST_PACKAGES.has(specifier);
  }
  const candidates = resolveVisibleCandidates(specifier, testFile);
  return candidates?.some(candidate => allowedRepositoryFiles.has(candidate)) ?? false;
}

function resolvesToProductionFile(specifier, testFile, productionFiles) {
  if (!specifier.startsWith(".")) return false;
  const candidates = resolveVisibleCandidates(specifier, testFile);
  return candidates?.some(candidate => productionFiles.has(candidate)) ?? false;
}

// Collect exported binding names that are functions or classes (not plain
// values) from the given production source files, so a bare reference to them
// is not treated as a directly-observable value.
function collectProductionFunctionBindings(productionSources) {
  const bindings = new Set();
  for (const source of productionSources?.values() ?? []) {
    if (typeof source !== "string") continue;
    let sourceFile;
    try {
      sourceFile = ts.createSourceFile(
        "production.ts",
        source,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TS
      );
    } catch {
      continue;
    }
    if (sourceFile.parseDiagnostics.length > 0) continue;
    function collect(node) {
      if (
        (ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node)) &&
        node.name
      ) {
        bindings.add(node.name.text);
      }
      if (
        ts.isVariableStatement(node) &&
        node.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword)
      ) {
        for (const declaration of node.declarationList.declarations) {
          if (ts.isIdentifier(declaration.name)) {
            const initializer = declaration.initializer;
            const unwrappedInitializer = initializer
              ? (() => {
                  let current = initializer;
                  while (ts.isParenthesizedExpression(current)) {
                    current = current.expression;
                  }
                  return current;
                })()
              : undefined;
            if (
              unwrappedInitializer &&
              (ts.isArrowFunction(unwrappedInitializer) ||
                ts.isFunctionExpression(unwrappedInitializer) ||
                ts.isClassExpression(unwrappedInitializer))
            ) {
              bindings.add(declaration.name.text);
            }
          }
        }
      }
      ts.forEachChild(node, collect);
    }
    collect(sourceFile);
  }
  return bindings;
}

function inspectSource(
  sourceFile,
  source,
  testFile,
  testName,
  requiredAssertionMessage,
  allowedRepositoryFiles,
  productionFiles,
  productionFunctionBindings = new Set()
) {
  const errors = [];
  const tests = [];
  const expectCalls = [];
  const matcherCalls = [];
  const repositoryBindings = new Set();
  const shadowedBindings = new Set();
  const productionFunctionLocals = new Set();
  let hasBehaviorAssertionMessage = false;

  function recordRepositoryBindings(importClause) {
    if (!importClause) return;
    if (importClause.name) repositoryBindings.add(importClause.name.text);
    const bindings = importClause.namedBindings;
    if (!bindings) return;
    if (ts.isNamespaceImport(bindings)) {
      repositoryBindings.add(bindings.name.text);
    } else if (ts.isNamedImports(bindings)) {
      for (const element of bindings.elements) {
        repositoryBindings.add(element.name.text);
      }
    }
  }

  function recordProductionFunctionLocals(importClause) {
    if (!importClause || !importClause.namedBindings) return;
    if (!ts.isNamedImports(importClause.namedBindings)) return;
    for (const element of importClause.namedBindings.elements) {
      const importedName = element.propertyName?.text ?? element.name.text;
      if (productionFunctionBindings.has(importedName)) {
        productionFunctionLocals.add(element.name.text);
      }
    }
  }

  function recordShadowedBinding(nameNode, kindLabel) {
    if (ts.isIdentifier(nameNode)) {
      const name = nameNode.text;
      if (repositoryBindings.has(name) && !shadowedBindings.has(name)) {
        shadowedBindings.add(name);
        errors.push(
          `local ${kindLabel} shadows the production import: ${name}`
        );
      }
      return;
    }
    if (ts.isObjectBindingPattern(nameNode) || ts.isArrayBindingPattern(nameNode)) {
      for (const element of nameNode.elements) {
        if (ts.isBindingElement(element) && element.name) {
          recordShadowedBinding(element.name, kindLabel);
        }
      }
    }
  }

  function validateVitestImports(importClause) {
    if (
      !importClause ||
      importClause.name ||
      !ts.isNamedImports(importClause.namedBindings)
    ) {
      errors.push("Vitest imports must use approved named bindings");
      return;
    }
    for (const element of importClause.namedBindings.elements) {
      const imported = element.propertyName?.text ?? element.name.text;
      if (
        !ALLOWED_VITEST_IMPORTS.has(imported) ||
        element.name.text !== imported
      ) {
        errors.push(`forbidden Vitest import: ${imported}`);
      }
    }
  }

  function unwrapExpression(node) {
    let current = node;
    while (
      ts.isParenthesizedExpression(current) ||
      ts.isAsExpression(current) ||
      ts.isTypeAssertionExpression(current) ||
      ts.isNonNullExpression(current) ||
      ts.isAwaitExpression(current)
    ) {
      current = current.expression;
    }
    return current;
  }

  function staticTruthiness(node) {
    const current = unwrapExpression(node);
    if (
      current.kind === ts.SyntaxKind.TrueKeyword ||
      ts.isNumericLiteral(current) && Number(current.text) !== 0 ||
      ts.isStringLiteralLike(current) && current.text.length > 0 ||
      ts.isNoSubstitutionTemplateLiteral(current) && current.text.length > 0
    ) {
      return true;
    }
    if (
      current.kind === ts.SyntaxKind.FalseKeyword ||
      current.kind === ts.SyntaxKind.NullKeyword ||
      ts.isNumericLiteral(current) && Number(current.text) === 0 ||
      ts.isStringLiteralLike(current) && current.text.length === 0 ||
      ts.isNoSubstitutionTemplateLiteral(current) && current.text.length === 0
    ) {
      return false;
    }
    return null;
  }

  function staticIsNullOrUndefined(node) {
    const current = unwrapExpression(node);
    if (current.kind === ts.SyntaxKind.NullKeyword) return true;
    if (
      ts.isIdentifier(current) &&
      current.text === "undefined" &&
      !repositoryBindings.has("undefined")
    ) {
      return true;
    }
    return false;
  }

  function isRepositoryReference(node) {
    const current = unwrapExpression(node);
    if (ts.isIdentifier(current)) {
      return (
        repositoryBindings.has(current.text) &&
        !shadowedBindings.has(current.text)
      );
    }
    if (ts.isPropertyAccessExpression(current)) {
      return isRepositoryReference(current.expression);
    }
    return false;
  }

  // A try/catch whose catch block never rethrows swallows any synchronous
  // error from the try block, so a toThrow() assertion on a callback wrapping
  // it can never see the target error and is guaranteed to fail.
  function hasErrorSwallowingTryCatch(node) {
    let found = false;
    function scan(current) {
      if (found) return;
      if (ts.isTryStatement(current) && current.catchClause) {
        const catchBlock = current.catchClause.block;
        const rethrows = catchBlock.statements.some(
          statement => ts.isThrowStatement(statement)
        );
        if (!rethrows) {
          found = true;
          return;
        }
      }
      ts.forEachChild(current, scan);
    }
    scan(node);
    return found;
  }

  function isExecutedRepositoryObservation(node) {
    const current = unwrapExpression(node);
    if (ts.isArrowFunction(current) || ts.isFunctionExpression(current)) {
      if (hasErrorSwallowingTryCatch(current.body)) {
        return false;
      }
      let observed = false;
      function visitCallback(child, loopDepth = 0) {
        if (observed) return;
        // A nested function only executes when it is immediately invoked;
        // an uninvoked declaration does not execute its repository calls.
        const childNode = unwrapExpression(child);
        if (
          ts.isArrowFunction(childNode) ||
          ts.isFunctionExpression(childNode) ||
          ts.isFunctionDeclaration(childNode)
        ) {
          return;
        }
        if (ts.isBlock(child)) {
          for (const statement of child.statements) {
            if (
              ts.isReturnStatement(statement) ||
              ts.isThrowStatement(statement) ||
              (loopDepth > 0 &&
                (ts.isBreakStatement(statement) || ts.isContinueStatement(statement)))
            ) {
              // Statements after an unconditional return/throw/break/continue
              // never execute.
              return;
            }
            visitCallback(statement, loopDepth);
          }
          return;
        }
        if (ts.isWhileStatement(child)) {
          const loopCondition = unwrapExpression(child.expression);
          if (staticTruthiness(loopCondition) === false) return;
          visitCallback(child.statement, loopDepth + 1);
          return;
        }
        if (ts.isForStatement(child)) {
          if (
            child.condition &&
            staticTruthiness(unwrapExpression(child.condition)) === false
          ) {
            return;
          }
          visitCallback(child.statement, loopDepth + 1);
          return;
        }
        if (ts.isIfStatement(child)) {
          const condition = unwrapExpression(child.expression);
          if (condition.kind === ts.SyntaxKind.TrueKeyword) {
            ts.forEachChild(child.thenStatement, visitCallback);
            return;
          }
          if (condition.kind === ts.SyntaxKind.FalseKeyword) {
            if (child.elseStatement) {
              ts.forEachChild(child.elseStatement, visitCallback);
            }
            return;
          }
        }
        if (
          ts.isBinaryExpression(childNode) &&
          childNode.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken
        ) {
          const leftTruth = staticTruthiness(childNode.left);
          visitCallback(childNode.left, loopDepth);
          if (leftTruth === false) return;
          visitCallback(childNode.right, loopDepth);
          return;
        }
        if (
          ts.isBinaryExpression(childNode) &&
          childNode.operatorToken.kind === ts.SyntaxKind.BarBarToken
        ) {
          const leftTruth = staticTruthiness(childNode.left);
          visitCallback(childNode.left, loopDepth);
          if (leftTruth === true) return;
          visitCallback(childNode.right, loopDepth);
          return;
        }
        if (
          ts.isBinaryExpression(childNode) &&
          childNode.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken
        ) {
          const leftIsNull = staticIsNullOrUndefined(childNode.left);
          visitCallback(childNode.left, loopDepth);
          if (leftIsNull === false) return;
          visitCallback(childNode.right, loopDepth);
          return;
        }
        if (ts.isConditionalExpression(childNode)) {
          const conditionTruth = staticTruthiness(childNode.condition);
          visitCallback(childNode.condition, loopDepth);
          if (conditionTruth === true) {
            visitCallback(childNode.whenTrue, loopDepth);
            return;
          }
          if (conditionTruth === false) {
            visitCallback(childNode.whenFalse, loopDepth);
            return;
          }
          visitCallback(childNode.whenTrue, loopDepth);
          visitCallback(childNode.whenFalse, loopDepth);
          return;
        }
        if (
          ts.isCallExpression(unwrapExpression(child)) &&
          isExecutedRepositoryObservation(child)
        ) {
          observed = true;
          return;
        }
        ts.forEachChild(child, visitCallback);
      }
      visitCallback(current.body);
      return observed;
    }
    if (ts.isPropertyAccessExpression(current)) {
      return isExecutedRepositoryObservation(current.expression);
    }
    if (ts.isIdentifier(current)) {
      // Reading a directly-observed production value (an exported constant or
      // stable object property) is a valid RED observation even without a call,
      // but only when the production source lets us distinguish a value from an
      // exported function. A bare reference to an exported function (including
      // through an import alias) is not an observation, and without production
      // source info a bare reference is not provably a value observation.
      if (productionFunctionLocals.has(current.text)) return false;
      if (productionFunctionBindings.size === 0) return false;
      return isRepositoryReference(current);
    }
    if (ts.isCallExpression(current)) {
      const callee = unwrapExpression(current.expression);
      if (
        ts.isPropertyAccessExpression(callee) &&
        NON_EXECUTING_METHODS.has(callee.name.text)
      ) {
        return false;
      }
      return isRepositoryReference(callee) ||
        isExecutedRepositoryObservation(callee);
    }
    return false;
  }

  function visit(node) {
    if (
      ts.isImportDeclaration(node) &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      const specifier = node.moduleSpecifier.text;
      if (
        BANNED_IMPORTS.has(specifier) ||
        specifier.startsWith("@supabase/") ||
        /(?:^|[/_.-])fixtures?(?:[/_.-]|$)/i.test(specifier) ||
        /\.snap$/i.test(specifier)
      ) {
        errors.push(`forbidden import: ${specifier}`);
      }
      if (
        !resolvesToVisibleRepositoryFile(
          specifier,
          testFile,
          allowedRepositoryFiles
        )
      ) {
        errors.push("import is outside the RED prompt manifest");
      }
      if (specifier === "vitest") {
        validateVitestImports(node.importClause);
      } else if (resolvesToProductionFile(specifier, testFile, productionFiles)) {
        recordRepositoryBindings(node.importClause);
        recordProductionFunctionLocals(node.importClause);
      }
    }

    if (ts.isImportEqualsDeclaration(node)) {
      errors.push("TypeScript import-equals declarations are forbidden");
    }

    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword
    ) {
      errors.push("dynamic imports are forbidden");
    }

    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
      if (BANNED_CALLS.has(node.expression.text)) {
        errors.push(`forbidden call: ${node.expression.text}`);
      }
      if (
        ["it", "test"].includes(node.expression.text) &&
        node.arguments.length > 0 &&
        ts.isStringLiteralLike(node.arguments[0])
      ) {
        tests.push(node.arguments[0].text);
      }
      if (
        node.expression.text === "expect" &&
        node.arguments.length > 0
      ) {
        expectCalls.push(node);
        if (
          node.arguments.length > 1 &&
          ts.isStringLiteralLike(node.arguments[1]) &&
          node.arguments[1].text === requiredAssertionMessage
        ) {
          hasBehaviorAssertionMessage = true;
        }
      }
    }

    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      ts.isCallExpression(node.expression.expression) &&
      node.expression.expression.expression.kind !== ts.SyntaxKind.ImportKeyword &&
      ts.isIdentifier(node.expression.expression.expression) &&
      node.expression.expression.expression.text === "expect"
    ) {
      matcherCalls.push(node);
      if (!ALLOWED_MATCHERS.has(node.expression.name.text)) {
        errors.push(`forbidden matcher: ${node.expression.name.text}`);
      }
    }

    if (ts.isNewExpression(node) && ts.isIdentifier(node.expression)) {
      if (BANNED_CONSTRUCTORS.has(node.expression.text)) {
        errors.push(`forbidden constructor: ${node.expression.text}`);
      }
    }

    if (ts.isPropertyAccessExpression(node)) {
      const propertyName = node.name.text;
      if (BANNED_TEST_MODIFIERS.has(propertyName)) {
        errors.push(`forbidden test modifier: ${propertyName}`);
      }
      const expressionText = node.expression.getText(sourceFile);
      if (
        expressionText === "expect" ||
        (expressionText === "Date" && propertyName === "now") ||
        (expressionText === "Math" && propertyName === "random") ||
        (expressionText === "crypto" && propertyName === "randomUUID") ||
        (expressionText === "Promise" && propertyName === "reject") ||
        expressionText === "process" ||
        BANNED_GLOBAL_PROPERTIES.has(propertyName) ||
        (expressionText === "vi" &&
          ["doMock", "mock", "spyOn", "stubEnv", "stubGlobal"].includes(propertyName))
      ) {
        errors.push(`forbidden access: ${expressionText}.${propertyName}`);
      }
    }

    if (ts.isElementAccessExpression(node)) {
      errors.push("computed property access is forbidden");
    }

    if (
      ts.isObjectBindingPattern(node) ||
      ts.isArrayBindingPattern(node) ||
      (ts.isBindingElement(node) && node.propertyName)
    ) {
      errors.push("destructuring bindings are forbidden");
    }

    if (ts.isThrowStatement(node)) {
      errors.push("throw statements are forbidden");
    }

    if (
      ts.isStringLiteralLike(node) &&
      /\bAssertionError\b/.test(node.text)
    ) {
      errors.push("forged assertion diagnostics are forbidden");
    }

    if (node.kind === ts.SyntaxKind.AnyKeyword) {
      errors.push("TypeScript any is forbidden");
    }

    if (
      ts.isIdentifier(node) &&
      BANNED_GLOBAL_IDENTIFIERS.has(node.text)
    ) {
      errors.push(`forbidden global: ${node.text}`);
    }
    if (ts.isVariableDeclaration(node)) {
      const declaredName = node.name;
      if (
        ts.isIdentifier(declaredName) &&
        repositoryBindings.has(declaredName.text) &&
        !shadowedBindings.has(declaredName.text)
      ) {
        shadowedBindings.add(declaredName.text);
        errors.push(
          `local declaration shadows the production import: ${declaredName.text}`
        );
      } else if (
        ts.isObjectBindingPattern(declaredName) ||
        ts.isArrayBindingPattern(declaredName)
      ) {
        recordShadowedBinding(declaredName, "declaration");
      }
    }
    if (ts.isFunctionDeclaration(node) && node.name) {
      recordShadowedBinding(node.name, "function");
    }
    if (ts.isClassDeclaration(node) && node.name) {
      recordShadowedBinding(node.name, "class");
    }
    if (ts.isParameter(node) && node.name) {
      recordShadowedBinding(node.name, "parameter");
    }
    if (ts.isCatchClause(node) && node.variableDeclaration?.name) {
      recordShadowedBinding(node.variableDeclaration.name, "catch binding");
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  if (/\bprocess\s*\.\s*env\b/.test(source)) {
    errors.push("process.env access is forbidden");
  }
  if (/\bimport\s*\.\s*meta\s*\.\s*env\b/.test(source)) {
    errors.push("import.meta.env access is forbidden");
  }
  if (/\b(?:Deno|Bun)\s*\.\s*env\b/.test(source)) {
    errors.push("runtime environment access is forbidden");
  }
  if (/\b(?:https?|wss?):\/\//i.test(source)) {
    errors.push("network URLs are forbidden");
  }
  if (/\b(?:curl|wget|pnpm\s+dlx|npm\s+exec|npx)\b/i.test(source)) {
    errors.push("dynamic download commands are forbidden");
  }

  if (tests.length !== 1 || tests[0] !== testName) {
    errors.push("candidate must declare exactly the specified testName");
  }
  if (expectCalls.length !== 1 || !hasBehaviorAssertionMessage) {
    errors.push("candidate must contain exactly one labeled expect() assertion");
  } else {
    const received = expectCalls[0].arguments[0];
    if (
      ts.isStringLiteralLike(received) ||
      ts.isNumericLiteral(received) ||
      received.kind === ts.SyntaxKind.TrueKeyword ||
      received.kind === ts.SyntaxKind.FalseKeyword ||
      received.kind === ts.SyntaxKind.NullKeyword ||
      ts.isArrayLiteralExpression(received) ||
      ts.isObjectLiteralExpression(received)
    ) {
      errors.push("expect() must assert observed behavior, not a literal value");
    }
    if (
      matcherCalls.length !== 1 ||
      matcherCalls[0].expression.expression !== expectCalls[0]
    ) {
      errors.push("the labeled expect() must have exactly one direct matcher");
    } else {
      if (!isExecutedRepositoryObservation(received)) {
        errors.push(
          "expect() must execute or call a prompt-visible repository import"
        );
      }
      const matcherName = matcherCalls[0].expression.name.text;
      const operand = matcherCalls[0].arguments[0];
      const isIdentityMatcher = matcherName === "toBe" || matcherName === "toEqual";
      if (isIdentityMatcher && operand) {
        const unwrapped = unwrapExpression(operand);
        if (
          ts.isObjectLiteralExpression(unwrapped) ||
          ts.isArrayLiteralExpression(unwrapped) ||
          ts.isArrowFunction(unwrapped) ||
          ts.isFunctionExpression(unwrapped) ||
          ts.isClassExpression(unwrapped) ||
          ts.isRegularExpressionLiteral(unwrapped) ||
          ts.isNewExpression(unwrapped)
        ) {
          errors.push(
            `${matcherName}() must not assert against a fresh-identity literal operand`
          );
        }
        if (ts.isCallExpression(unwrapped)) {
          const callee = unwrapExpression(unwrapped.expression);
          const calleeText = callee?.getText(sourceFile) ?? "";
          if (
            calleeText === "Symbol" ||
            calleeText === "Object" ||
            calleeText === "BigInt" ||
            calleeText === "Promise.resolve" ||
            calleeText === "Object.create" ||
            calleeText === "Array.from"
          ) {
            errors.push(
              `${matcherName}() must not assert against a fresh-identity factory call operand`
            );
          }
        }
      }
    }
  }

  return errors;
}

export function validateRegressionCandidate(candidate, {
  finding,
  sensitiveValues = [],
  allowedRepositoryFiles = finding?.productionFiles ?? [],
  productionSources = new Map()
} = {}) {
  if (!finding || finding.status !== "finding") {
    return invalid("a validated finding is required");
  }
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    return invalid("candidate must be a plain object");
  }

  const keys = Object.keys(candidate);
  const unknown = keys.filter(key => !CANDIDATE_KEYS.includes(key));
  const missing = CANDIDATE_KEYS.filter(key => candidate[key] === undefined);
  if (unknown.length > 0) return invalid(`candidate has unknown fields: ${unknown.join(", ")}`);
  if (missing.length > 0) return invalid(`candidate is missing fields: ${missing.join(", ")}`);
  if (candidate.schemaVersion !== 1) return invalid("candidate schemaVersion must be 1");
  if (candidate.status !== "regression-test") {
    return invalid('candidate status must be "regression-test"');
  }

  const expectedTestFile = finding.reproduction?.testFile;
  const expectedTestName = finding.reproduction?.testName;
  if (candidate.testFile !== expectedTestFile) {
    return invalid("candidate testFile does not match finding.reproduction.testFile");
  }
  if (candidate.testName !== expectedTestName) {
    return invalid("candidate testName does not match finding.reproduction.testName");
  }
  if (
    typeof candidate.testFile !== "string" ||
    candidate.testFile.includes("\\") ||
    !isPathSafe(candidate.testFile) ||
    !isValidRegressionTest(candidate.testFile, finding.productionFiles?.[0])
  ) {
    return invalid("candidate testFile is not a canonical colocated regression-test path");
  }

  if (typeof candidate.source !== "string" || candidate.source.trim() === "") {
    return invalid("candidate source must be a non-empty string");
  }
  if (Buffer.byteLength(candidate.source, "utf8") > MAX_REGRESSION_TEST_BYTES) {
    return invalid(`candidate source exceeds ${MAX_REGRESSION_TEST_BYTES} bytes`);
  }
  if (candidate.source.split("\n").length > MAX_REGRESSION_TEST_LINES) {
    return invalid(`candidate source exceeds ${MAX_REGRESSION_TEST_LINES} lines`);
  }
  const redactedSource = redactForOutput(candidate.source, sensitiveValues);
  if (redactedSource !== candidate.source) {
    return invalid("candidate source contains sensitive content");
  }

  const sourceFile = ts.createSourceFile(
    candidate.testFile,
    candidate.source,
    ts.ScriptTarget.Latest,
    true,
    candidate.testFile.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  );
  if (sourceFile.parseDiagnostics.length > 0) {
    return invalid("candidate source contains TypeScript syntax errors");
  }
  const requiredAssertionMessage =
    `Expected behavior: ${finding.expectedBehavior} | ` +
    `Actual behavior: ${finding.actualBehavior}`;
  const sourceErrors = inspectSource(
    sourceFile,
    candidate.source,
    candidate.testFile,
    candidate.testName,
    requiredAssertionMessage,
    new Set(allowedRepositoryFiles.map(filePath => String(filePath).replace(/\\/g, "/"))),
    new Set((finding.productionFiles ?? []).map(filePath => String(filePath).replace(/\\/g, "/"))),
    collectProductionFunctionBindings(productionSources)
  );
  if (sourceErrors.length > 0) {
    return invalid(sourceErrors[0]);
  }

  return {
    valid: true,
    result: {
      schemaVersion: 1,
      status: "regression-test",
      testFile: candidate.testFile,
      testName: candidate.testName,
      source: candidate.source
    }
  };
}
