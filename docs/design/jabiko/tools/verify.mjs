// Jabiko JT-1 design verification (design tooling only; not a product test).
//
//   node docs/design/jabiko/tools/verify.mjs            # checks + captures
//   node docs/design/jabiko/tools/verify.mjs --no-capture
//
// 1. Token parity: every color role in tokens.json equals the harness CSS
//    custom property, in both themes; roles sourced "tachiko" equal the
//    approved Tachiko profile value recorded in FOUNDATION.md.
// 2. Contrast: every contrastRequirements pair meets its minimum, both themes.
// 3. Board checks per board/state/viewport in Chromium: no horizontal
//    overflow; exactly one visible h1; >= 44px touch targets below 600px
//    (inline text links exempt, WCAG 2.5.8); Japanese carriers inherit
//    lang="ja"; keyboard focus draws a >= 3px outline; bar text never wraps
//    and bar controls never overlap.
// 4. D-07: answer options do not move between the unanswered and answered
//    states, and at 390x844 the verdict line sits above the sticky actions.
// 5. Captures the canonical review renders into ../renders (palette PNG).
//
// Writes ../verification/report.json. Exits non-zero on any failure.
import { chromium } from "@playwright/test";
import { readFile, writeFile, mkdir, readdir, unlink } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { startStaticServer } from "./static-server.mjs";
import { BOARDS, CAPTURES, VIEWPORTS, SPECIMEN_BOARDS, captureName } from "./scenes.mjs";

const HERE = fileURLToPath(new URL(".", import.meta.url));
const ROOT = resolve(HERE, "..");
const capture = !process.argv.includes("--no-capture");
const failures = [];
const report = { system: "jabiko", revision: "JT-1", generatedAt: new Date().toISOString(), parity: [], tachikoParity: [], contrast: [], boards: [], geometry: [], captures: [] };

// Approved Tachiko Sheet values consumed by JT-1 (FOUNDATION.md §2). A role
// marked source "tachiko" or "tachiko-protected" in tokens.json must equal
// this snapshot; a later Tachiko change does not silently move Jabiko.
const TACHIKO_SNAPSHOT = {
  "surface.app": "#FFFFFF", "surface.chrome": "#F8F8FC", "surface.chrome.tint": "#F0EDFD", "surface.content": "#FFFFFF",
  "surface.inset": "#F5F6F9", "surface.sunken": "#ECEEF4", "text.primary": "#252735", "text.secondary": "#646879",
  "text.onTint": "#5B6072", "text.disabled": "#9094A1", "text.link": "#5542B5", "border.subtle": "#DFE2EA", "border.control": "#818798",
  "action.primary.background": "#6350D2", "action.primary.hover": "#5541C2", "action.primary.pressed": "#4936AB",
  "action.primary.foreground": "#FFFFFF", "accent.foreground": "#5542B5", "accent.background": "#F0EDFD",
  "selection.edge": "#6551CE", "focus.ring": "#6551CE",
  "status.warning.ink": "#865015", "status.warning.background": "#FFF3DD", "status.error.ink": "#A02D42",
  "status.error.background": "#FFF0F3", "status.success.ink": "#206C4E", "status.success.background": "#E9F6F0",
  "inverse.background": "#252735", "inverse.foreground": "#FFFFFF", "scrim": "#252735"
};

// ------------------------------------------------------------ tokens
const tokens = JSON.parse(await readFile(resolve(ROOT, "tokens.json"), "utf8"));
const css = await readFile(resolve(ROOT, "reference/jabiko.css"), "utf8");

function block(selector) {
  const start = css.indexOf(`${selector} {`);
  if (start < 0) throw new Error(`CSS block not found: ${selector}`);
  return css.slice(start, css.indexOf("}", start));
}
function props(text) {
  const out = {};
  for (const m of text.matchAll(/--jt-([\w-]+):\s*([^;]+);/g)) out[m[1]] = m[2].trim();
  return out;
}
const cssThemes = { light: props(block(":root")), dark: props(block(':root[data-theme="dark"]')) };
const norm = (v) => v.replace(/\s+/g, "").toLowerCase();

for (const theme of ["light", "dark"]) {
  for (const [role, { value, source }] of Object.entries(tokens.color[theme])) {
    const name = role.replace(/\./g, "-");
    const actual = cssThemes[theme][name];
    const ok = actual !== undefined && norm(actual) === norm(value);
    report.parity.push({ theme, role, token: value, css: actual ?? null, ok });
    if (!ok) failures.push(`parity ${theme} ${role}: tokens ${value} vs css ${actual}`);
    if (theme === "light" && (source === "tachiko" || source === "tachiko-protected")) {
      const expected = TACHIKO_SNAPSHOT[role];
      const tOk = expected !== undefined && norm(expected) === norm(value);
      report.tachikoParity.push({ role, tachiko: expected ?? null, jabiko: value, ok: tOk });
      if (!tOk) failures.push(`tachiko parity ${role}: snapshot ${expected} vs tokens ${value}`);
    }
  }
}

// ---------------------------------------------------------- contrast
function channel(c) {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}
function luminance(hex) {
  const h = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}
function ratio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
for (const theme of ["light", "dark"]) {
  for (const req of tokens.contrastRequirements) {
    const fg = tokens.color[theme][req.fg].value;
    const bg = tokens.color[theme][req.bg].value;
    const r = Math.round(ratio(fg, bg) * 100) / 100;
    const ok = r >= req.min;
    report.contrast.push({ theme, fg: req.fg, bg: req.bg, fgValue: fg, bgValue: bg, ratio: r, min: req.min, use: req.use, ok });
    if (!ok) failures.push(`contrast ${theme} ${req.fg} on ${req.bg}: ${r} < ${req.min}`);
  }
}

// ------------------------------------------------------------ boards
async function contextFor(browser, vp, options = {}) {
  const [width, height] = VIEWPORTS[vp];
  // Phones and tablets (< 1024) are emulated as touch devices, so coarse-pointer rules apply.
  const touch = width < 1024;
  return browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, isMobile: touch, hasTouch: touch, reducedMotion: "reduce", locale: "zh-TW", ...options });
}

async function inspect(page, compact) {
  return page.evaluate((isCompact) => {
    const visible = (el) => {
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && !el.closest("[hidden]");
    };
    const overflow = document.documentElement.scrollWidth - window.innerWidth;
    const h1 = [...document.querySelectorAll("h1")].filter(visible).length;
    const small = [];
    if (isCompact) {
      for (const el of document.querySelectorAll("a[href], button, input, textarea, select, [role='button'], [role='link']")) {
        if (!visible(el) || el.closest(".jt-visually-hidden") || el.classList.contains("jt-skip")) continue;
        const s = getComputedStyle(el);
        const inlineLink = el.tagName === "A" && s.display === "inline";
        if (inlineLink) continue;
        if (el.matches("input[type='checkbox']")) {
          const label = el.closest("label");
          if (label && label.getBoundingClientRect().height >= 44) continue;
        }
        const r = el.getBoundingClientRect();
        if (r.height < 44 - 0.5 || r.width < 44 - 0.5) small.push(`${el.tagName.toLowerCase()}.${[...el.classList].join(".")} ${Math.round(r.width)}x${Math.round(r.height)} "${(el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 24)}"`);
      }
    }
    const jaCarriers = ".jt-prompt, .jt-headword, .jt-line, .jt-option-text:not(.jt-option-text-ui), .jt-mincho, .jt-ja-body, .jt-cell-glyph, .jt-qtype, .jt-place-name, .scene-place, .jt-furi";
    const missingLang = [...document.querySelectorAll(jaCarriers)]
      .filter((el) => visible(el) && /[぀-ヿ一-鿿]/.test(el.textContent || ""))
      .filter((el) => (el.closest("[lang]")?.getAttribute("lang") ?? "") !== "ja")
      .map((el) => `${el.className} "${(el.textContent || "").trim().slice(0, 16)}"`);
    const barCollisions = [];
    const label = (el) => `${el.tagName.toLowerCase()}.${[...el.classList].join(".")} "${(el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 16)}"`;
    for (const bar of document.querySelectorAll(".jt-session-bar, .jt-header, .jt-tabbar")) {
      if (!visible(bar)) continue;
      const walker = document.createTreeWalker(bar, NodeFilter.SHOW_TEXT);
      let t;
      while ((t = walker.nextNode())) {
        if (!t.textContent.trim() || !visible(t.parentElement)) continue;
        const range = document.createRange();
        range.selectNodeContents(t);
        const tops = new Set([...range.getClientRects()].filter((r) => r.width > 0).map((r) => Math.round(r.top)));
        if (tops.size > 1) barCollisions.push(`wrapped ${label(t.parentElement)}`);
      }
      const items = [...bar.querySelectorAll("a, button, .jt-progress-text")].filter(visible).filter((el) => !el.classList.contains("jt-skip"));
      for (let i = 0; i < items.length; i += 1) {
        for (let j = i + 1; j < items.length; j += 1) {
          const [a, b] = [items[i], items[j]];
          if (a.contains(b) || b.contains(a)) continue;
          const [ra, rb] = [a.getBoundingClientRect(), b.getBoundingClientRect()];
          const ox = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left);
          const oy = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
          if (ox > 0.5 && oy > 0.5) barCollisions.push(`overlap ${label(a)} × ${label(b)}`);
        }
      }
    }
    // Every visible control needs an accessible name that does not depend on
    // text hidden at this width (aria-label / aria-labelledby / rendered text).
    const unnamed = [];
    for (const el of document.querySelectorAll("a[href], button, input:not([type='hidden']), textarea, select")) {
      if (!visible(el) || el.classList.contains("jt-skip")) continue;
      const byLabel = el.getAttribute("aria-label")?.trim();
      const byRef = (el.getAttribute("aria-labelledby") || "").split(/\s+/).filter(Boolean).map((id) => document.getElementById(id)?.textContent?.trim()).join("");
      const byText = (el.innerText || "").trim();
      const byFieldLabel = el.id && document.querySelector(`label[for="${el.id}"]`)?.textContent?.trim();
      const byWrap = el.closest("label")?.innerText?.trim();
      if (!byLabel && !byRef && !byText && !byFieldLabel && !byWrap) unnamed.push(`${el.tagName.toLowerCase()}.${[...el.classList].join(".")}`);
    }
    return { overflow, h1, small, missingLang, barCollisions, unnamed };
  }, compact);
}

async function focusCheck(page) {
  const results = [];
  for (let i = 0; i < 14; i += 1) {
    await page.keyboard.press("Tab");
    const info = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const s = getComputedStyle(el);
      return { tag: el.tagName.toLowerCase(), cls: el.className, width: parseFloat(s.outlineWidth), style: s.outlineStyle };
    });
    if (info) results.push(info);
  }
  return results.filter((f) => f.style === "none" || f.width < 3);
}

async function optionRects(page) {
  return page.evaluate(() => [...document.querySelectorAll("#drill .jt-option, #drill .jt-session-actions .jt-btn-primary")].map((el) => {
    const r = el.getBoundingClientRect();
    return [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)];
  }));
}

const { server, origin } = await startStaticServer();
const browser = await chromium.launch();
report.environment = { chromium: browser.version(), platform: process.platform, node: process.version };
try {
  for (const [board, states] of BOARDS) {
    for (const state of states) {
      for (const vp of Object.keys(VIEWPORTS)) {
        const context = await contextFor(browser, vp);
        const page = await context.newPage();
        await page.goto(`${origin}/reference/${board}${state ? `?state=${state}` : ""}`, { waitUntil: "networkidle" });
        await page.evaluate(() => document.fonts.ready);
        // Touch-target floor applies to every touch-emulated width (< 1024).
        const compact = VIEWPORTS[vp][0] < 1024 && !SPECIMEN_BOARDS.has(board);
        const result = await inspect(page, compact);
        const focus = vp === "1440x900" && !SPECIMEN_BOARDS.has(board) ? await focusCheck(page) : [];
        const entry = { board, state, viewport: vp, ...result, focusWithoutRing: focus.length };
        const problems = [];
        if (board === "session.html" && state === "wrong" && vp === "390x844") {
          const fold = await page.evaluate(() => {
            const verdict = document.getElementById("verdict").getBoundingClientRect();
            const actions = document.querySelector("#drill .jt-session-actions").getBoundingClientRect();
            return { verdictBottom: Math.round(verdict.bottom), actionsTop: Math.round(actions.top) };
          });
          entry.d07 = fold;
          if (fold.verdictBottom > fold.actionsTop) problems.push(`D-07 verdict line below the sticky actions (${fold.verdictBottom} > ${fold.actionsTop})`);
        }
        if (result.overflow > 0) problems.push(`horizontal overflow ${result.overflow}px`);
        if (result.h1 !== 1) problems.push(`${result.h1} visible h1`);
        if (result.small.length) problems.push(`small targets: ${result.small.join("; ")}`);
        if (result.missingLang.length) problems.push(`missing lang=ja: ${result.missingLang.join("; ")}`);
        if (result.barCollisions.length) problems.push(`bar collisions: ${result.barCollisions.join("; ")}`);
        if (result.unnamed.length) problems.push(`controls without an accessible name: ${result.unnamed.join("; ")}`);
        if (focus.length) problems.push(`focus without 3px ring: ${focus.map((f) => `${f.tag}.${f.cls}`).join("; ")}`);
        entry.ok = problems.length === 0;
        entry.problems = problems;
        report.boards.push(entry);
        if (!entry.ok) failures.push(`${board}?state=${state} @${vp}: ${problems.join(" | ")}`);
        await context.close();
      }
    }
  }

  // D-07 geometry: options and Next keep their exact boxes after answering,
  // for short and long content, in zh-Hant and English.
  for (const variant of ["", "&fixture=long", "&lang=en", "&fixture=long&lang=en"]) {
    for (const vp of Object.keys(VIEWPORTS)) {
      const rects = {};
      for (const state of ["q", "correct", "wrong", "revealed"]) {
        const context = await contextFor(browser, vp);
        const page = await context.newPage();
        await page.goto(`${origin}/reference/session.html?state=${state}${variant}`, { waitUntil: "networkidle" });
        await page.evaluate(() => document.fonts.ready);
        rects[state] = await optionRects(page);
        await context.close();
      }
      // All five boxes: the four options and Next.
      const moved = ["correct", "wrong", "revealed"].filter((s) => rects[s].length !== 5 || JSON.stringify(rects[s]) !== JSON.stringify(rects.q));
      const ok = moved.length === 0;
      report.geometry.push({ viewport: vp, variant: variant || "default", ok, moved });
      if (!ok) failures.push(`D-07 options moved after answering @${vp}${variant}: ${moved.join(", ")}`);
    }
  }

  if (capture) {
    const outDir = resolve(ROOT, "renders");
    await mkdir(outDir, { recursive: true });
    for (const f of await readdir(outDir)) if (f.endsWith(".png")) await unlink(resolve(outDir, f));
    for (const [board, vp, fullPage, extra] of CAPTURES) {
      const context = await contextFor(browser, vp, extra === "forced" ? { forcedColors: "active" } : {});
      const page = await context.newPage();
      await page.goto(`${origin}/reference/${board}`, { waitUntil: "networkidle" });
      await page.evaluate(async (full) => {
        if (full) document.documentElement.dataset.capture = "full";
        await document.fonts.ready;
      }, fullPage);
      const raw = await page.screenshot({ fullPage });
      const name = `${captureName(board, vp, extra, fullPage)}.png`;
      await sharp(raw).png({ palette: true, quality: 90, effort: 8 }).toFile(resolve(outDir, name));
      report.captures.push({ file: `renders/${name}`, board, viewport: vp, fullPage, mode: extra ?? "default" });
      await context.close();
    }
  }
} finally {
  await browser.close();
  server.close();
}

report.failures = failures;
report.summary = {
  parity: `${report.parity.filter((p) => p.ok).length}/${report.parity.length}`,
  tachikoParity: `${report.tachikoParity.filter((p) => p.ok).length}/${report.tachikoParity.length}`,
  contrast: `${report.contrast.filter((c) => c.ok).length}/${report.contrast.length}`,
  boardChecks: `${report.boards.filter((b) => b.ok).length}/${report.boards.length}`,
  geometry: `${report.geometry.filter((g) => g.ok).length}/${report.geometry.length}`,
  captures: report.captures.length
};
await mkdir(resolve(ROOT, "verification"), { recursive: true });
await writeFile(resolve(ROOT, "verification/report.json"), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report.summary));
if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
