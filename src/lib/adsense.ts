const PUBLISHER_ID_PATTERN = /^ca-pub-\d{16}$/;
const SLOT_ID_PATTERN = /^\d{10}$/;
const CONSENT_READY_EVENTS = new Set(["tcloaded", "useractioncomplete"]);

export const ADSENSE_SCRIPT_ID = "jabiko-adsense-script";

export type AdSensePlacementId = "focus-break";

export interface AdSensePublicEnv {
  VITE_ADSENSE_ENABLED?: string;
  VITE_ADSENSE_FOCUS_BREAK_POLICY_ELIGIBLE?: string;
  VITE_ADSENSE_PUBLISHER_ID?: string;
  VITE_ADSENSE_FOCUS_BREAK_SLOT?: string;
}

export interface AdSenseConfig {
  publisherId: string;
  placements: Record<AdSensePlacementId, { slotId: string }>;
}

export interface AdSensePlacementConfig {
  placement: AdSensePlacementId;
  publisherId: string;
  slotId: string;
}

interface TcfData {
  gdprApplies?: boolean;
  eventStatus?: string;
  tcString?: string;
  purpose?: { consents?: Record<number, boolean> };
  listenerId?: number;
}

type TcfCallback = (tcData: TcfData, success: boolean) => void;

export type TcfApi = (
  command: "addEventListener" | "removeEventListener",
  version: 2,
  callback: TcfCallback,
  listenerId?: number
) => void;

export interface AdConsentWindow {
  __tcfapi?: TcfApi;
}

export function resolveAdSenseConfig(
  env: AdSensePublicEnv,
  isProduction: boolean
): AdSenseConfig | null {
  if (
    !isProduction ||
    env.VITE_ADSENSE_ENABLED !== "true" ||
    env.VITE_ADSENSE_FOCUS_BREAK_POLICY_ELIGIBLE !== "true"
  ) {
    return null;
  }

  const publisherId = env.VITE_ADSENSE_PUBLISHER_ID?.trim() ?? "";
  const focusBreakSlot = env.VITE_ADSENSE_FOCUS_BREAK_SLOT?.trim() ?? "";
  if (!PUBLISHER_ID_PATTERN.test(publisherId) || !SLOT_ID_PATTERN.test(focusBreakSlot)) {
    return null;
  }

  return {
    publisherId,
    placements: { "focus-break": { slotId: focusBreakSlot } }
  };
}

export function resolveAdSensePlacement(
  config: AdSenseConfig | null,
  placement: string
): AdSensePlacementConfig | null {
  if (!config || placement !== "focus-break") return null;
  return {
    placement,
    publisherId: config.publisherId,
    slotId: config.placements[placement].slotId
  };
}

export function getAdSensePlacement(placement: string): AdSensePlacementConfig | null {
  const config = resolveAdSenseConfig(
    {
      VITE_ADSENSE_ENABLED: import.meta.env.VITE_ADSENSE_ENABLED,
      VITE_ADSENSE_FOCUS_BREAK_POLICY_ELIGIBLE:
        import.meta.env.VITE_ADSENSE_FOCUS_BREAK_POLICY_ELIGIBLE,
      VITE_ADSENSE_PUBLISHER_ID: import.meta.env.VITE_ADSENSE_PUBLISHER_ID,
      VITE_ADSENSE_FOCUS_BREAK_SLOT: import.meta.env.VITE_ADSENSE_FOCUS_BREAK_SLOT
    },
    import.meta.env.PROD
  );
  return resolveAdSensePlacement(config, placement);
}

/**
 * Read the standard IAB TCF signal provided by the operator's Google-certified
 * CMP. This is an integration gate only; Jabiko does not implement or persist
 * consent choices itself.
 */
export function readAdConsent(
  targetWindow: AdConsentWindow,
  timeoutMs = 3000
): Promise<boolean> {
  const tcfApi = targetWindow.__tcfapi;
  if (!tcfApi) return Promise.resolve(false);

  return new Promise((resolve) => {
    let settled = false;
    let listenerId: number | undefined;

    const finish = (allowed: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (listenerId !== undefined) {
        try {
          tcfApi("removeEventListener", 2, () => {}, listenerId);
        } catch {
          // A third-party CMP cleanup failure must not leave this gate pending.
        }
      }
      resolve(allowed);
    };

    const timeout = window.setTimeout(() => finish(false), timeoutMs);
    try {
      tcfApi("addEventListener", 2, (tcData, success) => {
        listenerId = tcData.listenerId;
        if (!success) {
          finish(false);
          return;
        }
        if (tcData.gdprApplies === false) {
          finish(true);
          return;
        }
        if (
          tcData.gdprApplies === true &&
          tcData.eventStatus !== undefined &&
          CONSENT_READY_EVENTS.has(tcData.eventStatus)
        ) {
          finish(Boolean(tcData.tcString && tcData.purpose?.consents?.[1] === true));
        }
      });
    } catch {
      finish(false);
    }
  });
}

const scriptLoads = new WeakMap<Document, Promise<void>>();

export function loadAdSenseScript(
  publisherId: string,
  targetDocument: Document = document,
  timeoutMs = 8000
): Promise<void> {
  const existingLoad = scriptLoads.get(targetDocument);
  if (existingLoad) return existingLoad;

  const load = new Promise<void>((resolve, reject) => {
    const script = targetDocument.createElement("script");
    script.id = ADSENSE_SCRIPT_ID;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`;

    const timeout = window.setTimeout(() => fail("AdSense script load timed out"), timeoutMs);
    const cleanup = () => {
      clearTimeout(timeout);
      script.removeEventListener("load", onLoad);
      script.removeEventListener("error", onError);
    };
    const fail = (message: string) => {
      cleanup();
      script.remove();
      scriptLoads.delete(targetDocument);
      reject(new Error(message));
    };
    const onLoad = () => {
      cleanup();
      resolve();
    };
    const onError = () => fail("AdSense script failed to load");

    script.addEventListener("load", onLoad, { once: true });
    script.addEventListener("error", onError, { once: true });
    targetDocument.head.append(script);
  });

  scriptLoads.set(targetDocument, load);
  return load;
}

export function requestAdSenseFill(targetWindow: Window = window): void {
  targetWindow.adsbygoogle = targetWindow.adsbygoogle ?? [];
  targetWindow.adsbygoogle.push({});
}
