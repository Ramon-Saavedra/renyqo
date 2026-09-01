import { describe, expect, it } from "vitest";

import {
  mapActiveApplicationToCandidate,
  mapActiveApplicationsToCandidates,
} from "./map-active-application-to-candidate";
import type { ProviderActiveApplication } from "./provider-listing-applications";

function buildApplication(
  overrides?: Partial<Omit<ProviderActiveApplication, "applicant">> & {
    applicant?: Partial<ProviderActiveApplication["applicant"]>;
  },
): ProviderActiveApplication {
  const { applicant: applicantOverrides, ...applicationOverrides } =
    overrides ?? {};

  return {
    id: "application-1",
    listingId: "listing-1",
    status: "ACTIVE",
    activeAt: null,
    applicant: {
      name: "Anna Lehmann",
      peopleCount: 2,
      warnings: [],
      ...applicantOverrides,
    },
    ...applicationOverrides,
  };
}

describe("mapActiveApplicationToCandidate", () => {
  it("maps a complete applicant summary into a candidate card model", () => {
    const application = buildApplication();
    const candidate = mapActiveApplicationToCandidate(application);

    expect(candidate).toEqual({
      id: "application-1",
      objectId: "listing-1",
      initials: "AL",
      name: "Anna Lehmann",
      household: "2 Personen",
      warnings: [],
    });
  });

  it("does not retain the complete applicant response in dashboard state", () => {
    const candidate = mapActiveApplicationToCandidate(buildApplication());

    expect(candidate).not.toHaveProperty("applicant");
    expect(candidate).not.toHaveProperty("email");
  });

  it("handles missing household totals with neutral values", () => {
    const candidate = mapActiveApplicationToCandidate(
      buildApplication({
        applicant: {
          peopleCount: null,
        },
      }),
    );

    expect(candidate.household).toBe("Haushalt nicht angegeben");
  });

  it("passes backend warnings through to the candidate", () => {
    const candidate = mapActiveApplicationToCandidate(
      buildApplication({
        applicant: {
          warnings: ["pets_by_arrangement", "smoking_by_arrangement"],
        },
      }),
    );

    expect(candidate.warnings).toEqual([
      "pets_by_arrangement",
      "smoking_by_arrangement",
    ]);
  });
});

describe("mapActiveApplicationsToCandidates", () => {
  it("preserves backend order without sorting", () => {
    const candidates = mapActiveApplicationsToCandidates([
      buildApplication({
        id: "application-1",
        applicant: { name: "Anna Lehmann" },
      }),
      buildApplication({
        id: "application-2",
        applicant: { name: "Ben Becker" },
      }),
    ]);

    expect(candidates.map((candidate) => candidate.id)).toEqual([
      "application-1",
      "application-2",
    ]);
    expect(candidates.map((candidate) => candidate.name)).toEqual([
      "Anna Lehmann",
      "Ben Becker",
    ]);
  });
});
