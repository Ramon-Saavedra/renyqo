import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePublicListingDetail } from "@/features/applicant/listings/hooks/usePublicListingDetail";
import type { UsePublicListingDetailResult } from "@/features/applicant/listings/hooks/usePublicListingDetail";
import type { PublicListingDetail } from "@/features/applicant/listings/types";
import ListingDetailPage from "./page";

vi.mock("@/features/applicant/listings/hooks/usePublicListingDetail", () => ({
  usePublicListingDetail: vi.fn(),
}));

vi.mock("@/components/layout/app-topbar/AppTopbar", () => ({
  AppTopbar: ({ children }: { children?: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock(
  "@/features/applicant/navigation/components/ListingsTopbarActions",
  () => ({ ListingsTopbarActions: () => null }),
);

vi.mock("next/navigation", () => ({
  useParams: vi.fn().mockReturnValue({ id: "abc-123" }),
}));

const mockUseDetail = vi.mocked(usePublicListingDetail);

function mockListing(
  overrides: Partial<PublicListingDetail> = {},
): PublicListingDetail {
  return {
    id: "abc-123",
    title: "Zimmer in Berlin",
    location: "Berlin, Mitte",
    rooms: 2,
    livingArea: 58,
    availableFrom: "2026-09-01",
    coldRent: 620,
    additionalCosts: 80,
    matchesProfile: "match",
    isNew: false,
    publishedAt: "2026-08-01",
    street: null,
    zip: "10435",
    city: "Berlin",
    district: "Mitte",
    objectType: "APARTMENT",
    bedrooms: 1,
    deposit: null,
    depositMonths: null,
    shortDescription: "Helle Wohnung im vierten Stock.",
    images: [],
    minimumHouseholdNetIncome: 1860,
    schufaRequired: true,
    incomeProofRequired: true,
    suitableForPeopleCount: 2,
    petsPolicy: "NOT_ALLOWED",
    smokingPolicy: "NON_SMOKERS_PREFERRED",
    ...overrides,
  };
}

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
    expect(screen.getByLabelText("Objekt wird geladen")).toBeInstanceOf(
      HTMLElement,
    );
  });

  it("renders title, public location, price and facts when loaded", () => {
    mockUseDetail.mockReturnValue(
      mockResult({ status: "loaded", listing: mockListing() }),
    );
    render(<ListingDetailPage />);

    expect(screen.getByText("Zimmer in Berlin")).toBeInstanceOf(HTMLElement);
    expect(screen.getByText("Berlin, Mitte")).toBeInstanceOf(HTMLElement);
    expect(screen.queryByText("Kastanienallee 12")).toBeNull();
    expect(screen.getByText(/620/)).toBeInstanceOf(HTMLElement);
    expect(screen.getByText("Wohnung")).toBeInstanceOf(HTMLElement);
    expect(screen.getByText("58 m²")).toBeInstanceOf(HTMLElement);
  });

  it("renders the exact address only when the backend provides street", () => {
    mockUseDetail.mockReturnValue(
      mockResult({
        status: "loaded",
        listing: mockListing({ street: "Kastanienallee 12" }),
      }),
    );
    render(<ListingDetailPage />);

    expect(screen.getByText("Kastanienallee 12, Berlin, Mitte")).toBeInstanceOf(
      HTMLElement,
    );
  });

  it.each([
    ["match", "Passt zu deinem Profil"],
    ["no-match", "Passt nicht zu deinem Profil"],
    ["incomplete", "Profil unvollständig"],
    ["unknown", "Eignung unbekannt"],
  ] as const)(
    "renders the confirmed profile match state %s",
    (state, label) => {
      mockUseDetail.mockReturnValue(
        mockResult({
          status: "loaded",
          listing: mockListing({ matchesProfile: state }),
        }),
      );
      render(<ListingDetailPage />);

      expect(screen.getByText(label)).toBeInstanceOf(HTMLElement);
      expect(
        (screen.getByRole("button", { name: "Bewerben" }) as HTMLButtonElement)
          .disabled,
      ).toBe(true);
    },
  );

  it("renders the requirement rows that the backend provided", () => {
    mockUseDetail.mockReturnValue(
      mockResult({ status: "loaded", listing: mockListing() }),
    );
    render(<ListingDetailPage />);

    expect(screen.getByText("Mindesteinkommen (netto)")).toBeInstanceOf(
      HTMLElement,
    );
    expect(screen.getByText("1–2 Personen")).toBeInstanceOf(HTMLElement);
    expect(screen.getAllByText("Nicht erlaubt")).toHaveLength(2);
  });

  it("renders required boolean requirements when optional requirements are null", () => {
    mockUseDetail.mockReturnValue(
      mockResult({
        status: "loaded",
        listing: mockListing({
          minimumHouseholdNetIncome: null,
          schufaRequired: false,
          incomeProofRequired: false,
          suitableForPeopleCount: null,
          petsPolicy: null,
          smokingPolicy: null,
        }),
      }),
    );
    render(<ListingDetailPage />);

    expect(screen.getByText("SCHUFA")).toBeInstanceOf(HTMLElement);
    expect(screen.getByText("Einkommensnachweis")).toBeInstanceOf(HTMLElement);
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
    expect(screen.getByText("Zurück zur Suche").getAttribute("href")).toBe(
      "/listings",
    );
  });

  it("renders the error state with back link", () => {
    mockUseDetail.mockReturnValue(
      mockResult({ status: "error", error: "Serverfehler" }),
    );
    render(<ListingDetailPage />);

    expect(screen.getByText("Serverfehler")).toBeInstanceOf(HTMLElement);
    expect(screen.getByText("Zurück zur Suche").getAttribute("href")).toBe(
      "/listings",
    );
  });
});
