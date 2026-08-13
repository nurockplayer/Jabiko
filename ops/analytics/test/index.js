// Directory entrypoint for `node --test ops/analytics/test/` on Node 22+.
//
// `node --test <dir>` resolves this file as the directory entrypoint and runs it
// under the test runner. The runner sets NODE_TEST_CONTEXT in the environment,
// so a nested `node --test` spawned from here would inherit it and skip the real
// files ("skipping running files") while still exiting 0 — silently gating
// nothing in CI. Delegate to a fresh `node --test` over the concrete .test.mjs
// files with NODE_TEST_CONTEXT cleared so the child runs the full suite.
import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dir = dirname(fileURLToPath(import.meta.url));
const files = readdirSync(dir)
  .filter((name) => name.endsWith(".test.mjs"))
  .sort()
  .map((name) => join(dir, name));

const childEnv = { ...process.env };
delete childEnv.NODE_TEST_CONTEXT;

const child = spawnSync(process.execPath, ["--test", ...files], {
  stdio: "inherit",
  env: childEnv
});

if (child.error) throw child.error;
if (child.signal) {
  throw new Error(`analytics test runner terminated by ${child.signal}`);
}
process.exitCode = child.status ?? 1;
