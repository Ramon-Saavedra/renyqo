"use client";

import { useEffect, useRef, useState } from "react";
import { ApiError } from "@/lib/api/client";
import {
  buildListingReportPayload,
  reportListing,
  type ListingReport,
  type ListingReportPayloadError,
  type ListingReportReason,
} from "../api/listing-report";
import { listingDetailCopy } from "../copy/listing-detail";

export type ListingReportStatus = "idle" | "submitting" | "success" | "error";

export interface UseListingReportResult {
  readonly status: ListingReportStatus;
  readonly error: string | null;
  readonly validationCode: ListingReportPayloadError | "reason-required" | null;
  readonly submit: (
    reason: ListingReportReason | null,
    detail: string,
  ) => Promise<ListingReport | null>;
  readonly reset: () => void;
}

function messageFor(error: unknown): string {
  const { report } = listingDetailCopy;
  if (!(error instanceof ApiError)) return report.error;
  if (error.status === 401) return report.errorAuth;
  if (error.status === 409) return report.errorDuplicate;
  if (error.status === 429) return report.errorRateLimited;
  return report.error;
}

export function useListingReport(listingId: string): UseListingReportResult {
  const [status, setStatus] = useState<ListingReportStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [validationCode, setValidationCode] = useState<
    ListingReportPayloadError | "reason-required" | null
  >(null);
  const [syncedListingId, setSyncedListingId] = useState(listingId);
  const isSubmittingRef = useRef(false);
  const listingIdRef = useRef(listingId);

  if (listingId !== syncedListingId) {
    setSyncedListingId(listingId);
    setStatus("idle");
    setError(null);
    setValidationCode(null);
  }

  useEffect(() => {
    listingIdRef.current = listingId;
    isSubmittingRef.current = false;
  }, [listingId]);

  const reset = () => {
    setStatus("idle");
    setError(null);
    setValidationCode(null);
    isSubmittingRef.current = false;
  };

  const submit = async (
    reason: ListingReportReason | null,
    detail: string,
  ): Promise<ListingReport | null> => {
    if (isSubmittingRef.current) return null;
    if (reason === null) {
      setValidationCode("reason-required");
      setError(null);
      return null;
    }

    const built = buildListingReportPayload(reason, detail);
    if (!built.ok) {
      setValidationCode(built.code);
      setError(null);
      return null;
    }

    isSubmittingRef.current = true;
    const targetId = listingId;
    setStatus("submitting");
    setError(null);
    setValidationCode(null);
    try {
      const result = await reportListing(targetId, built.payload);
      if (targetId !== listingIdRef.current) return null;
      setStatus("success");
      isSubmittingRef.current = false;
      return result;
    } catch (caught) {
      if (targetId !== listingIdRef.current) return null;
      setStatus("error");
      setError(messageFor(caught));
    }
    if (targetId === listingIdRef.current) {
      isSubmittingRef.current = false;
    }
    return null;
  };

  return { status, error, validationCode, submit, reset };
}
