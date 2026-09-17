import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/client";
import {
  deleteListingImage,
  reorderListingImages,
  updateListing,
  uploadListingImage,
} from "@/lib/api/listings";
import type { ListingDetail } from "../../types";
import { listingEditCopy } from "../copy";
import { ListingEditView } from "./ListingEditView";

vi.mock("@/lib/api/listings", () => ({
  deleteListingImage: vi.fn(),
  reorderListingImages: vi.fn(),
  updateListing: vi.fn(),
  uploadListingImage: vi.fn(),
}));

const LISTING: ListingDetail = {
  id: "listing-1",
  title: "Helle Wohnung",
  status: "published",
  objectType: "APARTMENT",
  street: "Musterstraße 1",
  zip: "10115",
  city: "Berlin",
  showExactAddress: false,
  headerAddress: "Musterstraße 1, 10115 Berlin",
  coldRent: 1200,
  additionalCosts: 180,
  deposit: 2400,
  depositMonths: 2,
  livingArea: 70,
  rooms: 2.5,
  bedrooms: 1,
  availableFrom: "2026-08-01",
  shortDescription: "Ruhige Lage",
  schufaRequired: true,
  incomeProofRequired: false,
  minimumHouseholdNetIncome: 3000,
  suitableForPeopleCount: 2,
  petsPolicy: "BY_ARRANGEMENT",
  smokingPolicy: "NOT_ALLOWED",
  images: [
    {
      id: "image-1",
      secureUrl: "https://example.com/cover.jpg",
      position: 0,
      isCover: true,
    },
    {
      id: "image-2",
      secureUrl: "https://example.com/second.jpg",
      position: 1,
      isCover: false,
    },
  ],
  createdAt: null,
  updatedAt: null,
  publishedAt: null,
};

function renderEditView(onDirtyChange?: (dirty: boolean) => void) {
  const onCancel = vi.fn();
  const onSaved = vi.fn();

  const view = render(
    <ListingEditView
      listing={LISTING}
      onCancel={onCancel}
      onSaved={onSaved}
      {...(onDirtyChange ? { onDirtyChange } : {})}
    />,
  );

  return { ...view, onCancel, onSaved };
}

describe("ListingEditView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(updateListing).mockResolvedValue(undefined);
    vi.mocked(deleteListingImage).mockResolvedValue(undefined);
    vi.mocked(reorderListingImages).mockResolvedValue(undefined);
    vi.mocked(uploadListingImage).mockResolvedValue({
      id: "image-3",
      secureUrl: "https://example.com/third.jpg",
      position: 2,
      isCover: false,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("keeps save disabled on entry and after a field is reverted", async () => {
    const user = userEvent.setup();
    renderEditView();
    const save = screen.getByRole("button", { name: listingEditCopy.save });
    const title = screen.getByRole("textbox", {
      name: listingEditCopy.fields.title,
    });

    expect((save as HTMLButtonElement).disabled).toBe(true);
    await user.clear(title);
    await user.type(title, "Renovierte Wohnung");
    expect((save as HTMLButtonElement).disabled).toBe(false);
    await user.clear(title);
    await user.type(title, LISTING.title);
    expect((save as HTMLButtonElement).disabled).toBe(true);
  });

  it("tracks image order as dirty and clean when restored", async () => {
    renderEditView();
    const save = screen.getByRole("button", { name: listingEditCopy.save });
    const first = screen.getByRole("button", { name: "Bild 1" }).parentElement;
    const second = screen.getByRole("button", { name: "Bild 2" }).parentElement;

    expect(first?.getAttribute("draggable")).toBe("true");
    expect(second?.getAttribute("draggable")).toBe("true");
    fireEvent.dragStart(first!, {
      dataTransfer: { effectAllowed: "", setData: vi.fn() },
    });
    fireEvent.drop(second!, { dataTransfer: { dropEffect: "" } });
    await waitFor(() =>
      expect((save as HTMLButtonElement).disabled).toBe(false),
    );
    await waitFor(() => expect(reorderListingImages).toHaveBeenCalledTimes(1));

    fireEvent.dragStart(second!, {
      dataTransfer: { effectAllowed: "", setData: vi.fn() },
    });
    fireEvent.drop(first!, { dataTransfer: { dropEffect: "" } });
    await waitFor(() => expect(reorderListingImages).toHaveBeenCalledTimes(2));
    await waitFor(() =>
      expect((save as HTMLButtonElement).disabled).toBe(true),
    );
  });

  it("keeps the successfully reordered cover in the saved listing", async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();
    render(
      <ListingEditView
        listing={LISTING}
        onCancel={vi.fn()}
        onSaved={onSaved}
      />,
    );
    const first = screen.getByRole("button", { name: "Bild 1" }).parentElement;
    const second = screen.getByRole("button", { name: "Bild 2" }).parentElement;

    fireEvent.dragStart(first!, {
      dataTransfer: { effectAllowed: "", setData: vi.fn() },
    });
    fireEvent.drop(second!, { dataTransfer: { dropEffect: "" } });
    await waitFor(() => expect(reorderListingImages).toHaveBeenCalledTimes(1));
    expect(reorderListingImages).toHaveBeenLastCalledWith("listing-1", [
      "image-2",
      "image-1",
    ]);
    await user.click(
      screen.getByRole("button", { name: listingEditCopy.save }),
    );

    expect(onSaved).toHaveBeenCalledWith(
      expect.objectContaining({
        images: [LISTING.images[1], LISTING.images[0]],
      }),
    );
  });

  it("keeps added and deleted images synchronized with the saved listing", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:third-image"),
      revokeObjectURL: vi.fn(),
    });
    const { container, onSaved } = renderEditView();
    const fileInput =
      container.querySelector<HTMLInputElement>('input[type="file"]');
    if (!fileInput) throw new Error("Image upload input was not rendered");

    const photo = new File(["image"], "third.jpg", { type: "image/jpeg" });
    fireEvent.change(fileInput, { target: { files: [photo] } });
    await waitFor(() =>
      expect(uploadListingImage).toHaveBeenCalledWith("listing-1", photo),
    );
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Bild 3" })).toBeInstanceOf(
        HTMLElement,
      ),
    );
    await user.click(screen.getByRole("button", { name: "Bild 2 entfernen" }));
    await waitFor(() =>
      expect(deleteListingImage).toHaveBeenCalledWith("listing-1", "image-2"),
    );
    await user.click(
      screen.getByRole("button", { name: listingEditCopy.save }),
    );

    expect(onSaved).toHaveBeenCalledWith(
      expect.objectContaining({
        images: [LISTING.images[0], expect.objectContaining({ id: "image-3" })],
      }),
    );
  });

  it("keeps an image after deletion fails", async () => {
    const user = userEvent.setup();
    vi.mocked(deleteListingImage).mockRejectedValue(new Error("failed"));
    renderEditView();

    await user.click(screen.getByRole("button", { name: "Bild 2 entfernen" }));

    expect(
      await screen.findByText(
        "Das Foto konnte nicht entfernt werden. Bitte erneut versuchen.",
      ),
    ).toBeInstanceOf(HTMLElement);
    expect(
      screen.getByRole("button", { name: "Bild 2 entfernen" }),
    ).toBeInstanceOf(HTMLElement);
  });

  it("restores the previous cover and reports a failed reorder", async () => {
    vi.mocked(reorderListingImages).mockRejectedValue(new Error("failed"));
    renderEditView();
    const first = screen.getByRole("button", { name: "Bild 1" }).parentElement;
    const second = screen.getByRole("button", { name: "Bild 2" }).parentElement;

    fireEvent.dragStart(first!, {
      dataTransfer: { effectAllowed: "", setData: vi.fn() },
    });
    fireEvent.drop(second!, { dataTransfer: { dropEffect: "" } });

    expect(
      await screen.findByText(
        "Die Reihenfolge konnte nicht gespeichert werden.",
      ),
    ).toBeInstanceOf(HTMLElement);
    expect(
      screen
        .getByRole("button", { name: "Bild 1" })
        .querySelector("img")
        ?.getAttribute("src"),
    ).toContain("cover.jpg");
  });

  it("saves changed fields and shows the saved notice", async () => {
    const user = userEvent.setup();
    renderEditView();

    const title = screen.getByRole("textbox", {
      name: listingEditCopy.fields.title,
    });
    fireEvent.change(title, { target: { value: "Renovierte Wohnung" } });
    await user.click(
      screen.getByRole("button", { name: listingEditCopy.save }),
    );

    expect(updateListing).toHaveBeenCalledWith("listing-1", {
      title: "Renovierte Wohnung",
    });
    expect(await screen.findByText(listingEditCopy.savedNotice)).toBeInstanceOf(
      HTMLElement,
    );
  });

  it("shows an error and stays in edit mode when saving fails", async () => {
    const user = userEvent.setup();
    vi.mocked(updateListing).mockRejectedValue(new ApiError(500, "boom"));
    renderEditView();

    const title = screen.getByRole("textbox", {
      name: listingEditCopy.fields.title,
    });
    await user.clear(title);
    await user.type(title, "Renovierte Wohnung");
    await user.click(
      screen.getByRole("button", { name: listingEditCopy.save }),
    );

    expect((await screen.findByRole("alert")).textContent).toBe(
      listingEditCopy.error.save,
    );
    expect(
      screen.getByRole("textbox", { name: listingEditCopy.fields.title }),
    ).toBeInstanceOf(HTMLInputElement);
  });

  it("cancels immediately when there are no changes", async () => {
    const user = userEvent.setup();
    const { onCancel } = renderEditView();

    await user.click(
      screen.getByRole("button", { name: listingEditCopy.cancel }),
    );

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("asks before discarding changed fields", async () => {
    const user = userEvent.setup();
    const { onCancel } = renderEditView();

    const title = screen.getByRole("textbox", {
      name: listingEditCopy.fields.title,
    });
    await user.clear(title);
    await user.type(title, "Renovierte Wohnung");
    await user.click(
      screen.getByRole("button", { name: listingEditCopy.cancel }),
    );

    expect(
      screen.getByRole("dialog", { name: listingEditCopy.discardModal.title }),
    ).toBeInstanceOf(HTMLElement);
    await user.click(
      screen.getByRole("button", {
        name: listingEditCopy.discardModal.secondary,
      }),
    );

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(updateListing).not.toHaveBeenCalled();
  });

  it("updates the address visibility hint when the setting changes", async () => {
    const user = userEvent.setup();
    renderEditView();

    expect(
      screen.getByText(listingEditCopy.fields.showExactAddressHiddenHint),
    ).toBeInstanceOf(HTMLElement);

    await user.click(
      screen.getByRole("checkbox", {
        name: new RegExp(`^${listingEditCopy.fields.showExactAddress}`),
      }),
    );

    expect(
      screen.getByText(listingEditCopy.fields.showExactAddressVisibleHint),
    ).toBeInstanceOf(HTMLElement);
  });
});
