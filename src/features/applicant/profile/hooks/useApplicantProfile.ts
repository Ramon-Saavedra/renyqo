"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { setFlash } from "@/lib/utils/flash";
import { safeListingsReturnTo } from "@/lib/utils/safe-redirect";
import { useCurrentUser } from "@/lib/api/use-current-user";
import { setApplicantProfileCache } from "./useApplicantProfileStatus";
import {
  getApplicantProfile,
  saveApplicantProfile,
} from "../api/applicant-profile";
import { applicantProfileCopy } from "../copy/applicant-profile";
import {
  canSaveProfile,
  getMissingProfileFields,
  getProfileErrors,
  INITIAL_PROFILE,
  isProfileComplete,
  type ApplicantProfileDraft,
} from "../utils/profile-validation";

export type ProfileSaveStatus = "idle" | "saving" | "saved" | "error";

export interface UseApplicantProfileResult {
  draft: ApplicantProfileDraft;
  setField: <K extends keyof ApplicantProfileDraft>(
    field: K,
    value: ApplicantProfileDraft[K],
  ) => void;
  loading: boolean;
  loadFailed: boolean;
  saveStatus: ProfileSaveStatus;
  save: () => void;
  errors: ReturnType<typeof getProfileErrors>;
  missing: ReadonlyArray<string>;
  complete: boolean;
  canSave: boolean;
}

export function useApplicantProfile(): UseApplicantProfileResult {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useCurrentUser();
  const [draft, setDraft] = useState<ApplicantProfileDraft>(INITIAL_PROFILE);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [saveStatus, setSaveStatus] = useState<ProfileSaveStatus>("idle");
  const savingRef = useRef(false);

  useEffect(() => {
    let active = true;

    getApplicantProfile()
      .then((profile) => {
        if (!active) return;
        setDraft(profile ?? INITIAL_PROFILE);
        setLoadFailed(false);
      })
      .catch(() => {
        if (active) setLoadFailed(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const setField = useCallback(
    <K extends keyof ApplicantProfileDraft>(
      field: K,
      value: ApplicantProfileDraft[K],
    ) => {
      setDraft((previous) => ({ ...previous, [field]: value }));
      setSaveStatus((previous) =>
        previous === "saved" || previous === "error" ? "idle" : previous,
      );
    },
    [],
  );

  const save = useCallback(() => {
    if (loading || loadFailed || savingRef.current || !canSaveProfile(draft)) {
      return;
    }

    savingRef.current = true;
    setSaveStatus("saving");
    saveApplicantProfile(draft)
      .then(() => {
        setSaveStatus("saved");
        setApplicantProfileCache(draft, user?.id);
        setFlash(applicantProfileCopy.actions.savedFlash);
        router.push(safeListingsReturnTo(searchParams.get("returnTo")));
      })
      .catch(() => {
        savingRef.current = false;
        setSaveStatus("error");
      });
  }, [draft, loadFailed, loading, router, searchParams, user?.id]);

  return {
    draft,
    setField,
    loading,
    loadFailed,
    saveStatus,
    save,
    errors: getProfileErrors(draft),
    missing: getMissingProfileFields(draft),
    complete: isProfileComplete(draft),
    canSave: !loading && !loadFailed && canSaveProfile(draft),
  };
}
