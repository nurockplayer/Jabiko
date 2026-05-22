// One-off: strip the leading "N1 " / "N2 " / "N3 " from every promptLabel
// in examBlocks.ts. The internal `level` field (used for level-filtering
// the pool) stays untouched -- only the label shown to the user changes,
// so the UI no longer surfaces JLPT level (which conflicts with the
// long-standing "no difficulty grading" UX decision).

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const target = resolve(here, "..", "src", "domain", "examBlocks.ts");
const src = readFileSync(target, "utf8");

let changed = 0;
const out = src.replace(
  /(promptLabel:\s*")(N[1-3]\s+)([^"]+)(")/g,
  (_, pre, _level, rest, post) => {
    changed += 1;
    return `${pre}${rest}${post}`;
  }
);

writeFileSync(target, out, "utf8");
console.log(`Stripped level prefix from ${changed} promptLabel(s).`);
