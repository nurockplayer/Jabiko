import { afterEach, describe, expect, it } from "vitest";
import {
  BOOKMARKS_KEY,
  getBookmarkedIds,
  isBookmarked,
  readBookmarkedIds,
  toggleBookmark
} from "./bookmarks";

afterEach(() => {
  window.localStorage.clear();
});

describe("bookmarks", () => {
  it("starts empty with no stored bookmarks", () => {
    expect(getBookmarkedIds()).toEqual([]);
    expect(isBookmarked("q1")).toBe(false);
    expect(readBookmarkedIds()).toEqual(new Set());
  });

  it("toggleBookmark adds a new id and returns true", () => {
    const nowBookmarked = toggleBookmark("q1");
    expect(nowBookmarked).toBe(true);
    expect(isBookmarked("q1")).toBe(true);
    expect(getBookmarkedIds()).toEqual(["q1"]);
  });

  it("toggleBookmark removes an existing id and returns false", () => {
    toggleBookmark("q1");
    const nowBookmarked = toggleBookmark("q1");
    expect(nowBookmarked).toBe(false);
    expect(isBookmarked("q1")).toBe(false);
    expect(getBookmarkedIds()).toEqual([]);
  });

  it("persists across separate reads (localStorage-backed, stateless module)", () => {
    toggleBookmark("q1");
    toggleBookmark("q2");
    // A brand-new read (no in-memory cache) still sees both.
    expect(new Set(getBookmarkedIds())).toEqual(new Set(["q1", "q2"]));
    expect(window.localStorage.getItem(BOOKMARKS_KEY)).toContain("q1");
  });

  it("keeps insertion order (most-recently-added last) and de-duplicates", () => {
    toggleBookmark("q1");
    toggleBookmark("q2");
    toggleBookmark("q3");
    expect(getBookmarkedIds()).toEqual(["q1", "q2", "q3"]);
    // Re-adding an already-removed id appends at the end (order = add order).
    toggleBookmark("q2"); // remove
    toggleBookmark("q2"); // re-add
    expect(getBookmarkedIds()).toEqual(["q1", "q3", "q2"]);
  });

  it("tolerates corrupt stored JSON by treating it as empty", () => {
    window.localStorage.setItem(BOOKMARKS_KEY, "{not json");
    expect(getBookmarkedIds()).toEqual([]);
    expect(isBookmarked("q1")).toBe(false);
    // A toggle still works, overwriting the corrupt value.
    expect(toggleBookmark("q1")).toBe(true);
    expect(getBookmarkedIds()).toEqual(["q1"]);
  });

  it("ignores non-string entries in stored JSON", () => {
    window.localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(["q1", 42, null, "q2"]));
    expect(getBookmarkedIds()).toEqual(["q1", "q2"]);
  });
});
