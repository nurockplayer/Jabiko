// Debug helper (design tooling only): list elements whose right edge passes
// the viewport for one board, using the same context as verify.mjs.
//   node docs/design/jabiko/tools/overflow-probe.mjs 'sets.html?state=mock' 768 1024
import { chromium } from "@playwright/test";
import { startStaticServer } from "./static-server.mjs";

const [board, w = "390", h = "844"] = process.argv.slice(2);
const width = Number(w);
const touch = width < 1024;
const { server, origin } = await startStaticServer();
const browser = await chromium.launch();
try {
  const context = await browser.newContext({ viewport: { width, height: Number(h) }, deviceScaleFactor: 1, isMobile: touch, hasTouch: touch, reducedMotion: "reduce", locale: "zh-TW" });
  const page = await context.newPage();
  await page.goto(`${origin}/reference/${board}`, { waitUntil: "networkidle" });
  const out = await page.evaluate(() => {
    const vw = window.innerWidth;
    const rows = [...document.querySelectorAll("body *")]
      .map((el) => [el, el.getBoundingClientRect()])
      .filter(([, r]) => r.right > vw + 0.5 && r.width > 0)
      .slice(0, 15)
      .map(([el, r]) => `${el.tagName.toLowerCase()}.${[...el.classList].join(".")} right=${Math.round(r.right)} w=${Math.round(r.width)}`);
    for (const el of document.querySelectorAll("body, body *")) { if (el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflowX !== "auto") rows.push(`inner-overflow ${el.tagName.toLowerCase()}.${[...el.classList].join(".")} ${el.scrollWidth}>${el.clientWidth}`); }
    rows.push(`scrollWidth=${document.documentElement.scrollWidth} inner=${vw}`);
    return rows;
  });
  console.log(out.join("\n"));
} finally {
  await browser.close();
  server.close();
}
