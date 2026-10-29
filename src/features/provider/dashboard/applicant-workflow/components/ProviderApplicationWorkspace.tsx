"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { UserRoundX } from "lucide-react";
import { ConfirmationModal } from "@/components/ui/confirmation-modal/ConfirmationModal";
import { getProviderListing } from "@/features/provider/listing-detail/api/provider-listing-detail";
import type { ListingDetail } from "@/features/provider/listing-detail/types";
import { dashboardReturnHref, readDeepLink } from "@/lib/navigation/deep-link";
import { useUrlSearch } from "@/lib/navigation/url-search";
import { dashboardCopy } from "../../copy/dashboard";
import { useCandidateRejection } from "../../hooks/useCandidateRejection";
import { selectDashboardListing } from "../../selected-object-storage";
import { workflowListingContext } from "../workflow-model";
import { ApplicantWorkspaceView } from "./ApplicantWorkspaceView";

export function ProviderApplicationWorkspace({
  applicationId,
}: {
  readonly applicationId: string;
}) {
  const router = useRouter();
  const locationSearch = useUrlSearch();
  const link = useMemo(
    () => readDeepLink(new URLSearchParams(locationSearch)),
    [locationSearch],
  );
  const listingId = link.listingId;
  const returnHref = dashboardReturnHref(listingId);
  const [detail, setDetail] = useState<ListingDetail | null>(null);
  const [rejectName, setRejectName] = useState<string | null>(null);
  const { state, rejectCandidate, reset } = useCandidateRejection();
  const workspaceRef = useRef<HTMLDivElement>(null);
  const listing = useMemo(
    () =>
      workflowListingContext(
        listingId,
        detail && detail.id === listingId ? detail : null,
      ),
    [detail, listingId],
  );

  useEffect(() => {
    if (!listingId) return;
    selectDashboardListing(listingId);
    let active = true;
    getProviderListing(listingId)
      .then((next) => {
        if (active) setDetail(next);
      })
      .catch(() => {
        if (active) setDetail(null);
      });
    return () => {
      active = false;
    };
  }, [listingId]);

  function leave() {
    router.push(returnHref);
  }

  async function confirmRejection() {
    const rejected = await rejectCandidate(applicationId);
    if (!rejected) return;
    setRejectName(null);
    leave();
  }

  return (
    <>
      <div ref={workspaceRef}>
        <ApplicantWorkspaceView
          applicationId={applicationId}
          listing={listing}
          focus={link}
          returnHref={returnHref}
          onClose={leave}
          onReject={(applicantName) => {
            reset();
            setRejectName(applicantName);
          }}
          onSelected={leave}
        />
      </div>
      <ConfirmationModal
        open={rejectName !== null}
        title={dashboardCopy.candidates.rejectTitle}
        text={dashboardCopy.candidates.rejectText(rejectName ?? "")}
        primaryLabel={dashboardCopy.candidates.rejectConfirm}
        primaryPendingLabel={dashboardCopy.candidates.rejectPending}
        primaryPending={state.status === "submitting"}
        primaryVariant="danger"
        secondaryLabel={dashboardCopy.candidates.rejectCancel}
        onPrimary={() => void confirmRejection()}
        onSecondary={() => {
          if (state.status === "submitting") return;
          reset();
          setRejectName(null);
        }}
        onClose={() => {
          if (state.status === "submitting") return;
          reset();
          setRejectName(null);
        }}
        closeLabel={dashboardCopy.candidates.rejectCancel}
        error={
          state.status === "error" ? dashboardCopy.candidates.rejectError : null
        }
        icon={UserRoundX}
        focusFallbackRef={workspaceRef}
      />
    </>
  );
}
