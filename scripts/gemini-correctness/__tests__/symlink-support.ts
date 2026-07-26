import fs from "node:fs";
import os from "node:os";
import path from "node:path";

/**
 * Symlink-capability detection for the containment tests in
 * blocker-fixes.test.ts.
 *
 * Those tests build fixtures with fs.symlinkSync to prove that the scanner and
 * write-path policy refuse symlink escapes. Creating a symlink on Windows needs
 * SeCreateSymbolicLinkPrivilege — i.e. an elevated shell or Developer Mode —
 * so on an ordinary Windows dev box the *fixture* dies with EPERM and the run
 * is permanently red for a reason that has nothing to do with the code under
 * test. Linux/macOS (and CI) create symlinks freely and run the assertions for
 * real.
 *
 * This probe gates those suites so they skip instead of failing where the OS
 * cannot host the fixture. It must never produce a false negative: a wrong
 * "no symlinks here" would silently disable real security assertions on CI.
 * Hence an actual create-a-symlink probe rather than a platform sniff.
 */

/** Guidance printed / attached wherever the containment suites are skipped. */
export const SYMLINK_SKIP_REASON =
  "this machine cannot create symlinks (on Windows, enable Developer Mode or " +
  "run as Administrator); the symlink-containment assertions still run on CI";

/**
 * Actually create a symlink in a throwaway directory and report whether it
 * worked. Both a file and a directory symlink are attempted because the
 * containment fixtures use both, and Windows treats them as separate calls.
 *
 * @param baseDir directory to create the throwaway probe dir in.
 * @returns true only if both symlink kinds were created successfully.
 */
export function probeSymlinkSupport(baseDir: string = os.tmpdir()): boolean {
  let probeDir: string | undefined;
  try {
    probeDir = fs.mkdtempSync(path.join(baseDir, "jabiko-symlink-probe-"));

    const fileTarget = path.join(probeDir, "target.txt");
    fs.writeFileSync(fileTarget, "probe");
    fs.symlinkSync(fileTarget, path.join(probeDir, "link.txt"), "file");

    const dirTarget = path.join(probeDir, "target-dir");
    fs.mkdirSync(dirTarget);
    fs.symlinkSync(dirTarget, path.join(probeDir, "link-dir"), "dir");

    return true;
  } catch {
    // Fail closed: EPERM (no privilege), EACCES, ENOENT (unusable baseDir), or
    // a filesystem that has no symlinks at all all mean "cannot build the
    // fixture here".
    return false;
  } finally {
    if (probeDir !== undefined) {
      try {
        fs.rmSync(probeDir, { recursive: true, force: true });
      } catch {
        // Best-effort cleanup; a leftover temp dir must not fail a test run.
      }
    }
  }
}

let cached: boolean | undefined;

/**
 * probeSymlinkSupport(), evaluated once per process. Suites call this at
 * collection time, so it needs to be cheap on repeat.
 */
export function canCreateSymlinks(): boolean {
  if (cached === undefined) cached = probeSymlinkSupport();
  return cached;
}
