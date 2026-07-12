import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { ListingPhoto } from "../hooks/useListingDraft";
import { PhotoGrid } from "./PhotoGrid";

const PHOTO: ListingPhoto = {
  id: "photo-1",
  src: "https://example.com/photo.jpg",
  file: new File(["photo"], "photo.jpg", { type: "image/jpeg" }),
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
    expect(screen.getByText("Fotos hier ablegen")).toBeInstanceOf(HTMLElement);
    expect(screen.getByText("oder Foto auswählen")).toBeInstanceOf(HTMLElement);
    expect(
      screen.getByText("JPG, PNG oder WebP · bis zu 12 Fotos"),
    ).toBeInstanceOf(HTMLElement);
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
    expect(added[0]!.file).toBe(file);
  });

  it("adds a photo when an image file is dropped on the grid", () => {
    const setPhotos = vi.fn();
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:dropped-url");

    render(<PhotoGrid photos={[]} setPhotos={setPhotos} />);

    const grid = screen
      .getByRole("button", { name: "Foto hinzufügen" })
      .closest(".photo-grid");
    const file = new File(["content"], "dropped.jpg", { type: "image/jpeg" });

    fireEvent.dragEnter(grid as Element, {
      dataTransfer: { types: ["Files"], files: [file] },
    });
    fireEvent.drop(grid as Element, {
      dataTransfer: { types: ["Files"], files: [file] },
    });

    expect(setPhotos).toHaveBeenCalledTimes(1);
    const added = setPhotos.mock.calls[0]![0] as ListingPhoto[];
    expect(added).toHaveLength(1);
    expect(added[0]!.src).toBe("blob:dropped-url");
    expect(added[0]!.file).toBe(file);
  });

  it("shows the active drop state while files are dragged over the grid", () => {
    render(<PhotoGrid photos={[]} setPhotos={vi.fn()} />);

    const grid = screen
      .getByRole("button", { name: "Foto hinzufügen" })
      .closest(".photo-grid");

    fireEvent.dragEnter(grid as Element, {
      dataTransfer: { types: ["Files"], files: [] },
    });

    expect(screen.getByText("Loslassen zum Hinzufügen")).toBeInstanceOf(
      HTMLElement,
    );
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
      file: new File([String(index)], `${index}.jpg`, { type: "image/jpeg" }),
    }));

    render(<PhotoGrid photos={photos} setPhotos={vi.fn()} />);

    expect(
      screen.queryByRole("button", { name: "Foto hinzufügen" }),
    ).toBeNull();
  });
});
