"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button, buttonClass } from "@/components/ui/button/Button";
import { applicationWorkspaceHref } from "@/lib/attention/navigation";
import type { ApplicationAdmission } from "../../api/application-admission";
import { listingDetailCopy } from "../../copy/listing-detail";
import {
  applicationAdmissionCopy,
  applicationBlockCopy,
} from "../../copy/application-admission";
import { useListingApplication } from "../../hooks/useListingApplication";
import type { ListingViewerSessionStatus } from "../../hooks/useListingViewerSession";
import { useListingWithdrawal } from "../../hooks/useListingWithdrawal";
import type { ProfileMatchResult } from "../../types";
import type { ListingApplicationPublicReason } from "../../types";
import { LISTING_REGISTER_PATH } from "../../utils/listing-auth-paths";
import { resolveListingApplicationUi } from "../../utils/listing-card-badge";
import { invalidateListingApplicationData } from "../../utils/listing-data-invalidation";
import { ListingSignals } from "../ListingSignals";

const APPLICATIONS_OVERVIEW_PATH = "/applicant/applications";

function applicationNavigation(admission: ApplicationAdmission): {
  readonly href: string;
  readonly label: string;
} | null {
  if (admission.currentApplicationId !== null) {
    return {
      href: applicationWorkspaceHref(admission.currentApplicationId),
      label: applicationAdmissionCopy.openApplication,
    };
  }
  if (admission.hasApplicationHistory) {
    return {
      href: APPLICATIONS_OVERVIEW_PATH,
      label: applicationAdmissionCopy.myApplications,
    };
  }
  return null;
}
interface ListingApplyBoxProps {
  listingId: string;
  session: ListingViewerSessionStatus;
  matchesProfile: ProfileMatchResult;
  admission: ApplicationAdmission;
  publicReason: ListingApplicationPublicReason | null;
}
const BOX_CLASS =
  "flex w-fit flex-col gap-2.5 rounded-md border border-border p-4 max-sm:w-full";
export function ListingApplyBox({
  listingId,
  session,
  matchesProfile,
  admission,
  publicReason,
}: ListingApplyBoxProps) {
  const { state, submit, reset, reconcile } = useListingApplication(listingId);
  const ui = resolveListingApplicationUi({
    admission,
    matchesProfile,
    publicReason,
  });
  const { state: withdrawalState, withdraw } = useListingWithdrawal(
    ui.action === "withdraw" ? admission.currentApplicationId : null,
  );
  useEffect(() => reconcile(admission), [admission, reconcile]);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  useEffect(() => {
    if (confirmation === null) return;
    const timeout = setTimeout(() => setConfirmation(null), 4000);
    return () => clearTimeout(timeout);
  }, [confirmation]);
  const handleApply = async () => {
    if (!admission.canSubmitApplication) return;
    const result = await submit();
    if (result)
      setConfirmation(
        result.status === "ACTIVE"
          ? applicationAdmissionCopy.sent
          : applicationAdmissionCopy.waiting,
      );
  };
  const handleWithdraw = async () => {
    if (await withdraw()) {
      reset();
      invalidateListingApplicationData();
      setConfirmation(applicationAdmissionCopy.withdrawn);
    }
  };
  if (session === "loading" || session === "error")
    return <div className={BOX_CLASS} aria-busy="true" />;
  if (session === "other") return null;
  if (session === "anonymous")
    return (
      <div className={BOX_CLASS}>
        <p className="text-caption text-foreground-secondary">
          {listingDetailCopy.apply.anonymousLead}
        </p>
        <Link href={LISTING_REGISTER_PATH} className={buttonClass("primary")}>
          {listingDetailCopy.apply.start}
        </Link>
      </div>
    );
  const navigation = applicationNavigation(admission);
  return (
    <div className={BOX_CLASS}>
      <div className="flex flex-wrap items-center gap-3">
        <ListingSignals ui={ui} surface="detail" />
        {ui.action === "withdraw" ? (
          <Button
            variant="danger"
            disabled={
              withdrawalState.status === "submitting" ||
              withdrawalState.status === "success"
            }
            onClick={() => void handleWithdraw()}
          >
            {withdrawalState.status === "submitting"
              ? applicationAdmissionCopy.withdrawing
              : applicationAdmissionCopy.withdraw}
          </Button>
        ) : (
          <Button
            variant="primary"
            disabled={
              ui.action !== "submit" ||
              state.status === "submitting" ||
              state.status === "success"
            }
            onClick={() => void handleApply()}
          >
            {state.status === "submitting"
              ? applicationAdmissionCopy.sending
              : applicationAdmissionCopy.apply}
          </Button>
        )}
        {navigation ? (
          <Link href={navigation.href} className={buttonClass("outline")}>
            {navigation.label}
          </Link>
        ) : null}
      </div>
      {ui.process === "ended-profile" && ui.compatibility === "no-match" && (
        <p className="text-caption text-foreground-secondary">
          {applicationAdmissionCopy.endedProfileDetail}
        </p>
      )}
      {ui.blockReason &&
        ui.blockReason !== "CURRENT_APPLICATION_EXISTS" &&
        !(
          ui.process === "ended-profile" &&
          ui.blockReason === "APPLICANT_NOT_ELIGIBLE"
        ) && (
          <p className="text-caption text-foreground-secondary">
            {applicationBlockCopy[ui.blockReason]}
          </p>
        )}
      {confirmation && (
        <p role="status" className="text-caption text-success">
          {confirmation}
        </p>
      )}
      {state.status === "error" && (
        <p role="alert" className="text-caption text-danger">
          {state.message}
        </p>
      )}
      {withdrawalState.status === "error" && (
        <p role="alert" className="text-caption text-danger">
          {applicationAdmissionCopy.withdrawalFailed}
        </p>
      )}
    </div>
  );
}
