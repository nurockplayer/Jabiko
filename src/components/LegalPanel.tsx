import type { Language } from "../i18n";
import {
  legalDocumentFor,
  type LegalPageKind
} from "../domain/legalContent";
import { LegalLinks } from "./LegalLinks";

export function LegalPanel({
  language,
  page
}: {
  language: Language;
  page: LegalPageKind;
}) {
  const document = legalDocumentFor(language, page);
  const titleId = `legal-${page}-title`;

  return (
    <section className="legal-panel" aria-labelledby={titleId}>
      <header className="legal-hero">
        <p className="eyebrow">{document.eyebrow}</p>
        <h2 id={titleId}>{document.title}</h2>
        <p className="legal-intro">{document.intro}</p>
        <p className="legal-updated">{document.updatedLabel}</p>
      </header>

      {document.sections.map((section) => (
        <article className="legal-section" key={section.title}>
          <h2>{section.title}</h2>
          {section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          {section.items ? (
            <ul>
              {section.items.map((item) => <li key={item}>{item}</li>)}
            </ul>
          ) : null}
        </article>
      ))}

      <LegalLinks language={language} current={page} />
    </section>
  );
}
