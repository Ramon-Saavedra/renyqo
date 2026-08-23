"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api/client";
import { getPublicListingDetail } from "../api/public-listings";
import { listingDetailCopy } from "../copy/listing-detail";
import type { PublicListingDetail } from "../types";

export type DetailStatus = "loading" | "loaded" | "error" | "not-found";

export interface UsePublicListingDetailResult {
  readonly listing: PublicListingDetail | null;
  readonly error: string | null;
  readonly status: DetailStatus;
}

export function usePublicListingDetail(
  id: string,
): UsePublicListingDetailResult {
  const [listing, setListing] = useState<PublicListingDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<DetailStatus>("loading");

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    async function load() {
      setStatus("loading");
      setError(null);

      try {
        const result = await getPublicListingDetail(id, {
          signal: controller.signal,
        });

        if (!active) return;

        if (!result) {
          setStatus("not-found");
          return;
        }

        setListing(result);
        setStatus("loaded");
      } catch (err) {
        if (!active) return;

        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }

        if (err instanceof ApiError && err.status === 404) {
          setStatus("not-found");
          return;
        }

        setError(
          err instanceof ApiError && err.status === 0
            ? listingDetailCopy.errorNetwork
            : listingDetailCopy.errorDefault,
        );
        setStatus("error");
      }
    }

    void load();

    return () => {
      active = false;
      controller.abort();
    };
  }, [id]);

  return { listing, error, status };
}
