"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getApplicantApplications,
  type ApplicantListingApplication,
} from "../api/applicant-applications";

export type ExistingApplicationStatus = "idle" | "loading" | "loaded" | "error";

export function findCurrentApplicantListingApplication(
  applications: readonly ApplicantListingApplication[],
  listingId: string,
): ApplicantListingApplication | null {
  return applications.find((item) => item.listingId === listingId) ?? null;
}

export function useApplicantListingApplication(
  listingId: string,
  enabled = true,
) {
  const [application, setApplication] =
    useState<ApplicantListingApplication | null>(null);
  const [status, setStatus] = useState<ExistingApplicationStatus>(
    enabled ? "loading" : "idle",
  );
  const requestIdRef = useRef(0);
  const load = useCallback(
    async (signal?: AbortSignal) => {
      if (!enabled) return;
      const requestId = ++requestIdRef.current;
      try {
        const applications = await getApplicantApplications(
          signal ? { signal } : undefined,
        );
        if (requestId !== requestIdRef.current) return;
        setApplication(
          findCurrentApplicantListingApplication(applications, listingId),
        );
        setStatus("loaded");
      } catch {
        if (requestId === requestIdRef.current) setStatus("error");
      }
    },
    [listingId, enabled],
  );

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setStatus("loading");
    await load();
  }, [load, enabled]);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    const controller = new AbortController();
    void Promise.resolve().then(() => load(controller.signal));
    return () => {
      requestIdRef.current += 1;
      controller.abort();
    };
  }, [load, enabled]);

  if (!enabled) {
    return { application: null, status: "idle" as const, refresh };
  }

  return { application, status, refresh } as const;
}
