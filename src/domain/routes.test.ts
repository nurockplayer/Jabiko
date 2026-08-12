import { describe, expect, it } from "vitest";
import {
  APP_VIEW_PATHS,
  grammarRoute,
  parseRoute,
  serializeRoute,
  staticRoute,
  type AppRoute,
  type AppView
} from "./routes";

describe("app route contract (#623)", () => {
  it("round-trips every top-level view through its shared static path", () => {
    for (const view of Object.keys(APP_VIEW_PATHS) as AppView[]) {
      const route = staticRoute(view);
      expect(parseRoute(serializeRoute(route)), view).toEqual(route);
    }
  });

  it("constructs complete mutually-exclusive route identities", () => {
    expect(staticRoute("learn")).toEqual({
      view: "learn",
      grammarSurface: null
    });
    expect(grammarRoute("〜てもいい")).toEqual({
      view: "grammar",
      grammarSurface: "〜てもいい"
    });
    expect(grammarRoute()).toEqual({
      view: "grammar",
      grammarSurface: null
    });
  });

  it("treats /stay-d as a normal public app route", () => {
    expect(APP_VIEW_PATHS.stayD).toBe("/stay-d");
    expect(parseRoute("/stay-d")).toEqual(staticRoute("stayD"));
  });

  it("round-trips an encoded grammar surface", () => {
    const route: AppRoute = {
      view: "grammar",
      grammarSurface: "〜てもいい"
    };

    expect(serializeRoute(route)).toBe(`/grammar/${encodeURIComponent("〜てもいい")}`);
    expect(parseRoute(serializeRoute(route))).toEqual(route);
  });

  it("falls an unknown path back to the home route", () => {
    expect(parseRoute("/does-not-exist")).toEqual(staticRoute("home"));
  });

  // The 文章 section was removed in 2026-08 (moved to the author's own site).
  // Its published URLs are still out there, so they must keep resolving to a
  // real view instead of a broken shell -- they take the unknown-path fallback.
  it("sends every retired /blog URL to home", () => {
    expect(APP_VIEW_PATHS).not.toHaveProperty("blog");
    for (const retired of [
      "/blog",
      "/blog/cho-saikyo-tokimeki",
      "/blog/sweet-step-steady",
      "/blog/anything/deeper"
    ]) {
      expect(parseRoute(retired), retired).toEqual(staticRoute("home"));
    }
  });

  it("does not throw on a malformed encoded segment", () => {
    expect(parseRoute("/grammar/%E0%A4%A")).toEqual({
      view: "grammar",
      grammarSurface: "%E0%A4%A"
    });
  });
});
