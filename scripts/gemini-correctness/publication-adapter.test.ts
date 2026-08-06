import { describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
// @ts-expect-error -- plain .mjs module, no types
import {
  publishVerifiedRepair,
  validatePublicationCandidate,
  buildPullRequestBody,
  PUBLICATION_STATUS
} from "./publication-adapter.mjs";

const SECRET = "fixture-publication-secret-12345678";
const ABSOLUTE_PATH = "/tmp/some/absolute/path";
const ENV_DUMP = "PATH=/usr/local/bin:/usr/bin";
const FAKE_TOKEN = "ghp_abcdefghijklmnopqrstuvwxyz1234567890";
const AIZA_KEY = `AIza${"A".repeat(35)}`;

const PRODUCTION_DIFF = [
  "diff --git a/src/domain/example.ts b/src/domain/example.ts",
  "--- a/src/domain/example.ts",
  "+++ b/src/domain/example.ts",
  "@@ -1,3 +1,3 @@",
  " export function emptyQueue(queue) {",
  "-  return queue[0] ?? null;",
  "+  return queue[0] ?? \"fallback\";",
  " }",
  ""
].join("\n");

function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

const DIFF_SHA256 = sha256Hex(PRODUCTION_DIFF);

const BASELINE_SHA = "a".repeat(40);
const TEST_FILE = "src/domain/example.regression.test.ts";
const PROD_FILE = "src/domain/example.ts";

function regressionTestSource() {
  return [
    "import { describe, expect, it } from \"vitest\";",
    "import { emptyQueue } from \"./example\";",
    "",
    "describe(\"example\", () => {",
    "  it(\"returns the safe fallback for an empty queue\", () => {",
    "    expect(emptyQueue([])).toBe(\"fallback\");",
    "  });",
    "});",
    ""
  ].join("\n");
}

function candidate(overrides: Record<string, unknown> = {}) {
  const base = {
    schemaVersion: 1,
    status: "repair-verified",
    publicationAllowed: true,
    baselineSha: BASELINE_SHA,
    findingTitle: "empty queue returns a stale value",
    findingCategory: "boundary-condition",
    model: "gemini-2.5-flash",
    runUrl: "https://github.com/nurockplayer/Jabiko/actions/runs/424242",
    finalDiffSha256: DIFF_SHA256,
    changedFiles: 1,
    changedLines: 2,
    productionDiff: PRODUCTION_DIFF,
    regressionTest: {
      path: TEST_FILE,
      source: regressionTestSource()
    },
    red: {
      testFile: TEST_FILE,
      testName: "returns the safe fallback for an empty queue",
      failureKind: "assertion",
      patchSha256: "b".repeat(64),
      replayConfirmed: true
    },
    green: {
      findingTitle: "empty queue returns a stale value",
      productionFiles: [PROD_FILE],
      rootCause: "the empty branch returns a stale value instead of the fallback",
      fixSummary: "return the safe fallback when the queue is empty",
      checks: [
        { name: "targeted-test", status: "passed" },
        { name: "lint", status: "passed" },
        { name: "typecheck", status: "passed" },
        { name: "test", status: "passed" },
        { name: "build", status: "passed" }
      ],
      changedFiles: 1,
      changedLines: 2,
      finalDiffSha256: DIFF_SHA256
    }
  };
  return { ...base, ...overrides };
}

function adapters(overrides: Record<string, unknown> = {}) {
  return {
    readRemoteHead: vi.fn().mockResolvedValue({ valid: true, sha: BASELINE_SHA }),
    createBranch: vi.fn().mockResolvedValue({ valid: true }),
    commit: vi.fn().mockResolvedValue({ valid: true, sha: "c".repeat(40) }),
    push: vi.fn().mockResolvedValue({ valid: true }),
    createPullRequest: vi.fn().mockResolvedValue({ valid: true, number: 12, url: "https://github.com/nurockplayer/Jabiko/pull/12" }),
    deleteBranch: vi.fn().mockResolvedValue({ valid: true }),
    clock: vi.fn().mockReturnValue(1_700_000_000_000),
    ...overrides
  };
}

const REPOSITORY = { owner: "nurockplayer", repo: "Jabiko", defaultBranch: "main" };
const RUN_ID = "run-2026-08-06-1234";

function opts(adapterSet: ReturnType<typeof adapters>, extra: Record<string, unknown> = {}) {
  return {
    candidate: candidate(),
    runId: RUN_ID,
    repository: REPOSITORY,
    adapters: adapterSet,
    ...extra
  };
}

function expectZeroWrites(adapterSet: ReturnType<typeof adapters>, except: (keyof ReturnType<typeof adapters>)[] = []) {
  for (const key of Object.keys(adapterSet)) {
    if (key === "clock" || (except as string[]).includes(key)) continue;
    expect(adapterSet[key as keyof typeof adapterSet]).not.toHaveBeenCalled();
  }
}

describe("validatePublicationCandidate", () => {
  it("accepts a fully validated publication candidate", () => {
    const check = validatePublicationCandidate(candidate());
    expect(check.valid).toBe(true);
  });

  it("rejects when publicationAllowed is not exactly true", () => {
    for (const value of [false, "true", 1, null, undefined]) {
      const check = validatePublicationCandidate(candidate({ publicationAllowed: value }));
      expect(check.valid).toBe(false);
    }
  });

  it("rejects non repair-verified status or wrong schemaVersion", () => {
    expect(validatePublicationCandidate(candidate({ status: "observed" })).valid).toBe(false);
    expect(validatePublicationCandidate(candidate({ schemaVersion: 2 })).valid).toBe(false);
  });

  it("rejects invalid baselineSha or finalDiffSha256", () => {
    expect(validatePublicationCandidate(candidate({ baselineSha: "not-a-sha" })).valid).toBe(false);
    expect(validatePublicationCandidate(candidate({ finalDiffSha256: "not-hex" })).valid).toBe(false);
  });

  it("rejects when productionDiff sha256 does not match finalDiffSha256", () => {
    const tampered = candidate({ finalDiffSha256: "d".repeat(64) });
    expect(validatePublicationCandidate(tampered).valid).toBe(false);
  });

  it("rejects unknown fields (extra tracked/untracked file claims)", () => {
    const check = validatePublicationCandidate(
      candidate({ extraFiles: [{ path: "src/domain/other.ts", content: "x" }] })
    );
    expect(check.valid).toBe(false);
  });

  it("rejects a diff file outside finding.productionFiles", () => {
    const diff = PRODUCTION_DIFF.replace(/example\.ts/g, "other.ts");
    const hash = sha256Hex(diff);
    const check = validatePublicationCandidate(
      candidate({
        productionDiff: diff,
        finalDiffSha256: hash,
        green: { ...candidate().green, finalDiffSha256: hash }
      })
    );
    expect(check.valid).toBe(false);
  });

  it("rejects changedFiles/changedLines stats that do not match the diff", () => {
    const wrongFiles = candidate({ changedFiles: 3 });
    expect(validatePublicationCandidate(wrongFiles).valid).toBe(false);
    const wrongLines = candidate({ changedLines: 99 });
    expect(validatePublicationCandidate(wrongLines).valid).toBe(false);
  });

  it("rejects a productionFiles entry declaring a .tmp temp artifact path", () => {
    const diff = PRODUCTION_DIFF.replace(/src\/domain\/example\.ts/g, ".tmp/leak.ts");
    const hash = sha256Hex(diff);
    const check = validatePublicationCandidate(
      candidate({
        productionDiff: diff,
        finalDiffSha256: hash,
        green: { ...candidate().green, finalDiffSha256: hash, productionFiles: [".tmp/leak.ts"] }
      })
    );
    expect(check.valid).toBe(false);
  });

  it("rejects a productionFiles entry outside the allowlist (e.g. src/components)", () => {
    const diff = PRODUCTION_DIFF.replace(/src\/domain\/example\.ts/g, "src/components/Example.tsx");
    const hash = sha256Hex(diff);
    const check = validatePublicationCandidate(
      candidate({
        productionDiff: diff,
        finalDiffSha256: hash,
        green: { ...candidate().green, finalDiffSha256: hash, productionFiles: ["src/components/Example.tsx"] }
      })
    );
    expect(check.valid).toBe(false);
  });

  it("rejects a regression test path that is not a .regression.test file", () => {
    const check = validatePublicationCandidate(
      candidate({
        regressionTest: { path: "src/domain/example.ts", source: regressionTestSource() },
        red: { ...candidate().red, testFile: "src/domain/example.ts" }
      })
    );
    expect(check.valid).toBe(false);
  });

  it("rejects a regression test path outside the allowlist (.tmp temp artifact)", () => {
    const check = validatePublicationCandidate(
      candidate({
        regressionTest: { path: ".tmp/x.regression.test.ts", source: regressionTestSource() },
        red: { ...candidate().red, testFile: ".tmp/x.regression.test.ts" }
      })
    );
    expect(check.valid).toBe(false);
  });

  it("rejects a regression test path outside the allowlist (src/components)", () => {
    const check = validatePublicationCandidate(
      candidate({
        regressionTest: { path: "src/components/Example.regression.test.tsx", source: regressionTestSource() },
        red: { ...candidate().red, testFile: "src/components/Example.regression.test.tsx" }
      })
    );
    expect(check.valid).toBe(false);
  });

  it("rejects when regressionTest.path does not match red.testFile", () => {
    const check = validatePublicationCandidate(
      candidate({
        regressionTest: { path: "src/domain/other.regression.test.ts", source: regressionTestSource() }
      })
    );
    expect(check.valid).toBe(false);
  });

  it("rejects secret-like content in the diff", () => {
    const leaked = `${PRODUCTION_DIFF}\ndiff --git a/src/domain/example.ts b/src/domain/example.ts\n--- a/src/domain/example.ts\n+++ b/src/domain/example.ts\n@@ -10 +10 @@\n+  const token = "${FAKE_TOKEN}";\n`;
    const hash = sha256Hex(leaked);
    const check = validatePublicationCandidate(
      candidate({
        productionDiff: leaked,
        finalDiffSha256: hash,
        changedFiles: 1,
        changedLines: 3,
        green: { ...candidate().green, finalDiffSha256: hash, changedFiles: 1, changedLines: 3 }
      })
    );
    expect(check.valid).toBe(false);
  });

  it("rejects secret-like content in the regression test source", () => {
    const leakedSource = `${regressionTestSource()}\n// key=${AIZA_KEY}\n`;
    const check = validatePublicationCandidate(
      candidate({ regressionTest: { path: TEST_FILE, source: leakedSource } })
    );
    expect(check.valid).toBe(false);
  });

  it("rejects a secret-shaped string embedded in a productionFiles path", () => {
    const leakedPath = `src/domain/${FAKE_TOKEN}.ts`;
    const diff = PRODUCTION_DIFF.replace(/src\/domain\/example\.ts/g, leakedPath);
    const hash = sha256Hex(diff);
    const check = validatePublicationCandidate(
      candidate({
        productionDiff: diff,
        finalDiffSha256: hash,
        green: { ...candidate().green, finalDiffSha256: hash, productionFiles: [leakedPath] }
      })
    );
    expect(check.valid).toBe(false);
  });

  it("rejects a secret-shaped string embedded in the regression test path", () => {
    const leakedPath = `src/domain/${FAKE_TOKEN}.regression.test.ts`;
    const check = validatePublicationCandidate(
      candidate({
        regressionTest: { path: leakedPath, source: regressionTestSource() },
        red: { ...candidate().red, testFile: leakedPath }
      })
    );
    expect(check.valid).toBe(false);
  });
});

describe("non-verified / zero-write guard", () => {
  it("rejects a candidate with publicationAllowed=false with zero Git/GitHub writes", async () => {
    const a = adapters();
    const result = await publishVerifiedRepair(
      opts(a, { candidate: candidate({ publicationAllowed: false }) })
    );
    expect(result.status).toBe("invalid-candidate");
    expect(result.publicationAllowed).toBe(false);
    expectZeroWrites(a);
  });

  it("rejects a tampered candidate with zero writes (hash mismatch)", async () => {
    const a = adapters();
    const tampered = candidate({ finalDiffSha256: "d".repeat(64) });
    const result = await publishVerifiedRepair(opts(a, { candidate: tampered }));
    expect(result.status).toBe("invalid-candidate");
    expectZeroWrites(a);
  });

  it("fails closed when a required adapter is missing", async () => {
    const a = adapters();
    const withoutCommit = { ...a };
    // @ts-expect-error -- intentionally removing an adapter
    delete withoutCommit.commit;
    const result = await publishVerifiedRepair(opts(withoutCommit));
    expect(result.status).toBe(PUBLICATION_STATUS.CONFIG_ERROR);
    expectZeroWrites(a);
  });
});

describe("stale baseline", () => {
  it("returns baseline-stale with zero branch/commit/push/PR when remote main moved", async () => {
    const a = adapters({
      readRemoteHead: vi.fn().mockResolvedValue({ valid: true, sha: "d".repeat(40) })
    });
    const result = await publishVerifiedRepair(opts(a));
    expect(result.status).toBe("baseline-stale");
    expect(result.publicationAllowed).toBe(false);
    expect(a.readRemoteHead).toHaveBeenCalledTimes(1);
    expectZeroWrites(a, ["readRemoteHead"]);
  });

  it("fails closed when reading remote head throws", async () => {
    const a = adapters({
      readRemoteHead: vi.fn().mockRejectedValue(new Error("network down"))
    });
    const result = await publishVerifiedRepair(opts(a));
    expect(result.status).toBe(PUBLICATION_STATUS.PUBLICATION_FAILED);
    expectZeroWrites(a, ["readRemoteHead"]);
  });
});

describe("successful publication", () => {
  it("creates exactly one branch, commit, push, and Draft PR with the fixed contract", async () => {
    const a = adapters();
    const result = await publishVerifiedRepair(opts(a));

    expect(result.status).toBe(PUBLICATION_STATUS.PUBLISHED);
    expect(result.publicationAllowed).toBe(true);
    expect(result.branch).toBe(`gemini/auto-fix-${RUN_ID}`);

    expect(a.readRemoteHead).toHaveBeenCalledTimes(1);
    expect(a.readRemoteHead.mock.calls[0][0]).toMatchObject({ ref: "main" });
    expect(a.createBranch).toHaveBeenCalledTimes(1);
    expect(a.createBranch.mock.calls[0][0]).toMatchObject({
      name: `gemini/auto-fix-${RUN_ID}`,
      baseSha: BASELINE_SHA
    });
    expect(a.commit).toHaveBeenCalledTimes(1);
    const commitArg = a.commit.mock.calls[0][0];
    expect(commitArg.message).toBe("fix: empty queue returns a stale value");
    expect(commitArg.regressionTest).toMatchObject({ path: TEST_FILE });
    expect(a.push).toHaveBeenCalledTimes(1);
    expect(a.createPullRequest).toHaveBeenCalledTimes(1);
    const prArg = a.createPullRequest.mock.calls[0][0];
    expect(prArg).toMatchObject({
      title: "fix: empty queue returns a stale value",
      base: "main",
      draft: true
    });
    expect(a.deleteBranch).not.toHaveBeenCalled();
    expect(result.pullRequest).toMatchObject({ number: 12, draft: true, base: "main" });
    // The PR URL must survive result redaction intact (never REDACTED_PATH).
    expect(result.pullRequest.url).toBe("https://github.com/nurockplayer/Jabiko/pull/12");
  });

  it("builds a PR body from validated candidate fields only", async () => {
    const a = adapters();
    const result = await publishVerifiedRepair(opts(a));
    const body = a.createPullRequest.mock.calls[0][0].body as string;

    expect(body).toContain("human review");
    expect(body).toContain("empty queue returns a stale value");
    expect(body).toContain("boundary-condition");
    expect(body).toContain(TEST_FILE);
    expect(body).toContain("returns the safe fallback for an empty queue");
    expect(body).toContain("assertion");
    expect(body).toContain(BASELINE_SHA);
    expect(body).toContain(DIFF_SHA256);
    expect(body).toContain("424242");
    expect(body).toContain("gemini-2.5-flash");
    expect(body).toContain("Changed files: 1");
    expect(body).toContain("Changed lines: 2");

    // Raw model Markdown / the raw diff must never be spliced into the body.
    expect(body).not.toContain(PRODUCTION_DIFF);
    expect(body).not.toContain("diff --git");
    expect(result.status).toBe(PUBLICATION_STATUS.PUBLISHED);
  });
});

describe("sanitization", () => {
  it("sanitizes a hostile finding title in branch/commit/PR title", async () => {
    const hostileTitle = "fix: empty\nqueue\treturns stale value --force --admin";
    const a = adapters();
    await publishVerifiedRepair(opts(a, { candidate: candidate({ findingTitle: hostileTitle }) }));

    expect(a.createBranch.mock.calls[0][0].name).toBe(`gemini/auto-fix-${RUN_ID}`);
    expect(a.commit.mock.calls[0][0].message).toBe("fix: empty queue returns stale value --force --admin");
    expect(a.createPullRequest.mock.calls[0][0].title).toBe("fix: empty queue returns stale value --force --admin");
    expect(a.createPullRequest.mock.calls[0][0].title).not.toContain("\n");
    expect(a.createPullRequest.mock.calls[0][0].title).not.toContain("\t");
  });

  it("truncates an overlong title to a fixed bound", async () => {
    const longTitle = "x".repeat(500);
    const a = adapters();
    await publishVerifiedRepair(opts(a, { candidate: candidate({ findingTitle: longTitle }) }));

    const title = a.createPullRequest.mock.calls[0][0].title as string;
    expect(title).toMatch(/^fix: /);
    expect(title.length).toBeLessThan(150);
    expect(a.commit.mock.calls[0][0].message).toBe(title);
  });

  it("sanitizes runId into the branch name with the fixed prefix", async () => {
    const hostileRunId = "run/..\\evil name --force";
    const a = adapters();
    await publishVerifiedRepair(opts(a, { runId: hostileRunId }));

    const branch = a.createBranch.mock.calls[0][0].name as string;
    expect(branch).toMatch(/^gemini\/auto-fix-[A-Za-z0-9._-]+$/);
    expect(branch).not.toContain("/../");
    expect(branch).not.toContain("\\");
    expect(branch).not.toContain("--force");
  });
});

describe("bounded retry", () => {
  it("retries createBranch up to 3 times and succeeds on the last attempt", async () => {
    const a = adapters({
      createBranch: vi
        .fn()
        .mockResolvedValueOnce({ valid: false, error: "rate limited" })
        .mockResolvedValueOnce({ valid: false, error: "network" })
        .mockResolvedValueOnce({ valid: true })
    });
    const result = await publishVerifiedRepair(opts(a));
    expect(result.status).toBe(PUBLICATION_STATUS.PUBLISHED);
    expect(a.createBranch).toHaveBeenCalledTimes(3);
  });

  it("fails closed after 3 createBranch failures with zero later writes", async () => {
    const a = adapters({
      createBranch: vi.fn().mockResolvedValue({ valid: false, error: "boom" })
    });
    const result = await publishVerifiedRepair(opts(a));
    expect(result.status).toBe(PUBLICATION_STATUS.PUBLICATION_FAILED);
    expect(a.createBranch).toHaveBeenCalledTimes(3);
    expect(a.commit).not.toHaveBeenCalled();
    expect(a.push).not.toHaveBeenCalled();
    expect(a.createPullRequest).not.toHaveBeenCalled();
  });

  it("retries commit up to 3 times and succeeds on the last attempt", async () => {
    const a = adapters({
      commit: vi
        .fn()
        .mockResolvedValueOnce({ valid: false, error: "lock" })
        .mockResolvedValueOnce({ valid: false, error: "lock" })
        .mockResolvedValueOnce({ valid: true, sha: "c".repeat(40) })
    });
    const result = await publishVerifiedRepair(opts(a));
    expect(result.status).toBe(PUBLICATION_STATUS.PUBLISHED);
    expect(a.commit).toHaveBeenCalledTimes(3);
  });

  it("fails closed after 3 commit failures", async () => {
    const a = adapters({ commit: vi.fn().mockResolvedValue({ valid: false, error: "boom" }) });
    const result = await publishVerifiedRepair(opts(a));
    expect(result.status).toBe(PUBLICATION_STATUS.PUBLICATION_FAILED);
    expect(a.commit).toHaveBeenCalledTimes(3);
    expect(a.push).not.toHaveBeenCalled();
  });

  it("retries push up to 3 times and succeeds on the last attempt", async () => {
    const a = adapters({
      push: vi
        .fn()
        .mockResolvedValueOnce({ valid: false, error: "rejected" })
        .mockResolvedValueOnce({ valid: false, error: "rejected" })
        .mockResolvedValueOnce({ valid: true })
    });
    const result = await publishVerifiedRepair(opts(a));
    expect(result.status).toBe(PUBLICATION_STATUS.PUBLISHED);
    expect(a.push).toHaveBeenCalledTimes(3);
  });

  it("fails closed after 3 push failures and cleans up the branch", async () => {
    const a = adapters({ push: vi.fn().mockResolvedValue({ valid: false, error: "boom" }) });
    const result = await publishVerifiedRepair(opts(a));
    expect(result.status).toBe(PUBLICATION_STATUS.PUBLICATION_FAILED);
    expect(a.push).toHaveBeenCalledTimes(3);
    expect(a.deleteBranch).toHaveBeenCalledTimes(1);
  });

  it("retries createPullRequest up to 3 times and succeeds on the last attempt", async () => {
    const a = adapters({
      createPullRequest: vi
        .fn()
        .mockResolvedValueOnce({ valid: false, error: "rate limited" })
        .mockResolvedValueOnce({ valid: false, error: "rate limited" })
        .mockResolvedValueOnce({ valid: true, number: 12, url: "https://github.com/nurockplayer/Jabiko/pull/12" })
    });
    const result = await publishVerifiedRepair(opts(a));
    expect(result.status).toBe(PUBLICATION_STATUS.PUBLISHED);
    expect(a.createPullRequest).toHaveBeenCalledTimes(3);
  });
});

describe("push-success then PR-failure cleanup", () => {
  it("returns publication-cleaned-up when the remote branch is deleted after PR failure", async () => {
    const a = adapters({ createPullRequest: vi.fn().mockResolvedValue({ valid: false, error: "boom" }) });
    const result = await publishVerifiedRepair(opts(a));
    expect(result.status).toBe(PUBLICATION_STATUS.CLEANED_UP);
    expect(result.publicationAllowed).toBe(false);
    expect(a.createPullRequest).toHaveBeenCalledTimes(3);
    expect(a.deleteBranch).toHaveBeenCalledTimes(1);
    expect(a.deleteBranch.mock.calls[0][0].name).toBe(`gemini/auto-fix-${RUN_ID}`);
    expect(result.reason).toContain(`gemini/auto-fix-${RUN_ID}`);
  });

  it("reports a hard failure listing the orphan branch when cleanup fails", async () => {
    const a = adapters({
      createPullRequest: vi.fn().mockResolvedValue({ valid: false, error: "boom" }),
      deleteBranch: vi.fn().mockResolvedValue({ valid: false, error: "forbidden" })
    });
    const result = await publishVerifiedRepair(opts(a));
    expect(result.status).toBe(PUBLICATION_STATUS.CLEANUP_FAILED);
    expect(result.publicationAllowed).toBe(false);
    expect(result.branch).toBe(`gemini/auto-fix-${RUN_ID}`);
    expect(result.reason).toContain(`gemini/auto-fix-${RUN_ID}`);
    expect(result.reason).toContain("orphan");
  });

  it("only ever deletes the current run's branch, never other AI branches", async () => {
    const a = adapters({ createPullRequest: vi.fn().mockResolvedValue({ valid: false, error: "boom" }) });
    await publishVerifiedRepair(opts(a, { runId: "run-42" }));
    for (const call of a.deleteBranch.mock.calls) {
      expect(call[0].name).toBe("gemini/auto-fix-run-42");
      expect(call[0].name).not.toContain("other");
    }
  });
});

describe("duplicate runId / branch already exists", () => {
  it("fails closed without committing or pushing when the branch already exists", async () => {
    const a = adapters({
      createBranch: vi.fn().mockResolvedValue({ valid: false, code: "branch-exists", error: "already exists" })
    });
    const result = await publishVerifiedRepair(opts(a));
    expect(result.status).toBe(PUBLICATION_STATUS.BRANCH_EXISTS);
    expect(result.publicationAllowed).toBe(false);
    expect(a.createBranch).toHaveBeenCalledTimes(1);
    expect(a.commit).not.toHaveBeenCalled();
    expect(a.push).not.toHaveBeenCalled();
    expect(a.createPullRequest).not.toHaveBeenCalled();
    expect(a.deleteBranch).not.toHaveBeenCalled();
  });
});

describe("redaction", () => {
  it("never leaks secrets, env dumps, or absolute paths into the result", async () => {
    const a = adapters();
    a.readRemoteHead.mockRejectedValueOnce(new Error(`failed with ${SECRET} at ${ABSOLUTE_PATH}; ${ENV_DUMP}`));
    const result = await publishVerifiedRepair({
      ...opts(a),
      limits: { environment: { FIXTURE_SECRET: SECRET, PATH: "/usr/local/bin:/usr/bin", HOME: ABSOLUTE_PATH } }
    });
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain(SECRET);
    expect(serialized).not.toContain(ABSOLUTE_PATH);
    expect(serialized).not.toContain("ghp_");
    expect(serialized).toContain("REDACTED_KEY");
  });

  it("never leaks secrets into the PR body", async () => {
    const leakedCandidate = candidate({
      findingTitle: `stale value ${SECRET}`,
      green: { ...candidate().green, fixSummary: `leaked ${FAKE_TOKEN}` }
    });
    const a = adapters();
    await publishVerifiedRepair({
      ...opts(a, { candidate: leakedCandidate }),
      limits: { environment: { FIXTURE_SECRET: SECRET, PATH: "/usr/local/bin:/usr/bin", HOME: ABSOLUTE_PATH } }
    });
    const body = a.createPullRequest.mock.calls[0][0].body as string;
    expect(body).not.toContain(SECRET);
    expect(body).not.toContain(FAKE_TOKEN);
    expect(body).not.toContain(ABSOLUTE_PATH);
  });

  it("never leaks secrets embedded in runUrl into the PR body", async () => {
    const leakedCandidate = candidate({
      runUrl: `https://github.com/nurockplayer/Jabiko/actions/runs/424242?token=${SECRET}`
    });
    const a = adapters();
    await publishVerifiedRepair({
      ...opts(a, { candidate: leakedCandidate }),
      limits: { environment: { FIXTURE_SECRET: SECRET, PATH: "/usr/local/bin:/usr/bin", HOME: ABSOLUTE_PATH } }
    });
    const body = a.createPullRequest.mock.calls[0][0].body as string;
    expect(body).not.toContain(SECRET);
    expect(body).toContain("424242");
  });

  it("never leaks secrets embedded in green.checks[].name into the PR body", async () => {
    const leakedCandidate = candidate({
      green: {
        ...candidate().green,
        checks: [
          ...candidate().green.checks,
          { name: `secret-check ${FAKE_TOKEN}`, status: "passed" }
        ]
      }
    });
    const a = adapters();
    await publishVerifiedRepair({
      ...opts(a, { candidate: leakedCandidate }),
      limits: { environment: { FIXTURE_SECRET: SECRET, PATH: "/usr/local/bin:/usr/bin", HOME: ABSOLUTE_PATH } }
    });
    const body = a.createPullRequest.mock.calls[0][0].body as string;
    expect(body).not.toContain(FAKE_TOKEN);
  });

  it("never leaks a secret-shaped string embedded in a path field into the PR body", async () => {
    // Defense in depth: even a candidate that somehow reaches body rendering
    // with a secret-shaped path must not leak it into the PR body.
    const leakedPath = `src/domain/${FAKE_TOKEN}.ts`;
    const body = buildPullRequestBody(
      {
        ...candidate(),
        green: { ...candidate().green, productionFiles: [leakedPath] },
        red: { ...candidate().red, testFile: leakedPath }
      },
      { runId: RUN_ID, repository: REPOSITORY }
    );
    expect(body).not.toContain(FAKE_TOKEN);
  });

  it("scrubs control characters out of narrative fields so Markdown cannot be injected", async () => {
    const leakedCandidate = candidate({
      findingTitle: "stale value\n\n## Fake Heading\n**bold**",
      green: {
        ...candidate().green,
        rootCause: "root\n\t## Injected\n",
        fixSummary: "fix\r\nline"
      }
    });
    const a = adapters();
    await publishVerifiedRepair(opts(a, { candidate: leakedCandidate }));
    const body = a.createPullRequest.mock.calls[0][0].body as string;
    // Control characters are collapsed to spaces, so an injected "##" can never
    // form a standalone Markdown heading line (no newline before it).
    const lines = body.split("\n");
    expect(lines.some((line) => line.trim().startsWith("## Fake Heading"))).toBe(false);
    expect(lines.some((line) => line.trim().startsWith("## Injected"))).toBe(false);
    expect(body).toContain("stale value");
  });
});

describe("never force-push / merge / rebase / auto-merge", () => {
  it("never passes force/merge/rebase/admin flags to the injected adapters", async () => {
    const a = adapters();
    await publishVerifiedRepair(opts(a));

    // The PR body necessarily contains the human-review / "do not auto-merge"
    // warning text, so only adapter options are scanned here (never the body).
    const pushCall = JSON.stringify(a.push.mock.calls);
    expect(pushCall).not.toContain("--force");
    expect(pushCall).not.toContain("--force-with-lease");
    expect(pushCall).not.toContain("rebase");
    expect(pushCall).not.toContain("admin");

    const commitCall = JSON.stringify(a.commit.mock.calls);
    expect(commitCall).not.toContain("--force");
    expect(commitCall).not.toContain("rebase");

    const prCall = JSON.stringify(a.createPullRequest.mock.calls);
    expect(prCall).not.toContain("--force");
    expect(prCall).not.toContain("autoMerge");
    expect(prCall).not.toContain("admin");

    const branchCall = JSON.stringify(a.createBranch.mock.calls);
    expect(branchCall).not.toContain("--force");

    const deleteCall = JSON.stringify(a.deleteBranch.mock.calls);
    expect(deleteCall).not.toContain("--force");
  });

  it("buildPullRequestBody emits a deterministic sanitized body", () => {
    const body = buildPullRequestBody(candidate(), { runId: RUN_ID, repository: REPOSITORY });
    expect(body).toContain("human review");
    expect(body).toContain("fix:");
    expect(body).not.toContain(SECRET);
  });
});
