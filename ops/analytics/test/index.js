// Node 22 treats `node --test ops/analytics/test/` as a directory module path.
// Keep this explicit entrypoint so the repository's documented/CI command runs
// every analytics contract file without relying on shell glob expansion.
import "./apply.test.mjs";
import "./cf.test.mjs";
import "./creds.test.mjs";
import "./desired.test.mjs";
import "./ga4.test.mjs";
import "./plan.test.mjs";
import "./smoke.test.mjs";
