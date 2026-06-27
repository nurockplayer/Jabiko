import { copy, type Language } from "../i18n";
import { BooksSpot } from "../illustrations";

// The author's blog (same destination as the home hero's guide link).
const BLOG_URL = "https://hanayukii.dev/blog/jabiko-jlpt-app";

// 關於 view: a quiet reading page -- where the name came from, how the app
// grew, and a short note about who made it. Static text only (no learner
// state, no heavy data), so it's an eager panel like RulesPanel.
export function AboutPanel({ language }: { language: Language }) {
  const t = copy[language];

  return (
    <section className="about-panel" aria-label={t.about}>
      <header className="about-hero">
        <BooksSpot className="panel-header-spot" />
        <p className="eyebrow">{t.about}</p>
        <h1>{t.aboutTitle}</h1>
        <p className="about-tagline">{t.aboutTagline}</p>
      </header>

      <article className="about-section">
        <h2>{t.aboutNameTitle}</h2>
        <p>{t.aboutNameBody}</p>
      </article>

      <article className="about-section">
        <h2>{t.aboutStoryTitle}</h2>
        <p>{t.aboutStoryBody}</p>
      </article>

      <article className="about-section about-author">
        <h2>{t.aboutAuthorTitle}</h2>
        <p className="about-author-name">{t.aboutAuthorName}</p>
        <p>{t.aboutAuthorBody}</p>
        <a className="about-link" href={BLOG_URL} target="_blank" rel="noopener noreferrer">
          {t.aboutAuthorLink}
        </a>
      </article>
    </section>
  );
}
