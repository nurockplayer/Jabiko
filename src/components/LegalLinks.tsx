import type { Language } from "../i18n";
import type { LegalPageKind } from "../domain/legalContent";
import { legalLabelsFor } from "../domain/legalLabels";

export function LegalLinks({
  language,
  current
}: {
  language: Language;
  current?: LegalPageKind;
}) {
  const legal = legalLabelsFor(language);

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
