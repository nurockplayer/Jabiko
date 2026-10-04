// Fixed facts of the Jabiko JT-1 Figma authority, shared by the serializer,
// the importer, the registry writer and the Figma parity check (design
// tooling only; nothing here is imported by src/).
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const DESIGN_ROOT = resolve(fileURLToPath(new URL("../..", import.meta.url)));

// The canonical Jabiko Figma file (created by the founder, 2026-10-01). The
// bridge addresses it by a per-session "unsaved-…" key, never by this key.
export const FIGMA_FILE = {
  name: "Jabiko Learning — Shu-ire",
  key: "h4XBtIaL5XYsBOxGVTHmc4",
  url: "https://www.figma.com/design/h4XBtIaL5XYsBOxGVTHmc4/Jabiko-Learning-%E2%80%94-Shu-ire"
};

// Frame status prefix. Renamed to "JT-1 APPROVED" only after independent
// review accepts the authority.
export const FRAME_STATUS = "JT-1 CANDIDATE";

// html-figma 0.3.1 browser bundle used by the Tachiko #71 serializer.
export const HTML_FIGMA_BUNDLE_SHA256 = "4731bb508e22c9887a03e9701b5e14e1771d9868e5b174313994f07b95313eca";

// Figma faces standing in for the harness's system stacks (the Noto faces are
// the documented fallbacks of those stacks; Inter replaces system-ui).
export const FONT_POLICY = {
  mincho: "Noto Serif JP",
  japanese: "Noto Sans JP",
  chinese: "Noto Sans TC",
  latin: "Inter"
};

// Styles Figma actually offers for each face, probed through the bridge on
// 2026-10-01 (an unknown style name silently imports as Regular, so the
// mapping is explicit). Noto Sans JP/TC have no 600 there; 600 resolves to
// Bold, as CSS weight matching does when 600 is missing.
export const FIGMA_STYLES = {
  Inter: { 300: "Light", 400: "Regular", 500: "Medium", 600: "Semi Bold", 700: "Bold", 900: "Black" },
  "Noto Sans JP": { 400: "Regular", 500: "Medium", 700: "Bold" },
  "Noto Sans TC": { 400: "Regular", 500: "Medium", 700: "Bold" },
  "Noto Serif JP": { 400: "Regular", 500: "Medium", 600: "SemiBold", 700: "Bold" }
};

// Serializer only: the reference harness itself uses system faces and fetches
// nothing. To make browser line breaks equal Figma's, each scene is re-laid
// out in the exact Figma faces before capture.
export const FIGMA_FONTS_CSS = "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;900&family=Noto+Sans+JP:wght@400;500;700&family=Noto+Sans+TC:wght@400;500;700&family=Noto+Serif+JP:wght@400;500;600;700&display=block";

// Upper bound for the per-frame visual diff (see figma-registry.json
// visualMetric). The accepted import of 2026-10-01 measured median 0.0135 and
// max 0.0422 (talk · intro · 390×844), all text rasterization and small CJK
// baseline offsets; 0.05 leaves ~20% headroom (VERIFICATION.md).
export const VISUAL_LIMIT = 0.05;

// Non-token paints allowed in frames: the Jabiko mascot's own art colors
// (src/components/JabikoMark.tsx), used only inside the brand mark.
export const BRAND_ART_COLORS = ["#28385a", "#f0a49c", "#fdf6ea"];

// SHA-256 over everything a scene is rendered from (reference/* and
// tokens.json). Recorded at serialization; the parity check recomputes it so
// a harness edit without a Figma re-import fails instead of drifting.
export function harnessDigest() {
  const files = [...readdirSync(resolve(DESIGN_ROOT, "reference")).map((f) => `reference/${f}`), "tokens.json"].sort();
  const hash = createHash("sha256");
  for (const file of files) hash.update(`${file}\0`).update(readFileSync(resolve(DESIGN_ROOT, file))).update("\0");
  return hash.digest("hex");
}
