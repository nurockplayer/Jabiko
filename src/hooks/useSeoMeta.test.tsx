import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useSeoMeta } from "./useSeoMeta";
import { seoForView } from "../domain/seo";
import type { AppView } from "../domain/routes";

const desc = () =>
  document.head.querySelector('meta[name="description"]')?.getAttribute("content");
const canonical = () =>
  document.head.querySelector('link[rel="canonical"]')?.getAttribute("href");
const prop = (key: string) =>
  document.head.querySelector(`meta[property="${key}"]`)?.getAttribute("content");

describe("useSeoMeta", () => {
  beforeEach(() => {
    document.head.innerHTML = "";
    document.title = "";
  });

  it("sets the document title and description for the active view", () => {
    renderHook(() => useSeoMeta("mock"));
    const s = seoForView("mock");
    expect(document.title).toBe(s.title);
    expect(desc()).toBe(s.description);
  });

  it("writes an absolute canonical and og:url", () => {
    renderHook(() => useSeoMeta("learn"));
    const s = seoForView("learn");
    expect(canonical()).toBe(s.canonical);
    expect(prop("og:url")).toBe(s.canonical);
    expect(prop("og:title")).toBe(s.title);
    expect(prop("og:description")).toBe(s.description);
  });

  it("updates existing tags in place when the view changes (no duplicates)", () => {
    const { rerender } = renderHook(({ v }) => useSeoMeta(v), {
      initialProps: { v: "home" as AppView }
    });
    rerender({ v: "kanji" });

    expect(document.head.querySelectorAll('meta[name="description"]').length).toBe(1);
    expect(document.head.querySelectorAll('link[rel="canonical"]').length).toBe(1);
    expect(document.title).toBe(seoForView("kanji").title);
    expect(canonical()).toBe(seoForView("kanji").canonical);
  });

  it("reuses a description tag that already exists in the static HTML", () => {
    const existing = document.createElement("meta");
    existing.setAttribute("name", "description");
    existing.setAttribute("content", "stale");
    document.head.appendChild(existing);

    renderHook(() => useSeoMeta("rules"));
    expect(document.head.querySelectorAll('meta[name="description"]').length).toBe(1);
    expect(desc()).toBe(seoForView("rules").description);
  });
});
