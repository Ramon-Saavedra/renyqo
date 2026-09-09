import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getApplicantApplications } from "@/features/applicant/listings/api/applicant-applications";
import { getListingEligibility } from "@/features/applicant/listings/api/listing-eligibility";
import { reportListing } from "@/features/applicant/listings/api/listing-report";
import type * as listingReportApi from "@/features/applicant/listings/api/listing-report";
import {
  saveListing,
  unsaveListing,
} from "@/features/applicant/listings/api/listing-saved";
import { usePublicListingDetail } from "@/features/applicant/listings/hooks/usePublicListingDetail";
import type { UsePublicListingDetailResult } from "@/features/applicant/listings/hooks/usePublicListingDetail";
import type { PublicListingDetail } from "@/features/applicant/listings/types";
import { LISTINGS_SEARCH_SESSION_KEY } from "@/features/applicant/listings/utils/listings-search-params";
import type { SafeUser } from "@/lib/api/auth";
import { useCurrentUser } from "@/lib/api/use-current-user";
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

vi.mock("@/lib/api/use-current-user", () => ({
  useCurrentUser: vi.fn(),
}));

vi.mock("@/features/applicant/listings/api/listing-eligibility", () => ({
  getListingEligibility: vi.fn(),
}));

vi.mock("@/features/applicant/listings/api/applicant-applications", () => ({
  getApplicantApplications: vi.fn(),
}));

vi.mock("@/features/applicant/listings/api/listing-saved", () => ({
  saveListing: vi.fn(),
  unsaveListing: vi.fn(),
}));

vi.mock(
  "@/features/applicant/listings/api/listing-report",
  async (importOriginal) => {
    const actual = await importOriginal<typeof listingReportApi>();
    return {
      ...actual,
      reportListing: vi.fn(),
    };
  },
);

const mockUseDetail = vi.mocked(usePublicListingDetail);
const currentUser = vi.mocked(useCurrentUser);
const eligibility = vi.mocked(getListingEligibility);
const applications = vi.mocked(getApplicantApplications);

const applicantUser: SafeUser = {
  id: "applicant-1",
  name: "Ada",
  email: "ada@example.com",
  role: "applicant",
  providerType: null,
  companyName: null,
};

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
    hasApplied: false,
    applicationStatus: null,
    publicReason: null,
    isSaved: false,
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
    schufaRequired: true,
    incomeProofRequired: true,
    suitableForPeopleCount: 2,
    petsPolicy: "NOT_ALLOWED",
    smokingPolicy: "NOT_ALLOWED",
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
    sessionStorage.clear();
    currentUser.mockReturnValue({ user: applicantUser, loading: false });
    eligibility.mockResolvedValue({
      canApply: true,
      reasons: [],
      warnings: [],
      evaluatedAt: "2026-08-23T10:00:00.000Z",
    });
    applications.mockResolvedValue([]);
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
    async (state, label) => {
      mockUseDetail.mockReturnValue(
        mockResult({
          status: "loaded",
          listing: mockListing({ matchesProfile: state }),
        }),
      );
      render(<ListingDetailPage />);

      expect(screen.getByText(label)).toBeInstanceOf(HTMLElement);
      expect(
        await screen.findByRole("button", { name: "Bewerben" }),
      ).toBeInstanceOf(HTMLButtonElement);
    },
  );

  it("renders the requirement rows that the backend provided", () => {
    mockUseDetail.mockReturnValue(
      mockResult({ status: "loaded", listing: mockListing() }),
    );
    render(<ListingDetailPage />);

    expect(screen.queryByText("Mindesteinkommen (netto)")).toBeNull();
    expect(screen.getByText("1–2 Personen")).toBeInstanceOf(HTMLElement);
    expect(screen.getAllByText("Nicht erlaubt")).toHaveLength(2);
  });

  it("renders required boolean requirements when optional requirements are null", () => {
    mockUseDetail.mockReturnValue(
      mockResult({
        status: "loaded",
        listing: mockListing({
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

  it("renders Merken and Melden on a loaded listing", async () => {
    mockUseDetail.mockReturnValue(
      mockResult({ status: "loaded", listing: mockListing() }),
    );
    render(<ListingDetailPage />);

    expect(screen.getByRole("button", { name: "Merken" })).toBeInstanceOf(
      HTMLButtonElement,
    );
    expect(screen.getByRole("button", { name: "Melden" })).toBeInstanceOf(
      HTMLButtonElement,
    );
    expect(screen.getByRole("button", { name: "Bewerben" })).toBeInstanceOf(
      HTMLButtonElement,
    );
    expect(
      screen.queryByRole("link", { name: "Bewerbung starten" }),
    ).toBeNull();
    expect(
      screen.queryByText("Du möchtest dich auf dieses Mietobjekt bewerben?"),
    ).toBeNull();
    await waitFor(() => {
      expect(eligibility).toHaveBeenCalled();
      expect(applications).toHaveBeenCalled();
    });
  });

  it("renders Gemerkt when the listing is already saved", () => {
    mockUseDetail.mockReturnValue(
      mockResult({
        status: "loaded",
        listing: mockListing({ isSaved: true }),
      }),
    );
    render(<ListingDetailPage />);

    expect(screen.getByRole("button", { name: "Gemerkt" })).toBeInstanceOf(
      HTMLButtonElement,
    );
    expect(screen.queryByRole("button", { name: "Merken" })).toBeNull();
  });

  it("shows public listing content and an auth CTA for anonymous users", async () => {
    currentUser.mockReturnValue({ user: null, loading: false });
    mockUseDetail.mockReturnValue(
      mockResult({
        status: "loaded",
        listing: mockListing({ matchesProfile: "unknown" }),
      }),
    );
    render(<ListingDetailPage />);

    expect(screen.getByText("Zimmer in Berlin")).toBeInstanceOf(HTMLElement);
    expect(screen.getByText(/620/)).toBeInstanceOf(HTMLElement);
    expect(
      screen.getByText("Du möchtest dich auf dieses Mietobjekt bewerben?"),
    ).toBeInstanceOf(HTMLElement);
    expect(
      screen
        .getByRole("link", { name: "Bewerbung starten" })
        .getAttribute("href"),
    ).toBe("/register/account-type");
    expect(screen.queryByRole("link", { name: "Anmelden" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Registrieren" })).toBeNull();
    expect(
      screen.queryByRole("link", { name: "Jetzt registrieren" }),
    ).toBeNull();
    expect(screen.queryByText(/Schon registriert/)).toBeNull();
    expect(
      screen.getByRole("link", { name: "Merken" }).getAttribute("href"),
    ).toBe("/login");
    expect(
      screen.getByRole("link", { name: "Melden" }).getAttribute("href"),
    ).toBe("/login");
    expect(screen.queryByRole("button", { name: "Bewerben" })).toBeNull();
    expect(screen.queryByText("Eignung unbekannt")).toBeNull();
    expect(
      screen.queryByText("Die Voraussetzungen konnten nicht geprüft werden."),
    ).toBeNull();
    expect(
      screen.queryByText("Deine Bewerbung konnte nicht geladen werden."),
    ).toBeNull();

    await waitFor(() => {
      expect(eligibility).not.toHaveBeenCalled();
      expect(applications).not.toHaveBeenCalled();
    });
    expect(saveListing).not.toHaveBeenCalled();
    expect(unsaveListing).not.toHaveBeenCalled();
    expect(reportListing).not.toHaveBeenCalled();
  });

  it("hides applicant match labels for anonymous users even when the listing matches", async () => {
    currentUser.mockReturnValue({ user: null, loading: false });
    mockUseDetail.mockReturnValue(
      mockResult({
        status: "loaded",
        listing: mockListing({ matchesProfile: "match" }),
      }),
    );
    render(<ListingDetailPage />);

    expect(screen.getByText("Zimmer in Berlin")).toBeInstanceOf(HTMLElement);
    expect(
      screen.getByRole("link", { name: "Bewerbung starten" }),
    ).toBeInstanceOf(HTMLElement);
    expect(screen.queryByText("Passt zu deinem Profil")).toBeNull();
    expect(screen.queryByRole("button", { name: "Bewerben" })).toBeNull();
    await waitFor(() => {
      expect(eligibility).not.toHaveBeenCalled();
      expect(applications).not.toHaveBeenCalled();
    });
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

  it("restores the last listings search on the back links", async () => {
    sessionStorage.setItem(
      LISTINGS_SEARCH_SESSION_KEY,
      "query=Freiburg&onlyMatching=1",
    );
    mockUseDetail.mockReturnValue(mockResult({ status: "not-found" }));
    render(<ListingDetailPage />);

    await waitFor(() => {
      expect(
        screen.getByText("Zurück zu den Suchergebnissen").getAttribute("href"),
      ).toBe("/listings?query=Freiburg&onlyMatching=1");
      expect(screen.getByText("Zurück zur Suche").getAttribute("href")).toBe(
        "/listings?query=Freiburg&onlyMatching=1",
      );
    });
  });
});
