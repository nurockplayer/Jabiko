// One-off sanity check: every exam question's expectedAnswer must appear in
// its own options[] list. Run with `node scripts/check-exam-options.mjs`.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const target = resolve(here, "..", "src", "domain", "examBlocks.ts");
const text = readFileSync(target, "utf8");
const blocks = text.split("examQuestion({").slice(1);

let bad = 0;
let seenIds = new Set();
for (let i = 0; i < blocks.length; i++) {
  const blk = blocks[i];
  const end = blk.indexOf("})");
  const body = blk.slice(0, end);
  const idMatch = body.match(/id:\s*"([^"]+)"/);
  const expMatch = body.match(/expectedAnswer:\s*"((?:[^"\\]|\\.)*)"/);
  const optsMatch = body.match(/options:\s*\[([\s\S]*?)\]/);
  // Fail loudly on unparseable blocks so a malformed entry can't slip
  // past the guard silently. Report which fields were missing and the
  // id if we managed to extract it.
  if (!idMatch || !expMatch || !optsMatch) {
    const missing = [
      !idMatch && "id",
      !expMatch && "expectedAnswer",
      !optsMatch && "options"
    ]
      .filter(Boolean)
      .join(", ");
    const idHint = idMatch ? idMatch[1] : `block #${i + 1}`;
    console.log(`UNPARSEABLE ${idHint}: missing field(s) -> ${missing}`);
    bad++;
    continue;
  }
  const id = idMatch[1];
  const expected = expMatch[1];
  const opts = optsMatch[1];
  if (seenIds.has(id)) {
    console.log("DUPLICATE id:", id);
    bad++;
  }
  seenIds.add(id);
  if (!opts.includes('"' + expected + '"')) {
    console.log("MISSING expected in options:", id, "->", JSON.stringify(expected));
    bad++;
  }
}
console.log(`checked ${blocks.length} entries; ${bad} problem(s)`);
process.exit(bad ? 1 : 0);
