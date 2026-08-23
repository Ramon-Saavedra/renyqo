"use client";

import { useEffect, useState } from "react";
import { getListingEligibility, type ListingEligibility } from "../api/listing-eligibility";

export type ListingEligibilityStatus = "loading" | "loaded" | "error";

export function useListingEligibility(id: string) {
  const [eligibility, setEligibility] = useState<ListingEligibility | null>(null);
  const [status, setStatus] = useState<ListingEligibilityStatus>("loading");

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setStatus("loading");
    setEligibility(null);
    getListingEligibility(id, { signal: controller.signal })
      .then((result) => {
        if (!active) return;
        setEligibility(result);
        setStatus("loaded");
      })
      .catch(() => {
        if (active) setStatus("error");
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [id]);

  return { eligibility, status } as const;
}
