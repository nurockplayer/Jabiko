// Shu-ire SI-1 design verification (design tooling only; not a product test).
//
//   node docs/design/learning/tools/verify.mjs            # checks + captures
//   node docs/design/learning/tools/verify.mjs --no-capture
//
// 1. Token parity: every color role in tokens.json equals the harness CSS
//    custom property, in both themes.
// 2. Contrast: every contrastRequirements pair meets its minimum, both themes.
// 3. Board checks per board/state/viewport in Chromium: no horizontal
//    overflow; exactly one visible h1; >= 44px touch targets on compact
//    widths (inline text links exempt, WCAG 2.5.8); Japanese carriers inherit
//    lang="ja"; keyboard focus draws a >= 3px outline; reduced motion stops
//    mark animation; bar text never wraps and bar controls never overlap.
// 4. Captures the canonical review renders into ../renders (palette PNG).
//
// Writes ../verification/report.json. Exits non-zero on any failure.
import { chromium } from "@playwright/test";
import { readFile, writeFile, mkdir, readdir, unlink } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { startStaticServer } from "./static-server.mjs";
import { BOARDS, CAPTURES, VIEWPORTS, captureName } from "./scenes.mjs";

const HERE = fileURLToPath(new URL(".", import.meta.url));
const ROOT = resolve(HERE, "..");
const capture = !process.argv.includes("--no-capture");
const failures = [];
const report = { system: "jabiko-learning/shu-ire", revision: "SI-1", generatedAt: new Date().toISOString(), parity: [], contrast: [], boards: [], captures: [] };

// ------------------------------------------------------------ tokens
const tokens = JSON.parse(await readFile(resolve(ROOT, "tokens.json"), "utf8"));
const css = await readFile(resolve(ROOT, "reference/shu-ire.css"), "utf8");

function block(selector) {
  const start = css.indexOf(`${selector} {`);
  if (start < 0) throw new Error(`CSS block not found: ${selector}`);
  return css.slice(start, css.indexOf("}", start));
}
function props(text) {
  const out = {};
  for (const m of text.matchAll(/--si-([\w-]+):\s*([^;]+);/g)) out[m[1]] = m[2].trim();
  return out;
}
const cssThemes = { light: props(block(":root")), dark: props(block(':root[data-theme="dark"]')) };
const norm = (v) => v.replace(/\s+/g, "").toLowerCase();

for (const theme of ["light", "dark"]) {
  for (const [role, { value }] of Object.entries(tokens.color[theme])) {
    const name = role.replace(/\./g, "-");
    const actual = cssThemes[theme][name];
    const ok = actual !== undefined && norm(actual) === norm(value);
    report.parity.push({ theme, role, token: value, css: actual ?? null, ok });
    if (!ok) failures.push(`parity ${theme} ${role}: tokens ${value} vs css ${actual}`);
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
  const touch = width < 600;
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
        if (!visible(el) || el.closest(".si-visually-hidden")) continue;
        const s = getComputedStyle(el);
        const inlineLink = el.tagName === "A" && s.display === "inline" && !el.classList.length;
        if (inlineLink) continue;
        const r = el.getBoundingClientRect();
        if (el.matches("input[type='checkbox']")) {
          const label = el.closest("label");
          if (label && label.getBoundingClientRect().height >= 44) continue;
        }
        if (r.height < 44 - 0.5 || r.width < 44 - 0.5) small.push(`${el.tagName.toLowerCase()}.${[...el.classList].join(".")} ${Math.round(r.width)}x${Math.round(r.height)} "${(el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 24)}"`);
      }
    }
    const jaCarriers = ".si-prompt, .si-headword, .si-option, .si-ja, .si-ja-mincho, .si-ja-gothic, .si-ja-body, .ja, .si-cell-kanji, .pat";
    const missingLang = [...document.querySelectorAll(jaCarriers)]
      .filter((el) => visible(el) && /[぀-ヿ一-鿿]/.test(el.textContent || ""))
      .filter((el) => (el.closest("[lang]")?.getAttribute("lang") ?? "") !== "ja")
      .map((el) => `${el.className} "${(el.textContent || "").trim().slice(0, 16)}"`);
    const animated = [...document.querySelectorAll("[data-draw] .si-stroke")].filter((el) => getComputedStyle(el).animationName !== "none").length;
    // Bars are single-line chrome: no text run may wrap, and no two controls
    // or text items may overlap (a collapsed grid track lets them collide).
    const barCollisions = [];
    const label = (el) => `${el.tagName.toLowerCase()}.${[...el.classList].join(".")} "${(el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 16)}"`;
    for (const bar of document.querySelectorAll(".si-session-bar, .si-topbar, .si-bottombar")) {
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
      const items = [...bar.querySelectorAll("a, button, .si-num")].filter(visible);
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
    return { overflow, h1, small, missingLang, animated, barCollisions };
  }, compact);
}

async function focusCheck(page) {
  const results = [];
  for (let i = 0; i < 12; i += 1) {
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

const { server, origin } = await startStaticServer();
const browser = await chromium.launch();
report.environment = { chromium: browser.version(), platform: process.platform, node: process.version };
try {
  for (const [board, states] of BOARDS) {
    for (const state of states) {
      for (const vp of Object.keys(VIEWPORTS)) {
        const context = await contextFor(browser, vp);
        const page = await context.newPage();
        const url = `${origin}/reference/${board}${state ? `?state=${state}` : ""}`;
        await page.goto(url, { waitUntil: "networkidle" });
        await page.evaluate(() => document.fonts.ready);
        const compact = VIEWPORTS[vp][0] < 600;
        const result = await inspect(page, compact);
        const focus = vp === "1440x900" ? await focusCheck(page) : [];
        const entry = { board, state, viewport: vp, ...result, focusWithoutRing: focus.length };
        const problems = [];
        // D-07: on a phone, the marked options and the verdict line must be
        // visible without scrolling (above the sticky action row).
        if (board === "session.html" && state === "wrong" && vp === "390x844") {
          const fold = await page.evaluate(() => {
            const verdict = document.getElementById("verdict").getBoundingClientRect();
            const actions = document.querySelector("#drill .si-actions").getBoundingClientRect();
            return { verdictBottom: Math.round(verdict.bottom), actionsTop: Math.round(actions.top) };
          });
          entry.d07 = fold;
          if (fold.verdictBottom > fold.actionsTop) problems.push(`D-07 verdict line below the fold (${fold.verdictBottom} > ${fold.actionsTop})`);
        }
        if (result.overflow > 0) problems.push(`horizontal overflow ${result.overflow}px`);
        if (result.h1 !== 1) problems.push(`${result.h1} visible h1`);
        if (result.small.length) problems.push(`small targets: ${result.small.join("; ")}`);
        if (result.missingLang.length) problems.push(`missing lang=ja: ${result.missingLang.join("; ")}`);
        if (result.barCollisions.length) problems.push(`bar collisions: ${result.barCollisions.join("; ")}`);
        if (result.animated) problems.push(`${result.animated} mark strokes still animate under reduced motion`);
        if (focus.length) problems.push(`focus without 3px ring: ${focus.map((f) => `${f.tag}.${f.cls}`).join("; ")}`);
        entry.ok = problems.length === 0;
        entry.problems = problems;
        report.boards.push(entry);
        if (!entry.ok) failures.push(`${board}?state=${state} @${vp}: ${problems.join(" | ")}`);
        await context.close();
      }
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
      const name = `${captureName(board, vp, extra)}.png`;
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
  contrast: `${report.contrast.filter((c) => c.ok).length}/${report.contrast.length}`,
  boardChecks: `${report.boards.filter((b) => b.ok).length}/${report.boards.length}`,
  captures: report.captures.length
};
await mkdir(resolve(ROOT, "verification"), { recursive: true });
await writeFile(resolve(ROOT, "verification/report.json"), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report.summary));
if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
