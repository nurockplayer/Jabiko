import { useId, useState } from "react";
import { ChevronUp, ExternalLink, PlayCircle } from "lucide-react";
import type { Language } from "../i18n";
import { trackEvent } from "../lib/analytics";
import {
  STAY_D_AIRBNB_URL,
  STAY_D_VIDEO_ID,
  STAY_D_VIDEO_START_SECONDS,
  type StayDVideoCopy
} from "../domain/stayD";

export function StayDVideo({
  copy,
  locale,
  triggerPlacement,
  airbnbPlacement
}: {
  copy: StayDVideoCopy;
  locale: Language;
  triggerPlacement: "home-video" | "stay-d-video";
  airbnbPlacement: "home-video-airbnb" | "stay-d-video-airbnb";
}) {
  const [expanded, setExpanded] = useState(false);
  const panelId = useId();

  return (
    <div className="stay-d-video">
      <button
        type="button"
        className="stay-d-video-trigger"
        aria-expanded={expanded}
        aria-controls={panelId}
        data-stay-d-placement={triggerPlacement}
        onClick={() => {
          // Only an expand counts as a video interaction; collapsing a panel
          // must not be misreported as a second promo interest.
          if (!expanded) {
            trackEvent("promo_click", {
              promoId: "stay-d",
              action: "video",
              placement: triggerPlacement,
              locale
            });
          }
          setExpanded((current) => !current);
        }}
      >
        {expanded ? <ChevronUp aria-hidden="true" /> : <PlayCircle aria-hidden="true" />}
        {expanded ? copy.collapse : copy.watch}
      </button>

      {expanded ? (
        <div className="stay-d-video-panel" id={panelId}>
          <div className="stay-d-video-frame">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${STAY_D_VIDEO_ID}?start=${STAY_D_VIDEO_START_SECONDS}&rel=0`}
              title={copy.iframeTitle}
              loading="lazy"
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
          <a
            className="stay-d-video-airbnb"
            href={STAY_D_AIRBNB_URL}
            target="_blank"
            rel="noopener noreferrer"
            data-stay-d-placement={airbnbPlacement}
            onClick={() =>
              trackEvent("promo_click", {
                promoId: "stay-d",
                action: "airbnb",
                placement: airbnbPlacement,
                locale
              })
            }
          >
            {copy.airbnbCta}
            <ExternalLink aria-hidden="true" />
          </a>
        </div>
      ) : null}
    </div>
  );
}
