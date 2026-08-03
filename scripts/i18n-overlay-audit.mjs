// =============================================================================
// i18n-overlay-audit.mjs -- reusable TypeScript-AST overlay audit core (#695)
// =============================================================================
//
// This module is the CORE of the #422 overlay audit pipeline. It deliberately
// knows NOTHING about Jabiko content file paths or field mappings: content
// adapters are pure functions injected via `runOverlayAdapters`, and each one
// returns `OverlayAuditRecord[]` for a single system+locale by supplying the
// source key set and the overlay key set.
//
// Design rules (from the issue):
//   - Parsing uses the repo's `typescript` compiler API. Regex is NEVER used to
//     parse nested TypeScript object shapes.
//   - The locale registry is parsed from `src/i18n.ts`'s `LAUNCHED_LANGUAGES`
//     array literal at runtime. There is deliberately NO second hardcoded
//     locale list in this module.
//   - Any shape that cannot be statically resolved (computed key, spread,
//     dynamic call, template interpolation, ...) THROWS a deterministic error
//     carrying file / line / context. Nothing is silently skipped.
//   - The core performs zero filesystem writes, console output, network access
//     and never calls process.exit. Reports are returned, not emitted.
//   - No Date.* / runtime imports: everything is deterministic.
// =============================================================================

import ts from "typescript";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** One audit finding: a source key missing from an overlay, or an overlay key
 *  with no matching source key. Sorted deterministically by the report layer. */
// NOTE: this module is plain .mjs -- the contract types are documented here and
// mirrored in the issue; the actual records are plain JS objects at runtime.
//
// OverlayAuditRecord = {
//   system: "exam" | "learningBlocks" | "grammarNotes" | "sentencePatterns" |
//           "kanjiOnyomi";
//   locale: string;
//   sourceKey: string;   // "" for dangling
//   overlayKey: string;  // "" for missing
//   status: "missing" | "dangling";
// }

const OVERLAY_SYSTEMS = [
  "exam",
  "learningBlocks",
  "grammarNotes",
  "sentencePatterns",
  "kanjiOnyomi"
];

// ---------------------------------------------------------------------------
// Deterministic error type
// ---------------------------------------------------------------------------

/** Error thrown when the AST audit meets a shape it cannot statically resolve.
 *  Carries file / line / context so the report can stay deterministic without
 *  dumping raw source text into the payload. */
export class AuditParseError extends Error {
  /** @type {string} */
  file;
  /** @type {number | null} */
  line;
  /** @type {string} */
  context;

  constructor(message, { file, line, context } = {}) {
    super(message);
    this.name = "AuditParseError";
    this.file = file ?? "";
    this.line = Number.isInteger(line) ? line : null;
    this.context = context ?? "";
  }
}

// ---------------------------------------------------------------------------
// Source file parsing
// ---------------------------------------------------------------------------

/** Parse a TypeScript file into a ts.SourceFile carrying its real path. */
export function parseTypeScriptFile(filePath) {
  const text = ts.sys.readFile(filePath);
  if (text === undefined) {
    throw new AuditParseError(`unable to read TypeScript file: ${filePath}`, { file: filePath });
  }
  return ts.createSourceFile(filePath, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
}

/** Fall back to a SourceFile from raw text (used in tests / dry-runs where the
 *  file may not exist on disk). */
export function parseTypeScriptSource(text, fileName = "inline.ts") {
  return ts.createSourceFile(fileName, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
}

// ---------------------------------------------------------------------------
// Locale registry parsing (src/i18n.ts)
// ---------------------------------------------------------------------------

/**
 * Resolve the launched-locale registry from a SourceFile. The registry is the
 * array literal of `LAUNCHED_LANGUAGES` in src/i18n.ts -- the single source of
 * truth. `sourceLocale` is fixed to the zh-Hant source; `targetLocales` keeps
 * the remaining entries in source order.
 *
 * A missing / non-array-literal registry fails closed (no second hardcoded
 * locale list is ever consulted).
 */
export function parseLaunchedLocales(sourceFile) {
  const sourceLocale = "zh-Hant";
  const targetLocales = [];

  let found = false;
  const visit = (node) => {
    if (
      !found &&
      ts.isVariableStatement(node) &&
      ts.isVariableDeclarationList(node.declarationList) &&
      node.declarationList.declarations.some(
        (d) => ts.isIdentifier(d.name) && d.name.text === "LAUNCHED_LANGUAGES"
      )
    ) {
      for (const d of node.declarationList.declarations) {
        if (!ts.isIdentifier(d.name) || d.name.text !== "LAUNCHED_LANGUAGES") continue;
        const init = d.initializer;
        if (!ts.isArrayLiteralExpression(init)) {
          throw new AuditParseError(
            "LAUNCHED_LANGUAGES must be an array literal so the audit can resolve locales statically",
            { file: sourceFile.fileName, line: getLine(sourceFile, d) }
          );
        }
        for (const element of init.elements) {
          const locale = staticStringValue(element, sourceFile, "LAUNCHED_LANGUAGES element");
          if (locale !== sourceLocale) targetLocales.push(locale);
        }
        found = true;
        break;
      }
    }
    if (!found) ts.forEachChild(node, visit);
  };
  visit(sourceFile);

  if (!found) {
    throw new AuditParseError(
      "LAUNCHED_LANGUAGES registry not found; cannot resolve the launched locale set",
      { file: sourceFile.fileName }
    );
  }

  return { sourceLocale, targetLocales };
}

// ---------------------------------------------------------------------------
// Static key resolution
// ---------------------------------------------------------------------------

/** Read a static property-name node (identifier, quoted string, number, or a
 *  no-substitution template literal) into its literal text. Computed names and
 *  template interpolations throw a deterministic AuditParseError. */
export function readStaticPropertyName(node, sourceFile = undefined) {
  if (ts.isIdentifier(node) || ts.isPrivateIdentifier(node)) return node.text;
  if (ts.isStringLiteral(node) || ts.isNumericLiteral(node)) return node.text;
  if (ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isComputedPropertyName(node)) {
    throw new AuditParseError(
      `computed property name cannot be resolved statically: ${node.getText()}`,
      { file: sourceFile?.fileName, line: getLine(sourceFile, node), context: node.getText() }
    );
  }
  throw new AuditParseError(
    `unsupported property-name node kind ${ts.SyntaxKind[node.kind]} (${node.getText()})`,
    { file: sourceFile?.fileName, line: getLine(sourceFile, node), context: node.getText() }
  );
}

/** Resolve a string literal that must hold a static string value (used for
 *  registry entries). Throws on anything that cannot be statically resolved. */
function staticStringValue(node, sourceFile, what) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  throw new AuditParseError(
    `${what} must be a static string literal: ${node.getText()}`,
    { file: sourceFile.fileName, line: getLine(sourceFile, node), context: node.getText() }
  );
}

/**
 * Collect the static property keys of an object literal into a flat array, in
 * declaration order. Only identifier / quoted / numeric / no-substitution
 * template keys are accepted; computed keys, spreads and any other member kind
 * THROW (fail closed, no silent skipping).
 *
 * `context` is passed through (adapter context) but unused by the core so that
 * signature stays stable; the caller selects which node to audit, so nested
 * objects are NOT flattened and same-name keys at different depths never mix.
 */
export function collectStaticObjectKeys(node, context) {
  const sf = node.getSourceFile?.();
  void context; // adapter context is part of the contract signature; core is context-agnostic
  if (!ts.isObjectLiteralExpression(node)) {
    throw new AuditParseError(
      `collectStaticObjectKeys expected an ObjectLiteralExpression, got ${ts.SyntaxKind[node.kind]}`,
      { file: sf?.fileName, line: getLine(sf, node) }
    );
  }
  const keys = [];
  for (const member of node.properties) {
    if (ts.isPropertyAssignment(member)) {
      keys.push(readStaticPropertyName(member.name, sf));
      continue;
    }
    if (ts.isShorthandPropertyAssignment(member)) {
      keys.push(readStaticPropertyName(member.name, sf));
      continue;
    }
    if (ts.isSpreadAssignment(member)) {
      throw new AuditParseError(
        `object spread cannot be resolved statically: ${member.getText()}`,
        { file: sf?.fileName, line: getLine(sf, member), context: member.getText() }
      );
    }
    if (ts.isMethodDeclaration(member)) {
      keys.push(readStaticPropertyName(member.name, sf));
      continue;
    }
    if (ts.isGetAccessorDeclaration(member) || ts.isSetAccessorDeclaration(member)) {
      keys.push(readStaticPropertyName(member.name, sf));
      continue;
    }
    throw new AuditParseError(
      `unsupported object member kind ${ts.SyntaxKind[member.kind]}: ${member.getText()}`,
      { file: sf?.fileName, line: getLine(sf, member), context: member.getText() }
    );
  }
  return keys;
}

// ---------------------------------------------------------------------------
// Key-set comparison
// ---------------------------------------------------------------------------

/**
 * Compare a source key set against an overlay key set for one system+locale.
 *   - source key missing from overlay  -> { status: "missing" }
 *   - overlay key absent from source   -> { status: "dangling" }
 *
 * Duplicate keys are rejected deterministically (never silently deduped).
 * Explicit invalid options fail closed instead of guessing.
 */
export function auditKeySets({ system, locale, sourceKeys, overlayKeys }) {
  if (!OVERLAY_SYSTEMS.includes(system)) {
    throw new Error(`unknown overlay system: ${system}`);
  }
  if (typeof locale !== "string" || locale.length === 0) {
    throw new Error("audit locale must be a non-empty string");
  }
  if (!Array.isArray(sourceKeys) || !sourceKeys.every((k) => typeof k === "string")) {
    throw new Error("sourceKeys must be an array of strings");
  }
  if (!Array.isArray(overlayKeys) || !overlayKeys.every((k) => typeof k === "string")) {
    throw new Error("overlayKeys must be an array of strings");
  }

  const sourceSet = new Set();
  for (let i = 0; i < sourceKeys.length; i++) {
    if (sourceSet.has(sourceKeys[i])) {
      throw new Error(`duplicate source key "${sourceKeys[i]}" at index ${i}`);
    }
    sourceSet.add(sourceKeys[i]);
  }

  const overlaySet = new Set();
  for (let i = 0; i < overlayKeys.length; i++) {
    if (overlaySet.has(overlayKeys[i])) {
      throw new Error(`duplicate overlay key "${overlayKeys[i]}" at index ${i}`);
    }
    overlaySet.add(overlayKeys[i]);
  }

  // Emit dangling (overlay-only) records first: they carry sourceKey "" which
  // sorts ahead of any missing record's non-empty sourceKey, so this matches the
  // canonical report ordering (system -> locale -> sourceKey -> overlayKey).
  const records = [];
  for (const overlayKey of overlayKeys) {
    if (!sourceSet.has(overlayKey)) {
      records.push({ system, locale, sourceKey: "", overlayKey, status: "dangling" });
    }
  }
  for (const sourceKey of sourceKeys) {
    if (!overlaySet.has(sourceKey)) {
      records.push({ system, locale, sourceKey, overlayKey: "", status: "missing" });
    }
  }
  return records;
}

// ---------------------------------------------------------------------------
// Sorting
// ---------------------------------------------------------------------------

const STATUS_RANK = { missing: 0, dangling: 1 };
const SYSTEM_RANK = Object.fromEntries(OVERLAY_SYSTEMS.map((s, i) => [s, i]));

/**
 * Sort records deterministically by
 *   system -> locale -> sourceKey -> overlayKey -> status
 * (not by filesystem or object-traversal order). The input array is NOT
 * mutated.
 */
export function sortAuditRecords(records) {
  return [...records].sort((a, b) => {
    const sysA = SYSTEM_RANK[a.system] ?? Number.MAX_SAFE_INTEGER;
    const sysB = SYSTEM_RANK[b.system] ?? Number.MAX_SAFE_INTEGER;
    if (sysA !== sysB) return sysA - sysB;
    if (a.locale !== b.locale) return a.locale < b.locale ? -1 : 1;
    if (a.sourceKey !== b.sourceKey) return a.sourceKey < b.sourceKey ? -1 : 1;
    if (a.overlayKey !== b.overlayKey) return a.overlayKey < b.overlayKey ? -1 : 1;
    return (STATUS_RANK[a.status] ?? 0) - (STATUS_RANK[b.status] ?? 0);
  });
}

// ---------------------------------------------------------------------------
// Report assembly
// ---------------------------------------------------------------------------

function makeEmptyCounts() {
  return { total: 0, missing: 0, dangling: 0 };
}

function countRecord(counts, record) {
  counts.total += 1;
  if (record.status === "missing") counts.missing += 1;
  else if (record.status === "dangling") counts.dangling += 1;
}

/** Cap the error-context excerpt so a report never dumps unbounded source text. */
function boundedContext(text) {
  if (text.length <= 200) return text;
  return text.slice(0, 197) + "...";
}

/**
 * Run a set of pure adapter functions (each returning OverlayAuditRecord[])
 * over a shared context and assemble a sorted report with:
 *   - records: sorted by system -> locale -> sourceKey -> overlayKey -> status
 *   - counts: per-system and per-locale { total, missing, dangling }
 *   - diagnostics: parse failures captured as { file, line, message, context }
 *
 * Adapter errors never abort the run: they are captured into diagnostics so the
 * report stays complete and deterministic. Nothing is written, logged or exited.
 */
export function runOverlayAdapters(adapters, context) {
  const records = [];
  const counts = { bySystem: {}, byLocale: {} };
  const diagnostics = [];

  for (const adapter of adapters) {
    let adapterRecords;
    try {
      adapterRecords = adapter(context);
    } catch (e) {
      if (e instanceof AuditParseError) {
        diagnostics.push({
          file: e.file,
          line: e.line,
          message: e.message,
          context: boundedContext(e.context)
        });
        continue;
      }
      diagnostics.push({
        file: typeof e?.file === "string" ? e.file : "",
        line: Number.isInteger(e?.line) ? e.line : null,
        message: e instanceof Error ? e.message : String(e),
        context: boundedContext(typeof e?.context === "string" ? e.context : "")
      });
      continue;
    }
    if (!Array.isArray(adapterRecords)) {
      diagnostics.push({
        file: "",
        line: null,
        message: "adapter must return an array of overlay audit records",
        context: ""
      });
      continue;
    }
    for (const record of adapterRecords) {
      records.push(record);
      const systemCounts = (counts.bySystem[record.system] ??= makeEmptyCounts());
      countRecord(systemCounts, record);
      const localeCounts = (counts.byLocale[record.locale] ??= makeEmptyCounts());
      countRecord(localeCounts, record);
    }
  }

  return {
    records: sortAuditRecords(records),
    counts: {
      // Sort keys so the serialized report is byte-equivalent regardless of the
      // order adapters ran in.
      bySystem: sortedObject(counts.bySystem),
      byLocale: sortedObject(counts.byLocale)
    },
    diagnostics
  };
}

/** Rebuild an object with its keys sorted so JSON serialization is stable. */
function sortedObject(obj) {
  return Object.fromEntries(Object.entries(obj).sort(([a], [b]) => (a < b ? -1 : 1)));
}

// ---------------------------------------------------------------------------
// Line-number helper
// ---------------------------------------------------------------------------

/** 1-based line of a node, or null when no source file / line break is known. */
function getLine(sourceFile, node) {
  if (!sourceFile || !ts.isSourceFile(sourceFile)) return null;
  const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
  return line + 1;
}
