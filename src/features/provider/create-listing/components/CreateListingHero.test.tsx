import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CreateListingHero } from "./CreateListingHero";

describe("CreateListingHero", () => {
  it("renders the kicker and step label", () => {
    render(<CreateListingHero />);

    expect(screen.getByText("Neues Mietobjekt")).toBeInstanceOf(HTMLElement);
    expect(screen.getByText("Schritt für Schritt")).toBeInstanceOf(HTMLElement);
  });

  it("renders the main heading", () => {
    render(<CreateListingHero />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Erstes Mietobjekt anlegen",
      }),
    ).toBeInstanceOf(HTMLElement);
  });

  it("renders a provided dynamic heading", () => {
    render(<CreateListingHero title="Weiteres Mietobjekt anlegen" />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Weiteres Mietobjekt anlegen",
      }),
    ).toBeInstanceOf(HTMLElement);
  });

  it("renders the lead paragraph", () => {
    render(<CreateListingHero />);

    expect(
      screen.getByText(
        "Erfasse die wichtigsten Daten deiner Immobilie. Du kannst jederzeit als Entwurf speichern und später weiterarbeiten — nichts wird veröffentlicht, bevor du es selbst freigibst.",
      ),
    ).toBeInstanceOf(HTMLElement);
  });
});
