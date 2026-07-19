import { describe, expect, it } from "vitest";
import { articleJsonLd, personJsonLd } from "./structuredData";

const ARTICLE = {
  title: "日本人吃東西不只說「おいしい」",
  description: "整理あっさり、こってり等味道與口感日文。",
  canonical: "https://jabiko.app/blog/japanese-taste-texture-expressions",
  datePublished: "2026-07-13"
};

describe("articleJsonLd", () => {
  const json = articleJsonLd(ARTICLE);
  const parsed = JSON.parse(json);

  it("is a BlogPosting with the article's headline/description/url", () => {
    expect(parsed["@context"]).toBe("https://schema.org");
    expect(parsed["@type"]).toBe("BlogPosting");
    expect(parsed.headline).toBe(ARTICLE.title);
    expect(parsed.description).toBe(ARTICLE.description);
    expect(parsed.url).toBe(ARTICLE.canonical);
    expect(parsed.mainEntityOfPage).toBe(ARTICLE.canonical);
  });

  it("carries the publish date and zh-Hant language", () => {
    expect(parsed.datePublished).toBe("2026-07-13");
    expect(parsed.inLanguage).toBe("zh-Hant");
  });

  it("attributes the article to the author and publisher", () => {
    expect(parsed.author["@type"]).toBe("Person");
    expect(parsed.author.name).toContain("花雪");
    expect(parsed.author.url).toBe("https://jabiko.app/about");
    expect(parsed.publisher.name).toBe("Jabiko");
  });

  it("is safe to embed inside a <script> tag (no raw '<')", () => {
    expect(json).not.toMatch(/<\/script/i);
    expect(json).not.toContain("<");
  });
});

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
