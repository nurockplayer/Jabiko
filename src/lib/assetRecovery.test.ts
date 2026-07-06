import { afterEach, describe, expect, it, vi } from "vitest";
import { extractAssetUrls, isChunkLoadError, recoverPoisonedAssets } from "./assetRecovery";

// 2026-07-06 outage: /assets/* chunks poisoned as text/html got pinned in the
// browser HTTP cache by the immutable header — a plain reload never refetches
// them. Recovery must overwrite those cache entries (fetch cache:"reload"),
// drop any stale service worker, and clear Cache Storage, all without ever
// throwing (best effort in old browsers).

describe("isChunkLoadError", () => {
  it("recognises the chunk-load failure shapes of the major engines", () => {
    // Chrome
    expect(
      isChunkLoadError(
        new TypeError(
          "Failed to fetch dynamically imported module: https://jabiko.app/assets/ChallengePanel-D0s6xzVg.js"
        )
      )
    ).toBe(true);
    // Firefox
    expect(isChunkLoadError(new TypeError("error loading dynamically imported module"))).toBe(true);
    // Safari
    expect(isChunkLoadError(new TypeError("Importing a module script failed."))).toBe(true);
  });

  it("does not fire for ordinary render errors", () => {
    expect(isChunkLoadError(new Error("Cannot read properties of undefined"))).toBe(false);
    expect(isChunkLoadError(null)).toBe(false);
  });
});

describe("extractAssetUrls", () => {
  it("pulls the /assets/ URL out of a Chrome-style error message", () => {
    const error = new TypeError(
      "Failed to fetch dynamically imported module: https://jabiko.app/assets/ChallengePanel-D0s6xzVg.js"
    );
    expect(extractAssetUrls(error)).toEqual([
      "https://jabiko.app/assets/ChallengePanel-D0s6xzVg.js"
    ]);
  });

  it("returns [] when the engine gives no URL (Safari/Firefox)", () => {
    expect(extractAssetUrls(new TypeError("Importing a module script failed."))).toEqual([]);
    expect(extractAssetUrls(undefined)).toEqual([]);
  });
});

describe("recoverPoisonedAssets", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("overwrites the poisoned HTTP-cache entry, unregisters SWs, and clears Cache Storage", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("js"));
    vi.stubGlobal("fetch", fetchMock);

    const unregister = vi.fn().mockResolvedValue(true);
    vi.stubGlobal("navigator", {
      ...navigator,
      serviceWorker: { getRegistrations: vi.fn().mockResolvedValue([{ unregister }]) }
    });

    const cacheDelete = vi.fn().mockResolvedValue(true);
    vi.stubGlobal("caches", {
      keys: vi.fn().mockResolvedValue(["workbox-precache-v2"]),
      delete: cacheDelete
    });

    const error = new TypeError(
      "Failed to fetch dynamically imported module: https://jabiko.app/assets/ChallengePanel-D0s6xzVg.js"
    );
    const acted = await recoverPoisonedAssets(error);

    expect(acted).toBe(true);
    // The one call that can actually evict an immutable poisoned entry:
    expect(fetchMock).toHaveBeenCalledWith(
      "https://jabiko.app/assets/ChallengePanel-D0s6xzVg.js",
      expect.objectContaining({ cache: "reload" })
    );
    expect(unregister).toHaveBeenCalled();
    expect(cacheDelete).toHaveBeenCalledWith("workbox-precache-v2");
  });

  it("never throws when the browser lacks SW/caches APIs", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    vi.stubGlobal("navigator", { ...navigator, serviceWorker: undefined });
    vi.stubGlobal("caches", undefined);

    await expect(
      recoverPoisonedAssets(new TypeError("Importing a module script failed."))
    ).resolves.toBe(true); // SW/caches best-effort still counts as an attempt
  });
});
