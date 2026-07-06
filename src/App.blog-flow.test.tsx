import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import App from "./App";

describe("App blog article flow", () => {
  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
    window.history.replaceState({}, "", "/");
  });

  it("opens the challenge view from a blog article CTA", async () => {
    const user = userEvent.setup();
    window.history.replaceState({}, "", "/blog/sweet-steady-sweet-step");

    const { container } = render(<App />);
    await screen.findByRole(
      "heading",
      { level: 1, name: /SWEET STEADY - SWEET STEP/ },
      { timeout: 30000 }
    );

    const ctaButton = await waitFor(() => {
      const button = container.querySelector<HTMLButtonElement>(".blog-cta");
      if (!button) {
        throw new Error("Blog article CTA did not render");
      }
      return button;
    });

    await user.click(ctaButton);

    await screen.findByRole("region", { name: "Jabiko practice" }, { timeout: 30000 });
    expect(window.location.pathname).toBe("/challenge");
  }, 60000);
});
