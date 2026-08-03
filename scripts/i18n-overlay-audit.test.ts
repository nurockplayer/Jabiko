// scripts/i18n-overlay-audit.test.ts
// TDD coverage for the reusable TypeScript-AST overlay audit core (#695).
// Fixtures are created at test runtime in a temp dir and never committed.
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import ts from "typescript";
// @ts-expect-error -- plain .mjs tooling module, no types
import {
  AuditParseError,
  auditKeySets,
  collectStaticObjectKeys,
  parseLaunchedLocales,
  parseTypeScriptFile,
  readStaticPropertyName,
  runOverlayAdapters,
  sortAuditRecords
} from "./i18n-overlay-audit.mjs";

let tmpDir: string;
let fixtureCounter = 0;

beforeAll(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "jabiko-i18n-audit-"));
});

afterAll(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function writeFixture(text: string): string {
  const p = path.join(tmpDir, `fixture-${fixtureCounter++}.ts`);
  fs.writeFileSync(p, text);
  return p;
}

function allObjectLiterals(sf: ts.SourceFile): ts.ObjectLiteralExpression[] {
  const out: ts.ObjectLiteralExpression[] = [];
  const visit = (n: ts.Node): void => {
    if (ts.isObjectLiteralExpression(n)) out.push(n);
    ts.forEachChild(n, visit);
  };
  visit(sf);
  return out;
}

function firstObjectLiteral(sf: ts.SourceFile): ts.ObjectLiteralExpression | undefined {
  return allObjectLiterals(sf)[0];
}

function smallestObjectLiteralContaining(
  sf: ts.SourceFile,
  text: string
): ts.ObjectLiteralExpression {
  const candidates = allObjectLiterals(sf).filter((n) => n.getText().includes(text));
  candidates.sort((a, b) => a.getText().length - b.getText().length);
  if (candidates.length === 0) throw new Error(`no object literal containing ${text}`);
  return candidates[0];
}

function firstPropertyAssignments(sf: ts.SourceFile): ts.PropertyAssignment[] {
  const obj = firstObjectLiteral(sf);
  if (!obj) throw new Error("no object literal in fixture");
  return obj.properties.filter((p): p is ts.PropertyAssignment => ts.isPropertyAssignment(p));
}

function expectParseError(fn: () => unknown): {
  file: unknown;
  line: unknown;
  context: unknown;
  message: string;
} {
  try {
    fn();
  } catch (e) {
    if (e instanceof AuditParseError) {
      return { file: e.file, line: e.line, context: e.context, message: e.message };
    }
    throw e;
  }
  throw new Error("expected the function to throw an AuditParseError");
}

describe("parseTypeScriptFile", () => {
  it("parses a file into a SourceFile carrying the given path", () => {
    const fixture = writeFixture("export const A = 1;");
    const sf = parseTypeScriptFile(fixture);
    expect(ts.isSourceFile(sf)).toBe(true);
    expect(sf.fileName).toBe(fixture);
  });
});

describe("parseLaunchedLocales", () => {
  it("resolves launched locales in source order, excluding zh-Hant", () => {
    const sf = parseTypeScriptFile(
      writeFixture('export const LAUNCHED_LANGUAGES: readonly string[] = ["zh-Hant", "ja", "en"];')
    );
    expect(parseLaunchedLocales(sf)).toEqual({ sourceLocale: "zh-Hant", targetLocales: ["ja", "en"] });
  });

  it("automatically reflects added and removed locales", () => {
    const added = parseTypeScriptFile(writeFixture('export const LAUNCHED_LANGUAGES = ["ja", "zh-Hant", "ko"];'));
    expect(parseLaunchedLocales(added).targetLocales).toEqual(["ja", "ko"]);
    const removed = parseTypeScriptFile(writeFixture('export const LAUNCHED_LANGUAGES = ["zh-Hant"];'));
    expect(parseLaunchedLocales(removed).targetLocales).toEqual([]);
    const noSource = parseTypeScriptFile(writeFixture('export const LAUNCHED_LANGUAGES = ["ja"];'));
    expect(parseLaunchedLocales(noSource).targetLocales).toEqual(["ja"]);
  });

  it("fails closed when LAUNCHED_LANGUAGES is missing or not an array literal", () => {
    const missing = parseTypeScriptFile(writeFixture("export const COPY = {};"));
    expect(() => parseLaunchedLocales(missing)).toThrowError(/LAUNCHED_LANGUAGES/);
    const notArray = parseTypeScriptFile(writeFixture('export const LAUNCHED_LANGUAGES = "zh-Hant";'));
    expect(() => parseLaunchedLocales(notArray)).toThrowError(/array literal/);
  });
});

describe("readStaticPropertyName", () => {
  it("reads identifier, single/double-quoted, numeric and no-substitution template names", () => {
    const sf = parseTypeScriptFile(
      writeFixture('const x = { ident: 1, "double": 2, \'single\': 3, [`tpl`]: 4, 42: 5 };')
    );
    const props = firstPropertyAssignments(sf);
    expect(readStaticPropertyName(props[0].name)).toBe("ident");
    expect(readStaticPropertyName(props[1].name)).toBe("double");
    expect(readStaticPropertyName(props[2].name)).toBe("single");
    const computed = props[3].name as ts.ComputedPropertyName;
    expect(readStaticPropertyName(computed.expression)).toBe("tpl");
    expect(readStaticPropertyName(props[4].name)).toBe("42");
  });

  it("fails closed on computed and interpolated property names", () => {
    const sf = parseTypeScriptFile(writeFixture("const x = { [key]: 1, [`k${x}`]: 2 };"));
    const props = firstPropertyAssignments(sf);
    const e1 = expectParseError(() => readStaticPropertyName(props[0].name));
    expect(e1.message).toMatch(/computed/);
    const e2 = expectParseError(() => readStaticPropertyName(props[1].name));
    expect(e2.message).toMatch(/computed/);
  });
});

describe("collectStaticObjectKeys", () => {
  it("collects identifier, quoted, trailing-comma and multiline keys", () => {
    const sf = parseTypeScriptFile(
      writeFixture(
        "const x = {\n" +
          "  ident: 1,\n" +
          '  "double-quoted": 2,\n' +
          "  'single-quoted': 3,\n" +
          '  "escaped\\nkey": 4,\n' +
          "  trailing: 5,\n" +
          "};"
      )
    );
    expect(collectStaticObjectKeys(firstObjectLiteral(sf)!, {})).toEqual([
      "ident",
      "double-quoted",
      "single-quoted",
      "escaped\nkey",
      "trailing"
    ]);
  });

  it("lets the caller target a nested object node without flattening same-name keys", () => {
    const sf = parseTypeScriptFile(writeFixture("const x = { outer: { a: 1 }, inner: { a: 2, b: 3 } };"));
    expect(collectStaticObjectKeys(smallestObjectLiteralContaining(sf, "b"), {})).toEqual(["a", "b"]);
    expect(collectStaticObjectKeys(firstObjectLiteral(sf)!, {})).toEqual(["outer", "inner"]);
  });

  it("fails closed on spread with file, line and context", () => {
    const fixture = writeFixture("const x = {\n  a: 1,\n  ...other,\n};");
    const err = expectParseError(() =>
      collectStaticObjectKeys(firstObjectLiteral(parseTypeScriptFile(fixture))!, {})
    );
    expect(err.file).toBe(fixture);
    expect(err.line).toBe(3);
    expect(err.context).toContain("...other");
  });

  it("fails closed on computed / dynamic keys with file, line and context", () => {
    const fixture = writeFixture("const x = {\n  [key]: 1,\n};");
    const err = expectParseError(() =>
      collectStaticObjectKeys(firstObjectLiteral(parseTypeScriptFile(fixture))!, {})
    );
    expect(err.file).toBe(fixture);
    expect(err.line).toBe(2);
    expect(err.context).toContain("[key]");

    const dynamic = writeFixture("const x = {\n  [getKey()]: 1,\n};");
    const err2 = expectParseError(() =>
      collectStaticObjectKeys(firstObjectLiteral(parseTypeScriptFile(dynamic))!, {})
    );
    expect(err2.file).toBe(dynamic);
    expect(err2.line).toBe(2);
  });

  it("fails closed on malformed input (non-object node)", () => {
    const sf = parseTypeScriptFile(writeFixture("const x = 42;"));
    expect(() => collectStaticObjectKeys(sf, {})).toThrowError(/ObjectLiteralExpression/);
  });
});

describe("auditKeySets", () => {
  it("classifies valid / missing / dangling key sets", () => {
    const records = auditKeySets({
      system: "exam",
      locale: "en",
      sourceKeys: ["a", "b", "c"],
      overlayKeys: ["b", "c", "d"]
    });
    expect(records).toEqual([
      { system: "exam", locale: "en", sourceKey: "", overlayKey: "d", status: "dangling" },
      { system: "exam", locale: "en", sourceKey: "a", overlayKey: "", status: "missing" }
    ]);
  });

  it("rejects duplicate source keys deterministically", () => {
    expect(() =>
      auditKeySets({ system: "exam", locale: "en", sourceKeys: ["a", "a"], overlayKeys: [] })
    ).toThrowError(/duplicate source key "a" at index 1/);
  });

  it("rejects duplicate overlay keys deterministically", () => {
    expect(() =>
      auditKeySets({ system: "exam", locale: "en", sourceKeys: [], overlayKeys: ["b", "b"] })
    ).toThrowError(/duplicate overlay key "b" at index 1/);
  });

  it("treats empty source and overlay sets as a valid empty audit", () => {
    expect(auditKeySets({ system: "exam", locale: "en", sourceKeys: [], overlayKeys: [] })).toEqual([]);
  });

  it("flags every overlay key as dangling when source is empty", () => {
    expect(
      auditKeySets({ system: "exam", locale: "en", sourceKeys: [], overlayKeys: ["x", "y"] })
    ).toEqual([
      { system: "exam", locale: "en", sourceKey: "", overlayKey: "x", status: "dangling" },
      { system: "exam", locale: "en", sourceKey: "", overlayKey: "y", status: "dangling" }
    ]);
  });

  it("flags every source key as missing when overlay is empty", () => {
    expect(
      auditKeySets({ system: "exam", locale: "en", sourceKeys: ["x", "y"], overlayKeys: [] })
    ).toEqual([
      { system: "exam", locale: "en", sourceKey: "x", overlayKey: "", status: "missing" },
      { system: "exam", locale: "en", sourceKey: "y", overlayKey: "", status: "missing" }
    ]);
  });

  it("rejects invalid explicit options rather than guessing", () => {
    expect(() =>
      auditKeySets({ system: "nope", locale: "en", sourceKeys: [], overlayKeys: [] })
    ).toThrowError(/unknown overlay system/);
    expect(() =>
      auditKeySets({ system: "exam", locale: "", sourceKeys: [], overlayKeys: [] })
    ).toThrowError(/locale/);
    expect(() =>
      auditKeySets({ system: "exam", locale: "en", sourceKeys: "nope", overlayKeys: [] })
    ).toThrowError(/sourceKeys must be an array/);
  });
});

describe("sortAuditRecords", () => {
  it("sorts by system -> locale -> sourceKey -> overlayKey -> status without mutating input", () => {
    const records = [
      { system: "exam", locale: "en", sourceKey: "z", overlayKey: "", status: "missing" },
      { system: "exam", locale: "en", sourceKey: "", overlayKey: "a", status: "dangling" },
      { system: "grammarNotes", locale: "en", sourceKey: "a", overlayKey: "", status: "missing" },
      { system: "exam", locale: "ja", sourceKey: "a", overlayKey: "", status: "missing" }
    ];
    const sorted = sortAuditRecords(records);
    expect(
      sorted.map((r) => `${r.system}:${r.locale}:${r.sourceKey}:${r.overlayKey}:${r.status}`)
    ).toEqual([
      "exam:en::a:dangling",
      "exam:en:z::missing",
      "exam:ja:a::missing",
      "grammarNotes:en:a::missing"
    ]);
    expect(records.map((r) => r.sourceKey)).toEqual(["z", "", "a", "a"]);
  });
});

describe("runOverlayAdapters", () => {
  it("aggregates adapter records into a sorted report with counts and diagnostics", () => {
    const report = runOverlayAdapters(
      [
        () => auditKeySets({ system: "grammarNotes", locale: "ja", sourceKeys: ["x"], overlayKeys: ["y"] }),
        () => auditKeySets({ system: "exam", locale: "en", sourceKeys: ["a", "b"], overlayKeys: ["b"] })
      ],
      {}
    );
    expect(report.records).toEqual([
      { system: "exam", locale: "en", sourceKey: "a", overlayKey: "", status: "missing" },
      { system: "grammarNotes", locale: "ja", sourceKey: "", overlayKey: "y", status: "dangling" },
      { system: "grammarNotes", locale: "ja", sourceKey: "x", overlayKey: "", status: "missing" }
    ]);
    expect(report.counts).toEqual({
      bySystem: {
        exam: { total: 1, missing: 1, dangling: 0 },
        grammarNotes: { total: 2, missing: 1, dangling: 1 }
      },
      byLocale: {
        en: { total: 1, missing: 1, dangling: 0 },
        ja: { total: 2, missing: 1, dangling: 1 }
      }
    });
    expect(report.diagnostics).toEqual([]);
  });

  it("passes context through to each adapter", () => {
    const seen: unknown[] = [];
    const context = { file: "src/x.ts", sourceFile: null };
    runOverlayAdapters([(c: unknown) => { seen.push(c); return []; }], context);
    expect(seen).toEqual([context]);
  });

  it("captures parse diagnostics with file, line and bounded context (no source dump)", () => {
    const fixture = writeFixture("const x = {\n  a: 1,\n  ...other,\n};");
    const adapter = () => {
      const sf = parseTypeScriptFile(fixture);
      collectStaticObjectKeys(firstObjectLiteral(sf)!, {});
      return [];
    };
    const report = runOverlayAdapters([adapter], {});
    expect(report.diagnostics).toHaveLength(1);
    const d = report.diagnostics[0];
    expect(d.file).toBe(fixture);
    expect(d.line).toBe(3);
    expect(d.message).toMatch(/spread/);
    expect(typeof d.context).toBe("string");
    expect(d.context.length).toBeLessThanOrEqual(200);
  });

  it("produces byte-equivalent reports regardless of adapter / input order", () => {
    const build = (adapters: Array<() => unknown>) => runOverlayAdapters(adapters, {});
    const adapters = [
      () => auditKeySets({ system: "exam", locale: "en", sourceKeys: ["a", "b"], overlayKeys: ["b"] }),
      () => auditKeySets({ system: "exam", locale: "en", sourceKeys: ["b", "c"], overlayKeys: ["b"] }),
      () => auditKeySets({ system: "learningBlocks", locale: "ja", sourceKeys: [], overlayKeys: ["q"] })
    ];
    const reportA = JSON.stringify(build(adapters));
    const reportB = JSON.stringify(build([...adapters].reverse()));
    const reportC = JSON.stringify(build([adapters[1], adapters[2], adapters[0]]));
    expect(reportA).toBe(reportB);
    expect(reportA).toBe(reportC);
  });

  it("produces byte-equivalent reports when an adapter throws in any position", () => {
    const fixture = writeFixture("const x = {\n  ...boom,\n};");
    const throwing = () => {
      const sf = parseTypeScriptFile(fixture);
      collectStaticObjectKeys(firstObjectLiteral(sf)!, {});
      return [];
    };
    const ok = () => auditKeySets({ system: "exam", locale: "en", sourceKeys: ["a"], overlayKeys: ["a"] });
    const a = JSON.stringify(runOverlayAdapters([throwing, ok], {}));
    const b = JSON.stringify(runOverlayAdapters([ok, throwing], {}));
    expect(a).toBe(b);
    expect(JSON.parse(a).diagnostics).toHaveLength(1);
  });

  it("report contains no absolute temp path or source text dump", () => {
    const fixture = writeFixture("const source = { a: 1, b: 2 };\nconst overlay = { a: 1 };");
    const adapter = () => {
      const sf = parseTypeScriptFile(fixture);
      const [sourceNode, overlayNode] = allObjectLiterals(sf);
      return auditKeySets({
        system: "exam",
        locale: "en",
        sourceKeys: collectStaticObjectKeys(sourceNode, {}),
        overlayKeys: collectStaticObjectKeys(overlayNode, {})
      });
    };
    const json = JSON.stringify(runOverlayAdapters([adapter], {}));
    expect(json).not.toContain(tmpDir);
    expect(json).not.toContain("const source");
    expect(json).toContain('"sourceKey":"b"');
  });
});

describe("core side-effect discipline", () => {
  it("performs zero filesystem writes, console output, network and process.exit", () => {
    const fixture = writeFixture("const source = { a: 1 };\nconst overlay = { a: 1 };");
    const localesFixture = writeFixture('export const LAUNCHED_LANGUAGES = ["zh-Hant"];');
    const writeSpy = vi.spyOn(fs, "writeFileSync");
    const mkdirSpy = vi.spyOn(fs, "mkdirSync");
    const logSpy = vi.spyOn(console, "log");
    const errorSpy = vi.spyOn(console, "error");
    const exitSpy = vi.spyOn(process, "exit");
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    try {
      const adapter = () => {
        const sf = parseTypeScriptFile(fixture);
        const [sourceNode, overlayNode] = allObjectLiterals(sf);
        return auditKeySets({
          system: "exam",
          locale: "en",
          sourceKeys: collectStaticObjectKeys(sourceNode, {}),
          overlayKeys: collectStaticObjectKeys(overlayNode, {})
        });
      };
      runOverlayAdapters([adapter], {});
      parseLaunchedLocales(parseTypeScriptFile(localesFixture));
      expect(writeSpy).not.toHaveBeenCalled();
      expect(mkdirSpy).not.toHaveBeenCalled();
      expect(logSpy).not.toHaveBeenCalled();
      expect(errorSpy).not.toHaveBeenCalled();
      expect(exitSpy).not.toHaveBeenCalled();
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      writeSpy.mockRestore();
      mkdirSpy.mockRestore();
      logSpy.mockRestore();
      errorSpy.mockRestore();
      exitSpy.mockRestore();
      fetchSpy.mockRestore();
    }
  });
});
