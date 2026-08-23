"use client";

import { useRef, useState } from "react";
import { ApiError } from "@/lib/api/client";
import { applyToListing, ListingEligibilityRejectedError, type ListingApplication } from "../api/listing-application";
import type { ListingEligibility } from "../api/listing-eligibility";

export type ListingApplicationState =
  | { readonly status: "idle" }
  | { readonly status: "submitting" }
  | { readonly status: "success"; readonly application: ListingApplication }
  | { readonly status: "eligibility-rejected"; readonly eligibility: ListingEligibility }
  | { readonly status: "error"; readonly message: string };

function messageFor(error: unknown): string {
  if (!(error instanceof ApiError)) return "Die Bewerbung konnte nicht gesendet werden.";
  if (error.status === 409) return "Du hast dich bereits auf diese Wohnung beworben.";
  if (error.status === 404) return "Dieses Objekt ist nicht mehr verfügbar.";
  if (error.status === 422) return "Für dieses Objekt sind Bewerbungen nicht mehr möglich.";
  if (error.status === 401) return "Bitte melde dich an, um dich zu bewerben.";
  if (error.status === 403) return "Du kannst dich derzeit nicht auf dieses Objekt bewerben.";
  return "Die Bewerbung konnte nicht gesendet werden.";
}

export function useListingApplication(id: string) {
  const [state, setState] = useState<ListingApplicationState>({ status: "idle" });
  const isSubmittingRef = useRef(false);
  const submit = async (): Promise<"duplicate" | void> => {
    if (isSubmittingRef.current || state.status === "success") return;
    isSubmittingRef.current = true;
    setState({ status: "submitting" });
    try {
      setState({ status: "success", application: await applyToListing(id) });
    } catch (error) {
      if (error instanceof ListingEligibilityRejectedError) {
        setState({ status: "eligibility-rejected", eligibility: error.eligibility });
        isSubmittingRef.current = false;
        return;
      }
      if (error instanceof ApiError && error.status === 409) {
        setState({ status: "idle" });
        isSubmittingRef.current = false;
        return "duplicate";
      }
      setState({ status: "error", message: messageFor(error) });
    }
    isSubmittingRef.current = false;
  };
  const reset = () => setState({ status: "idle" });
  return { state, submit, reset } as const;
}
