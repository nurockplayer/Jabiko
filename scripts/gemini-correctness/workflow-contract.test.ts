// =============================================================================
// workflow-contract.test.ts — Structure contract for the #690 GitHub Actions
// workflow that wires #688 (orchestration state machine) + #689 (publication
// adapter) into a manual/scheduled observe/repair run.
//
// This test parses .github/workflows/gemini-correctness-autofix.yml as YAML and
// asserts the security-sensitive wiring contract: fixed triggers/runner/tooling,
// minimal permissions, secret isolation, concurrency, gating, artifact
// allowlist/retention, and the absence of PAT / pull_request_target /
// self-hosted / third-party write actions / auto-merge / force push.
// =============================================================================

import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
// @ts-expect-error -- js-yaml ships no type declarations (transitive via eslint)
import yaml from "js-yaml";

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

type Json = Record<string, unknown>;

function rec(value: unknown): Json {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Json)
    : {};
}
function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}
function arr(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

const doc = rec(yaml.load(raw));
const jobMap = rec(doc.jobs);

function jobOutputs(jobName: string): string[] {
  return Object.keys(rec(rec(jobMap[jobName]).outputs));
}

function allSteps(): Array<{ job: string; step: Json }> {
  const out: Array<{ job: string; step: Json }> = [];
  for (const [jobName, jobValue] of Object.entries(jobMap)) {
    for (const stepValue of arr(rec(jobValue).steps)) {
      out.push({ job: jobName, step: rec(stepValue) });
    }
  }
  return out;
}

function stepById(jobName: string, id: string): Json | undefined {
  const job = rec(jobMap[jobName]);
  return arr(job.steps)
    .map((value) => rec(value))
    .find((step) => step.id === id);
}

function glueRun(jobName: string, stepId: string): string {
  return str(stepById(jobName, stepId)?.run);
}

describe("gemini-correctness-autofix.yml trigger contract (#690)", () => {
  it("parses as a single YAML mapping", () => {
    expect(doc).not.toBeNull();
    expect(Object.keys(doc).length).toBeGreaterThan(0);
  });

  it("is triggered only by workflow_dispatch and schedule", () => {
    const on = rec(doc.on);
    expect(Object.keys(on).sort()).toEqual(["schedule", "workflow_dispatch"]);
    expect(on).not.toHaveProperty("pull_request");
    expect(on).not.toHaveProperty("pull_request_target");
  });

  it("fixes the workflow_dispatch mode input exactly", () => {
    const on = rec(doc.on);
    const input = rec(rec(on.workflow_dispatch).inputs).mode;
    const mode = rec(input);
    expect(mode.type).toBe("choice");
    expect(mode.required).toBe(true);
    expect(mode.default).toBe("observe");
    expect(arr(mode.options)).toEqual(["observe", "repair"]);
  });

  it("fixes the schedule cron expression", () => {
    const on = rec(doc.on);
    const schedule = arr(on.schedule);
    expect(schedule.length).toBeGreaterThan(0);
    expect(str(rec(schedule[0]).cron)).toBe("17 19 * * *");
  });
});

describe("gemini-correctness-autofix.yml runner/tooling contract (#690)", () => {
  it("fixes ubuntu-latest runners and a 30-minute timeout on every job", () => {
    expect(Object.keys(jobMap).sort()).toEqual(["evaluate", "publish"]);
    for (const jobValue of Object.values(jobMap)) {
      const job = rec(jobValue);
      expect(job["runs-on"]).toBe("ubuntu-latest");
      expect(job["timeout-minutes"]).toBe(30);
    }
  });

  it("fixes the concurrency group and cancel behavior", () => {
    const c = rec(doc.concurrency);
    expect(c.group).toBe("gemini-correctness-autofix");
    expect(c["cancel-in-progress"]).toBe(false);
  });

  it("pins Node 22 and pnpm 10.33.0", () => {
    const setupNode = allSteps().find(({ step }) =>
      str(step.uses).includes("actions/setup-node@")
    );
    expect(setupNode).toBeTruthy();
    expect(rec(setupNode?.step.with)["node-version"]).toBe(22);

    const pnpmSetup = allSteps().find(({ step }) =>
      str(step.uses).includes("pnpm/action-setup@")
    );
    expect(pnpmSetup).toBeTruthy();
    expect(str(rec(pnpmSetup?.step.with).version)).toBe("10.33.0");
  });

  it("installs dependencies with pnpm install --frozen-lockfile", () => {
    const installs = allSteps().filter(({ step }) =>
      str(step.run).includes("pnpm install --frozen-lockfile")
    );
    expect(installs.length).toBeGreaterThan(0);
  });
});

describe("gemini-correctness-autofix.yml permission isolation (#690)", () => {
  it("keeps the workflow default and evaluate permissions read-only", () => {
    const perms = rec(doc.permissions);
    expect(Object.values(perms)).not.toContain("write");

    const evaluate = rec(jobMap.evaluate);
    const evalPerms = rec(evaluate.permissions);
    expect(evalPerms.contents).toBe("read");
    expect(Object.values(evalPerms)).not.toContain("write");
  });

  it("grants publish exactly contents and pull-requests write", () => {
    const publish = rec(jobMap.publish);
    expect(rec(publish.permissions)).toEqual({
      contents: "write",
      "pull-requests": "write"
    });
  });
});

describe("gemini-correctness-autofix.yml secret isolation (#690)", () => {
  it("injects GEMINI_API_KEY into exactly one step, inside evaluate", () => {
    const secretSteps = allSteps().filter(({ step }) =>
      str(rec(step.env).GEMINI_API_KEY).length > 0
    );
    expect(secretSteps).toHaveLength(1);
    expect(secretSteps[0].job).toBe("evaluate");
    expect(rec(secretSteps[0].step.env).GEMINI_API_KEY).toBe(
      "${{ secrets.GEMINI_API_KEY }}"
    );
  });

  it("never passes a model secret into the publish job", () => {
    const publish = rec(jobMap.publish);
    const publishText = JSON.stringify(publish);
    expect(publishText).not.toContain("GEMINI_API_KEY");
    expect(publishText).not.toMatch(/GEMINI_(KEY|TOKEN|SECRET|PASSWORD)/);
  });

  it("uses only GEMINI_API_KEY and the automatic GITHUB_TOKEN as secrets", () => {
    const refs = [...new Set(
      [...raw.matchAll(/secrets\.([A-Za-z0-9_-]+)/g)].map((m) => m[1])
    )].sort();
    expect(refs).toEqual(["GEMINI_API_KEY", "GITHUB_TOKEN"]);
  });
});

describe("gemini-correctness-autofix.yml schedule mode gating (#690)", () => {
  it("resolves schedule mode from GEMINI_AUTOFIX_MODE with an off fallback", () => {
    const resolve = stepById("evaluate", "mode");
    expect(resolve).toBeTruthy();
    const resolveText = `${str(resolve?.run)}\n${JSON.stringify(rec(resolve?.env))}`;
    expect(resolveText).toContain("GEMINI_AUTOFIX_MODE");
    expect(resolveText).toContain("off");
  });

  it("gates the Gemini orchestration step behind a non-off mode", () => {
    const orchestrate = stepById("evaluate", "orchestrate");
    expect(orchestrate).toBeTruthy();
    expect(str(orchestrate?.if)).toContain("mode");
    expect(str(orchestrate?.if)).toContain("off");
  });

  it("has an explicit safe-skip step for off mode that runs before Gemini", () => {
    const evaluate = rec(jobMap.evaluate);
    const skip = arr(evaluate.steps)
      .map((value) => rec(value))
      .find((step) => str(step.name).toLowerCase().includes("skip"));
    expect(skip).toBeTruthy();
    expect(str(skip?.if)).toContain("off");
    expect(str(skip?.run)).toContain("GITHUB_STEP_SUMMARY");
  });
});

describe("gemini-correctness-autofix.yml job separation (#690)", () => {
  it("evaluate runs the #688 orchestrator but never the publication adapter", () => {
    const glue = glueRun("evaluate", "orchestrate");
    expect(glue).toContain("runWorkflowOrchestration");
    expect(glue).not.toContain("publishVerifiedRepair");
  });

  it("publish calls the #689 adapter but never reruns Gemini stages", () => {
    const publishStep = arr(rec(jobMap.publish).steps)
      .map((value) => rec(value))
      .find((step) => str(step.name).toLowerCase().includes("publish"));
    expect(publishStep).toBeTruthy();
    const glue = str(publishStep?.run);
    expect(glue).toContain("publishVerifiedRepair");
    expect(glue).not.toContain("runWorkflowOrchestration");
    expect(glue).not.toContain("GEMINI_API_KEY");
    expect(glue).not.toMatch(/discover|red-stage|green-stage/);
  });
});

describe("gemini-correctness-autofix.yml publication gating (#690)", () => {
  it("runs publish only on a validated repair candidate from evaluate", () => {
    const publish = rec(jobMap.publish);
    expect(str(publish.if)).toContain("publicationAllowed");
    expect(str(publish.if)).toContain("'true'");
    expect(str(publish.if)).toContain("'repair'");
    const needsValue = publish.needs;
    const needsList = Array.isArray(needsValue) ? needsValue : [str(needsValue)];
    expect(needsList.map((value) => str(value))).toEqual(["evaluate"]);
  });

  it("routes publicationAllowed through evaluate job outputs to the gate", () => {
    expect(jobOutputs("evaluate")).toEqual(
      expect.arrayContaining(["mode", "publicationAllowed", "status"])
    );
    expect(str(rec(rec(jobMap.evaluate).outputs).publicationAllowed)).toContain(
      "publicationAllowed"
    );
  });

  it("publish consumes the validated candidate artifact from evaluate", () => {
    const publishStep = arr(rec(jobMap.publish).steps)
      .map((value) => rec(value))
      .find((step) => str(step.name).toLowerCase().includes("publish"));
    const glue = str(publishStep?.run);
    expect(glue).toContain("command-summary.json");
    expect(glue).toContain("validatePublicationCandidate");
  });
});

describe("gemini-correctness-autofix.yml artifact contract (#690)", () => {
  it("fixes artifact retention at 7 days and uploads only allowlisted files", () => {
    const uploads = allSteps().filter(({ step }) =>
      str(step.uses).includes("upload-artifact")
    );
    expect(uploads.length).toBeGreaterThan(0);
    for (const { step } of uploads) {
      expect(rec(step.with)["retention-days"]).toBe(7);
      const paths = str(rec(step.with).path)
        .split("\n")
        .map((p) => p.trim())
        .filter(Boolean);
      expect(paths.length).toBeGreaterThan(0);
      for (const p of paths) {
        expect(ALLOWED_ARTIFACTS).toContain(p.split("/").pop());
      }
    }
  });

  it("never uploads raw/log/patch/env/debug/source-archive content", () => {
    const uploads = allSteps().filter(({ step }) =>
      str(step.uses).includes("upload-artifact")
    );
    for (const { step } of uploads) {
      const paths = str(rec(step.with).path);
      expect(paths).not.toMatch(
        /raw|red-test\.log|red-test\.patch|\.vitest|env|headers|debug|archive|\.tar|\.zip/i
      );
    }
  });

  it("does not fabricate empty RED/GREEN results for stages that did not run", () => {
    const glue = glueRun("evaluate", "orchestrate");
    // The glue may only copy stage-produced artifacts; it must never write
    // red-result.json / repair-result.json itself.
    expect(glue).not.toMatch(/writeFileSync\([^)]*red-result/);
    expect(glue).not.toMatch(/writeFileSync\([^)]*repair-result/);
  });
});

describe("gemini-correctness-autofix.yml baseline contract (#690)", () => {
  it("fixes the baseline command set to lint/typecheck/test/build/diff-check", () => {
    const glue = glueRun("evaluate", "orchestrate");
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
    const uses = allSteps()
      .map(({ step }) => str(step.uses))
      .filter(Boolean);
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
    for (const jobValue of Object.values(jobMap)) {
      const job = rec(jobValue);
      const jobText = JSON.stringify(job);
      const needsValue = job.needs;
      const needs = Array.isArray(needsValue)
        ? needsValue.map((value) => str(value))
        : [str(needsValue)].filter(Boolean);
      const refs = [
        ...jobText.matchAll(/needs\.([A-Za-z0-9_-]+)\.outputs\.([A-Za-z0-9_-]+)/g)
      ];
      for (const [, neededJob, outputName] of refs) {
        expect(needs).toContain(neededJob);
        expect(jobOutputs(neededJob)).toContain(outputName);
      }
    }
  });

  it("resolves every steps.<id>.outputs.<name> reference", () => {
    for (const jobValue of Object.values(jobMap)) {
      const job = rec(jobValue);
      const jobText = JSON.stringify(job);
      const stepIds = new Set(
        arr(job.steps)
          .map((value) => str(rec(value).id))
          .filter(Boolean)
      );
      const refs = [
        ...jobText.matchAll(/steps\.([A-Za-z0-9_-]+)\.outputs\.([A-Za-z0-9_-]+)/g)
      ];
      for (const [, stepId] of refs) {
        expect(stepIds).toContain(stepId);
      }
    }
  });

  it("sets step outputs via GITHUB_OUTPUT, not deprecated ::set-output", () => {
    const glue = glueRun("evaluate", "orchestrate");
    expect(glue).toContain("GITHUB_OUTPUT");
    expect(glue).not.toContain("::set-output");
  });
});
