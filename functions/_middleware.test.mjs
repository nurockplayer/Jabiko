// Tests for the Pages Functions middleware that 301s the old shared origin
// (jabiko.pages.dev) to the canonical custom domain. Plain .mjs on purpose:
// Cloudflare Pages bundles functions/ itself, outside the app's tsc scope.
import { describe, expect, it } from "vitest";
import { onRequest, redirectTargetFor } from "./_middleware.js";

describe("pages.dev -> jabiko.app middleware", () => {
  it("301s old-origin pages to the same path+query on jabiko.app", () => {
    expect(redirectTargetFor("https://jabiko.pages.dev/")).toBe("https://jabiko.app/");
    expect(redirectTargetFor("https://jabiko.pages.dev/about")).toBe("https://jabiko.app/about");
    expect(redirectTargetFor("https://jabiko.pages.dev/grammar/n5?lang=ja")).toBe(
      "https://jabiko.app/grammar/n5?lang=ja"
    );
  });

  it("exempts the origin-migration bridge (with and without .html)", () => {
    expect(redirectTargetFor("https://jabiko.pages.dev/migration-bridge")).toBeNull();
    expect(redirectTargetFor("https://jabiko.pages.dev/migration-bridge.html")).toBeNull();
  });

  it("never redirects the canonical domain or preview deployments", () => {
    expect(redirectTargetFor("https://jabiko.app/about")).toBeNull();
    expect(redirectTargetFor("https://abc123.jabiko.pages.dev/about")).toBeNull();
    expect(redirectTargetFor("http://localhost:5173/")).toBeNull();
  });

  it("onRequest returns a 301 Response for the old origin and passes through otherwise", async () => {
    const redirected = await onRequest({
      request: new Request("https://jabiko.pages.dev/mock"),
      next: () => Promise.resolve(new Response("shell"))
    });
    expect(redirected.status).toBe(301);
    expect(redirected.headers.get("location")).toBe("https://jabiko.app/mock");

    const passed = await onRequest({
      request: new Request("https://jabiko.app/mock"),
      next: () => Promise.resolve(new Response("shell"))
    });
    expect(await passed.text()).toBe("shell");
  });
});
