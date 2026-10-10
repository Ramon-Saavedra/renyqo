"use client";

import { useCallback, useRef, useState } from "react";
import type {
  ViewingInterest,
  ViewingStatus,
  ViewingSummary,
} from "../api/shared-schemas";
import { findViewing } from "../model/viewing";
import { isStateConflict } from "../api/errors";
import {
  acceptViewing,
  declineViewing,
  requestAnotherViewingTime,
  submitViewingInterest,
} from "../api/viewings";

export type ViewingActionKind = "accept" | "decline" | "request" | "interest";

type ViewingBaseline =
  | { readonly kind: "status"; readonly status: ViewingStatus }
  | { readonly kind: "interest"; readonly interest: ViewingInterest | null };

type ViewingBlock =
  | { readonly kind: "conflict"; readonly generation: number }
  | (ViewingBaseline & { readonly generation: number });

function viewingIsBlocked(
  block: ViewingBlock | undefined,
  acceptedGeneration: number,
  summary: ViewingSummary,
  viewingId: string,
): boolean {
  if (!block) return false;
  if (acceptedGeneration < block.generation) return true;
  if (block.kind === "conflict") return false;
  const viewing = findViewing(summary, viewingId);
  if (!viewing) return false;
  return block.kind === "status"
    ? viewing.status === block.status
    : (viewing.postViewingInterest?.interest ?? null) === block.interest;
}

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
  summary: ViewingSummary,
): ViewingActions {
  const busyRef = useRef(false);
  const [pending, setPending] = useState<ViewingActionKind | null>(null);
  const [failed, setFailed] = useState<ViewingActionKind | null>(null);
  const blockedRef = useRef<ReadonlyMap<string, ViewingBlock>>(new Map());
  const [blockedViewings, setBlockedViewings] = useState<
    ReadonlyMap<string, ViewingBlock>
  >(new Map());
  const [conflict, setConflict] = useState(false);
  const isBlocked = useCallback(
    (viewingId: string) => {
      return viewingIsBlocked(
        blockedViewings.get(viewingId),
        acceptedGeneration,
        summary,
        viewingId,
      );
    },
    [acceptedGeneration, blockedViewings, summary],
  );

  const synchronize = useCallback(
    (viewingId: string, baseline: ViewingBaseline | null) => {
      const required = onChanged();
      const next = new Map(blockedRef.current);
      next.set(
        viewingId,
        baseline === null
          ? { kind: "conflict", generation: required }
          : { ...baseline, generation: required },
      );
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
      const baseline = findViewing(summary, viewingId);
      if (
        busyRef.current ||
        !baseline ||
        viewingIsBlocked(
          blockedRef.current.get(viewingId),
          acceptedGeneration,
          summary,
          viewingId,
        )
      )
        return false;
      busyRef.current = true;
      setPending(kind);
      setFailed(null);
      setConflict(false);
      try {
        await action();
        synchronize(
          viewingId,
          kind === "interest"
            ? {
                kind: "interest",
                interest: baseline.postViewingInterest?.interest ?? null,
              }
            : { kind: "status", status: baseline.status },
        );
        return true;
      } catch (error) {
        setFailed(kind);
        if (isStateConflict(error)) {
          setConflict(true);
          synchronize(viewingId, null);
        }
        return false;
      } finally {
        busyRef.current = false;
        setPending(null);
      }
    },
    [acceptedGeneration, synchronize, summary],
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
