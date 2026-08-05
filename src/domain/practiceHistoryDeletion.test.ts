import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  deletionMarkerKey,
  readDeletionMarker,
  removeDeletionMarker,
  writeDeletionMarker
} from "./practiceHistoryDeletion";

// #692: per-user pending marker for synced-history deletion. These tests pin
// the fixed key, per-user isolation, crash-safe read/write/remove, and the
// guarantee that the marker is only ever a boolean flag.

beforeEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe("practiceHistoryDeletion marker", () => {
  it("reads false for an untouched user", () => {
    expect(readDeletionMarker("user-1")).toBe(false);
  });

  it("write then read is true for that user only (per-user isolation)", () => {
    expect(writeDeletionMarker("user-A")).toBe(true);
    expect(readDeletionMarker("user-A")).toBe(true);
    // A different user is never affected.
    expect(readDeletionMarker("user-B")).toBe(false);
  });

  it("uses the fixed key jabiko.attempt-history-delete-pending:<userId>", () => {
    expect(deletionMarkerKey("user-42")).toBe(
      "jabiko.attempt-history-delete-pending:user-42"
    );
    writeDeletionMarker("user-42");
    expect(window.localStorage.getItem("jabiko.attempt-history-delete-pending:user-42")).toBe("1");
  });

  it("remove clears the marker", () => {
    expect(writeDeletionMarker("user-A")).toBe(true);
    expect(removeDeletionMarker("user-A")).toBe(true);
    expect(readDeletionMarker("user-A")).toBe(false);
  });

  it("write fails (blocked storage) -> returns false and marker stays unset", () => {
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    try {
      expect(writeDeletionMarker("user-A")).toBe(false);
      expect(readDeletionMarker("user-A")).toBe(false);
    } finally {
      spy.mockRestore();
    }
  });

  it("remove fails (blocked storage) -> returns false and marker persists", () => {
    writeDeletionMarker("user-A");
    const spy = vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    try {
      expect(removeDeletionMarker("user-A")).toBe(false);
      // The flag is still readable, so the next login can resume cleanup.
      expect(window.localStorage.getItem(deletionMarkerKey("user-A"))).toBe("1");
    } finally {
      spy.mockRestore();
    }
  });

  it("never stores attempt payload / email / token -- only a boolean flag", () => {
    writeDeletionMarker("user-A");
    expect(window.localStorage.getItem(deletionMarkerKey("user-A"))).toBe("1");
  });
});
