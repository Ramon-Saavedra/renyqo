import type {
  EligibilityReason,
  EligibilityWarning,
} from "../api/listing-eligibility";

export const WARNING_COPY: Record<EligibilityWarning, string> = {
  pets_by_arrangement: "Haustiere sind nach Absprache möglich.",
  smoking_by_arrangement: "Rauchen ist nach Absprache möglich.",
};

export const REASON_COPY: Record<EligibilityReason, string> = {
  household_income_not_available: "Angaben zum Haushaltseinkommen fehlen.",
  household_income_below_requirement:
    "Das Haushaltseinkommen erfüllt die Mindestanforderung nicht.",
  schufa_required_but_not_available: "Eine SCHUFA-Auskunft ist erforderlich.",
  income_proof_required_but_not_available:
    "Ein Einkommensnachweis ist erforderlich.",
  household_size_not_available: "Angaben zur Haushaltsgröße fehlen.",
  household_size_exceeds_requirement:
    "Die Haushaltsgröße passt nicht zu diesem Objekt.",
  pets_not_allowed: "Haustiere sind für dieses Objekt nicht erlaubt.",
  smoking_not_allowed: "Rauchen ist für dieses Objekt nicht erlaubt.",
};
