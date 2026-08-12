import { ArrowLeft, ExternalLink } from "lucide-react";
import type { Language } from "../i18n";
import { trackEvent } from "../lib/analytics";
import {
  STAY_D_AIRBNB_URL,
  STAY_D_EDITORIAL_COPY,
  isStayDLocale
} from "../domain/stayD";
import { StayDVideo } from "./StayDVideo";

export function StayDPage({ language }: { language: Language }) {
  if (!isStayDLocale(language)) return null;
  const text = STAY_D_EDITORIAL_COPY[language];

  return (
    <article className="stay-d-page">
      <a className="stay-d-back" href="/">
        <ArrowLeft aria-hidden="true" />
        {text.backHome}
      </a>

      <header className="stay-d-hero">
        <div className="stay-d-hero-copy">
          <p className="stay-d-kicker">{text.kicker}</p>
          <h1>{text.title}</h1>
          <p>{text.body}</p>
          <a
            className="stay-d-airbnb-primary"
            href={STAY_D_AIRBNB_URL}
            target="_blank"
            rel="noopener noreferrer"
            data-stay-d-placement="stay-d-hero-airbnb"
            onClick={() =>
              trackEvent("promo_click", {
                promoId: "stay-d",
                action: "airbnb",
                placement: "stay-d-hero-airbnb",
                locale: language
              })
            }
          >
            {text.airbnbCta}
            <ExternalLink aria-hidden="true" />
          </a>
        </div>
      </header>

      <section className="stay-d-section stay-d-tour">
        <h2>{text.page.videoTitle}</h2>
        <p className="stay-d-section-intro">{text.page.videoIntro}</p>
        <StayDVideo
          copy={text.video}
          locale={language}
          triggerPlacement="stay-d-video"
          airbnbPlacement="stay-d-video-airbnb"
        />
      </section>

      <section className="stay-d-final">
        <div>
          <h2>{text.page.finalTitle}</h2>
          <p>{text.page.finalBody}</p>
        </div>
        <a
          className="stay-d-airbnb-primary"
          href={STAY_D_AIRBNB_URL}
          target="_blank"
          rel="noopener noreferrer"
          data-stay-d-placement="stay-d-final-airbnb"
          onClick={() =>
            trackEvent("promo_click", {
              promoId: "stay-d",
              action: "airbnb",
              placement: "stay-d-final-airbnb",
              locale: language
            })
          }
        >
          {text.airbnbCta}
          <ExternalLink aria-hidden="true" />
        </a>
      </section>
    </article>
  );
}
