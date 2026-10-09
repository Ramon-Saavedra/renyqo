"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { appendUnique } from "../model/append-unique";
import { getApplicantActivityPage } from "../api/activity";
import type { ActivityItem } from "../api/activity-schema";
import { isCancelledRequest } from "../api/errors";

type HistoryLoad = "idle" | "loading" | "loading-more" | "error" | "ready";

interface ExpandedHistory {
  readonly snapshotKey: string;
  readonly items: readonly ActivityItem[];
  readonly nextCursor: string | null;
  readonly totalCount: number | null;
  readonly load: HistoryLoad;
}

export interface ActivityHistory {
  readonly expanded: boolean;
  readonly items: readonly ActivityItem[];
  readonly totalCount: number | null;
  readonly hasMore: boolean;
  readonly load: HistoryLoad;
  readonly expand: () => void;
  readonly collapse: () => void;
  readonly loadMore: () => void;
  readonly retry: () => void;
}

function emptyHistory(snapshotKey: string): ExpandedHistory {
  return {
    snapshotKey,
    items: [],
    nextCursor: null,
    totalCount: null,
    load: "loading",
  };
}

export function useActivityHistory(
  applicationId: string,
  snapshotKey: string,
): ActivityHistory {
  const [expanded, setExpanded] = useState(false);
  const [history, setHistory] = useState<ExpandedHistory>(() =>
    emptyHistory(snapshotKey),
  );
  const [requestKey, setRequestKey] = useState(0);
  const generationRef = useRef(0);

  if (history.snapshotKey !== snapshotKey) {
    setHistory(emptyHistory(snapshotKey));
  }

  useEffect(() => {
    const generation = generationRef.current + 1;
    generationRef.current = generation;
    if (!expanded) return;
    const controller = new AbortController();

    getApplicantActivityPage(applicationId, null, {
      signal: controller.signal,
    })
      .then((page) => {
        if (generationRef.current !== generation) return;
        setHistory((current) =>
          current.snapshotKey === snapshotKey
            ? {
                snapshotKey,
                items: page.items,
                nextCursor: page.pagination.hasMore
                  ? page.pagination.nextCursor
                  : null,
                totalCount: page.totalCount,
                load: "ready",
              }
            : current,
        );
      })
      .catch((error: unknown) => {
        if (generationRef.current !== generation || isCancelledRequest(error))
          return;
        setHistory((current) =>
          current.snapshotKey === snapshotKey
            ? { ...current, load: "error" }
            : current,
        );
      });

    return () => controller.abort();
  }, [applicationId, snapshotKey, expanded, requestKey]);

  const loadMore = useCallback(() => {
    if (history.load !== "ready" || !history.nextCursor) return;
    const generation = generationRef.current;
    const cursor = history.nextCursor;
    const key = history.snapshotKey;
    setHistory({ ...history, load: "loading-more" });

    getApplicantActivityPage(applicationId, cursor)
      .then((page) => {
        if (generationRef.current !== generation) return;
        setHistory((current) =>
          current.snapshotKey === key && current.nextCursor === cursor
            ? {
                snapshotKey: key,
                items: appendUnique(
                  current.items,
                  page.items,
                  (item) => item.id,
                ),
                nextCursor: page.pagination.hasMore
                  ? page.pagination.nextCursor
                  : null,
                totalCount: page.totalCount,
                load: "ready",
              }
            : current,
        );
      })
      .catch(() => {
        if (generationRef.current !== generation) return;
        setHistory((current) =>
          current.snapshotKey === key ? { ...current, load: "error" } : current,
        );
      });
  }, [applicationId, history]);

  const retry = useCallback(() => {
    setHistory((current) => emptyHistory(current.snapshotKey));
    setRequestKey((key) => key + 1);
  }, []);

  const expand = useCallback(() => {
    setHistory((current) => emptyHistory(current.snapshotKey));
    setExpanded(true);
  }, []);

  const collapse = useCallback(() => setExpanded(false), []);

  return {
    expanded,
    items: history.items,
    totalCount: history.totalCount,
    hasMore: history.nextCursor !== null,
    load: expanded ? history.load : "idle",
    expand,
    collapse,
    loadMore,
    retry,
  };
}
