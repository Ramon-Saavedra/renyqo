"use client";

import { useEffect, useRef, useState } from "react";
import { ApiError } from "@/lib/api/client";
import { saveListing, unsaveListing } from "../api/listing-saved";
import { listingDetailCopy } from "../copy/listing-detail";

export type ListingSaveStatus = "idle" | "submitting" | "error";

export interface UseListingSaveResult {
  readonly saved: boolean;
  readonly status: ListingSaveStatus;
  readonly error: string | null;
  readonly toggle: () => Promise<void>;
}

function messageFor(error: unknown, unsaving: boolean): string {
  const { save } = listingDetailCopy;
  if (unsaving) {
    if (!(error instanceof ApiError)) return save.unsaveError;
    if (error.status === 401) return save.unsaveErrorAuth;
    if (error.status === 403) return save.unsaveErrorForbidden;
    if (error.status === 404) return save.unsaveErrorNotFound;
    return save.unsaveError;
  }
  if (!(error instanceof ApiError)) return save.error;
  if (error.status === 401) return save.errorAuth;
  if (error.status === 403) return save.errorForbidden;
  if (error.status === 404) return save.errorNotFound;
  return save.error;
}

export function useListingSave(
  listingId: string,
  initialSaved: boolean,
  onSavedChange?: (saved: boolean) => void,
): UseListingSaveResult {
  const [saved, setSaved] = useState(initialSaved);
  const [status, setStatus] = useState<ListingSaveStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [syncedListingId, setSyncedListingId] = useState(listingId);
  const [syncedInitialSaved, setSyncedInitialSaved] = useState(initialSaved);
  const isSubmittingRef = useRef(false);
  const listingIdRef = useRef(listingId);
  const onSavedChangeRef = useRef(onSavedChange);

  if (listingId !== syncedListingId || initialSaved !== syncedInitialSaved) {
    setSyncedListingId(listingId);
    setSyncedInitialSaved(initialSaved);
    setSaved(initialSaved);
    setStatus("idle");
    setError(null);
  }

  useEffect(() => {
    listingIdRef.current = listingId;
    isSubmittingRef.current = false;
  }, [listingId]);

  useEffect(() => {
    onSavedChangeRef.current = onSavedChange;
  });

  const toggle = async () => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    const targetId = listingId;
    const unsaving = saved;
    setStatus("submitting");
    setError(null);
    try {
      const result = unsaving
        ? await unsaveListing(targetId)
        : await saveListing(targetId);
      if (targetId !== listingIdRef.current) return;
      setSaved(result.saved);
      setStatus("idle");
      onSavedChangeRef.current?.(result.saved);
    } catch (caught) {
      if (targetId !== listingIdRef.current) return;
      setStatus("error");
      setError(messageFor(caught, unsaving));
    }
    if (targetId === listingIdRef.current) {
      isSubmittingRef.current = false;
    }
  };

  return { saved, status, error, toggle };
}
