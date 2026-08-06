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
  auditGrammarNoteOverlays,
  auditKanjiOnyomiOverlays,
  auditKeySets,
  auditLearningBlockOverlays,
  auditSentencePatternOverlays,
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

describe("auditSentencePatternOverlays (#698)", () => {
  /** Repo-style fixture tree rooted at tmpDir/src/domain. */
  function writeSentencePatternFixtures(sourceText: string, overlayText: string): void {
    fs.mkdirSync(path.join(tmpDir, "src", "domain"), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, "src", "domain", "sentencePatterns.ts"), sourceText);
    fs.writeFileSync(path.join(tmpDir, "src", "domain", "sentencePatterns.i18n.ts"), overlayText);
  }

  /** An `Item: SentencePatternItem[]` typed array declaration. */
  const ARRAY = (name: string, items: string): string =>
    `const ${name}: SentencePatternItem[] = [${items}];`;
  /** A learner-facing SentencePatternItem object literal with a non-empty id. */
  const ITEM = (id: string): string =>
    `{ id: "${id}", patternId: "starter-desu", promptText: "あ、___。", hintZh: "提示", promptContextZh: "情境", expectedAnswer: "です", options: ["です"], explanation: "解說" }`;
  const OVERLAY = (entries: string): string =>
    `export const sentencePatternI18n: Record<string, SentencePatternOverlay> = {${entries}};`;
  const ENTRY = (id: string, locales: string): string =>
    `"${id}": { "hintI18n": { ${locales} }, "promptContextI18n": { ${locales} }, "explanationI18n": { ${locales} } }`;
  const PAIRS = `"en": "E", "ja": "J"`;
  const SRC_WITH_TYPE = (name: string, items: string): string =>
    `type SentencePatternItem = { id: string; hintZh: string; promptContextZh: string; explanation: string; };\n${ARRAY(name, items)}`;

  beforeAll(() => {
    fs.mkdirSync(path.join(tmpDir, "src", "domain"), { recursive: true });
  });

  it("yields zero records when every source item id has a first-level overlay key", () => {
    writeSentencePatternFixtures(
      SRC_WITH_TYPE(
        "STARTER_ITEMS",
        ITEM("pattern-a-001") + ITEM("pattern-b-001") + ITEM("pattern-c-001")
      ),
      OVERLAY(ENTRY("pattern-a-001", PAIRS) + ENTRY("pattern-b-001", PAIRS) + ENTRY("pattern-c-001", PAIRS))
    );
    expect(
      auditSentencePatternOverlays({ repoRoot: tmpDir, targetLocales: ["en", "ja"] })
    ).toEqual([]);
  });

  it("reports a missing record per target locale for a source item with no overlay entry", () => {
    writeSentencePatternFixtures(
      SRC_WITH_TYPE("STARTER_ITEMS", ITEM("pattern-a-001") + ITEM("pattern-b-001")),
      OVERLAY(ENTRY("pattern-b-001", PAIRS))
    );
    expect(
      auditSentencePatternOverlays({ repoRoot: tmpDir, targetLocales: ["en", "ja"] })
    ).toEqual([
      { system: "sentencePatterns", locale: "en", sourceKey: "pattern-a-001", overlayKey: "", status: "missing" },
      { system: "sentencePatterns", locale: "ja", sourceKey: "pattern-a-001", overlayKey: "", status: "missing" }
    ]);
  });

  it("reports a dangling record for an overlay key with no source item id", () => {
    writeSentencePatternFixtures(
      SRC_WITH_TYPE("STARTER_ITEMS", ITEM("pattern-a-001")),
      OVERLAY(ENTRY("pattern-a-001", PAIRS) + ENTRY("pattern-deleted-001", PAIRS))
    );
    expect(
      auditSentencePatternOverlays({ repoRoot: tmpDir, targetLocales: ["en", "ja"] })
    ).toEqual([
      { system: "sentencePatterns", locale: "en", sourceKey: "", overlayKey: "pattern-deleted-001", status: "dangling" },
      { system: "sentencePatterns", locale: "ja", sourceKey: "", overlayKey: "pattern-deleted-001", status: "dangling" }
    ]);
  });

  it("ignores the patternInstructionI18n global instruction overlay", () => {
    writeSentencePatternFixtures(
      SRC_WITH_TYPE("STARTER_ITEMS", ITEM("pattern-a-001")),
      [
        'export const patternInstructionI18n = { en: "Choose.", ja: "選んで。" };',
        OVERLAY(ENTRY("pattern-a-001", PAIRS))
      ].join("\n")
    );
    // The global instruction overlay's own locale keys (en / ja) must never be
    // read as item keys, and it must not fabricate phantom source keys.
    expect(
      auditSentencePatternOverlays({ repoRoot: tmpDir, targetLocales: ["en", "ja"] })
    ).toEqual([]);
  });

  it("never flattens nested hintI18n / promptContextI18n / explanationI18n keys into item keys", () => {
    writeSentencePatternFixtures(
      SRC_WITH_TYPE("STARTER_ITEMS", ITEM("pattern-a-001")),
      // The nested field names must not be treated as item keys even though the
      // "hintI18n" field name equals an item's own identifier.
      OVERLAY(`"hintI18n": { "en": "N", "ja": "N" }, "pattern-a-001": { "hintI18n": { ${PAIRS} } }`)
    );
    expect(
      auditSentencePatternOverlays({ repoRoot: tmpDir, targetLocales: ["en", "ja"] })
    ).toEqual([
      { system: "sentencePatterns", locale: "en", sourceKey: "", overlayKey: "hintI18n", status: "dangling" },
      { system: "sentencePatterns", locale: "ja", sourceKey: "", overlayKey: "hintI18n", status: "dangling" }
    ]);
  });

  it("does not misclassify pattern metadata, type-union members, helper objects or comments", () => {
    writeSentencePatternFixtures(
      [
        "type SentencePatternItem = { id: string; hintZh: string; patternId: string; };",
        'const STARTER_ITEMS: SentencePatternItem[] = [',
        '  { id: "pattern-a-001", patternId: "starter-desu", hintZh: "提示" },',
        "];",
        'const PATTERN_LABEL_ZH = { "starter-desu": "基本句", "not-an-item": "元" };',
        "// The id below is a type-union member, not an item id.",
        'type SentencePatternId = "starter-desu" | "pattern-not-an-item";',
        "const helper: SentencePatternItem = {",
        '  id: "pattern-helper-001",',
        '  patternId: "starter-desu",',
        '  hintZh: "helper hint",',
        "};",
        "const meta = { id: \"pattern-meta-001\" };"
      ].join("\n"),
      OVERLAY(ENTRY("pattern-a-001", PAIRS))
    );
    expect(
      auditSentencePatternOverlays({ repoRoot: tmpDir, targetLocales: ["en", "ja"] })
    ).toEqual([]);
  });

  it("only audits first-level overlay keys, ignoring locale keys nested two levels deep", () => {
    writeSentencePatternFixtures(
      SRC_WITH_TYPE("STARTER_ITEMS", ITEM("pattern-a-001")),
      OVERLAY(`"pattern-a-001": { "hintI18n": { "en": "E", "ja": "J" }, "promptContextI18n": { "ja": "J" } }`)
    );
    expect(
      auditSentencePatternOverlays({ repoRoot: tmpDir, targetLocales: ["en", "ja"] })
    ).toEqual([]);
  });

  it("skips non-learner-facing objects inside item arrays instead of counting them as source keys", () => {
    writeSentencePatternFixtures(
      SRC_WITH_TYPE(
        "STARTER_ITEMS",
        ITEM("pattern-a-001") + `{ id: "pattern-config-001", patternId: "starter-desu" }`
      ),
      OVERLAY(ENTRY("pattern-a-001", PAIRS))
    );
    // "pattern-config-001" carries an id but no hintZh / promptContextZh /
    // explanation, so it is not a learner-facing item and must not produce a
    // missing record (nor become a phantom source key).
    expect(
      auditSentencePatternOverlays({ repoRoot: tmpDir, targetLocales: ["en", "ja"] })
    ).toEqual([]);
  });

  it("fails closed on duplicate source item ids", () => {
    writeSentencePatternFixtures(
      SRC_WITH_TYPE("STARTER_ITEMS", ITEM("pattern-dup-001") + ITEM("pattern-dup-001")),
      OVERLAY(ENTRY("pattern-dup-001", PAIRS))
    );
    expect(() => auditSentencePatternOverlays({ repoRoot: tmpDir, targetLocales: ["en"] })).toThrow(/duplicate/i);
  });

  it("fails closed on duplicate overlay first-level keys", () => {
    writeSentencePatternFixtures(
      SRC_WITH_TYPE("STARTER_ITEMS", ITEM("pattern-a-001")),
      OVERLAY(ENTRY("pattern-a-001", PAIRS) + ENTRY("pattern-a-001", PAIRS))
    );
    expect(() => auditSentencePatternOverlays({ repoRoot: tmpDir, targetLocales: ["en"] })).toThrow(/duplicate/i);
  });

  it("fails closed on overlay spreads at the first level", () => {
    writeSentencePatternFixtures(
      SRC_WITH_TYPE("STARTER_ITEMS", ITEM("pattern-a-001")),
      OVERLAY(`"pattern-a-001": { "hintI18n": { ${PAIRS} } }, ...extra`)
    );
    expect(() => auditSentencePatternOverlays({ repoRoot: tmpDir, targetLocales: ["en"] })).toThrow(/spread/i);
  });

  it("fails closed on computed first-level overlay keys", () => {
    writeSentencePatternFixtures(
      SRC_WITH_TYPE("STARTER_ITEMS", ITEM("pattern-a-001")),
      OVERLAY(`[getKey()]: { "hintI18n": { ${PAIRS} } }`)
    );
    expect(() => auditSentencePatternOverlays({ repoRoot: tmpDir, targetLocales: ["en"] })).toThrow(/computed/i);
  });

  it("fails closed on dynamic / missing source item ids", () => {
    writeSentencePatternFixtures(
      "type SentencePatternItem = { id: string; hintZh: string; };\n" +
        "const STARTER_ITEMS: SentencePatternItem[] = [{ id: DYNAMIC_ID, hintZh: \"x\" }];",
      OVERLAY(ENTRY("whatever", PAIRS))
    );
    expect(() => auditSentencePatternOverlays({ repoRoot: tmpDir, targetLocales: ["en"] })).toThrow(/id|static|literal/i);

    writeSentencePatternFixtures(
      "type SentencePatternItem = { id: string; hintZh: string; };\n" +
        "const STARTER_ITEMS: SentencePatternItem[] = [{ hintZh: \"x\" }];",
      OVERLAY(ENTRY("whatever", PAIRS))
    );
    expect(() => auditSentencePatternOverlays({ repoRoot: tmpDir, targetLocales: ["en"] })).toThrow(/id/);
  });

  it("fails closed on a spread inside an item array element", () => {
    writeSentencePatternFixtures(
      "type SentencePatternItem = { id: string; hintZh: string; };\n" +
        "const EXTRA = { hintZh: \"x\" };\n" +
        "const STARTER_ITEMS: SentencePatternItem[] = [{ id: \"pattern-a-001\", ...EXTRA }];",
      OVERLAY(ENTRY("pattern-a-001", PAIRS))
    );
    expect(() => auditSentencePatternOverlays({ repoRoot: tmpDir, targetLocales: ["en"] })).toThrow(/spread/i);
  });

  it("fails closed on computed member names in an item instead of silently dropping them", () => {
    writeSentencePatternFixtures(
      "type SentencePatternItem = { id: string; hintZh: string; };\n" +
        "const STARTER_ITEMS: SentencePatternItem[] = [{ id: \"pattern-a-001\", [\"hintZh\"]: \"hint\" }];",
      OVERLAY(ENTRY("pattern-a-001", PAIRS))
    );
    // A computed non-id member must not be silently treated as absent: that
    // would misclassify the item and fabricate a phantom missing/dangling pair.
    expect(() => auditSentencePatternOverlays({ repoRoot: tmpDir, targetLocales: ["en"] })).toThrow(/computed/i);
  });

  it("returns byte-equivalent records regardless of source or locale traversal order", () => {
    writeSentencePatternFixtures(
      SRC_WITH_TYPE("STARTER_ITEMS", ITEM("pattern-a-001") + ITEM("pattern-b-001") + ITEM("pattern-c-001")),
      OVERLAY(
        ENTRY("pattern-c-001", PAIRS) +
          ENTRY("pattern-a-001", PAIRS) +
          ENTRY("pattern-b-001", PAIRS) +
          ENTRY("pattern-orphan-001", PAIRS)
      )
    );
    const a = JSON.stringify(
      auditSentencePatternOverlays({ repoRoot: tmpDir, targetLocales: ["en", "ja"] })
    );
    const b = JSON.stringify(
      auditSentencePatternOverlays({ repoRoot: tmpDir, targetLocales: ["ja", "en"] })
    );
    expect(a).toBe(b);
  });

  it("has no hardcoded locales, no filesystem writes, no console output and no process.exit", () => {
    writeSentencePatternFixtures(
      SRC_WITH_TYPE("STARTER_ITEMS", ITEM("pattern-a-001")),
      OVERLAY(ENTRY("pattern-a-001", PAIRS))
    );
    const writeSpy = vi.spyOn(fs, "writeFileSync");
    const mkdirSpy = vi.spyOn(fs, "mkdirSync");
    const logSpy = vi.spyOn(console, "log");
    const errorSpy = vi.spyOn(console, "error");
    const exitSpy = vi.spyOn(process, "exit");
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    try {
      const records = auditSentencePatternOverlays({ repoRoot: tmpDir, targetLocales: ["en", "ja"] });
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

  it("audits the real repo with zero records and without writing anything", () => {
    const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
    const writeSpy = vi.spyOn(fs, "writeFileSync");
    const mkdirSpy = vi.spyOn(fs, "mkdirSync");
    try {
      const records = auditSentencePatternOverlays({ repoRoot, targetLocales: ["en", "ja"] });
      expect(records).toEqual([]);
      expect(writeSpy).not.toHaveBeenCalled();
      expect(mkdirSpy).not.toHaveBeenCalled();
    } finally {
      writeSpy.mockRestore();
      mkdirSpy.mockRestore();
    }
  });
});

describe("auditGrammarNoteOverlays (#700)", () => {
  /** Repo-style fixture tree rooted at tmpDir/src/domain. */
  function writeGrammarNoteFixtures(sourceText: string, overlayText: string): void {
    fs.mkdirSync(path.join(tmpDir, "src", "domain"), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, "src", "domain", "grammarNotes.ts"), sourceText);
    fs.writeFileSync(path.join(tmpDir, "src", "domain", "grammarNotes.i18n.ts"), overlayText);
  }

  /** A learner-facing note entry with a non-empty static surface key. */
  const NOTE = (surface: string): string =>
    `  ${surface}: { surface: "${surface}", jlptLevel: "N2", meaningZh: "意思", formation: "接續", usageZh: "用法", examples: [], confusions: [] }`;
  const OVERLAY = (entries: string): string =>
    `export const grammarNoteI18n: GrammarNoteOverlays = {${entries}};`;
  const ENTRY = (surface: string, locales: string): string =>
    `  "${surface}": { ${locales} }`;
  const PAIRS = `"en": { "meaningZh": "E", "usageZh": "U" }, "ja": { "meaningZh": "J", "usageZh": "U" }`;
  const SRC = (notes: string): string =>
    `type GrammarNote = { surface: string; jlptLevel: string | null; meaningZh: string; formation: string; usageZh: string; examples: unknown[]; confusions: string[]; };\n` +
    `export const grammarNotes: Record<string, GrammarNote> = {\n${notes}\n};`;

  beforeAll(() => {
    fs.mkdirSync(path.join(tmpDir, "src", "domain"), { recursive: true });
  });

  it("yields zero records when every learner-facing source note has a first-level overlay key for every locale", () => {
    writeGrammarNoteFixtures(
      SRC([NOTE('"ばかりに"'), NOTE('"だけあって"'), NOTE("なり")].join(",\n")),
      OVERLAY([ENTRY("ばかりに", PAIRS), ENTRY("だけあって", PAIRS), ENTRY("なり", PAIRS)].join(",\n"))
    );
    expect(
      auditGrammarNoteOverlays({ repoRoot: tmpDir, targetLocales: ["en", "ja"] })
    ).toEqual([]);
  });

  it("reports a missing record per target locale for a single note with no overlay entry", () => {
    writeGrammarNoteFixtures(
      SRC([NOTE('"ばかりに"'), NOTE('"あげく"')].join(",\n")),
      OVERLAY(ENTRY("ばかりに", PAIRS))
    );
    expect(
      auditGrammarNoteOverlays({ repoRoot: tmpDir, targetLocales: ["en", "ja"] })
    ).toEqual([
      { system: "grammarNotes", locale: "en", sourceKey: "あげく", overlayKey: "", status: "missing" },
      { system: "grammarNotes", locale: "ja", sourceKey: "あげく", overlayKey: "", status: "missing" }
    ]);
  });

  it("reports a dangling record per overlay locale for a source note that has been deleted", () => {
    writeGrammarNoteFixtures(
      SRC(NOTE('"ばかりに"')),
      OVERLAY([ENTRY("ばかりに", PAIRS), ENTRY("せいで", PAIRS)].join(",\n"))
    );
    expect(
      auditGrammarNoteOverlays({ repoRoot: tmpDir, targetLocales: ["en", "ja"] })
    ).toEqual([
      { system: "grammarNotes", locale: "en", sourceKey: "", overlayKey: "せいで", status: "dangling" },
      { system: "grammarNotes", locale: "ja", sourceKey: "", overlayKey: "せいで", status: "dangling" }
    ]);
  });

  it("does not confuse an overlay value containing another source note key with a real first-level key", () => {
    writeGrammarNoteFixtures(
      SRC([NOTE('"ばかりに"'), NOTE('"だけあって"')].join(",\n")),
      OVERLAY(
        ENTRY("ばかりに", `"en": { "meaningZh": "E, see だけあって" }, "ja": { "meaningZh": "J, see だけあって" }`)
      )
    );
    // "だけあって" appears inside the value text but is not an overlay first-level
    // key; it must remain a missing record rather than being matched by text.
    expect(
      auditGrammarNoteOverlays({ repoRoot: tmpDir, targetLocales: ["en", "ja"] })
    ).toEqual([
      { system: "grammarNotes", locale: "en", sourceKey: "だけあって", overlayKey: "", status: "missing" },
      { system: "grammarNotes", locale: "ja", sourceKey: "だけあって", overlayKey: "", status: "missing" }
    ]);
  });

  it("never flattens nested locale field keys into first-level overlay keys", () => {
    writeGrammarNoteFixtures(
      SRC(NOTE('"ばかりに"')),
      OVERLAY(
        ENTRY(
          "ばかりに",
          `"en": { "meaningZh": "E", "formation": "F", "usageZh": "U", "examplesZh": ["X"], "confusions": ["C"] }`
        )
      )
    );
    // The nested field names (meaningZh / formation / usageZh / examplesZh /
    // confusions) must never be read as note keys, even though "confusions" could
    // be confused with a surface. ばかりに is fully overlaid for en -> zero records.
    expect(
      auditGrammarNoteOverlays({ repoRoot: tmpDir, targetLocales: ["en"] })
    ).toEqual([]);
  });

  it("does not misclassify helper objects, template keys or unrelated surface fields", () => {
    writeGrammarNoteFixtures(
      [
        SRC(NOTE('"ばかりに"')),
        "export const GRAMMAR_HELPER = { surface: \"なり\" };",
        'const TEMPLATE_NOTE: Record<string, GrammarNote> = { "せいで": { surface: "せいで", jlptLevel: null, meaningZh: "x", formation: "f", usageZh: "u", examples: [], confusions: [] } };',
        '// The surface below lives inside a comment and must never count.',
        "// あげく is not a real note here."
      ].join("\n"),
      OVERLAY(ENTRY("ばかりに", PAIRS))
    );
    // The helper/template/comment objects are not elements of the grammarNotes
    // array-of-record literal, so なり / せいで / あげく must not become source
    // keys. ばかりに is fully overlaid for en + ja -> zero records.
    expect(
      auditGrammarNoteOverlays({ repoRoot: tmpDir, targetLocales: ["en", "ja"] })
    ).toEqual([]);
  });

  it("parses quoted and unquoted keys, multiline values and trailing commas", () => {
    writeGrammarNoteFixtures(
      SRC([NOTE('"ばかりに"'), NOTE("なり")].join(",\n")),
      OVERLAY([
        `  "ばかりに": {\n    "en": { "meaningZh": "E" },\n    'ja': { meaningZh: "J" },\n  },`,
        `  なり: {\n    "en": { "meaningZh": "E" },\n    "ja": { "meaningZh": "J" },\n  },`
      ].join("\n"))
    );
    expect(
      auditGrammarNoteOverlays({ repoRoot: tmpDir, targetLocales: ["en", "ja"] })
    ).toEqual([]);
  });

  it("fails closed on duplicate source note keys", () => {
    writeGrammarNoteFixtures(
      SRC([NOTE('"ばかりに"'), NOTE('"ばかりに"')].join(",\n")),
      OVERLAY(ENTRY("ばかりに", PAIRS))
    );
    expect(() => auditGrammarNoteOverlays({ repoRoot: tmpDir, targetLocales: ["en"] })).toThrow(/duplicate/i);
  });

  it("fails closed on duplicate overlay first-level keys", () => {
    writeGrammarNoteFixtures(
      SRC(NOTE('"ばかりに"')),
      OVERLAY([ENTRY("ばかりに", PAIRS), ENTRY("ばかりに", PAIRS)].join(",\n"))
    );
    expect(() => auditGrammarNoteOverlays({ repoRoot: tmpDir, targetLocales: ["en"] })).toThrow(/duplicate/i);
  });

  it("fails closed on overlay spreads at the first level", () => {
    writeGrammarNoteFixtures(
      SRC(NOTE('"ばかりに"')),
      OVERLAY(`${ENTRY("ばかりに", PAIRS)}, ...extra`)
    );
    expect(() => auditGrammarNoteOverlays({ repoRoot: tmpDir, targetLocales: ["en"] })).toThrow(/spread/i);
  });

  it("fails closed on computed first-level overlay keys", () => {
    writeGrammarNoteFixtures(
      SRC(NOTE('"ばかりに"')),
      OVERLAY(`  [getKey()]: { ${PAIRS} }`)
    );
    expect(() => auditGrammarNoteOverlays({ repoRoot: tmpDir, targetLocales: ["en"] })).toThrow(/computed/i);
  });

  it("fails closed on dynamic / missing source note keys", () => {
    writeGrammarNoteFixtures(
      "type GrammarNote = { surface: string; jlptLevel: string | null; meaningZh: string; formation: string; usageZh: string; examples: unknown[]; confusions: string[]; };\n" +
        "export const grammarNotes: Record<string, GrammarNote> = { [DYNAMIC_KEY]: { surface: \"x\", jlptLevel: null, meaningZh: \"m\", formation: \"f\", usageZh: \"u\", examples: [], confusions: [] } };",
      OVERLAY(ENTRY("whatever", PAIRS))
    );
    expect(() => auditGrammarNoteOverlays({ repoRoot: tmpDir, targetLocales: ["en"] })).toThrow(/computed/i);

    writeGrammarNoteFixtures(
      "type GrammarNote = { surface: string; jlptLevel: string | null; meaningZh: string; formation: string; usageZh: string; examples: unknown[]; confusions: string[]; };\n" +
        "export const grammarNotes: Record<string, GrammarNote> = { ばかりに: { surface: \"ばかりに\", jlptLevel: null, meaningZh: \"m\", formation: \"f\", usageZh: \"u\", examples: [], confusions: [] } };",
      OVERLAY(ENTRY("ばかりに", PAIRS))
    );
    // The surface member inside a note entry is not the key of the record; the
    // key of ばかりに is the static member name, which is present.
    expect(() => auditGrammarNoteOverlays({ repoRoot: tmpDir, targetLocales: ["en"] })).not.toThrow();
  });

  it("fails closed on computed member names in a note entry instead of silently dropping them", () => {
    writeGrammarNoteFixtures(
      SRC(`  "ばかりに": { surface: "ばかりに", ["meaningZh"]: "意思", jlptLevel: "N2", formation: "f", usageZh: "u", examples: [], confusions: [] }`),
      OVERLAY(ENTRY("ばかりに", PAIRS))
    );
    // A computed non-key member must not be silently treated as absent: that
    // would misclassify the note and fabricate a phantom missing/dangling pair.
    expect(() => auditGrammarNoteOverlays({ repoRoot: tmpDir, targetLocales: ["en"] })).toThrow(/computed/i);
  });

  it("returns byte-equivalent records regardless of source or locale traversal order", () => {
    writeGrammarNoteFixtures(
      SRC([NOTE('"ばかりに"'), NOTE('"だけあって"'), NOTE('"あげく"')].join(",\n")),
      OVERLAY(
        [
          ENTRY("あげく", PAIRS),
          ENTRY("ばかりに", PAIRS),
          ENTRY("だけあって", PAIRS),
          ENTRY("っぱなし", PAIRS)
        ].join(",\n")
      )
    );
    const a = JSON.stringify(
      auditGrammarNoteOverlays({ repoRoot: tmpDir, targetLocales: ["en", "ja"] })
    );
    const b = JSON.stringify(
      auditGrammarNoteOverlays({ repoRoot: tmpDir, targetLocales: ["ja", "en"] })
    );
    expect(a).toBe(b);
  });

  it("has no hardcoded locales, no filesystem writes, no console output and no process.exit", () => {
    writeGrammarNoteFixtures(
      SRC(NOTE('"ばかりに"')),
      OVERLAY(ENTRY("ばかりに", PAIRS))
    );
    const writeSpy = vi.spyOn(fs, "writeFileSync");
    const mkdirSpy = vi.spyOn(fs, "mkdirSync");
    const logSpy = vi.spyOn(console, "log");
    const errorSpy = vi.spyOn(console, "error");
    const exitSpy = vi.spyOn(process, "exit");
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    try {
      const records = auditGrammarNoteOverlays({ repoRoot: tmpDir, targetLocales: ["en", "ja"] });
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

  it("audits the real repo with zero records and without writing anything", () => {
    const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
    const writeSpy = vi.spyOn(fs, "writeFileSync");
    const mkdirSpy = vi.spyOn(fs, "mkdirSync");
    try {
      const records = auditGrammarNoteOverlays({ repoRoot, targetLocales: ["en", "ja"] });
      expect(records).toEqual([]);
      expect(writeSpy).not.toHaveBeenCalled();
      expect(mkdirSpy).not.toHaveBeenCalled();
    } finally {
      writeSpy.mockRestore();
      mkdirSpy.mockRestore();
    }
  });
});

describe("auditKanjiOnyomiOverlays (#701)", () => {
  /** Repo-style fixture tree rooted at tmpDir/src/domain. */
  function writeKanjiOnyomiFixtures(sourceText: string, overlayText: string): void {
    fs.mkdirSync(path.join(tmpDir, "src", "domain"), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, "src", "domain", "kanjiOnyomi.ts"), sourceText);
    fs.writeFileSync(path.join(tmpDir, "src", "domain", "kanjiOnyomi.i18n.ts"), overlayText);
  }

  /** A learner-facing kanji entry: non-empty static `kanji`, onyomi, meaningZh. */
  const KANJI = (kanji: string): string =>
    `  { kanji: "${kanji}", onyomi: ["あん"], kunyomi: ["やすい"], meaningZh: "安心", level: "N5" }`;
  const OVERLAY = (entries: string): string =>
    `export const kanjiMeaningI18n: Record<string, LocalizedText> = {${entries}};`;
  const ENTRY = (kanji: string, locales: string): string =>
    `  "${kanji}": { ${locales} }`;
  const PAIRS = `"en": "cheap; at ease", "ja": "安い・安心"`;
  const SRC = (entries: string): string =>
    `type KanjiOnyomiEntry = { kanji: string; onyomi: string[]; kunyomi: string[]; meaningZh: string; level: string; };\n` +
    `export const kanjiOnyomi: KanjiOnyomiEntry[] = [\n${entries}\n];`;

  beforeAll(() => {
    fs.mkdirSync(path.join(tmpDir, "src", "domain"), { recursive: true });
  });

  it("yields zero records when every source kanji has a first-level overlay key for every locale", () => {
    writeKanjiOnyomiFixtures(
      SRC([KANJI("安"), KANJI("医"), KANJI("員")].join(",\n")),
      OVERLAY([ENTRY("安", PAIRS), ENTRY("医", PAIRS), ENTRY("員", PAIRS)].join(",\n"))
    );
    expect(
      auditKanjiOnyomiOverlays({ repoRoot: tmpDir, targetLocales: ["en", "ja"] })
    ).toEqual([]);
  });

  it("reports a missing record per target locale for a single kanji with no overlay entry", () => {
    writeKanjiOnyomiFixtures(
      SRC([KANJI("安"), KANJI("医")].join(",\n")),
      OVERLAY(ENTRY("安", PAIRS))
    );
    expect(
      auditKanjiOnyomiOverlays({ repoRoot: tmpDir, targetLocales: ["en", "ja"] })
    ).toEqual([
      { system: "kanjiOnyomi", locale: "en", sourceKey: "医", overlayKey: "", status: "missing" },
      { system: "kanjiOnyomi", locale: "ja", sourceKey: "医", overlayKey: "", status: "missing" }
    ]);
  });

  it("reports a dangling record per overlay locale for a source kanji that has been deleted", () => {
    writeKanjiOnyomiFixtures(
      SRC(KANJI("安")),
      OVERLAY([ENTRY("安", PAIRS), ENTRY("医", PAIRS)].join(",\n"))
    );
    expect(
      auditKanjiOnyomiOverlays({ repoRoot: tmpDir, targetLocales: ["en", "ja"] })
    ).toEqual([
      { system: "kanjiOnyomi", locale: "en", sourceKey: "", overlayKey: "医", status: "dangling" },
      { system: "kanjiOnyomi", locale: "ja", sourceKey: "", overlayKey: "医", status: "dangling" }
    ]);
  });

  it("does not confuse an overlay value containing another source kanji with a real first-level key", () => {
    writeKanjiOnyomiFixtures(
      SRC([KANJI("安"), KANJI("医")].join(",\n")),
      OVERLAY(
        ENTRY("安", `"en": "cheap; see 医", "ja": "安い・安心"`)
      )
    );
    // "医" appears inside the value text but is not an overlay first-level key;
    // it must remain a missing record rather than being matched by text.
    expect(
      auditKanjiOnyomiOverlays({ repoRoot: tmpDir, targetLocales: ["en", "ja"] })
    ).toEqual([
      { system: "kanjiOnyomi", locale: "en", sourceKey: "医", overlayKey: "", status: "missing" },
      { system: "kanjiOnyomi", locale: "ja", sourceKey: "医", overlayKey: "", status: "missing" }
    ]);
  });

  it("never flattens nested locale field keys into first-level overlay keys", () => {
    writeKanjiOnyomiFixtures(
      SRC(KANJI("安")),
      OVERLAY(
        ENTRY(
          "安",
          `"en": "cheap; at ease", "ja": "安い・安心", "fr": "pas cher"`
        )
      )
    );
    // The locale keys (en / ja / fr) are nested values inside the entry; the
    // adapter never reads them as first-level overlay keys.
    expect(
      auditKanjiOnyomiOverlays({ repoRoot: tmpDir, targetLocales: ["en", "ja"] })
    ).toEqual([]);
  });

  it("does not misclassify non-array content, unrelated surface fields or comments", () => {
    writeKanjiOnyomiFixtures(
      [
        SRC(KANJI("安")),
        'export const KANJI_HELPER = { kanji: "医" };',
        '// 員 is not a real entry here.'
      ].join("\n"),
      OVERLAY(ENTRY("安", PAIRS))
    );
    // 医 / 員 live outside the kanjiOnyomi array literal and must never become
    // source keys. 安 is fully overlaid for en + ja -> zero records.
    expect(
      auditKanjiOnyomiOverlays({ repoRoot: tmpDir, targetLocales: ["en", "ja"] })
    ).toEqual([]);
  });

  it("parses quoted and unquoted keys, multiline values and trailing commas", () => {
    writeKanjiOnyomiFixtures(
      SRC([KANJI("安"), KANJI("医")].join(",\n")),
      OVERLAY([
        `  "安": {\n    "en": "cheap",\n    'ja': "安い",\n  },`,
        `  医: {\n    "en": "medicine",\n    "ja": "医",\n  },`
      ].join("\n"))
    );
    expect(
      auditKanjiOnyomiOverlays({ repoRoot: tmpDir, targetLocales: ["en", "ja"] })
    ).toEqual([]);
  });

  it("fails closed on duplicate source kanji keys", () => {
    writeKanjiOnyomiFixtures(
      SRC([KANJI("安"), KANJI("安")].join(",\n")),
      OVERLAY(ENTRY("安", PAIRS))
    );
    expect(() => auditKanjiOnyomiOverlays({ repoRoot: tmpDir, targetLocales: ["en"] })).toThrow(/duplicate/i);
  });

  it("fails closed on duplicate overlay first-level keys", () => {
    writeKanjiOnyomiFixtures(
      SRC(KANJI("安")),
      OVERLAY([ENTRY("安", PAIRS), ENTRY("安", PAIRS)].join(",\n"))
    );
    expect(() => auditKanjiOnyomiOverlays({ repoRoot: tmpDir, targetLocales: ["en"] })).toThrow(/duplicate/i);
  });

  it("fails closed on overlay spreads at the first level", () => {
    writeKanjiOnyomiFixtures(
      SRC(KANJI("安")),
      OVERLAY(`${ENTRY("安", PAIRS)}, ...extra`)
    );
    expect(() => auditKanjiOnyomiOverlays({ repoRoot: tmpDir, targetLocales: ["en"] })).toThrow(/spread/i);
  });

  it("fails closed on computed first-level overlay keys", () => {
    writeKanjiOnyomiFixtures(
      SRC(KANJI("安")),
      OVERLAY(`  [getKey()]: { ${PAIRS} }`)
    );
    expect(() => auditKanjiOnyomiOverlays({ repoRoot: tmpDir, targetLocales: ["en"] })).toThrow(/computed/i);
  });

  it("fails closed on dynamic / missing source kanji keys", () => {
    writeKanjiOnyomiFixtures(
      "type KanjiOnyomiEntry = { kanji: string; onyomi: string[]; kunyomi: string[]; meaningZh: string; level: string; };\n" +
        "export const kanjiOnyomi: KanjiOnyomiEntry[] = [{ kanji: DYNAMIC_KANJI, onyomi: [\"あん\"], kunyomi: [], meaningZh: \"安心\", level: \"N5\" }];",
      OVERLAY(ENTRY("安", PAIRS))
    );
    expect(() => auditKanjiOnyomiOverlays({ repoRoot: tmpDir, targetLocales: ["en"] })).toThrow(/kanji|static|literal/i);

    writeKanjiOnyomiFixtures(
      "type KanjiOnyomiEntry = { kanji: string; onyomi: string[]; kunyomi: string[]; meaningZh: string; level: string; };\n" +
        "export const kanjiOnyomi: KanjiOnyomiEntry[] = [{ onyomi: [\"あん\"], kunyomi: [], meaningZh: \"安心\", level: \"N5\" }];",
      OVERLAY(ENTRY("安", PAIRS))
    );
    expect(() => auditKanjiOnyomiOverlays({ repoRoot: tmpDir, targetLocales: ["en"] })).toThrow(/kanji/);
  });

  it("fails closed on computed member names in an entry instead of silently dropping them", () => {
    writeKanjiOnyomiFixtures(
      SRC(`  { kanji: "安", ["onyomi"]: ["あん"], kunyomi: [], meaningZh: "安心", level: "N5" }`),
      OVERLAY(ENTRY("安", PAIRS))
    );
    // A computed non-key member must not be silently treated as absent: that
    // would misclassify the entry and fabricate a phantom missing/dangling pair.
    expect(() => auditKanjiOnyomiOverlays({ repoRoot: tmpDir, targetLocales: ["en"] })).toThrow(/computed/i);
  });

  it("returns byte-equivalent records regardless of source or locale traversal order", () => {
    writeKanjiOnyomiFixtures(
      SRC([KANJI("安"), KANJI("医"), KANJI("員")].join(",\n")),
      OVERLAY(
        [
          ENTRY("員", PAIRS),
          ENTRY("安", PAIRS),
          ENTRY("医", PAIRS),
          ENTRY("雨", PAIRS)
        ].join(",\n")
      )
    );
    const a = JSON.stringify(
      auditKanjiOnyomiOverlays({ repoRoot: tmpDir, targetLocales: ["en", "ja"] })
    );
    const b = JSON.stringify(
      auditKanjiOnyomiOverlays({ repoRoot: tmpDir, targetLocales: ["ja", "en"] })
    );
    expect(a).toBe(b);
  });

  it("has no hardcoded locales, no filesystem writes, no console output and no process.exit", () => {
    writeKanjiOnyomiFixtures(
      SRC(KANJI("安")),
      OVERLAY(ENTRY("安", PAIRS))
    );
    const writeSpy = vi.spyOn(fs, "writeFileSync");
    const mkdirSpy = vi.spyOn(fs, "mkdirSync");
    const logSpy = vi.spyOn(console, "log");
    const errorSpy = vi.spyOn(console, "error");
    const exitSpy = vi.spyOn(process, "exit");
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    try {
      const records = auditKanjiOnyomiOverlays({ repoRoot: tmpDir, targetLocales: ["en", "ja"] });
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

  it("audits the real repo with zero records and without writing anything", () => {
    const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
    const writeSpy = vi.spyOn(fs, "writeFileSync");
    const mkdirSpy = vi.spyOn(fs, "mkdirSync");
    try {
      const records = auditKanjiOnyomiOverlays({ repoRoot, targetLocales: ["en", "ja"] });
      expect(records).toEqual([]);
      expect(writeSpy).not.toHaveBeenCalled();
      expect(mkdirSpy).not.toHaveBeenCalled();
    } finally {
      writeSpy.mockRestore();
      mkdirSpy.mockRestore();
    }
  });
});
