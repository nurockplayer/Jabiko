import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { copy, type Language } from "../i18n";
import { articleMetas } from "../domain/articlesMeta";

// 文章 index (#483). A prominent hero that SPELLS OUT what this section is
// and what to expect (positioning + upcoming topics + "still growing"), then
// the article cards. zh-Hant-only content -- App gates the whole blog view to
// zh-Hant, and this module is imported only by the lazy blog route so the
// article prose stays off the initial bundle.
export function BlogIndexPage({
  language,
  onOpenArticle,
  onBack
}: {
  language: Language;
  onOpenArticle: (slug: string) => void;
  onBack: () => void;
}) {
  const t = copy[language];

  return (
    <section className="blog-index" aria-label={t.blog}>
      <button type="button" className="ghost-button blog-back" onClick={onBack}>
        <ArrowLeft aria-hidden="true" />
        {t.blogBackToHome}
      </button>

      {/* The "標示這區" block: what this section is + what content to expect. */}
      <header className="blog-hero">
        <p className="eyebrow blog-hero-eyebrow">
          <Sparkles aria-hidden="true" size={14} />
          {t.blogHeroEyebrow}
        </p>
        <h2>{t.blogIndexTitle}</h2>
        <p className="blog-hero-intro">{t.blogIndexIntro}</p>
        <ul className="blog-hero-topics" aria-label={t.blogHeroTopicsLabel}>
          {t.blogHeroTopics.map((topic) => (
            <li key={topic}>{topic}</li>
          ))}
        </ul>
        <p className="blog-hero-note">{t.blogHeroNote}</p>
      </header>

      <ol className="blog-card-list">
        {articleMetas.map((article) => (
          <li key={article.slug}>
            <button
              type="button"
              className="blog-card"
              onClick={() => onOpenArticle(article.slug)}
            >
              <div className="blog-card-meta">
                <span className="blog-card-tag">{article.tag}</span>
                {article.draft ? <span className="blog-card-draft">{t.blogDraftBadge}</span> : null}
                <time className="blog-card-date" dateTime={article.publishedAt}>
                  {article.publishedAt}
                </time>
              </div>
              <h3 className="blog-card-title">{article.title}</h3>
              <p className="blog-card-desc">{article.description}</p>
              <span className="blog-card-more">
                {t.blogReadMore}
                <ArrowRight aria-hidden="true" size={15} />
              </span>
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}
