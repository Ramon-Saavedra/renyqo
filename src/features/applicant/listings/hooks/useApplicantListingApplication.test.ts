import { describe, expect, it } from "vitest";
import {
  findCurrentApplicantListingApplication,
} from "./useApplicantListingApplication";

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
      findCurrentApplicantListingApplication([application("other", "listing-2")], "listing-1"),
    ).toBeNull();
  });
});
