"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button/Button";
import { listingDetailCopy } from "../../copy/listing-detail";
import type {
  EligibilityReason,
  EligibilityWarning,
} from "../../api/listing-eligibility";
import { useListingApplication } from "../../hooks/useListingApplication";
import { useListingEligibility } from "../../hooks/useListingEligibility";
import { useListingWithdrawal } from "../../hooks/useListingWithdrawal";
import { useApplicantListingApplication } from "../../hooks/useApplicantListingApplication";
import type { ProfileMatchResult } from "../../types";
import { MatchBadge, type MatchBadgeTone } from "../MatchBadge";

interface ListingApplyBoxProps {
  listingId: string;
  matchesProfile: ProfileMatchResult;
}

const BOX_CLASS =
  "flex w-fit flex-col gap-2.5 rounded-lg border border-border p-4 max-sm:w-full";

const ACTION_ROW_CLASS = "flex items-center gap-3";

const { apply, match } = listingDetailCopy;

function matchTone(value: ProfileMatchResult): MatchBadgeTone {
  if (value === "match") return "match";
  if (value === "no-match") return "no-match";
  return "incomplete";
}

function matchLabel(value: ProfileMatchResult): string {
  if (value === "match") return match.matches;
  if (value === "no-match") return match.doesNotMatch;
  if (value === "incomplete") return match.incomplete;
  return match.unknown;
}

const WARNING_COPY: Record<EligibilityWarning, string> = {
  pets_by_arrangement: "Haustiere sind nach Absprache möglich.",
  smoking_by_arrangement: "Rauchen ist nach Absprache möglich.",
  smoking_not_preferred: "Nichtrauchen wird bevorzugt.",
};

const REASON_COPY: Record<EligibilityReason, string> = {
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
};

export function ListingApplyBox({
  listingId,
  matchesProfile,
}: ListingApplyBoxProps) {
  const { eligibility, status } = useListingEligibility(listingId);
  const { state, submit, reset } = useListingApplication(listingId);
  const {
    application: existingApplication,
    status: existingApplicationStatus,
    refresh,
  } = useApplicantListingApplication(listingId);
  const application =
    state.status === "success" ? state.application : existingApplication;
  const currentApplication =
    application?.listingId === listingId ? application : null;
  const hasExistingApplication =
    existingApplicationStatus === "loaded" && currentApplication !== null;
  const activeApplication =
    currentApplication?.status === "ACTIVE" ||
    currentApplication?.status === "WAITING";
  const withdrawnApplication = currentApplication?.status === "WITHDRAWN";
  const terminalApplication =
    currentApplication?.status === "REJECTED" ||
    currentApplication?.status === "ACCEPTED";
  const applicationId = activeApplication ? currentApplication.id : null;
  const {
    state: withdrawalState,
    withdraw,
    reset: resetWithdrawal,
  } = useListingWithdrawal(applicationId);
  const [showApplySuccess, setShowApplySuccess] = useState(false);
  const [showWithdrawalSuccess, setShowWithdrawalSuccess] = useState(false);
  const currentEligibility =
    state.status === "eligibility-rejected" ? state.eligibility : eligibility;
  const canApply = status === "loaded" && eligibility?.canApply === true;
  const submitting = state.status === "submitting";
  const eligibilityRejected = state.status === "eligibility-rejected";

  const showApplyConfirmation = () => {
    resetWithdrawal();
    setShowApplySuccess(true);
    setTimeout(() => setShowApplySuccess(false), 4000);
  };

  const showWithdrawalConfirmation = () => {
    setShowWithdrawalSuccess(true);
    setTimeout(() => setShowWithdrawalSuccess(false), 4000);
  };

  const handleApply = async () => {
    const result = await submit();
    if (result === "duplicate") {
      await refresh();
      return;
    }
    if (result === "success") showApplyConfirmation();
  };

  const handleWithdraw = async () => {
    if (await withdraw()) {
      reset();
      await refresh();
      showWithdrawalConfirmation();
    }
  };

  return (
    <div className={BOX_CLASS}>
      <div className={ACTION_ROW_CLASS}>
        <MatchBadge
          tone={matchTone(matchesProfile)}
          size="md"
          className="min-w-0"
        >
          <span className="truncate">{matchLabel(matchesProfile)}</span>
        </MatchBadge>

        {activeApplication ? (
          <Button
            variant="outline"
            disabled={
              withdrawalState.status === "submitting" ||
              withdrawalState.status === "success"
            }
            onClick={() => void handleWithdraw()}
          >
            {withdrawalState.status === "submitting"
              ? "Bewerbung wird zurückgezogen …"
              : "Bewerbung zurückziehen"}
          </Button>
        ) : !hasExistingApplication || withdrawnApplication ? (
          <Button
            variant="primary"
            disabled={
              existingApplicationStatus !== "loaded" ||
              !canApply ||
              submitting ||
              eligibilityRejected
            }
            onClick={() => void handleApply()}
          >
            {submitting ? "Bewerbung wird gesendet …" : apply.label}
          </Button>
        ) : terminalApplication ? (
          <Button variant="primary" disabled>
            {apply.label}
          </Button>
        ) : null}
      </div>

      {status === "loading" && (
        <p className="text-caption text-foreground-tertiary">
          Voraussetzungen werden geprüft …
        </p>
      )}
      {status === "error" && (
        <p role="alert" className="text-caption text-danger">
          Die Voraussetzungen konnten nicht geprüft werden.
        </p>
      )}
      {existingApplicationStatus === "error" && (
        <div className="text-caption text-danger" role="alert">
          <p>Deine Bewerbung konnte nicht geladen werden.</p>
          <button
            type="button"
            className="mt-1 text-primary hover:text-primary-hover focus-visible:outline-none focus-visible:shadow-focus"
            onClick={() => void refresh()}
          >
            Erneut versuchen
          </button>
        </div>
      )}
      {currentEligibility &&
        !currentEligibility.canApply &&
        currentEligibility.reasons.length > 0 && (
          <div className="text-caption text-foreground-secondary">
            <p>Eine Bewerbung ist aktuell nicht möglich:</p>
            <ul className="mt-1 list-disc pl-4">
              {currentEligibility.reasons.map((reason) => (
                <li key={reason}>{REASON_COPY[reason]}</li>
              ))}
            </ul>
          </div>
        )}
      {currentEligibility?.canApply &&
        currentEligibility.warnings.length > 0 && (
          <ul className="list-disc pl-4 text-caption text-foreground-secondary">
            {currentEligibility.warnings.map((warning) => (
              <li key={warning}>{WARNING_COPY[warning]}</li>
            ))}
          </ul>
        )}
      {state.status === "success" && showApplySuccess && (
        <p role="status" className="text-caption text-success">
          {state.application.status === "ACTIVE"
            ? "Bewerbung erfolgreich gesendet."
            : "Deine Bewerbung wurde gesendet und steht aktuell auf der Warteliste."}
        </p>
      )}
      {existingApplicationStatus === "loaded" &&
        currentApplication &&
        (withdrawnApplication || terminalApplication) &&
        withdrawalState.status !== "success" && (
          <p role="status" className="text-caption text-foreground-secondary">
            {currentApplication.status === "WITHDRAWN" &&
              "Diese Bewerbung wurde zurückgezogen."}
            {currentApplication.status === "REJECTED" &&
              "Diese Bewerbung ist nicht mehr aktiv."}
            {currentApplication.status === "ACCEPTED" &&
              "Der Anbieter hat deine Bewerbung angenommen."}
          </p>
        )}
      {state.status === "error" && (
        <p role="alert" className="text-caption text-danger">
          {state.message}
        </p>
      )}
      {withdrawalState.status === "success" && showWithdrawalSuccess && (
        <p role="status" className="text-caption text-success">
          Deine Bewerbung wurde zurückgezogen.
        </p>
      )}
      {withdrawalState.status === "error" && (
        <p role="alert" className="text-caption text-danger">
          Die Bewerbung konnte nicht zurückgezogen werden.
        </p>
      )}
    </div>
  );
}
