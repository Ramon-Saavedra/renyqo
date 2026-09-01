import { describe, expect, it } from "vitest";
import {
  mapExitedApplicationsToExits,
  mapExitedApplicationToExit,
} from "./map-exited-application-to-exit";
import type { ProviderExitedApplication } from "./provider-exited-applications";

const withdrawn: ProviderExitedApplication = {
  id: "exit-1",
  listingId: "listing-1",
  applicantName: "Familie Weber",
  status: "WITHDRAWN",
  publicReason: null,
  exitedAt: "2026-08-30T14:23:00.000Z",
};

const discarded: ProviderExitedApplication = {
  id: "exit-2",
  listingId: "listing-1",
  applicantName: "Jonas Brandt",
  status: "REJECTED",
  publicReason: "NOT_SELECTED",
  exitedAt: "2026-08-30T11:05:00.000Z",
};

const noLongerEligible: ProviderExitedApplication = {
  id: "exit-3",
  listingId: "listing-1",
  applicantName: "Marlene Kaufmann",
  status: "REJECTED",
  publicReason: "PROFILE_NO_LONGER_ELIGIBLE",
  exitedAt: "2026-08-29T18:40:00.000Z",
};

const listingRented: ProviderExitedApplication = {
  id: "exit-4",
  listingId: "listing-1",
  applicantName: "Tobias Hein",
  status: "REJECTED",
  publicReason: "LISTING_RENTED",
  exitedAt: "2026-08-29T09:12:00.000Z",
};

const rejectedWithoutReason: ProviderExitedApplication = {
  id: "exit-5",
  listingId: "listing-1",
  applicantName: "Petra Lindt",
  status: "REJECTED",
  publicReason: null,
  exitedAt: "2026-08-28T16:57:00.000Z",
};

describe("mapExitedApplicationToExit", () => {
  it("maps a withdrawn application to the withdrawn visual state", () => {
    const exit = mapExitedApplicationToExit(withdrawn);
    expect(exit.visualState).toBe("withdrawn");
    expect(exit.applicantName).toBe("Familie Weber");
  });

  it("maps a provider rejection for NOT_SELECTED to provider_discarded", () => {
    expect(mapExitedApplicationToExit(discarded).visualState).toBe(
      "provider_discarded",
    );
  });

  it("maps PROFILE_NO_LONGER_ELIGIBLE to system_removed", () => {
    expect(mapExitedApplicationToExit(noLongerEligible).visualState).toBe(
      "system_removed",
    );
  });

  it("maps LISTING_RENTED to system_removed", () => {
    expect(mapExitedApplicationToExit(listingRented).visualState).toBe(
      "system_removed",
    );
  });

  it("falls back to system_removed for a rejection without a public reason", () => {
    expect(mapExitedApplicationToExit(rejectedWithoutReason).visualState).toBe(
      "system_removed",
    );
  });

  it("formats exitedAt into full and compact German date/time labels", () => {
    const exit = mapExitedApplicationToExit(withdrawn);
    expect(exit.exitedAtLabel).toBe("30.08.2026 · 16:23");
    expect(exit.exitedAtLabelCompact).toBe("30.08. · 16:23");
  });
});

describe("mapExitedApplicationsToExits", () => {
  it("sorts applications by exitedAt descending", () => {
    const exits = mapExitedApplicationsToExits([
      listingRented,
      withdrawn,
      discarded,
    ]);

    expect(exits.map((exit) => exit.id)).toEqual([
      "exit-1",
      "exit-2",
      "exit-4",
    ]);
  });
});
