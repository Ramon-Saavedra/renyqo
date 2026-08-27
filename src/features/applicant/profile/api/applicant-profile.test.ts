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
        isSmoker: false,
      }),
    ).toEqual({
      income: "3200",
      adults: 2,
      children: 1,
      incomeProof: "ja",
      schufa: "nein",
      pets: "ja",
      smoker: "nein",
    });
  });

  it("falls back to the initial draft for an empty profile", () => {
    expect(toDraft({})).toEqual(INITIAL_PROFILE);
  });

  it("round-trips the smoker boolean", () => {
    expect(toDraft({ isSmoker: true }).smoker).toBe("ja");
    expect(toDraft({ isSmoker: false }).smoker).toBe("nein");
    expect(toPayload({ ...INITIAL_PROFILE, smoker: "ja" }).isSmoker).toBe(true);
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
      isSmoker: null,
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

  it("parses the income into a number", () => {
    expect(
      toPayload({ ...INITIAL_PROFILE, income: "3200" }).householdNetIncome,
    ).toBe(3200);
  });
});
