import { describe, expect, it } from "vitest";
import { APP_VIEW_PATHS, parseRoute, serializeRoute, type AppRoute, type AppView } from "./routes";

const staticRoute = (view: AppView): AppRoute => ({
  view,
  grammarSurface: null,
  blogSlug: null
});

describe("app route contract (#623)", () => {
  it("round-trips every top-level view through its shared static path", () => {
    for (const view of Object.keys(APP_VIEW_PATHS) as AppView[]) {
      const route = staticRoute(view);
      expect(parseRoute(serializeRoute(route)), view).toEqual(route);
    }
  });

  it("treats /stay-d as a normal public app route", () => {
    expect(APP_VIEW_PATHS.stayD).toBe("/stay-d");
    expect(parseRoute("/stay-d")).toEqual(staticRoute("stayD"));
  });

  it("round-trips an encoded grammar surface", () => {
    const route: AppRoute = {
      view: "grammar",
      grammarSurface: "〜てもいい",
      blogSlug: null
    };

    expect(serializeRoute(route)).toBe(`/grammar/${encodeURIComponent("〜てもいい")}`);
    expect(parseRoute(serializeRoute(route))).toEqual(route);
  });

  it("canonicalizes a legacy blog alias while parsing", () => {
    const parsed = parseRoute("/blog/sweet-step-steady");

    expect(parsed).toEqual({
      view: "blog",
      grammarSurface: null,
      blogSlug: "sweet-steady-sweet-step"
    });
    expect(serializeRoute(parsed)).toBe("/blog/sweet-steady-sweet-step");
  });

  it("falls an unknown path back to the home route", () => {
    expect(parseRoute("/does-not-exist")).toEqual(staticRoute("home"));
  });

  it("does not throw on a malformed encoded segment", () => {
    expect(parseRoute("/grammar/%E0%A4%A")).toEqual({
      view: "grammar",
      grammarSurface: "%E0%A4%A",
      blogSlug: null
    });
  });
});
