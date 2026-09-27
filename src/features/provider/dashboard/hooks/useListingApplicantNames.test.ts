import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getProviderActiveApplications } from "../api/provider-listing-applications";
import type { ProviderActiveApplication } from "../api/provider-listing-applications";
import {
  buildInitials,
  formatActiveAtLabel,
  formatHousehold,
} from "../utils/applicant-format";
import { useListingApplicantNames } from "./useListingApplicantNames";

vi.mock("../api/provider-listing-applications", () => ({
  getProviderActiveApplications: vi.fn(),
}));

describe("useListingApplicantNames", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads each listing once and keeps response order", async () => {
    vi.mocked(getProviderActiveApplications).mockResolvedValue([
      {
        id: "application-1",
        listingId: "listing-1",
        status: "ACTIVE",
        activeAt: "2026-08-01T10:00:00.000Z",
        applicant: {
          name: "Anna Lehmann",
          peopleCount: 1,
          warnings: ["pets_by_arrangement"],
          introduction: "Kurzer Text",
        },
      },
      {
        id: "application-2",
        listingId: "listing-1",
        status: "ACTIVE",
        activeAt: null,
        applicant: {
          name: "Ben Becker",
          peopleCount: null,
          warnings: ["smoking_by_arrangement", "pets_by_arrangement"],
          introduction: null,
        },
      },
    ]);

    const { result } = renderHook(() => useListingApplicantNames());

    result.current.ensureLoaded("listing-1");
    result.current.ensureLoaded("listing-1");

    await waitFor(() => {
      expect(result.current.getState("listing-1")).toEqual({
        status: "loaded",
        previews: [
          {
            initials: buildInitials("Anna Lehmann"),
            name: "Anna Lehmann",
            household: formatHousehold(1),
            warnings: ["pets_by_arrangement"],
            introduction: "Kurzer Text",
            activeAtLabel: formatActiveAtLabel("2026-08-01T10:00:00.000Z"),
          },
          {
            initials: buildInitials("Ben Becker"),
            name: "Ben Becker",
            household: formatHousehold(null),
            warnings: ["smoking_by_arrangement", "pets_by_arrangement"],
            introduction: null,
            activeAtLabel: formatActiveAtLabel(null),
          },
        ],
      });
    });

    result.current.ensureLoaded("listing-1");
    expect(getProviderActiveApplications).toHaveBeenCalledTimes(1);
  });

  it("reloads a loaded listing on the next interaction after an authoritative refresh", async () => {
    vi.mocked(getProviderActiveApplications)
      .mockResolvedValueOnce([
        {
          id: "application-1",
          listingId: "listing-1",
          status: "ACTIVE",
          activeAt: "2026-08-01T10:00:00.000Z",
          applicant: {
            name: "Anna Lehmann",
            peopleCount: 1,
            warnings: [],
            introduction: null,
          },
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "application-2",
          listingId: "listing-1",
          status: "ACTIVE",
          activeAt: null,
          applicant: {
            name: "Clara Klein",
            peopleCount: 2,
            warnings: [],
            introduction: null,
          },
        },
      ]);

    const { result } = renderHook(() => useListingApplicantNames());
    result.current.ensureLoaded("listing-1");

    await waitFor(() => {
      expect(result.current.getState("listing-1").previews[0]?.name).toBe(
        "Anna Lehmann",
      );
    });

    result.current.invalidateLoaded();
    expect(result.current.getState("listing-1")).toEqual({
      status: "idle",
      previews: [],
    });

    result.current.ensureLoaded("listing-1");

    await waitFor(() => {
      expect(result.current.getState("listing-1").previews[0]?.name).toBe(
        "Clara Klein",
      );
    });
    expect(getProviderActiveApplications).toHaveBeenCalledTimes(2);
  });

  it("discards an in-flight preview after an authoritative refresh", async () => {
    let resolveFirst: (
      value: readonly ProviderActiveApplication[],
    ) => void = () => undefined;
    vi.mocked(getProviderActiveApplications).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveFirst = resolve;
        }),
    );

    const { result } = renderHook(() => useListingApplicantNames());
    result.current.ensureLoaded("listing-1");
    result.current.invalidateLoaded();
    resolveFirst([]);
    await Promise.resolve();

    expect(result.current.getState("listing-1").status).toBe("idle");
    expect(getProviderActiveApplications).toHaveBeenCalledTimes(1);
  });
});
