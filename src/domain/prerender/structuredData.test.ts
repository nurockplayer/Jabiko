import { describe, expect, it } from "vitest";
import { personJsonLd } from "./structuredData";

describe("personJsonLd", () => {
  const json = personJsonLd();
  const parsed = JSON.parse(json);

  it("is a Person entity for the author at /about", () => {
    expect(parsed["@context"]).toBe("https://schema.org");
    expect(parsed["@type"]).toBe("Person");
    expect(parsed.name).toContain("花雪");
    expect(parsed.url).toBe("https://jabiko.app/about");
  });

  it("omits sameAs while no profile URLs are configured (never empty array)", () => {
    // sameAs must be a non-empty array of real URLs or absent -- an empty
    // array is a meaningless signal.
    if ("sameAs" in parsed) {
      expect(Array.isArray(parsed.sameAs)).toBe(true);
      expect(parsed.sameAs.length).toBeGreaterThan(0);
    }
  });

  it("is safe to embed inside a <script> tag", () => {
    expect(json).not.toContain("<");
  });
});
