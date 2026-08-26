import { dashboardCopy } from "../copy/dashboard";
import type { Candidate } from "../types";
import type { ProviderActiveApplication } from "./provider-listing-applications";

const copy = dashboardCopy.candidates;

function buildInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

function formatHousehold(
  applicant: ProviderActiveApplication["applicant"],
): string {
  return applicant.peopleCount === null
    ? copy.householdUnavailable
    : applicant.peopleCount === 1
      ? copy.householdOne
      : copy.householdMany(applicant.peopleCount);
}

export function mapActiveApplicationToCandidate(
  application: ProviderActiveApplication,
): Candidate {
  return {
    id: application.id,
    objectId: application.listingId,
    initials: buildInitials(application.applicant.name),
    name: application.applicant.name,
    household: formatHousehold(application.applicant),
  };
}

export function mapActiveApplicationsToCandidates(
  applications: readonly ProviderActiveApplication[],
): Candidate[] {
  return applications.map(mapActiveApplicationToCandidate);
}
