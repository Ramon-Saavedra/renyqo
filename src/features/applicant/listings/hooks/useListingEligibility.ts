"use client";

import { subscribeListingApplicationData } from "../utils/listing-data-invalidation";

import { useEffect, useState } from "react";
import {
  getListingEligibility,
  type ListingEligibility,
} from "../api/listing-eligibility";

export type ListingEligibilityStatus = "idle" | "loading" | "loaded" | "error";

export function useListingEligibility(id: string, enabled = true) {
  const [reloadKey, setReloadKey] = useState(0);
  useEffect(
    () =>
      subscribeListingApplicationData(() => setReloadKey((value) => value + 1)),
    [],
  );
  const [eligibility, setEligibility] = useState<ListingEligibility | null>(
    null,
  );
  const [status, setStatus] = useState<ListingEligibilityStatus>(
    enabled ? "loading" : "idle",
  );
  const [resolvedId, setResolvedId] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

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
  }, [id, enabled, reloadKey]);

  if (!enabled) {
    return { eligibility: null, status: "idle" as const };
  }

  return {
    eligibility: resolvedId === id ? eligibility : null,
    status: resolvedId === id ? status : "loading",
  } as const;
}
