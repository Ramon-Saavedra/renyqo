"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useCurrentUser } from "@/lib/api/use-current-user";
import { isApplicantRole } from "@/features/auth/utils/role";
import { createOnceCache } from "@/lib/utils/once-cache";
import { getApplicantProfile } from "../api/applicant-profile";
import type { ApplicantProfileDraft } from "../utils/profile-validation";

export type ApplicantProfileStatus =
  | "loading"
  | "missing"
  | "exists"
  | "unavailable";

const applicantProfileCache = createOnceCache<ApplicantProfileDraft | null>(
  getApplicantProfile,
);
const profileCacheListeners = new Set<() => void>();
let profileStatusSnapshot: ApplicantProfileStatus = "loading";
let profileUserId: string | null = null;
let profileRequestGeneration = 0;

function notifyProfileCacheChange(): void {
  for (const listener of profileCacheListeners) listener();
}

function subscribeToProfileCache(listener: () => void): () => void {
  profileCacheListeners.add(listener);
  return () => profileCacheListeners.delete(listener);
}

function getProfileStatusSnapshot(): ApplicantProfileStatus {
  return profileStatusSnapshot;
}

function setProfileStatusSnapshot(status: ApplicantProfileStatus): void {
  profileStatusSnapshot = status;
  notifyProfileCacheChange();
}

export function setApplicantProfileCache(
  profile: ApplicantProfileDraft,
  ownerId?: string,
): void {
  if (ownerId && profileUserId && ownerId !== profileUserId) return;
  applicantProfileCache.set(profile);
  setProfileStatusSnapshot("exists");
}

export function invalidateApplicantProfile(): void {
  profileRequestGeneration += 1;
  applicantProfileCache.invalidate();
  setProfileStatusSnapshot("loading");
}

export function useApplicantProfileStatus(): ApplicantProfileStatus {
  const { user, loading: userLoading } = useCurrentUser();
  const profileStatus = useSyncExternalStore(
    subscribeToProfileCache,
    getProfileStatusSnapshot,
    getProfileStatusSnapshot,
  );

  const isApplicant = isApplicantRole(user?.role);

  useEffect(() => {
    if (userLoading) return undefined;

    if (!isApplicant || !user) {
      profileRequestGeneration += 1;
      profileUserId = null;
      applicantProfileCache.invalidate();
      if (profileStatusSnapshot !== "loading") {
        setProfileStatusSnapshot("loading");
      }
      return undefined;
    }

    if (profileUserId !== user.id) {
      profileUserId = user.id;
      profileRequestGeneration += 1;
      applicantProfileCache.invalidate();
      setProfileStatusSnapshot("loading");
    }

    let active = true;
    const requestGeneration = profileRequestGeneration;

    applicantProfileCache
      .load()
      .then((profile) => {
        if (active && requestGeneration === profileRequestGeneration) {
          setProfileStatusSnapshot(profile ? "exists" : "missing");
        }
      })
      .catch(() => {
        if (active && requestGeneration === profileRequestGeneration) {
          setProfileStatusSnapshot("unavailable");
        }
      });

    return () => {
      active = false;
    };
  }, [isApplicant, user, userLoading]);

  if (userLoading) return "loading";
  if (!isApplicant) return "unavailable";
  return profileStatus;
}
