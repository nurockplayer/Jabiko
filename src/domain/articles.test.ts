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
    const lead = article?.body[0];
    const linksIndex = article?.body.findIndex((block) => block.kind === "links") ?? -1;
    const longEssayParagraphs = article?.body
      .slice(0, linksIndex < 0 ? undefined : linksIndex)
      .filter(
        (block): block is Extract<ArticleBlock, { kind: "lead" | "paragraph" }> =>
          (block.kind === "lead" || block.kind === "paragraph") && block.text.length > 160
      );
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
    expect(lead?.kind).toBe("lead");
    expect(lead && "text" in lead ? lead.text : "").toBe(
      "私立恵比寿中学在 2009 年成立，是 STARDUST 在ももいろクローバーZ之後推出的第一個妹分團體，2012 年主流出道，明年迎來主流出道 15 週年。"
    );
    expect(lead && "text" in lead ? lead.text : "").not.toContain("？");
    expect(longEssayParagraphs).toEqual([]);
    expect(article?.title).not.toContain("現在的我們，還好吃嗎");
    expect(article?.description).not.toContain("最後一句");
    expect(bodyText).toContain("恵比寿中学");
    expect(bodyText).not.toContain("先把「蝦中」講清楚");
    expect(bodyText).toContain("STARDUST 在ももいろクローバーZ之後推出的第一個妹分團體");
    expect(bodyText).not.toContain("ももいろクローバー之後");
    expect(bodyText).toContain("同門還有現在很紅的超ときめき♡宣伝部（超心宣）");
    expect(bodyText).toContain("事務所位在東京澀谷區惠比壽南");
    expect(bodyText).toContain("日語圈長年把團名簡稱為「エビ中」");
    expect(bodyText).toContain("華語圈也就叫「蝦中」");
    expect(bodyText).toContain("目前官方 Profile 把通稱寫成平假名「えびちゅう」");
    expect(bodyText).toContain("兩種表記仍會一起出現");
    expect(bodyText).toContain("澀谷區惠比壽南");
    expect(bodyText).toContain("主 logo 也直接畫成一隻蝦");
    expect(bodyText).toContain("過去的歌曲和視覺裡，也不時拿蝦的元素來玩");
    expect(bodyText).not.toContain("乾脆把這個用了很多年的梗");
    expect(bodyText).toContain("反覆的 チュー 也呼應 えびちゅう");
    expect(bodyText).toContain("2012 年主流出道");
    expect(bodyText).toContain("明年迎來主流出道 15 週年");
    expect(bodyText).toContain("2026 年的 MV 和短影音規格");
    expect(bodyText).toContain("全員認真胡鬧的電波歌");
    expect(bodyText).toContain("普通ってなんなのよ");
    expect(bodyText).toContain("在熱到不行的夏天偏要吃熱的");
    expect(bodyText).toContain("照著「普通」走，反而不是蝦中");
    expect(bodyText).toContain("流行甜點一直換，這段其實也在講蝦中自己");
    expect(bodyText).toContain("偶像界也不停換新的團體、曲風和爆紅方式");
    expect(bodyText).toContain("不是她們真的不想紅");
    expect(bodyText).toContain("不用每次都把自己改成當季甜點");
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
    expect(links).toContain("https://www.shiritsuebichu.jp/profile/");
    expect(links).toContain("https://www.stardust.co.jp/company/");
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

  it("collapses every vocab table in the two vocab-heavy tool articles", () => {
    for (const slug of [
      "japanese-restaurant-ordering-phrases",
      "japanese-taste-texture-expressions"
    ]) {
      const article = articleBySlug(slug);
      const vocab = (article?.body ?? []).filter((block) => block.kind === "vocab");
      expect(vocab.length).toBeGreaterThan(0);
      expect(vocab.every((block) => block.collapsed === true)).toBe(true);
    }
  });

  it("serves the country-names etymology article with honest hedges and fact anchors", () => {
    const article = articleBySlug("japanese-country-names");
    expect(article?.tag).toBe("日文冷知識");
    expect(article?.title).toContain("國家名");

    const body = article?.body ?? [];
    expect(body.length).toBeGreaterThan(0);
    // Essay half on top, exactly one teaching divider, no vocab above it, cta last.
    const dividerIndexes = body.flatMap((block, i) => (block.kind === "divider" ? [i] : []));
    expect(dividerIndexes).toHaveLength(1);
    expect(body.slice(0, dividerIndexes[0]).some((block) => block.kind === "vocab")).toBe(false);
    expect(body[body.length - 1]?.kind).toBe("cta");

    const bodyText = body
      .flatMap((block) => {
        if ("text" in block) return [block.text];
        if (block.kind === "vocab") {
          return block.items.flatMap((item) => [item.word, item.reading, item.meaning, item.note ?? ""]);
        }
        return [];
      })
      .join("\n");

    // The "doesn't match English" group came in via Portuguese/Dutch (南蛮貿易/蘭学 era).
    expect(bodyText).toContain("エゲレス");
    expect(bodyText).toContain("Holanda");
    expect(bodyText).toContain("南蛮貿易");
    // 米国 vs 美國 fork, renamed countries, and the Argentina deep-dive.
    expect(bodyText).toContain("亜米利加");
    expect(bodyText).toContain("ジョージア");
    expect(bodyText).toContain("ミャンマー");
    expect(bodyText).toContain("亜爾然丁");
    expect(bodyText).toContain("ゼリー");
    // The honest ending: no settled derivation for アルゼンチン.
    expect(bodyText).toContain("查不到定論");

    const links = body.flatMap((block) => (block.kind === "links" ? block.items.map((item) => item.url) : []));
    expect(links).toContain("https://www.mofa.go.jp/mofaj/press/release/press4_002048.html");
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
