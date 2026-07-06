import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { INITIAL_DRAFT, type ListingPhoto } from "../hooks/useListingDraft";
import { ObjektdatenSection } from "./ObjektdatenSection";

describe("ObjektdatenSection", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

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
    expect(screen.getByPlaceholderText("Berlin")).toBeInstanceOf(
      HTMLInputElement,
    );
    expect(screen.getByText("Objekttyp")).toBeInstanceOf(HTMLElement);
    expect(document.getElementById("area")).toBeInstanceOf(HTMLInputElement);
    expect(document.getElementById("available-from")).toBeInstanceOf(
      HTMLInputElement,
    );
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

    fireEvent.change(document.getElementById("area") as HTMLInputElement, {
      target: { value: "68qm" },
    });
    fireEvent.change(document.getElementById("price") as HTMLInputElement, {
      target: { value: "980 €" },
    });
    fireEvent.change(
      screen.getByPlaceholderText(
        "Was macht dein Objekt besonders? Helle Räume, ruhige Lage, gute Verkehrsanbindung — beschreibe in 2–3 Sätzen, was Suchende wissen sollten.",
      ),
      {
        target: { value: "a".repeat(805) },
      },
    );

    expect(setField).toHaveBeenCalledWith("area", "68");
    expect(setField).toHaveBeenCalledWith("price", "980");
    expect(setField).toHaveBeenCalledWith("description", "a".repeat(800));
  });

  it("forwards photo updates through the photo grid", async () => {
    const user = userEvent.setup();
    const setPhotos = vi.fn();
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:test-url");

    render(
      <ObjektdatenSection
        draft={INITIAL_DRAFT}
        setField={vi.fn()}
        setPhotos={setPhotos}
      />,
    );

    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const file = new File(["content"], "photo.jpg", { type: "image/jpeg" });

    await user.upload(input, file);

    expect(setPhotos).toHaveBeenCalledTimes(1);

    const nextPhotos = setPhotos.mock
      .calls[0]?.[0] as ReadonlyArray<ListingPhoto>;

    expect(nextPhotos).toHaveLength(1);
    expect(nextPhotos[0]?.id).toMatch(/^photo-/);
    expect(nextPhotos[0]?.src).toBe("blob:test-url");
  });
});
