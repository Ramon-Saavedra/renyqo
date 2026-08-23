"use client";

import { useEffect, useState } from "react";
import {
  getListingEligibility,
  type ListingEligibility,
} from "../api/listing-eligibility";

export type ListingEligibilityStatus = "loading" | "loaded" | "error";

export function useListingEligibility(id: string) {
  const [eligibility, setEligibility] = useState<ListingEligibility | null>(
    null,
  );
  const [status, setStatus] = useState<ListingEligibilityStatus>("loading");
  const [resolvedId, setResolvedId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    getListingEligibility(id, { signal: controller.signal })
      .then((result) => {
        if (!active) return;
        setEligibility(result);
        setResolvedId(id);
        setStatus("loaded");
      })
      .catch(() => {
        if (active) {
          setResolvedId(id);
          setStatus("error");
        }
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [id]);

  return {
    eligibility: resolvedId === id ? eligibility : null,
    status: resolvedId === id ? status : "loading",
  } as const;
}
