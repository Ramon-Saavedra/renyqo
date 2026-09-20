import { ApiError, apiGet } from "@/lib/api/client";
import type * as ApiClient from "@/lib/api/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { INITIAL_PROFILE } from "../utils/profile-validation";
import {
  getApplicantIntroductionValidationError,
  getApplicantProfile,
  ApplicantProfileContractError,
  toDraft,
  toPayload,
} from "./applicant-profile";

vi.mock("@/lib/api/client", async (importOriginal) => {
  const actual = await importOriginal<typeof ApiClient>();
  return { ...actual, apiGet: vi.fn() };
});

const validResponse = {
  introduction: "Ich suche ein Zuhause.",
  householdNetIncome: 3200,
  incomeProofAvailable: true,
  schufaAvailable: false,
  peopleCount: 3,
  adultsCount: 2,
  childrenCount: 1,
  hasPets: true,
  isSmoker: false,
};

describe("applicant-profile mapping", () => {
  beforeEach(() => vi.clearAllMocks());

  it("maps a populated response onto the draft", () => {
    expect(toDraft(validResponse)).toEqual({
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
    expect(toDraft({ ...validResponse, introduction: null }).introduction).toBe(
      "",
    );
  });

  it("preserves a valid introduction from the API response", async () => {
    vi.mocked(apiGet).mockResolvedValue(validResponse);

    await expect(getApplicantProfile()).resolves.toMatchObject({
      introduction: "Ich suche ein Zuhause.",
    });
  });

  it("normalizes a legacy null introduction from the API response", async () => {
    vi.mocked(apiGet).mockResolvedValue({
      ...validResponse,
      introduction: null,
    });

    await expect(getApplicantProfile()).resolves.toMatchObject({
      introduction: "",
    });
  });

  it.each([42, {}, [], true])(
    "rejects an invalid API introduction value: %s",
    async (introduction) => {
      vi.mocked(apiGet).mockResolvedValue({ ...validResponse, introduction });

      await expect(getApplicantProfile()).rejects.toBeInstanceOf(
        ApplicantProfileContractError,
      );
    },
  );

  it("rejects an API response with a missing introduction", async () => {
    const responseWithoutIntroduction = Object.fromEntries(
      Object.entries(validResponse).filter(([key]) => key !== "introduction"),
    );
    vi.mocked(apiGet).mockResolvedValue(responseWithoutIntroduction);

    await expect(getApplicantProfile()).rejects.toBeInstanceOf(
      ApplicantProfileContractError,
    );
  });

  it("uses the empty draft when the profile endpoint returns 404", async () => {
    vi.mocked(apiGet).mockRejectedValue(new ApiError(404, "not found"));

    await expect(getApplicantProfile()).resolves.toBeNull();
  });

  it("round-trips the smoker boolean", () => {
    expect(toDraft({ ...validResponse, isSmoker: true }).smoker).toBe("ja");
    expect(toDraft({ ...validResponse, isSmoker: false }).smoker).toBe("nein");
    expect(toPayload({ ...INITIAL_PROFILE, smoker: "ja" }).isSmoker).toBe(true);
  });

  it("clamps out-of-range household counts", () => {
    const draft = toDraft({
      ...validResponse,
      adultsCount: 99,
      childrenCount: -4,
    });

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
            "introduction must be shorter than or equal to 250 characters",
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
