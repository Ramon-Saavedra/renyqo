import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ActionsBar } from "./ActionsBar";

describe("ActionsBar", () => {
  it("renders the missing-field state with chips and publish button enabled", () => {
    render(
      <ActionsBar
        missing={["Adresse", "Wohnfläche", "Kaltmiete"]}
        canPublish={false}
      />,
    );

    expect(screen.getByText("Noch fehlt")).toBeInstanceOf(HTMLElement);
    expect(screen.getByText("Adresse")).toBeInstanceOf(HTMLElement);
    expect(screen.getByText("Wohnfläche")).toBeInstanceOf(HTMLElement);
    expect(screen.getByText("Kaltmiete")).toBeInstanceOf(HTMLElement);

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
});
