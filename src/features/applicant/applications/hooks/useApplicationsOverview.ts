"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { appendUnique } from "../model/append-unique";
import {
  getApplicantApplicationsOverview,
  type ApplicantApplicationCard,
} from "../api/overview";
import {
  ApplicantApplicationContractError,
  isCancelledRequest,
} from "../api/errors";

export type LoadFailure = "request" | "contract";

export type OverviewState =
  | { readonly status: "loading" }
  | { readonly status: "error"; readonly reason: LoadFailure }
  | {
      readonly status: "ready";
      readonly items: readonly ApplicantApplicationCard[];
      readonly totalCount: number;
      readonly nextCursor: string | null;
      readonly loadingMore: boolean;
      readonly loadMoreFailed: boolean;
    };

function failureReason(error: unknown): LoadFailure {
  return error instanceof ApplicantApplicationContractError
    ? "contract"
    : "request";
}

export function useApplicationsOverview(): {
  readonly state: OverviewState;
  readonly reload: () => void;
  readonly loadMore: () => void;
} {
  const [state, setState] = useState<OverviewState>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);
  const generationRef = useRef(0);
  const moreControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const generation = generationRef.current + 1;
    generationRef.current = generation;
    moreControllerRef.current?.abort();
    const controller = new AbortController();

    getApplicantApplicationsOverview(null, { signal: controller.signal })
      .then((page) => {
        if (generationRef.current !== generation) return;
        setState({
          status: "ready",
          items: page.items,
          totalCount: page.totalCount,
          nextCursor: page.pagination.hasMore
            ? page.pagination.nextCursor
            : null,
          loadingMore: false,
          loadMoreFailed: false,
        });
      })
      .catch((error: unknown) => {
        if (generationRef.current !== generation || isCancelledRequest(error))
          return;
        setState({ status: "error", reason: failureReason(error) });
      });

    return () => controller.abort();
  }, [reloadKey]);

  const reload = useCallback(() => {
    setState({ status: "loading" });
    setReloadKey((key) => key + 1);
  }, []);

  const loadMore = useCallback(() => {
    if (state.status !== "ready" || state.loadingMore || !state.nextCursor)
      return;
    const generation = generationRef.current;
    const cursor = state.nextCursor;
    moreControllerRef.current?.abort();
    const controller = new AbortController();
    moreControllerRef.current = controller;
    setState({ ...state, loadingMore: true, loadMoreFailed: false });

    getApplicantApplicationsOverview(cursor, { signal: controller.signal })
      .then((page) => {
        if (generationRef.current !== generation) return;
        setState((current) =>
          current.status === "ready" && current.nextCursor === cursor
            ? {
                status: "ready",
                items: appendUnique(
                  current.items,
                  page.items,
                  (item) => item.applicationId,
                ),
                totalCount: page.totalCount,
                nextCursor: page.pagination.hasMore
                  ? page.pagination.nextCursor
                  : null,
                loadingMore: false,
                loadMoreFailed: false,
              }
            : current,
        );
      })
      .catch((error: unknown) => {
        if (generationRef.current !== generation || isCancelledRequest(error))
          return;
        setState((current) =>
          current.status === "ready"
            ? { ...current, loadingMore: false, loadMoreFailed: true }
            : current,
        );
      });
  }, [state]);

  useEffect(() => () => moreControllerRef.current?.abort(), []);

  return { state, reload, loadMore };
}
