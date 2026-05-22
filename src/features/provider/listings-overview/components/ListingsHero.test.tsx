import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ListingsHero } from "./ListingsHero";

describe("ListingsHero", () => {
  it("renders the h1 heading 'Meine Objekte'", () => {
    render(<ListingsHero />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Meine Objekte" })
    ).toBeInstanceOf(HTMLElement);
  });

  it("renders the lead paragraph", () => {
    render(<ListingsHero />);
    expect(
      screen.getByText("Verwalte deine Mietobjekte, Entwürfe und archivierten Einträge an einem Ort.")
    ).toBeInstanceOf(HTMLElement);
  });

  it("renders the kicker text", () => {
    render(<ListingsHero />);
    expect(screen.getByText("/ provider / listings")).toBeInstanceOf(HTMLElement);
  });

  it("renders a link with the correct href for new listing creation", () => {
    render(<ListingsHero />);
    const link = screen.getByRole("link", { name: /Neues Mietobjekt/ });
    expect(link.getAttribute("href")).toBe("/provider/listings/new");
  });
});
