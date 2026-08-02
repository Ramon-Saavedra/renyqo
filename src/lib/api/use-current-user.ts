"use client";

import { useEffect, useSyncExternalStore } from "react";
import { createOnceCache } from "@/lib/utils/once-cache";
import { getCurrentUser, type SafeUser } from "./auth";

const currentUserCache = createOnceCache<SafeUser | null>(() =>
  getCurrentUser().catch(() => null),
);
const currentUserListeners = new Set<() => void>();
let currentUserSnapshot: CurrentUserState = { user: null, loading: true };
let currentUserRevision = 0;

function notifyCurrentUserChange(): void {
  for (const listener of currentUserListeners) listener();
}

function subscribeToCurrentUser(listener: () => void): () => void {
  currentUserListeners.add(listener);
  return () => currentUserListeners.delete(listener);
}

function getCurrentUserSnapshot(): CurrentUserState {
  return currentUserSnapshot;
}

function getCurrentUserRevision(): number {
  return currentUserRevision;
}

function setCurrentUserSnapshot(user: SafeUser | null): void {
  currentUserSnapshot = { user, loading: false };
  notifyCurrentUserChange();
}

export function setCurrentUser(user: SafeUser): void {
  currentUserRevision += 1;
  currentUserCache.set(user);
  setCurrentUserSnapshot(user);
}

export function invalidateCurrentUser(): void {
  currentUserRevision += 1;
  currentUserCache.invalidate();
  currentUserSnapshot = { user: null, loading: true };
  notifyCurrentUserChange();
}

export interface CurrentUserState {
  user: SafeUser | null;
  loading: boolean;
}

export function useCurrentUser(): CurrentUserState {
  const revision = useSyncExternalStore(
    subscribeToCurrentUser,
    getCurrentUserRevision,
    getCurrentUserRevision,
  );
  const state = useSyncExternalStore(
    subscribeToCurrentUser,
    getCurrentUserSnapshot,
    getCurrentUserSnapshot,
  );

  useEffect(() => {
    let active = true;
    const revision = currentUserRevision;

    void currentUserCache.load().then((user) => {
      if (active && revision === currentUserRevision) {
        setCurrentUserSnapshot(user);
      }
    });

    return () => {
      active = false;
    };
  }, [revision]);

  return state;
}
