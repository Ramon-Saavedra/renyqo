import { ApiError } from "@/lib/api/client";
import { describe, expect, it } from "vitest";

import { INITIAL_PROFILE } from "../utils/profile-validation";
import {
  getApplicantIntroductionValidationError,
  toDraft,
  toPayload,
} from "./applicant-profile";

describe("applicant-profile mapping", () => {
  it("maps a populated response onto the draft", () => {
    expect(
      toDraft({
        introduction: "Ich suche ein Zuhause.",
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
      introduction: "Ich suche ein Zuhause.",
      income: "3200",
      adults: 2,
      children: 1,
      incomeProof: "ja",
      schufa: "nein",
      pets: "ja",
      smoker: "nein",
    });
  });

  it("normalizes a legacy null introduction to an empty draft value", () => {
    expect(toDraft({ introduction: null }).introduction).toBe("");
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
      introduction: "",
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

  it("trims the introduction in the PATCH payload", () => {
    expect(
      toPayload({ ...INITIAL_PROFILE, introduction: "  Kurz vorgestellt.  " }),
    ).toMatchObject({ introduction: "Kurz vorgestellt." });
  });

  it("recognizes known backend introduction validation errors", () => {
    expect(
      getApplicantIntroductionValidationError(
        new ApiError(422, "validation failed", "http", null, {
          message: [
            "introduction must be shorter than or equal to 100 characters",
          ],
        }),
      ),
    ).toBe("tooLong");
  });

  it("recognizes the string form of a required introduction error", () => {
    expect(
      getApplicantIntroductionValidationError(
        new ApiError(400, "validation failed", "http", null, {
          message:
            "A personal introduction is required for the applicant profile",
        }),
      ),
    ).toBe("required");
  });

  it("maps an introduction content validation error without exposing its payload", () => {
    expect(
      getApplicantIntroductionValidationError(
        new ApiError(400, "validation failed", "http", null, {
          message: ["introduction must not contain angle brackets"],
        }),
      ),
    ).toBe("invalid");
  });

  it("does not expose unknown backend errors as introduction errors", () => {
    expect(
      getApplicantIntroductionValidationError(
        new ApiError(500, "internal details", "http"),
      ),
    ).toBeNull();
  });
});
