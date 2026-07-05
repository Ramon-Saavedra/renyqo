import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { INITIAL_DRAFT, type ListingDraft } from "../hooks/useListingDraft";
import { PreviewCard } from "./PreviewCard";

const POPULATED_DRAFT: ListingDraft = {
  ...INITIAL_DRAFT,
  city: "Berlin",
  zip: "10623",
  street: "Kantstraße 10",
  hideAddress: false,
  area: "68",
  rooms: "2.5",
  bedrooms: 1,
  price: "1250",
  availableFrom: "2026-06-15",
  photos: [{ id: "cover-1", src: "https://example.com/cover.jpg" }],
};

describe("PreviewCard", () => {
  it("renders placeholders for an empty draft", () => {
    render(<PreviewCard draft={INITIAL_DRAFT} finalTitle="" />);

    expect(
      screen.getByLabelText("So sehen Suchende dein Objekt"),
    ).toBeInstanceOf(HTMLElement);
    expect(screen.getByText("Titel wird generiert …")).toBeInstanceOf(
      HTMLElement,
    );
    expect(screen.getByText("Adresse hinzufügen")).toBeInstanceOf(HTMLElement);
    expect(screen.getByText("Kaltmiete fehlt")).toBeInstanceOf(HTMLElement);
    expect(screen.getByText("Foto erscheint hier")).toBeInstanceOf(HTMLElement);
  });

  it("renders the populated preview values", () => {
    const { container } = render(
      <PreviewCard
        draft={POPULATED_DRAFT}
        finalTitle="2.5-Zimmer-Wohnung in Berlin"
      />,
    );

    expect(
      screen.getByRole("heading", {
        level: 3,
        name: "2.5-Zimmer-Wohnung in Berlin",
      }),
    ).toBeInstanceOf(HTMLElement);
    expect(screen.getByText("Kantstraße 10, 10623 Berlin")).toBeInstanceOf(
      HTMLElement,
    );
    expect(screen.getByText("68 m²")).toBeInstanceOf(HTMLElement);
    expect(screen.getByText("2,5")).toBeInstanceOf(HTMLElement);
    expect(screen.getByText("1")).toBeInstanceOf(HTMLElement);
    expect(screen.getByText("1.250 €")).toBeInstanceOf(HTMLElement);
    expect(container.querySelector('[style*="cover.jpg"]')).toBeInstanceOf(
      HTMLElement,
    );
  });

  it("shows only the neighborhood when the exact address is hidden", () => {
    render(
      <PreviewCard
        draft={{ ...POPULATED_DRAFT, hideAddress: true }}
        finalTitle="Titel"
      />,
    );

    expect(screen.getByText("Berlin")).toBeInstanceOf(HTMLElement);
    expect(screen.queryByText("Kantstraße 10, 10623 Berlin")).toBeNull();
    expect(screen.getByText("Veröffentlichen")).toBeInstanceOf(HTMLElement);
  });
});
