import { applicationAdmissionCopy } from "../copy/application-admission";
import { listingDetailCopy } from "../copy/listing-detail";
import { listingsCopy } from "../copy/listings";
import type {
  ListingApplicationUi,
  ListingCompatibilityState,
  ListingProcessState,
} from "../utils/listing-card-badge";
import { MatchBadge, type MatchBadgeTone } from "./MatchBadge";

interface ListingSignalsProps {
  readonly ui: ListingApplicationUi;
  readonly surface: "card" | "detail";
}

const CARD_NOTE_CLASS =
  "self-center font-mono text-meta uppercase text-foreground-secondary";

const DETAIL_NOTE_CLASS = "self-center text-caption text-foreground-secondary";

function processLabel(process: ListingProcessState): string | null {
  switch (process) {
    case "applied":
      return applicationAdmissionCopy.applied;
    case "ended-profile":
      return applicationAdmissionCopy.endedProfile;
    case "not-selected":
      return applicationAdmissionCopy.notSelected;
    case "accepted":
      return applicationAdmissionCopy.accepted;
    case "rented":
      return applicationAdmissionCopy.rented;
    case "unavailable":
      return applicationAdmissionCopy.unavailable;
    case "none":
      return null;
  }
}

function processTone(process: ListingProcessState): MatchBadgeTone {
  return process === "applied" ? "new" : "not-selected";
}

function soleCompatibilityLabel(
  compatibility: ListingCompatibilityState,
  surface: ListingSignalsProps["surface"],
): string | null {
  if (compatibility === "hidden") return null;
  if (surface === "card") {
    if (compatibility === "match") return listingsCopy.card.badgeMatch;
    if (compatibility === "no-match") return listingsCopy.card.badgeNoMatch;
    return null;
  }
  switch (compatibility) {
    case "match":
      return listingDetailCopy.match.matches;
    case "no-match":
      return listingDetailCopy.match.doesNotMatch;
    case "incomplete":
      return listingDetailCopy.match.incomplete;
    case "unknown":
      return listingDetailCopy.match.unknown;
  }
}

function secondaryCompatibilityLabel(
  process: ListingProcessState,
  compatibility: ListingCompatibilityState,
): string | null {
  if (
    process !== "none" &&
    (compatibility === "match" || compatibility === "no-match")
  ) {
    return null;
  }
  switch (compatibility) {
    case "match":
      return listingsCopy.card.badgeMatch;
    case "no-match":
      return listingsCopy.card.badgeNoMatch;
    case "incomplete":
      return listingDetailCopy.match.incomplete;
    case "unknown":
    case "hidden":
      return null;
  }
}

function compatibilityTone(
  compatibility: ListingCompatibilityState,
): MatchBadgeTone {
  if (
    compatibility === "match" ||
    compatibility === "no-match" ||
    compatibility === "incomplete"
  ) {
    return compatibility;
  }
  return "new";
}

export function ListingSignals({ ui, surface }: ListingSignalsProps) {
  const size = surface === "detail" ? "md" : "sm";
  const process = processLabel(ui.process);
  if (!process) {
    const label = soleCompatibilityLabel(ui.compatibility, surface);
    if (!label) return null;
    return (
      <MatchBadge tone={compatibilityTone(ui.compatibility)} size={size}>
        {label}
      </MatchBadge>
    );
  }
  const note = secondaryCompatibilityLabel(ui.process, ui.compatibility);
  return (
    <>
      <MatchBadge tone={processTone(ui.process)} size={size}>
        {process}
      </MatchBadge>
      {note ? (
        <span
          className={surface === "detail" ? DETAIL_NOTE_CLASS : CARD_NOTE_CLASS}
        >
          {note}
        </span>
      ) : null}
    </>
  );
}
