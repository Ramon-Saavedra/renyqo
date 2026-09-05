import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useApplicantProfileStatus } from "../../profile/hooks/useApplicantProfileStatus";
import { usePublicListings } from "../hooks/usePublicListings";
import type { UsePublicListingsResult } from "../hooks/usePublicListings";
import type { PublicListing } from "../types";
import { ApplicantListingsView } from "./ApplicantListingsView";

vi.mock("../../profile/hooks/useApplicantProfileStatus", () => ({
  useApplicantProfileStatus: vi.fn(),
}));

vi.mock("../hooks/usePublicListings", () => ({
  usePublicListings: vi.fn(),
}));

const mockUsePublicListings = vi.mocked(usePublicListings);
const mockUseProfileStatus = vi.mocked(useApplicantProfileStatus);

function buildListing(overrides: Partial<PublicListing> = {}): PublicListing {
  return {
    id: "l1",
    title: "Testwohnung",
    location: "Berlin, Mitte",
    rooms: 2,
    livingArea: 60,
    availableFrom: null,
    coldRent: 800,
    serviceCharge: 150,
    matchesProfile: null,
    hasApplied: false,
    isNew: false,
    coverImageUrl: null,
    publishedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function mockResult(
  overrides: Partial<UsePublicListingsResult> = {},
): UsePublicListingsResult {
  return {
    listings: [],
    total: 0,
    nextCursor: null,
    fetchStatus: "loading-page",
    loadMore: vi.fn(),
    retry: vi.fn(),
    retryMore: vi.fn(),
    ...overrides,
  };
}

function renderView() {
  return render(<ApplicantListingsView />);
}

describe("ApplicantListingsView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseProfileStatus.mockReturnValue("unavailable");
    mockUsePublicListings.mockReturnValue(mockResult());
  });

  it("renders the hero section", () => {
    renderView();
    expect(screen.getByText("/ listings")).toBeInstanceOf(HTMLElement);
    expect(
      screen.getByText("Wohnungen finden, die wirklich zu dir passen."),
    ).toBeInstanceOf(HTMLElement);
  });

  it("shows loading skeleton during initial page load", () => {
    mockUsePublicListings.mockReturnValue(
      mockResult({ fetchStatus: "loading-page" }),
    );
    renderView();
    expect(screen.getByText("Wohnungen werden geladen …")).toBeInstanceOf(
      HTMLElement,
    );
  });

  it("renders listings when data is loaded", () => {
    mockUsePublicListings.mockReturnValue(
      mockResult({
        fetchStatus: "idle",
        listings: [buildListing({ id: "a", title: "Wohnung A" })],
        total: 1,
      }),
    );
    mockUseProfileStatus.mockReturnValue("exists");

    renderView();

    expect(screen.getByText("Wohnung A")).toBeInstanceOf(HTMLElement);
    expect(screen.getByText("1 Wohnung gefunden")).toBeInstanceOf(HTMLElement);
  });

  it("marks the first three listings with cover images as eager, skips cards without images, keeps later images lazy", () => {
    mockUsePublicListings.mockReturnValue(
      mockResult({
        fetchStatus: "idle",
        listings: [
          buildListing({ id: "c0" }), // no image
          buildListing({
            id: "c1",
            coverImageUrl: "https://res.cloudinary.com/1.jpg",
          }), // image #1 → eager
          buildListing({ id: "c2" }), // no image
          buildListing({
            id: "c3",
            coverImageUrl: "https://res.cloudinary.com/2.jpg",
          }), // image #2 → eager
          buildListing({
            id: "c4",
            coverImageUrl: "https://res.cloudinary.com/3.jpg",
          }), // image #3 → eager
          buildListing({ id: "c5" }), // no image
          buildListing({
            id: "c6",
            coverImageUrl: "https://res.cloudinary.com/4.jpg",
          }), // image #4 → lazy
        ],
        total: 7,
      }),
    );

    renderView();

    const images = document.querySelectorAll<HTMLImageElement>(
      'img[src*="res.cloudinary.com"]',
    );
    expect(images).toHaveLength(4);
    // First three images are eager
    expect(images[0]?.getAttribute("loading")).toBe("eager");
    expect(images[1]?.getAttribute("loading")).toBe("eager");
    expect(images[2]?.getAttribute("loading")).toBe("eager");
    // Fourth image stays lazy
    expect(images[3]?.getAttribute("loading")).toBeNull();
  });

  it("shows empty state when there are no listings", () => {
    mockUsePublicListings.mockReturnValue(
      mockResult({ fetchStatus: "idle", listings: [], total: 0 }),
    );
    renderView();

    expect(screen.getByText("Keine Wohnungen gefunden")).toBeInstanceOf(
      HTMLElement,
    );
  });

  it("shows error banner on error-page and calls retry", async () => {
    const retry = vi.fn();
    mockUsePublicListings.mockReturnValue(
      mockResult({ fetchStatus: "error-page", retry }),
    );
    renderView();

    expect(
      screen.getByText(
        "Wohnungen konnten nicht geladen werden. Deine Filter bleiben erhalten.",
      ),
    ).toBeInstanceOf(HTMLElement);

    const user = userEvent.setup();
    await user.click(screen.getByText("Erneut versuchen"));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it("shows load-more button when there are more pages", () => {
    mockUsePublicListings.mockReturnValue(
      mockResult({
        fetchStatus: "idle",
        listings: [buildListing()],
        nextCursor: "c1",
        total: 10,
      }),
    );
    renderView();

    expect(screen.getByText("Mehr Wohnungen anzeigen")).toBeInstanceOf(
      HTMLElement,
    );
  });

  it("does not show load-more while loading-more is in progress", () => {
    const loadMore = vi.fn();
    mockUsePublicListings.mockReturnValue(
      mockResult({
        fetchStatus: "loading-more",
        listings: [buildListing()],
        nextCursor: "c1",
        loadMore,
        total: 10,
      }),
    );
    renderView();

    expect(screen.queryByText("Mehr Wohnungen anzeigen")).toBeNull();
    expect(screen.getByText("Wohnungen werden geladen …")).toBeInstanceOf(
      HTMLElement,
    );
  });

  it("shows error banner and keeps listings on error-more, calls retryMore on retry", async () => {
    const retryMore = vi.fn();
    mockUsePublicListings.mockReturnValue(
      mockResult({
        fetchStatus: "error-more",
        listings: [buildListing({ id: "a" })],
        retryMore,
        total: 1,
      }),
    );
    renderView();

    // Listings are still rendered.
    expect(screen.getByText("Testwohnung")).toBeInstanceOf(HTMLElement);

    // Error banner is present.
    expect(
      screen.getByText(
        "Wohnungen konnten nicht geladen werden. Deine Filter bleiben erhalten.",
      ),
    ).toBeInstanceOf(HTMLElement);

    const user = userEvent.setup();
    await user.click(screen.getByText("Erneut versuchen"));
    expect(retryMore).toHaveBeenCalledTimes(1);
  });

  it("shows total count in ResultsBar", () => {
    mockUsePublicListings.mockReturnValue(
      mockResult({
        fetchStatus: "idle",
        listings: [buildListing(), buildListing({ id: "b" })],
        total: 42,
      }),
    );
    renderView();

    expect(screen.getByText("42 Wohnungen gefunden")).toBeInstanceOf(
      HTMLElement,
    );
  });

  it("shows MatchBadge only when user has a profile and listing has match info", () => {
    mockUseProfileStatus.mockReturnValue("exists");

    mockUsePublicListings.mockReturnValue(
      mockResult({
        fetchStatus: "idle",
        listings: [
          buildListing({ id: "m", matchesProfile: true }),
          buildListing({ id: "n", matchesProfile: false }),
          buildListing({ id: "u", matchesProfile: null }),
        ],
        total: 3,
      }),
    );

    renderView();

    expect(screen.getByText("Passt")).toBeInstanceOf(HTMLElement);
    expect(screen.getByText("Passt nicht")).toBeInstanceOf(HTMLElement);
    // The third card should NOT show any badge (null means unknown/unavailable).
    const cards = screen.getAllByRole("listitem");
    const thirdCard = cards[2]!;
    expect(within(thirdCard).queryByText("Passt")).toBeNull();
    expect(within(thirdCard).queryByText("Passt nicht")).toBeNull();
  });

  it("shows applied badge from listing hasApplied regardless of profile match", () => {
    mockUseProfileStatus.mockReturnValue("exists");

    mockUsePublicListings.mockReturnValue(
      mockResult({
        fetchStatus: "idle",
        listings: [
          buildListing({
            id: "applied",
            hasApplied: true,
            matchesProfile: true,
          }),
        ],
        total: 1,
      }),
    );

    renderView();

    expect(screen.getByText("Bereits beworben")).toBeInstanceOf(HTMLElement);
    expect(screen.queryByText("Passt")).toBeNull();
  });

  it("does not show match badges when user has no profile", () => {
    mockUseProfileStatus.mockReturnValue("missing");

    mockUsePublicListings.mockReturnValue(
      mockResult({
        fetchStatus: "idle",
        listings: [buildListing({ matchesProfile: true })],
        total: 1,
      }),
    );

    renderView();

    expect(screen.queryByText("Passt")).toBeNull();
    expect(screen.queryByText("Passt nicht")).toBeNull();
  });

  it("loads more when loadMore button is clicked", async () => {
    const loadMore = vi.fn();
    mockUsePublicListings.mockReturnValue(
      mockResult({
        fetchStatus: "idle",
        listings: [buildListing()],
        nextCursor: "c1",
        loadMore,
        total: 10,
      }),
    );

    renderView();

    const user = userEvent.setup();
    await user.click(screen.getByText("Mehr Wohnungen anzeigen"));
    expect(loadMore).toHaveBeenCalledTimes(1);
  });
});
