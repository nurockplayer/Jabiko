// @ts-expect-error -- plain .mjs module, no types
import { describe, expect, it } from "vitest";
// @ts-expect-error -- plain .mjs module, no types
import {
  validateFinding,
  FINDING_CATEGORIES,
  SUPPORTED_SCHEMA_VERSIONS,
  DEFAULT_CONFIDENCE_THRESHOLD
} from "../finding-schema.mjs";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const validFinding = () => ({
  schemaVersion: 1,
  status: "finding",
  title: "handle empty queue without dropping pending item",
  confidence: 0.94,
  category: "boundary-condition",
  evidence: [
    {
      file: "src/domain/example.ts",
      startLine: 42,
      endLine: 57,
      reason: "The empty branch returns before preserving the pending item."
    }
  ],
  expectedBehavior: "pending item should be preserved when queue empties",
  actualBehavior: "pending item is dropped on empty queue",
  reproduction: {
    testFile: "src/domain/example.regression.test.ts",
    testName: "preserves pending item when queue becomes empty"
  },
  productionFiles: ["src/domain/example.ts"],
  risk: "low"
});

const validNoFinding = () => ({
  schemaVersion: 1,
  status: "no-finding",
  reason: "No safe high-confidence correctness issue found"
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("validateFinding – no-finding", () => {
  it("accepts a valid no-finding", () => {
    const r = validateFinding(validNoFinding());
    expect(r.valid).toBe(true);
    expect(r.result?.status).toBe("no-finding");
  });

  it("rejects no-finding with extra fields beyond schemaVersion/status/reason", () => {
    const r = validateFinding({ ...validNoFinding(), title: "oops" });
    expect(r.valid).toBe(false);
  });

  it("rejects no-finding with empty reason", () => {
    const r = validateFinding({ ...validNoFinding(), reason: "" });
    expect(r.valid).toBe(false);
  });

  it("rejects no-finding with wrong schemaVersion", () => {
    const r = validateFinding({ ...validNoFinding(), schemaVersion: 2 });
    expect(r.valid).toBe(false);
  });
});

describe("validateFinding – finding", () => {
  it("accepts a well-formed finding", () => {
    const r = validateFinding(validFinding());
    expect(r.valid).toBe(true);
    expect(r.result?.status).toBe("finding");
    expect(r.result?.title).toBe(validFinding().title);
    expect(r.result?.confidence).toBe(0.94);
  });

  it("rejects confidence below threshold", () => {
    const r = validateFinding({ ...validFinding(), confidence: 0.3 });
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/confidence|threshold/i);
  });

  it("rejects confidence above 1", () => {
    const r = validateFinding({ ...validFinding(), confidence: 1.5 });
    expect(r.valid).toBe(false);
  });

  it("rejects negative confidence", () => {
    const r = validateFinding({ ...validFinding(), confidence: -0.1 });
    expect(r.valid).toBe(false);
  });

  it("rejects NaN confidence", () => {
    const r = validateFinding({ ...validFinding(), confidence: NaN });
    expect(r.valid).toBe(false);
  });

  it("rejects Infinity confidence", () => {
    const r = validateFinding({ ...validFinding(), confidence: Infinity });
    expect(r.valid).toBe(false);
  });

  it("rejects risk that is not 'low'", () => {
    const r = validateFinding({ ...validFinding(), risk: "medium" });
    expect(r.valid).toBe(false);

    const r2 = validateFinding({ ...validFinding(), risk: "high" });
    expect(r2.valid).toBe(false);
  });

  it("rejects unknown category", () => {
    const r = validateFinding({ ...validFinding(), category: "unknown-category" });
    expect(r.valid).toBe(false);
  });

  it("rejects missing title", () => {
    const r = validateFinding({ ...validFinding(), title: "" });
    expect(r.valid).toBe(false);
  });

  it("rejects missing required fields", () => {
    const rest = { ...validFinding() };
    delete rest.title;
    const r = validateFinding(rest);
    expect(r.valid).toBe(false);
  });

  it("rejects unknown fields", () => {
    const r = validateFinding({ ...validFinding(), extraField: "should be rejected" });
    expect(r.valid).toBe(false);
  });

  it("rejects unsupported schemaVersion", () => {
    const r = validateFinding({ ...validFinding(), schemaVersion: 0 });
    expect(r.valid).toBe(false);
  });
});

describe("validateFinding – evidence", () => {
  it("rejects evidence without file", () => {
    const e = { ...validFinding(), evidence: [{ startLine: 1, endLine: 2, reason: "no file" }] };
    expect(validateFinding(e).valid).toBe(false);
  });

  it("rejects evidence without startLine", () => {
    const e = { ...validFinding(), evidence: [{ file: "src/a.ts", endLine: 2, reason: "r" }] };
    expect(validateFinding(e).valid).toBe(false);
  });

  it("rejects evidence without endLine", () => {
    const e = { ...validFinding(), evidence: [{ file: "src/a.ts", startLine: 1, reason: "r" }] };
    expect(validateFinding(e).valid).toBe(false);
  });

  it("rejects evidence without reason", () => {
    const e = { ...validFinding(), evidence: [{ file: "src/a.ts", startLine: 1, endLine: 2 }] };
    expect(validateFinding(e).valid).toBe(false);
  });

  it("rejects endLine before startLine", () => {
    const e = {
      ...validFinding(),
      evidence: [{ file: "src/a.ts", startLine: 10, endLine: 5, reason: "bad range" }]
    };
    expect(validateFinding(e).valid).toBe(false);
  });

  it("rejects startLine less than 1", () => {
    const e = {
      ...validFinding(),
      evidence: [{ file: "src/a.ts", startLine: 0, endLine: 2, reason: "r" }]
    };
    expect(validateFinding(e).valid).toBe(false);
  });
});

describe("validateFinding – path safety", () => {
  it("rejects path traversal in evidence file", () => {
    const e = createEvidencedFinding({ file: "../../etc/passwd" });
    expect(validateFinding(e).valid).toBe(false);
  });

  it("rejects absolute path in evidence file", () => {
    const e = createEvidencedFinding({ file: "/etc/passwd" });
    expect(validateFinding(e).valid).toBe(false);
  });

  it("rejects path traversal in productionFiles", () => {
    const f = validFinding();
    f.productionFiles = ["../outside/src/domain/example.ts"];
    expect(validateFinding(f).valid).toBe(false);
  });

  it("rejects absolute path in productionFiles", () => {
    const f = validFinding();
    f.productionFiles = ["/absolute/src/domain/example.ts"];
    expect(validateFinding(f).valid).toBe(false);
  });

  it("rejects protected path in evidence", () => {
    const e = createEvidencedFinding({ file: "src/domain/contentGuard.ts" });
    expect(validateFinding(e).valid).toBe(false);
  });

  it("rejects protected path in productionFiles", () => {
    const f = validFinding();
    f.productionFiles = ["src/domain/exam/items/n5.ts"];
    expect(validateFinding(f).valid).toBe(false);
  });

  it("rejects productionFiles outside allowlist", () => {
    const f = validFinding();
    f.productionFiles = ["src/components/SomeButton.tsx"];
    expect(validateFinding(f).valid).toBe(false);
  });

  it("rejects test files as production repair targets", () => {
    const f = validFinding();
    f.productionFiles = ["src/domain/example.test.ts"];
    expect(validateFinding(f).valid).toBe(false);
  });

  it("requires the evidence file to be one of the production repair targets", () => {
    const f = validFinding();
    f.productionFiles = ["src/domain/other.ts"];
    f.reproduction.testFile = "src/domain/other.regression.test.ts";
    expect(validateFinding(f).valid).toBe(false);
  });
});

describe("validateFinding – reproduction", () => {
  it("rejects reproduction test not named *.regression.test.ts(x)", () => {
    const f = validFinding();
    f.reproduction.testFile = "src/domain/example.test.ts";
    expect(validateFinding(f).valid).toBe(false);
  });

  it("rejects reproduction test not in production file directory", () => {
    const f = validFinding();
    f.reproduction.testFile = "src/components/example.regression.test.ts";
    expect(validateFinding(f).valid).toBe(false);
  });

  it("accepts correct .regression.test.tsx extension", () => {
    const f = validFinding();
    f.reproduction.testFile = "src/domain/example.regression.test.tsx";
    expect(validateFinding(f).valid).toBe(true);
  });

  it("requires reproduction object", () => {
    const rest = { ...validFinding() };
    delete rest.reproduction;
    expect(validateFinding(rest).valid).toBe(false);
  });

  it("requires reproduction.testName", () => {
    const f = validFinding();
    f.reproduction = { testFile: "src/domain/x.regression.test.ts", testName: "" };
    expect(validateFinding(f).valid).toBe(false);
  });
});

describe("validateFinding – multiple findings", () => {
  it("rejects two findings in one response (not a single root cause)", () => {
    const input = {
      schemaVersion: 1,
      status: "finding",
      title: "two unrelated bugs",
      confidence: 0.9,
      category: "logic-error",
      evidence: [
        { file: "src/domain/a.ts", startLine: 1, endLine: 2, reason: "bug A" },
        { file: "src/domain/b.ts", startLine: 5, endLine: 6, reason: "bug B" }
      ],
      expectedBehavior: "both work",
      actualBehavior: "both broken",
      reproduction: {
        testFile: "src/domain/a.regression.test.ts",
        testName: "test A"
      },
      productionFiles: ["src/domain/a.ts"],
      risk: "low"
    };
    // Evidence references two different files => multiple root causes
    expect(validateFinding(input).valid).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Input format handling
// ---------------------------------------------------------------------------
describe("validateFinding – input format", () => {
  it("rejects a non-object input", () => {
    expect(validateFinding("string").valid).toBe(false);
    expect(validateFinding(42).valid).toBe(false);
    expect(validateFinding(null).valid).toBe(false);
    expect(validateFinding(undefined).valid).toBe(false);
    expect(validateFinding([]).valid).toBe(false);
  });

  it("rejects markdown-wrapped JSON", () => {
    const input = "```json\n" + JSON.stringify(validNoFinding()) + "\n```";
    const r = validateFinding(input);
    expect(r.valid).toBe(false);
  });
});

describe("FINDING_CATEGORIES", () => {
  it("includes expected categories", () => {
    expect(FINDING_CATEGORIES).toContain("boundary-condition");
    expect(FINDING_CATEGORIES).toContain("state-transition");
    expect(FINDING_CATEGORIES).toContain("null-empty-input");
    expect(FINDING_CATEGORIES).toContain("off-by-one");
    expect(FINDING_CATEGORIES).toContain("stale-state");
    expect(FINDING_CATEGORIES).toContain("error-fallback");
    expect(FINDING_CATEGORIES).toContain("logic-error");
  });
});

describe("SUPPORTED_SCHEMA_VERSIONS", () => {
  it("includes version 1", () => {
    expect(SUPPORTED_SCHEMA_VERSIONS).toContain(1);
  });
});

describe("DEFAULT_CONFIDENCE_THRESHOLD", () => {
  it("is a number between 0 and 1", () => {
    expect(DEFAULT_CONFIDENCE_THRESHOLD).toBeGreaterThan(0);
    expect(DEFAULT_CONFIDENCE_THRESHOLD).toBeLessThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function createEvidencedFinding(overrides) {
  const f = validFinding();
  f.evidence = [{ file: "src/domain/example.ts", startLine: 1, endLine: 2, reason: "r", ...overrides }];
  return f;
}
