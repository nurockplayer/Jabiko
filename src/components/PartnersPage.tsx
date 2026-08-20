import { ArrowLeft, ExternalLink } from "lucide-react";
import { copy as uiCopy, type Language } from "../i18n";
import { trackEvent } from "../lib/analytics";
import { AUTHOR_EMAIL } from "../domain/author";
import { partnersForLocale, type Partner } from "../domain/partners";
import { StayDVideo } from "./StayDVideo";

/** One compact partner entry: kicker, name, why it is here, one outbound link,
 *  and -- where the partner ships one -- a click-to-load video. Deliberately
 *  card-sized: the page is a list that grows with new partnerships, not a
 *  single-partner landing page. */
function PartnerCard({ partner, language }: { partner: Partner; language: Language }) {
  const text = partner.copy[language];
  if (!text) return null;
  const video = partner.video;
  const videoCopy = video?.copy[language];

  return (
    <li className="partner-card">
      <p className="partner-kicker">{text.kicker}</p>
      <h2 className="partner-name">{text.name}</h2>
      <p className="partner-body">{text.body}</p>
      <a
        className="partner-link"
        href={partner.url}
        target="_blank"
        rel="noopener noreferrer"
        data-stay-d-placement={partner.linkPlacement}
        onClick={() =>
          trackEvent("promo_click", {
            promoId: partner.id,
            action: "airbnb",
            placement: partner.linkPlacement,
            locale: language
          })
        }
      >
        {text.cta}
        <ExternalLink aria-hidden="true" />
      </a>
      {video && videoCopy ? (
        <StayDVideo
          copy={videoCopy}
          locale={language}
          triggerPlacement={video.triggerPlacement}
          airbnbPlacement={video.linkPlacement}
        />
      ) : null}
    </li>
  );
}

/** 合作推廣: what Jabiko currently partners with, plus how to propose a new
 *  one. The contact address is the author's and sits in its own section --
 *  never inside a partner card, where it would read as that partner's. */
export function PartnersPage({ language }: { language: Language }) {
  const t = uiCopy[language];
  const partners = partnersForLocale(language);

  return (
    <article className="partners-page">
      <a className="partners-back" href="/">
        <ArrowLeft aria-hidden="true" />
        {t.routeErrorGoHome}
      </a>

      <header className="partners-head">
        <h1>{t.partnersTitle}</h1>
        <p className="partners-intro">{t.partnersIntro}</p>
      </header>

      {partners.length > 0 ? (
        <ul className="partners-list">
          {partners.map((partner) => (
            <PartnerCard key={partner.id} partner={partner} language={language} />
          ))}
        </ul>
      ) : null}

      <section className="partners-contact">
        <h2>{t.partnersContactTitle}</h2>
        <p>{t.partnersContactBody}</p>
        <a className="partners-contact-mail" href={`mailto:${AUTHOR_EMAIL}`}>
          {AUTHOR_EMAIL}
        </a>
      </section>
    </article>
  );
}
