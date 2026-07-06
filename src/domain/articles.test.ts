import { describe, expect, it } from "vitest";
import { articleBySlug, articles, publishedArticles, type ArticleBlock } from "./articles";
import { canonicalArticleSlug } from "./articlesMeta";

describe("blog articles data guard", () => {
  it("has at least one published article", () => {
    expect(publishedArticles.length).toBeGreaterThan(0);
  });

  it("uses unique, URL-safe (kebab-case ascii) slugs", () => {
    const slugs = articles.map((a) => a.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) {
      expect(slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    }
  });

  it("uses the canonical SWEET STEADY slug while keeping the old slug as an alias", () => {
    expect(canonicalArticleSlug("sweet-step-steady")).toBe("sweet-steady-sweet-step");
    expect(articleBySlug("sweet-steady-sweet-step")?.slug).toBe("sweet-steady-sweet-step");
    expect(articleBySlug("sweet-step-steady")?.slug).toBe("sweet-steady-sweet-step");
    expect(articles.map((a) => a.slug)).toContain("sweet-steady-sweet-step");
    expect(articles.map((a) => a.slug)).not.toContain("sweet-step-steady");
  });

  it("serves the rewritten SWEET STEP body on both the canonical slug and the alias", () => {
    for (const slug of ["sweet-steady-sweet-step", "sweet-step-steady"]) {
      const article = articleBySlug(slug);
      expect(article?.title).toContain("SWEET STEADY - SWEET STEP");
      const bodyText = article?.body
        .flatMap((block) => {
          if ("text" in block) return [block.text];
          if (block.kind === "vocab") return block.items.flatMap((item) => [item.word, item.reading, item.meaning]);
          return [];
        })
        .join("\n");
      expect(bodyText).toContain("ありのまま");
      expect(bodyText).toContain("強がる");
      expect(bodyText).toContain("大輪の種はここにある");
    }
  });

  it("keeps titles and descriptions within SEO-friendly lengths", () => {
    for (const a of articles) {
      expect(a.title.length).toBeGreaterThan(0);
      expect(a.title.length).toBeLessThanOrEqual(70);
      expect(a.description.length).toBeGreaterThan(0);
      // Leaves room for the " · Jabiko ..." suffix under the ~160-char cap.
      expect(a.description.length).toBeLessThanOrEqual(150);
      expect(a.tag.length).toBeGreaterThan(0);
    }
  });

  it("uses ISO YYYY-MM-DD publish dates", () => {
    for (const a of articles) {
      expect(a.publishedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("gives every article a non-empty body of well-formed blocks", () => {
    const textKinds = new Set(["lead", "heading", "paragraph", "callout"]);
    for (const a of articles) {
      expect(a.body.length).toBeGreaterThan(0);
      for (const block of a.body as ArticleBlock[]) {
        if (textKinds.has(block.kind)) {
          expect((block as { text: string }).text.trim().length).toBeGreaterThan(0);
        } else if (block.kind === "vocab") {
          expect(block.items.length).toBeGreaterThan(0);
          for (const item of block.items) {
            expect(item.word.trim().length).toBeGreaterThan(0);
            expect(item.reading.trim().length).toBeGreaterThan(0);
            expect(item.meaning.trim().length).toBeGreaterThan(0);
          }
        } else if (block.kind === "links") {
          expect(block.items.length).toBeGreaterThan(0);
          for (const item of block.items) {
            expect(item.label.trim().length).toBeGreaterThan(0);
            expect(item.url).toMatch(/^https?:\/\//);
          }
        } else if (block.kind === "lyricPoint") {
          expect(block.lyric.trim().length).toBeGreaterThan(0);
          expect(block.points.length).toBeGreaterThan(0);
        } else if (block.kind === "cta") {
          expect(block.cta.label.trim().length).toBeGreaterThan(0);
          if (block.cta.kind === "grammar") {
            expect(block.cta.surface.trim().length).toBeGreaterThan(0);
          }
        }
      }
    }
  });

  it("ends each article with a practice CTA (the drill-conversion moat)", () => {
    for (const a of publishedArticles) {
      const last = a.body[a.body.length - 1];
      expect(last.kind).toBe("cta");
    }
  });

  it("resolves articles by slug and excludes drafts from the published list", () => {
    for (const a of articles) {
      // Deep equality: articleBySlug composes a fresh {...meta, body} each call.
      expect(articleBySlug(a.slug)).toEqual(a);
    }
    expect(articleBySlug("does-not-exist")).toBeUndefined();
    expect(publishedArticles.every((a) => !a.draft)).toBe(true);
  });
});
