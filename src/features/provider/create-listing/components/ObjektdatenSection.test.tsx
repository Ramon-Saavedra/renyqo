import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { INITIAL_DRAFT, type ListingPhoto } from "../hooks/useListingDraft";
import { ObjektdatenSection } from "./ObjektdatenSection";

describe("ObjektdatenSection", () => {
  it("renders the section heading, key fields and helper copy", () => {
    render(
      <ObjektdatenSection
        draft={INITIAL_DRAFT}
        setField={vi.fn()}
        setPhotos={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Das Wichtigste zu deiner Immobilie",
      }),
    ).toBeInstanceOf(HTMLElement);
    expect(screen.getByLabelText("Adresse")).toBeInstanceOf(HTMLInputElement);
    expect(screen.getByText("Objekttyp")).toBeInstanceOf(HTMLElement);
    expect(screen.getByLabelText("Wohnfläche")).toBeInstanceOf(
      HTMLInputElement,
    );
    expect(screen.getByLabelText("Frei ab")).toBeInstanceOf(HTMLInputElement);
    expect(screen.getByText("Fotos")).toBeInstanceOf(HTMLElement);
    expect(screen.getByText("0 / 600")).toBeInstanceOf(HTMLElement);
  });

  it("sanitizes numeric fields and truncates the description", () => {
    const setField = vi.fn();

    render(
      <ObjektdatenSection
        draft={INITIAL_DRAFT}
        setField={setField}
        setPhotos={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText("Wohnfläche"), {
      target: { value: "68qm" },
    });
    fireEvent.change(screen.getByLabelText("Kaltmiete"), {
      target: { value: "980 €" },
    });
    fireEvent.change(screen.getByLabelText("Kurzbeschreibung"), {
      target: { value: "a".repeat(805) },
    });

    expect(setField).toHaveBeenCalledWith("area", "68");
    expect(setField).toHaveBeenCalledWith("price", "980");
    expect(setField).toHaveBeenCalledWith("description", "a".repeat(800));
  });

  it("forwards photo updates through the photo grid", () => {
    const setPhotos = vi.fn();

    render(
      <ObjektdatenSection
        draft={INITIAL_DRAFT}
        setField={vi.fn()}
        setPhotos={setPhotos}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Foto hinzufügen" }));

    expect(setPhotos).toHaveBeenCalledTimes(1);

    const nextPhotos = setPhotos.mock
      .calls[0]?.[0] as ReadonlyArray<ListingPhoto>;

    expect(nextPhotos).toHaveLength(1);
    expect(nextPhotos[0]?.id).toMatch(/^photo-/);
    expect(nextPhotos[0]?.src.startsWith("data:image/svg+xml;utf8,")).toBe(
      true,
    );
  });
});
