// Node 22 resolves `node --test ops/analytics/test/` as this directory entrypoint.
// Delegate the actual contract files to a fresh test-runner process so each
// `.test.mjs` keeps normal file isolation; importing every test into this one
// worker triggers nested test-runner IPC/deserialization failures on Node 22.
import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dir = dirname(fileURLToPath(import.meta.url));
const files = readdirSync(dir)
  .filter((name) => name.endsWith(".test.mjs"))
  .sort()
  .map((name) => join(dir, name));

const child = spawnSync(process.execPath, ["--test", ...files], {
  stdio: "inherit"
});

if (child.error) throw child.error;
if (child.signal) {
  throw new Error(`analytics test runner terminated by ${child.signal}`);
}
process.exitCode = child.status ?? 1;
