// =============================================================================
// workflow-contract.test.ts — Structure contract for the #690 GitHub Actions
// workflow that wires #688 (orchestration state machine) + #689 (publication
// adapter) into a manual/scheduled observe/repair run.
//
// This test intentionally has NO YAML dependency: it validates the workflow as
// fixed text/structure (indentation-aware section slicing + regex) so it runs
// under a clean `--frozen-lockfile` CI install.  It asserts the
// security-sensitive wiring contract: fixed triggers/runner/tooling, minimal
// permissions, secret isolation, concurrency, gating, artifact
// allowlist/retention, and the absence of PAT / pull_request_target /
// self-hosted / third-party write actions / auto-merge / force push.
// =============================================================================

import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..", "..");
const WORKFLOW_PATH = path.join(
  projectRoot,
  ".github",
  "workflows",
  "gemini-correctness-autofix.yml"
);

const ALLOWED_ARTIFACTS = [
  "finding.json",
  "red-result.json",
  "repair-result.json",
  "command-summary.json",
  "publication-result.json"
];

const FIXED_VARIABLES = [
  "GEMINI_AUTOFIX_MODE",
  "GEMINI_AUTOFIX_MODEL",
  "GEMINI_AUTOFIX_MIN_CONFIDENCE",
  "GEMINI_AUTOFIX_MAX_FILES",
  "GEMINI_AUTOFIX_MAX_LINES"
];

const raw = fs.readFileSync(WORKFLOW_PATH, "utf8");

// ---------------------------------------------------------------------------
// Minimal indentation-aware slicing.  The workflow uses fixed 2-space
// indentation, so these helpers are deterministic and need no YAML parser.
// Sliced blocks preserve their original leading whitespace so anchored
// regexes (`^ {n}...`) keep working.
// ---------------------------------------------------------------------------
type RawLine = { indent: number; text: string };

function rawLines(source: string): RawLine[] {
  return source.split("\n").map((line) => {
    const m = /^(\s*)(.*)$/.exec(line);
    return { indent: m ? m[1].length : 0, text: m ? m[2] : "" };
  });
}

// Text of the block under the first line matching `header` at exactly `indent`,
// stopping at the next non-blank line with indent <= `indent`.  Original
// indentation is preserved in the returned text.
function subBlock(source: string, indent: number, header: RegExp): string {
  const srcLines = source.split("\n");
  const ls = srcLines.map((line) => {
    const m = /^(\s*)(.*)$/.exec(line);
    return { indent: m ? m[1].length : 0, text: m ? m[2] : "" };
  });
  const start = ls.findIndex((l) => l.indent === indent && header.test(l.text));
  if (start < 0) return "";
  const out: string[] = [];
  for (let i = start + 1; i < ls.length; i++) {
    if (ls[i].text === "") {
      out.push(srcLines[i]); // keep blank lines; they never terminate a block
      continue;
    }
    if (ls[i].indent <= indent) break;
    out.push(srcLines[i]);
  }
  return out.join("\n");
}

function normBlock(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function jobBlock(jobName: string): string {
  const jobsText = subBlock(raw, 0, /^jobs:$/);
  return subBlock(jobsText, 2, new RegExp(`^${jobName}:$`));
}

function jobOutputs(jobName: string): string[] {
  const outputs = subBlock(jobBlock(jobName), 4, /^outputs:$/);
  return [...outputs.matchAll(/^ {6}([A-Za-z0-9_-]+):/gm)].map((m) => m[1]);
}

// Each `- name: ...` item (indent 6) starts a step; its keys (indent 8) and
// deeper content belong to that step.
function stepBlocks(jobName: string): string[] {
  const block = jobBlock(jobName);
  const ls = rawLines(block);
  const srcLines = block.split("\n");
  const out: string[] = [];
  let current: string[] = [];
  for (let i = 0; i < ls.length; i++) {
    if (ls[i].indent === 6 && ls[i].text.startsWith("- ")) {
      if (current.length) out.push(current.join("\n"));
      current = [srcLines[i]];
    } else if (ls[i].indent > 6 && current.length) {
      current.push(srcLines[i]);
    }
  }
  if (current.length) out.push(current.join("\n"));
  return out;
}

function stepById(jobName: string, id: string): string {
  return (
    stepBlocks(jobName).find((b) => new RegExp(`^ {8}id: ${id}$`, "m").test(b)) ??
    ""
  );
}

function stepIds(jobName: string): Set<string> {
  const ids = new Set<string>();
  for (const b of stepBlocks(jobName)) {
    const m = b.match(/^ {8}id: ([A-Za-z0-9_-]+)$/m);
    if (m) ids.add(m[1]);
  }
  return ids;
}

function uploadSteps(): Array<{ job: string; text: string }> {
  const out: Array<{ job: string; text: string }> = [];
  for (const job of ["evaluate", "publish"]) {
    for (const block of stepBlocks(job)) {
      if (block.includes("actions/upload-artifact@v4")) {
        out.push({ job, text: block });
      }
    }
  }
  return out;
}

// In an upload step, `with:` sits at indent 8, its keys (name/path/retention)
// at indent 10, and the multi-line `path: |` value list at indent 12.
function artifactPaths(stepText: string): string[] {
  const ls = rawLines(stepText);
  const pathIdx = ls.findIndex((l) => l.indent === 10 && /^path:/.test(l.text));
  if (pathIdx < 0) return [];
  if (/^path: \|/.test(ls[pathIdx].text)) {
    const out: string[] = [];
    for (let i = pathIdx + 1; i < ls.length && ls[i].indent === 12; i++) {
      if (ls[i].text.trim() !== "") out.push(ls[i].text.trim());
    }
    return out;
  }
  return [ls[pathIdx].text.replace(/^path:\s*/, "").trim()];
}

describe("gemini-correctness-autofix.yml trigger contract (#690)", () => {
  const onText = subBlock(raw, 0, /^on:$/);

  it("loads the workflow with the fixed top-level sections in order", () => {
    const topKeys = raw
      .split("\n")
      .map((line) => /^([A-Za-z0-9_]+):/.exec(line)?.[1])
      .filter((k): k is string => Boolean(k));
    expect(topKeys).toEqual([
      "name",
      "on",
      "permissions",
      "concurrency",
      "jobs"
    ]);
    expect(raw).toMatch(/^name: Gemini correctness autofix$/m);
  });

  it("is triggered only by workflow_dispatch and schedule", () => {
    expect(onText).toMatch(/^ {2}workflow_dispatch:$/m);
    expect(onText).toMatch(/^ {2}schedule:$/m);
    expect(onText).not.toContain("pull_request");
  });

  it("fixes the workflow_dispatch mode input exactly", () => {
    expect(onText).toContain("mode:");
    expect(onText).toContain("required: true");
    expect(onText).toContain("default: observe");
    expect(onText).toContain("type: choice");
    expect(onText).toContain("options: [observe, repair]");
  });

  it("fixes the schedule cron expression", () => {
    expect(onText).toContain('cron: "17 19 * * *"');
  });
});

describe("gemini-correctness-autofix.yml runner/tooling contract (#690)", () => {
  it("fixes ubuntu-latest runners and a 30-minute timeout on every job", () => {
    for (const job of ["evaluate", "publish"]) {
      const block = jobBlock(job);
      expect(block).toMatch(/^ {4}runs-on: ubuntu-latest$/m);
      expect(block).toMatch(/^ {4}timeout-minutes: 30$/m);
    }
  });

  it("fixes the concurrency group and cancel behavior", () => {
    const concurrency = subBlock(raw, 0, /^concurrency:$/);
    expect(concurrency).toMatch(/^ {2}group: gemini-correctness-autofix$/m);
    expect(concurrency).toMatch(/^ {2}cancel-in-progress: false$/m);
  });

  it("pins Node 22 and pnpm 10.33.0", () => {
    const nodeVersions = [...raw.matchAll(/^ {10}node-version: (.+)$/gm)].map(
      (m) => m[1]
    );
    expect(nodeVersions).toEqual(["22", "22"]);
    const pnpmSetup = [...raw.matchAll(/^ {10}version: 10\.33\.0$/gm)];
    expect(pnpmSetup.length).toBeGreaterThan(0);
  });

  it("installs dependencies with pnpm install --frozen-lockfile", () => {
    const installs = [...raw.matchAll(/pnpm install --frozen-lockfile/g)];
    expect(installs.length).toBeGreaterThan(0);
  });
});

describe("gemini-correctness-autofix.yml permission isolation (#690)", () => {
  it("keeps the workflow default and evaluate permissions read-only", () => {
    const topPerms = subBlock(raw, 0, /^permissions:$/);
    expect(normBlock(topPerms)).toEqual(["contents: read"]);
    expect(topPerms).not.toContain("write");

    const evalPerms = subBlock(jobBlock("evaluate"), 4, /^permissions:$/);
    expect(normBlock(evalPerms)).toEqual([
      "contents: read",
      "pull-requests: read"
    ]);
    expect(evalPerms).not.toContain("write");
  });

  it("grants publish exactly contents and pull-requests write", () => {
    const publishPerms = subBlock(jobBlock("publish"), 4, /^permissions:$/);
    expect(normBlock(publishPerms)).toEqual([
      "contents: write",
      "pull-requests: write"
    ]);
  });
});

describe("gemini-correctness-autofix.yml secret isolation (#690)", () => {
  it("injects GEMINI_API_KEY into exactly one step, inside evaluate", () => {
    const apiKeyEnv = [
      ...raw.matchAll(/^ {10}GEMINI_API_KEY: \${{ secrets\.GEMINI_API_KEY }}\s*$/gm)
    ];
    expect(apiKeyEnv).toHaveLength(1);
    expect(jobBlock("evaluate")).toMatch(
      /^ {10}GEMINI_API_KEY: \${{ secrets\.GEMINI_API_KEY }}$/m
    );
  });

  it("never passes a model secret into the publish job", () => {
    const publishBlock = jobBlock("publish");
    expect(publishBlock).not.toContain("GEMINI_API_KEY");
    expect(publishBlock).not.toMatch(/GEMINI_(KEY|TOKEN|SECRET|PASSWORD)/);
  });

  it("uses only GEMINI_API_KEY and the automatic GITHUB_TOKEN as secrets", () => {
    const refs = [
      ...new Set(
        [...raw.matchAll(/secrets\.([A-Za-z0-9_-]+)/g)].map((m) => m[1])
      )
    ].sort();
    expect(refs).toEqual(["GEMINI_API_KEY", "GITHUB_TOKEN"]);
    expect(raw).toMatch(/^ {10}GH_TOKEN: \${{ secrets\.GITHUB_TOKEN }}$/m);
  });
});

describe("gemini-correctness-autofix.yml schedule mode gating (#690)", () => {
  it("resolves schedule mode from GEMINI_AUTOFIX_MODE with an off fallback", () => {
    const resolveStep = stepById("evaluate", "mode");
    expect(resolveStep).toContain("GEMINI_AUTOFIX_MODE");
    expect(resolveStep).toContain("off");
  });

  it("gates the Gemini orchestration step behind a non-off mode", () => {
    const orchestrateStep = stepById("evaluate", "orchestrate");
    expect(orchestrateStep).toMatch(
      /^ {8}if: \${{ steps\.mode\.outputs\.mode != 'off' }}$/m
    );
  });

  it("has an explicit safe-skip step that runs before the Gemini step", () => {
    const evaluateText = jobBlock("evaluate");
    const skipIdx = evaluateText.indexOf(
      "Safe skip when GEMINI_AUTOFIX_MODE is off"
    );
    const orchestrateIdx = evaluateText.indexOf(
      "Run Gemini correctness orchestration"
    );
    expect(skipIdx).toBeGreaterThan(-1);
    expect(orchestrateIdx).toBeGreaterThan(skipIdx);
    const skipStep = stepBlocks("evaluate").find((b) =>
      b.includes("Safe skip when GEMINI_AUTOFIX_MODE is off")
    );
    expect(skipStep).toBeTruthy();
    expect(skipStep).toContain("GITHUB_STEP_SUMMARY");
  });
});

describe("gemini-correctness-autofix.yml job separation (#690)", () => {
  it("evaluate runs the #688 orchestrator but never the publication adapter", () => {
    const glue = stepById("evaluate", "orchestrate");
    expect(glue).toContain("runWorkflowOrchestration");
    expect(glue).not.toContain("publishVerifiedRepair");
  });

  it("publish calls the #689 adapter but never reruns Gemini stages", () => {
    const glue = stepById("publish", "publish");
    expect(glue).toContain("publishVerifiedRepair");
    expect(glue).not.toContain("runWorkflowOrchestration");
    expect(glue).not.toContain("GEMINI_API_KEY");
    expect(glue).not.toMatch(/discover\.mjs|red-stage\.mjs|green-stage\.mjs/);
  });
});

describe("gemini-correctness-autofix.yml publication gating (#690)", () => {
  it("runs publish only on a validated repair candidate from evaluate", () => {
    const publishBlock = jobBlock("publish");
    expect(publishBlock).toMatch(/^ {4}needs: evaluate$/m);
    expect(publishBlock).toContain("publicationAllowed");
    expect(publishBlock).toContain("'true'");
    expect(publishBlock).toContain("'repair'");
  });

  it("routes publicationAllowed through evaluate job outputs to the gate", () => {
    expect(jobOutputs("evaluate")).toEqual(
      expect.arrayContaining(["mode", "publicationAllowed", "status"])
    );
    expect(jobBlock("evaluate")).toMatch(
      /^ {6}publicationAllowed: \${{ steps\.orchestrate\.outputs\.publicationAllowed }}$/m
    );
  });

  it("publish consumes the validated candidate artifact from evaluate", () => {
    const glue = stepById("publish", "publish");
    expect(glue).toContain("command-summary.json");
    expect(glue).toContain("validatePublicationCandidate");
  });
});

describe("gemini-correctness-autofix.yml artifact contract (#690)", () => {
  it("fixes artifact retention at 7 days and uploads only allowlisted files", () => {
    const uploads = uploadSteps();
    expect(uploads.length).toBeGreaterThan(0);
    for (const { text } of uploads) {
      expect(text).toMatch(/^ {10}retention-days: 7$/m);
      const paths = artifactPaths(text);
      expect(paths.length).toBeGreaterThan(0);
      for (const p of paths) {
        expect(ALLOWED_ARTIFACTS).toContain(p.split("/").pop());
      }
    }
  });

  it("never uploads raw/log/patch/env/debug/source-archive content", () => {
    const uploads = uploadSteps();
    for (const { text } of uploads) {
      const paths = artifactPaths(text).join("\n");
      expect(paths).not.toMatch(
        /raw|red-test\.log|red-test\.patch|\.vitest|env|headers|debug|archive|\.tar|\.zip/i
      );
    }
  });

  it("does not fabricate empty RED/GREEN results for stages that did not run", () => {
    const glue = stepById("evaluate", "orchestrate");
    expect(glue).not.toMatch(/writeFileSync\([^)]*red-result/);
    expect(glue).not.toMatch(/writeFileSync\([^)]*repair-result/);
  });
});

describe("gemini-correctness-autofix.yml baseline contract (#690)", () => {
  it("fixes the baseline command set to lint/typecheck/test/build/diff-check", () => {
    const glue = stepById("evaluate", "orchestrate");
    for (const cmd of ["lint", "typecheck", "test", "build", "diff-check"]) {
      expect(glue).toContain(cmd);
    }
    expect(glue).toContain("pnpm lint");
    expect(glue).toContain("pnpm typecheck");
    expect(glue).toContain("pnpm test");
    expect(glue).toContain("pnpm build");
    expect(glue).toContain("diff --check");
  });

  it("reads all fixed repository variables", () => {
    for (const variable of FIXED_VARIABLES) {
      expect(raw).toContain(variable);
    }
  });
});

describe("gemini-correctness-autofix.yml forbidden constructs (#690)", () => {
  it("forbids pull_request_target, self-hosted runners, and PATs", () => {
    expect(raw).not.toContain("pull_request_target");
    expect(raw).not.toContain("self-hosted");
    expect(raw).not.toMatch(/ghp_[A-Za-z0-9]{20,}/);
    expect(raw).not.toMatch(/ghs_|github_pat_/);
  });

  it("uses no third-party write actions", () => {
    const uses = [...raw.matchAll(/^ {8}uses: ([^\s]+)/gm)].map((m) => m[1]);
    expect(uses.length).toBeGreaterThan(0);
    for (const use of uses) {
      expect(use).toMatch(/^(actions\/|pnpm\/action-setup@)/);
    }
  });

  it("never force-pushes or auto-merges", () => {
    expect(raw).not.toMatch(/--force|force-with-lease|force-push/);
    expect(raw).not.toMatch(/auto-merge|--merge|--squash|--rebase/);
  });
});

describe("gemini-correctness-autofix.yml reference integrity (#690)", () => {
  it("resolves every needs.<job>.outputs.<name> reference", () => {
    const refs = [
      ...raw.matchAll(/needs\.([A-Za-z0-9_-]+)\.outputs\.([A-Za-z0-9_-]+)/g)
    ];
    expect(refs.length).toBeGreaterThan(0);
    for (const [, neededJob, outputName] of refs) {
      expect(["evaluate", "publish"]).toContain(neededJob);
      expect(jobOutputs(neededJob)).toContain(outputName);
    }
  });

  it("resolves every steps.<id>.outputs.<name> reference within its job", () => {
    for (const job of ["evaluate", "publish"]) {
      const block = jobBlock(job);
      const ids = stepIds(job);
      const refs = [
        ...block.matchAll(/steps\.([A-Za-z0-9_-]+)\.outputs\.([A-Za-z0-9_-]+)/g)
      ];
      for (const [, stepId] of refs) {
        expect(ids).toContain(stepId);
      }
    }
  });

  it("sets step outputs via GITHUB_OUTPUT, not deprecated ::set-output", () => {
    const glue = stepById("evaluate", "orchestrate");
    expect(glue).toContain("GITHUB_OUTPUT");
    expect(glue).not.toContain("::set-output");
  });
});
