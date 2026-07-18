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

  it("serves the rewritten ebichili essay and its practical lyric notes", () => {
    const article = articleBySlug("shiritsu-ebisu-chugaku-ebichili-hajimemashita");
    const links = article?.body.flatMap((block) =>
      block.kind === "links" ? block.items.map((item) => item.url) : []
    );
    const bodyText = article?.body
      .flatMap((block) => {
        if ("text" in block) return [block.text];
        if (block.kind === "vocab") {
          return block.items.flatMap((item) => [item.word, item.reading, item.meaning, item.note ?? ""]);
        }
        return [];
      })
      .join("\n");

    expect(article?.title).toBe("蝦中是什麼？〈えびチリ、はじめました〉日文筆記");
    expect(article?.title).not.toContain("現在的我們，還好吃嗎");
    expect(article?.description).not.toContain("最後一句");
    expect(bodyText).toContain("恵比寿中学");
    expect(bodyText).toContain("エビ中");
    expect(bodyText).toContain("華語圈");
    expect(bodyText).toContain("2012 年主流出道");
    expect(bodyText).toContain("明年迎來主流出道 15 週年");
    expect(bodyText).toContain("2026 年的方式");
    expect(bodyText).toContain("十年前那種電波搞怪");
    expect(bodyText).toContain("秘密結社★ブラックタイガー");
    expect(bodyText).toContain("草蝦（虎蝦）");
    expect(bodyText).toContain("Argentine");
    expect(bodyText).toContain("argentum");
    expect(bodyText).toContain("世界盃");
    expect(bodyText).toContain("東（トン）");
    expect(bodyText).toContain("北（ペー）");
    expect(bodyText).toContain("歌裡唱的是 ペイ");
    for (const term of [
      "アルゼンチン",
      "ピーチュー",
      "ハオチー",
      "貼り紙",
      "ビタビタ",
      "ガッツリ",
      "ティラミス",
      "タピオカ",
      "ドバイチョコ",
      "ぺろりんちょ",
      "普通",
      "こういうの冷やし中華？",
      "肉厚",
      "これはブラックタイガー！"
    ]) {
      expect(bodyText).toContain(term);
    }
    expect(links).toContain("https://www.youtube.com/watch?v=2OQEgEYjPY4");
    expect(links?.some((url) => url.includes("embeds_referring"))).toBe(false);
    const divider = article?.body.find((block) => block.kind === "divider");
    expect(divider && "label" in divider ? divider.label : "").toBe("日文筆記");
  });

  it("serves the taste and texture guide as a broad everyday-Japanese article", () => {
    const article = articleBySlug("japanese-taste-texture-expressions");
    const bodyText = article?.body
      .flatMap((block) => {
        if ("text" in block) return [block.text];
        if (block.kind === "vocab") {
          return block.items.flatMap((item) => [item.word, item.reading, item.meaning, item.note ?? ""]);
        }
        return [];
      })
      .join("\n");

    expect(article?.tag).toBe("生活日文");
    expect(bodyText).toContain("普通においしい");
    expect(bodyText).toContain("コクがある");
    expect(bodyText).toContain("サクサク");
    expect(bodyText).toContain("クセになる");
    expect(bodyText).toContain("ご飯が進む");
    expect(bodyText).toContain("ごちそうさまでした");
    expect(bodyText).toContain("お会計お願いします");
  });

  it("serves the restaurant ordering guide with real-world usage cautions", () => {
    const article = articleBySlug("japanese-restaurant-ordering-phrases");
    const bodyText = article?.body
      .flatMap((block) => {
        if ("text" in block) return [block.text];
        if (block.kind === "vocab") {
          return block.items.flatMap((item) => [item.word, item.reading, item.meaning, item.note ?? ""]);
        }
        return [];
      })
      .join("\n");

    expect(article?.tag).toBe("旅遊日文");
    expect(bodyText).toContain("はい、お願いします");
    expect(bodyText).toContain("すみません、もう一度お願いします");
    expect(bodyText).toContain("個別会計はご遠慮ください");
    expect(bodyText).toContain("では、まとめて払います");
    expect(bodyText).toContain("ごちそうさまでした");
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
        } else if (block.kind === "divider") {
          expect(block.label.trim().length).toBeGreaterThan(0);
        } else if (block.kind === "cta") {
          expect(block.cta.label.trim().length).toBeGreaterThan(0);
          if (block.cta.kind === "grammar") {
            expect(block.cta.surface.trim().length).toBeGreaterThan(0);
          }
        }
      }
    }
  });

  it("keeps the essay on top and all teaching below a single 日文教學 divider", () => {
    for (const a of publishedArticles) {
      const dividerIndexes = a.body
        .map((block, index) => (block.kind === "divider" ? index : -1))
        .filter((index) => index >= 0);
      // Exactly one divider splits 文章 (essay, top) from 日文教學 (teaching, bottom).
      expect(dividerIndexes, a.slug).toHaveLength(1);
      const divider = dividerIndexes[0];
      a.body.forEach((block, index) => {
        // Every vocab table lives BELOW the divider (no teaching in the essay)…
        if (block.kind === "vocab") {
          expect(index, `${a.slug}: vocab block above the divider`).toBeGreaterThan(divider);
        }
        // …and no essay-conclusion heading trails at the end (e.g. 「最後：…」).
        if (block.kind === "heading") {
          expect(block.text, a.slug).not.toMatch(/^最後/);
        }
      });
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
