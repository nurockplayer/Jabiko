import { describe, expect, it } from "vitest";
// @ts-expect-error -- plain .mjs module, no types
import { validateRegressionCandidate } from "./red-validator.mjs";

const finding = {
  schemaVersion: 1,
  status: "finding",
  title: "returns the fallback for an empty queue",
  confidence: 0.95,
  category: "boundary-condition",
  evidence: [
    {
      file: "src/domain/example.ts",
      startLine: 1,
      endLine: 3,
      reason: "The empty branch returns the wrong fallback."
    }
  ],
  expectedBehavior: "an empty queue returns the safe fallback",
  actualBehavior: "an empty queue returns the stale value",
  reproduction: {
    testFile: "src/domain/example.regression.test.ts",
    testName: "returns the safe fallback for an empty queue"
  },
  productionFiles: ["src/domain/example.ts"],
  risk: "low"
};

const validSource = `import { expect, it } from "vitest";
import { readEmptyQueue } from "./example";

it("returns the safe fallback for an empty queue", () => {
  expect(
    readEmptyQueue(),
    "Expected behavior: an empty queue returns the safe fallback | Actual behavior: an empty queue returns the stale value",
  ).toBe("safe");
});
`;

describe("validateRegressionCandidate", () => {
  it("accepts exactly the finding-designated regression test", () => {
    const result = validateRegressionCandidate(
      {
        schemaVersion: 1,
        status: "regression-test",
        testFile: finding.reproduction.testFile,
        testName: finding.reproduction.testName,
        source: validSource
      },
      { finding, sensitiveValues: [] }
    );

    expect(result).toEqual({
      valid: true,
      result: {
        schemaVersion: 1,
        status: "regression-test",
        testFile: finding.reproduction.testFile,
        testName: finding.reproduction.testName,
        source: validSource
      }
    });
  });

  it.each([
    ["path traversal", "../example.regression.test.ts"],
    ["Windows separators", "src\\domain\\example.regression.test.ts"],
    ["a non-regression test", "src/domain/example.test.ts"]
  ])("rejects %s in the test path", (_label, testFile) => {
    const result = validateRegressionCandidate(
      {
        schemaVersion: 1,
        status: "regression-test",
        testFile,
        testName: finding.reproduction.testName,
        source: validSource
      },
      {
        finding: {
          ...finding,
          reproduction: { ...finding.reproduction, testFile }
        },
        sensitiveValues: []
      }
    );

    expect(result.valid).toBe(false);
  });

  it("rejects a candidate path different from the validated finding", () => {
    const result = validateRegressionCandidate(
      {
        schemaVersion: 1,
        status: "regression-test",
        testFile: "src/domain/other.regression.test.ts",
        testName: finding.reproduction.testName,
        source: validSource
      },
      { finding, sensitiveValues: [] }
    );

    expect(result.valid).toBe(false);
  });

  it("rejects model-provided commands and all unknown fields", () => {
    const result = validateRegressionCandidate(
      {
        schemaVersion: 1,
        status: "regression-test",
        testFile: finding.reproduction.testFile,
        testName: finding.reproduction.testName,
        source: validSource,
        command: "sh -c 'exit 0'"
      },
      { finding, sensitiveValues: [] }
    );

    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/unknown fields/i);
  });

  it.each([
    ["focused test", "it.only"],
    ["skipped test", "it.skip"],
    ["todo test", "it.todo"],
    ["conditional skip", "it.skipIf"],
    ["child process import", 'import { exec } from "node:child_process";'],
    ["filesystem import", 'import fs from "node:fs";'],
    ["network import", 'import https from "node:https";'],
    ["network call", "fetch("],
    ["WebSocket access", "new WebSocket("],
    ["secret environment access", "process.env."],
    ["Vite environment access", "import.meta.env."],
    ["dynamic import", "import("],
    ["CommonJS require", "require("],
    ["eval", "eval("],
    ["dynamic Function", "new Function("],
    ["dynamic download URL", "https://example.com/payload"],
    ["package download", "pnpm dlx"],
    ["TypeScript any annotation", ": any"],
    ["TypeScript any assertion", " as any"],
    ["mock replacement", "vi.mock("],
    ["wall clock", "Date.now("],
    ["Date constructor", "new Date("],
    ["performance clock", "performance.now("],
    ["randomness", "Math.random("],
    ["crypto randomness", "crypto.getRandomValues("],
    ["timer", "setTimeout("]
  ])("rejects %s", (_label, hostileToken) => {
    let source = validSource;
    if (hostileToken.startsWith("it.")) {
      source = source.replace('it("returns', `${hostileToken}("returns`);
    } else if (hostileToken.startsWith("import ")) {
      source = `${hostileToken}\n${source}`;
    } else if (hostileToken === ": any") {
      source = source.replace("readEmptyQueue()", "(readEmptyQueue() as unknown as any)");
    } else if (hostileToken === " as any") {
      source = source.replace("readEmptyQueue()", "readEmptyQueue() as any");
    } else if (hostileToken === "https://example.com/payload" || hostileToken === "pnpm dlx") {
      source = source.replace('import { expect', `// ${hostileToken}\nimport { expect`);
    } else {
      source = source.replace("readEmptyQueue()", `${hostileToken}readEmptyQueue())`);
    }

    const result = validateRegressionCandidate(
      {
        schemaVersion: 1,
        status: "regression-test",
        testFile: finding.reproduction.testFile,
        testName: finding.reproduction.testName,
        source
      },
      { finding, sensitiveValues: [] }
    );

    expect(result.valid).toBe(false);
  });

  it("rejects source containing a sensitive value or API-key shaped token", () => {
    const fakeSecret = "fixture-secret-environment-value";
    for (const source of [
      `${validSource}\n// ${fakeSecret}\n`,
      `${validSource}\n// AIza${"A".repeat(35)}\n`
    ]) {
      const result = validateRegressionCandidate(
        {
          schemaVersion: 1,
          status: "regression-test",
          testFile: finding.reproduction.testFile,
          testName: finding.reproduction.testName,
          source
        },
        { finding, sensitiveValues: [fakeSecret] }
      );

      expect(result.valid).toBe(false);
      expect(result.error).not.toContain(fakeSecret);
    }
  });

  it("rejects an assertion message without explicit expected/actual behavior labels", () => {
    const source = validSource
      .replace("Expected behavior: ", "")
      .replace("Actual behavior: ", "");
    const result = validateRegressionCandidate(
      {
        schemaVersion: 1,
        status: "regression-test",
        testFile: finding.reproduction.testFile,
        testName: finding.reproduction.testName,
        source
      },
      { finding, sensitiveValues: [] }
    );

    expect(result.valid).toBe(false);
  });

  it.each([
    ['void globalThis.fetch("https:" + "//example.invalid");', "global fetch"],
    ['void window["fetch"]("https:" + "//example.invalid");', "bracket fetch"],
    [
      'void globalThis["pro" + "cess"].getBuiltinModule("node:child_process").execSync("true");',
      "computed child process access"
    ],
    [
      'it["on" + "ly"]("hidden focused test", () => undefined);',
      "computed focused test"
    ],
    [
      'void (() => undefined).constructor("return process")();',
      "Function-constructor access"
    ],
    [
      'const { constructor: Factory } = () => undefined; void Factory("return process")();',
      "destructured constructor access"
    ],
    [
      'void Object.getPrototypeOf(() => undefined);',
      "Object introspection"
    ],
    ["void new Date();", "Date constructor statement"],
    ["void performance.now();", "performance clock statement"],
    [
      "void crypto.getRandomValues(new Uint8Array(1));",
      "crypto randomness statement"
    ],
    ['void navigator.sendBeacon("/collect", "x");', "sendBeacon"],
    ['void process["env"]["GEMINI_API_KEY"];', "bracket environment"],
    ['const { env } = process; void env;', "destructured environment"],
    ['void globalThis["eval"]("1");', "bracket eval"],
    ['const run = eval; void run("1 + 1");', "aliased eval"]
  ])("rejects syntactically valid %s bypass", statement => {
    const source = validSource.replace(
      '  expect(\n',
      `  ${statement}\n  expect(\n`
    );
    const result = validateRegressionCandidate(
      {
        schemaVersion: 1,
        status: "regression-test",
        testFile: finding.reproduction.testFile,
        testName: finding.reproduction.testName,
        source
      },
      { finding, sensitiveValues: [] }
    );

    expect(result.valid).toBe(false);
  });

  it.each([
    ["process environment", "void process.env.GEMINI_API_KEY;"],
    ["Vite environment", "void import.meta.env.GEMINI_API_KEY;"],
    ["explicit rejected promise", 'void Promise.reject(new Error("background"));'],
    ["process exit", "process.exit(1);"]
  ])("rejects syntactically valid %s access", (_label, statement) => {
    const source = validSource.replace(
      '  expect(\n',
      `  ${statement}\n  expect(\n`
    );
    const result = validateRegressionCandidate(
      {
        schemaVersion: 1,
        status: "regression-test",
        testFile: finding.reproduction.testFile,
        testName: finding.reproduction.testName,
        source
      },
      { finding, sensitiveValues: [] }
    );

    expect(result.valid).toBe(false);
  });

  it("rejects multiple tests even when the designated name is present", () => {
    const result = validateRegressionCandidate(
      {
        schemaVersion: 1,
        status: "regression-test",
        testFile: finding.reproduction.testFile,
        testName: finding.reproduction.testName,
        source: `${validSource}\nit("unrelated extra case", () => expect(true).toBe(true));\n`
      },
      { finding, sensitiveValues: [] }
    );

    expect(result.valid).toBe(false);
  });

  it.each([
    [
      "a forged AssertionError throw",
      `throw Object.assign(
    new Error("Expected behavior: ${finding.expectedBehavior} | Actual behavior: ${finding.actualBehavior}"),
    { name: "AssertionError" },
  );`
    ],
    [
      "expect.fail",
      `expect.fail(
    "Expected behavior: ${finding.expectedBehavior} | Actual behavior: ${finding.actualBehavior}",
  );`
    ],
    [
      "Vitest assert",
      `assert(
    false,
    "Expected behavior: ${finding.expectedBehavior} | Actual behavior: ${finding.actualBehavior}",
  );`
    ],
    [
      "expect.unreachable",
      `expect.unreachable(
    "Expected behavior: ${finding.expectedBehavior} | Actual behavior: ${finding.actualBehavior}",
  );`
    ],
    [
      "expect.soft",
      `expect.soft(
    readEmptyQueue(),
    "Expected behavior: ${finding.expectedBehavior} | Actual behavior: ${finding.actualBehavior}",
  ).toBe("safe");`
    ]
  ])("rejects %s before the behavior assertion", (_label, statement) => {
    let source = validSource.replace(
      "  expect(\n",
      `  ${statement}\n  expect(\n`
    );
    if (_label === "Vitest assert") {
      source = source.replace(
        'import { expect, it } from "vitest";',
        'import { assert, expect, it } from "vitest";'
      );
    }
    const result = validateRegressionCandidate(
      {
        schemaVersion: 1,
        status: "regression-test",
        testFile: finding.reproduction.testFile,
        testName: finding.reproduction.testName,
        source
      },
      { finding, sensitiveValues: [] }
    );

    expect(result.valid).toBe(false);
  });

  it("rejects multiple expect calls even when one carries the behavior label", () => {
    const source = validSource.replace(
      "  expect(\n",
      '  expect("unrelated").toBe("unrelated");\n  expect(\n'
    );
    const result = validateRegressionCandidate(
      {
        schemaVersion: 1,
        status: "regression-test",
        testFile: finding.reproduction.testFile,
        testName: finding.reproduction.testName,
        source
      },
      { finding, sensitiveValues: [] }
    );

    expect(result.valid).toBe(false);
  });

  it("rejects a literal-only forced assertion failure", () => {
    const source = validSource.replace("readEmptyQueue()", "false");
    const result = validateRegressionCandidate(
      {
        schemaVersion: 1,
        status: "regression-test",
        testFile: finding.reproduction.testFile,
        testName: finding.reproduction.testName,
        source
      },
      { finding, sensitiveValues: [] }
    );

    expect(result.valid).toBe(false);
  });

  it("rejects a forced expression that does not observe a repository import", () => {
    const source = validSource.replace("readEmptyQueue()", "Boolean(0)");
    const result = validateRegressionCandidate(
      {
        schemaVersion: 1,
        status: "regression-test",
        testFile: finding.reproduction.testFile,
        testName: finding.reproduction.testName,
        source
      },
      {
        finding,
        sensitiveValues: [],
        allowedRepositoryFiles: ["src/domain/example.ts"]
      }
    );

    expect(result.valid).toBe(false);
  });

  it("rejects asserting on an imported function without executing it", () => {
    const source = validSource
      .replace("readEmptyQueue()", "readEmptyQueue")
      .replace('.toBe("safe")', ".toBeUndefined()");
    const result = validateRegressionCandidate(
      {
        schemaVersion: 1,
        status: "regression-test",
        testFile: finding.reproduction.testFile,
        testName: finding.reproduction.testName,
        source
      },
      { finding, sensitiveValues: [] }
    );

    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/execute|call/i);
  });

  it("requires toThrow assertions to contain an explicit repository call", () => {
    const bareReference = validSource
      .replace("readEmptyQueue()", "readEmptyQueue")
      .replace('.toBe("safe")', ".toThrow()");
    const explicitCall = validSource
      .replace("readEmptyQueue()", "() => readEmptyQueue()")
      .replace('.toBe("safe")', ".toThrow()");

    const bareResult = validateRegressionCandidate(
      {
        schemaVersion: 1,
        status: "regression-test",
        testFile: finding.reproduction.testFile,
        testName: finding.reproduction.testName,
        source: bareReference
      },
      { finding, sensitiveValues: [] }
    );
    const explicitResult = validateRegressionCandidate(
      {
        schemaVersion: 1,
        status: "regression-test",
        testFile: finding.reproduction.testFile,
        testName: finding.reproduction.testName,
        source: explicitCall
      },
      { finding, sensitiveValues: [] }
    );

    expect(bareResult.valid).toBe(false);
    expect(explicitResult.valid).toBe(true);
  });

  it("rejects a callback whose repository call is inside an unreachable if-false branch", () => {
    const source = validSource
      .replace("readEmptyQueue()", "() => { if (false) { readEmptyQueue(); } }")
      .replace('.toBe("safe")', ".toThrow()");
    const result = validateRegressionCandidate(
      {
        schemaVersion: 1,
        status: "regression-test",
        testFile: finding.reproduction.testFile,
        testName: finding.reproduction.testName,
        source
      },
      { finding, sensitiveValues: [] }
    );

    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/execute|call/i);
  });

  it("accepts a callback with a repository call inside an if-true branch", () => {
    const source = validSource
      .replace("readEmptyQueue()", "() => { if (true) { readEmptyQueue(); } }")
      .replace('.toBe("safe")', ".toThrow()");
    const result = validateRegressionCandidate(
      {
        schemaVersion: 1,
        status: "regression-test",
        testFile: finding.reproduction.testFile,
        testName: finding.reproduction.testName,
        source
      },
      { finding, sensitiveValues: [] }
    );

    expect(result.valid).toBe(true);
  });

  it.each([
    "() => { const unused = () => readEmptyQueue(); }",
    "() => { const unused = function () { readEmptyQueue(); }; }",
    "() => { function unused() { readEmptyQueue(); } }"
  ])("rejects a callback whose repository call is inside an uninvoked nested function: %s", callback => {
    const source = validSource
      .replace("readEmptyQueue()", callback)
      .replace('.toBe("safe")', ".toThrow()");
    const result = validateRegressionCandidate(
      {
        schemaVersion: 1,
        status: "regression-test",
        testFile: finding.reproduction.testFile,
        testName: finding.reproduction.testName,
        source
      },
      { finding, sensitiveValues: [] }
    );

    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/execute|call/i);
  });

  it("accepts a callback that executes the repository call inside an immediately-invoked function expression", () => {
    const source = validSource
      .replace("readEmptyQueue()", "() => (() => readEmptyQueue())()")
      .replace('.toBe("safe")', ".toThrow()");
    const result = validateRegressionCandidate(
      {
        schemaVersion: 1,
        status: "regression-test",
        testFile: finding.reproduction.testFile,
        testName: finding.reproduction.testName,
        source
      },
      { finding, sensitiveValues: [] }
    );

    expect(result.valid).toBe(true);
  });

  describe("RED must observe the target production interface, not any visible helper", () => {
    const helperInManifest = [
      "src/domain/example.ts",
      "src/domain/example-helper.ts"
    ];

    function evaluate(source, allowedFiles = helperInManifest) {
      return validateRegressionCandidate(
        {
          schemaVersion: 1,
          status: "regression-test",
          testFile: finding.reproduction.testFile,
          testName: finding.reproduction.testName,
          source
        },
        {
          finding,
          sensitiveValues: [],
          allowedRepositoryFiles: allowedFiles
        }
      );
    }

    it("rejects a candidate that only calls a non-production helper in the manifest", () => {
      const source = validSource
        .replace(
          'import { readEmptyQueue } from "./example";',
          'import { helperThatFails } from "./example-helper";'
        )
        .replace("readEmptyQueue()", "helperThatFails()");
      const result = evaluate(source);

      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/execute|call|production/i);
    });

    it("accepts a candidate that calls the target production interface directly", () => {
      const result = evaluate(validSource);

      expect(result.valid).toBe(true);
    });

    it("rejects a candidate that imports both helper and target but only calls the helper", () => {
      const source = validSource
        .replace(
          'import { readEmptyQueue } from "./example";',
          'import { helperThatFails } from "./example-helper";\nimport { readEmptyQueue } from "./example";'
        )
        .replace("readEmptyQueue()", "helperThatFails()");
      const result = evaluate(source);

      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/execute|call|production/i);
    });

    it("accepts a candidate that reaches an internal helper through the target interface", () => {
      // readEmptyQueue is the target production export; helperUse is a helper
      // reached *through* that interface, not imported directly.
      const source = validSource
        .replace("readEmptyQueue()", "readEmptyQueue().helperUse()");
      const result = evaluate(source);

      expect(result.valid).toBe(true);
    });
  });

  it("rejects a candidate that shadows a production import with a local function", () => {
    const source = validSource
      .replace(
        "expect(\n    readEmptyQueue(),",
        "const readEmptyQueue = () => \"unrelated\";\n    expect(\n    readEmptyQueue(),"
      );
    const result = validateRegressionCandidate(
      {
        schemaVersion: 1,
        status: "regression-test",
        testFile: finding.reproduction.testFile,
        testName: finding.reproduction.testName,
        source
      },
      { finding, sensitiveValues: [] }
    );

    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/shadow|observe|production/i);
  });

  it("accepts a candidate that calls the imported production binding without local shadowing", () => {
    const result = validateRegressionCandidate(
      {
        schemaVersion: 1,
        status: "regression-test",
        testFile: finding.reproduction.testFile,
        testName: finding.reproduction.testName,
        source: validSource
      },
      { finding, sensitiveValues: [] }
    );

    expect(result.valid).toBe(true);
  });

  it("rejects a Vitest namespace assertion bypass", () => {
    const source = validSource
      .replace(
        'import { expect, it } from "vitest";',
        'import { expect, it } from "vitest";\nimport * as v from "vitest";'
      )
      .replace(
        "  expect(\n",
        `  v.assert(
    false,
    "Expected behavior: ${finding.expectedBehavior} | Actual behavior: ${finding.actualBehavior}",
  );
  expect(
`
      );
    const result = validateRegressionCandidate(
      {
        schemaVersion: 1,
        status: "regression-test",
        testFile: finding.reproduction.testFile,
        testName: finding.reproduction.testName,
        source
      },
      {
        finding,
        sensitiveValues: [],
        allowedRepositoryFiles: ["src/domain/example.ts"]
      }
    );

    expect(result.valid).toBe(false);
  });

  it("rejects TypeScript import-equals declarations", () => {
    const source =
      'import childProcess = require("node:child_process");\n' +
      validSource.replace(
        "  expect(\n",
        '  void childProcess.execSync("true");\n  expect(\n'
      );
    const result = validateRegressionCandidate(
      {
        schemaVersion: 1,
        status: "regression-test",
        testFile: finding.reproduction.testFile,
        testName: finding.reproduction.testName,
        source
      },
      { finding, sensitiveValues: [] }
    );

    expect(result.valid).toBe(false);
  });

  it("rejects an assertion detached from its matcher call", () => {
    const source = validSource
      .replace("  expect(\n", "  const assertion = expect(\n")
      .replace("  ).toBe(\"safe\");", "  );\n  assertion.toBe(\"safe\");");
    const result = validateRegressionCandidate(
      {
        schemaVersion: 1,
        status: "regression-test",
        testFile: finding.reproduction.testFile,
        testName: finding.reproduction.testName,
        source
      },
      { finding, sensitiveValues: [] }
    );

    expect(result.valid).toBe(false);
  });

  it.each([
    ['import { guard } from "./contentGuard";', "a non-visible repository file"],
    ['import metadata from "../../../package.json";', "package metadata"],
    ['import os from "node:os";', "an unapproved Node builtin"]
  ])("rejects static import of %s", importLine => {
    const result = validateRegressionCandidate(
      {
        schemaVersion: 1,
        status: "regression-test",
        testFile: finding.reproduction.testFile,
        testName: finding.reproduction.testName,
        source: `${importLine}\n${validSource}`
      },
      {
        finding,
        sensitiveValues: [],
        allowedRepositoryFiles: ["src/domain/example.ts"]
      }
    );

    expect(result.valid).toBe(false);
  });

  it.each([
    ["valueOf", "readEmptyQueue.valueOf()"],
    ["bind", "readEmptyQueue.bind(null)()"],
    ["toString", "readEmptyQueue.toString()"],
    ["call", "readEmptyQueue.call(null)"],
    ["apply", "readEmptyQueue.apply(null, [])"]
  ])("rejects expect() with a non-executing %s trap on an imported function", (_label, trapCall) => {
    const source = validSource
      .replace("readEmptyQueue()", trapCall)
      .replace('.toBe("safe")', ".toBeUndefined()");
    const result = validateRegressionCandidate(
      {
        schemaVersion: 1,
        status: "regression-test",
        testFile: finding.reproduction.testFile,
        testName: finding.reproduction.testName,
        source
      },
      { finding, sensitiveValues: [] }
    );

    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/execute|call/i);
  });
});
