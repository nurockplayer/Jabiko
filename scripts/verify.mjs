#!/usr/bin/env node
// =============================================================================
// verify.mjs — run the verification level implied by the current change set
// (issue #760 tiered verification).
//
//   pnpm verify                 # L1/L2 affected (or L3 if the change demands it)
//   pnpm verify --dry-run       # print the plan without running anything
//   pnpm verify --target <f>    # L0: run the co-located test for one source file
//   pnpm verify --level 3       # force L3 (full: lint + test + build)
//   pnpm verify --base <ref>    # git base for changed-path detection (default origin/main)
//
// Successful runs print a concise summary; failures print the failing command
// and its tail. Full-suite logs are only expanded for failing gates.
// =============================================================================

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  selectVerification,
  siblingTestCandidates
} from "./select-verification.mjs";

// Run only when executed directly (`node scripts/verify.mjs`), never on import
// (Vitest imports this module to unit-test the exported helpers).
const isMain =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

// ---------------------------------------------------------------------------
// Git changed-path detection (injectable for tests).
// Union of (commits on this branch vs <base>) + (working-tree modified/untracked).
// ---------------------------------------------------------------------------
export function collectChangedPaths(execFn, base) {
  const paths = new Set();
  const branch = execFn(`git diff --name-only --diff-filter=ACMRD ${base}...HEAD`);
  const worktree = execFn(`git ls-files --modified --others --exclude-standard`);
  for (const chunk of [branch, worktree]) {
    if (!chunk) continue;
    for (const line of chunk.split("\n")) {
      const trimmed = line.trim();
      if (trimmed) paths.add(trimmed);
    }
  }
  return [...paths].sort();
}

// ---------------------------------------------------------------------------
// Assemble the concrete command list from a plan (injectable exists for tests).
// Returns [{ kind: "vitest", files } | { kind: "gate", cmd }] in run order.
// ---------------------------------------------------------------------------
export function commandsFor(plan, { exists = existsSync } = {}) {
  const out = [];
  if (plan.level === "L3") {
    for (const cmd of plan.commands) out.push({ kind: "gate", cmd });
    return out;
  }
  const existing = (plan.tests ?? []).filter((t) => exists(t));
  if (existing.length > 0) {
    out.push({ kind: "vitest", files: existing });
  }
  for (const cmd of plan.commands ?? []) out.push({ kind: "gate", cmd });
  return out;
}

function display(item) {
  return item.kind === "vitest"
    ? `pnpm vitest run ${item.files.join(" ")}`
    : `pnpm ${item.cmd}`;
}

function run(cmdStr) {
  const r = spawnSync(cmdStr, {
    shell: true,
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf8"
  });
  return { ok: r.status === 0, code: r.status, out: `${r.stdout ?? ""}${r.stderr ?? ""}` };
}

function tail(text, lines = 30) {
  const split = text.split("\n").filter((l) => l.trim().length > 0);
  return split.slice(-lines).join("\n");
}

// ---------------------------------------------------------------------------
// arg parsing
// ---------------------------------------------------------------------------
function parseArgs(argv) {
  const opts = { dryRun: false, base: "origin/main", target: null, level: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") opts.dryRun = true;
    else if (a === "--base") opts.base = argv[++i];
    else if (a === "--target") opts.target = argv[++i];
    else if (a === "--level") opts.level = argv[++i];
    else if (a === "--help" || a === "-h") opts.help = true;
    else throw new Error(`unknown arg: ${a}`);
  }
  return opts;
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------
function main() {
  let opts;
  try {
    opts = parseArgs(process.argv.slice(2));
  } catch (e) {
    console.error(e.message);
    process.exit(2);
  }
  if (opts.help) {
    console.log("Usage: node scripts/verify.mjs [--dry-run] [--base <ref>] [--target <file>] [--level 3]");
    return;
  }

  const execFn = (cmd) => {
    const r = spawnSync(cmd, { shell: true, encoding: "utf8" });
    return r.status === 0 ? (r.stdout || "").trim() : null;
  };

  // ---- L0: single-file targeted ------------------------------------------
  if (opts.target) {
    const candidates = siblingTestCandidates(opts.target);
    const existing = candidates.filter((t) => existsSync(t));
    if (existing.length === 0) {
      console.error(
        `L0: no co-located test for ${opts.target} (tried ${candidates.join(", ") || "—"}). ` +
          "Run `pnpm verify` (affected) or L3 (`pnpm verify --level 3`)."
      );
      process.exit(2);
    }
    console.log(`L0 targeted: ${opts.target}`);
    const item = { kind: "vitest", files: existing };
    const cmd = display(item);
    if (opts.dryRun) {
      console.log(`  → ${cmd}`);
      return;
    }
    console.log(`  → ${cmd}`);
    const r = run(cmd);
    if (!r.ok) {
      console.error(`${cmd}\n  FAILED (exit ${r.code})\n${tail(r.out)}`);
      process.exit(r.code ?? 1);
    }
    console.log("  ✓ pass");
    return;
  }

  // ---- L1/L2 affected (auto-escalating to L3) -----------------------------
  if (opts.level === "3") {
    const plan = { level: "L3", commands: ["lint", "test", "build"], tests: [], regenerate: [], reasons: [] };
    execute(plan, opts.dryRun);
    return;
  }

  const changed = collectChangedPaths(execFn, opts.base);
  if (changed.length === 0) {
    console.log("No changed files detected (base = " + opts.base + "). Nothing to verify.");
    return;
  }

  const plan = selectVerification(changed);
  execute(plan, opts.dryRun, changed);
}

function execute(plan, dryRun, changed) {
  console.log(`Verification: ${plan.level}${changed ? ` (${changed.length} changed file(s))` : ""}`);
  for (const reason of plan.reasons) console.log(`  · ${reason}`);

  const items = commandsFor(plan);
  if (items.length === 0) {
    console.log("  → nothing to run (no affected tests / gates)");
  } else {
    for (const item of items) console.log(`  → ${display(item)}`);
  }
  if (plan.regenerate?.length) {
    console.log(`  (regenerate if drift guard fails: ${plan.regenerate.map((r) => `pnpm ${r}`).join(", ")})`);
  }

  if (dryRun) {
    console.log("(dry-run — nothing executed)");
    return;
  }

  for (const item of items) {
    const cmd = display(item);
    const r = run(cmd);
    if (!r.ok) {
      console.error(`${cmd}\n  FAILED (exit ${r.code})\n${tail(r.out)}`);
      process.exit(r.code ?? 1);
    }
    console.log(`  ✓ ${cmd}`);
  }
  console.log(`✓ ${plan.level} complete`);
}

if (isMain) main();
