// Per-page JSON-LD structured data for the prerendered static pages (SEO;
// remaining slice of the closed #584 bundle -- reopened as its own outcome).
//
// The SPA template ships one generic WebApplication schema (index.html). That
// is right for the app views, but /about should identify itself as a Person so
// search engines get a real author entity. applyHead swaps the template's
// WebApplication block for a page's `jsonLd` when present.
//
// Build-time only (imported by staticPages.ts, never by the app), so it adds
// zero bundle weight. Pure strings; no fs, no DOM.
import { SITE_ORIGIN } from "../seo";

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
