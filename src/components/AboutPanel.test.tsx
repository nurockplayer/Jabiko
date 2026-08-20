import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AboutPanel } from "./AboutPanel";
import { copy, LAUNCHED_LANGUAGES } from "../i18n";

describe("AboutPanel author contact", () => {
  it("offers a mailto link to the author in every launched locale", () => {
    for (const language of LAUNCHED_LANGUAGES) {
      const { unmount } = render(<AboutPanel language={language} />);
      const link = screen.getByRole("link", { name: copy[language].aboutAuthorContact });
      expect(link, language).toHaveAttribute("href", "mailto:islu245777@gmail.com");
      unmount();
    }
  });
});
