// scripts/i18n-overlay-audit.test.ts
// TDD coverage for the reusable TypeScript-AST overlay audit core (#695).
// Fixtures are created at test runtime in a temp dir and never committed.
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
// @ts-expect-error -- plain .mjs tooling module, no types
import {
  AuditParseError,
  auditExamOverlays,
  auditKeySets,
  auditLearningBlockOverlays,
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

describe("auditExamOverlays (#696)", () => {
  // Built inside beforeAll: the outer suite assigns tmpDir there, and the
  // describe body is evaluated before that hook runs.
  let OPTIONS: { repoRoot: string; targetLocales: string[] };

  /** Write every exam item file. Files not present in `files` are reset to an
   *  empty stub so leftover fixtures never leak across tests. */
  function writeExamFixture(files: Record<string, string>): void {
    const stubs: Record<string, string> = {
      n1: "export const n1Items: unknown[] = [];",
      n2: "export const n2Items: unknown[] = [];",
      n3: "export const n3Items: unknown[] = [];",
      n4: "export const n4Items: unknown[] = [];",
      n5: "export const n5Items: unknown[] = [];"
    };
    for (const name of ["n1", "n2", "n3", "n4", "n5"]) {
      fs.writeFileSync(
        path.join(tmpDir, "src", "domain", "exam", "items", `${name}.ts`),
        files[name] ?? stubs[name]
      );
    }
  }

  beforeAll(() => {
    fs.mkdirSync(path.join(tmpDir, "src", "domain", "exam", "items"), {
      recursive: true
    });
    OPTIONS = { repoRoot: tmpDir, targetLocales: ["ja", "en"] };
    writeExamFixture({});
  });

  it("reports missing and dangling overlays for all six field pairs, per item and per locale", () => {
    writeExamFixture({
      n1: [
        'import { examQuestion } from "../helpers";',
        'export const n1Items = [',
        "  examQuestion({",
        '    id: "n1-foo",',
        // meaning: en overlay missing
        '    meaningZh: "吃",',
        '    meaningI18n: { "ja": "食べる" },',
        // instruction: overlay missing entirely (ja + en)
        '    instructionZh: "選對的。",',
        // promptContext: complete for ja + en; a non-target locale key (fr) is
        // parsed for shape but never reported
        '    promptContextZh: "每天吃。",',
        '    promptContextI18n: { "ja": "毎日食べる。", "en": "Eat daily.", "fr": "Mange quotidien." },',
        // hint: empty source but overlay present -> dangling (ja + en)
        '    hintZh: "",',
        '    hintI18n: { "ja": "ヒント", "en": "Hint." },',
        // exampleMeaning: no source, overlay present -> dangling (ja + en)
        '    exampleMeaningI18n: { "ja": "例文の意味", "en": "Example meaning." },',
        // explanation: complete -> no records
        '    explanation: "解說",',
        '    explanationI18n: { "ja": "解説", "en": "Explanation." }',
        "  }),",
        "];"
      ].join("\n")
    });
    expect(auditExamOverlays(OPTIONS)).toEqual([
      { system: "exam", locale: "en", sourceKey: "", overlayKey: "n1-foo.exampleMeaningI18n", status: "dangling" },
      { system: "exam", locale: "en", sourceKey: "", overlayKey: "n1-foo.hintI18n", status: "dangling" },
      { system: "exam", locale: "en", sourceKey: "n1-foo.instructionI18n", overlayKey: "", status: "missing" },
      { system: "exam", locale: "en", sourceKey: "n1-foo.meaningI18n", overlayKey: "", status: "missing" },
      { system: "exam", locale: "ja", sourceKey: "", overlayKey: "n1-foo.exampleMeaningI18n", status: "dangling" },
      { system: "exam", locale: "ja", sourceKey: "", overlayKey: "n1-foo.hintI18n", status: "dangling" },
      { system: "exam", locale: "ja", sourceKey: "n1-foo.instructionI18n", overlayKey: "", status: "missing" }
    ]);
  });

  it("keeps the canonical key format <item-id>.<overlay-field>", () => {
    writeExamFixture({
      n2: [
        'import { examQuestion } from "../helpers";',
        'export const n2Items = [',
        "  examQuestion({",
        '    id: "n2-item-x",',
        '    meaningZh: "非空",',
        '    hintZh: "提示",',
        '    hintI18n: { "ja": "ヒント", "en": "Hint." }',
        "  }),",
        "];"
      ].join("\n")
    });
    const records = auditExamOverlays(OPTIONS);
    const meaningMissing = records.filter(
      (r) => r.sourceKey.startsWith("n2-item-x.meaningI18n") && r.status === "missing"
    );
    expect(meaningMissing).toHaveLength(2); // ja + en
    for (const r of meaningMissing) expect(r.sourceKey).toBe("n2-item-x.meaningI18n");
  });

  it("skips empty-string source fields but flags an existing overlay as dangling", () => {
    writeExamFixture({
      n3: [
        'import { examQuestion } from "../helpers";',
        'export const n3Items = [',
        "  examQuestion({",
        '    id: "n3-empty",',
        '    meaningZh: "",',
        '    meaningI18n: { "ja": "落ち穂", "en": "gleanings" },',
        '    hintZh: ""',
        "  }),",
        "];"
      ].join("\n")
    });
    const records = auditExamOverlays(OPTIONS);
    const dangling = records.filter((r) => r.status === "dangling");
    expect(dangling).toHaveLength(2); // ja + en for n3-empty.meaningI18n
    expect(dangling.every((r) => r.overlayKey === "n3-empty.meaningI18n")).toBe(true);
    // hintZh is empty with no overlay at all: no record
    expect(records.some((r) => r.overlayKey === "n3-empty.hintI18n")).toBe(false);
  });

  it("requires a non-empty static string item id and fails closed otherwise", () => {
    writeExamFixture({
      n5: [
        'import { examQuestion } from "../helpers";',
        'export const n5Items = [',
        "  examQuestion({",
        '    id: "",',
        '    meaningZh: "x",',
        "  }),",
        "];"
      ].join("\n")
    });
    expect(() => auditExamOverlays(OPTIONS)).toThrow(AuditParseError);
    expect(() => auditExamOverlays(OPTIONS)).toThrow(/id/);

    writeExamFixture({
      n5: [
        'import { examQuestion } from "../helpers";',
        'export const n5Items = [',
        "  examQuestion({",
        "    id: DYNAMIC_ID,",
        '    meaningZh: "x",',
        "  }),",
        "];"
      ].join("\n")
    });
    expect(() => auditExamOverlays(OPTIONS)).toThrow(/id/);
  });

  it("fails closed on overlay spreads, computed locale keys and dynamic values", () => {
    writeExamFixture({
      n4: [
        'import { examQuestion } from "../helpers";',
        'export const n4Items = [',
        "  examQuestion({",
        '    id: "n4-spread",',
        '    meaningZh: "x",',
        '    meaningI18n: { "ja": "ヒント", ...extra }',
        "  }),",
        "];"
      ].join("\n")
    });
    expect(() => auditExamOverlays(OPTIONS)).toThrow(/spread/);

    writeExamFixture({
      n4: [
        'import { examQuestion } from "../helpers";',
        'export const n4Items = [',
        "  examQuestion({",
        '    id: "n4-computed",',
        '    meaningZh: "x",',
        "    meaningI18n: { [key]: \"v\" }",
        "  }),",
        "];"
      ].join("\n")
    });
    expect(() => auditExamOverlays(OPTIONS)).toThrow(/computed/);

    writeExamFixture({
      n4: [
        'import { examQuestion } from "../helpers";',
        'export const n4Items = [',
        "  examQuestion({",
        '    id: "n4-dynamic",',
        '    meaningZh: "x",',
        '    meaningI18n: { "ja": translate("こんにちは") }',
        "  }),",
        "];"
      ].join("\n")
    });
    expect(() => auditExamOverlays(OPTIONS)).toThrow(/static string|literal/i);
  });

  it("fails closed on duplicate item ids and duplicate locale keys", () => {
    writeExamFixture({
      n4: [
        'import { examQuestion } from "../helpers";',
        'export const n4Items = [',
        "  examQuestion({",
        '    id: "n4-dup",',
        '    meaningZh: "a",',
        "  }),",
        "  examQuestion({",
        '    id: "n4-dup",',
        '    meaningZh: "b",',
        "  }),",
        "];"
      ].join("\n")
    });
    expect(() => auditExamOverlays(OPTIONS)).toThrow(/duplicate|id/);

    writeExamFixture({
      n4: [
        'import { examQuestion } from "../helpers";',
        'export const n4Items = [',
        "  examQuestion({",
        '    id: "n4-duplocale",',
        '    meaningZh: "a",',
        '    meaningI18n: { "ja": "x", "ja": "y", "en": "z" }',
        "  }),",
        "];"
      ].join("\n")
    });
    expect(() => auditExamOverlays(OPTIONS)).toThrow(/duplicate/);
  });

  it("fails closed on duplicate overlay field keys within one item", () => {
    writeExamFixture({
      n4: [
        'import { examQuestion } from "../helpers";',
        'export const n4Items = [',
        "  examQuestion({",
        '    id: "n4-dupfield",',
        '    meaningZh: "a",',
        '    meaningZh: "b",',
        '    meaningI18n: { "ja": "x", "en": "y" }',
        "  }),",
        "];"
      ].join("\n")
    });
    expect(() => auditExamOverlays(OPTIONS)).toThrow(/duplicate/);
  });

  it("does not misclassify other functions or object forms as exam items", () => {
    writeExamFixture({
      n1: [
        'import { examQuestion } from "../helpers";',
        'function examQuestionShim(x: unknown) { return x; }',
        'const helper = examQuestionShim({',
        '  id: "not-an-item",',
        '  meaningZh: "untranslated",',
        '});',
        'export const n1Items = [',
        "  examQuestion({",
        '    id: "n1-real",',
        '    meaningZh: "real",',
        '    meaningI18n: { "ja": "本物", "en": "real" },',
        '    instructionZh: "選對的。",',
        '    promptContextZh: "每天吃。",',
        '    hintZh: "提示",',
        '    exampleMeaningZh: "例句",',
        '    explanation: "解說"',
        "  }),",
        "];"
      ].join("\n")
    });
    const records = auditExamOverlays(OPTIONS);
    expect(records.some((r) => String(r.sourceKey).includes("not-an-item"))).toBe(false);
    const realSourceKeys = records
      .filter((r) => String(r.sourceKey).includes("n1-real"))
      .map((r) => String(r.sourceKey));
    // meaningI18n is complete; the other five zh fields are not overlaid -> 5 x 2 locales
    expect(realSourceKeys).toHaveLength(10);
    for (const field of [
      "instructionI18n",
      "promptContextI18n",
      "hintI18n",
      "exampleMeaningI18n",
      "explanationI18n"
    ]) {
      expect(realSourceKeys).toContain(`n1-real.${field}`);
    }
  });

  it("reports byte-equivalent sorted records regardless of locale order", () => {
    writeExamFixture({
      n1: [
        'import { examQuestion } from "../helpers";',
        'export const n1Items = [',
        "  examQuestion({ id: \"n1-b\", meaningZh: \"b\", meaningI18n: { \"ja\": \"B\" } }),",
        "  examQuestion({ id: \"n1-a\", meaningZh: \"a\", meaningI18n: { \"en\": \"A\" } }),",
        "];"
      ].join("\n"),
      n2: [
        'import { examQuestion } from "../helpers";',
        'export const n2Items = [',
        "  examQuestion({ id: \"n2-a\", hintZh: \"h\", hintI18n: { \"ja\": \"H\" } }),",
        "];"
      ].join("\n")
    });
    const a = JSON.stringify(auditExamOverlays(OPTIONS));
    const b = JSON.stringify(auditExamOverlays({ repoRoot: tmpDir, targetLocales: ["en", "ja"] }));
    expect(a).toBe(b);
    const parsed = JSON.parse(a) as Array<{ sourceKey: string }>;
    expect(parsed).toHaveLength(3);
    expect(parsed.map((r) => r.sourceKey).sort()).toEqual([
      "n1-a.meaningI18n",
      "n1-b.meaningI18n",
      "n2-a.hintI18n"
    ]);
  });

  it("performs zero filesystem writes, console output, network and process.exit", () => {
    writeExamFixture({
      n5: [
        'import { examQuestion } from "../helpers";',
        'export const n5Items = [',
        "  examQuestion({ id: \"n5-ok\", meaningZh: \"ok\", meaningI18n: { \"ja\": \"OK\", \"en\": \"OK\" } }),",
        "];"
      ].join("\n")
    });
    const writeSpy = vi.spyOn(fs, "writeFileSync");
    const mkdirSpy = vi.spyOn(fs, "mkdirSync");
    const logSpy = vi.spyOn(console, "log");
    const errorSpy = vi.spyOn(console, "error");
    const exitSpy = vi.spyOn(process, "exit");
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    try {
      auditExamOverlays(OPTIONS);
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

describe("auditLearningBlockOverlays (#697)", () => {
  /** Repo-style fixture tree rooted at tmpDir/src/domain. */
  function writeBlockFixtures(sourceText: string, overlayText: string): void {
    fs.mkdirSync(path.join(tmpDir, "src", "domain"), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, "src", "domain", "learningBlocks.ts"), sourceText);
    fs.writeFileSync(path.join(tmpDir, "src", "domain", "learningBlocks.i18n.ts"), overlayText);
  }

  const SOURCE = (blocks: string): string => `export const learningBlocks = [${blocks}];`;
  const OVERLAY = (blocks: string): string => `export const learningBlockI18n = {${blocks}};`;
  const BLOCK = (id: string, extra = ""): string => `{ id: "${id}"${extra ? `, ${extra}` : ""} }`;
  const LOCALE = (body: string): string => `{ "en": { ${body} }, "ja": { ${body} } }`;

  beforeAll(() => {
    fs.mkdirSync(path.join(tmpDir, "src", "domain"), { recursive: true });
  });

  it("yields zero records when every source block id has an overlay entry", () => {
    writeBlockFixtures(
      SOURCE([BLOCK("kana-hiragana"), BLOCK("adverbial", `title: "修飾"`), BLOCK("n3-jouken")]),
      OVERLAY([`"kana-hiragana": ${LOCALE(`title: "Hiragana"`)}`, `"adverbial": ${LOCALE(`title: "Adverbial"`)}`, `"n3-jouken": ${LOCALE(`title: "Conditions"`)}`])
    );
    expect(auditLearningBlockOverlays({ repoRoot: tmpDir, targetLocales: ["en", "ja"] })).toEqual([]);
  });

  it("reports a missing overlay for a single block and locale, and dangling for a deleted source block", () => {
    writeBlockFixtures(
      SOURCE([BLOCK("kana-hiragana"), BLOCK("adverbial")]),
      OVERLAY([
        `"kana-hiragana": { "en": { title: "Hiragana" } }`,
        `"adverbial": ${LOCALE(`title: "Adverbial"`)}`,
        `"deleted-block": ${LOCALE(`title: "Orphan"`)}`
      ])
    );
    expect(auditLearningBlockOverlays({ repoRoot: tmpDir, targetLocales: ["en", "ja"] })).toEqual([
      { system: "learningBlocks", locale: "en", sourceKey: "", overlayKey: "deleted-block", status: "dangling" },
      { system: "learningBlocks", locale: "ja", sourceKey: "", overlayKey: "deleted-block", status: "dangling" },
      { system: "learningBlocks", locale: "ja", sourceKey: "kana-hiragana", overlayKey: "", status: "missing" }
    ]);
  });

  it("emits a missing record per target locale for a block with no overlay entry", () => {
    writeBlockFixtures(
      SOURCE([BLOCK("starter-vocab"), BLOCK("starter-desu")]),
      OVERLAY([`"starter-desu": ${LOCALE(`title: "Desu"`)}`])
    );
    const records = auditLearningBlockOverlays({ repoRoot: tmpDir, targetLocales: ["en", "ja"] });
    expect(records).toEqual([
      { system: "learningBlocks", locale: "en", sourceKey: "starter-vocab", overlayKey: "", status: "missing" },
      { system: "learningBlocks", locale: "ja", sourceKey: "starter-vocab", overlayKey: "", status: "missing" }
    ]);
  });

  it("only audits first-level overlay keys, never flattening nested field keys", () => {
    writeBlockFixtures(
      SOURCE([BLOCK("kana-hiragana")]),
      OVERLAY([
        `"kana-hiragana": ${LOCALE(`title: "H", notes: ["a", "b"], pitfalls: ["p"]`)}`,
        `"nested": ${LOCALE(`title: "Nested"`)}`
      ])
    );
    // kana-hiragana is fully overlaid (en + ja) -> no record. "nested" exists
    // only in the overlay -> a single dangling record per locale, and the
    // overlay's own field keys (title/notes/pitfalls) must NOT be counted.
    expect(auditLearningBlockOverlays({ repoRoot: tmpDir, targetLocales: ["en", "ja"] })).toEqual([
      { system: "learningBlocks", locale: "en", sourceKey: "", overlayKey: "nested", status: "dangling" },
      { system: "learningBlocks", locale: "ja", sourceKey: "", overlayKey: "nested", status: "dangling" }
    ]);
  });

  it("does not misclassify section/container/helper objects or unrelated ids", () => {
    writeBlockFixtures(
      SOURCE([
        BLOCK("teTa", `drills: [{ labelKey: "drillGodanTeTa" }]`),
        BLOCK("n5-sonzai", `patternDrills: [{ labelKey: "x", patternIds: ["n5-sonzai"] }]`),
        BLOCK("verb-types", `completionMode: "reference"`)
      ]),
      OVERLAY([
        `"teTa": ${LOCALE(`title: "Te-ta"`)}`,
        `"n5-sonzai": ${LOCALE(`title: "Existence"`)}`,
        `"verb-types": ${LOCALE(`title: "Groups"`)}`
      ])
    );
    // "teTa" is a genuine block id (helper functions like
    // isLearningBlockComplete or the IMPLICIT_HISTORY_THRESHOLD constant live in
    // the same file but are not array elements, so no ids leak). All three
    // blocks are fully overlaid for en + ja -> zero records.
    expect(auditLearningBlockOverlays({ repoRoot: tmpDir, targetLocales: ["en", "ja"] })).toEqual([]);
  });

  it("parses quoted and unquoted keys, multiline values and trailing commas", () => {
    writeBlockFixtures(
      SOURCE([BLOCK("negative", `title: "否定"`), BLOCK("plain")]),
      OVERLAY([
        `"negative": {\n  "en": {\n    "title": "Negative",\n  },\n  'ja': {\n    title: "否定",\n  },\n},`,
        `plain: {\n  "en": { "title": "Plain" },\n  "ja": { "title": "普通形" },\n},`
      ])
    );
    expect(auditLearningBlockOverlays({ repoRoot: tmpDir, targetLocales: ["en", "ja"] })).toEqual([]);
  });

  it("does not confuse an overlay value containing another block id with a real key", () => {
    writeBlockFixtures(
      SOURCE([BLOCK("starter-desu", `title: "基本句"`)]),
      OVERLAY([`"starter-desu": { "en": { "title": "AはBです, see n5-sonzai" }, "ja": { "title": "基本句" } }`])
    );
    // "n5-sonzai" appears inside the value text but is not an overlay key.
    expect(auditLearningBlockOverlays({ repoRoot: tmpDir, targetLocales: ["en", "ja"] })).toEqual([]);
  });

  it("fails closed on duplicate source block ids", () => {
    writeBlockFixtures(
      SOURCE([BLOCK("dup-block"), BLOCK("dup-block")]),
      OVERLAY([`"dup-block": ${LOCALE(`title: "Dup"`)}`])
    );
    expect(() => auditLearningBlockOverlays({ repoRoot: tmpDir, targetLocales: ["en"] })).toThrow(/duplicate/i);
  });

  it("fails closed on duplicate overlay first-level keys", () => {
    writeBlockFixtures(
      SOURCE([BLOCK("kana-hiragana")]),
      OVERLAY([`"kana-hiragana": ${LOCALE(`title: "A"`)}`, `"kana-hiragana": ${LOCALE(`title: "B"`)}`])
    );
    expect(() => auditLearningBlockOverlays({ repoRoot: tmpDir, targetLocales: ["en"] })).toThrow(/duplicate/i);
  });

  it("fails closed on overlay spreads", () => {
    writeBlockFixtures(
      SOURCE([BLOCK("kana-hiragana")]),
      OVERLAY([`"kana-hiragana": ${LOCALE(`title: "A"`)}, ...extra`])
    );
    expect(() => auditLearningBlockOverlays({ repoRoot: tmpDir, targetLocales: ["en"] })).toThrow(/spread/i);
  });

  it("fails closed on computed first-level overlay keys", () => {
    writeBlockFixtures(
      SOURCE([BLOCK("kana-hiragana")]),
      OVERLAY([`[getKey()]: ${LOCALE(`title: "A"`)}`])
    );
    expect(() => auditLearningBlockOverlays({ repoRoot: tmpDir, targetLocales: ["en"] })).toThrow(/computed/i);
  });

  it("fails closed on dynamic computed source ids", () => {
    writeBlockFixtures(
      SOURCE([`{ id: DYNAMIC_ID, title: "x" }`]),
      OVERLAY([`"whatever": ${LOCALE(`title: "A"`)}`])
    );
    expect(() => auditLearningBlockOverlays({ repoRoot: tmpDir, targetLocales: ["en"] })).toThrow(/static|literal|id/i);
  });

  it("returns byte-equivalent records regardless of source or locale traversal order", () => {
    writeBlockFixtures(
      SOURCE([BLOCK("n5-sonzai"), BLOCK("adverbial"), BLOCK("starter-vocab")]),
      OVERLAY([
        `"adverbial": ${LOCALE(`title: "A"`)}`,
        `"starter-vocab": ${LOCALE(`title: "S"`)}`,
        `"n5-sonzai": ${LOCALE(`title: "N"`)}`
      ])
    );
    const a = JSON.stringify(
      auditLearningBlockOverlays({ repoRoot: tmpDir, targetLocales: ["en", "ja"] })
    );
    const b = JSON.stringify(
      auditLearningBlockOverlays({ repoRoot: tmpDir, targetLocales: ["ja", "en"] })
    );
    expect(a).toBe(b);
    expect(auditLearningBlockOverlays({ repoRoot: tmpDir, targetLocales: ["en", "ja"] })).toEqual([]);
  });

  it("performs zero filesystem writes, console output, network and process.exit, and has no hardcoded locales", () => {
    writeBlockFixtures(
      SOURCE([BLOCK("kana-hiragana", `title: "平假名"`)]),
      OVERLAY([`"kana-hiragana": ${LOCALE(`title: "Hiragana"`)}`])
    );
    const writeSpy = vi.spyOn(fs, "writeFileSync");
    const mkdirSpy = vi.spyOn(fs, "mkdirSync");
    const logSpy = vi.spyOn(console, "log");
    const errorSpy = vi.spyOn(console, "error");
    const exitSpy = vi.spyOn(process, "exit");
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    try {
      const records = auditLearningBlockOverlays({ repoRoot: tmpDir, targetLocales: ["en", "ja"] });
      expect(records).toEqual([]);
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

  it("audits the real repo without producing records and without writing anything", () => {
    const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
    const writeSpy = vi.spyOn(fs, "writeFileSync");
    const mkdirSpy = vi.spyOn(fs, "mkdirSync");
    try {
      const records = auditLearningBlockOverlays({ repoRoot, targetLocales: ["en", "ja"] });
      expect(records).toEqual([]);
      expect(writeSpy).not.toHaveBeenCalled();
      expect(mkdirSpy).not.toHaveBeenCalled();
    } finally {
      writeSpy.mockRestore();
      mkdirSpy.mockRestore();
    }
  });
});
