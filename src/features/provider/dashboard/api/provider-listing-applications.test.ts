import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiGet } from "@/lib/api/client";
import {
  getProviderActiveApplications,
  getProviderWaitingCount,
  ProviderListingApplicationsContractError,
} from "./provider-listing-applications";

vi.mock("@/lib/api/client", () => ({
  apiGet: vi.fn(),
}));

const baseApplicant = {
  name: "Anna Lehmann",
  peopleCount: 2,
  warnings: [],
};

const activeApplication = {
  id: "application-1",
  listingId: "listing-1",
  status: "ACTIVE" as const,
  applicant: baseApplicant,
};

describe("getProviderActiveApplications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches and validates active applications for a listing", async () => {
    vi.mocked(apiGet).mockResolvedValue([activeApplication]);

    await expect(getProviderActiveApplications("listing-1")).resolves.toEqual([
      activeApplication,
    ]);
    expect(apiGet).toHaveBeenCalledWith(
      "/api/v1/provider/listings/listing-1/active-applications",
    );
  });

  it("rejects malformed active application responses", async () => {
    vi.mocked(apiGet).mockResolvedValue([{ id: "application-1" }]);

    await expect(
      getProviderActiveApplications("listing-1"),
    ).rejects.toBeInstanceOf(ProviderListingApplicationsContractError);
  });

  it("rejects active applications for a different listing", async () => {
    vi.mocked(apiGet).mockResolvedValue([
      { ...activeApplication, listingId: "listing-2" },
    ]);

    await expect(
      getProviderActiveApplications("listing-1"),
    ).rejects.toBeInstanceOf(ProviderListingApplicationsContractError);
  });

  it("rejects non-active application statuses", async () => {
    vi.mocked(apiGet).mockResolvedValue([
      { ...activeApplication, status: "WAITING" },
    ]);

    await expect(
      getProviderActiveApplications("listing-1"),
    ).rejects.toBeInstanceOf(ProviderListingApplicationsContractError);
  });

  it("rejects more than five active applications", async () => {
    vi.mocked(apiGet).mockResolvedValue(
      Array.from({ length: 6 }, (_, index) => ({
        ...activeApplication,
        id: `application-${index + 1}`,
      })),
    );

    await expect(
      getProviderActiveApplications("listing-1"),
    ).rejects.toBeInstanceOf(ProviderListingApplicationsContractError);
  });

  it.each([-1, 1.5])("rejects invalid household total %s", async (total) => {
    vi.mocked(apiGet).mockResolvedValue([
      {
        ...activeApplication,
        applicant: { ...baseApplicant, peopleCount: total },
      },
    ]);

    await expect(
      getProviderActiveApplications("listing-1"),
    ).rejects.toBeInstanceOf(ProviderListingApplicationsContractError);
  });

  it("rejects an unknown warning value", async () => {
    vi.mocked(apiGet).mockResolvedValue([
      {
        ...activeApplication,
        applicant: { ...baseApplicant, warnings: ["unknown_warning"] },
      },
    ]);

    await expect(
      getProviderActiveApplications("listing-1"),
    ).rejects.toBeInstanceOf(ProviderListingApplicationsContractError);
  });
});

describe("getProviderWaitingCount", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches and validates waiting count for a listing", async () => {
    vi.mocked(apiGet).mockResolvedValue({ waitingCount: 3 });

    await expect(getProviderWaitingCount("listing-1")).resolves.toBe(3);
    expect(apiGet).toHaveBeenCalledWith(
      "/api/v1/provider/listings/listing-1/waiting-count",
    );
  });

  it("rejects malformed waiting count responses", async () => {
    vi.mocked(apiGet).mockResolvedValue({ waitingCount: -1 });

    await expect(getProviderWaitingCount("listing-1")).rejects.toBeInstanceOf(
      ProviderListingApplicationsContractError,
    );
  });

  it("rejects legacy count alias responses", async () => {
    vi.mocked(apiGet).mockResolvedValue({ count: 3 });

    await expect(getProviderWaitingCount("listing-1")).rejects.toBeInstanceOf(
      ProviderListingApplicationsContractError,
    );
  });

  it("rejects plain numeric responses", async () => {
    vi.mocked(apiGet).mockResolvedValue(3);

    await expect(getProviderWaitingCount("listing-1")).rejects.toBeInstanceOf(
      ProviderListingApplicationsContractError,
    );
  });
});
