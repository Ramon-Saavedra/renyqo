import {
  applicantProfileCopy,
  type SmokerOption,
  type YesNoOption,
} from "../copy/applicant-profile";

export interface ApplicantProfileDraft {
  income: string;
  adults: number;
  children: number;
  incomeProof: YesNoOption;
  schufa: YesNoOption;
  pets: YesNoOption;
  petsNote: string;
  smoker: SmokerOption;
}

export interface ApplicantProfileErrors {
  income?: string;
}

export const INITIAL_PROFILE: ApplicantProfileDraft = {
  income: "",
  adults: 1,
  children: 0,
  incomeProof: "",
  schufa: "",
  pets: "",
  petsNote: "",
  smoker: "",
};

export const PROFILE_CHECKLIST_ITEMS: ReadonlyArray<{
  label: string;
  targetId: string;
}> = [
  {
    label: applicantProfileCopy.missingLabels.income,
    targetId: "household-income",
  },
  {
    label: applicantProfileCopy.missingLabels.incomeProof,
    targetId: "income-proof",
  },
  { label: applicantProfileCopy.missingLabels.schufa, targetId: "schufa" },
  { label: applicantProfileCopy.missingLabels.pets, targetId: "pets" },
  { label: applicantProfileCopy.missingLabels.smoker, targetId: "smoker" },
];

export const ADULTS_MIN = 1;
export const ADULTS_MAX = 8;
export const CHILDREN_MIN = 0;
export const CHILDREN_MAX = 8;

export function getHouseholdSize(draft: ApplicantProfileDraft): number {
  return draft.adults + draft.children;
}

export function formatHouseholdSize(size: number): string {
  const unit =
    size === 1
      ? applicantProfileCopy.household.fields.householdSize.unitSingular
      : applicantProfileCopy.household.fields.householdSize.unitPlural;
  return `${size} ${unit}`;
}

export function getProfileErrors(
  draft: ApplicantProfileDraft,
): ApplicantProfileErrors {
  const income = draft.income.trim();
  if (income !== "" && Number.parseInt(income, 10) <= 0) {
    return { income: applicantProfileCopy.validation.income };
  }
  return {};
}

export function getMissingProfileFields(
  draft: ApplicantProfileDraft,
): ReadonlyArray<string> {
  const labels = applicantProfileCopy.missingLabels;
  const missing: string[] = [];

  if (draft.income.trim() === "") missing.push(labels.income);
  if (draft.incomeProof === "") missing.push(labels.incomeProof);
  if (draft.schufa === "") missing.push(labels.schufa);
  if (draft.pets === "") missing.push(labels.pets);
  if (draft.smoker === "") missing.push(labels.smoker);

  return missing;
}

export function isProfileComplete(draft: ApplicantProfileDraft): boolean {
  return (
    getMissingProfileFields(draft).length === 0 &&
    Object.keys(getProfileErrors(draft)).length === 0
  );
}

export function canSaveProfile(draft: ApplicantProfileDraft): boolean {
  return Object.keys(getProfileErrors(draft)).length === 0;
}
