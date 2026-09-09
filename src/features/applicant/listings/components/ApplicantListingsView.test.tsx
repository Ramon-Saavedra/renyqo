import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useApplicantProfileStatus } from "../../profile/hooks/useApplicantProfileStatus";
import { usePublicListings } from "../hooks/usePublicListings";
import type { UsePublicListingsResult } from "../hooks/usePublicListings";
import type { PublicListing } from "../types";
import { LISTINGS_SEARCH_QUERY_MAX_LENGTH } from "../utils/listings-search-params";
import { ApplicantListingsView } from "./ApplicantListingsView";

vi.mock("../../profile/hooks/useApplicantProfileStatus", () => ({
  useApplicantProfileStatus: vi.fn(),
}));

vi.mock("../hooks/usePublicListings", () => ({
  usePublicListings: vi.fn(),
}));

const replace = vi.fn();
let searchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn(), back: vi.fn() }),
  useSearchParams: () => searchParams,
  usePathname: () => "/listings",
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
    applicationStatus: null,
    publicReason: null,
    isSaved: false,
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

function buildMatchMedia(reduce: boolean): typeof window.matchMedia {
  return vi.fn().mockImplementation(
    (query: string) =>
      ({
        matches: query.includes("reduce") ? reduce : false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }) as MediaQueryList,
  );
}

describe("ApplicantListingsView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchParams = new URLSearchParams();
    window.matchMedia = buildMatchMedia(true);
    mockUseProfileStatus.mockReturnValue("unavailable");
    mockUsePublicListings.mockReturnValue(mockResult());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the hero section", () => {
    renderView();
    expect(screen.queryByText("/ listings")).toBeNull();
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Mietobjekte finden, die wirklich zu dir passen.",
      }),
    ).toBeInstanceOf(HTMLHeadingElement);
  });

  it("shows loading skeleton during initial page load", () => {
    mockUsePublicListings.mockReturnValue(
      mockResult({ fetchStatus: "loading-page" }),
    );
    renderView();
    expect(screen.getByText("Objekte werden geladen …")).toBeInstanceOf(
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
    expect(screen.getByText("1 Objekt gefunden")).toBeInstanceOf(HTMLElement);
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

    expect(screen.getByText("Keine Objekte gefunden")).toBeInstanceOf(
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
        "Objekte konnten nicht geladen werden. Deine Filter bleiben erhalten.",
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

    expect(screen.getByText("Mehr Objekte anzeigen")).toBeInstanceOf(
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

    expect(screen.queryByText("Mehr Objekte anzeigen")).toBeNull();
    expect(screen.getByText("Objekte werden geladen …")).toBeInstanceOf(
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
        "Objekte konnten nicht geladen werden. Deine Filter bleiben erhalten.",
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

    expect(screen.getByText("42 Objekte gefunden")).toBeInstanceOf(HTMLElement);
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

  it("shows applied badge from listing applicationStatus regardless of profile match", () => {
    mockUseProfileStatus.mockReturnValue("exists");

    mockUsePublicListings.mockReturnValue(
      mockResult({
        fetchStatus: "idle",
        listings: [
          buildListing({
            id: "applied",
            applicationStatus: "ACTIVE",
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
    await user.click(screen.getByText("Mehr Objekte anzeigen"));
    expect(loadMore).toHaveBeenCalledTimes(1);
  });

  it("restores search, matching, and sort from the URL", () => {
    searchParams = new URLSearchParams(
      "query=Freiburg&onlyMatching=1&sort=price-asc",
    );
    mockUseProfileStatus.mockReturnValue("exists");
    mockUsePublicListings.mockReturnValue(
      mockResult({ fetchStatus: "idle", listings: [buildListing()], total: 1 }),
    );

    renderView();

    expect(screen.getByDisplayValue("Freiburg")).toBeInstanceOf(
      HTMLInputElement,
    );
    expect(mockUsePublicListings).toHaveBeenCalledWith(
      expect.objectContaining({
        query: "Freiburg",
        onlyMatching: true,
      }),
      "price-asc",
      true,
    );
  });

  it("writes the search query to the URL", async () => {
    mockUsePublicListings.mockReturnValue(
      mockResult({ fetchStatus: "idle", listings: [buildListing()], total: 1 }),
    );
    renderView();

    const user = userEvent.setup();
    await user.type(
      screen.getByRole("searchbox", { name: "Objekte nach Ort durchsuchen" }),
      "F",
    );

    expect(replace).toHaveBeenCalledWith("/listings?query=F", {
      scroll: false,
    });
  });

  it("applies a cleared listings URL without unmounting the view", () => {
    searchParams = new URLSearchParams("query=Freiburg&maxRent=1300");
    mockUsePublicListings.mockReturnValue(
      mockResult({ fetchStatus: "idle", listings: [buildListing()], total: 1 }),
    );

    const { rerender } = renderView();

    expect(mockUsePublicListings).toHaveBeenCalledWith(
      expect.objectContaining({
        query: "Freiburg",
        maxColdRent: 1300,
      }),
      "newest",
      false,
    );

    searchParams = new URLSearchParams();
    rerender(<ApplicantListingsView />);

    expect(mockUsePublicListings).toHaveBeenLastCalledWith(
      expect.objectContaining({
        query: "",
        maxColdRent: null,
      }),
      "newest",
      false,
    );
  });

  it("limits the search field to the listings query max length", () => {
    renderView();
    expect(
      screen
        .getByRole("searchbox", { name: "Objekte nach Ort durchsuchen" })
        .getAttribute("maxlength"),
    ).toBe(String(LISTINGS_SEARCH_QUERY_MAX_LENGTH));
  });
});
