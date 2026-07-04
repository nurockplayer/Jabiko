import { describe, expect, it, vi } from "vitest";
import {
  applyMigrationPayload,
  BRIDGE_PATH,
  collectMigrationEntries,
  isMigratableKey,
  legacyRedirectTarget,
  MIGRATION_MESSAGE_PAYLOAD,
  MIGRATION_MESSAGE_REQUEST,
  MIGRATION_SOURCE_ORIGIN,
  MIGRATION_TARGET_ORIGIN,
  runBridgeResponder,
  shouldAttemptMigration
} from "./originMigration";

// In-memory Storage stand-in (jsdom localStorage works too, but an explicit
// map keeps each case isolated and lets us model the OLD origin's storage).
function fakeStorage(initial: Record<string, string> = {}): Storage {
  const map = new Map(Object.entries(initial));
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (k: string) => (map.has(k) ? map.get(k)! : null),
    key: (i: number) => [...map.keys()][i] ?? null,
    removeItem: (k: string) => void map.delete(k),
    setItem: (k: string, v: string) => void map.set(k, v)
  };
}

describe("originMigration (pages.dev -> jabiko.app, #jabiko-app-domain)", () => {
  it("only allows app keys and the Supabase session prefix", () => {
    expect(isMigratableKey("jabiko:attempts")).toBe(true);
    expect(isMigratableKey("jabiko:targetLevel")).toBe(true);
    expect(isMigratableKey("jabiko:howItWorksDismissed")).toBe(true);
    expect(isMigratableKey("jabiko.lang")).toBe(true);
    expect(isMigratableKey("jabiko.theme")).toBe(true);
    expect(isMigratableKey("jabiko.furigana")).toBe(true);
    expect(isMigratableKey("jabiko.sessionLength")).toBe(true);
    expect(isMigratableKey("sb-abcdef-auth-token")).toBe(true);

    // Never ferry unrelated or attacker-chosen keys across origins.
    expect(isMigratableKey("__proto__")).toBe(false);
    expect(isMigratableKey("randomKey")).toBe(false);
    expect(isMigratableKey("jabikoX")).toBe(false);
    expect(isMigratableKey("jabiko:migrated")).toBe(false); // flags stay per-origin
    expect(isMigratableKey("jabiko:migrationAttempts")).toBe(false);
  });

  it("collects only migratable entries from the source storage", () => {
    const source = fakeStorage({
      "jabiko:attempts": "[1]",
      "jabiko.lang": "ja",
      "sb-xyz-auth-token": "tok",
      junk: "no",
      "jabiko:migrated": "1"
    });

    const entries = collectMigrationEntries(source);
    const keys = entries.map((e) => e.key).sort();
    expect(keys).toEqual(["jabiko.lang", "jabiko:attempts", "sb-xyz-auth-token"]);
    expect(entries.find((e) => e.key === "jabiko.lang")?.value).toBe("ja");
  });

  it("applies a payload without overwriting existing local values", () => {
    const target = fakeStorage({ "jabiko.lang": "en" });
    const imported = applyMigrationPayload(
      [
        { key: "jabiko.lang", value: "ja" }, // must NOT clobber the local choice
        { key: "jabiko:attempts", value: "[42]" },
        { key: "evil", value: "x" }, // filtered
        { key: "sb-xyz-auth-token", value: "tok" }
      ],
      target
    );

    expect(imported).toBe(2);
    expect(target.getItem("jabiko.lang")).toBe("en");
    expect(target.getItem("jabiko:attempts")).toBe("[42]");
    expect(target.getItem("sb-xyz-auth-token")).toBe("tok");
    expect(target.getItem("evil")).toBeNull();
  });

  it("rejects malformed payloads defensively", () => {
    const target = fakeStorage();
    expect(applyMigrationPayload(null as never, target)).toBe(0);
    expect(applyMigrationPayload([{ key: 1, value: "x" }] as never, target)).toBe(0);
    expect(applyMigrationPayload([{ key: "jabiko.lang" }] as never, target)).toBe(0);
  });

  it("attempts migration only on the new origin, when empty, and under the retry cap", () => {
    const empty = fakeStorage();
    expect(shouldAttemptMigration("jabiko.app", empty)).toBe(true);

    // Old origin never migrates from itself.
    expect(shouldAttemptMigration("jabiko.pages.dev", empty)).toBe(false);
    expect(shouldAttemptMigration("localhost", empty)).toBe(false);

    // Already has progress -> nothing to do.
    expect(shouldAttemptMigration("jabiko.app", fakeStorage({ "jabiko:attempts": "[1]" }))).toBe(false);

    // Completed or exhausted -> stop retrying.
    expect(shouldAttemptMigration("jabiko.app", fakeStorage({ "jabiko:migrated": "1" }))).toBe(false);
    expect(shouldAttemptMigration("jabiko.app", fakeStorage({ "jabiko:migrationAttempts": "5" }))).toBe(false);
    expect(shouldAttemptMigration("jabiko.app", fakeStorage({ "jabiko:migrationAttempts": "2" }))).toBe(true);
  });

  it("pins the protocol constants the bridge page mirrors", () => {
    // public/migration-bridge.html hand-copies these values (it cannot import
    // TS); this test is the drift guard for that copy.
    expect(MIGRATION_SOURCE_ORIGIN).toBe("https://jabiko.pages.dev");
    expect(BRIDGE_PATH).toBe("/migration-bridge");
    expect(MIGRATION_MESSAGE_REQUEST).toBe("jabiko:migration-request");
    expect(MIGRATION_MESSAGE_PAYLOAD).toBe("jabiko:migration-payload");
  });

  it("legacyRedirectTarget moves top-level old-origin URLs to jabiko.app, keeping path/query/hash", () => {
    // A service-worker-controlled visitor never reaches the edge 301 — the SW
    // serves the cached shell — so the APP must also self-redirect (#449).
    expect(legacyRedirectTarget("https://jabiko.pages.dev/")).toBe("https://jabiko.app/");
    expect(legacyRedirectTarget("https://jabiko.pages.dev/mock?lang=ja#top")).toBe(
      "https://jabiko.app/mock?lang=ja#top"
    );

    // The bridge iframe and every non-old-origin host must stay put.
    expect(legacyRedirectTarget("https://jabiko.pages.dev/migration-bridge")).toBeNull();
    expect(legacyRedirectTarget("https://jabiko.app/mock")).toBeNull();
    expect(legacyRedirectTarget("https://abc123.jabiko.pages.dev/")).toBeNull();
    expect(legacyRedirectTarget("http://localhost:5173/")).toBeNull();
  });
});

describe("runBridgeResponder (in-app fallback when the SW serves the shell instead of the static bridge)", () => {
  it("answers a migration request from jabiko.app with the allowlisted entries", () => {
    const storage = fakeStorage({ "jabiko:attempts": "[9]", junk: "no" });
    const stop = runBridgeResponder(storage);
    const postMessage = vi.fn();

    window.dispatchEvent(
      new MessageEvent("message", {
        origin: MIGRATION_TARGET_ORIGIN,
        data: { type: MIGRATION_MESSAGE_REQUEST },
        source: { postMessage } as unknown as Window
      })
    );

    expect(postMessage).toHaveBeenCalledTimes(1);
    const [payload, targetOrigin] = postMessage.mock.calls[0];
    expect(targetOrigin).toBe(MIGRATION_TARGET_ORIGIN);
    expect(payload.type).toBe(MIGRATION_MESSAGE_PAYLOAD);
    expect(payload.entries).toEqual([{ key: "jabiko:attempts", value: "[9]" }]);
    stop();
  });

  it("ignores requests from any other origin", () => {
    const storage = fakeStorage({ "jabiko:attempts": "[9]" });
    const stop = runBridgeResponder(storage);
    const postMessage = vi.fn();

    window.dispatchEvent(
      new MessageEvent("message", {
        origin: "https://evil.example",
        data: { type: MIGRATION_MESSAGE_REQUEST },
        source: { postMessage } as unknown as Window
      })
    );

    expect(postMessage).not.toHaveBeenCalled();
    stop();
  });
});
