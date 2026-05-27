import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TopbarActions } from "./TopbarActions";

describe("TopbarActions", () => {
  it("renders the draft badge, autosaved label and back link", () => {
    render(<TopbarActions status="saved" />);

    expect(screen.getByText("Entwurf · Nicht öffentlich")).toBeInstanceOf(
      HTMLElement,
    );
    expect(screen.getByText("Automatisch gespeichert")).toBeInstanceOf(
      HTMLElement,
    );

    const link = screen.getByRole("link", { name: /Zurück/ });

    expect(link.getAttribute("href")).toBe("/provider/get-started");
  });

  it("renders the saving state as a polite live region", () => {
    render(<TopbarActions status="saving" />);

    const liveRegion = screen.getByText("Wird gespeichert").closest("span");

    expect(liveRegion).toBeInstanceOf(HTMLElement);
    expect(liveRegion?.getAttribute("aria-live")).toBe("polite");
    expect(liveRegion?.querySelector(".animate-pulse")).toBeInstanceOf(
      HTMLElement,
    );
  });
});
