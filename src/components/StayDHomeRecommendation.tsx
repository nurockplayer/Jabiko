import { ExternalLink } from "lucide-react";
import type { Language } from "../i18n";
import { trackEvent } from "../lib/analytics";
import {
  isStayDLocale,
  STAY_D_AIRBNB_URL,
  STAY_D_HOME_RECOMMENDATION
} from "../domain/stayD";

/** A small editorial note in the Home reading flow. It connects learning to
 *  a real Tokyo trip without reproducing Airbnb's listing content. */
export function StayDHomeRecommendation({ language }: { language: Language }) {
  if (!isStayDLocale(language)) return null;

  const text = STAY_D_HOME_RECOMMENDATION[language];

  return (
    <aside className="home-stay-recommendation" aria-label={text.kicker}>
      <div className="home-stay-recommendation-copy">
        <p className="home-stay-recommendation-kicker">{text.kicker}</p>
        <h2>{text.headline}</h2>
      </div>
      <a
        className="home-stay-recommendation-link"
        href={STAY_D_AIRBNB_URL}
        target="_blank"
        rel="noopener noreferrer"
        data-stay-d-placement="home-airbnb"
        onClick={() =>
          trackEvent("promo_click", {
            promoId: "stay-d",
            action: "airbnb",
            placement: "home-airbnb",
            locale: language
          })
        }
      >
        {text.cta}
        <ExternalLink aria-hidden="true" />
      </a>
    </aside>
  );
}
