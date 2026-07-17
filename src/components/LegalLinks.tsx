import type { Language } from "../i18n";
import { legalCopyFor, type LegalPageKind } from "../domain/legalContent";

export function LegalLinks({
  language,
  current
}: {
  language: Language;
  current?: LegalPageKind;
}) {
  const legal = legalCopyFor(language);

  return (
    <nav className="legal-links" aria-label={legal.navigationLabel}>
      <a href="/privacy" aria-current={current === "privacy" ? "page" : undefined}>
        {legal.privacyLabel}
      </a>
      <span aria-hidden="true">·</span>
      <a href="/terms" aria-current={current === "terms" ? "page" : undefined}>
        {legal.termsLabel}
      </a>
    </nav>
  );
}
