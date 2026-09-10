import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { invalidateCurrentUser } from "@/lib/api/use-current-user";
import type * as currentUserApi from "@/lib/api/use-current-user";
import { useApplicantProfileStatus } from "../../profile/hooks/useApplicantProfileStatus";
import { saveListing, unsaveListing } from "../api/listing-saved";
import { useListingViewerSession } from "../hooks/useListingViewerSession";
import { useSavedListings } from "../hooks/useSavedListings";
import type { UseSavedListingsResult } from "../hooks/useSavedListings";
import type { PublicListing } from "../types";
import { SavedListingsView } from "./SavedListingsView";

vi.mock("../../profile/hooks/useApplicantProfileStatus", () => ({
  useApplicantProfileStatus: vi.fn(),
}));

vi.mock("../hooks/useSavedListings", () => ({
  useSavedListings: vi.fn(),
}));

vi.mock("../hooks/useListingViewerSession", () => ({
  useListingViewerSession: vi.fn(),
}));

vi.mock("@/lib/api/use-current-user", async (importOriginal) => {
  const actual = await importOriginal<typeof currentUserApi>();
  return {
    ...actual,
    invalidateCurrentUser: vi.fn(),
  };
});

vi.mock("../api/listing-saved", () => ({
  saveListing: vi.fn(),
  unsaveListing: vi.fn(),
}));

const mockUseSavedListings = vi.mocked(useSavedListings);
const mockUseProfileStatus = vi.mocked(useApplicantProfileStatus);
const session = vi.mocked(useListingViewerSession);
const retrySession = vi.mocked(invalidateCurrentUser);

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
    isSaved: true,
    isNew: false,
    coverImageUrl: null,
    publishedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function mockResult(
  overrides: Partial<UseSavedListingsResult> = {},
): UseSavedListingsResult {
  return {
    listings: [],
    total: 0,
    nextCursor: null,
    fetchStatus: "loading-page",
    loadMore: vi.fn(),
    retry: vi.fn(),
    retryMore: vi.fn(),
    removeListing: vi.fn(),
    ...overrides,
  };
}

describe("SavedListingsView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    session.mockReturnValue("applicant");
    mockUseProfileStatus.mockReturnValue("unavailable");
    mockUseSavedListings.mockReturnValue(mockResult());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the saved listings heading", () => {
    render(<SavedListingsView />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Gemerkt" }),
    ).toBeInstanceOf(HTMLHeadingElement);
  });

  it("shows loading skeleton during initial page load", () => {
    mockUseSavedListings.mockReturnValue(
      mockResult({ fetchStatus: "loading-page" }),
    );
    render(<SavedListingsView />);

    expect(screen.getByText("Objekte werden geladen …")).toBeInstanceOf(
      HTMLElement,
    );
  });

  it("renders saved listings when data is loaded", () => {
    mockUseSavedListings.mockReturnValue(
      mockResult({
        fetchStatus: "idle",
        listings: [buildListing({ id: "a", title: "Wohnung A" })],
        total: 1,
      }),
    );

    render(<SavedListingsView />);

    expect(screen.getByText("Wohnung A")).toBeInstanceOf(HTMLElement);
    expect(
      screen.getByRole("list", { name: "Gemerkte Objekte" }),
    ).toBeInstanceOf(HTMLElement);
    expect(screen.getByRole("button", { name: "Gemerkt" })).toBeInstanceOf(
      HTMLButtonElement,
    );
    expect(screen.queryByRole("button", { name: "Merken" })).toBeNull();
  });

  it("shows empty state when there are no saved listings", () => {
    mockUseSavedListings.mockReturnValue(
      mockResult({ fetchStatus: "idle", listings: [], total: 0 }),
    );
    render(<SavedListingsView />);

    expect(screen.getByText("Noch nichts gemerkt")).toBeInstanceOf(HTMLElement);
    expect(
      screen.getByText(
        "Merke interessante Mietobjekte, um sie hier schnell wiederzufinden.",
      ),
    ).toBeInstanceOf(HTMLElement);
    expect(
      screen
        .getByRole("link", { name: "Mietobjekte entdecken" })
        .getAttribute("href"),
    ).toBe("/listings");
  });

  it("does not show the empty state when more saved pages remain", () => {
    mockUseSavedListings.mockReturnValue(
      mockResult({
        fetchStatus: "idle",
        listings: [],
        total: 1,
        nextCursor: "c1",
      }),
    );
    render(<SavedListingsView />);

    expect(screen.queryByText("Noch nichts gemerkt")).toBeNull();
    expect(screen.getByText("Objekte werden geladen …")).toBeInstanceOf(
      HTMLElement,
    );
  });

  it("shows error banner on error-page without mentioning filters", async () => {
    const retry = vi.fn();
    mockUseSavedListings.mockReturnValue(
      mockResult({ fetchStatus: "error-page", retry }),
    );
    render(<SavedListingsView />);

    expect(
      screen.getByText("Gemerkte Objekte konnten nicht geladen werden."),
    ).toBeInstanceOf(HTMLElement);
    expect(screen.queryByText(/Filter/)).toBeNull();

    const user = userEvent.setup();
    await user.click(screen.getByText("Erneut versuchen"));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it("shows load-more button when there are more pages", () => {
    mockUseSavedListings.mockReturnValue(
      mockResult({
        fetchStatus: "idle",
        listings: [buildListing()],
        nextCursor: "c1",
        total: 10,
      }),
    );
    render(<SavedListingsView />);

    expect(screen.getByText("Mehr Objekte anzeigen")).toBeInstanceOf(
      HTMLElement,
    );
  });

  it("loads more when the load-more button is clicked", async () => {
    const loadMore = vi.fn();
    mockUseSavedListings.mockReturnValue(
      mockResult({
        fetchStatus: "idle",
        listings: [buildListing()],
        nextCursor: "c1",
        loadMore,
        total: 10,
      }),
    );

    render(<SavedListingsView />);

    const user = userEvent.setup();
    await user.click(screen.getByText("Mehr Objekte anzeigen"));
    expect(loadMore).toHaveBeenCalledTimes(1);
  });

  it("shows error banner and keeps listings on error-more, calls retryMore on retry", async () => {
    const retryMore = vi.fn();
    mockUseSavedListings.mockReturnValue(
      mockResult({
        fetchStatus: "error-more",
        listings: [buildListing({ id: "a", title: "Wohnung A" })],
        retryMore,
        total: 1,
      }),
    );
    render(<SavedListingsView />);

    expect(screen.getByText("Wohnung A")).toBeInstanceOf(HTMLElement);
    expect(screen.queryByText("Mehr Objekte anzeigen")).toBeNull();
    expect(
      screen.getByText("Gemerkte Objekte konnten nicht geladen werden."),
    ).toBeInstanceOf(HTMLElement);

    const user = userEvent.setup();
    await user.click(screen.getByText("Erneut versuchen"));
    expect(retryMore).toHaveBeenCalledTimes(1);
  });

  it("removes a listing from the saved grid after a successful unsave", async () => {
    const removeListing = vi.fn();
    vi.mocked(unsaveListing).mockResolvedValue({
      saved: false,
      savedAt: null,
    });
    mockUseSavedListings.mockReturnValue(
      mockResult({
        fetchStatus: "idle",
        listings: [buildListing({ id: "a", title: "Wohnung A" })],
        total: 1,
        removeListing,
      }),
    );

    render(<SavedListingsView />);

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Gemerkt" }));

    expect(unsaveListing).toHaveBeenCalledWith("a");
    expect(saveListing).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(removeListing).toHaveBeenCalledWith("a");
    });
  });

  it("shows a recoverable session error without enabling merken or anonymous login", async () => {
    session.mockReturnValue("error");
    mockUseSavedListings.mockReturnValue(
      mockResult({
        fetchStatus: "idle",
        listings: [buildListing({ id: "a", title: "Wohnung A" })],
        total: 1,
      }),
    );

    render(<SavedListingsView />);

    expect(
      screen.getByText(
        "Dein Anmeldestatus konnte nicht geprüft werden. Bitte versuche es erneut.",
      ),
    ).toBeInstanceOf(HTMLElement);
    expect(screen.queryByRole("button", { name: "Gemerkt" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Merken" })).toBeNull();

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Erneut versuchen" }));
    expect(retrySession).toHaveBeenCalledTimes(1);
  });
});
