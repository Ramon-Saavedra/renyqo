import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { ListingPhoto } from "../hooks/useListingDraft";
import { PhotoGrid } from "./PhotoGrid";

const PHOTO: ListingPhoto = {
  id: "photo-1",
  src: "https://example.com/photo.jpg",
};

describe("PhotoGrid", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the add action and helper text when the grid is empty", () => {
    render(<PhotoGrid photos={[]} setPhotos={vi.fn()} />);

    expect(
      screen.getByRole("button", { name: "Foto hinzufügen" }),
    ).toBeInstanceOf(HTMLButtonElement);
    expect(
      screen.getByText(
        "Mindestens 1 Foto wird empfohlen. Das erste Foto erscheint als Titelbild. Querformat sieht in den Suchergebnissen am besten aus.",
      ),
    ).toBeInstanceOf(HTMLElement);
  });

  it("renders a hidden file input accepting images", () => {
    render(<PhotoGrid photos={[]} setPhotos={vi.fn()} />);

    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    expect(input).toBeInstanceOf(HTMLInputElement);
    expect(input.accept).toBe("image/*");
    expect(input.multiple).toBe(true);
  });

  it("adds a photo when a file is selected via the input", async () => {
    const user = userEvent.setup();
    const setPhotos = vi.fn();
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:test-url");

    render(<PhotoGrid photos={[]} setPhotos={setPhotos} />);

    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const file = new File(["content"], "photo.jpg", { type: "image/jpeg" });

    await user.upload(input, file);

    expect(setPhotos).toHaveBeenCalledTimes(1);
    const added = setPhotos.mock.calls[0]![0] as ListingPhoto[];
    expect(added).toHaveLength(1);
    expect(added[0]!.src).toBe("blob:test-url");
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
