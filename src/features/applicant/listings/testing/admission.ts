import type { ApplicationAdmission } from "../api/application-admission";

export function createAdmission(
  overrides: Partial<ApplicationAdmission> = {},
): ApplicationAdmission {
  return {
    hasApplicationHistory: false,
    currentApplicationId: null,
    currentApplicationStatus: null,
    canSubmitApplication: true,
    submissionBlockReason: null,
    reapplyAvailableAt: null,
    ...overrides,
  };
}
