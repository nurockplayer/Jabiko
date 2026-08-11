import { ExternalLink } from "lucide-react";
import type { Language } from "../i18n";
import {
  STAY_D_AIRBNB_URL,
  STAY_D_EDITORIAL_COPY,
  isStayDLocale
} from "../domain/stayD";
import { StayDVideo } from "./StayDVideo";

export function StayDPromoCard({ language }: { language: Language }) {
  if (!isStayDLocale(language)) return null;
  const text = STAY_D_EDITORIAL_COPY[language];

  return (
    <section
      className="stay-d-promo"
      aria-label={text.title}
      data-placement="home-bottom"
    >
      <div className="stay-d-promo-copy">
        <span className="stay-d-disclosure">{text.kicker}</span>
        <h2>{text.title}</h2>
        <p>{text.body}</p>
      </div>
      <div className="stay-d-promo-actions">
        <a
          className="stay-d-airbnb-primary"
          href={STAY_D_AIRBNB_URL}
          target="_blank"
          rel="noopener noreferrer"
          data-stay-d-placement="home-airbnb"
        >
          {text.airbnbCta}
          <ExternalLink aria-hidden="true" />
        </a>
        <StayDVideo
          copy={text.video}
          triggerPlacement="home-video"
          airbnbPlacement="home-video-airbnb"
        />
      </div>
    </section>
  );
}
