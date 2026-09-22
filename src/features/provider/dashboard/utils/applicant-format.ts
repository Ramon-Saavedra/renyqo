import { dashboardCopy } from "../copy/dashboard";
import type { ApplicantPreview, Candidate, ExitedApplicant } from "../types";

const copy = dashboardCopy.candidates;

export const DASHBOARD_DATE_FORMATTER = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "Europe/Berlin",
});

export function buildInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

export function formatHousehold(peopleCount: number | null): string {
  return peopleCount === null
    ? copy.householdUnavailable
    : peopleCount === 1
      ? copy.householdOne
      : copy.householdMany(peopleCount);
}

export function formatActiveAtLabel(
  activeAt: string | null | undefined,
): string | null {
  if (!activeAt) return null;
  const date = new Date(activeAt);
  if (Number.isNaN(date.getTime())) return null;
  return DASHBOARD_DATE_FORMATTER.format(date);
}

export function mapApplicantToPreview(
  applicant: Candidate | ExitedApplicant,
): ApplicantPreview {
  return {
    id: applicant.id,
    initials: applicant.initials,
    name: "name" in applicant ? applicant.name : applicant.applicantName,
    household: applicant.household,
    introduction: applicant.introduction,
  };
}
