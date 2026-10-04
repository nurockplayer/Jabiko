// Import serialized Jabiko JT-1 scenes into the Jabiko Figma file through
// the official bridge, then read every frame back and export it natively
// (design tooling only).
//
//   FIGMA_BRIDGE_DIR, FIGMA_WORK_DIR (as for bridge.mjs)
//   FIGMA_FILE_KEY=<bridge fileKey of the connected Jabiko file>
//   node import.mjs [scene-name-substring] [--replace]
//
// State (page IDs, scene node IDs) is kept in $FIGMA_WORK_DIR/figma-state.json
// so a run can resume. With --replace, an existing frame for a scene is moved
// to the archive page ("Page 1") and renamed "ARCHIVED · NOT AUTHORITY · …" before re-import.
import { createHash } from "node:crypto";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import sharp from "sharp";
import { openBridge } from "./bridge-client.mjs";
import { BOARD_LABELS, CAPTURES, FIGMA_ARCHIVE_PAGE, FIGMA_PAGES, captureName, sceneLabel } from "../scenes.mjs";
import { FRAME_STATUS } from "./policy.mjs";

const workDir = process.env.FIGMA_WORK_DIR;
const fileKey = process.env.FIGMA_FILE_KEY;
if (!workDir || !fileKey) throw new Error("Set FIGMA_WORK_DIR and FIGMA_FILE_KEY");
const args = process.argv.slice(2);
const replace = args.includes("--replace");
const filter = args.find((a) => !a.startsWith("--")) ?? "";
const STATUS = FRAME_STATUS;
const ARCHIVE = FIGMA_ARCHIVE_PAGE;
const LABEL_HEIGHT = 160;
const ROW_WIDTH = 6400;
const GAP = 160;
const ROW_GAP = 240;

const statePath = resolve(workDir, "figma-state.json");
const state = existsSync(statePath) ? JSON.parse(readFileSync(statePath, "utf8")) : { fileKey, pages: {}, scenes: {}, cursors: {} };
if (state.fileKey !== fileKey) throw new Error(`State belongs to ${state.fileKey}, not ${fileKey}`);
const save = () => writeFileSync(statePath, JSON.stringify(state, null, 2));
const sha = (path) => createHash("sha256").update(readFileSync(path)).digest("hex");

// Pixel diff of the Figma export against the like-for-like HTML capture. The
// sizes must be equal; a mismatch is reported, never resampled away.
async function diff(htmlPath, figmaPath) {
  const a = sharp(htmlPath);
  const meta = await a.metadata();
  const metaB = await sharp(figmaPath).metadata();
  if (metaB.width !== meta.width || metaB.height !== meta.height) {
    return { width: meta.width, height: meta.height, figmaWidth: metaB.width, figmaHeight: metaB.height, sizeMismatch: true, differingPixelRatio: 1, meanChannelDelta: null };
  }
  const ra = await a.ensureAlpha().raw().toBuffer();
  const rb = await sharp(figmaPath).ensureAlpha().raw().toBuffer();
  let differing = 0;
  let total = 0;
  for (let i = 0; i < ra.length; i += 4) {
    const d = Math.max(Math.abs(ra[i] - rb[i]), Math.abs(ra[i + 1] - rb[i + 1]), Math.abs(ra[i + 2] - rb[i + 2]));
    total += d;
    if (d > 48) differing += 1;
  }
  const px = ra.length / 4;
  return { width: meta.width, height: meta.height, sizeMismatch: false, differingPixelRatio: Math.round((differing / px) * 10000) / 10000, meanChannelDelta: Math.round((total / px) * 100) / 100 };
}

function inspectReadback(node) {
  const out = { types: {}, imageFills: 0, fonts: {}, fills: new Set(), strokes: new Set(), texts: 0 };
  (function walk(n) {
    out.types[n.type] = (out.types[n.type] ?? 0) + 1;
    for (const f of n.styles?.fills ?? []) {
      if (f.type === "IMAGE") out.imageFills += 1;
      if (f.type === "SOLID") out.fills.add(f.color);
    }
    for (const s of n.styles?.strokes ?? []) if (s.type === "SOLID") out.strokes.add(s.color);
    if (n.type === "TEXT") {
      out.texts += 1;
      const k = `${n.styles?.fontFamily} ${n.styles?.fontStyle}`;
      out.fonts[k] = (out.fonts[k] ?? 0) + 1;
    }
    for (const c of n.children ?? []) walk(c);
  })(node);
  return { ...out, fills: [...out.fills].sort(), strokes: [...out.strokes].sort() };
}

// "family style" counts of the TEXT layers the serializer asked for.
function expectedFonts(tree) {
  const out = {};
  (function walk(n) {
    if (n.type === "TEXT") {
      const k = `${n.fontName.family} ${n.fontName.style}`;
      out[k] = (out[k] ?? 0) + 1;
    }
    for (const c of n.children ?? []) walk(c);
  })(tree);
  return out;
}

// Export a frame natively. The bridge never overwrites an existing file (it
// reports that per item via hasErrors, not as a tool error), so the target is
// removed first and every item result is checked. The export is repeated
// until two consecutive exports are byte-identical at the frame's size.
async function stableExport(bridge, nodeId, outputPath, size) {
  const file = resolve(workDir, outputPath);
  let previous = null;
  for (let attempt = 1; attempt <= 6; attempt += 1) {
    rmSync(file, { force: true });
    const result = await bridge.call("save_screenshots", { fileKey, items: [{ nodeId, outputPath, format: "PNG", scale: 1, clip: true }] });
    if (result.hasErrors || !result.results?.[0]?.success) throw new Error(`export ${nodeId} failed: ${JSON.stringify(result.results?.[0])}`);
    const { width, height } = await sharp(file).metadata();
    const digest = sha(file);
    if (width === size.width && height === size.height && digest === previous) return { attempts: attempt, stable: true };
    previous = digest;
    await new Promise((r) => setTimeout(r, 1000));
  }
  return { attempts: 6, stable: false };
}

const bridge = await openBridge();
try {
  const meta = await bridge.call("get_metadata", { fileKey });
  // The plugin API exposed by the bridge cannot rename or delete pages, so
  // the file's default "Page 1" stays untouched and every JT-1 page is created.
  for (const p of meta.pages) state.pages[p.name] = p.id;
  for (const name of [...new Set(Object.values(FIGMA_PAGES)), ARCHIVE]) {
    if (!state.pages[name]) {
      const page = await bridge.call("create_page", { fileKey, name });
      state.pages[name] = page.pageId ?? page.id ?? page.nodeId;
    }
  }
  save();

  for (const [board, vp, full, mode] of CAPTURES) {
    const name = captureName(board, vp, mode, full);
    if (filter && !name.includes(filter)) continue;
    const file = board.split("?")[0];
    const pageName = FIGMA_PAGES[file];
    const pageId = state.pages[pageName];
    const label = sceneLabel(board, vp, mode, full);
    const existing = state.scenes[name];
    if (existing && !replace) {
      console.log(`${name}: exists (${existing.nodeId}), skipped`);
      continue;
    }
    if (existing) {
      await bridge.call("reparent_nodes", { fileKey, nodeIds: [existing.nodeId], parentId: state.pages[ARCHIVE] });
      await bridge.call("set_node_properties", { fileKey, nodeId: existing.nodeId, name: `ARCHIVED · NOT AUTHORITY · ${label}` });
      (state.archived ??= []).push({ ...existing, archivedAt: new Date().toISOString() });
    }
    const capture = JSON.parse(readFileSync(resolve(workDir, `${name}-capture.json`), "utf8"));
    const cursor = (state.cursors[pageName] ??= { x: 0, y: 0, rowHeight: 0, board: null });
    if (!existing && cursor.board !== file) {
      if (cursor.board !== null) {
        cursor.y += cursor.rowHeight + ROW_GAP;
      }
      cursor.x = 0;
      cursor.rowHeight = 0;
      const label = await bridge.call("create_text", { fileKey, parentId: pageId, name: `Board · ${BOARD_LABELS[file]}`, characters: BOARD_LABELS[file], fontFamily: "Inter", fontStyle: "Semi Bold", fontSize: 64, fillHex: "#252735", x: 0, y: cursor.y });
      (state.labels ??= {})[file] = { nodeId: label.nodeId ?? label.id, pageId, y: cursor.y };
      cursor.y += LABEL_HEIGHT;
      cursor.board = file;
    }
    const position = existing ? { x: existing.x, y: existing.y } : (() => {
      if (cursor.x > 0 && cursor.x + capture.size.width > ROW_WIDTH) {
        cursor.x = 0;
        cursor.y += cursor.rowHeight + ROW_GAP;
        cursor.rowHeight = 0;
      }
      const p = { x: cursor.x, y: cursor.y };
      cursor.x += capture.size.width + GAP;
      cursor.rowHeight = Math.max(cursor.rowHeight, capture.size.height);
      return p;
    })();
    const imported = await bridge.call("import_html_layers", { fileKey, source: `${name}.json`, name: `${STATUS} · ${label}`, parentId: pageId, ...position });
    if (imported.layerCount !== imported.expectedLayerCount) throw new Error(`${name}: partial import ${imported.layerCount}/${imported.expectedLayerCount}`);
    const readback = await bridge.call("get_node", { fileKey, nodeId: imported.nodeId });
    const exportStable = await stableExport(bridge, imported.nodeId, `${name}-figma.png`, capture.size);
    writeFileSync(resolve(workDir, `${name}-readback.json`), JSON.stringify(readback, null, 2));
    const inspection = inspectReadback(readback);
    const wanted = expectedFonts(JSON.parse(readFileSync(resolve(workDir, `${name}.json`), "utf8")));
    const fontsMatch = JSON.stringify(Object.entries(wanted).sort()) === JSON.stringify(Object.entries(inspection.fonts).sort());
    const visual = await diff(resolve(workDir, `${name}-html.png`), resolve(workDir, `${name}-figma.png`));
    state.scenes[name] = {
      name, board, viewport: vp, fullPage: full, mode: mode ?? "default", page: pageName, pageId,
      nodeId: imported.nodeId, frameName: `${STATUS} · ${label}`, ...position,
      width: imported.width, height: imported.height,
      layerCount: imported.layerCount, expectedLayerCount: imported.expectedLayerCount,
      serializedTypes: capture.types, serializedTexts: capture.types.TEXT ?? 0, unmatchedTexts: capture.unmatchedCount,
      readback: inspection, expectedFonts: wanted, fontsMatch, exportStable,
      visual,
      sha256: {
        source: sha(resolve(workDir, `${name}.json`)),
        html: sha(resolve(workDir, `${name}-html.png`)),
        figma: sha(resolve(workDir, `${name}-figma.png`)),
        readback: sha(resolve(workDir, `${name}-readback.json`))
      },
      importedAt: new Date().toISOString()
    };
    save();
    console.log(`${name}: ${imported.nodeId} layers ${imported.layerCount}/${imported.expectedLayerCount} diff ${visual.differingPixelRatio}${visual.sizeMismatch ? " SIZE MISMATCH" : ""} texts ${inspection.texts}/${capture.types.TEXT ?? 0} fonts ${fontsMatch ? "ok" : "MISMATCH"} images ${inspection.imageFills}`);
  }
} finally {
  await bridge.close();
}
