import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiGet } from "@/lib/api/client";
import {
  getProviderExitedApplications,
  ProviderExitedApplicationsContractError,
} from "./provider-exited-applications";

vi.mock("@/lib/api/client", () => ({
  apiGet: vi.fn(),
}));

const withdrawnApplication = {
  id: "exit-1",
  listingId: "listing-1",
  applicantName: "Familie Weber",
  status: "WITHDRAWN" as const,
  publicReason: null,
  exitedAt: "2026-08-30T14:23:00.000Z",
};

const discardedApplication = {
  id: "exit-2",
  listingId: "listing-1",
  applicantName: "Jonas Brandt",
  status: "REJECTED" as const,
  publicReason: "NOT_SELECTED" as const,
  exitedAt: "2026-08-30T11:05:00.000Z",
};

describe("getProviderExitedApplications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches and validates exited applications for a listing", async () => {
    vi.mocked(apiGet).mockResolvedValue({
      items: [withdrawnApplication, discardedApplication],
      totalCount: 2,
    });

    await expect(getProviderExitedApplications("listing-1")).resolves.toEqual({
      items: [withdrawnApplication, discardedApplication],
      totalCount: 2,
    });
    expect(apiGet).toHaveBeenCalledWith(
      "/api/v1/provider/listings/listing-1/exited-applications",
    );
  });

  it("accepts the system-removed public reasons", async () => {
    vi.mocked(apiGet).mockResolvedValue({
      items: [
        {
          ...discardedApplication,
          publicReason: "PROFILE_NO_LONGER_ELIGIBLE",
        },
        {
          ...discardedApplication,
          id: "exit-3",
          publicReason: "LISTING_RENTED",
        },
      ],
      totalCount: 2,
    });

    await expect(
      getProviderExitedApplications("listing-1"),
    ).resolves.toHaveProperty("items.length", 2);
  });

  it("rejects malformed exited application responses", async () => {
    vi.mocked(apiGet).mockResolvedValue({
      items: [{ id: "exit-1" }],
      totalCount: 1,
    });

    await expect(
      getProviderExitedApplications("listing-1"),
    ).rejects.toBeInstanceOf(ProviderExitedApplicationsContractError);
  });

  it("rejects a response without a totalCount", async () => {
    vi.mocked(apiGet).mockResolvedValue({
      items: [withdrawnApplication],
    });

    await expect(
      getProviderExitedApplications("listing-1"),
    ).rejects.toBeInstanceOf(ProviderExitedApplicationsContractError);
  });

  it("rejects a negative totalCount", async () => {
    vi.mocked(apiGet).mockResolvedValue({
      items: [withdrawnApplication],
      totalCount: -1,
    });

    await expect(
      getProviderExitedApplications("listing-1"),
    ).rejects.toBeInstanceOf(ProviderExitedApplicationsContractError);
  });

  it("rejects a non-integer totalCount", async () => {
    vi.mocked(apiGet).mockResolvedValue({
      items: [withdrawnApplication],
      totalCount: 1.5,
    });

    await expect(
      getProviderExitedApplications("listing-1"),
    ).rejects.toBeInstanceOf(ProviderExitedApplicationsContractError);
  });

  it("rejects a response without items", async () => {
    vi.mocked(apiGet).mockResolvedValue({ totalCount: 0 });

    await expect(
      getProviderExitedApplications("listing-1"),
    ).rejects.toBeInstanceOf(ProviderExitedApplicationsContractError);
  });

  it("rejects a non-array items value", async () => {
    vi.mocked(apiGet).mockResolvedValue({ items: {}, totalCount: 0 });

    await expect(
      getProviderExitedApplications("listing-1"),
    ).rejects.toBeInstanceOf(ProviderExitedApplicationsContractError);
  });

  it("rejects totalCount below the number of items", async () => {
    vi.mocked(apiGet).mockResolvedValue({
      items: [withdrawnApplication],
      totalCount: 0,
    });

    await expect(
      getProviderExitedApplications("listing-1"),
    ).rejects.toBeInstanceOf(ProviderExitedApplicationsContractError);
  });

  it("rejects empty items when totalCount is positive", async () => {
    vi.mocked(apiGet).mockResolvedValue({ items: [], totalCount: 3 });

    await expect(
      getProviderExitedApplications("listing-1"),
    ).rejects.toBeInstanceOf(ProviderExitedApplicationsContractError);
  });

  it("rejects an incomplete items page", async () => {
    vi.mocked(apiGet).mockResolvedValue({
      items: [withdrawnApplication],
      totalCount: 2,
    });

    await expect(
      getProviderExitedApplications("listing-1"),
    ).rejects.toBeInstanceOf(ProviderExitedApplicationsContractError);
  });

  it("accepts five items when totalCount is greater than five", async () => {
    const items = Array.from({ length: 5 }, (_, index) => ({
      ...withdrawnApplication,
      id: `exit-${index + 1}`,
    }));
    vi.mocked(apiGet).mockResolvedValue({ items, totalCount: 8 });

    await expect(getProviderExitedApplications("listing-1")).resolves.toEqual({
      items,
      totalCount: 8,
    });
  });

  it("rejects more than five items", async () => {
    const items = Array.from({ length: 6 }, (_, index) => ({
      ...withdrawnApplication,
      id: `exit-${index + 1}`,
    }));
    vi.mocked(apiGet).mockResolvedValue({
      items,
      totalCount: items.length,
    });

    await expect(
      getProviderExitedApplications("listing-1"),
    ).rejects.toBeInstanceOf(ProviderExitedApplicationsContractError);
  });

  it("rejects exited applications for a different listing", async () => {
    vi.mocked(apiGet).mockResolvedValue({
      items: [{ ...withdrawnApplication, listingId: "listing-2" }],
      totalCount: 1,
    });

    await expect(
      getProviderExitedApplications("listing-1"),
    ).rejects.toBeInstanceOf(ProviderExitedApplicationsContractError);
  });

  it("rejects an unknown status value", async () => {
    vi.mocked(apiGet).mockResolvedValue({
      items: [{ ...withdrawnApplication, status: "ACTIVE" }],
      totalCount: 1,
    });

    await expect(
      getProviderExitedApplications("listing-1"),
    ).rejects.toBeInstanceOf(ProviderExitedApplicationsContractError);
  });

  it("rejects an unknown public reason value", async () => {
    vi.mocked(apiGet).mockResolvedValue({
      items: [{ ...discardedApplication, publicReason: "UNKNOWN_REASON" }],
      totalCount: 1,
    });

    await expect(
      getProviderExitedApplications("listing-1"),
    ).rejects.toBeInstanceOf(ProviderExitedApplicationsContractError);
  });

  it("rejects a non-ISO exitedAt value", async () => {
    vi.mocked(apiGet).mockResolvedValue({
      items: [{ ...withdrawnApplication, exitedAt: "30.08.2026" }],
      totalCount: 1,
    });

    await expect(
      getProviderExitedApplications("listing-1"),
    ).rejects.toBeInstanceOf(ProviderExitedApplicationsContractError);
  });
});
