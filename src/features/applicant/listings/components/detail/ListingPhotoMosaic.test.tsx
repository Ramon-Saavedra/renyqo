import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ListingPhotoMosaic } from "./ListingPhotoMosaic";

const BASE_IMAGE = {
  id: "1",
  secureUrl: "https://res.cloudinary.com/photo.jpg",
  position: 0,
  isCover: false,
};

describe("ListingPhotoMosaic", () => {
  it("shows the empty placeholder when there are no images", () => {
    render(<ListingPhotoMosaic images={[]} title="Wohnung" />);

    expect(screen.getByText("Kein Foto vorhanden")).toBeInstanceOf(HTMLElement);
  });

  it("labels the gallery for screen readers", () => {
    render(<ListingPhotoMosaic images={[BASE_IMAGE]} title="Wohnung" />);

    expect(screen.getByLabelText("Fotos des Objekts")).toBeInstanceOf(
      HTMLElement,
    );
  });

  it("renders an accessible alt for each image", () => {
    render(
      <ListingPhotoMosaic
        images={[BASE_IMAGE, { ...BASE_IMAGE, id: "2", position: 1 }]}
        title="Wohnung"
      />,
    );

    expect(screen.getByAltText("Wohnung — Foto 1")).toBeInstanceOf(
      HTMLImageElement,
    );
    expect(screen.getByAltText("Wohnung — Foto 2")).toBeInstanceOf(
      HTMLImageElement,
    );
  });
});
