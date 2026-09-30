// Figma parity check for Shu-ire SI-1 (design tooling only; not a product
// test).
//
//   node docs/design/learning/tools/figma/verify.mjs
//   FIGMA_BRIDGE_DIR=… FIGMA_WORK_DIR=… FIGMA_FILE_KEY=<bridge key> \
//     node docs/design/learning/tools/figma/verify.mjs --live
//
// Offline (default) it checks ../../figma-registry.json against the scene
// list, tokens.json, the committed renders/figma PNGs and the current
// reference harness:
//   - exactly one frame per capture scene, on its page, with its frame name
//     and size; unique node IDs;
//   - every serialized layer imported; readback text count equals the
//     serialized count; no unmatched or missing text; fonts equal to the
//     serialized fontName and within FIGMA_STYLES; no image fills;
//   - every solid fill/stroke is a tokens.json color (either theme) or the
//     Jabiko mascot's art colors; forced-colors scenes are exempt (they show
//     system colors by definition);
//   - export size equals frame size, the export was stable, and the visual
//     diff is within the registry limit;
//   - renders/figma/<scene>.png matches the registered SHA-256;
//   - the harness digest equals the one the frames were serialized from, so
//     a harness edit without a Figma re-import fails.
// With --live it also reads every frame back through the official bridge and
// requires its name, size and readback SHA-256 to equal the registry (any
// edit made in Figma since the registry was written fails until it is
// re-registered).
//
// Writes ../../verification/figma-report.json. Exits non-zero on failure.
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { BRIDGE_VERSION } from "./bridge-client.mjs";
import { CAPTURES, FIGMA_PAGES, VIEWPORTS, captureName, sceneLabel } from "../scenes.mjs";
import { BRAND_ART_COLORS, FIGMA_FILE, FIGMA_STYLES, HTML_FIGMA_BUNDLE_SHA256, harnessDigest } from "./policy.mjs";

const root = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const registry = JSON.parse(readFileSync(resolve(root, "figma-registry.json"), "utf8"));
const tokens = JSON.parse(readFileSync(resolve(root, "tokens.json"), "utf8"));
const live = process.argv.includes("--live");
const failures = [];
const failedFrames = new Set();
const fail = (msg) => failures.push(msg);
const sha = (buf) => createHash("sha256").update(buf).digest("hex");

// Token palette: every color value in either theme, as lowercase #rrggbb
// (rgba() values contribute their rgb; Figma stores opacity separately).
const palette = new Set(BRAND_ART_COLORS);
(function walk(o) {
  if (o && typeof o === "object") return Object.values(o).forEach(walk);
  if (typeof o !== "string") return;
  if (/^#[0-9a-f]{6}$/i.test(o)) palette.add(o.toLowerCase());
  const m = o.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (m) palette.add(`#${m.slice(1, 4).map((n) => Number(n).toString(16).padStart(2, "0")).join("")}`);
})(tokens.color);
const allowedFonts = new Set(Object.entries(FIGMA_STYLES).flatMap(([family, styles]) => Object.values(styles).map((s) => `${family} ${s}`)));

// File-level facts.
if (JSON.stringify(registry.file) !== JSON.stringify(FIGMA_FILE)) fail(`registry file ${JSON.stringify(registry.file)} is not ${FIGMA_FILE.name}`);
if (registry.bridge?.version !== BRIDGE_VERSION) fail(`bridge ${registry.bridge?.version} is not ${BRIDGE_VERSION}`);
if (registry.serializer?.htmlFigmaBundleSha256 !== HTML_FIGMA_BUNDLE_SHA256) fail("html-figma bundle hash differs from policy");
if (registry.serializer?.harnessDigest !== harnessDigest()) fail("reference/ or tokens.json changed since the Figma frames were serialized: re-serialize, re-import and re-register");
const limit = registry.visualMetric?.limit;
if (typeof limit !== "number") fail("registry has no numeric visualMetric.limit");

// Per-frame checks.
const expected = CAPTURES.map(([board, vp, full, mode]) => ({ name: captureName(board, vp, mode), board, vp, full, mode }));
const byScene = new Map(registry.frames.map((f) => [f.scene, f]));
if (registry.frames.length !== expected.length) fail(`${registry.frames.length} frames registered, ${expected.length} scenes expected`);
if (new Set(registry.frames.map((f) => f.nodeId)).size !== registry.frames.length) fail("duplicate node IDs");
for (const { name, board, vp, full, mode } of expected) {
  const f = byScene.get(name);
  if (!f) {
    fail(`${name}: no Figma frame registered`);
    continue;
  }
  const problems = [];
  const file = board.split("?")[0];
  const [w, h] = VIEWPORTS[vp];
  if (f.page !== FIGMA_PAGES[file] || registry.pages[f.page] !== f.pageId) problems.push(`page ${f.page} (${f.pageId})`);
  if (f.frameName !== `${registry.status} · ${sceneLabel(board, vp, mode)}`) problems.push(`frame name "${f.frameName}"`);
  if (f.size.width !== w || (full ? f.size.height < h : f.size.height !== h)) problems.push(`size ${f.size.width}×${f.size.height}`);
  if (f.layers.imported !== f.layers.expected) problems.push(`layers ${f.layers.imported}/${f.layers.expected}`);
  if (f.texts.readback !== f.texts.serialized || f.texts.unmatched || f.texts.missing) problems.push(`texts ${f.texts.readback}/${f.texts.serialized} unmatched ${f.texts.unmatched} missing ${f.texts.missing}`);
  if (!f.fonts.match) problems.push("fonts differ from the serialized fontName");
  const badFonts = Object.keys(f.fonts.readback).filter((k) => !allowedFonts.has(k));
  if (badFonts.length) problems.push(`fonts outside policy: ${badFonts.join(", ")}`);
  if (f.paints.imageFills) problems.push(`${f.paints.imageFills} image fills`);
  if ((mode ?? "default") !== "forced") {
    const off = [...f.paints.fills, ...f.paints.strokes].filter((c) => !palette.has(c));
    if (off.length) problems.push(`non-token paints ${[...new Set(off)].join(", ")}`);
  }
  if (f.visual.sizeMismatch || !f.visual.exportStable) problems.push("export size mismatch or unstable export");
  if (typeof limit === "number" && f.visual.differingPixelRatio > limit) problems.push(`visual diff ${f.visual.differingPixelRatio} > ${limit}`);
  const png = resolve(root, f.render);
  if (!existsSync(png)) problems.push(`missing ${f.render}`);
  else {
    const buf = readFileSync(png);
    if (sha(buf) !== f.sha256.figma) problems.push(`${f.render} SHA-256 differs from registry`);
    const meta = await sharp(buf).metadata();
    if (meta.width !== f.size.width || meta.height !== f.size.height) problems.push(`${f.render} is ${meta.width}×${meta.height}`);
  }
  if (problems.length) {
    failedFrames.add(name);
    fail(`${name}: ${problems.join(" | ")}`);
  }
}
for (const f of registry.frames) if (!expected.some((e) => e.name === f.scene)) fail(`${f.scene}: registered but not a capture scene`);

// Live readback through the official bridge.
let liveChecked = 0;
if (live) {
  const { openBridge } = await import("./bridge-client.mjs");
  const fileKey = process.env.FIGMA_FILE_KEY;
  if (!fileKey) throw new Error("--live needs FIGMA_FILE_KEY (the bridge key from list_files)");
  const bridge = await openBridge();
  try {
    const meta = await bridge.call("get_metadata", { fileKey });
    if (meta.fileName !== FIGMA_FILE.name) fail(`connected file is "${meta.fileName}", not "${FIGMA_FILE.name}"`);
    for (const f of registry.frames) {
      const node = await bridge.call("get_node", { fileKey, nodeId: f.nodeId });
      const problems = [];
      if (node.name !== f.frameName) problems.push(`name "${node.name}"`);
      if (node.bounds?.width !== f.size.width || node.bounds?.height !== f.size.height) problems.push(`bounds ${node.bounds?.width}×${node.bounds?.height}`);
      if (sha(JSON.stringify(node, null, 2)) !== f.sha256.readback) problems.push("readback differs from the registry (edited in Figma since registration?)");
      if (problems.length) fail(`live ${f.scene} ${f.nodeId}: ${problems.join(" | ")}`);
      liveChecked += 1;
    }
  } finally {
    await bridge.close();
  }
}

const summary = { frames: `${expected.length - failedFrames.size}/${expected.length}`, live: live ? `${liveChecked} frames read back` : "not run", failures: failures.length };
writeFileSync(resolve(root, "verification/figma-report.json"), `${JSON.stringify({ file: registry.file, status: registry.status, visualLimit: limit, summary, failures }, null, 2)}\n`);
if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
}
console.log(JSON.stringify(summary));
