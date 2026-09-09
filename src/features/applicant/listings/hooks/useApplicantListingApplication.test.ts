import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getApplicantApplications } from "../api/applicant-applications";
import {
  findCurrentApplicantListingApplication,
  useApplicantListingApplication,
} from "./useApplicantListingApplication";

vi.mock("../api/applicant-applications", () => ({
  getApplicantApplications: vi.fn(),
}));

const applications = vi.mocked(getApplicantApplications);

const application = (id: string, listingId: string) => ({
  id,
  listingId,
  status: "WITHDRAWN" as const,
  rejectedAt: null,
  publicReason: null,
  createdAt: "2026-08-23T10:00:00.000Z",
  updatedAt: "2026-08-23T10:00:00.000Z",
  listing: { title: "Wohnung", city: "Berlin", coldRent: 900, imageUrl: null },
});

describe("findCurrentApplicantListingApplication", () => {
  it("uses the first matching application from backend descending order", () => {
    const current = application("new", "listing-1");
    const previous = application("old", "listing-1");

    expect(
      findCurrentApplicantListingApplication(
        [current, application("other", "listing-2"), previous],
        "listing-1",
      ),
    ).toEqual(current);
  });

  it("returns null when the listing has no application", () => {
    expect(
      findCurrentApplicantListingApplication(
        [application("other", "listing-2")],
        "listing-1",
      ),
    ).toBeNull();
  });
});

describe("useApplicantListingApplication", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    applications.mockResolvedValue([application("a", "listing-1")]);
  });

  it("does not fetch when disabled", async () => {
    const { result } = renderHook(() =>
      useApplicantListingApplication("listing-1", false),
    );

    expect(result.current.status).toBe("idle");
    expect(result.current.application).toBeNull();
    await waitFor(() => {
      expect(applications).not.toHaveBeenCalled();
    });
  });

  it("fetches after becoming enabled", async () => {
    const { result, rerender } = renderHook(
      ({ enabled }) => useApplicantListingApplication("listing-1", enabled),
      { initialProps: { enabled: false } },
    );

    expect(applications).not.toHaveBeenCalled();
    rerender({ enabled: true });

    await waitFor(() => {
      expect(result.current.status).toBe("loaded");
    });
    expect(applications).toHaveBeenCalledTimes(1);
  });

  it("fetches when enabled", async () => {
    const { result } = renderHook(() =>
      useApplicantListingApplication("listing-1", true),
    );

    await waitFor(() => {
      expect(result.current.status).toBe("loaded");
    });
    expect(applications).toHaveBeenCalledTimes(1);
    expect(result.current.application).toEqual(application("a", "listing-1"));
  });
});
