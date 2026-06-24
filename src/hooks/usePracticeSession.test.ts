import { describe, expect, it } from "vitest";
import { initialLevelRange } from "./usePracticeSession";

// The pure seed logic for a session's starting level range (#199): an
// explicit launch request wins; otherwise the global target preference,
// clamped so 単字 never starts on a band its picker can't show.
describe("initialLevelRange (#199)", () => {
  it("uses an explicit init.levelRange over the global preference", () => {
    expect(initialLevelRange({ mode: "exam", levelRange: "n1n2" }, "n4n5")).toBe("n1n2");
  });

  it("falls back to the global target preference when init has none", () => {
    expect(initialLevelRange({ mode: "daily" }, "n4n5")).toBe("n4n5");
    expect(initialLevelRange({ mode: "exam" }, "n2n3")).toBe("n2n3");
  });

  it("defaults to 'all' when there is no preference", () => {
    expect(initialLevelRange(undefined, null)).toBe("all");
    expect(initialLevelRange({ mode: "daily" }, null)).toBe("all");
  });

  it("clamps an n4n5 preference to 'all' for 単字 mode (no n4n5 jlpt vocab)", () => {
    expect(initialLevelRange({ mode: "vocab" }, "n4n5")).toBe("all");
  });

  it("keeps a vocab-valid preference for 単字 mode", () => {
    expect(initialLevelRange({ mode: "vocab" }, "n2n3")).toBe("n2n3");
    expect(initialLevelRange({ mode: "vocab" }, "n1n2")).toBe("n1n2");
  });
});
