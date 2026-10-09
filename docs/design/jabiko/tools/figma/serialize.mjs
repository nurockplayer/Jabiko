// Serialize Jabiko JT-1 reference scenes into html-figma layer trees for the
// official bridge's import_html_layers (design tooling only).
//
//   HTML_FIGMA_BUNDLE=<html-figma 0.3.1 browser bundle>  (SHA-256 in policy.mjs)
//   FIGMA_WORK_DIR=<artifact dir>                       (outputs land here)
//   node serialize.mjs [scene-name-substring]
//
// For every scene in ../scenes.mjs CAPTURES it writes <scene>.json (layer
// tree), <scene>-html.png (the Chromium capture) and <scene>-capture.json
// (serializer statistics and the harness digest). The adaptation follows the
// Tachiko #71 serializer (explicit SVG paint, asymmetric borders as rules,
// inset shadows, focus outlines, underline decoration) and adds:
//   - every text element pinned to its Figma face and available weight
//     (policy.mjs FONT_POLICY / FIGMA_STYLES) with an explicit fontName, and
//     the scene re-laid out in those faces with CJK punctuation trimming and
//     autospacing off, so <scene>-html.png is the like-for-like reference for
//     the Figma export (../../renders stay the system-face renders);
//   - zero-size overlay wrappers unwrapped so dialogs, menus, sheets and
//     toasts are not dropped;
//   - wrapped runs in mixed inline content split into one TEXT layer per
//     rendered line, measured without touching the DOM;
//   - fixed and sticky boxes hoisted to the top of the frame in browser
//     paint order;
//   - fail-closed checks: no unmatched or missing text, and preparation must
//     not move any element (exit code 1 otherwise).
import { chromium } from "@playwright/test";
import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { startStaticServer } from "../static-server.mjs";
import { CAPTURES, VIEWPORTS, captureName, sceneLabel } from "../scenes.mjs";
import { FIGMA_FONTS_CSS, FIGMA_STYLES, FONT_POLICY, HTML_FIGMA_BUNDLE_SHA256, harnessDigest } from "./policy.mjs";

const bundlePath = process.env.HTML_FIGMA_BUNDLE;
const workDir = process.env.FIGMA_WORK_DIR;
if (!bundlePath || !workDir) throw new Error("Set HTML_FIGMA_BUNDLE and FIGMA_WORK_DIR");
const bundle = await readFile(bundlePath, "utf8");
const bundleSha = createHash("sha256").update(bundle).digest("hex");
if (bundleSha !== HTML_FIGMA_BUNDLE_SHA256) throw new Error(`html-figma bundle hash mismatch: ${bundleSha}`);
await mkdir(workDir, { recursive: true });
const filter = process.argv[2] ?? "";
const harness = harnessDigest();

// Decide every text-bearing element's Figma face (from the original computed
// style) and nearest available weight, then pin both inline so the browser
// lays the scene out exactly as Figma will.
function pinFigmaFonts({ fonts, styles }) {
  const kana = /[\u3040-\u30ff]/;
  const han = /[\u3400-\u9fff\uf900-\ufaff]/;
  const pins = [];
  for (const el of document.body.querySelectorAll("*")) {
    if (el.closest("svg")) continue;
    const own = el.matches("input, textarea")
      ? (el.value || el.placeholder || "").trim()
      : [...el.childNodes].filter((c) => c.nodeType === 3).map((c) => c.textContent).join("").trim();
    if (!own) continue;
    const cs = getComputedStyle(el);
    const lang = el.closest("[lang]")?.getAttribute("lang") ?? "";
    const family = /Mincho/.test(cs.fontFamily) ? fonts.mincho : lang === "ja" || kana.test(own) ? fonts.japanese : han.test(own) ? fonts.chinese : fonts.latin;
    const w = Number(cs.fontWeight);
    const weight = Object.keys(styles[family]).map(Number).sort((a, b) => Math.abs(a - w) - Math.abs(b - w) || b - a)[0];
    pins.push([el, family, weight]);
  }
  for (const [el, family, weight] of pins) {
    el.style.setProperty("font-family", `"${family}"`, "important");
    el.style.setProperty("font-weight", String(weight), "important");
    el.style.setProperty("font-synthesis", "none", "important");
    el.dataset.figmaFont = family;
    el.dataset.figmaWeight = String(weight);
  }
  return pins.length;
}

// Rounded boxes of every element present before preparation, keyed by a
// stable index, to prove preparation did not move anything.
function measureLayout() {
  const out = {};
  document.body.querySelectorAll("*").forEach((el, i) => {
    if (el.closest("svg")) return;
    el.dataset.siMeasure ??= String(i);
    const r = el.getBoundingClientRect();
    out[el.dataset.siMeasure] = [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height), el.tagName.toLowerCase() + (typeof el.className === "string" && el.className ? "." + el.className.trim().split(/\s+/)[0] : "")];
  });
  return out;
}

// All DOM preparation happens before the reference screenshot, so the
// capture shows exactly the DOM that is serialized.
function prepareInPage() {
  const round = (v) => Math.round(v * 100) / 100;
  // 0. html-figma attaches every layer to its DOM parent's layer, and a
  //    zero-size element yields no layer, so an overlay wrapper such as
  //    <div data-state="language"> (whose scrim/dialog children are fixed)
  //    would silently drop the whole overlay. Unwrap such static, untransformed
  //    wrappers whose element children are all out of flow; layout is
  //    unchanged because fixed/absolute children do not depend on them.
  for (const el of [...document.body.querySelectorAll("*")].reverse()) {
    if (el.closest("svg") || !el.children.length || !el.checkVisibility()) continue;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    if ((r.width >= 1 && r.height >= 1) || cs.position !== "static" || cs.transform !== "none" || cs.filter !== "none") continue;
    const kids = [...el.children].filter((c) => c.checkVisibility());
    if (kids.length && kids.every((c) => ["fixed", "absolute"].includes(getComputedStyle(c).position))) el.replaceWith(...el.childNodes);
  }
  // 1. SVG paint must be explicit (currentColor and CSS fill:none do not
  //    survive the boundary; an SVG path with no fill attribute imports black).
  for (const svg of document.querySelectorAll("svg")) {
    const r = svg.getBoundingClientRect();
    svg.setAttribute("width", String(round(r.width)));
    svg.setAttribute("height", String(round(r.height)));
    for (const e of svg.querySelectorAll("*")) {
      const cs = getComputedStyle(e);
      // A stroke-only segment with no fill attribute (e.g. "M36 14.6h9.5M36
      // 16.8h9.5" in the Jabiko mark) encloses no area; its default black
      // fill is invisible in the browser but would import as a black paint.
      const segmentsOnly = !e.hasAttribute("fill") && cs.stroke !== "none" &&
        (e.tagName === "line" || (e.tagName === "path" && (e.getAttribute("d") || "").split(/(?=[Mm])/).every((sub) => /^[Mm][^A-Za-z]*[LlHhVv][^A-Za-z]*$/.test(sub.trim()) && sub.match(/-?[\d.]+/g).length <= 4)));
      e.setAttribute("fill", segmentsOnly ? "none" : cs.fill && cs.fill !== "" ? cs.fill : "none");
      e.setAttribute("stroke", cs.stroke && cs.stroke !== "" ? cs.stroke : "none");
      if (cs.strokeWidth) e.setAttribute("stroke-width", cs.strokeWidth);
      if (cs.strokeDasharray && cs.strokeDasharray !== "none") e.setAttribute("stroke-dasharray", cs.strokeDasharray);
      if (cs.strokeDashoffset && cs.strokeDashoffset !== "0px") e.setAttribute("stroke-dashoffset", cs.strokeDashoffset);
    }
  }
}

function serializeInPage({ label, width, height, full, styles }) {
  const H = window.HtmlFigma;
  const round = (v) => Math.round(v * 100) / 100;
  let t;
  const describe = (e) => {
    if (!e || e.nodeType !== 1) return "node";
    const cls = typeof e.className === "string" ? e.className.trim().split(/\s+/).filter(Boolean).slice(0, 2).join(".") : "";
    const aria = e.getAttribute("aria-label");
    return [e.tagName.toLowerCase() + (cls ? "." + cls : ""), aria ? `“${aria}”` : ""].filter(Boolean).join(" ");
  };
  const root = document.body;
  const refs = new Map();
  const key = (a) => [a.type, round(a.x), round(a.y), round(a.width), round(a.height), a.characters || ""].join("|");
  // A wrapped text run inside mixed inline content (e.g. Chinese around a
  // Japanese span) has a bounding box that starts at the line box's left
  // edge, not where the run starts. Measure each rendered line of such runs
  // (without touching the DOM) so its layer can be split per line below.
  const lineSplits = new Map();
  const lineWalker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while ((t = lineWalker.nextNode())) {
    const parent = t.parentElement;
    if (!t.textContent.trim() || !parent || parent.closest("svg, [hidden]")) continue;
    const range = document.createRange();
    range.selectNodeContents(t);
    const lineTops = new Set([...range.getClientRects()].map((r) => Math.round(r.top)));
    const mixed = [...parent.childNodes].some((c) => c !== t && (c.nodeType === 1 || c.textContent.trim()));
    if (lineTops.size < 2 || !mixed) continue;
    const lines = [];
    let line = null;
    for (let i = 0; i < t.textContent.length; i += 1) {
      range.setStart(t, i);
      range.setEnd(t, i + 1);
      const r = [...range.getClientRects()].find((x) => x.width > 0 || x.height > 0);
      if (r && line && Math.abs(r.top - line.top) > 2) line = null;
      if (!line) lines.push((line = { text: "", left: Infinity, top: r ? r.top : 0, right: -Infinity, bottom: -Infinity }));
      line.text += t.textContent[i];
      if (r && r.width > 0) {
        line.left = Math.min(line.left, r.left);
        line.right = Math.max(line.right, r.right);
        line.top = Math.min(line.top, r.top);
        line.bottom = Math.max(line.bottom, r.bottom);
      }
    }
    lineSplits.set(t, lines.filter((l) => l.text.trim() && Number.isFinite(l.left)).map((l) => ({ text: l.text.replace(/\s+$/, ""), left: l.left, top: l.top, width: l.right - l.left, height: l.bottom - l.top })));
  }
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ALL);
  let n = walker.currentNode;
  do {
    const raw = H.elementToFigma(n);
    if (raw) {
      for (const layer of [raw, raw.textValue].filter(Boolean)) {
        const k = key(layer);
        if (!refs.has(k)) refs.set(k, []);
        refs.get(k).push(n);
      }
    }
  } while ((n = walker.nextNode()));
  const tree = H.htmlToFigma(root);
  const color = (s) => {
    const m = s.match(/[\d.]+/g).map(Number);
    return { r: m[0] / 255, g: m[1] / 255, b: m[2] / 255, a: m[3] ?? 1 };
  };
  const stats = { matched: 0, unmatched: [], types: {}, fonts: {} };
  const consumedText = [];
  const sourceOf = new WeakMap();
  const textSourceOf = new WeakMap();
  function adapt(l, px = 0, py = 0) {
    const ax = l.x + px;
    const ay = l.y + py;
    stats.types[l.type] = (stats.types[l.type] ?? 0) + 1;
    const src = refs.get(key({ ...l, x: ax, y: ay }))?.shift();
    if (src) {
      stats.matched += 1;
      if (l.type === "TEXT") consumedText.push(src);
      sourceOf.set(l, src.nodeType === 3 ? src.parentElement : src);
      if (src.nodeType === 3) textSourceOf.set(l, src);
      const e = src.nodeType === 3 ? src.parentElement : src;
      const cs = getComputedStyle(e);
      l.name = l.type === "TEXT" ? l.characters : describe(e);
      if (l.type === "SVG") {
        l.svg = e.outerHTML;
        l.name = e.closest("[data-mark]") ? "Mark" : e.getAttribute("aria-label") ? `Icon “${e.getAttribute("aria-label")}”` : "Vector";
      }
      if (l.type === "TEXT") {
        if (src.nodeType === 3) l.characters = src.textContent;
        const pin = e.closest("[data-figma-font]");
        if (!pin) throw new Error(`No pinned Figma font for text “${l.characters}”`);
        l.fontFamily = pin.dataset.figmaFont;
        l.fontWeight = Number(pin.dataset.figmaWeight);
        l.fontName = { family: l.fontFamily, style: styles[l.fontFamily][l.fontWeight] };
        const fk = `${l.fontName.family} ${l.fontName.style}`;
        stats.fonts[fk] = (stats.fonts[fk] ?? 0) + 1;
        // html-figma paints placeholders a fixed #b2b2b2; use the harness's
        // own ::placeholder color.
        if (e.matches("input, textarea") && !e.value) {
          const c = color(getComputedStyle(e, "::placeholder").color);
          l.fills = [{ type: "SOLID", color: { r: c.r, g: c.g, b: c.b }, opacity: c.a }];
        }
        if (cs.textDecorationLine.includes("underline")) {
          const c = color(cs.textDecorationColor);
          l.textDecoration = "UNDERLINE";
          l.textDecorationStyle = cs.textDecorationStyle.toUpperCase();
          l.textDecorationOffset = { unit: "PIXELS", value: parseFloat(cs.textUnderlineOffset) || 0 };
          l.textDecorationThickness = { unit: "PIXELS", value: parseFloat(cs.textDecorationThickness) || 1 };
          l.textDecorationColor = { value: { type: "SOLID", color: { r: c.r, g: c.g, b: c.b }, opacity: c.a } };
        }
      }
      if (l.type === "FRAME") {
        l.strokeAlign = "INSIDE";
        if (cs.borderTopStyle === "dashed") l.dashPattern = [4, 3];
        if (!l.strokes?.length) {
          l.children = (l.children || []).filter((v) => v.name !== "::borders");
          for (const [side, x, y, w, h] of [
            ["Top", 0, 0, l.width, parseFloat(cs.borderTopWidth)],
            ["Bottom", 0, l.height - parseFloat(cs.borderBottomWidth), l.width, parseFloat(cs.borderBottomWidth)],
            ["Left", 0, 0, parseFloat(cs.borderLeftWidth), l.height],
            ["Right", l.width - parseFloat(cs.borderRightWidth), 0, parseFloat(cs.borderRightWidth), l.height]
          ]) {
            if (w > 0 && h > 0 && cs[`border${side}Style`] !== "none") {
              const c = color(cs[`border${side}Color`]);
              l.children.push({ type: "RECTANGLE", name: `Rule / ${side}`, x, y, width: w, height: h, fills: [{ type: "SOLID", color: { r: c.r, g: c.g, b: c.b }, opacity: c.a }] });
            }
          }
        }
        if (l.effects) {
          const shadows = cs.boxShadow.split(/,(?![^()]*\))/);
          l.effects.forEach((v, i) => { if (shadows[i]?.includes("inset")) v.type = "INNER_SHADOW"; });
        }
        if (parseFloat(cs.outlineWidth) > 0 && cs.outlineStyle !== "none") {
          const w = parseFloat(cs.outlineWidth);
          const gap = parseFloat(cs.outlineOffset);
          const c = color(cs.outlineColor);
          const out = w + gap;
          (l.children ??= []).push({ type: "RECTANGLE", name: `Focus outline / ${w}px + ${gap}px`, x: -out, y: -out, width: l.width + out * 2, height: l.height + out * 2, fills: [], strokes: [{ type: "SOLID", color: { r: c.r, g: c.g, b: c.b }, opacity: c.a }], strokeWeight: w, strokeAlign: "INSIDE", cornerRadius: (parseFloat(cs.borderTopLeftRadius) || 0) + out });
          l.clipsContent = false;
        }
      }
      l.data = { source: "Jabiko · JT-1", scene: label, element: describe(e) };
    } else if (l.type === "TEXT") {
      stats.unmatched.push({ text: l.characters, x: ax, y: ay });
    }
    for (const c of l.children || []) adapt(c, ax, ay);
  }
  adapt(tree);
  // One TEXT layer per rendered line for the runs measured above.
  stats.splitRuns = 0;
  (function split(l, px, py) {
    const ax = l.x + px;
    const ay = l.y + py;
    if (!l.children) return;
    const next = [];
    for (const c of l.children) {
      const segs = c.type === "TEXT" ? lineSplits.get(textSourceOf.get(c)) : null;
      if (segs) {
        stats.splitRuns += 1;
        for (const seg of segs) next.push({ ...c, characters: seg.text, name: seg.text, x: round(seg.left - ax), y: round(seg.top - ay), width: round(seg.width), height: round(seg.height) });
      } else {
        next.push(c);
        split(c, ax, ay);
      }
    }
    l.children = next;
  })(tree, 0, 0);
  // Paint order. html-figma orders layers only among siblings, but the
  // browser paints fixed and sticky boxes (bars, sticky actions, toasts,
  // scrims, dialogs) above later in-flow content anywhere in the tree. Hoist
  // their layers to the top of the frame at their absolute position, highest
  // z-index (auto = 0) first, later DOM order first on ties; the importer
  // stacks earlier children above later ones.
  const hoisted = [];
  (function collect(l, px, py, parent) {
    const ax = l.x + px;
    const ay = l.y + py;
    const el = sourceOf.get(l);
    if (parent && el?.nodeType === 1 && ["fixed", "sticky"].includes(getComputedStyle(el).position)) {
      parent.children.splice(parent.children.indexOf(l), 1);
      const z = Number(getComputedStyle(el).zIndex) || 0;
      hoisted.push({ l, z, order: hoisted.length });
      l.x = ax;
      l.y = ay;
      return;
    }
    for (const c of [...(l.children || [])]) collect(c, ax, ay, l);
  })(tree, 0, 0, null);
  hoisted.sort((a, b) => b.z - a.z || b.order - a.order);
  tree.children = [...hoisted.map((h) => h.l), ...(tree.children || [])];
  stats.hoisted = hoisted.map((h) => `${h.l.name} z${h.z}`);
  // Final layer counts (after the per-line split and hoisting).
  stats.types = {};
  stats.fonts = {};
  (function count(l) {
    stats.types[l.type] = (stats.types[l.type] ?? 0) + 1;
    if (l.type === "TEXT" && l.fontName) {
      const fk = `${l.fontName.family} ${l.fontName.style}`;
      stats.fonts[fk] = (stats.fonts[fk] ?? 0) + 1;
    }
    for (const c of l.children || []) count(c);
  })(tree);
  // Reverse completeness check: every rendered DOM text run (inside the
  // captured area) must have produced a TEXT layer in the tree.
  stats.missing = [];
  const doneText = new Set(consumedText);
  const vis = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while ((t = vis.nextNode())) {
    const p = t.parentElement;
    if (!t.textContent.trim() || !p || p.closest("svg, script, style, title") || !p.checkVisibility({ opacityProperty: true, visibilityProperty: true })) continue;
    const range = document.createRange();
    range.selectNodeContents(t);
    const rects = [...range.getClientRects()].filter((r) => r.width > 0 && r.height > 0 && (full || (r.bottom > 0 && r.top < height && r.right > 0 && r.left < width)));
    if (!rects.length || doneText.has(t) || doneText.has(p)) continue;
    stats.missing.push({ text: t.textContent.trim(), element: describe(p), x: round(rects[0].left), y: round(rects[0].top) });
  }
  tree.name = label;
  tree.width = width;
  // The frame is exactly the captured area: the viewport, or for full-page
  // scenes the screenshot's own height (at least one viewport tall even when
  // the body is shorter; fractional document heights round as Chromium does).
  tree.height = height;
  tree.clipsContent = true;
  const bg = getComputedStyle(document.body).backgroundColor;
  if (!tree.fills?.length) {
    const c = color(bg);
    tree.fills = [{ type: "SOLID", color: { r: c.r, g: c.g, b: c.b }, opacity: c.a }];
  }
  return { tree, stats };
}

const { server, origin } = await startStaticServer();
const browser = await chromium.launch();
const results = [];
try {
  for (const [board, vp, full, mode] of CAPTURES) {
    const name = captureName(board, vp, mode, full);
    if (filter && !name.includes(filter)) continue;
    const [width, height] = VIEWPORTS[vp];
    const touch = width < 1024;
    const context = await browser.newContext({
      viewport: { width, height }, deviceScaleFactor: 1, isMobile: touch, hasTouch: touch,
      reducedMotion: "reduce", locale: "zh-TW", ...(mode === "forced" ? { forcedColors: "active" } : {})
    });
    const page = await context.newPage();
    await page.goto(`${origin}/reference/${board}`, { waitUntil: "networkidle" });
    await page.evaluate(async (isFull) => {
      if (isFull) document.documentElement.dataset.capture = "full";
      await document.fonts.ready;
    }, full);
    await page.addStyleTag({ url: FIGMA_FONTS_CSS });
    // Figma's text engine has neither CJK punctuation trimming nor automatic
    // CJK/Latin spacing; switch both off so line breaks match.
    await page.addStyleTag({ content: "*, *::before, *::after { text-spacing-trim: space-all !important; text-autospace: no-autospace !important; }" });
    const pinned = await page.evaluate(pinFigmaFonts, { fonts: FONT_POLICY, styles: FIGMA_STYLES });
    const fontLoad = await page.evaluate(async () => {
      await document.fonts.ready;
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      const faces = [...document.fonts];
      return {
        loaded: [...new Set(faces.filter((f) => f.status === "loaded").map((f) => `${f.family.replace(/"/g, "")} ${f.weight}`))].sort(),
        errors: faces.filter((f) => f.status === "error").map((f) => `${f.family} ${f.weight}`)
      };
    });
    if (fontLoad.errors.length) throw new Error(`${name}: Figma font faces failed to load: ${fontLoad.errors.join(", ")}`);
    const before = await page.evaluate(measureLayout);
    await page.evaluate(prepareInPage);
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    const after = await page.evaluate(measureLayout);
    const moved = Object.entries(before).filter(([k, v]) => after[k] && after[k].slice(0, 4).some((n, i) => Math.abs(n - v[i]) > 1)).map(([k, v]) => `${v[4]} ${v.slice(0, 4).join(",")} → ${after[k].slice(0, 4).join(",")}`);
    const shot = await page.screenshot({ path: resolve(workDir, `${name}-html.png`), fullPage: full });
    const frameHeight = full ? shot.readUInt32BE(20) : height;
    await page.addScriptTag({ content: bundle });
    const label = sceneLabel(board, vp, mode, full);
    const { tree, stats } = await page.evaluate(serializeInPage, { label, width, height: frameHeight, full, styles: FIGMA_STYLES });
    await writeFile(resolve(workDir, `${name}.json`), JSON.stringify(tree));
    const record = { name, board, viewport: vp, fullPage: full, mode: mode ?? "default", label, size: { width, height: full ? tree.height : height }, ...stats, pinnedElements: pinned, preparationMoved: moved, unmatchedCount: stats.unmatched.length, missingCount: stats.missing.length };
    await writeFile(resolve(workDir, `${name}-capture.json`), JSON.stringify({ ...record, bundleSha, harnessDigest: harness, fontPolicy: FONT_POLICY, figmaStyles: FIGMA_STYLES, fontsCss: FIGMA_FONTS_CSS, fontLoad, chromium: browser.version() }, null, 2));
    results.push(record);
    console.log(`${name}: ${JSON.stringify(stats.types)} unmatched=${stats.unmatched.length} missing=${stats.missing.length} moved=${moved.length}`);
    await context.close();
  }
} finally {
  await browser.close();
  server.close();
}
if (!filter) await writeFile(resolve(workDir, "serialize-summary.json"), JSON.stringify(results, null, 2));
const incomplete = results.filter((r) => r.unmatchedCount || r.missingCount || r.preparationMoved.length);
if (incomplete.length) {
  console.error(`Incomplete serialization: ${incomplete.map((r) => `${r.name} (unmatched ${r.unmatchedCount}, missing ${r.missingCount}, moved ${r.preparationMoved.length})`).join(", ")}`);
  process.exitCode = 1;
}
