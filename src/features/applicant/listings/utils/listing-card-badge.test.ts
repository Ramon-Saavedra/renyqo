import { describe, expect, it } from "vitest";
import { createAdmission } from "../testing/admission";
import { resolveListingApplicationUi } from "./listing-card-badge";

describe("resolveListingApplicationUi", () => {
  it("keeps an active application and a matching profile as separate signals", () => {
    expect(
      resolveListingApplicationUi({
        admission: createAdmission({
          currentApplicationId: "active",
          currentApplicationStatus: "ACTIVE",
          canSubmitApplication: false,
          submissionBlockReason: "CURRENT_APPLICATION_EXISTS",
        }),
        matchesProfile: "match",
        publicReason: null,
      }),
    ).toMatchObject({
      process: "applied",
      compatibility: "match",
      action: "withdraw",
    });
  });

  it.each(["ACTIVE", "WAITING"] as const)(
    "keeps current %s visible when the profile no longer matches",
    (status) => {
      expect(
        resolveListingApplicationUi({
          admission: createAdmission({
            hasApplicationHistory: true,
            currentApplicationId: "current",
            currentApplicationStatus: status,
            canSubmitApplication: false,
            submissionBlockReason: "CURRENT_APPLICATION_EXISTS",
          }),
          matchesProfile: "no-match",
          publicReason: null,
        }),
      ).toMatchObject({
        process: "applied",
        compatibility: "no-match",
        action: "withdraw",
      });
    },
  );

  it("uses current restored status even when historical profile rejection remains", () => {
    expect(
      resolveListingApplicationUi({
        admission: createAdmission({
          hasApplicationHistory: true,
          currentApplicationId: "restored",
          currentApplicationStatus: "ACTIVE",
          canSubmitApplication: false,
          submissionBlockReason: "CURRENT_APPLICATION_EXISTS",
        }),
        matchesProfile: "no-match",
        publicReason: "PROFILE_NO_LONGER_ELIGIBLE",
      }),
    ).toMatchObject({
      process: "applied",
      compatibility: "no-match",
      action: "withdraw",
    });
  });

  it("history alone never means currently applied", () => {
    expect(
      resolveListingApplicationUi({
        admission: createAdmission({ hasApplicationHistory: true }),
        matchesProfile: "match",
      }),
    ).toMatchObject({
      process: "none",
      compatibility: "match",
      action: "submit",
    });
  });

  it("shows that a profile rejection ended the previous application", () => {
    expect(
      resolveListingApplicationUi({
        admission: createAdmission({
          hasApplicationHistory: true,
          canSubmitApplication: false,
          submissionBlockReason: "APPLICANT_NOT_ELIGIBLE",
        }),
        matchesProfile: "no-match",
        publicReason: "PROFILE_NO_LONGER_ELIGIBLE",
      }),
    ).toMatchObject({
      process: "ended-profile",
      compatibility: "no-match",
      action: "none",
    });
  });

  it("allows a fresh application after eligibility recovers", () => {
    expect(
      resolveListingApplicationUi({
        admission: createAdmission({ hasApplicationHistory: true }),
        matchesProfile: "match",
        publicReason: "PROFILE_NO_LONGER_ELIGIBLE",
      }),
    ).toMatchObject({
      process: "ended-profile",
      compatibility: "match",
      action: "submit",
    });
  });

  it("does not let a historical profile rejection decide withdrawal or submission", () => {
    const ended = resolveListingApplicationUi({
      admission: createAdmission({
        hasApplicationHistory: true,
        canSubmitApplication: false,
        submissionBlockReason: "APPLICANT_NOT_ELIGIBLE",
      }),
      matchesProfile: "match",
      publicReason: "PROFILE_NO_LONGER_ELIGIBLE",
    });
    const recovered = resolveListingApplicationUi({
      admission: createAdmission({ hasApplicationHistory: true }),
      matchesProfile: "no-match",
      publicReason: "PROFILE_NO_LONGER_ELIGIBLE",
    });
    expect(ended.action).toBe("none");
    expect(recovered.action).toBe("submit");
  });

  it("withdrawal leaves only compatibility when admission allows a new submission", () => {
    expect(
      resolveListingApplicationUi({
        admission: createAdmission({ hasApplicationHistory: true }),
        matchesProfile: "no-match",
        publicReason: null,
      }),
    ).toMatchObject({
      process: "none",
      compatibility: "no-match",
      action: "submit",
    });
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
      process: "not-selected",
      compatibility: "match",
      action: "none",
      reapplyAvailableAt: "2000-01-01T00:00:00Z",
    });
  });

  it.each([
    ["APPLICATION_ACCEPTED", "accepted"],
    ["LISTING_RENTED", "rented"],
    ["APPLICATION_HISTORY_REQUIRES_REVIEW", "unavailable"],
    ["LISTING_NOT_ACCEPTING_APPLICATIONS", "unavailable"],
  ] as const)("preserves %s", (reason, process) => {
    expect(
      resolveListingApplicationUi({
        admission: createAdmission({
          canSubmitApplication: false,
          submissionBlockReason: reason,
        }),
        matchesProfile: "match",
      }),
    ).toMatchObject({ process, compatibility: "match", action: "none" });
  });

  it("hides compatibility when the caller is not showing profile match", () => {
    expect(
      resolveListingApplicationUi({
        admission: createAdmission(),
        matchesProfile: "no-match",
        showMatch: false,
      }),
    ).toMatchObject({
      process: "none",
      compatibility: "hidden",
      action: "submit",
    });
  });
});
