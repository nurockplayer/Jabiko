import { ExternalLink } from "lucide-react";
import type { Language } from "../i18n";
import {
  STAY_D_AIRBNB_URL,
  STAY_D_HOME_TEASER,
  isStayDLocale
} from "../domain/stayD";
import { StayDVideo } from "./StayDVideo";

/** Home footer Stay.D recommendation (#750): a quiet editorial section, not a
 *  campaign banner. Jabiko explains why the stay fits the learner context;
 *  the direct Airbnb path stays one tap away as a lightweight text link. */
export function StayDPromoCard({ language }: { language: Language }) {
  if (!isStayDLocale(language)) return null;
  const text = STAY_D_HOME_TEASER[language];

  return (
    <section
      className="stay-d-home"
      aria-label={text.headline}
      data-placement="home-bottom"
    >
      <div className="stay-d-home-copy">
        <span className="stay-d-home-kicker">{text.kicker}</span>
        <h2 className="stay-d-home-headline">{text.headline}</h2>
        <p className="stay-d-home-body">{text.body}</p>
      </div>
      <div className="stay-d-home-actions">
        <a
          className="stay-d-home-airbnb"
          href={STAY_D_AIRBNB_URL}
          target="_blank"
          rel="noopener noreferrer"
          data-stay-d-placement="home-airbnb"
        >
          {text.primaryCta}
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
