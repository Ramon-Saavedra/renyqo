import {
  buildInitials,
  formatActiveAtLabel,
  formatHousehold,
} from "../utils/applicant-format";
import type { Candidate } from "../types";
import type { ProviderActiveApplication } from "./provider-listing-applications";

export function mapActiveApplicationToCandidate(
  application: ProviderActiveApplication,
): Candidate {
  return {
    id: application.id,
    objectId: application.listingId,
    initials: buildInitials(application.applicant.name),
    name: application.applicant.name,
    household: formatHousehold(application.applicant.peopleCount),
    warnings: application.applicant.warnings,
    introduction: application.applicant.introduction,
    activeAtLabel: formatActiveAtLabel(application.activeAt),
  };
}

export function mapActiveApplicationsToCandidates(
  applications: readonly ProviderActiveApplication[],
): Candidate[] {
  return applications.map(mapActiveApplicationToCandidate);
}
