import { describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  canCreateSymlinks,
  probeSymlinkSupport,
  SYMLINK_SKIP_REASON
} from "./symlink-support.js";

/**
 * These tests guard the capability probe that gates the symlink-containment
 * security tests in blocker-fixes.test.ts. The probe must be *accurate*: a
 * false negative would silently disable real security assertions on CI, which
 * is far worse than the Windows EPERM noise it exists to remove.
 */
describe("probeSymlinkSupport", () => {
  it("returns a boolean", () => {
    expect(typeof probeSymlinkSupport()).toBe("boolean");
  });

  it("agrees with what fs.symlinkSync actually does on this machine", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "jabiko-symlink-truth-"));
    try {
      const target = path.join(dir, "target.txt");
      fs.writeFileSync(target, "truth");

      let actuallyWorks: boolean;
      try {
        fs.symlinkSync(target, path.join(dir, "link.txt"));
        actuallyWorks = true;
      } catch {
        actuallyWorks = false;
      }

      // The probe must never claim symlinks are unavailable on a machine that
      // can create them — that is what would skip the security tests on CI.
      expect(probeSymlinkSupport()).toBe(actuallyWorks);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("detects directory symlinks too, not just file symlinks", () => {
    // blocker-fixes.test.ts symlinks directories (.tmp -> outside,
    // src/domain -> supabase), so a file-only probe would under-detect.
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "jabiko-symlink-dir-"));
    try {
      const target = path.join(dir, "target-dir");
      fs.mkdirSync(target);

      let dirSymlinksWork: boolean;
      try {
        fs.symlinkSync(target, path.join(dir, "link-dir"), "dir");
        dirSymlinksWork = true;
      } catch {
        dirSymlinksWork = false;
      }

      expect(probeSymlinkSupport()).toBe(dirSymlinksWork);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("leaves no probe directories behind", () => {
    const before = fs.readdirSync(os.tmpdir()).filter(isProbeArtifact);
    probeSymlinkSupport();
    probeSymlinkSupport();
    const after = fs.readdirSync(os.tmpdir()).filter(isProbeArtifact);
    expect(after).toEqual(before);
  });

  it("fails closed when the probe directory is unusable", () => {
    const missing = path.join(os.tmpdir(), "jabiko-does-not-exist-" + process.pid);
    expect(probeSymlinkSupport(missing)).toBe(false);
  });
});

describe("canCreateSymlinks", () => {
  it("matches a fresh probe", () => {
    expect(canCreateSymlinks()).toBe(probeSymlinkSupport());
  });

  it("is stable across calls (cached)", () => {
    expect(canCreateSymlinks()).toBe(canCreateSymlinks());
  });
});

describe("SYMLINK_SKIP_REASON", () => {
  it("explains why the tests are skipped and how to enable them", () => {
    expect(SYMLINK_SKIP_REASON).toMatch(/symlink/i);
    expect(SYMLINK_SKIP_REASON).toMatch(/developer mode|administrator/i);
  });
});

function isProbeArtifact(name: string): boolean {
  return name.startsWith("jabiko-symlink-probe-");
}
