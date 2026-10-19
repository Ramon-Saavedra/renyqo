"use client";

import { subscribeListingApplicationData } from "../../listings/utils/listing-data-invalidation";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { appendUnique } from "../model/append-unique";
import {
  getApplicantApplicationsOverview,
  type ApplicantApplicationCard,
  type ApplicantOverviewGroup,
} from "../api/overview";
import {
  ApplicantApplicationContractError,
  isCancelledRequest,
} from "../api/errors";
import type { OverviewFilterValue } from "../components/overview/OverviewFilter";

export type LoadFailure = "request" | "contract";

export type OverviewCounts = {
  readonly all: number;
  readonly active: number;
  readonly waiting: number;
  readonly done: number;
};

export type OverviewState =
  | { readonly status: "loading" }
  | { readonly status: "error"; readonly reason: LoadFailure }
  | {
      readonly status: "ready";
      readonly items: readonly ApplicantApplicationCard[];
      readonly totalCount: number;
      readonly counts: OverviewCounts;
      readonly nextCursor: string | null;
      readonly loadingMore: boolean;
      readonly loadMoreFailed: boolean;
    };

type OverviewSnapshot = {
  readonly group: ApplicantOverviewGroup;
  readonly state: OverviewState;
};

function failureReason(error: unknown): LoadFailure {
  return error instanceof ApplicantApplicationContractError
    ? "contract"
    : "request";
}

function toApiGroup(filter: OverviewFilterValue): ApplicantOverviewGroup {
  return filter === "ALL" ? "ALL" : filter;
}

export function useApplicationsOverview(filter: OverviewFilterValue): {
  readonly state: OverviewState;
  readonly counts: OverviewCounts | null;
  readonly filterError: LoadFailure | null;
  readonly reload: () => void;
  readonly loadMore: () => void;
} {
  const group = toApiGroup(filter);
  const [snapshot, setSnapshot] = useState<OverviewSnapshot>(() => ({
    group,
    state: { status: "loading" },
  }));
  const [reloadKey, setReloadKey] = useState(0);
  const [lastCounts, setLastCounts] = useState<OverviewCounts | null>(null);
  const state = useMemo(
    (): OverviewState =>
      snapshot.group === group ? snapshot.state : { status: "loading" },
    [snapshot, group],
  );
  const counts = state.status === "ready" ? state.counts : lastCounts;
  const filterError =
    snapshot.group === group && snapshot.state.status === "error"
      ? snapshot.state.reason
      : null;
  useEffect(
    () =>
      subscribeListingApplicationData(() => setReloadKey((value) => value + 1)),
    [],
  );
  const generationRef = useRef(0);
  const moreControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const generation = generationRef.current + 1;
    generationRef.current = generation;
    moreControllerRef.current?.abort();
    const controller = new AbortController();

    getApplicantApplicationsOverview(null, group, { signal: controller.signal })
      .then((page) => {
        if (generationRef.current !== generation) return;
        setLastCounts(page.counts);
        setSnapshot({
          group,
          state: {
            status: "ready",
            items: page.items,
            totalCount: page.totalCount,
            counts: page.counts,
            nextCursor: page.pagination.hasMore
              ? page.pagination.nextCursor
              : null,
            loadingMore: false,
            loadMoreFailed: false,
          },
        });
      })
      .catch((error: unknown) => {
        if (generationRef.current !== generation || isCancelledRequest(error))
          return;
        setSnapshot({
          group,
          state: { status: "error", reason: failureReason(error) },
        });
      });

    return () => controller.abort();
  }, [reloadKey, group]);

  const reload = useCallback(() => {
    setSnapshot({ group, state: { status: "loading" } });
    setReloadKey((key) => key + 1);
  }, [group]);

  const loadMore = useCallback(() => {
    const ready =
      snapshot.group === group && snapshot.state.status === "ready"
        ? snapshot.state
        : null;
    if (!ready || ready.loadingMore || !ready.nextCursor) return;
    const generation = generationRef.current;
    const cursor = ready.nextCursor;
    moreControllerRef.current?.abort();
    const controller = new AbortController();
    moreControllerRef.current = controller;
    setSnapshot({
      group,
      state: {
        ...ready,
        loadingMore: true,
        loadMoreFailed: false,
      },
    });

    getApplicantApplicationsOverview(cursor, group, {
      signal: controller.signal,
    })
      .then((page) => {
        if (generationRef.current !== generation) return;
        setLastCounts(page.counts);
        setSnapshot((current) =>
          current.group === group &&
          current.state.status === "ready" &&
          current.state.nextCursor === cursor
            ? {
                group,
                state: {
                  status: "ready",
                  items: appendUnique(
                    current.state.items,
                    page.items,
                    (item) => item.applicationId,
                  ),
                  totalCount: page.totalCount,
                  counts: page.counts,
                  nextCursor: page.pagination.hasMore
                    ? page.pagination.nextCursor
                    : null,
                  loadingMore: false,
                  loadMoreFailed: false,
                },
              }
            : current,
        );
      })
      .catch((error: unknown) => {
        if (generationRef.current !== generation || isCancelledRequest(error))
          return;
        setSnapshot((current) =>
          current.group === group && current.state.status === "ready"
            ? {
                group,
                state: {
                  ...current.state,
                  loadingMore: false,
                  loadMoreFailed: true,
                },
              }
            : current,
        );
      });
  }, [snapshot, group]);

  useEffect(() => () => moreControllerRef.current?.abort(), []);

  return { state, counts, filterError, reload, loadMore };
}
