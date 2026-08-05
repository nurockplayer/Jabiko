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

// ---------------------------------------------------------------------------
// Exam overlay adapter (#696)
// ---------------------------------------------------------------------------
//
// Audits the six source/overlay field pairs of every `examQuestion({ ... })`
// literal call in the five fixed exam item files, per item and per target
// locale. It deliberately knows ONLY the exam shape: any other function or
// object form is ignored, and any shape that cannot be statically resolved
// (computed key, spread, dynamic value, duplicate id / field / locale key)
// throws a deterministic AuditParseError instead of guessing.
//
// Canonical key format: `<item-id>.<overlay-field>` (e.g. `n3-foo.hintI18n`).

/** The only source -> overlay field pairs the exam adapter audits. */
const EXAM_OVERLAY_PAIRS = [
  ["meaningZh", "meaningI18n"],
  ["instructionZh", "instructionI18n"],
  ["promptContextZh", "promptContextI18n"],
  ["hintZh", "hintI18n"],
  ["exampleMeaningZh", "exampleMeaningI18n"],
  ["explanation", "explanationI18n"]
];

/** Fixed scan set for the exam adapter (issue #696). */
const EXAM_ITEM_FILES = ["n1.ts", "n2.ts", "n3.ts", "n4.ts", "n5.ts"];

/**
 * Collect the direct members of an object literal into a name -> member map,
 * failing closed on spreads, computed names and duplicate member names.
 * Getter/setter/method members keep their static names so the caller can
 * reject them when a value is required to be plain text.
 */
function collectItemMembers(node, sourceFile) {
  const sf = sourceFile ?? node.getSourceFile?.();
  if (!ts.isObjectLiteralExpression(node)) {
    throw new AuditParseError(
      `expected an object literal for examQuestion arguments, got ${ts.SyntaxKind[node.kind]}`,
      { file: sf?.fileName, line: getLine(sf, node), context: node.getText() }
    );
  }
  const members = new Map();
  for (const member of node.properties) {
    if (ts.isSpreadAssignment(member)) {
      throw new AuditParseError(
        `object spread cannot be resolved statically: ${member.getText()}`,
        { file: sf?.fileName, line: getLine(sf, member), context: member.getText() }
      );
    }
    const name = readStaticPropertyName(member.name, sf);
    if (members.has(name)) {
      throw new AuditParseError(
        `duplicate field "${name}" in examQuestion item`,
        { file: sf?.fileName, line: getLine(sf, member), context: member.getText() }
      );
    }
    members.set(name, member);
  }
  return members;
}

/** True when a value node is a plain static string (incl. no-substitution
 *  template literals). Numeric literals are accepted for overlay content. */
function isStaticString(node) {
  return (
    ts.isStringLiteral(node) ||
    ts.isNoSubstitutionTemplateLiteral(node) ||
    ts.isNumericLiteral(node)
  );
}

/**
 * Audit the exam item files under `repoRoot/src/domain/exam/items/` and return
 * the overlay audit records (system "exam") for every `examQuestion({ ... })`
 * literal call, per item and per target locale.
 *
 *   - A non-empty source field requires the overlay to carry every target
 *     locale -> missing record otherwise.
 *   - An absent or authored-empty source field requires nothing; any overlay
 *     locale key that still exists is reported as dangling.
 *   - Non-target locale keys are shape-checked but never reported.
 *   - item ids must be non-empty static string literals; duplicates fail closed.
 *   - Spreads, computed keys, dynamic values, duplicate fields and duplicate
 *     locale keys fail closed with a deterministic AuditParseError.
 *
 * Returns records sorted by the canonical `sortAuditRecords` order. Performs
 * zero filesystem writes, console output, network access and never calls
 * process.exit.
 */
export function auditExamOverlays({ repoRoot, targetLocales }) {
  if (typeof repoRoot !== "string" || repoRoot.length === 0) {
    throw new Error("auditExamOverlays requires a non-empty repoRoot directory");
  }
  if (
    !Array.isArray(targetLocales) ||
    !targetLocales.every((l) => typeof l === "string" && l.length > 0)
  ) {
    throw new Error("auditExamOverlays requires targetLocales to be an array of locale strings");
  }
  const locales = [...new Set(targetLocales)];

  const records = [];
  const seenItemIds = new Set();

  for (const fileName of EXAM_ITEM_FILES) {
    const filePath = `${repoRoot}/src/domain/exam/items/${fileName}`;
    const sourceFile = parseTypeScriptFile(filePath);

    const visit = (node) => {
      if (
        ts.isCallExpression(node) &&
        ts.isIdentifier(node.expression) &&
        node.expression.text === "examQuestion"
      ) {
        const itemObject = node.arguments[0];
        if (!ts.isObjectLiteralExpression(itemObject)) {
          throw new AuditParseError(
            "examQuestion must be called with an object literal",
            { file: filePath, line: getLine(sourceFile, node), context: node.getText() }
          );
        }
        const members = collectItemMembers(itemObject, sourceFile);

        // --- item id: non-empty static string literal ---------------------
        const idMember = members.get("id");
        if (!idMember || !ts.isPropertyAssignment(idMember)) {
          throw new AuditParseError(
            "exam item is missing a static string id",
            { file: filePath, line: getLine(sourceFile, idMember ?? node) }
          );
        }
        const idInit = idMember.initializer;
        if (!ts.isStringLiteral(idInit) && !ts.isNoSubstitutionTemplateLiteral(idInit)) {
          throw new AuditParseError(
            `exam item id must be a static string literal: ${idInit.getText(sourceFile)}`,
            { file: filePath, line: getLine(sourceFile, idMember), context: idInit.getText(sourceFile) }
          );
        }
        const itemId = idInit.text;
        if (itemId.trim().length === 0) {
          throw new AuditParseError(
            "exam item id must be a non-empty string literal",
            { file: filePath, line: getLine(sourceFile, idMember) }
          );
        }
        if (seenItemIds.has(itemId)) {
          throw new AuditParseError(
            `duplicate exam item id "${itemId}"`,
            { file: filePath, line: getLine(sourceFile, idMember), context: itemId }
          );
        }
        seenItemIds.add(itemId);

        // --- six source/overlay pairs -------------------------------------
        for (const [sourceField, overlayField] of EXAM_OVERLAY_PAIRS) {
          const sourceMember = members.get(sourceField);
          const overlayMember = members.get(overlayField);

          // Source value: static string; absent stays null, "" means authored-empty.
          let sourceText = null;
          if (sourceMember) {
            if (!ts.isPropertyAssignment(sourceMember)) {
              throw new AuditParseError(
                `${sourceField} must be a static string literal`,
                { file: filePath, line: getLine(sourceFile, sourceMember) }
              );
            }
            const sourceInit = sourceMember.initializer;
            if (
              !ts.isStringLiteral(sourceInit) &&
              !ts.isNoSubstitutionTemplateLiteral(sourceInit)
            ) {
              throw new AuditParseError(
                `${sourceField} must be a static string literal: ${sourceInit.getText(sourceFile)}`,
                { file: filePath, line: getLine(sourceFile, sourceMember), context: sourceInit.getText(sourceFile) }
              );
            }
            sourceText = sourceInit.text;
          }

          // Overlay value: an object literal of static locale -> static content.
          let overlayLocales = null; // null = overlay field absent
          if (overlayMember) {
            if (!ts.isPropertyAssignment(overlayMember)) {
              throw new AuditParseError(
                `${overlayField} must be an object literal mapping locales to text`,
                { file: filePath, line: getLine(sourceFile, overlayMember) }
              );
            }
            const overlayInit = overlayMember.initializer;
            if (!ts.isObjectLiteralExpression(overlayInit)) {
              throw new AuditParseError(
                `${overlayField} must be an object literal mapping locales to text`,
                { file: filePath, line: getLine(sourceFile, overlayMember), context: overlayInit.getText(sourceFile) }
              );
            }
            overlayLocales = new Map();
            for (const localeMember of overlayInit.properties) {
              if (ts.isSpreadAssignment(localeMember)) {
                throw new AuditParseError(
                  `object spread cannot be resolved statically in overlay: ${localeMember.getText(sourceFile)}`,
                  { file: filePath, line: getLine(sourceFile, localeMember), context: localeMember.getText(sourceFile) }
                );
              }
              if (!ts.isPropertyAssignment(localeMember)) {
                throw new AuditParseError(
                  `overlay locale entries must be static property assignments: ${localeMember.getText(sourceFile)}`,
                  { file: filePath, line: getLine(sourceFile, localeMember), context: localeMember.getText(sourceFile) }
                );
              }
              const locale = readStaticPropertyName(localeMember.name, sourceFile);
              if (overlayLocales.has(locale)) {
                throw new AuditParseError(
                  `duplicate overlay locale key "${locale}" for ${itemId}.${overlayField}`,
                  { file: filePath, line: getLine(sourceFile, localeMember), context: locale }
                );
              }
              if (!isStaticString(localeMember.initializer)) {
                throw new AuditParseError(
                  `${overlayField}["${locale}"] must be a static string/content value`,
                  { file: filePath, line: getLine(sourceFile, localeMember), context: localeMember.initializer.getText(sourceFile) }
                );
              }
              overlayLocales.set(locale, localeMember);
            }
          }

          const active = sourceText !== null && sourceText !== "";
          if (active) {
            for (const locale of locales) {
              if (!overlayLocales || !overlayLocales.has(locale)) {
                records.push({
                  system: "exam",
                  locale,
                  sourceKey: `${itemId}.${overlayField}`,
                  overlayKey: "",
                  status: "missing"
                });
              }
            }
          } else if (overlayLocales) {
            for (const locale of overlayLocales.keys()) {
              records.push({
                system: "exam",
                locale,
                sourceKey: "",
                overlayKey: `${itemId}.${overlayField}`,
                status: "dangling"
              });
            }
          }
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(sourceFile);
  }

  return sortAuditRecords(records);
}

// ---------------------------------------------------------------------------
// Learning-block overlay adapter (#697)
// ---------------------------------------------------------------------------
//
// Audits the "source stable block id <-> overlay first-level key" mapping for
// the learning-blocks system.
//
//   source:  src/domain/learningBlocks.ts    (the `learningBlocks` array)
//   overlay: src/domain/learningBlocks.i18n.ts (the `learningBlockI18n` record)
//   key:     the stable id of a real learner-facing block
//
// The source side only admits actual learner-facing block elements of the
// `learningBlocks` array literal; section/container/helper objects and stray
// `id` fields elsewhere in the file are never counted. The overlay side only
// admits first-level keys of the `learningBlockI18n` object literal; nested
// field keys (category / title / explanation / notes / pitfalls / drillNote)
// are never flattened.
//
// For each target locale (resolved by #695's launched-locale registry, never
// hardcoded) the overlay is expected to carry a first-level key for EVERY
// source block id. source-without-overlay = missing; overlay-without-source =
// dangling. A block whose overlay entry omits one locale produces a missing
// record for that locale only.
//
// Fails closed on duplicate source ids / duplicate overlay keys, spreads,
// computed keys and any dynamic form whose runtime key mapping cannot be
// confirmed. Performs zero filesystem writes, console output, network access
// and never calls process.exit.

/**
 * Resolve the `learningBlocks` array literal from a SourceFile. Returns the
 * array node when present (identifier `learningBlocks`), otherwise undefined.
 */
function findLearningBlocksArray(sourceFile) {
  let found = undefined;
  const visit = (node) => {
    if (
      found === undefined &&
      ts.isVariableStatement(node) &&
      ts.isVariableDeclarationList(node.declarationList)
    ) {
      for (const d of node.declarationList.declarations) {
        if (!ts.isIdentifier(d.name) || d.name.text !== "learningBlocks") continue;
        if (ts.isArrayLiteralExpression(d.initializer)) found = d.initializer;
        break;
      }
    }
    if (found === undefined) ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return found;
}

/**
 * Resolve the `learningBlockI18n` object literal from a SourceFile. Returns the
 * object node when present (identifier `learningBlockI18n`), otherwise
 * undefined.
 */
function findLearningBlockOverlay(sourceFile) {
  let found = undefined;
  const visit = (node) => {
    if (
      found === undefined &&
      ts.isVariableStatement(node) &&
      ts.isVariableDeclarationList(node.declarationList)
    ) {
      for (const d of node.declarationList.declarations) {
        if (!ts.isIdentifier(d.name) || d.name.text !== "learningBlockI18n") continue;
        if (ts.isObjectLiteralExpression(d.initializer)) found = d.initializer;
        break;
      }
    }
    if (found === undefined) ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return found;
}

/**
 * Read the static `id` from a learner-facing block object literal. The id must
 * be a non-empty static string literal; anything else (computed / dynamic
 * value) fails closed because the runtime key mapping cannot be confirmed.
 */
function readBlockId(blockNode, sourceFile, filePath) {
  const sf = sourceFile ?? blockNode.getSourceFile?.();
  const file = filePath ?? sf?.fileName;
  if (!ts.isObjectLiteralExpression(blockNode)) {
    throw new AuditParseError(
      `learning block element must be an object literal, got ${ts.SyntaxKind[blockNode.kind]}`,
      { file, line: getLine(sf, blockNode), context: blockNode.getText() }
    );
  }
  let idMember = undefined;
  for (const member of blockNode.properties) {
    if (ts.isPropertyAssignment(member) && ts.isIdentifier(member.name) && member.name.text === "id") {
      idMember = member;
      break;
    }
  }
  if (!idMember) {
    throw new AuditParseError("learning block is missing a static string id", {
      file,
      line: getLine(sf, blockNode)
    });
  }
  const init = idMember.initializer;
  if (!ts.isStringLiteral(init) && !ts.isNoSubstitutionTemplateLiteral(init)) {
    throw new AuditParseError(
      `learning block id must be a static string literal: ${init.getText(sf)}`,
      { file, line: getLine(sf, idMember), context: init.getText(sf) }
    );
  }
  const id = init.text;
  if (id.trim().length === 0) {
    throw new AuditParseError("learning block id must be a non-empty string literal", {
      file,
      line: getLine(sf, idMember)
    });
  }
  return id;
}

/**
 * Collect the first-level overlay blocks of the `learningBlockI18n` object into
 * a Map<blockId, localeKeys>, in declaration order. Each block entry must be an
 * object literal mapping locales to text; its locale keys are read statically.
 * Computed keys, spreads, non-property members and non-object entry values fail
 * closed (their runtime key mapping cannot be confirmed).
 */
function collectOverlayBlockEntries(overlayNode, sourceFile, filePath) {
  const sf = sourceFile ?? overlayNode.getSourceFile?.();
  const file = filePath ?? sf?.fileName;
  if (!ts.isObjectLiteralExpression(overlayNode)) {
    throw new AuditParseError(
      `learningBlockI18n must be an object literal, got ${ts.SyntaxKind[overlayNode.kind]}`,
      { file, line: getLine(sf, overlayNode) }
    );
  }
  const entries = new Map();
  for (const member of overlayNode.properties) {
    if (ts.isSpreadAssignment(member)) {
      throw new AuditParseError(
        `object spread cannot be resolved statically: ${member.getText()}`,
        { file, line: getLine(sf, member), context: member.getText() }
      );
    }
    if (!ts.isPropertyAssignment(member)) {
      throw new AuditParseError(
        `overlay block entries must be static property assignments: ${member.getText()}`,
        { file, line: getLine(sf, member), context: member.getText() }
      );
    }
    const blockId = readStaticPropertyName(member.name, sf);
    if (entries.has(blockId)) {
      throw new AuditParseError(`duplicate overlay block key "${blockId}"`, {
        file,
        line: getLine(sf, member),
        context: blockId
      });
    }
    const localeObject = member.initializer;
    if (!ts.isObjectLiteralExpression(localeObject)) {
      throw new AuditParseError(
        `overlay entry "${blockId}" must be an object literal mapping locales to text`,
        { file, line: getLine(sf, member), context: blockId }
      );
    }
    const localeKeys = [];
    const seenLocales = new Set();
    for (const localeMember of localeObject.properties) {
      if (ts.isSpreadAssignment(localeMember)) {
        throw new AuditParseError(
          `object spread cannot be resolved statically in overlay entry "${blockId}"`,
          { file, line: getLine(sf, localeMember), context: localeMember.getText() }
        );
      }
      if (!ts.isPropertyAssignment(localeMember)) {
        throw new AuditParseError(
          `overlay locale entries must be static property assignments: ${localeMember.getText()}`,
          { file, line: getLine(sf, localeMember), context: localeMember.getText() }
        );
      }
      const locale = readStaticPropertyName(localeMember.name, sf);
      if (seenLocales.has(locale)) {
        throw new AuditParseError(
          `duplicate overlay locale key "${locale}" for block "${blockId}"`,
          { file, line: getLine(sf, localeMember), context: locale }
        );
      }
      seenLocales.add(locale);
      localeKeys.push(locale);
    }
    entries.set(blockId, localeKeys);
  }
  return entries;
}

/**
 * Audit the source/overlay first-level key mapping for the learning-blocks
 * system and return the overlay audit records (system "learningBlocks") for
 * every learner-facing block id and every target locale.
 *
 *   - The source set is the static `id` of every element of the `learningBlocks`
 *     array literal. Non-object elements, missing / empty / dynamic ids fail
 *     closed; duplicate ids fail closed.
 *   - The overlay set is the first-level keys of the `learningBlockI18n` object
 *     literal; nested field keys are never flattened. Spreads, computed keys
 *     and non-object entry values fail closed.
 *   - For each target locale, a source id with no overlay entry for that locale
 *     is `missing`; an overlay key with no source id is `dangling` (per locale
 *     the overlay entry carries). The common record shape, sorting and counts
 *     come from #695; the system is fixed to "learningBlocks". Target locales
 *     must come from the launched registry; this adapter never hardcodes one.
 *
 * Returns records sorted by the canonical `sortAuditRecords` order. Performs
 * zero filesystem writes, console output, network access and never calls
 * process.exit.
 */
export function auditLearningBlockOverlays({ repoRoot, targetLocales }) {
  if (typeof repoRoot !== "string" || repoRoot.length === 0) {
    throw new Error("auditLearningBlockOverlays requires a non-empty repoRoot directory");
  }
  if (
    !Array.isArray(targetLocales) ||
    !targetLocales.every((l) => typeof l === "string" && l.length > 0)
  ) {
    throw new Error(
      "auditLearningBlockOverlays requires targetLocales to be an array of locale strings"
    );
  }
  const locales = [...new Set(targetLocales)];

  const sourcePath = `${repoRoot}/src/domain/learningBlocks.ts`;
  const overlayPath = `${repoRoot}/src/domain/learningBlocks.i18n.ts`;

  const sourceFile = parseTypeScriptFile(sourcePath);
  const overlayFile = parseTypeScriptFile(overlayPath);

  const blocksArray = findLearningBlocksArray(sourceFile);
  const overlayObject = findLearningBlockOverlay(overlayFile);

  if (!blocksArray) {
    throw new AuditParseError("learningBlocks array literal not found", { file: sourcePath });
  }
  if (!overlayObject) {
    throw new AuditParseError("learningBlockI18n object literal not found", { file: overlayPath });
  }

  // --- source: static block ids -------------------------------------------
  const sourceKeys = [];
  const seenIds = new Set();
  for (const element of blocksArray.elements) {
    const id = readBlockId(element, sourceFile, sourcePath);
    if (seenIds.has(id)) {
      throw new AuditParseError(`duplicate learning block id "${id}"`, {
        file: sourcePath,
        context: id
      });
    }
    seenIds.add(id);
    sourceKeys.push(id);
  }

  // --- overlay: first-level block keys + per-entry locales ------------------
  const overlayEntries = collectOverlayBlockEntries(overlayObject, overlayFile, overlayPath);

  // --- per-target-locale comparison ----------------------------------------
  const records = [];
  for (const locale of locales) {
    // source-without-overlay-for-this-locale => missing
    for (const sourceKey of sourceKeys) {
      const entry = overlayEntries.get(sourceKey);
      if (!entry || !entry.includes(locale)) {
        records.push({
          system: "learningBlocks",
          locale,
          sourceKey,
          overlayKey: "",
          status: "missing"
        });
      }
    }
  }
  // overlay-without-source => dangling (per locale the overlay entry carries)
  for (const [blockId, localeKeys] of overlayEntries) {
    if (seenIds.has(blockId)) continue;
    for (const locale of localeKeys) {
      records.push({
        system: "learningBlocks",
        locale,
        sourceKey: "",
        overlayKey: blockId,
        status: "dangling"
      });
    }
  }

  return sortAuditRecords(records);
}
