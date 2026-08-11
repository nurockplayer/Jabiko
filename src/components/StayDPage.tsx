import { ArrowLeft, ExternalLink, House, MapPin, Wifi } from "lucide-react";
import type { Language } from "../i18n";
import {
  STAY_D_AIRBNB_URL,
  STAY_D_HOME_COPY,
  STAY_D_HOME_IMAGE,
  isStayDLocale
} from "../domain/stayD";
import { STAY_D_PAGE_COPY, STAY_D_PAGE_IMAGES } from "../domain/stayDPage";
import { StayDVideo } from "./StayDVideo";

export function StayDPage({ language }: { language: Language }) {
  if (!isStayDLocale(language)) return null;
  const text = STAY_D_PAGE_COPY[language];

  return (
    <article className="stay-d-page">
      <a className="stay-d-back" href="/">
        <ArrowLeft aria-hidden="true" />
        {text.backHome}
      </a>

      <header className="stay-d-hero">
        <div className="stay-d-hero-image">
          <img
            src={STAY_D_HOME_IMAGE.src}
            srcSet={STAY_D_HOME_IMAGE.srcSet}
            sizes="(max-width: 720px) calc(100vw - 40px), (max-width: 1180px) 54vw, 640px"
            width={STAY_D_HOME_IMAGE.width}
            height={STAY_D_HOME_IMAGE.height}
            alt={STAY_D_HOME_COPY[language].imageAlt}
            loading="eager"
            fetchPriority="high"
            decoding="async"
          />
        </div>
        <div className="stay-d-hero-copy">
          <p className="stay-d-kicker">{text.kicker}</p>
          <h1>{text.headline}</h1>
          <p>{text.body}</p>
          <a
            className="stay-d-airbnb-primary"
            href={STAY_D_AIRBNB_URL}
            target="_blank"
            rel="noopener noreferrer"
            data-stay-d-placement="stay-d-hero-airbnb"
          >
            {text.airbnbCta}
            <ExternalLink aria-hidden="true" />
          </a>
        </div>
      </header>

      <section className="stay-d-quick-facts" aria-label={text.quickFactsLabel}>
        {text.quickFacts.map((fact) => (
          <div key={fact.title}>
            <strong>{fact.title}</strong>
            <span>{fact.body}</span>
          </div>
        ))}
      </section>

      <section className="stay-d-section stay-d-gallery-section">
        <h2>{text.galleryTitle}</h2>
        <p className="stay-d-section-intro">{text.galleryIntro}</p>
        <div className="stay-d-gallery">
          {STAY_D_PAGE_IMAGES.map((image) => (
            <figure className={`stay-d-photo stay-d-photo-${image.id}`} key={image.id}>
              <img
                src={image.src}
                width={image.width}
                height={image.height}
                sizes="(max-width: 720px) calc(100vw - 40px), (max-width: 1100px) 44vw, 520px"
                alt={text.imageAlt[image.id]}
                loading="lazy"
                decoding="async"
              />
              <figcaption>{text.imageCaption[image.id]}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="stay-d-section">
        <div className="stay-d-section-heading">
          <House aria-hidden="true" />
          <h2>{text.whyTitle}</h2>
        </div>
        <p className="stay-d-section-intro">{text.whyIntro}</p>
        <div className="stay-d-feature-grid">
          {text.whyItems.map((item) => (
            <article key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="stay-d-section">
        <h2>{text.layoutTitle}</h2>
        <div className="stay-d-floor-grid">
          {text.floors.map((floor) => (
            <article key={floor.label}>
              <span>{floor.label}</span>
              <h3>{floor.title}</h3>
              <p>{floor.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="stay-d-section stay-d-amenities">
        <div className="stay-d-section-heading">
          <Wifi aria-hidden="true" />
          <h2>{text.amenitiesTitle}</h2>
        </div>
        <p className="stay-d-section-intro">{text.amenitiesIntro}</p>
        <div className="stay-d-feature-grid">
          {text.amenities.map((item) => (
            <article key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="stay-d-section stay-d-neighborhood">
        <MapPin aria-hidden="true" />
        <div>
          <h2>{text.neighborhoodTitle}</h2>
          <p>{text.neighborhoodBody}</p>
        </div>
      </section>

      <section className="stay-d-section stay-d-tour">
        <h2>{text.videoTitle}</h2>
        <p className="stay-d-section-intro">{text.videoIntro}</p>
        <StayDVideo
          copy={text.video}
          triggerPlacement="stay-d-video"
          airbnbPlacement="stay-d-video-airbnb"
        />
      </section>

      <section className="stay-d-final">
        <div>
          <h2>{text.finalTitle}</h2>
          <p>{text.finalBody}</p>
        </div>
        <a
          className="stay-d-airbnb-primary"
          href={STAY_D_AIRBNB_URL}
          target="_blank"
          rel="noopener noreferrer"
          data-stay-d-placement="stay-d-final-airbnb"
        >
          {text.airbnbCta}
          <ExternalLink aria-hidden="true" />
        </a>
      </section>
    </article>
  );
}
