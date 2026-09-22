import {
  buildInitials,
  DASHBOARD_DATE_FORMATTER,
  formatActiveAtLabel,
  formatHousehold,
} from "../utils/applicant-format";
import type {
  ProviderExitedApplication,
  ProviderExitedApplicationPublicReason,
  ProviderExitedApplicationStatus,
} from "./provider-exited-applications";
import type { ExitedApplicant, ExitedApplicantVisualState } from "../types";

function deriveVisualState(
  status: ProviderExitedApplicationStatus,
  publicReason: ProviderExitedApplicationPublicReason,
): ExitedApplicantVisualState {
  if (status === "WITHDRAWN") return "withdrawn";
  if (publicReason === "NOT_SELECTED") return "provider_discarded";
  return "system_removed";
}

export function mapExitedApplicationToExit(
  application: ProviderExitedApplication,
): ExitedApplicant {
  return {
    id: application.id,
    listingId: application.listingId,
    applicantName: application.applicantName,
    initials: buildInitials(application.applicantName),
    household: formatHousehold(application.peopleCount),
    introduction: application.introduction,
    visualState: deriveVisualState(
      application.status,
      application.publicReason,
    ),
    activeAtLabel: formatActiveAtLabel(application.activeAt),
    exitedAtDateLabel: DASHBOARD_DATE_FORMATTER.format(
      new Date(application.exitedAt),
    ),
  };
}

export function mapExitedApplicationsToExits(
  applications: readonly ProviderExitedApplication[],
): ExitedApplicant[] {
  return [...applications]
    .sort(
      (a, b) => new Date(b.exitedAt).getTime() - new Date(a.exitedAt).getTime(),
    )
    .map(mapExitedApplicationToExit);
}
