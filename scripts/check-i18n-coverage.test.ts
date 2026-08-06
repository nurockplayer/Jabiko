// scripts/check-i18n-coverage.test.ts
// TDD coverage for wiring the reusable overlay audit into the existing i18n
// coverage CLI (#699). Every case builds a temporary fixture repository and
// spawns the real CLI against it (JABIKO_I18N_REPO_ROOT points at the fixture),
// so these tests exercise the full parse-args -> scans -> adapters -> report ->
// exit-code path without touching the real repo.
import { describe, expect, it, afterEach } from "vitest";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPTS_DIR = path.dirname(fileURLToPath(import.meta.url));
const CLI_FILE = path.join(SCRIPTS_DIR, "check-i18n-coverage.mjs");

const ROOTS: string[] = [];

afterEach(() => {
  while (ROOTS.length > 0) {
    const root = ROOTS.pop();
    if (root) fs.rmSync(root, { recursive: true, force: true });
  }
});

interface RunResult {
  status: number | null;
  stdout: string;
  stderr: string;
}

function runCli(repoRoot: string, args: string[] = []): RunResult {
  const r = spawnSync(process.execPath, [CLI_FILE, ...args], {
    encoding: "utf8",
    cwd: repoRoot,
    env: { ...process.env, JABIKO_I18N_REPO_ROOT: repoRoot }
  });
  return { status: r.status, stdout: r.stdout ?? "", stderr: r.stderr ?? "" };
}

/** Create a temporary fixture repo. `createOrder` (when given) controls the
 *  filesystem traversal / creation order so tests can prove order-independence. */
function makeRepo(files: Record<string, string>, createOrder?: string[]): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "jabiko-check-i18n-"));
  ROOTS.push(root);
  const keys = createOrder ?? Object.keys(files);
  for (const rel of keys) {
    const content = files[rel];
    if (content === undefined) continue;
    const p = path.join(root, rel);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, content);
  }
  return root;
}

/** Snapshot every file under a repo root (contents only). */
function snapshotRepo(root: string): Record<string, string> {
  const out: Record<string, string> = {};
  const walk = (dir: string): void => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(p);
      else out[path.relative(root, p)] = fs.readFileSync(p, "utf8");
    }
  };
  walk(root);
  return out;
}

/** A minimal repository where every one of the five overlay systems is clean. */
const CLEAN_FILES: Record<string, string> = {
  "src/i18n.ts": 'export const LAUNCHED_LANGUAGES: readonly string[] = ["zh-Hant", "ja", "en"];\n',
  "src/locales/zh-Hant.ts": 'export const Copy = { title: "練習", greeting: "你好" };\n',
  "src/locales/en.ts": 'export const Copy = { title: "Practice", greeting: "Hello" };\n',
  "src/locales/ja.ts": 'export const Copy = { title: "練習", greeting: "こんにちは" };\n',
  "src/domain/exam/items/n1.ts": "export const n1Items: unknown[] = [];\n",
  "src/domain/exam/items/n2.ts": "export const n2Items: unknown[] = [];\n",
  "src/domain/exam/items/n3.ts": "export const n3Items: unknown[] = [];\n",
  "src/domain/exam/items/n4.ts": "export const n4Items: unknown[] = [];\n",
  "src/domain/exam/items/n5.ts": "export const n5Items: unknown[] = [];\n",
  "src/domain/learningBlocks.ts":
    'export const learningBlocks = [{ id: "intro", titleZh: "入門" }];\n',
  "src/domain/learningBlocks.i18n.ts":
    'export const learningBlockI18n = { intro: { en: "Intro", ja: "入門" } };\n',
  "src/domain/grammarNotes.ts":
    'export const grammarNotes = { note1: { surface: "は", meaningZh: "主題" } };\n',
  "src/domain/grammarNotes.i18n.ts":
    'export const grammarNoteI18n = { note1: { en: "topic", ja: "主題" } };\n',
  "src/domain/sentencePatterns.ts":
    'export const patterns: SentencePatternItem[] = [{ id: "sp1", hintZh: "h", promptContextZh: "p", explanation: "e" }];\n',
  "src/domain/sentencePatterns.i18n.ts":
    'export const sentencePatternI18n = { sp1: { en: "SP", ja: "SP" } };\n',
  "src/domain/kanjiOnyomi.ts":
    'export const kanjiOnyomi = [{ kanji: "日", meaningZh: "太陽" }];\n',
  "src/domain/kanjiOnyomi.i18n.ts":
    'export const kanjiMeaningI18n = { "日": { en: "sun", ja: "太陽" } };\n'
};

const EXAM_MISSING = [
  'import { examQuestion } from "../helpers";',
  "export const n1Items = [",
  '  examQuestion({ id: "n1-a", meaningZh: "走", hintZh: "提示" }),',
  "];"
].join("\n");

const EXAM_DANGLING = [
  'import { examQuestion } from "../helpers";',
  "export const n1Items = [",
  '  examQuestion({ id: "n1-z", meaningZh: "", hintZh: "", hintI18n: { en: "Hint", ja: "ヒント" } }),',
  "];"
].join("\n");

const EXAM_MIXED = [
  'import { examQuestion } from "../helpers";',
  "export const n1Items = [",
  '  examQuestion({ id: "n1-b", meaningZh: "吃", meaningI18n: { en: "Eat", ja: "食べる" } }),',
  '  examQuestion({ id: "n1-a", meaningZh: "走" }),',
  '  examQuestion({ id: "n1-z", meaningZh: "", hintZh: "", hintI18n: { en: "Hint", ja: "ヒント" } }),',
  "];"
].join("\n");

describe("overlay audit wired into the i18n CLI (#699)", () => {
  it("clean audit: human summary lists all five system counts and passed, exit 0", () => {
    const root = makeRepo(CLEAN_FILES);
    const r = runCli(root);
    expect(r.status).toBe(0);
    for (const system of [
      "exam",
      "learningBlocks",
      "grammarNotes",
      "sentencePatterns",
      "kanjiOnyomi"
    ]) {
      expect(r.stdout).toContain(`${system}: 0 record(s) (0 missing, 0 dangling)`);
    }
    expect(r.stdout).toContain("overlay audit passed");
  });

  it("missing only: full warning list in stable sort order, exit 0", () => {
    const root = makeRepo({ ...CLEAN_FILES, "src/domain/exam/items/n1.ts": EXAM_MISSING });
    const r = runCli(root);
    expect(r.status).toBe(0);
    expect(r.stdout).not.toContain("overlay audit passed");
    const warnings = r.stdout
      .split("\n")
      .filter((l) => l.includes("WARNING"))
      .map((l) => l.trim());
    // canonical sort: system -> locale -> sourceKey -> overlayKey -> status
    expect(warnings).toEqual([
      "WARNING [en] exam.n1-a.hintI18n  (overlay key missing)",
      "WARNING [en] exam.n1-a.meaningI18n  (overlay key missing)",
      "WARNING [ja] exam.n1-a.hintI18n  (overlay key missing)",
      "WARNING [ja] exam.n1-a.meaningI18n  (overlay key missing)"
    ]);
    // five system counts still rendered
    expect(r.stdout).toContain("exam: 4 record(s) (4 missing, 0 dangling)");
    expect(r.stdout).toContain("kanjiOnyomi: 0 record(s) (0 missing, 0 dangling)");
  });

  it("dangling only: full error list, exit 1", () => {
    const root = makeRepo({ ...CLEAN_FILES, "src/domain/exam/items/n1.ts": EXAM_DANGLING });
    const r = runCli(root);
    expect(r.status).toBe(1);
    const errors = r.stdout
      .split("\n")
      .filter((l) => l.includes("ERROR"))
      .map((l) => l.trim());
    expect(errors).toEqual([
      "ERROR [en] exam.n1-z.hintI18n  (no matching source)",
      "ERROR [ja] exam.n1-z.hintI18n  (no matching source)"
    ]);
    expect(r.stdout).toContain("exam: 2 record(s) (0 missing, 2 dangling)");
  });

  it("missing + dangling: both are fully listed, exit 1", () => {
    const root = makeRepo({ ...CLEAN_FILES, "src/domain/exam/items/n1.ts": EXAM_MIXED });
    const r = runCli(root);
    expect(r.status).toBe(1);
    const lines = r.stdout
      .split("\n")
      .filter((l) => l.includes("WARNING") || l.includes("ERROR"))
      .map((l) => l.trim());
    expect(lines).toEqual([
      "ERROR [en] exam.n1-z.hintI18n  (no matching source)",
      "WARNING [en] exam.n1-a.meaningI18n  (overlay key missing)",
      "ERROR [ja] exam.n1-z.hintI18n  (no matching source)",
      "WARNING [ja] exam.n1-a.meaningI18n  (overlay key missing)"
    ]);
  });

  it("malformed/dynamic AST: sanitized file-relative diagnostic, exit 1, never silent", () => {
    const malformed = { ...CLEAN_FILES };
    // overlay spread cannot be resolved statically -> deterministic AuditParseError
    malformed["src/domain/learningBlocks.i18n.ts"] =
      'export const learningBlockI18n = { ...baseOverlay };\n';
    const root = makeRepo(malformed);
    const r = runCli(root);
    expect(r.status).toBe(1);
    expect(r.stdout).toContain("overlay audit failure");
    expect(r.stdout).toContain("ERROR");
    // diagnostic is file-relative: the fixture path must NOT leak into output
    expect(r.stdout).toContain("src/domain/learningBlocks.i18n.ts");
    expect(r.stdout).not.toContain(root);
    expect(r.stdout).not.toContain("overlay audit passed");
  });

  it("--json prints only valid JSON (no human prose) and keeps exit semantics", () => {
    // clean repo: exit 0, parseable JSON, overlayAudit has exactly the fixed shape
    const cleanRoot = makeRepo(CLEAN_FILES);
    const clean = runCli(cleanRoot, ["--json"]);
    expect(clean.status).toBe(0);
    const cleanJson = JSON.parse(clean.stdout) as {
      overlayAudit: {
        records: unknown[];
        counts: { total: number; missing: number; dangling: number };
        hasMissing: boolean;
        hasDangling: boolean;
      };
    };
    expect(Object.keys(cleanJson.overlayAudit).sort()).toEqual([
      "counts",
      "hasDangling",
      "hasMissing",
      "records"
    ]);
    expect(cleanJson.overlayAudit.hasMissing).toBe(false);
    expect(cleanJson.overlayAudit.hasDangling).toBe(false);
    for (const prose of ["i18n coverage report", "overlay audit passed", "UI copy", "WARNING", "ERROR"]) {
      expect(clean.stdout).not.toContain(prose);
    }
    // dangling repo: still valid JSON on stdout, but exit 1
    const danglingRoot = makeRepo({
      ...CLEAN_FILES,
      "src/domain/exam/items/n1.ts": EXAM_DANGLING
    });
    const dangling = runCli(danglingRoot, ["--json"]);
    expect(dangling.status).toBe(1);
    const danglingJson = JSON.parse(dangling.stdout) as {
      overlayAudit: {
        records: Array<{ status: string }>;
        counts: { total: number; missing: number; dangling: number };
        hasMissing: boolean;
        hasDangling: boolean;
      };
    };
    expect(danglingJson.overlayAudit.hasDangling).toBe(true);
    expect(danglingJson.overlayAudit.counts.dangling).toBe(2);
    expect(
      danglingJson.overlayAudit.records.every((r) => r.status === "dangling")
    ).toBe(true);
  });

  it("--output writes a complete merged report with a trailing newline; stdout summary stays intact", () => {
    const root = makeRepo(CLEAN_FILES);
    const r = runCli(root, ["--output", "reports/out.json"]);
    expect(r.status).toBe(0);
    // stdout is still the human summary
    expect(r.stdout).toContain("i18n coverage report");
    expect(r.stdout).toContain("overlay audit passed");
    const filePath = path.join(root, "reports", "out.json");
    expect(fs.existsSync(filePath)).toBe(true);
    const raw = fs.readFileSync(filePath, "utf8");
    expect(raw.endsWith("\n")).toBe(true);
    const report = JSON.parse(raw) as {
      overlayAudit: { records: unknown[]; counts: unknown; hasMissing: boolean; hasDangling: boolean };
    };
    expect(Array.isArray(report.overlayAudit.records)).toBe(true);
    expect(typeof report.overlayAudit.hasMissing).toBe("boolean");
    expect(typeof report.overlayAudit.hasDangling).toBe("boolean");
    // parent dir was created
    expect(fs.statSync(filePath).isFile()).toBe(true);
  });

  it("different filesystem traversal order yields byte-equivalent records and human order", () => {
    const files = { ...CLEAN_FILES, "src/domain/exam/items/n1.ts": EXAM_MIXED };
    const orderA = Object.keys(files);
    const orderB = [...orderA].reverse();
    const rootA = makeRepo(files, orderA);
    const rootB = makeRepo(files, orderB);

    const jsonA = runCli(rootA, ["--json"]);
    const jsonB = runCli(rootB, ["--json"]);
    expect(jsonA.status).toBe(1);
    expect(jsonB.status).toBe(1);
    const a = JSON.parse(jsonA.stdout) as {
      overlayAudit: { records: unknown[]; counts: unknown };
    };
    const b = JSON.parse(jsonB.stdout) as {
      overlayAudit: { records: unknown[]; counts: unknown };
    };
    expect(a.overlayAudit.records).toEqual(b.overlayAudit.records);
    expect(a.overlayAudit.counts).toEqual(b.overlayAudit.counts);

    const humanA = runCli(rootA).stdout;
    const humanB = runCli(rootB).stdout;
    const sliceA = humanA.slice(humanA.indexOf("Overlay audit"));
    const sliceB = humanB.slice(humanB.indexOf("Overlay audit"));
    expect(sliceA).toBe(sliceB);
  });

  it("existing UI untranslated / ja-review / residual-review and Chinese-only counts still run", () => {
    const files = { ...CLEAN_FILES };
    // zh-Hant is the source; every key below carries Han so the UI scan runs.
    files["src/locales/zh-Hant.ts"] =
      'export const Copy = { title: "練習", greeting: "你好", author: "花雪", term: "日語" };\n';
    files["src/locales/en.ts"] =
      'export const Copy = { title: "Practice", greeting: "Hello", author: "花雪", term: "日本語" };\n';
    files["src/locales/ja.ts"] =
      'export const Copy = { title: "練習", greeting: "こんにちは", author: "花雪", grammar: "文法" };\n';
    const root = makeRepo(files);
    const r = runCli(root);
    expect(r.status).toBe(0);
    // reliable untranslated: en.author == zh-Hant source with Han -> 1
    expect(r.stdout).toContain("1 reliable untranslated value(s)");
    // ja-review: ja.title + ja.author equal source -> 2
    expect(r.stdout).toContain("2 ja value(s) equal to source");
    // residual: Han in en (Latin-script), different from source -> 1 (term)
    expect(r.stdout).toContain("1 Han-in-Latin/Thai value(s)");
    // content localisation gap block still present (exam items dir exists)
    expect(r.stdout).toContain("Content localisation gap");
    expect(r.stdout).toContain("exam items: 0");
    expect(r.stdout).toContain("overlay audit passed");
  });

  it("overlay values that happen to contain key text are never misread (CLI only consumes adapter records)", () => {
    const files = { ...CLEAN_FILES };
    files["src/domain/learningBlocks.ts"] =
      'export const learningBlocks = [{ id: "intro", titleZh: "入門" }, { id: "basic", titleZh: "基礎" }];\n';
    files["src/domain/learningBlocks.i18n.ts"] =
      'export const learningBlockI18n = { intro: { en: "intro is the key", ja: "intro" }, basic: { en: "basic", ja: "basic" } };\n';
    const root = makeRepo(files);
    const r = runCli(root);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("overlay audit passed");
    expect(r.stdout).not.toContain("WARNING");
    expect(r.stdout).not.toContain("ERROR");
  });

  it("unknown arg exits 2; --help exits 0", () => {
    const root = makeRepo(CLEAN_FILES);
    const bad = runCli(root, ["--bogus"]);
    expect(bad.status).toBe(2);
    expect(bad.stderr).toContain("unknown arg");
    const help = runCli(root, ["--help"]);
    expect(help.status).toBe(0);
    expect(help.stdout).toContain("Usage");
  });

  it("zero repository writes, zero network / Gemini access", () => {
    const root = makeRepo(CLEAN_FILES);
    const before = snapshotRepo(root);
    const r = runCli(root);
    expect(r.status).toBe(0);
    expect(snapshotRepo(root)).toEqual(before);
    const src = fs.readFileSync(CLI_FILE, "utf8");
    // no HTTP/fetch/child-process escape hatch that could reach a network or a
    // model API, and no Gemini import anywhere
    expect(src).not.toMatch(/fetch\s*\(/);
    expect(src).not.toMatch(/node:http|node:https|https?\.get|XMLHttpRequest/i);
    expect(src.toLowerCase()).not.toContain("gemini");
    // fixtures did not grow a report file
    expect(fs.existsSync(path.join(root, "reports"))).toBe(false);
  });
});
