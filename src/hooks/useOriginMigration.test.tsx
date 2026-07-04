import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useOriginMigration } from "./useOriginMigration";
import {
  BRIDGE_PATH,
  MIGRATED_FLAG_KEY,
  MIGRATION_ATTEMPTS_KEY,
  MIGRATION_MESSAGE_PAYLOAD,
  MIGRATION_SOURCE_ORIGIN
} from "../domain/originMigration";

function bridgeReply(entries: Array<{ key: string; value: string }>, origin = MIGRATION_SOURCE_ORIGIN) {
  window.dispatchEvent(
    new MessageEvent("message", { origin, data: { type: MIGRATION_MESSAGE_PAYLOAD, entries } })
  );
}

// The shared setup pins jabiko.lang but does NOT clear storage between tests,
// so the migration bookkeeping written by one case would silently disable the
// hook in the next (a fake green). Reset exactly the keys this suite touches.
beforeEach(() => {
  localStorage.removeItem(MIGRATED_FLAG_KEY);
  localStorage.removeItem(MIGRATION_ATTEMPTS_KEY);
  localStorage.removeItem("jabiko:attempts");
});

afterEach(() => {
  document.querySelectorAll("iframe").forEach((f) => f.remove());
});

describe("useOriginMigration", () => {
  it("does nothing off the new origin (default test hostname)", () => {
    renderHook(() => useOriginMigration());
    expect(document.querySelector("iframe")).toBeNull();
  });

  it("mounts the hidden bridge iframe and imports the reply on jabiko.app", async () => {
    localStorage.removeItem("jabiko:attempts");
    const reload = vi.fn();
    renderHook(() => useOriginMigration({ hostname: "jabiko.app", reload }));

    const iframe = document.querySelector("iframe");
    expect(iframe).not.toBeNull();
    expect(iframe!.src).toBe(`${MIGRATION_SOURCE_ORIGIN}${BRIDGE_PATH}`);
    // The attempt is counted up front so a hung bridge still burns a retry.
    expect(localStorage.getItem(MIGRATION_ATTEMPTS_KEY)).toBe("1");

    bridgeReply([{ key: "jabiko:attempts", value: "[7]" }]);

    await waitFor(() => expect(localStorage.getItem("jabiko:attempts")).toBe("[7]"));
    expect(localStorage.getItem(MIGRATED_FLAG_KEY)).toBe("1");
    expect(reload).toHaveBeenCalledTimes(1); // imported > 0 -> re-init the app
    expect(document.querySelector("iframe")).toBeNull(); // cleaned up
  });

  it("marks migration done without reloading when the old origin had nothing", async () => {
    localStorage.removeItem("jabiko:attempts");
    const reload = vi.fn();
    renderHook(() => useOriginMigration({ hostname: "jabiko.app", reload }));

    bridgeReply([]);

    await waitFor(() => expect(localStorage.getItem(MIGRATED_FLAG_KEY)).toBe("1"));
    expect(reload).not.toHaveBeenCalled();
  });

  it("ignores replies from any other origin", async () => {
    localStorage.removeItem("jabiko:attempts");
    const reload = vi.fn();
    renderHook(() => useOriginMigration({ hostname: "jabiko.app", reload }));

    bridgeReply([{ key: "jabiko:attempts", value: "[666]" }], "https://evil.example");

    // Nothing may be imported from a foreign origin.
    await new Promise((r) => setTimeout(r, 50));
    expect(localStorage.getItem("jabiko:attempts")).toBeNull();
    expect(localStorage.getItem(MIGRATED_FLAG_KEY)).toBeNull();
    expect(reload).not.toHaveBeenCalled();
  });
});
