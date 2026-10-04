// Write ../../figma-registry.json and ../../renders/figma/*.png from a
// completed import (design tooling only).
//
//   FIGMA_WORK_DIR=<artifact dir holding figma-state.json and scene outputs>
//   node registry.mjs
//
// The registry is the committed record of the canonical Figma frames: one
// entry per scene with its page, node ID, frame name, size, layer and text
// counts, fonts, paints, visual diff and SHA-256 of the serialized source,
// the like-for-like HTML capture, the native Figma export and the readback.
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { BRIDGE_VERSION } from "./bridge-client.mjs";
import { CAPTURES, FIGMA_PAGES, captureName, sceneLabel } from "../scenes.mjs";
import { FIGMA_FILE, FIGMA_STYLES, FONT_POLICY, FRAME_STATUS, HTML_FIGMA_BUNDLE_SHA256, VISUAL_LIMIT, harnessDigest } from "./policy.mjs";

const workDir = process.env.FIGMA_WORK_DIR;
if (!workDir) throw new Error("Set FIGMA_WORK_DIR");
const root = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const state = JSON.parse(readFileSync(resolve(workDir, "figma-state.json"), "utf8"));
const sha = (path) => createHash("sha256").update(readFileSync(path)).digest("hex");

const frames = [];
const harness = new Set();
for (const [board, vp, full, mode] of CAPTURES) {
  const name = captureName(board, vp, mode, full);
  const scene = state.scenes[name];
  if (!scene) throw new Error(`${name}: not imported`);
  const capture = JSON.parse(readFileSync(resolve(workDir, `${name}-capture.json`), "utf8"));
  if (!capture.harnessDigest) throw new Error(`${name}: capture has no harness digest; re-serialize`);
  harness.add(capture.harnessDigest);
  // The committed record must describe exactly the frame that was imported.
  if (sha(resolve(workDir, `${name}.json`)) !== scene.sha256.source) throw new Error(`${name}: serialized source changed after import`);
  if (sha(resolve(workDir, `${name}-figma.png`)) !== scene.sha256.figma) throw new Error(`${name}: Figma export changed after import`);
  frames.push({
    scene: name,
    label: sceneLabel(board, vp, mode, full),
    board: board.split("?")[0],
    query: board.split("?")[1] ?? "",
    viewport: vp,
    fullPage: full,
    mode: mode ?? "default",
    page: FIGMA_PAGES[board.split("?")[0]],
    pageId: scene.pageId,
    nodeId: scene.nodeId,
    frameName: scene.frameName,
    position: { x: scene.x, y: scene.y },
    size: { width: scene.width, height: scene.height },
    layers: { imported: scene.layerCount, expected: scene.expectedLayerCount, serializedTypes: scene.serializedTypes, readbackTypes: scene.readback.types },
    texts: { serialized: scene.serializedTexts, readback: scene.readback.texts, unmatched: capture.unmatchedCount, missing: capture.missingCount },
    fonts: { expected: scene.expectedFonts, readback: scene.readback.fonts, match: scene.fontsMatch },
    paints: { fills: scene.readback.fills, strokes: scene.readback.strokes, imageFills: scene.readback.imageFills },
    visual: { ...scene.visual, exportAttempts: scene.exportStable.attempts, exportStable: scene.exportStable.stable },
    render: `renders/figma/${name}.png`,
    sha256: scene.sha256,
    importedAt: scene.importedAt
  });
}
if (harness.size !== 1) throw new Error(`Scenes were serialized from ${harness.size} different harness states; re-serialize and re-import`);
const [digest] = harness;
if (digest !== harnessDigest()) throw new Error("reference/ or tokens.json changed after serialization; re-serialize and re-import");

const outDir = resolve(root, "renders/figma");
if (existsSync(outDir)) for (const f of readdirSync(outDir)) rmSync(resolve(outDir, f));
mkdirSync(outDir, { recursive: true });
for (const f of frames) copyFileSync(resolve(workDir, `${f.scene}-figma.png`), resolve(root, f.render));

const capture0 = JSON.parse(readFileSync(resolve(workDir, `${frames[0].scene}-capture.json`), "utf8"));
const registry = {
  $comment: "Canonical Figma frames of Jabiko JT-1. Written by tools/figma/registry.mjs; checked by tools/figma/verify.mjs.",
  system: "Jabiko",
  revision: "JT-1",
  status: FRAME_STATUS,
  file: FIGMA_FILE,
  pages: Object.fromEntries(Object.entries(state.pages).filter(([name]) => name !== "Page 1")),
  archivePage: state.pages["Page 1"] ?? null,
  boardLabels: state.labels ?? {},
  bridge: { package: "@gethopp/figma-mcp-bridge", version: BRIDGE_VERSION, tool: "import_html_layers" },
  serializer: {
    htmlFigmaBundleSha256: HTML_FIGMA_BUNDLE_SHA256,
    chromium: capture0.chromium,
    fontPolicy: FONT_POLICY,
    figmaStyles: FIGMA_STYLES,
    harnessDigest: digest
  },
  visualMetric: {
    description: "Share of pixels whose max RGB channel delta exceeds 48 between the native Figma export (scale 1) and the Chromium capture of the same scene laid out in the Figma faces; sizes must be equal.",
    limit: VISUAL_LIMIT
  },
  frames
};
writeFileSync(resolve(root, "figma-registry.json"), `${JSON.stringify(registry, null, 2)}\n`);
console.log(`figma-registry.json: ${frames.length} frames; renders/figma: ${frames.length} PNGs`);
