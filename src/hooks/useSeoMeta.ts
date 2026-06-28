import { useEffect } from "react";
import { seoForView, type SeoView } from "../domain/seo";

// Find-or-create a <meta> tag (keyed by name= or property=) and set its content.
function upsertMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

// Sync the document head to the active view's SEO metadata. Reuses the tags
// already present in index.html (description / og:* / twitter:*) and adds the
// per-view canonical + og:url. Runs on every view change so a crawler that
// renders the JS sees route-specific title/description rather than the shared
// static shell. Idempotent: re-applies in place, never duplicates a tag.
export function useSeoMeta(view: SeoView) {
  useEffect(() => {
    const { title, description, canonical } = seoForView(view);
    document.title = title;
    upsertMeta("name", "description", description);
    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:url", canonical);
    upsertMeta("name", "twitter:title", title);
    upsertMeta("name", "twitter:description", description);
    upsertCanonical(canonical);
  }, [view]);
}
