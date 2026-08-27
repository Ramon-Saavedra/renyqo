import { describe, expect, it } from "vitest";

import {
  canSaveProfile,
  formatHouseholdSize,
  getHouseholdSize,
  getMissingProfileFields,
  getProfileErrors,
  INITIAL_PROFILE,
  isProfileComplete,
  type ApplicantProfileDraft,
} from "./profile-validation";

const COMPLETE_PROFILE: ApplicantProfileDraft = {
  income: "3200",
  adults: 2,
  children: 1,
  incomeProof: "ja",
  schufa: "ja",
  pets: "ja",
  smoker: "nein",
};

describe("profile-validation", () => {
  it("lists every unanswered required field on a fresh profile", () => {
    expect(getMissingProfileFields(INITIAL_PROFILE)).toEqual([
      "Haushaltsnettoeinkommen",
      "Einkommensnachweis",
      "SCHUFA-Auskunft",
      "Haustiere?",
      "Raucher?",
    ]);
  });

  it("reports no missing fields for a fully answered profile", () => {
    expect(getMissingProfileFields(COMPLETE_PROFILE)).toEqual([]);
    expect(isProfileComplete(COMPLETE_PROFILE)).toBe(true);
  });

  it("treats the household counts as answered by default", () => {
    expect(getMissingProfileFields(INITIAL_PROFILE)).not.toContain(
      "Erwachsene",
    );
    expect(getMissingProfileFields(INITIAL_PROFILE)).not.toContain("Kinder");
  });

  it("rejects an income of zero or below", () => {
    expect(getProfileErrors({ ...COMPLETE_PROFILE, income: "0" })).toEqual({
      income: "Bitte einen Betrag über 0 € angeben.",
    });
    expect(canSaveProfile({ ...COMPLETE_PROFILE, income: "0" })).toBe(false);
  });

  it("accepts an empty income without flagging it as invalid", () => {
    expect(getProfileErrors(INITIAL_PROFILE)).toEqual({});
    expect(canSaveProfile(INITIAL_PROFILE)).toBe(true);
  });

  it("sums adults and children into the household size", () => {
    expect(getHouseholdSize(COMPLETE_PROFILE)).toBe(3);
    expect(getHouseholdSize(INITIAL_PROFILE)).toBe(1);
  });

  it("pluralizes the household size label", () => {
    expect(formatHouseholdSize(1)).toBe("1 Person");
    expect(formatHouseholdSize(3)).toBe("3 Personen");
  });
});
