import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Gallery } from "./Gallery";

const images = Array.from(
  { length: 9 },
  (_, index) =>
    `https://res.cloudinary.com/dixoj5chu/image/upload/v1784031546/renyqo/listings/listing-${index}/photo-${index}.webp`,
);

describe("Gallery", () => {
  it("prioritizes the main image for above-the-fold loading", () => {
    render(<Gallery images={images.slice(0, 1)} title="Wohnung in Berlin" />);

    const image = screen.getByAltText("Wohnung in Berlin");
    expect(image.getAttribute("loading")).toBe("eager");
    expect(image.getAttribute("fetchpriority")).toBe("high");
  });

  it("keeps all thumbnails available in the horizontal rail", () => {
    render(<Gallery images={images} title="Wohnung in Berlin" />);

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(9);
    expect(buttons[0]?.querySelector("img")?.getAttribute("loading")).toBe(
      "eager",
    );

    fireEvent.click(buttons[8]!);

    expect(screen.getByText("9 / 9")).toBeInstanceOf(HTMLElement);
    expect(
      screen.getByAltText("Wohnung in Berlin").getAttribute("src"),
    ).toContain("photo-8.webp");
    expect(buttons[8]?.querySelector("img")?.getAttribute("loading")).toBe(
      "eager",
    );
  });
});
