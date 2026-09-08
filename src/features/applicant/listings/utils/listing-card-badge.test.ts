import { describe, expect, it } from "vitest";
import { resolveListingCardBadge } from "./listing-card-badge";

describe("resolveListingCardBadge", () => {
  it("returns not-selected for REJECTED and NOT_SELECTED before match", () => {
    expect(
      resolveListingCardBadge({
        applicationStatus: "REJECTED",
        publicReason: "NOT_SELECTED",
        matchesProfile: true,
        showMatch: true,
      }),
    ).toBe("not-selected");
  });

  it.each(["ACTIVE", "WAITING", "ACCEPTED"] as const)(
    "returns applied for %s",
    (applicationStatus) => {
      expect(
        resolveListingCardBadge({
          applicationStatus,
          publicReason: null,
          matchesProfile: true,
          showMatch: true,
        }),
      ).toBe("applied");
    },
  );

  it.each(["PROFILE_NO_LONGER_ELIGIBLE", "LISTING_RENTED"] as const)(
    "returns applied for REJECTED and %s instead of match",
    (publicReason) => {
      expect(
        resolveListingCardBadge({
          applicationStatus: "REJECTED",
          publicReason,
          matchesProfile: true,
          showMatch: true,
        }),
      ).toBe("applied");
    },
  );

  it("does not infer applied from a null application status", () => {
    expect(
      resolveListingCardBadge({
        applicationStatus: null,
        publicReason: null,
        matchesProfile: true,
        showMatch: true,
      }),
    ).toBe("match");
  });

  it("returns match and no-match only when there is no blocking application", () => {
    expect(
      resolveListingCardBadge({
        applicationStatus: null,
        publicReason: null,
        matchesProfile: false,
        showMatch: true,
      }),
    ).toBe("no-match");
  });

  it("returns none when showMatch is false and status is null", () => {
    expect(
      resolveListingCardBadge({
        applicationStatus: null,
        publicReason: null,
        matchesProfile: true,
        showMatch: false,
      }),
    ).toBe("none");
  });
});
