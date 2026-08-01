import { ArrowLeft, ArrowRight, ExternalLink } from "lucide-react";
import { useEffect, useRef } from "react";
import { copy, type Language } from "../i18n";
import { articleBySlug, type ArticleBlock, type ArticleCta } from "../domain/articles";
import { trackEvent } from "../lib/analytics";

// Single blog article page. The article body is zh-Hant original content and
// is lazy-loaded from the blog route, so prose stays out of the initial bundle.
export function BlogArticlePage({
  slug,
  language,
  onBack,
  onCta
}: {
  slug: string;
  language: Language;
  onBack: () => void;
  onCta: (cta: ArticleCta) => void;
}) {
  const t = copy[language];
  const article = articleBySlug(slug);
  // Effects run after the article is committed, so only a successfully
  // displayed published article is counted. Keep the last slug for this route
  // instance: React StrictMode and ordinary rerenders cannot double-count it,
  // while a different slug (or a route departure) starts a new view.
  const lastViewedSlugRef = useRef<string | null>(null);
  useEffect(() => {
    const publishedSlug = article && !article.draft ? article.slug : null;
    if (publishedSlug !== null && lastViewedSlugRef.current !== publishedSlug) {
      lastViewedSlugRef.current = publishedSlug;
      trackEvent("article_viewed", { slug: publishedSlug });
    }
    if (publishedSlug === null) {
      lastViewedSlugRef.current = null;
    }
    // article?.draft / article?.slug already cover every field read above; the
    // rule wants the whole `article` object, which would re-fire on unrelated
    // article changes (same slug/draft) and double-count the view.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [article?.draft, article?.slug]);

  const backButton = (
    <button type="button" className="ghost-button blog-back" onClick={onBack}>
      <ArrowLeft aria-hidden="true" />
      {t.blogBackToList}
    </button>
  );

  if (!article) {
    return (
      <section className="blog-article" aria-label={t.blog}>
        {backButton}
        <p className="blog-not-found">{t.blogNotFound}</p>
      </section>
    );
  }

  return (
    <section className="blog-article" aria-label={article.title}>
      {backButton}

      <header className="blog-article-header">
        <div className="blog-card-meta">
          <span className="blog-card-tag">{article.tag}</span>
          {article.draft ? <span className="blog-card-draft">{t.blogDraftBadge}</span> : null}
          <time className="blog-card-date" dateTime={article.publishedAt}>
            {article.publishedAt}
          </time>
        </div>
        <h1 className="blog-article-title">{article.title}</h1>
      </header>

      <div className="blog-article-body">{renderArticleBody(article.body, language, onCta)}</div>
    </section>
  );
}

// Render the body blocks, folding each `collapsed` vocab table into a closed
// <details> with a word-count summary. A heading directly before the table
// becomes the summary title; a table separated from its heading by prose
// falls back to a generic 單字表 label (the blog view is zh-Hant-gated, so
// the literal is safe). The table content stays in the DOM, so prerendered
// SEO text and find-in-page are unaffected; only the scroll length shrinks.
function renderArticleBody(
  body: ReadonlyArray<ArticleBlock>,
  language: Language,
  onCta: (cta: ArticleCta) => void
) {
  const collapsedVocab = (title: string, block: ArticleBlock & { kind: "vocab" }, key: number) => (
    <details key={key} className="blog-vocab-details">
      <summary className="blog-vocab-summary">
        <h2 className="blog-vocab-summary-title">{title}</h2>
        <span className="blog-vocab-summary-count">{block.items.length} 個詞</span>
      </summary>
      <ArticleBlockView block={block} language={language} onCta={onCta} />
    </details>
  );

  const nodes = [];
  for (let index = 0; index < body.length; index++) {
    const block = body[index];
    const next = body[index + 1];
    if (block.kind === "heading" && next?.kind === "vocab" && next.collapsed) {
      nodes.push(collapsedVocab(block.text, next, index));
      index++;
      continue;
    }
    if (block.kind === "vocab" && block.collapsed) {
      nodes.push(collapsedVocab("單字表", block, index));
      continue;
    }
    nodes.push(<ArticleBlockView key={index} block={block} language={language} onCta={onCta} />);
  }
  return nodes;
}

function ArticleBlockView({
  block,
  language,
  onCta
}: {
  block: ArticleBlock;
  language: Language;
  onCta: (cta: ArticleCta) => void;
}) {
  const t = copy[language];

  switch (block.kind) {
    case "lead":
      return <p className="blog-lead">{block.text}</p>;
    case "heading":
      return <h2 className="blog-heading">{block.text}</h2>;
    case "paragraph":
      return <p className="blog-paragraph">{block.text}</p>;
    case "callout":
      return <aside className="blog-callout">{block.text}</aside>;
    case "vocab":
      return (
        <div className="blog-vocab">
          <dl className="blog-vocab-list">
            {block.items.map((item) => (
              <div key={item.word} className="blog-vocab-item">
                <dt className="blog-vocab-term">
                  <span className="blog-vocab-word" lang="ja">
                    {item.word}
                  </span>
                  <span className="blog-vocab-reading" lang="ja">
                    （{item.reading}）
                  </span>
                </dt>
                <dd className="blog-vocab-gloss">
                  <span className="blog-vocab-meaning">{item.meaning}</span>
                  {item.note ? <span className="blog-vocab-note">{item.note}</span> : null}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      );
    case "table":
      return (
        <div className="blog-table-wrap">
          <table className="blog-table">
            <caption>{block.caption}</caption>
            <thead>
              <tr>
                {block.columns.map((column) => (
                  <th key={column.label} scope="col">
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {block.columns.map((column, columnIndex) => {
                    const cell = row[columnIndex] ?? "";
                    return column.rowHeader ? (
                      <th
                        key={column.label}
                        scope="row"
                        data-label={column.label}
                        lang={column.lang}
                      >
                        {cell}
                      </th>
                    ) : (
                      <td
                        key={column.label}
                        data-label={column.label}
                        lang={column.lang}
                      >
                        {cell}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "links":
      return (
        <div className="blog-links">
          {block.label ? <p className="blog-links-label">{block.label}</p> : null}
          <ul className="blog-links-list">
            {block.items.map((item) => (
              <li key={item.url}>
                <a
                  className="blog-link"
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink aria-hidden="true" size={15} />
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      );
    case "lyricPoint":
      return (
        <div className="blog-lyric">
          <div className="blog-lyric-head">
            <blockquote className="blog-lyric-frag" lang="ja">
              {block.lyric}
            </blockquote>
            {block.timestamp ? <span className="blog-lyric-ts">{block.timestamp}</span> : null}
          </div>
          <ul className="blog-lyric-points">
            {block.points.map((point, i) => (
              <li key={i}>{point}</li>
            ))}
          </ul>
        </div>
      );
    case "divider":
      return (
        <div className="blog-divider" role="separator" aria-label={block.label}>
          <span className="blog-divider-label">{block.label}</span>
        </div>
      );
    case "cta":
      return (
        <div className="blog-cta-block">
          <button type="button" className="next-button blog-cta" onClick={() => onCta(block.cta)}>
            {block.cta.label}
            <ArrowRight aria-hidden="true" />
          </button>
          <p className="blog-cta-hint">{t.blogCtaHint}</p>
        </div>
      );
    default: {
      const _never: never = block;
      return _never;
    }
  }
}
