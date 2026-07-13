import { describe, expect, it } from "vitest";
import { splitArrayEntries } from "./parse-article-entries.mjs";

describe("splitArrayEntries", () => {
  it("parses a single flat object", () => {
    const src = `{
      slug: "hello",
      title: "Hello World",
      publishedAt: "2026-07-13"
    }`;
    expect(splitArrayEntries(src)).toEqual([src]);
  });

  it("parses multiple objects separated by commas", () => {
    const src = `{
      slug: "a",
      publishedAt: "2026-07-01"
    },{
      slug: "b",
      publishedAt: "2026-07-02"
    }`;
    const entries = splitArrayEntries(src);
    expect(entries).toHaveLength(2);
    expect(entries[0]).toContain('slug: "a"');
    expect(entries[1]).toContain('slug: "b"');
  });

  it("handles a trailing comma after the last entry", () => {
    const src = `{ slug: "x" },{ slug: "y" },`;
    const entries = splitArrayEntries(src);
    expect(entries).toHaveLength(2);
    expect(entries[0]).toContain('slug: "x"');
    expect(entries[1]).toContain('slug: "y"');
  });

  it("handles whitespace and newlines between entries", () => {
    const src = `{ slug: "a" }\n\n\n  , \n{ slug: "b" }`;
    const entries = splitArrayEntries(src);
    expect(entries).toHaveLength(2);
  });

  it("keeps double-quoted strings intact even when they contain }, or ,", () => {
    const src = `{
      slug: "test",
      title: "contains }, within string",
      publishedAt: "2026-07-13"
    }`;
    const entries = splitArrayEntries(src);
    expect(entries).toHaveLength(1);
    expect(entries[0]).toContain("contains }, within string");
  });

  it("keeps double-quoted strings with arbitrary braces intact", () => {
    const src = `{
      slug: "brace-test",
      description: "some text {} with braces { and commas, } and more",
      publishedAt: "2026-07-13"
    }`;
    const entries = splitArrayEntries(src);
    expect(entries).toHaveLength(1);
    expect(entries[0]).toContain("some text {} with braces { and commas, } and more");
  });

  it("keeps escaped quotes inside strings", () => {
    const src = `{
      slug: "escaped",
      title: "she said \\"hello\\"",
      publishedAt: "2026-07-13"
    }`;
    const entries = splitArrayEntries(src);
    expect(entries).toHaveLength(1);
    expect(entries[0]).toContain('she said \\"hello\\"');
  });

  it("handles backtick template literals with interpolation", () => {
    const src = `{
      slug: \`tmpl-\${42}\`,
      publishedAt: "2026-07-13"
    }`;
    const entries = splitArrayEntries(src);
    expect(entries).toHaveLength(1);
    expect(entries[0]).toContain("`tmpl-${42}`");
  });

  it("handles backtick strings containing }, and ,", () => {
    const src = `{
      slug: "bt",
      description: \`looks like }, in a template\`,
      publishedAt: "2026-07-13"
    }`;
    const entries = splitArrayEntries(src);
    expect(entries).toHaveLength(1);
    expect(entries[0]).toContain("`looks like }, in a template`");
  });

  it("returns empty array for empty input", () => {
    expect(splitArrayEntries("")).toEqual([]);
  });

  it("returns empty array for whitespace-only input", () => {
    expect(splitArrayEntries("   \n  ")).toEqual([]);
  });

  it("throws on bare '{' with no matching '}'", () => {
    expect(() => splitArrayEntries("{ slug: \"x\"")).toThrow("Unbalanced");
  });

  it("throws on unexpected close brace", () => {
    expect(() => splitArrayEntries("}")).toThrow("Expected '{'");
  });

  it("throws when entry does not start with '{'", () => {
    expect(() => splitArrayEntries("not-an-object")).toThrow("Expected '{'");
  });

  it("tolerates extra commas between entries", () => {
    const entries = splitArrayEntries(`{ slug: "a" } ,, { slug: "b" }`);
    expect(entries).toHaveLength(2);
  });

  it("extracts slug and publishedAt from realistic entry", () => {
    const src = `{
    slug: "japanese-restaurant-ordering-phrases",
    title: "日本店員到底在問什麼？",
    description: "從進店、點餐、套餐與袋子一路到結帳。",
    tag: "旅遊日文",
    publishedAt: "2026-07-13"
  }`;
    const entries = splitArrayEntries(src);
    expect(entries).toHaveLength(1);
    const slug = entries[0].match(/slug:\s*"([^"]+)"/);
    expect(slug![1]).toBe("japanese-restaurant-ordering-phrases");
    const publishedAt = entries[0].match(/publishedAt:\s*"([^"]+)"/);
    expect(publishedAt![1]).toBe("2026-07-13");
  });

  it("extracts slug from multiple realistic entries", () => {
    const src = `{
    slug: "first",
    title: "First Article",
    description: "The first article.",
    tag: "test",
    publishedAt: "2026-01-01"
  },{
    slug: "second",
    title: "Second Article",
    description: "The second article.",
    tag: "test",
    publishedAt: "2026-06-15"
  }`;
    const entries = splitArrayEntries(src);
    expect(entries).toHaveLength(2);
    const slugs = entries.map((e) => e.match(/slug:\s*"([^"]+)"/)![1]);
    expect(slugs).toEqual(["first", "second"]);
  });
});
