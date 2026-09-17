import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ListingDetail } from "../types";
import type * as ListingsApi from "@/lib/api/listings";
import { getProviderListing } from "../api/provider-listing-detail";
import { deleteListingImage } from "@/lib/api/listings";
import { listingEditCopy } from "../edit/copy";
import { ListingDetailView } from "./ListingDetailView";

const { routerPush } = vi.hoisted(() => ({ routerPush: vi.fn() }));

vi.mock("../api/provider-listing-detail", () => ({
  archiveProviderListing: vi.fn(),
  getProviderListing: vi.fn(),
  moveProviderListingToDraft: vi.fn(),
  publishProviderListing: vi.fn(),
}));

vi.mock("@/lib/api/listings", async (importOriginal) => {
  const actual = await importOriginal<typeof ListingsApi>();
  return {
    ...actual,
    deleteListingImage: vi.fn(),
    reorderListingImages: vi.fn(),
    updateListing: vi.fn(),
    uploadListingImage: vi.fn(),
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: routerPush }),
}));

vi.mock("@/lib/api/auth", () => ({
  getCurrentUser: vi.fn().mockResolvedValue({
    id: "provider-1",
    name: "Mara Lehmann",
    email: "mara@example.com",
    role: "provider",
    providerType: "company",
    companyName: "Lehmann Wohnen",
  }),
  logout: vi.fn(),
}));

const BASE: ListingDetail = {
  id: "listing-1",
  title: "Wohnung in Berlin",
  status: "draft",
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
  shortDescription: "Helle Wohnung",
  schufaRequired: true,
  incomeProofRequired: false,
  minimumHouseholdNetIncome: 3000,
  suitableForPeopleCount: 2,
  petsPolicy: "BY_ARRANGEMENT",
  smokingPolicy: "NOT_ALLOWED",
  images: [],
  createdAt: "2026-07-01T10:00:00.000Z",
  updatedAt: "2026-07-02T10:00:00.000Z",
  publishedAt: null,
};

describe("ListingDetailView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getProviderListing).mockResolvedValue(BASE);
    vi.mocked(deleteListingImage).mockResolvedValue(undefined);
  });

  it("enters edit mode from the listing detail", async () => {
    const user = userEvent.setup();
    render(<ListingDetailView listingId="listing-1" />);

    await screen.findByRole("heading", { name: "Wohnung in Berlin" });
    await user.click(screen.getByRole("button", { name: "Bearbeiten" }));

    expect(
      await screen.findByRole("textbox", { name: "Objekttitel" }),
    ).toBeInstanceOf(HTMLInputElement);
    expect(
      screen
        .getByRole("button", { name: "Speichern" })
        .closest("[class*='sticky']")?.className,
    ).toContain("sticky top-provider-topbar z-20");
  });

  it("blocks detail exits while an image deletion is pending", async () => {
    const user = userEvent.setup();
    let resolveDeletion: (value: void) => void = () => undefined;
    const deletion = new Promise<void>((resolve) => {
      resolveDeletion = resolve;
    });
    vi.mocked(getProviderListing).mockResolvedValue({
      ...BASE,
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
    });
    vi.mocked(deleteListingImage).mockReturnValue(deletion);
    render(<ListingDetailView listingId="listing-1" />);

    await screen.findByRole("heading", { name: "Wohnung in Berlin" });
    await user.click(screen.getByRole("button", { name: "Bearbeiten" }));
    await user.click(screen.getByRole("button", { name: "Bild 2 entfernen" }));

    const cancel = screen.getByRole("button", { name: listingEditCopy.cancel });
    await waitFor(() =>
      expect((cancel as HTMLButtonElement).disabled).toBe(true),
    );
    await user.click(
      screen.getByRole("button", { name: "Zurück zum Dashboard" }),
    );

    const dashboardLink = document.createElement("a");
    dashboardLink.href = "/provider/dashboard";
    document.body.append(dashboardLink);
    const navigationWasPrevented = fireEvent.click(dashboardLink);
    dashboardLink.remove();

    expect(navigationWasPrevented).toBe(false);
    expect(routerPush).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).toBeNull();

    const header = document.createElement("header");
    const accountDialog = document.createElement("div");
    accountDialog.setAttribute("role", "dialog");
    const logoutButton = document.createElement("button");
    accountDialog.append(logoutButton);
    header.append(accountDialog);
    document.body.append(header);
    const logoutWasPrevented = fireEvent.click(logoutButton);
    header.remove();
    expect(logoutWasPrevented).toBe(false);

    const currentUrl = window.location.href;
    window.history.replaceState(
      { route: "previous" },
      "",
      "/provider/listings",
    );
    fireEvent.popState(window, { state: { route: "previous" } });
    expect(window.location.href).toBe(currentUrl);
    expect((cancel as HTMLButtonElement).disabled).toBe(true);

    resolveDeletion(undefined);
    await waitFor(() =>
      expect((cancel as HTMLButtonElement).disabled).toBe(false),
    );
  });
});
