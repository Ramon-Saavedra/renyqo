import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { listingsCopy } from "../copy/listings";
import { ListingsSearchConsoleSkeleton } from "./ListingsSearchConsoleSkeleton";

describe("ListingsSearchConsoleSkeleton", () => {
  it("includes the search/filter controls from the listings console", () => {
    render(<ListingsSearchConsoleSkeleton />);

    for (const label of [
      listingsCopy.filters.coldRent,
      listingsCopy.filters.rooms,
      listingsCopy.filters.livingArea,
      listingsCopy.filters.availableFrom,
      listingsCopy.console.onlyMatching,
    ]) {
      expect(screen.getByText(label)).toBeInstanceOf(HTMLElement);
    }
  });

  it("keeps desktop-only filters on the same breakpoint as the real console", () => {
    render(<ListingsSearchConsoleSkeleton />);

    const livingArea = screen.getByText(listingsCopy.filters.livingArea);
    const availability = screen.getByText(listingsCopy.filters.availableFrom);

    expect(livingArea.className).toContain("hidden xl:inline-flex");
    expect(availability.className).toContain("hidden xl:inline-flex");
  });
});
