import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AdSensePlacement } from "./AdSensePlacement";

const adMocks = vi.hoisted(() => ({
  getAdSensePlacement: vi.fn(),
  loadAdSenseScript: vi.fn(),
  readAdConsent: vi.fn(),
  requestAdSenseFill: vi.fn()
}));

vi.mock("../../lib/adsense", () => adMocks);

const CONFIG = {
  placement: "focus-break" as const,
  publisherId: "ca-pub-1234567890123456",
  slotId: "1234567890"
};

describe("AdSensePlacement", () => {
  beforeEach(() => {
    adMocks.getAdSensePlacement.mockReturnValue(CONFIG);
    adMocks.readAdConsent.mockResolvedValue(true);
    adMocks.loadAdSenseScript.mockResolvedValue(undefined);
    adMocks.requestAdSenseFill.mockReturnValue(undefined);
  });

  afterEach(() => vi.clearAllMocks());

  it("renders nothing and performs no consent or script work when context eligibility fails", () => {
    const { container } = render(
      <AdSensePlacement placement="focus-break" eligible={false} label="廣告" />
    );
    expect(container).toBeEmptyDOMElement();
    expect(adMocks.getAdSensePlacement).not.toHaveBeenCalled();
    expect(adMocks.readAdConsent).not.toHaveBeenCalled();
    expect(adMocks.loadAdSenseScript).not.toHaveBeenCalled();
  });

  it("renders nothing when production configuration is unavailable", () => {
    adMocks.getAdSensePlacement.mockReturnValue(null);
    const { container } = render(
      <AdSensePlacement placement="focus-break" eligible={true} label="廣告" />
    );
    expect(container).toBeEmptyDOMElement();
    expect(adMocks.readAdConsent).not.toHaveBeenCalled();
    expect(adMocks.loadAdSenseScript).not.toHaveBeenCalled();
  });

  it("withholds markup and the Google script when consent is unavailable", async () => {
    adMocks.readAdConsent.mockResolvedValue(false);
    const { container } = render(
      <AdSensePlacement placement="focus-break" eligible={true} label="廣告" />
    );
    await waitFor(() => expect(adMocks.readAdConsent).toHaveBeenCalledTimes(1));
    expect(container).toBeEmptyDOMElement();
    expect(adMocks.loadAdSenseScript).not.toHaveBeenCalled();
  });

  it("renders one labelled responsive unit only after all gates pass", async () => {
    const { container } = render(
      <AdSensePlacement placement="focus-break" eligible={true} label="廣告" />
    );

    const region = await screen.findByRole("complementary", { name: "廣告" });
    const ad = container.querySelector("ins.adsbygoogle");
    expect(region).toBeInTheDocument();
    expect(ad).toHaveAttribute("data-ad-client", CONFIG.publisherId);
    expect(ad).toHaveAttribute("data-ad-slot", CONFIG.slotId);
    expect(ad).toHaveAttribute("data-ad-format", "auto");
    expect(ad).toHaveAttribute("data-full-width-responsive", "true");
    await waitFor(() => expect(adMocks.requestAdSenseFill).toHaveBeenCalledTimes(1));
    expect(adMocks.loadAdSenseScript).toHaveBeenCalledWith(CONFIG.publisherId);
  });

  it("removes the reserved placement when the script is blocked or fails", async () => {
    adMocks.loadAdSenseScript.mockRejectedValue(new Error("blocked"));
    render(<AdSensePlacement placement="focus-break" eligible={true} label="廣告" />);
    await waitFor(() =>
      expect(screen.queryByRole("complementary", { name: "廣告" })).not.toBeInTheDocument()
    );
    expect(adMocks.requestAdSenseFill).not.toHaveBeenCalled();
  });

  it("removes an explicitly unfilled unit instead of leaving an empty ad-shaped hole", async () => {
    const { container } = render(
      <AdSensePlacement placement="focus-break" eligible={true} label="廣告" />
    );
    await screen.findByRole("complementary", { name: "廣告" });
    const ad = container.querySelector<HTMLElement>("ins.adsbygoogle");
    ad?.setAttribute("data-ad-status", "unfilled");
    await waitFor(() =>
      expect(screen.queryByRole("complementary", { name: "廣告" })).not.toBeInTheDocument()
    );
  });
});
