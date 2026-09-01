import type {
  ProviderExitedApplication,
  ProviderExitedApplicationPublicReason,
  ProviderExitedApplicationStatus,
} from "./provider-exited-applications";
import type { ExitedApplicant, ExitedApplicantVisualState } from "../types";

const FULL_DATE_FORMATTER = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "Europe/Berlin",
});

const COMPACT_DATE_FORMATTER = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "Europe/Berlin",
});

const TIME_FORMATTER = new Intl.DateTimeFormat("de-DE", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Berlin",
});

function formatExitedAt(iso: string): { full: string; compact: string } {
  const date = new Date(iso);
  const time = TIME_FORMATTER.format(date);
  return {
    full: `${FULL_DATE_FORMATTER.format(date)} · ${time}`,
    compact: `${COMPACT_DATE_FORMATTER.format(date)} · ${time}`,
  };
}

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
  const { full, compact } = formatExitedAt(application.exitedAt);
  return {
    id: application.id,
    listingId: application.listingId,
    applicantName: application.applicantName,
    visualState: deriveVisualState(
      application.status,
      application.publicReason,
    ),
    exitedAt: application.exitedAt,
    exitedAtLabel: full,
    exitedAtLabelCompact: compact,
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
