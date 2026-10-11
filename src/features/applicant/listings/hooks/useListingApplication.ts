"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "@/lib/api/client";
import {
  applyToListing,
  ListingEligibilityRejectedError,
  type ListingApplication,
} from "../api/listing-application";
import {
  applicationSubmissionBlockReasonSchema,
  type ApplicationAdmission,
  type ApplicationSubmissionBlockReason,
} from "../api/application-admission";
import type { ListingEligibility } from "../api/listing-eligibility";
import {
  applicationAdmissionCopy,
  applicationBlockCopy,
} from "../copy/application-admission";
import { invalidateListingApplicationData } from "../utils/listing-data-invalidation";
export type ListingApplicationState =
  | { readonly status: "idle" }
  | { readonly status: "submitting" }
  | { readonly status: "success"; readonly application: ListingApplication }
  | {
      readonly status: "eligibility-rejected";
      readonly eligibility: ListingEligibility;
    }
  | {
      readonly status: "error";
      readonly message: string;
      readonly blockReason: ApplicationSubmissionBlockReason | null;
    };
function messageFor(error: unknown): string {
  if (!(error instanceof ApiError)) return applicationAdmissionCopy.failed;
  if (error.status === 409) {
    const reason = applicationSubmissionBlockReasonSchema.safeParse(error.code);
    if (reason.success) {
      return applicationBlockCopy[reason.data];
    }
    return error.code === null
      ? applicationAdmissionCopy.duplicate
      : applicationAdmissionCopy.failed;
  }
  if (error.status === 404) return applicationAdmissionCopy.notFound;
  if (error.status === 422)
    return applicationBlockCopy.LISTING_NOT_ACCEPTING_APPLICATIONS;
  if (error.status === 401) return applicationBlockCopy.AUTHENTICATION_REQUIRED;
  if (error.status === 403) return applicationAdmissionCopy.forbidden;
  if (error.status === 429) return applicationAdmissionCopy.rateLimited;
  return applicationAdmissionCopy.failed;
}
export function useListingApplication(id: string) {
  const [state, setState] = useState<ListingApplicationState>({
    status: "idle",
  });
  const isSubmittingRef = useRef(false);
  const generation = useRef(0);
  const [trackedId, setTrackedId] = useState(id);
  if (trackedId !== id) {
    setTrackedId(id);
    setState({ status: "idle" });
  }
  const reset = useCallback(() => setState({ status: "idle" }), []);
  const reconcile = useCallback(
    (admission: ApplicationAdmission) =>
      setState((current) =>
        current.status === "success" ||
        current.status === "eligibility-rejected" ||
        (current.status === "error" &&
          current.blockReason !== null &&
          (admission.canSubmitApplication ||
            admission.submissionBlockReason !== current.blockReason))
          ? { status: "idle" }
          : current,
      ),
    [],
  );
  useEffect(() => {
    return () => {
      generation.current += 1;
      isSubmittingRef.current = false;
    };
  }, [id]);
  const submit = async (): Promise<ListingApplication | undefined> => {
    if (isSubmittingRef.current || state.status === "success") return;
    const requestGeneration = generation.current;
    isSubmittingRef.current = true;
    setState({ status: "submitting" });
    try {
      const application = await applyToListing(id);
      invalidateListingApplicationData();
      if (requestGeneration !== generation.current) return;
      setState({ status: "success", application });
      return application;
    } catch (error) {
      invalidateListingApplicationData();
      if (requestGeneration !== generation.current) return;
      if (error instanceof ListingEligibilityRejectedError)
        setState({
          status: "eligibility-rejected",
          eligibility: error.eligibility,
        });
      else {
        const reason = applicationSubmissionBlockReasonSchema.safeParse(
          error instanceof ApiError && error.status === 409 ? error.code : null,
        );
        setState({
          status: "error",
          message: messageFor(error),
          blockReason: reason.success ? reason.data : null,
        });
      }
    } finally {
      if (requestGeneration === generation.current)
        isSubmittingRef.current = false;
    }
  };
  return { state, submit, reset, reconcile } as const;
}
