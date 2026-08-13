// ops/analytics CLI flag-parsing contract tests.
import test from "node:test";
import assert from "node:assert/strict";
import { parseFlags, normalizeBooleanFlag, unknownFlags } from "../src/cli/cliutil.mjs";

test("bare boolean flag parses as true", () => {
  assert.deepEqual(parseFlags(["--dry-run"], { booleans: ["dry-run"] }), {
    "dry-run": true
  });
});

test("--flag=true and --flag=false normalize for boolean flags", () => {
  assert.deepEqual(parseFlags(["--dry-run=true"], { booleans: ["dry-run"] }), {
    "dry-run": true
  });
  assert.deepEqual(parseFlags(["--dry-run=false"], { booleans: ["dry-run"] }), {
    "dry-run": false
  });
  assert.deepEqual(
    parseFlags(
      ["--yes-remove-gtag=true", "--placement-action-verified=false"],
      { booleans: ["yes-remove-gtag", "placement-action-verified"] }
    ),
    { "yes-remove-gtag": true, "placement-action-verified": false }
  );
});

test("a boolean flag with a trailing space-separated value does not invert safety", () => {
  // `--dry-run false` is treated as bare true (the stray token is ignored),
  // which is the safe default for a safety flag. It must never become false.
  const out = parseFlags(["--dry-run", "false"], { booleans: ["dry-run"] });
  assert.equal(out["dry-run"], true);
});

test("invalid boolean =value fails closed (throws) instead of guessing", () => {
  assert.throws(() => parseFlags(["--dry-run=maybe"], { booleans: ["dry-run"] }), /boolean/i);
  assert.throws(() => parseFlags(["--dry-run=1"], { booleans: ["dry-run"] }), /boolean/i);
});

test("normalizeBooleanFlag maps true/false forms and fails closed otherwise", () => {
  assert.equal(normalizeBooleanFlag(true, "x"), true);
  assert.equal(normalizeBooleanFlag("true", "x"), true);
  assert.equal(normalizeBooleanFlag(false, "x"), false);
  assert.equal(normalizeBooleanFlag("false", "x"), false);
  assert.equal(normalizeBooleanFlag(undefined, "x"), false);
  assert.equal(normalizeBooleanFlag(null, "x"), false);
  assert.throws(() => normalizeBooleanFlag("yes", "x"));
  assert.throws(() => normalizeBooleanFlag("1", "x"));
  assert.throws(() => normalizeBooleanFlag("True", "x"));
});

test("non-boolean flags keep the =value string form", () => {
  assert.deepEqual(parseFlags(["--measurement-id=G-1"]), { "measurement-id": "G-1" });
  assert.deepEqual(parseFlags(["--measurement-id", "G-1"]), { "measurement-id": "G-1" });
});

test("unknownFlags rejects typo'd safety flags (e.g. --dryrun) against the command allowlist", () => {
  assert.deepEqual(unknownFlags({ dryrun: true }, ["dry-run", "yes-remove-gtag"]), ["dryrun"]);
  assert.deepEqual(unknownFlags({ "dry-run": true }, ["dry-run", "yes-remove-gtag"]), []);
  assert.deepEqual(unknownFlags({ "placement-action-verified": "true" }, ["placement-action-verified", "measurement-id"]), []);
  assert.deepEqual(unknownFlags({ "measurement-id": "G-1" }, ["measurement-id"]), []);
  assert.deepEqual(unknownFlags({}, ["measurement-id"]), []);
});

test("a typo'd safety flag is caught before any mutation (parse + allowlist)", () => {
  // --dryrun=true must be REJECTED (unknown), not silently dropped into a real
  // dry-run=false mutation.
  const parsed = parseFlags(["--dryrun=true"], { booleans: ["dry-run", "yes-remove-gtag"] });
  const unknown = unknownFlags(parsed, ["measurement-id", "dry-run", "yes-remove-gtag"]);
  assert.deepEqual(unknown, ["dryrun"]);
  assert.equal(parsed["dry-run"], undefined, "the typo must never bind to the real safety flag");
});
