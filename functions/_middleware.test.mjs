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

// 2026-07-06 outage guard: a missing /assets/* file used to fall through to
// the _redirects SPA rule and come back as index.html with 200 — which the
// edge/browser then cached as the asset itself (immutable), breaking the app
// for everyone who fetched during a deploy transition. The middleware must
// turn that fallback into an uncacheable 404 so poison can never be cached.
describe("/assets/* poisoned-fallback guard", () => {
  const htmlFallback = () =>
    Promise.resolve(
      new Response("<!doctype html><title>shell</title>", {
        status: 200,
        headers: { "content-type": "text/html; charset=utf-8" }
      })
    );

  it("turns an HTML fallback on an /assets/ path into an uncacheable 404", async () => {
    const res = await onRequest({
      request: new Request("https://jabiko.app/assets/ChallengePanel-XYZ.js"),
      next: htmlFallback
    });
    expect(res.status).toBe(404);
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(res.headers.get("content-type")).not.toContain("text/html");
  });

  it("passes real assets through untouched", async () => {
    const res = await onRequest({
      request: new Request("https://jabiko.app/assets/index-ABC.js"),
      next: () =>
        Promise.resolve(
          new Response("console.log(1)", {
            status: 200,
            headers: { "content-type": "application/javascript" }
          })
        )
    });
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("console.log(1)");
  });

  it("leaves the SPA HTML fallback alone for non-asset routes", async () => {
    const res = await onRequest({
      request: new Request("https://jabiko.app/challenge"),
      next: htmlFallback
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");
  });

  it("does not 301 old-origin asset requests (OG images on pages.dev keep resolving)", async () => {
    const res = await onRequest({
      request: new Request("https://jabiko.pages.dev/assets/og-XYZ.png"),
      next: () =>
        Promise.resolve(
          new Response("png-bytes", { status: 200, headers: { "content-type": "image/png" } })
        )
    });
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("png-bytes");
  });
});

describe("/ads.txt root-file contract", () => {
  it("returns a plain-text 404 instead of the SPA shell when no seller record ships", async () => {
    const res = await onRequest({
      request: new Request("https://jabiko.app/ads.txt"),
      next: () =>
        Promise.resolve(
          new Response("<!doctype html><title>shell</title>", {
            status: 200,
            headers: { "content-type": "text/html; charset=utf-8" }
          })
        )
    });
    expect(res.status).toBe(404);
    expect(res.headers.get("content-type")).toBe("text/plain; charset=utf-8");
    expect(await res.text()).toBe("Not found");
  });

  it("passes an operator-supplied plain-text seller record through unchanged", async () => {
    const sellerRecord = "account-supplied seller record";
    const res = await onRequest({
      request: new Request("https://jabiko.app/ads.txt"),
      next: () =>
        Promise.resolve(
          new Response(sellerRecord, {
            status: 200,
            headers: { "content-type": "text/plain; charset=utf-8" }
          })
        )
    });
    expect(res.status).toBe(200);
    expect(await res.text()).toBe(sellerRecord);
  });
});
