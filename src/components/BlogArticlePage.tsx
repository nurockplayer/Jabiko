import { ArrowLeft, ArrowRight, ExternalLink } from "lucide-react";
import { copy, type Language } from "../i18n";
import { articleBySlug, type ArticleBlock, type ArticleCta } from "../domain/articles";

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

      <div className="blog-article-body">
        {article.body.map((block, index) => (
          <ArticleBlockView key={index} block={block} language={language} onCta={onCta} />
        ))}
      </div>
    </section>
  );
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
