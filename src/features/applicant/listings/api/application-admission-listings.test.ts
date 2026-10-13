import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiGet } from "@/lib/api/client";
import { getPublicListingDetail, getPublicListings } from "./public-listings";
import { getSavedListings } from "./saved-listings";
import { createAdmission } from "../testing/admission";
import { resolveListingApplicationUi } from "../utils/listing-card-badge";

vi.mock("@/lib/api/client", () => ({ apiGet: vi.fn() }));

function payload(admission: unknown) {
  return {
    id: "listing",
    title: "Wohnung",
    city: null,
    zip: null,
    district: null,
    street: null,
    objectType: "APARTMENT",
    livingArea: null,
    rooms: null,
    bedrooms: null,
    coldRent: null,
    additionalCosts: null,
    deposit: null,
    depositMonths: null,
    availableFrom: null,
    shortDescription: null,
    publishedAt: null,
    isNew: false,
    petsPolicy: null,
    coverImage: null,
    images: [],
    profileMatch: "MATCH",
    hasApplied: true,
    applicationStatus: "REJECTED",
    publicReason: "NOT_SELECTED",
    isSaved: true,
    admission,
    requirements: {
      schufaRequired: false,
      incomeProofRequired: false,
      suitableForPeopleCount: null,
      petsPolicy: null,
      smokingPolicy: null,
    },
  };
}

beforeEach(() => vi.clearAllMocks());

describe("list, detail and saved admission consistency", () => {
  it("WITHDRAWN history does not imply an active application", async () => {
    const admission = createAdmission({ hasApplicationHistory: true });
    vi.mocked(apiGet).mockResolvedValueOnce({
      items: [
        {
          ...payload(admission),
          hasApplied: false,
          applicationStatus: null,
          publicReason: null,
        },
      ],
      total: 1,
      nextCursor: null,
    });
    const response = await getPublicListings({});
    const listing = response.listings[0];
    if (!listing) throw new Error("Missing listing");
    expect(
      resolveListingApplicationUi({
        admission: listing.admission,
        matchesProfile: "match",
      }),
    ).toMatchObject({
      process: "none",
      compatibility: "match",
      action: "submit",
    });
    expect(apiGet).toHaveBeenCalledTimes(1);
    expect(apiGet).toHaveBeenCalledWith("/api/v1/listings", undefined);
  });
  it.each([
    createAdmission({ hasApplicationHistory: true }),
    createAdmission({
      hasApplicationHistory: true,
      currentApplicationId: "restored",
      currentApplicationStatus: "ACTIVE",
      canSubmitApplication: false,
      submissionBlockReason: "CURRENT_APPLICATION_EXISTS",
    }),
    createAdmission({
      hasApplicationHistory: true,
      currentApplicationId: "waiting",
      currentApplicationStatus: "WAITING",
      canSubmitApplication: false,
      submissionBlockReason: "CURRENT_APPLICATION_EXISTS",
    }),
    createAdmission({
      hasApplicationHistory: true,
      canSubmitApplication: false,
      submissionBlockReason: "APPLICATION_REAPPLICATION_COOLDOWN",
      reapplyAvailableAt: "2026-11-01T00:00:00Z",
    }),
  ])(
    "uses identical admission despite conflicting historical fields %j",
    async (admission) => {
      vi.mocked(apiGet).mockImplementation(async (path) =>
        path === "/api/v1/listings/listing"
          ? payload(admission)
          : { items: [payload(admission)], total: 1, nextCursor: null },
      );
      const list = await getPublicListings({});
      const detail = await getPublicListingDetail("listing");
      const saved = await getSavedListings();
      expect(list.listings[0]?.admission).toEqual(admission);
      expect(detail?.admission).toEqual(admission);
      expect(saved.listings[0]?.admission).toEqual(admission);
      const sources = [list.listings[0], detail, saved.listings[0]] as const;
      const states = sources.map((listing) => {
        if (!listing) throw new Error("Missing listing admission");
        return resolveListingApplicationUi({
          admission: listing.admission,
          matchesProfile: "match",
          publicReason: listing.publicReason,
        });
      });
      expect(states[0]).toEqual(states[1]);
      expect(states[1]).toEqual(states[2]);
    },
  );
  it.each([
    undefined,
    null,
    {},
    { ...createAdmission(), canSubmitApplication: "yes" },
  ])("rejects invalid admission on every endpoint %j", async (admission) => {
    vi.mocked(apiGet).mockResolvedValueOnce({
      items: [payload(admission)],
      total: 1,
      nextCursor: null,
    });
    await expect(getPublicListings({})).rejects.toThrow();
    vi.mocked(apiGet).mockResolvedValueOnce(payload(admission));
    await expect(getPublicListingDetail("listing")).rejects.toThrow();
    vi.mocked(apiGet).mockResolvedValueOnce({
      items: [payload(admission)],
      total: 1,
      nextCursor: null,
    });
    await expect(getSavedListings()).rejects.toThrow();
  });
});
