import { describe, expect, it } from "vitest";
import { shuffleOrderFragments } from "./wordOrder";

describe("shuffleOrderFragments", () => {
  const prompt = "［長期的な視点 / なくしては / 持続的な成長は / 望めない］";
  const fragments = ["長期的な視点", "なくしては", "持続的な成長は", "望めない"];

  const parse = (out: string) =>
    out
      .slice("［".length, out.length - "］".length)
      .split("/")
      .map((f) => f.trim());

  it("returns a permutation of the original fragments, keeping ［］ wrapper", () => {
    const out = shuffleOrderFragments(prompt, "n1-order-1");
    expect(out.startsWith("［")).toBe(true);
    expect(out.endsWith("］")).toBe(true);
    expect([...parse(out)].sort()).toEqual([...fragments].sort());
  });

  it("never reproduces the original answer order (no leak)", () => {
    for (const id of ["a", "b", "c", "n1-order-x", "seed-123", "望めない"]) {
      expect(shuffleOrderFragments(prompt, id)).not.toBe(prompt);
    }
  });

  it("forces a different order even for a 2-fragment prompt", () => {
    const two = "［前半 / 後半］";
    for (const id of ["x", "y", "z", "1", "2"]) {
      expect(shuffleOrderFragments(two, id)).not.toBe(two);
    }
  });

  it("is stable for the same seed across calls", () => {
    expect(shuffleOrderFragments(prompt, "same")).toBe(shuffleOrderFragments(prompt, "same"));
  });

  it("returns the input unchanged when not a parseable ［...］ list", () => {
    expect(shuffleOrderFragments("ふつうの文です。", "id")).toBe("ふつうの文です。");
    expect(shuffleOrderFragments("［ひとつだけ］", "id")).toBe("［ひとつだけ］");
    expect(shuffleOrderFragments("", "id")).toBe("");
  });
});
