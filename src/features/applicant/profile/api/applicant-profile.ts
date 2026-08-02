import { ApiError, apiGet, apiPatch } from "@/lib/api/client";
import {
  INITIAL_PROFILE,
  type ApplicantProfileDraft,
} from "../utils/profile-validation";
import type { SmokerOption, YesNoOption } from "../copy/applicant-profile";

const APPLICANT_PROFILE_PATH = "/api/v1/applicant/profile";

export type SmokingStatusBackend = "SMOKER" | "NON_SMOKER" | "OCCASIONALLY";

export interface ApplicantProfileResponse {
  readonly householdNetIncome: number | null;
  readonly incomeProofAvailable: boolean | null;
  readonly schufaAvailable: boolean | null;
  readonly peopleCount: number | null;
  readonly adultsCount: number | null;
  readonly childrenCount: number | null;
  readonly hasPets: boolean | null;
  readonly petsNote: string | null;
  readonly smokingStatus: SmokingStatusBackend | null;
}

export interface ApplicantProfilePayload {
  readonly householdNetIncome: number | null;
  readonly incomeProofAvailable: boolean | null;
  readonly schufaAvailable: boolean | null;
  readonly adultsCount: number;
  readonly childrenCount: number;
  readonly hasPets: boolean | null;
  readonly petsNote: string | null;
  readonly smokingStatus: SmokingStatusBackend | null;
}

const SMOKER_TO_BACKEND: Record<
  Exclude<SmokerOption, "">,
  SmokingStatusBackend
> = {
  nichtraucher: "NON_SMOKER",
  raucher: "SMOKER",
  gelegentlich: "OCCASIONALLY",
};

const SMOKER_FROM_BACKEND: Record<SmokingStatusBackend, SmokerOption> = {
  NON_SMOKER: "nichtraucher",
  SMOKER: "raucher",
  OCCASIONALLY: "gelegentlich",
};

function toYesNo(value: boolean | null): YesNoOption {
  if (value === true) return "ja";
  if (value === false) return "nein";
  return "";
}

function fromYesNo(value: YesNoOption): boolean | null {
  if (value === "ja") return true;
  if (value === "nein") return false;
  return null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function toDraft(
  response: Partial<ApplicantProfileResponse>,
): ApplicantProfileDraft {
  const smokingStatus = response.smokingStatus ?? null;

  return {
    income:
      typeof response.householdNetIncome === "number"
        ? String(response.householdNetIncome)
        : INITIAL_PROFILE.income,
    adults:
      typeof response.adultsCount === "number"
        ? clamp(response.adultsCount, 1, 8)
        : INITIAL_PROFILE.adults,
    children:
      typeof response.childrenCount === "number"
        ? clamp(response.childrenCount, 0, 8)
        : INITIAL_PROFILE.children,
    incomeProof: toYesNo(response.incomeProofAvailable ?? null),
    schufa: toYesNo(response.schufaAvailable ?? null),
    pets: toYesNo(response.hasPets ?? null),
    petsNote: response.petsNote ?? INITIAL_PROFILE.petsNote,
    smoker: smokingStatus ? SMOKER_FROM_BACKEND[smokingStatus] : "",
  };
}

export function toPayload(
  draft: ApplicantProfileDraft,
): ApplicantProfilePayload {
  const income = draft.income.trim();
  const note = draft.petsNote.trim();

  return {
    householdNetIncome: income === "" ? null : Number.parseInt(income, 10),
    incomeProofAvailable: fromYesNo(draft.incomeProof),
    schufaAvailable: fromYesNo(draft.schufa),
    adultsCount: draft.adults,
    childrenCount: draft.children,
    hasPets: fromYesNo(draft.pets),
    petsNote: draft.pets === "ja" && note !== "" ? note : null,
    smokingStatus: draft.smoker === "" ? null : SMOKER_TO_BACKEND[draft.smoker],
  };
}

export async function getApplicantProfile(): Promise<ApplicantProfileDraft | null> {
  try {
    const response = await apiGet<ApplicantProfileResponse>(
      APPLICANT_PROFILE_PATH,
    );
    return toDraft(response);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function saveApplicantProfile(
  draft: ApplicantProfileDraft,
): Promise<void> {
  await apiPatch<ApplicantProfileResponse>(
    APPLICANT_PROFILE_PATH,
    toPayload(draft),
  );
}
