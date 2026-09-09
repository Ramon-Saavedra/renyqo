import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/client";
import { saveListing, unsaveListing } from "../api/listing-saved";
import { useListingViewerSession } from "../hooks/useListingViewerSession";
import type { PublicListing } from "../types";
import { ListingCard } from "./ListingCard";

vi.mock("../api/listing-saved", () => ({
  saveListing: vi.fn(),
  unsaveListing: vi.fn(),
}));

vi.mock("../hooks/useListingViewerSession", () => ({
  useListingViewerSession: vi.fn(),
}));

const session = vi.mocked(useListingViewerSession);

function buildListing(overrides: Partial<PublicListing> = {}): PublicListing {
  return {
    id: "l1",
    title: "Testwohnung",
    location: "Berlin, Mitte",
    rooms: 3,
    livingArea: 80,
    availableFrom: null,
    coldRent: 1200,
    serviceCharge: 200,
    matchesProfile: null,
    hasApplied: false,
    applicationStatus: null,
    publicReason: null,
    isSaved: false,
    isNew: false,
    coverImageUrl: null,
    publishedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("ListingCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    session.mockReturnValue("applicant");
  });
  it("renders the listing title", () => {
    render(<ListingCard listing={buildListing()} href="/listings/l1" />);
    expect(screen.getByText("Testwohnung")).toBeInstanceOf(HTMLElement);
  });

  it("clamps an oversized title to two lines", () => {
    const title =
      "Sehr langes Inserat mit einem enormen Titel der über zwei Zeilen hinausgeht und abgeschnitten werden soll";
    render(
      <ListingCard listing={buildListing({ title })} href="/listings/l1" />,
    );
    const heading = screen.getByRole("heading", { level: 3, name: title });
    expect(heading.className).toContain("line-clamp-2");
    expect(heading.className).toContain("overflow-hidden");
    expect(heading.className).toContain("break-words");
  });

  it("renders the location", () => {
    render(<ListingCard listing={buildListing()} href="/listings/l1" />);
    expect(screen.getByText("Berlin, Mitte")).toBeInstanceOf(HTMLElement);
  });

  it("renders rooms and area together and availability on its own line", () => {
    render(
      <ListingCard
        listing={buildListing({
          rooms: 3,
          livingArea: 80,
          availableFrom: "2026-09-01",
        })}
        href="/listings/l1"
      />,
    );

    const rooms = screen.getByText("3 Zimmer");
    const area = screen.getByText(/80 m²/);
    const available = screen.getByText("ab 01.09.2026");
    expect(rooms).toBeInstanceOf(HTMLElement);
    expect(area).toBeInstanceOf(HTMLElement);
    expect(available).toBeInstanceOf(HTMLElement);
    expect(available.className).toContain("basis-full");
    expect(`${rooms.textContent ?? ""}${area.textContent ?? ""}`.trim()).toBe(
      "3 Zimmer · 80 m²",
    );
  });

  it("keeps each metadata item indivisible and wraps only between items", () => {
    render(
      <ListingCard
        listing={buildListing({
          rooms: 4.5,
          livingArea: 22222,
          availableFrom: "2026-08-23",
        })}
        href="/listings/l1"
      />,
    );

    const rooms = screen.getByText("4,5 Zimmer");
    const area = screen.getByText(/22\.222 m²/);
    const available = screen.getByText("ab 23.08.2026");

    expect(rooms.className).toContain("whitespace-nowrap");
    expect(area.className).toContain("whitespace-nowrap");
    expect(available.className).toContain("whitespace-nowrap");
    expect(available.className).toContain("basis-full");
    expect(rooms.parentElement?.className).toContain("flex-wrap");
    expect(rooms.parentElement?.className).not.toContain("flex-nowrap");
  });

  it("renders rent and service charge", () => {
    render(
      <ListingCard
        listing={buildListing({ coldRent: 1200, serviceCharge: 200 })}
        href="/listings/l1"
      />,
    );
    expect(screen.getByText(/1\.200\s*€/)).toBeInstanceOf(HTMLElement);
    expect(screen.getByText("Kaltmiete")).toBeInstanceOf(HTMLElement);
    const serviceCharge = screen.getByText(/\+ 200\s*€ NK/);
    expect(serviceCharge).toBeInstanceOf(HTMLElement);
    expect(serviceCharge.className).toContain("basis-full");
  });

  it("renders the image when coverImageUrl is provided", () => {
    render(
      <ListingCard
        listing={buildListing({
          coverImageUrl: "https://res.cloudinary.com/img.jpg",
        })}
        href="/listings/l1"
      />,
    );
    const img = document.querySelector('img[src*="res.cloudinary.com"]');
    expect(img).not.toBeNull();
  });

  it("shows fallback when no image is available", () => {
    render(
      <ListingCard
        listing={buildListing({ coverImageUrl: null })}
        href="/listings/l1"
      />,
    );
    expect(screen.getByText("Kein Foto vorhanden")).toBeInstanceOf(HTMLElement);
    expect(
      screen.getByText("Kein Foto vorhanden").closest(".bg-media-placeholder"),
    ).toBeInstanceOf(HTMLDivElement);
  });

  it("shows the 'Neu' badge when isNew is true", () => {
    render(
      <ListingCard
        listing={buildListing({ isNew: true })}
        href="/listings/l1"
      />,
    );
    expect(screen.getByText("Neu")).toBeInstanceOf(HTMLElement);
  });

  it("does not show the 'Neu' badge when isNew is false", () => {
    render(
      <ListingCard
        listing={buildListing({ isNew: false })}
        href="/listings/l1"
      />,
    );
    expect(screen.queryByText("Neu")).toBeNull();
  });

  it("shows 'Passt' badge when matchesProfile is true and showMatch is true", () => {
    render(
      <ListingCard
        listing={buildListing({ matchesProfile: true })}
        href="/listings/l1"
        showMatch
      />,
    );
    expect(screen.getByText("Passt")).toBeInstanceOf(HTMLElement);
  });

  it("shows 'Passt nicht' badge when matchesProfile is false and showMatch is true", () => {
    render(
      <ListingCard
        listing={buildListing({ matchesProfile: false })}
        href="/listings/l1"
        showMatch
      />,
    );
    expect(screen.getByText("Passt nicht")).toBeInstanceOf(HTMLElement);
  });

  it("shows 'Bereits beworben' for ACTIVE and hides Passt", () => {
    render(
      <ListingCard
        listing={buildListing({
          applicationStatus: "ACTIVE",
          matchesProfile: true,
        })}
        href="/listings/l1"
        showMatch
      />,
    );
    expect(screen.getByText("Bereits beworben")).toBeInstanceOf(HTMLElement);
    expect(screen.queryByText("Passt")).toBeNull();
  });

  it("does not treat hasApplied alone as an applied badge", () => {
    render(
      <ListingCard
        listing={buildListing({
          hasApplied: true,
          applicationStatus: null,
          matchesProfile: true,
        })}
        href="/listings/l1"
        showMatch
      />,
    );
    expect(screen.queryByText("Bereits beworben")).toBeNull();
    expect(screen.getByText("Passt")).toBeInstanceOf(HTMLElement);
  });

  it("prefers applied badge over match badge when both would apply", () => {
    render(
      <ListingCard
        listing={buildListing({
          applicationStatus: "WAITING",
          matchesProfile: false,
        })}
        href="/listings/l1"
        showMatch
      />,
    );
    expect(screen.getByText("Bereits beworben")).toBeInstanceOf(HTMLElement);
    expect(screen.queryByText("Passt nicht")).toBeNull();
  });

  it("does not show match badges when showMatch is false", () => {
    render(
      <ListingCard
        listing={buildListing({ matchesProfile: true })}
        href="/listings/l1"
        showMatch={false}
      />,
    );
    expect(screen.queryByText("Passt")).toBeNull();
    expect(screen.queryByText("Passt nicht")).toBeNull();
  });

  it("still shows applied badge when showMatch is false", () => {
    render(
      <ListingCard
        listing={buildListing({
          applicationStatus: "ACTIVE",
          matchesProfile: true,
        })}
        href="/listings/l1"
        showMatch={false}
      />,
    );
    expect(screen.getByText("Bereits beworben")).toBeInstanceOf(HTMLElement);
    expect(screen.queryByText("Passt")).toBeNull();
  });

  it("shows Nicht ausgewählt over Passt for REJECTED and NOT_SELECTED", () => {
    render(
      <ListingCard
        listing={buildListing({
          applicationStatus: "REJECTED",
          publicReason: "NOT_SELECTED",
          matchesProfile: true,
        })}
        href="/listings/l1"
        showMatch
      />,
    );
    expect(screen.getByText("Nicht ausgewählt")).toBeInstanceOf(HTMLElement);
    expect(screen.queryByText("Passt")).toBeNull();
    expect(screen.queryByText("Bereits beworben")).toBeNull();
  });

  it("keeps Bereits beworben for REJECTED reasons without dedicated copy", () => {
    render(
      <ListingCard
        listing={buildListing({
          applicationStatus: "REJECTED",
          publicReason: "LISTING_RENTED",
          matchesProfile: true,
        })}
        href="/listings/l1"
        showMatch
      />,
    );
    expect(screen.getByText("Bereits beworben")).toBeInstanceOf(HTMLElement);
    expect(screen.queryByText("Passt")).toBeNull();
    expect(screen.queryByText("Nicht ausgewählt")).toBeNull();
  });

  it("does not show match badges when matchesProfile is null", () => {
    render(
      <ListingCard
        listing={buildListing({ matchesProfile: null })}
        href="/listings/l1"
        showMatch
      />,
    );
    expect(screen.queryByText("Passt")).toBeNull();
    expect(screen.queryByText("Passt nicht")).toBeNull();
  });

  it("sets eager loading on the image when eager is true", () => {
    render(
      <ListingCard
        listing={buildListing({
          coverImageUrl: "https://res.cloudinary.com/img.jpg",
        })}
        href="/listings/l1"
        eager
      />,
    );
    const img = document.querySelector<HTMLImageElement>(
      'img[src*="res.cloudinary.com"]',
    );
    expect(img?.getAttribute("loading")).toBe("eager");
  });

  it("does not set loading attribute when eager is false", () => {
    render(
      <ListingCard
        listing={buildListing({
          coverImageUrl: "https://res.cloudinary.com/img.jpg",
        })}
        href="/listings/l1"
        eager={false}
      />,
    );
    const img = document.querySelector<HTMLImageElement>(
      'img[src*="res.cloudinary.com"]',
    );
    expect(img?.getAttribute("loading")).toBeNull();
  });

  it("links to the correct href", () => {
    render(<ListingCard listing={buildListing()} href="/listings/l1" />);
    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toBe("/listings/l1");
  });

  it("renders Merken when the listing is not saved", () => {
    render(
      <ListingCard
        listing={buildListing({ isSaved: false })}
        href="/listings/l1"
      />,
    );
    expect(screen.getByRole("button", { name: "Merken" })).toBeInstanceOf(
      HTMLButtonElement,
    );
    expect(screen.queryByRole("button", { name: "Gemerkt" })).toBeNull();
  });

  it("renders Gemerkt when the listing is saved", () => {
    render(
      <ListingCard
        listing={buildListing({ isSaved: true })}
        href="/listings/l1"
      />,
    );
    expect(screen.getByRole("button", { name: "Gemerkt" })).toBeInstanceOf(
      HTMLButtonElement,
    );
    expect(screen.queryByRole("button", { name: "Merken" })).toBeNull();
  });

  it("saves from the card without duplicating API logic", async () => {
    vi.mocked(saveListing).mockResolvedValue({
      saved: true,
      savedAt: "2026-09-05T12:00:00.000Z",
    });
    render(
      <ListingCard
        listing={buildListing({ isSaved: false })}
        href="/listings/l1"
      />,
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Merken" }));

    expect(saveListing).toHaveBeenCalledWith("l1");
    expect(unsaveListing).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Gemerkt" })).toBeInstanceOf(
      HTMLButtonElement,
    );
  });

  it("keeps save errors inside the card bounds", async () => {
    vi.mocked(saveListing).mockRejectedValue(new ApiError(401, "fail"));
    render(
      <ListingCard
        listing={buildListing({ isSaved: false })}
        href="/listings/l1"
      />,
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Merken" }));

    const alert = screen.getByRole("alert");
    expect(alert.textContent).toBe(
      "Bitte melde dich an, um dieses Objekt zu merken.",
    );
    expect(alert.className).toContain("max-w-full");
    expect(alert.className).toContain("break-words");
    expect(alert.className).toContain("pointer-events-auto");
    expect(alert.parentElement?.className).toContain("inset-x-2");
    expect(alert.parentElement?.className).toContain("pointer-events-none");
  });

  it("does not let the save overlay intercept listing navigation", () => {
    render(
      <ListingCard
        listing={buildListing({ isSaved: false, isNew: true })}
        href="/listings/l1"
      />,
    );

    const saveButton = screen.getByRole("button", { name: "Merken" });
    expect(saveButton.className).toContain("pointer-events-auto");
    expect(saveButton.parentElement?.className).toContain(
      "pointer-events-none",
    );
    expect(screen.getByRole("link").getAttribute("href")).toBe("/listings/l1");
    expect(screen.getByText("Neu")).toBeInstanceOf(HTMLElement);
  });

  it("guides anonymous users to login from the card without saving", async () => {
    session.mockReturnValue("anonymous");
    render(
      <ListingCard
        listing={buildListing({ isSaved: false })}
        href="/listings/l1"
      />,
    );

    const saveLink = screen.getByRole("link", { name: "Merken" });
    expect(saveLink.getAttribute("href")).toBe("/login");
    expect(saveLink.className).toContain("pointer-events-auto");

    const user = userEvent.setup();
    await user.click(saveLink);

    expect(saveListing).not.toHaveBeenCalled();
    expect(unsaveListing).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Merken" })).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
