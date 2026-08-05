import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePublicListingDetail } from "@/features/applicant/listings/hooks/usePublicListingDetail";
import type { UsePublicListingDetailResult } from "@/features/applicant/listings/hooks/usePublicListingDetail";
import type { PublicListing } from "@/features/applicant/listings/types";
import ListingDetailPage from "./page";

vi.mock("@/features/applicant/listings/hooks/usePublicListingDetail", () => ({
  usePublicListingDetail: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useParams: vi.fn().mockReturnValue({ id: "abc-123" }),
}));

const mockUseDetail = vi.mocked(usePublicListingDetail);

function mockResult(
  overrides: Partial<UsePublicListingDetailResult> = {},
): UsePublicListingDetailResult {
  return {
    listing: null,
    error: null,
    status: "loading",
    ...overrides,
  };
}

describe("ListingDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the loading state", () => {
    mockUseDetail.mockReturnValue(mockResult({ status: "loading" }));
    render(<ListingDetailPage />);
    expect(screen.getByText("Objekt wird geladen …")).toBeInstanceOf(
      HTMLElement,
    );
  });

  it("renders the loaded state with the listing title", () => {
    mockUseDetail.mockReturnValue(
      mockResult({
        status: "loaded",
        listing: { id: "a", title: "Zimmer in Berlin" } as PublicListing,
      }),
    );
    render(<ListingDetailPage />);
    expect(screen.getByText("Zimmer in Berlin")).toBeInstanceOf(HTMLElement);
  });

  it("renders the not-found state with back link", () => {
    mockUseDetail.mockReturnValue(mockResult({ status: "not-found" }));
    render(<ListingDetailPage />);
    expect(screen.getByText("Objekt nicht gefunden")).toBeInstanceOf(
      HTMLElement,
    );
    expect(
      screen.getByText("Dieses Objekt existiert nicht oder wurde entfernt."),
    ).toBeInstanceOf(HTMLElement);
    const link = screen.getByText("Zurück zur Suche");
    expect(link.getAttribute("href")).toBe("/listings");
  });

  it("renders the error state with back link", () => {
    mockUseDetail.mockReturnValue(
      mockResult({
        status: "error",
        error: "Serverfehler",
      }),
    );
    render(<ListingDetailPage />);
    expect(screen.getByText("Serverfehler")).toBeInstanceOf(HTMLElement);
    const link = screen.getByText("Zurück zur Suche");
    expect(link.getAttribute("href")).toBe("/listings");
  });
});
