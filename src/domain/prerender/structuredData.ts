// Per-page JSON-LD structured data for the prerendered static pages (SEO;
// remaining slice of the closed #584 bundle -- reopened as its own outcome).
//
// The SPA template ships one generic WebApplication schema (index.html). That
// is right for the app views, but a blog article should identify itself as a
// BlogPosting (headline / datePublished / author) and /about as a Person, so
// search engines get article rich-results and a real author entity. applyHead
// swaps the template's WebApplication block for a page's `jsonLd` when present.
//
// Build-time only (imported by staticPages.ts, never by the app), so it adds
// zero bundle weight. Pure strings; no fs, no DOM.
import { SITE_ORIGIN } from "../seo";

const AUTHOR = {
  "@type": "Person",
  name: "花雪 (HanaYukii)",
  url: `${SITE_ORIGIN}/about`
} as const;

const PUBLISHER = {
  "@type": "Organization",
  name: "Jabiko",
  url: `${SITE_ORIGIN}/`,
  logo: { "@type": "ImageObject", url: `${SITE_ORIGIN}/pwa-192x192.png` }
} as const;

// The author's cross-platform profile URLs (LinkedIn / GitHub / Codeforces …).
// These disambiguate the real-world person for search + AI systems (sameAs),
// but they are personal data the repo does not carry, so the list stays empty
// until the author supplies them. An empty array is a meaningless signal, so
// `sameAs` is OMITTED while this is empty rather than emitted as `[]`.
const AUTHOR_SAME_AS: readonly string[] = [];

/**
 * Serialize a JSON-LD object for safe embedding in
 * `<script type="application/ld+json">`. `<` is escaped to `<` so a
 * value can never terminate the script element (`</script>`).
 */
function serialize(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export interface ArticleJsonLdInput {
  title: string;
  description: string;
  /** Absolute canonical URL of the article. */
  canonical: string;
  /** ISO date (YYYY-MM-DD). */
  datePublished: string;
}

export function articleJsonLd(input: ArticleJsonLdInput): string {
  return serialize({
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: input.title,
    description: input.description,
    url: input.canonical,
    mainEntityOfPage: input.canonical,
    datePublished: input.datePublished,
    // No separate revision date is tracked; mirror datePublished so the field
    // is present and never stale-forward.
    dateModified: input.datePublished,
    inLanguage: "zh-Hant",
    author: AUTHOR,
    publisher: PUBLISHER,
    image: `${SITE_ORIGIN}/og-image.png`
  });
}

export function personJsonLd(): string {
  const person: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "花雪 (HanaYukii)",
    url: `${SITE_ORIGIN}/about`,
    description: "Jabiko 的作者，親手打造這個免費、免註冊的 JLPT 日檢自習站。"
  };
  if (AUTHOR_SAME_AS.length > 0) {
    person.sameAs = [...AUTHOR_SAME_AS];
  }
  return serialize(person);
}
