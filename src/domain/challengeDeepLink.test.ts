import { describe, expect, it } from "vitest";
import { challengeInitFromQuery, challengeQueryFromInit } from "./challengeDeepLink";

describe("challengeDeepLink", () => {
  it("parses a mode-only deep link", () => {
    expect(challengeInitFromQuery("?mode=daily")).toEqual({ mode: "daily" });
    expect(challengeInitFromQuery("?mode=review")).toEqual({ mode: "review" });
    // kana mode (#533) is deep-linkable too -- the 入門 chapter drill.
    expect(challengeInitFromQuery("?mode=kana")).toEqual({ mode: "kana" });
  });

  it("parses mode + level range", () => {
    expect(challengeInitFromQuery("?mode=exam&level=n2n3")).toEqual({
      mode: "exam",
      levelRange: "n2n3"
    });
  });

  it("parses a level-only deep link", () => {
    expect(challengeInitFromQuery("?level=n1n2")).toEqual({ levelRange: "n1n2" });
  });

  it("ignores unknown mode / level values", () => {
    expect(challengeInitFromQuery("?mode=bogus&level=zzz")).toBeUndefined();
    expect(challengeInitFromQuery("?mode=exam&level=zzz")).toEqual({ mode: "exam" });
  });

  it("returns undefined when there is nothing usable", () => {
    expect(challengeInitFromQuery("")).toBeUndefined();
    expect(challengeInitFromQuery("?foo=bar")).toBeUndefined();
  });

  it("round-trips through the query serializer", () => {
    for (const init of [
      { mode: "daily" as const },
      { mode: "exam" as const, levelRange: "n2n3" as const },
      { levelRange: "all" as const }
    ]) {
      expect(challengeInitFromQuery(challengeQueryFromInit(init))).toEqual(init);
    }
    expect(challengeQueryFromInit(undefined)).toBe("");
  });
});
