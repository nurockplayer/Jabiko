// One-off / on-demand image build step. Reads the hi-res hero PNG from
// `assets/hero-source.png` (NOT shipped, lives outside `public/`) and
// emits two optimized files into `public/`:
//
//   - public/hero.webp       — in-app hero <img>. Resized to 1600x900,
//                              WebP q78. WebP is supported in every
//                              evergreen browser, so no PNG fallback.
//
//   - public/og-image.png    — social-preview image. Cropped to the
//                              canonical 1200x630 OG/Twitter Card size
//                              and emitted as PNG so older preview
//                              fetchers (LINE / older Slack / some
//                              feed readers) that don't read WebP still
//                              get something.
//
// The script is idempotent: re-run any time you replace the source.
// Add a new size by appending a `.toFile()` chain below.
//
// Run with `node scripts/optimize-hero.mjs` (or `pnpm optimize-hero`).
import { readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import sharp from "sharp";

const here = dirname(fileURLToPath(import.meta.url));
const sourcePath = resolve(here, "..", "assets", "hero-source.png");
const publicDir = resolve(here, "..", "public");
const webpPath = resolve(publicDir, "hero.webp");
const ogPath = resolve(publicDir, "og-image.png");

const sourceBytes = readFileSync(sourcePath);
const sourceSize = sourceBytes.length;

// In-app hero: 1600x900 WebP q78. The home page displays it at <=940px
// wide and max 280px tall, so 1600x900 is roughly 2x retina headroom.
// Going higher than 1600 buys nothing visible and just inflates the
// payload. fit:cover keeps the 16:9 aspect; the source is already 16:9
// so this is effectively a resize without distortion.
await sharp(sourceBytes)
  .resize(1600, 900, { fit: "cover", position: "center" })
  .webp({ quality: 78, effort: 5 })
  .toFile(webpPath);

// OG image: 1200x630 PNG. Center-crop because OG is 1.905 while source
// is 1.778, so we lose ~7% from the sides. The still-life subject sits
// in the middle band, so a center crop loses nothing important.
// compressionLevel 9 trades a few hundred ms of build time for ~15%
// smaller output -- worth it because this file is only re-generated
// when the source changes.
await sharp(sourceBytes)
  .resize(1200, 630, { fit: "cover", position: "center" })
  .png({ compressionLevel: 9 })
  .toFile(ogPath);

const webpSize = statSync(webpPath).size;
const ogSize = statSync(ogPath).size;

const kb = (n) => `${(n / 1024).toFixed(0)} KB`;
console.log(`source              ${kb(sourceSize).padStart(8)}  (assets/hero-source.png, NOT shipped)`);
console.log(`-> public/hero.webp ${kb(webpSize).padStart(8)}  (1600x900, app <img>)`);
console.log(`-> public/og-image  ${kb(ogSize).padStart(8)}  (1200x630, og:image meta)`);
