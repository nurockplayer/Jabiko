import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ADSENSE_SCRIPT_ID,
  getAdSensePlacement,
  loadAdSenseScript,
  readAdConsent,
  resolveAdSenseConfig,
  resolveAdSensePlacement
} from "./adsense";

const COMPLETE_ENV = {
  VITE_ADSENSE_ENABLED: "true",
  VITE_ADSENSE_FOCUS_BREAK_POLICY_ELIGIBLE: "true",
  VITE_ADSENSE_PUBLISHER_ID: "ca-pub-1234567890123456",
  VITE_ADSENSE_FOCUS_BREAK_SLOT: "1234567890"
};

describe("AdSense configuration", () => {
  it("fails closed outside production even when every public value is present", () => {
    expect(resolveAdSenseConfig(COMPLETE_ENV, false)).toBeNull();
  });

  it.each([
    ["disabled", { ...COMPLETE_ENV, VITE_ADSENSE_ENABLED: "false" }],
    ["policy eligibility absent", { ...COMPLETE_ENV, VITE_ADSENSE_FOCUS_BREAK_POLICY_ELIGIBLE: "" }],
    ["publisher ID absent", { ...COMPLETE_ENV, VITE_ADSENSE_PUBLISHER_ID: "" }],
    ["publisher ID invalid", { ...COMPLETE_ENV, VITE_ADSENSE_PUBLISHER_ID: "pub-not-real" }],
    ["slot absent", { ...COMPLETE_ENV, VITE_ADSENSE_FOCUS_BREAK_SLOT: "" }],
    ["slot invalid", { ...COMPLETE_ENV, VITE_ADSENSE_FOCUS_BREAK_SLOT: "slot-id" }]
  ])("fails closed when %s", (_case, env) => {
    expect(resolveAdSenseConfig(env, true)).toBeNull();
  });

  it("resolves the one allowlisted placement from complete production configuration", () => {
    const config = resolveAdSenseConfig(COMPLETE_ENV, true);
    expect(config).toEqual({
      publisherId: COMPLETE_ENV.VITE_ADSENSE_PUBLISHER_ID,
      placements: {
        "focus-break": { slotId: COMPLETE_ENV.VITE_ADSENSE_FOCUS_BREAK_SLOT }
      }
    });
    expect(resolveAdSensePlacement(config, "focus-break")).toEqual({
      placement: "focus-break",
      publisherId: COMPLETE_ENV.VITE_ADSENSE_PUBLISHER_ID,
      slotId: COMPLETE_ENV.VITE_ADSENSE_FOCUS_BREAK_SLOT
    });
  });

  it("rejects unsupported placement identifiers at the runtime boundary", () => {
    const config = resolveAdSenseConfig(COMPLETE_ENV, true);
    expect(resolveAdSensePlacement(config, "challenge-answer" as string)).toBeNull();
  });

  it("keeps the real Vite runtime fail closed in tests", () => {
    expect(getAdSensePlacement("focus-break")).toBeNull();
  });
});

describe("AdSense TCF consent gate", () => {
  afterEach(() => vi.useRealTimers());

  it("withholds consent when no certified CMP signal is available", async () => {
    await expect(readAdConsent({})).resolves.toBe(false);
  });

  it("allows non-applicable traffic only after a successful CMP signal", async () => {
    const cmpWindow = {
      __tcfapi: vi.fn((_command, _version, callback) => {
        callback({ gdprApplies: false, listenerId: 1 }, true);
      })
    };
    await expect(readAdConsent(cmpWindow)).resolves.toBe(true);
  });

  it("requires a ready TC string and Purpose 1 consent when GDPR applies", async () => {
    const cmpWindow = {
      __tcfapi: vi.fn((_command, _version, callback) => {
        callback(
          {
            gdprApplies: true,
            eventStatus: "useractioncomplete",
            tcString: "operator-provided-tc-string",
            purpose: { consents: { 1: true } },
            listenerId: 2
          },
          true
        );
      })
    };
    await expect(readAdConsent(cmpWindow)).resolves.toBe(true);
  });

  it("still settles when a CMP throws while removing its listener", async () => {
    const cmpWindow = {
      __tcfapi: vi.fn((command, _version, callback) => {
        if (command === "removeEventListener") throw new Error("CMP cleanup failed");
        callback({ gdprApplies: false, listenerId: 4 }, true);
      })
    };
    await expect(readAdConsent(cmpWindow, 10)).resolves.toBe(true);
  });

  it.each([
    ["failed callback", {}, false],
    [
      "missing Purpose 1 consent",
      {
        gdprApplies: true,
        eventStatus: "tcloaded",
        tcString: "operator-provided-tc-string",
        purpose: { consents: { 1: false } }
      },
      true
    ],
    [
      "missing TC string",
      {
        gdprApplies: true,
        eventStatus: "tcloaded",
        tcString: "",
        purpose: { consents: { 1: true } }
      },
      true
    ]
  ])("withholds consent for %s", async (_case, tcData, success) => {
    const cmpWindow = {
      __tcfapi: vi.fn((_command, _version, callback) => callback(tcData, success))
    };
    await expect(readAdConsent(cmpWindow)).resolves.toBe(false);
  });

  it("fails closed when the CMP never reaches a usable state", async () => {
    vi.useFakeTimers();
    const cmpWindow = {
      __tcfapi: vi.fn((_command, _version, callback) => {
        callback({ gdprApplies: true, eventStatus: "cmpuishown", listenerId: 3 }, true);
      })
    };
    const result = readAdConsent(cmpWindow, 1000);
    await vi.advanceTimersByTimeAsync(1000);
    await expect(result).resolves.toBe(false);
  });
});

describe("AdSense script loader", () => {
  afterEach(() => vi.useRealTimers());

  it("loads the approved publisher script at most once per document", async () => {
    const targetDocument = document.implementation.createHTMLDocument();
    const first = loadAdSenseScript(COMPLETE_ENV.VITE_ADSENSE_PUBLISHER_ID, targetDocument, 1000);
    const second = loadAdSenseScript(COMPLETE_ENV.VITE_ADSENSE_PUBLISHER_ID, targetDocument, 1000);

    const scripts = targetDocument.querySelectorAll<HTMLScriptElement>(`#${ADSENSE_SCRIPT_ID}`);
    expect(scripts).toHaveLength(1);
    expect(scripts[0]?.src).toBe(
      `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${COMPLETE_ENV.VITE_ADSENSE_PUBLISHER_ID}`
    );
    scripts[0]?.dispatchEvent(new Event("load"));
    await expect(Promise.all([first, second])).resolves.toEqual([undefined, undefined]);
  });

  it("reports script failure without throwing into the learning flow", async () => {
    const targetDocument = document.implementation.createHTMLDocument();
    const result = loadAdSenseScript(
      COMPLETE_ENV.VITE_ADSENSE_PUBLISHER_ID,
      targetDocument,
      1000
    );
    targetDocument
      .querySelector<HTMLScriptElement>(`#${ADSENSE_SCRIPT_ID}`)
      ?.dispatchEvent(new Event("error"));
    await expect(result).rejects.toThrow("AdSense script failed to load");
    expect(targetDocument.getElementById(ADSENSE_SCRIPT_ID)).toBeNull();
  });

  it("times out a blocked script and removes its reserved loader element", async () => {
    vi.useFakeTimers();
    const targetDocument = document.implementation.createHTMLDocument();
    const result = loadAdSenseScript(
      COMPLETE_ENV.VITE_ADSENSE_PUBLISHER_ID,
      targetDocument,
      1000
    );
    const rejection = expect(result).rejects.toThrow("AdSense script load timed out");
    await vi.advanceTimersByTimeAsync(1000);
    await rejection;
    expect(targetDocument.getElementById(ADSENSE_SCRIPT_ID)).toBeNull();
  });
});
