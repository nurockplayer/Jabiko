import { useEffect, useMemo, useRef, useState } from "react";
import {
  getAdSensePlacement,
  loadAdSenseScript,
  readAdConsent,
  requestAdSenseFill,
  type AdSensePlacementId
} from "../../lib/adsense";

const AD_FILL_TIMEOUT_MS = 10_000;

export function AdSensePlacement({
  placement,
  eligible,
  label
}: {
  placement: AdSensePlacementId;
  eligible: boolean;
  label: string;
}) {
  const configuration = useMemo(
    () => (eligible ? getAdSensePlacement(placement) : null),
    [eligible, placement]
  );
  const configurationKey = configuration
    ? `${configuration.publisherId}:${configuration.slotId}`
    : null;
  const [consentedKey, setConsentedKey] = useState<string | null>(null);
  const [failedKey, setFailedKey] = useState<string | null>(null);
  const adRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    if (!configurationKey) return;
    let active = true;
    void readAdConsent(window)
      .then((allowed) => {
        if (active && allowed) setConsentedKey(configurationKey);
      })
      .catch(() => {
        // Consent integration failures are intentionally indistinguishable
        // from no consent: both withhold the placement and every ad request.
      });
    return () => {
      active = false;
    };
  }, [configurationKey]);

  const ready =
    configuration !== null &&
    configurationKey === consentedKey &&
    configurationKey !== failedKey;

  useEffect(() => {
    if (!ready || !configuration || !configurationKey) return;
    let active = true;
    let fillTimeout: number | undefined;
    const ad = adRef.current;
    const observer =
      ad && typeof MutationObserver !== "undefined"
        ? new MutationObserver(() => {
            if (ad.dataset.adStatus === "filled") {
              clearTimeout(fillTimeout);
            } else if (ad.dataset.adStatus === "unfilled" && active) {
              clearTimeout(fillTimeout);
              setFailedKey(configurationKey);
            }
          })
        : null;
    observer?.observe(ad as HTMLModElement, {
      attributes: true,
      attributeFilter: ["data-ad-status"]
    });

    void loadAdSenseScript(configuration.publisherId)
      .then(() => {
        if (!active) return;
        try {
          requestAdSenseFill();
          fillTimeout = window.setTimeout(() => {
            if (active) setFailedKey(configurationKey);
          }, AD_FILL_TIMEOUT_MS);
        } catch {
          setFailedKey(configurationKey);
        }
      })
      .catch(() => {
        if (active) setFailedKey(configurationKey);
      });

    return () => {
      active = false;
      clearTimeout(fillTimeout);
      observer?.disconnect();
    };
  }, [configuration, configurationKey, ready]);

  if (!ready) return null;

  return (
    <aside className="focus-break-ad" aria-label={label}>
      <span className="focus-break-ad-label">{label}</span>
      <ins
        ref={adRef}
        className="adsbygoogle"
        data-ad-client={configuration.publisherId}
        data-ad-slot={configuration.slotId}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
}
