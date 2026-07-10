import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RenyqoLoadingDots } from "./RenyqoLoadingDots";

describe("RenyqoLoadingDots", () => {
  it("renders the label and three alignment dots", () => {
    const { container } = render(<RenyqoLoadingDots label="Wird geladen" />);

    expect(screen.getByText("Wird geladen")).toBeInstanceOf(HTMLElement);
    expect(container.querySelectorAll(".align-dots i")).toHaveLength(3);
  });

  it("exposes a polite status role", () => {
    render(<RenyqoLoadingDots label="Lädt" />);
    expect(screen.getByRole("status").textContent).toContain("Lädt");
  });
});
