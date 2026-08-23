"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getApplicantApplications, type ApplicantListingApplication } from "../api/applicant-applications";

export type ExistingApplicationStatus = "loading" | "loaded" | "error";

export function findCurrentApplicantListingApplication(
  applications: readonly ApplicantListingApplication[],
  listingId: string,
): ApplicantListingApplication | null {
  return applications.find((item) => item.listingId === listingId) ?? null;
}

export function useApplicantListingApplication(listingId: string) {
  const [application, setApplication] = useState<ApplicantListingApplication | null>(null);
  const [status, setStatus] = useState<ExistingApplicationStatus>("loading");
  const requestIdRef = useRef(0);
  const load = useCallback(async (signal?: AbortSignal) => {
    const requestId = ++requestIdRef.current;
    setStatus("loading");
    try {
      const applications = await getApplicantApplications(
        signal ? { signal } : undefined,
      );
      if (requestId !== requestIdRef.current) return;
      setApplication(findCurrentApplicantListingApplication(applications, listingId));
      setStatus("loaded");
    } catch {
      if (requestId === requestIdRef.current) setStatus("error");
    }
  }, [listingId]);

  const refresh = useCallback(async () => load(), [load]);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => {
      requestIdRef.current += 1;
      controller.abort();
    };
  }, [load]);
  return { application, status, refresh } as const;
}
