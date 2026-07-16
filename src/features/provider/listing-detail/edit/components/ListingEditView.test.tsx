import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/client";
import { updateListing } from "@/lib/api/listings";
import type { ListingDetail } from "../../types";
import { listingEditCopy } from "../copy";
import { ListingEditView } from "./ListingEditView";

vi.mock("@/lib/api/listings", () => ({
  updateListing: vi.fn(),
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
  smokingPolicy: "NON_SMOKERS_PREFERRED",
  images: [],
  createdAt: null,
  updatedAt: null,
  publishedAt: null,
};

function renderEditView() {
  const onCancel = vi.fn();
  const onSaved = vi.fn();

  render(
    <ListingEditView listing={LISTING} onCancel={onCancel} onSaved={onSaved} />,
  );

  return { onCancel, onSaved };
}

describe("ListingEditView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(updateListing).mockResolvedValue(undefined);
  });

  it("saves changed fields and shows the saved notice", async () => {
    const user = userEvent.setup();
    renderEditView();

    const title = screen.getByRole("textbox", {
      name: listingEditCopy.fields.title,
    });
    await user.clear(title);
    await user.type(title, "Renovierte Wohnung");
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
});
