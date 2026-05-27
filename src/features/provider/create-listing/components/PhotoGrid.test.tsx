import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { ListingPhoto } from "../hooks/useListingDraft";
import { PhotoGrid } from "./PhotoGrid";

const PHOTO: ListingPhoto = {
  id: "photo-1",
  src: "https://example.com/photo.jpg",
};

describe("PhotoGrid", () => {
  it("renders the add action and helper text when the grid is empty", () => {
    render(<PhotoGrid photos={[]} setPhotos={vi.fn()} />);

    expect(
      screen.getByRole("button", { name: "Foto hinzufügen" }),
    ).toBeInstanceOf(HTMLButtonElement);
    expect(
      screen.getByText(
        "Mindestens 3 Fotos werden empfohlen. Das erste Foto erscheint als Titelbild. Querformat sieht in den Suchergebnissen am besten aus.",
      ),
    ).toBeInstanceOf(HTMLElement);
  });

  it("adds a demo photo when the add action is clicked", async () => {
    const user = userEvent.setup();
    const setPhotos = vi.fn();

    vi.spyOn(Date, "now").mockReturnValue(123456789);

    render(<PhotoGrid photos={[]} setPhotos={setPhotos} />);

    await user.click(screen.getByRole("button", { name: "Foto hinzufügen" }));

    expect(setPhotos).toHaveBeenCalledTimes(1);
    expect(setPhotos).toHaveBeenCalledWith([
      expect.objectContaining({
        id: "photo-123456789-0",
      }),
    ]);
  });

  it("renders the cover tag and removes a photo when requested", async () => {
    const user = userEvent.setup();
    const setPhotos = vi.fn();

    render(<PhotoGrid photos={[PHOTO]} setPhotos={setPhotos} />);

    expect(screen.getByText("Titelbild")).toBeInstanceOf(HTMLElement);

    await user.click(screen.getByRole("button", { name: "Entfernen" }));

    expect(setPhotos).toHaveBeenCalledWith([]);
  });

  it("hides the add action when the maximum number of photos is reached", () => {
    const photos = Array.from({ length: 12 }, (_, index) => ({
      id: `photo-${index}`,
      src: `https://example.com/${index}.jpg`,
    }));

    render(<PhotoGrid photos={photos} setPhotos={vi.fn()} />);

    expect(
      screen.queryByRole("button", { name: "Foto hinzufügen" }),
    ).toBeNull();
  });
});
