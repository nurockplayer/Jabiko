// ops/analytics — terminal reporting helpers. Every token-bearing value must
// pass through redact() before reaching console output here.

import { GATE_DEFS } from "./creds.mjs";

export function section(title) {
  console.log(`\n== ${title} ==`);
}

export function sub(title) {
  console.log(`\n-- ${title} --`);
}

export function bullet(text, pad = "  ") {
  console.log(`${pad}• ${text}`);
}

export function ok(text) {
  console.log(`  ✓ ${text}`);
}

export function warn(text) {
  console.log(`  ⚠ ${text}`);
}

export function err(text) {
  console.log(`  ✗ ${text}`);
}

/** Print one HUMAN_GATE with the exact action/scope/unlocks contract. */
export function printGate(code, extra = "") {
  const g = GATE_DEFS[code];
  console.log(`\nHUMAN_GATE:${code}`);
  if (!g) {
    console.log("  (unknown gate code)");
    return;
  }
  console.log(`  Action:  ${g.action}`);
  console.log(`  Scope:   ${g.scope}`);
  console.log(`  Unlocks: ${g.unlocks}`);
  if (extra) console.log(`  Note:    ${extra}`);
}

export function printFindings(findings, { prefix = "  " } = {}) {
  if (!findings.length) {
    ok("Desired state converged — no diff.");
    return;
  }
  for (const f of findings) {
    const mark = f.severity === "blocking" ? "✗" : "⚠";
    console.log(`${prefix}${mark} ${f.code}${f.event ? ` [${f.event}]` : ""}${f.component ? ` [${f.component}]` : ""}${f.actual !== undefined ? ` (actual=${f.actual})` : ""}${f.expected !== undefined ? ` (expected=${f.expected})` : ""}`);
    if (f.message) console.log(`${prefix}    ${f.message}`);
  }
}
