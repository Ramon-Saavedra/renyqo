"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ApiError } from "@/lib/api/client";
import { updateListing } from "@/lib/api/listings";
import type { ListingDetail } from "../types";
import type { ChangedFields } from "./changed-fields";
import { getChangedFields } from "./changed-fields";
import { listingEditCopy } from "./copy";
import {
  applyEditFormToListing,
  isEditFormEqual,
  mapListingToEditForm,
} from "./form-mapping";
import {
  hasPayloadChanges,
  mapEditFormToUpdatePayload,
} from "./payload-mapping";
import { validateEditForm } from "./schema";
import type { ListingEditErrors, ListingEditForm } from "./types";
import { SAVED_HIGHLIGHT_MS, useSavedHighlight } from "./useSavedHighlight";

export type EditSaveStatus = "idle" | "saving" | "saved";

export interface UseListingEditOptions {
  readonly onSaved: (updated: ListingDetail) => void;
}

export interface UseListingEditResult {
  readonly form: ListingEditForm;
  readonly errors: ListingEditErrors;
  readonly status: EditSaveStatus;
  readonly error: string | null;
  readonly isDirty: boolean;
  readonly savedFields: ChangedFields;
  readonly setField: <K extends keyof ListingEditForm>(
    field: K,
    value: ListingEditForm[K],
  ) => void;
  readonly save: () => Promise<void>;
}

export function useListingEdit(
  listing: ListingDetail,
  { onSaved }: UseListingEditOptions,
): UseListingEditResult {
  const initialForm = useMemo(() => mapListingToEditForm(listing), [listing]);
  const [form, setForm] = useState<ListingEditForm>(initialForm);
  const [errors, setErrors] = useState<ListingEditErrors>({});
  const [status, setStatus] = useState<EditSaveStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const { savedFields, flash } = useSavedHighlight();

  const handoffRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (handoffRef.current !== null) clearTimeout(handoffRef.current);
    },
    [],
  );

  const isDirty = useMemo(
    () => status !== "saved" && !isEditFormEqual(form, initialForm),
    [form, initialForm, status],
  );

  const setField = useCallback(
    <K extends keyof ListingEditForm>(field: K, value: ListingEditForm[K]) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      setError(null);
      setErrors((prev) => {
        if (!(field in prev)) return prev;
        const next = { ...prev };
        delete next[field as keyof ListingEditErrors];
        return next;
      });
    },
    [],
  );

  const save = useCallback(async () => {
    if (status !== "idle") return;

    const validationErrors = validateEditForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setError(listingEditCopy.error.validation);
      return;
    }
    setErrors({});
    setError(null);

    const payload = mapEditFormToUpdatePayload(form, initialForm);
    if (!hasPayloadChanges(payload)) {
      onSaved(applyEditFormToListing(listing, form));
      return;
    }

    setStatus("saving");
    try {
      await updateListing(listing.id, payload);
    } catch (err) {
      setStatus("idle");
      setError(
        err instanceof ApiError && err.status === 0
          ? listingEditCopy.error.network
          : listingEditCopy.error.save,
      );
      return;
    }

    const updated = applyEditFormToListing(listing, form);
    setStatus("saved");
    flash(getChangedFields(form, initialForm));
    handoffRef.current = setTimeout(() => {
      handoffRef.current = null;
      onSaved(updated);
    }, SAVED_HIGHLIGHT_MS);
  }, [flash, form, initialForm, listing, onSaved, status]);

  useEffect(() => {
    if (!isDirty) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  return { form, errors, status, error, isDirty, savedFields, setField, save };
}
