"use client";

import { useCallback, useRef, useState } from "react";
import { mapActiveApplicationsToCandidates } from "../api/map-active-application-to-candidate";
import { getProviderActiveApplications } from "../api/provider-listing-applications";
import type { Candidate, CandidateWarning } from "../types";

export interface ListingApplicantPreview {
  readonly initials: string;
  readonly name: string;
  readonly household: string;
  readonly warnings: readonly CandidateWarning[];
  readonly introduction: string | null;
  readonly activeAtLabel: string | null;
}

export type ListingApplicantNamesState =
  | {
      readonly status: "idle";
      readonly previews: readonly ListingApplicantPreview[];
    }
  | {
      readonly status: "loading";
      readonly previews: readonly ListingApplicantPreview[];
    }
  | {
      readonly status: "loaded";
      readonly previews: readonly ListingApplicantPreview[];
    }
  | {
      readonly status: "error";
      readonly previews: readonly ListingApplicantPreview[];
    };

const IDLE_STATE: ListingApplicantNamesState = {
  status: "idle",
  previews: [],
};

export function toListingApplicantPreview(
  candidate: Candidate,
): ListingApplicantPreview {
  return {
    initials: candidate.initials,
    name: candidate.name,
    household: candidate.household,
    warnings: candidate.warnings,
    introduction: candidate.introduction,
    activeAtLabel: candidate.activeAtLabel,
  };
}

function samePreviews(
  current: readonly ListingApplicantPreview[],
  next: readonly ListingApplicantPreview[],
): boolean {
  if (current.length !== next.length) return false;
  return current.every((preview, index) => {
    const other = next[index];
    if (!other) return false;
    return (
      preview.initials === other.initials &&
      preview.name === other.name &&
      preview.household === other.household &&
      preview.introduction === other.introduction &&
      preview.activeAtLabel === other.activeAtLabel &&
      preview.warnings.length === other.warnings.length &&
      preview.warnings.every(
        (warning, warningIndex) => warning === other.warnings[warningIndex],
      )
    );
  });
}

export function useListingApplicantNames() {
  const statesRef = useRef(new Map<string, ListingApplicantNamesState>());
  const pendingRef = useRef(new Map<string, Promise<void>>());
  const generationRef = useRef(new Map<string, number>());
  const externalHoldRef = useRef(new Set<string>());
  const [, setRevision] = useState(0);

  const updateState = useCallback(
    (listingId: string, state: ListingApplicantNamesState) => {
      statesRef.current.set(listingId, state);
      setRevision((revision) => revision + 1);
    },
    [],
  );

  const adoptLoaded = useCallback(
    (listingId: string, previews: readonly ListingApplicantPreview[]) => {
      externalHoldRef.current.delete(listingId);
      const current = statesRef.current.get(listingId);
      if (
        current?.status === "loaded" &&
        samePreviews(current.previews, previews)
      ) {
        return;
      }

      generationRef.current.set(
        listingId,
        (generationRef.current.get(listingId) ?? 0) + 1,
      );
      pendingRef.current.delete(listingId);
      updateState(listingId, { status: "loaded", previews });
    },
    [updateState],
  );

  const ensureLoaded = useCallback(
    (listingId: string) => {
      const current = statesRef.current.get(listingId) ?? IDLE_STATE;
      if (
        current.status === "loaded" ||
        pendingRef.current.has(listingId) ||
        externalHoldRef.current.has(listingId)
      ) {
        return;
      }

      const generation = generationRef.current.get(listingId) ?? 0;
      updateState(listingId, {
        status: "loading",
        previews: current.previews,
      });
      const request = getProviderActiveApplications(listingId)
        .then((applications) => {
          if ((generationRef.current.get(listingId) ?? 0) !== generation) {
            return;
          }
          updateState(listingId, {
            status: "loaded",
            previews: mapActiveApplicationsToCandidates(applications).map(
              toListingApplicantPreview,
            ),
          });
        })
        .catch(() => {
          if ((generationRef.current.get(listingId) ?? 0) !== generation) {
            return;
          }
          updateState(listingId, { status: "error", previews: [] });
        })
        .finally(() => {
          if (pendingRef.current.get(listingId) === request) {
            pendingRef.current.delete(listingId);
          }
        });

      pendingRef.current.set(listingId, request);
    },
    [updateState],
  );

  const holdListing = useCallback((listingId: string) => {
    const current = statesRef.current.get(listingId);
    if (current?.status === "loaded" || pendingRef.current.has(listingId)) {
      return;
    }
    externalHoldRef.current.add(listingId);
  }, []);

  const releaseListing = useCallback((listingId: string) => {
    externalHoldRef.current.delete(listingId);
  }, []);

  const getState = useCallback(
    (listingId: string): ListingApplicantNamesState =>
      statesRef.current.get(listingId) ?? IDLE_STATE,
    [],
  );

  return { ensureLoaded, adoptLoaded, holdListing, releaseListing, getState };
}
