import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { PublicListing } from "../types";
import { ListingCard } from "./ListingCard";

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
    isNew: false,
    coverImageUrl: null,
    publishedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("ListingCard", () => {
  it("renders the listing title", () => {
    render(
      <ListingCard listing={buildListing()} href="/listings/l1" />,
    );
    expect(screen.getByText("Testwohnung")).toBeInstanceOf(HTMLElement);
  });

  it("renders the location", () => {
    render(
      <ListingCard listing={buildListing()} href="/listings/l1" />,
    );
    expect(screen.getByText("Berlin, Mitte")).toBeInstanceOf(HTMLElement);
  });

  it("renders room count, area, and availability", () => {
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
    expect(screen.getByText("3 Zimmer")).toBeInstanceOf(HTMLElement);
    expect(screen.getByText("80 m²")).toBeInstanceOf(HTMLElement);
    expect(screen.getByText("ab 01.09.2026")).toBeInstanceOf(HTMLElement);
  });

  it("renders rent and service charge", () => {
    render(
      <ListingCard
        listing={buildListing({ coldRent: 1200, serviceCharge: 200 })}
        href="/listings/l1"
      />,
    );
    expect(screen.getByText(/1\.200\s*€/)).toBeInstanceOf(HTMLElement);
    expect(screen.getByText(/\+ 200\s*€ NK/)).toBeInstanceOf(HTMLElement);
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
    const img = document.querySelector(
      'img[src*="res.cloudinary.com"]',
    );
    expect(img).not.toBeNull();
  });

  it("shows fallback when no image is available", () => {
    render(
      <ListingCard
        listing={buildListing({ coverImageUrl: null })}
        href="/listings/l1"
      />,
    );
    expect(screen.getByText("Kein Foto vorhanden")).toBeInstanceOf(
      HTMLElement,
    );
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
    render(
      <ListingCard listing={buildListing()} href="/listings/l1" />,
    );
    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toBe("/listings/l1");
  });
});
