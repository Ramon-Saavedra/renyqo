import { describe, expect, it } from "vitest";
import { createAdmission } from "../testing/admission";
import { resolveListingApplicationUi } from "./listing-card-badge";

describe("resolveListingApplicationUi", () => {
  it.each(["ACTIVE", "WAITING"] as const)(
    "uses current %s even after restoration with history",
    (status) => {
      expect(
        resolveListingApplicationUi({
          admission: createAdmission({
            hasApplicationHistory: true,
            currentApplicationId: "restored",
            currentApplicationStatus: status,
            canSubmitApplication: false,
            submissionBlockReason: "CURRENT_APPLICATION_EXISTS",
          }),
          matchesProfile: "no-match",
        }),
      ).toMatchObject({ badge: "applied", action: "withdraw" });
    },
  );
  it("history alone never means currently applied", () => {
    expect(
      resolveListingApplicationUi({
        admission: createAdmission({ hasApplicationHistory: true }),
        matchesProfile: "match",
      }),
    ).toMatchObject({ badge: "match", action: "submit" });
  });
  it("reflects current incompatibility after profile rejection", () => {
    expect(
      resolveListingApplicationUi({
        admission: createAdmission({
          hasApplicationHistory: true,
          canSubmitApplication: false,
          submissionBlockReason: "APPLICANT_NOT_ELIGIBLE",
        }),
        matchesProfile: "no-match",
      }),
    ).toMatchObject({ badge: "no-match", action: "none" });
  });
  it("allows recovered eligibility and withdrawn history when backend permits", () => {
    expect(
      resolveListingApplicationUi({
        admission: createAdmission({ hasApplicationHistory: true }),
        matchesProfile: "match",
      }).action,
    ).toBe("submit");
  });
  it("does not expire a cooldown locally even with a past date", () => {
    expect(
      resolveListingApplicationUi({
        admission: createAdmission({
          canSubmitApplication: false,
          submissionBlockReason: "APPLICATION_REAPPLICATION_COOLDOWN",
          reapplyAvailableAt: "2000-01-01T00:00:00Z",
        }),
        matchesProfile: "match",
      }),
    ).toMatchObject({
      badge: "not-selected",
      action: "none",
      reapplyAvailableAt: "2000-01-01T00:00:00Z",
    });
  });
  it.each([
    ["APPLICATION_ACCEPTED", "accepted"],
    ["LISTING_RENTED", "rented"],
    ["APPLICATION_HISTORY_REQUIRES_REVIEW", "unavailable"],
    ["LISTING_NOT_ACCEPTING_APPLICATIONS", "unavailable"],
  ] as const)("preserves %s", (reason, badge) => {
    expect(
      resolveListingApplicationUi({
        admission: createAdmission({
          canSubmitApplication: false,
          submissionBlockReason: reason,
        }),
        matchesProfile: "match",
      }),
    ).toMatchObject({ badge, action: "none" });
  });
});
