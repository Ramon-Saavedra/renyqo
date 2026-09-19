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
  introduction: "Ich suche ein ruhiges Zuhause.",
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
      "Ein paar Worte",
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

  it("rejects an empty introduction", () => {
    expect(getProfileErrors(COMPLETE_PROFILE)).toEqual({});
    expect(
      getProfileErrors({ ...COMPLETE_PROFILE, introduction: "" }).introduction,
    ).toBe("Bitte erzähl uns kurz etwas über dich oder euch.");
  });

  it("rejects a whitespace-only introduction", () => {
    expect(
      getProfileErrors({ ...COMPLETE_PROFILE, introduction: "   " })
        .introduction,
    ).toBe("Bitte erzähl uns kurz etwas über dich oder euch.");
  });

  it("accepts an introduction with exactly 100 characters", () => {
    expect(
      getProfileErrors({
        ...COMPLETE_PROFILE,
        introduction: "a".repeat(100),
      }),
    ).toEqual({});
  });

  it("rejects an introduction longer than 100 characters", () => {
    expect(
      getProfileErrors({
        ...COMPLETE_PROFILE,
        introduction: "a".repeat(101),
      }).introduction,
    ).toBe("Dein Text darf höchstens 100 Zeichen lang sein.");
  });

  it("rejects angle brackets in an introduction", () => {
    expect(
      getProfileErrors({ ...COMPLETE_PROFILE, introduction: "Ich <3 Berlin" })
        .introduction,
    ).toBe("Bitte verwende keine spitzen Klammern (< oder >).");
    expect(
      getProfileErrors({ ...COMPLETE_PROFILE, introduction: "Ich > Berlin" })
        .introduction,
    ).toBe("Bitte verwende keine spitzen Klammern (< oder >).");
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
    const profile = { ...COMPLETE_PROFILE, income: "" };
    expect(getProfileErrors(profile)).toEqual({});
    expect(canSaveProfile(profile)).toBe(true);
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
