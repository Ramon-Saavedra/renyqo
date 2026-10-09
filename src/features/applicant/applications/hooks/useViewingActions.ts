"use client";

import { useCallback, useRef, useState } from "react";
import type { ViewingInterest } from "../api/shared-schemas";
import { isStateConflict } from "../api/errors";
import {
  acceptViewing,
  declineViewing,
  requestAnotherViewingTime,
  submitViewingInterest,
} from "../api/viewings";

export type ViewingActionKind = "accept" | "decline" | "request" | "interest";

export interface ViewingActions {
  readonly pending: ViewingActionKind | null;
  readonly failed: ViewingActionKind | null;
  readonly conflict: boolean;
  readonly isBlocked: (viewingId: string) => boolean;
  readonly accept: (viewingId: string) => Promise<boolean>;
  readonly decline: (viewingId: string) => Promise<boolean>;
  readonly requestAnotherTime: (
    viewingId: string,
    message: string,
  ) => Promise<boolean>;
  readonly submitInterest: (
    viewingId: string,
    interest: ViewingInterest,
  ) => Promise<boolean>;
}

export function useViewingActions(
  applicationId: string,
  onChanged: () => number,
  acceptedGeneration: number,
): ViewingActions {
  const busyRef = useRef(false);
  const [pending, setPending] = useState<ViewingActionKind | null>(null);
  const [failed, setFailed] = useState<ViewingActionKind | null>(null);
  const blockedRef = useRef<ReadonlyMap<string, number>>(new Map());
  const [blockedViewings, setBlockedViewings] = useState<
    ReadonlyMap<string, number>
  >(new Map());
  const [conflict, setConflict] = useState(false);
  const isBlocked = useCallback(
    (viewingId: string) => {
      const required = blockedViewings.get(viewingId);
      return required !== undefined && acceptedGeneration < required;
    },
    [acceptedGeneration, blockedViewings],
  );

  const synchronize = useCallback(
    (viewingId: string) => {
      const required = onChanged();
      const next = new Map(blockedRef.current);
      next.set(viewingId, required);
      blockedRef.current = next;
      setBlockedViewings(next);
    },
    [onChanged],
  );

  const run = useCallback(
    async (
      kind: ViewingActionKind,
      viewingId: string,
      action: () => Promise<void>,
    ): Promise<boolean> => {
      const required = blockedRef.current.get(viewingId);
      if (
        busyRef.current ||
        (required !== undefined && acceptedGeneration < required)
      )
        return false;
      busyRef.current = true;
      setPending(kind);
      setFailed(null);
      setConflict(false);
      try {
        await action();
        synchronize(viewingId);
        return true;
      } catch (error) {
        setFailed(kind);
        if (isStateConflict(error)) {
          setConflict(true);
          synchronize(viewingId);
        }
        return false;
      } finally {
        busyRef.current = false;
        setPending(null);
      }
    },
    [acceptedGeneration, synchronize],
  );

  return {
    pending,
    failed,
    conflict,
    isBlocked,
    accept: (viewingId) =>
      run("accept", viewingId, () => acceptViewing(applicationId, viewingId)),
    decline: (viewingId) =>
      run("decline", viewingId, () => declineViewing(applicationId, viewingId)),
    requestAnotherTime: (viewingId, message) =>
      run("request", viewingId, () =>
        requestAnotherViewingTime(applicationId, viewingId, message),
      ),
    submitInterest: (viewingId, interest) =>
      run("interest", viewingId, () =>
        submitViewingInterest(applicationId, viewingId, interest),
      ),
  };
}
