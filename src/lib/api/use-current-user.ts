"use client";

import { useEffect, useSyncExternalStore } from "react";
import { createOnceCache } from "@/lib/utils/once-cache";
import { ApiError } from "./client";
import { getCurrentUser, type SafeUser } from "./auth";

export interface CurrentUserState {
  readonly user: SafeUser | null;
  readonly loading: boolean;
  readonly error: boolean;
}

export function isConfirmedAnonymousUser(
  state: CurrentUserState,
): state is CurrentUserState & {
  readonly user: null;
  readonly loading: false;
  readonly error: false;
} {
  return !state.loading && !state.error && state.user === null;
}

const currentUserListeners = new Set<() => void>();
let currentUserSnapshot: CurrentUserState = {
  user: null,
  loading: true,
  error: false,
};
let currentUserRevision = 0;
let currentUserLoad: Promise<void> | null = null;

const currentUserCache = createOnceCache<SafeUser | null>(() =>
  getCurrentUser(),
);

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

const SERVER_CURRENT_USER_STATE: CurrentUserState = {
  user: null,
  loading: true,
  error: false,
};

function getServerCurrentUserSnapshot(): CurrentUserState {
  return SERVER_CURRENT_USER_STATE;
}

function getServerCurrentUserRevision(): number {
  return 0;
}

function isUnauthenticatedMeError(error: unknown): boolean {
  return (
    error instanceof ApiError && error.kind === "http" && error.status === 401
  );
}

function publishCurrentUserSnapshot(next: CurrentUserState): void {
  if (
    currentUserSnapshot.user === next.user &&
    currentUserSnapshot.loading === next.loading &&
    currentUserSnapshot.error === next.error
  ) {
    return;
  }
  currentUserSnapshot = next;
  notifyCurrentUserChange();
}

function loadCurrentUserIntoStore(): Promise<void> {
  if (currentUserLoad) return currentUserLoad;

  const revision = currentUserRevision;
  currentUserLoad = currentUserCache
    .load()
    .then((user) => {
      if (revision !== currentUserRevision) return;
      publishCurrentUserSnapshot({ user, loading: false, error: false });
    })
    .catch((error: unknown) => {
      if (revision !== currentUserRevision) return;
      if (isUnauthenticatedMeError(error)) {
        currentUserCache.set(null);
        publishCurrentUserSnapshot({
          user: null,
          loading: false,
          error: false,
        });
        return;
      }
      publishCurrentUserSnapshot({
        user: null,
        loading: false,
        error: true,
      });
    })
    .finally(() => {
      currentUserLoad = null;
    });

  return currentUserLoad;
}

export function setCurrentUser(user: SafeUser): void {
  currentUserRevision += 1;
  currentUserLoad = null;
  currentUserCache.set(user);
  publishCurrentUserSnapshot({ user, loading: false, error: false });
}

export function invalidateCurrentUser(): void {
  currentUserRevision += 1;
  currentUserLoad = null;
  currentUserCache.invalidate();
  currentUserSnapshot = { user: null, loading: true, error: false };
  notifyCurrentUserChange();
}

export function useCurrentUser(): CurrentUserState {
  const revision = useSyncExternalStore(
    subscribeToCurrentUser,
    getCurrentUserRevision,
    getServerCurrentUserRevision,
  );
  const state = useSyncExternalStore(
    subscribeToCurrentUser,
    getCurrentUserSnapshot,
    getServerCurrentUserSnapshot,
  );

  useEffect(() => {
    if (state.loading) {
      void loadCurrentUserIntoStore();
    }
  }, [revision, state.loading]);

  return state;
}
