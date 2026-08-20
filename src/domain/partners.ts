import type { LocaleCode } from "./types";
import type { PromoIdentifier, PromoPlacement } from "../lib/analytics";
import {
  STAY_D_AIRBNB_URL,
  STAY_D_EDITORIAL_COPY,
  STAY_D_REQUIRED_LOCALES,
  type StayDVideoCopy
} from "./stayD";

/** One partner's card copy in one locale. */
export interface PartnerCopy {
  /** Small label above the name, e.g. the category of the partnership. */
  kicker: string;
  /** Headline of the card -- what is being recommended. */
  name: string;
  /** Two or three lines on why it is here. */
  body: string;
  /** Label of the outbound link. */
  cta: string;
}

export interface PartnerVideo {
  copy: Partial<Record<LocaleCode, StayDVideoCopy>>;
  triggerPlacement: "stay-d-video";
  linkPlacement: "stay-d-video-airbnb";
}

// A partner is only representable once analytics has an approved identifier
// and placement for it (src/lib/analytics.ts) -- that boundary is what keeps
// free-form text out of the event payloads, so a new partnership extends
// those unions on purpose rather than by accident.

export interface Partner {
  readonly id: PromoIdentifier;
  /** Locales this partner has copy for; it is not offered anywhere else. */
  readonly locales: readonly LocaleCode[];
  readonly url: string;
  /** `data-stay-d-placement` / analytics placement of the outbound link. */
  readonly linkPlacement: PromoPlacement;
  readonly copy: Partial<Record<LocaleCode, PartnerCopy>>;
  readonly video?: PartnerVideo;
}

// Stay.D's card reuses the /stay-d editorial copy it already ships, so the
// wording lives in one place and adding a partner never touches it.
const stayDCopy = Object.fromEntries(
  STAY_D_REQUIRED_LOCALES.map((locale) => [
    locale,
    {
      kicker: STAY_D_EDITORIAL_COPY[locale].kicker,
      name: STAY_D_EDITORIAL_COPY[locale].title,
      body: STAY_D_EDITORIAL_COPY[locale].body,
      cta: STAY_D_EDITORIAL_COPY[locale].airbnbCta
    }
  ])
) as Partial<Record<LocaleCode, PartnerCopy>>;

const stayDVideoCopy = Object.fromEntries(
  STAY_D_REQUIRED_LOCALES.map((locale) => [locale, STAY_D_EDITORIAL_COPY[locale].video])
) as Partial<Record<LocaleCode, StayDVideoCopy>>;

/**
 * Everything the 合作推廣 page lists. A new partnership is one more entry
 * here -- the page renders whatever this registry offers for the locale.
 */
export const PARTNER_REGISTRY: readonly Partner[] = [
  {
    id: "stay-d",
    locales: STAY_D_REQUIRED_LOCALES,
    url: STAY_D_AIRBNB_URL,
    linkPlacement: "stay-d-hero-airbnb",
    copy: stayDCopy,
    video: {
      copy: stayDVideoCopy,
      triggerPlacement: "stay-d-video",
      linkPlacement: "stay-d-video-airbnb"
    }
  }
];

export function partnersForLocale(language: LocaleCode): readonly Partner[] {
  return PARTNER_REGISTRY.filter((partner) => partner.locales.includes(language));
}
