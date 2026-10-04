// Render Jabiko JT-1 reference boards to PNG (design tooling only).
//
//   node docs/design/jabiko/tools/capture.mjs [--out DIR] [--full] board[?query]@WxH ...
//
// Example: node docs/design/jabiko/tools/capture.mjs session.html?state=wrong@390x844
// Viewports below 600px wide are emulated as a touch phone.
import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { startStaticServer } from "./static-server.mjs";

const args = process.argv.slice(2);
let out = resolve(fileURLToPath(new URL("../renders", import.meta.url)));
let fullPage = false;
const jobs = [];
for (let i = 0; i < args.length; i += 1) {
  if (args[i] === "--out") out = resolve(args[(i += 1)]);
  else if (args[i] === "--full") fullPage = true;
  else jobs.push(args[i]);
}

export function captureName(board, width, height) {
  const [file, query = ""] = board.split("?");
  const q = query ? `-${query.replace(/[=&]/g, "-")}` : "";
  return `${file.replace(/\.html$/, "")}${q}-${width}x${height}.png`;
}

const { server, origin } = await startStaticServer();
const browser = await chromium.launch();
await mkdir(out, { recursive: true });
try {
  for (const job of jobs) {
    const [board, size] = job.split("@");
    const [width, height] = size.split("x").map(Number);
    const touch = width < 600;
    const context = await browser.newContext({
      viewport: { width, height },
      deviceScaleFactor: 1,
      isMobile: touch,
      hasTouch: touch,
      reducedMotion: "reduce",
      locale: "zh-TW"
    });
    const page = await context.newPage();
    await page.goto(`${origin}/reference/${board}`, { waitUntil: "networkidle" });
    await page.evaluate(async (full) => {
      if (full) document.documentElement.dataset.capture = "full";
      await document.fonts.ready;
    }, fullPage);
    const file = resolve(out, captureName(board, width, height));
    await page.screenshot({ path: file, fullPage });
    console.log(file);
    await context.close();
  }
} finally {
  await browser.close();
  server.close();
}
