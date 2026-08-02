import { describe, expect, it } from "vitest";

import { INITIAL_PROFILE } from "../utils/profile-validation";
import { toDraft, toPayload } from "./applicant-profile";

describe("applicant-profile mapping", () => {
  it("maps a populated response onto the draft", () => {
    expect(
      toDraft({
        householdNetIncome: 3200,
        incomeProofAvailable: true,
        schufaAvailable: false,
        peopleCount: 3,
        adultsCount: 2,
        childrenCount: 1,
        hasPets: true,
        petsNote: "1 Katze",
        smokingStatus: "NON_SMOKER",
      }),
    ).toEqual({
      income: "3200",
      adults: 2,
      children: 1,
      incomeProof: "ja",
      schufa: "nein",
      pets: "ja",
      petsNote: "1 Katze",
      smoker: "nichtraucher",
    });
  });

  it("falls back to the initial draft for an empty profile", () => {
    expect(toDraft({})).toEqual(INITIAL_PROFILE);
  });

  it("round-trips every smoking status", () => {
    expect(toDraft({ smokingStatus: "SMOKER" }).smoker).toBe("raucher");
    expect(toDraft({ smokingStatus: "OCCASIONALLY" }).smoker).toBe(
      "gelegentlich",
    );
    expect(
      toPayload({ ...INITIAL_PROFILE, smoker: "gelegentlich" }).smokingStatus,
    ).toBe("OCCASIONALLY");
    expect(
      toPayload({ ...INITIAL_PROFILE, smoker: "raucher" }).smokingStatus,
    ).toBe("SMOKER");
  });

  it("clamps out-of-range household counts", () => {
    const draft = toDraft({ adultsCount: 99, childrenCount: -4 });

    expect(draft.adults).toBe(8);
    expect(draft.children).toBe(0);
  });

  it("sends unanswered questions as null", () => {
    expect(toPayload(INITIAL_PROFILE)).toEqual({
      householdNetIncome: null,
      incomeProofAvailable: null,
      schufaAvailable: null,
      adultsCount: 1,
      childrenCount: 0,
      hasPets: null,
      petsNote: null,
      smokingStatus: null,
    });
  });

  it("always sends both household counts together", () => {
    const payload = toPayload(INITIAL_PROFILE);

    expect(typeof payload.adultsCount).toBe("number");
    expect(typeof payload.childrenCount).toBe("number");
  });

  it("never sends the derived people count", () => {
    expect(toPayload(INITIAL_PROFILE)).not.toHaveProperty("peopleCount");
  });

  it("drops the pets note when pets are not confirmed", () => {
    expect(
      toPayload({
        ...INITIAL_PROFILE,
        pets: "nein",
        petsNote: "1 Katze",
      }).petsNote,
    ).toBeNull();
  });

  it("keeps the trimmed pets note when pets are confirmed", () => {
    expect(
      toPayload({
        ...INITIAL_PROFILE,
        pets: "ja",
        petsNote: "  1 Katze  ",
      }).petsNote,
    ).toBe("1 Katze");
  });

  it("parses the income into a number", () => {
    expect(
      toPayload({ ...INITIAL_PROFILE, income: "3200" }).householdNetIncome,
    ).toBe(3200);
  });
});
