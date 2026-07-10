import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ActionsBar } from "./ActionsBar";

describe("ActionsBar", () => {
  it("renders the missing-field state with chips and publish button enabled", () => {
    render(
      <ActionsBar
        missing={["Stadt", "Wohnfläche", "Kaltmiete"]}
        canPublish={false}
      />,
    );

    expect(screen.getByText("Noch fehlt")).toBeInstanceOf(HTMLElement);
    expect(screen.getByRole("button", { name: "Stadt" })).toBeInstanceOf(
      HTMLButtonElement,
    );
    expect(screen.getByRole("button", { name: "Wohnfläche" })).toBeInstanceOf(
      HTMLButtonElement,
    );
    expect(screen.getByRole("button", { name: "Kaltmiete" })).toBeInstanceOf(
      HTMLButtonElement,
    );

    const publishButton = screen.getByRole("button", {
      name: "Veröffentlichen",
    });

    expect(publishButton).toBeInstanceOf(HTMLButtonElement);
    expect((publishButton as HTMLButtonElement).disabled).toBe(false);
  });

  it("renders the success state when all fields are complete", () => {
    const { container } = render(<ActionsBar missing={[]} canPublish />);

    expect(
      screen.getByText(
        "Alle Pflichtangaben vollständig — du kannst veröffentlichen.",
      ),
    ).toBeInstanceOf(HTMLElement);
    expect(screen.queryByText("Noch fehlt")).toBeNull();
    expect(container.querySelector("svg")).toBeInstanceOf(SVGElement);

    const publishButton = screen.getByRole("button", {
      name: "Veröffentlichen",
    });

    expect((publishButton as HTMLButtonElement).disabled).toBe(false);
    const draftButton = screen.getByRole("button", {
      name: "Als Entwurf speichern",
    });

    expect(draftButton).toBeInstanceOf(HTMLButtonElement);
    expect(draftButton.className).toContain("bg-primary-tint");
    expect(draftButton.className).toContain("border-primary-soft");
  });

  it("focuses the related field when a missing item is clicked", () => {
    const originalScrollIntoView = Element.prototype.scrollIntoView;
    const scrollIntoView = vi.fn();
    Object.defineProperty(Element.prototype, "scrollIntoView", {
      configurable: true,
      value: scrollIntoView,
    });

    try {
      render(
        <>
          <input id="city" aria-label="Stadt Ziel" />
          <ActionsBar missing={["Stadt"]} canPublish={false} />
        </>,
      );

      const cityButton = screen.getByRole("button", { name: "Stadt" });
      expect(cityButton).toBeInstanceOf(HTMLButtonElement);

      fireEvent.click(cityButton);

      expect(scrollIntoView).toHaveBeenCalledWith({
        behavior: "smooth",
        block: "center",
      });
      expect(document.activeElement).toBe(screen.getByLabelText("Stadt Ziel"));
    } finally {
      Object.defineProperty(Element.prototype, "scrollIntoView", {
        configurable: true,
        value: originalScrollIntoView,
      });
    }
  });
});
