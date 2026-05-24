import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EmptyStateHero } from "./EmptyStateHero";

const DEFAULT_PROPS = {
  welcome: "Willkommen bei renyqo",
  title: "Weniger sortieren. Klarer vermieten.",
  lead: "Lege dein Mietobjekt einmal sauber an.",
  ctaLabel: "Erstes Mietobjekt anlegen",
  ctaHref: "/provider/listings/new",
  trust: "Du kannst jederzeit als Entwurf speichern.",
};

describe("EmptyStateHero", () => {
  it("renders the welcome pill text", () => {
    render(<EmptyStateHero {...DEFAULT_PROPS} />);

    expect(screen.getByText("Willkommen bei renyqo")).toBeInstanceOf(
      HTMLElement,
    );
  });

  it("renders the h1 title", () => {
    render(<EmptyStateHero {...DEFAULT_PROPS} />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Weniger sortieren. Klarer vermieten.",
      }),
    ).toBeInstanceOf(HTMLElement);
  });

  it("renders the lead paragraph", () => {
    render(<EmptyStateHero {...DEFAULT_PROPS} />);

    expect(
      screen.getByText("Lege dein Mietobjekt einmal sauber an."),
    ).toBeInstanceOf(HTMLElement);
  });

  it("renders the CTA link with the correct href", () => {
    render(<EmptyStateHero {...DEFAULT_PROPS} />);

    const link = screen.getByRole("link", {
      name: /Erstes Mietobjekt anlegen/,
    });

    expect(link.getAttribute("href")).toBe("/provider/listings/new");
  });

  it("renders the trust pill text", () => {
    render(<EmptyStateHero {...DEFAULT_PROPS} />);

    expect(
      screen.getByText("Du kannst jederzeit als Entwurf speichern."),
    ).toBeInstanceOf(HTMLElement);
  });
});
