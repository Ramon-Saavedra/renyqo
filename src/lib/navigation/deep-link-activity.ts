"use client";

import { useEffect, useRef } from "react";
import { activityFocusStep, type DeepLinkSection } from "./deep-link";

interface FocusableHistory {
  readonly expanded: boolean;
  readonly items: readonly { readonly id: string }[];
  readonly hasMore: boolean;
  readonly load: string;
  readonly expand: () => void;
  readonly loadMore: () => void;
}

export function useDeepLinkActivity(
  history: FocusableHistory,
  activityId: string | null,
  section: DeepLinkSection | null,
): void {
  const openedLink = useRef<string | null>(null);

  useEffect(() => {
    if (!activityId && section !== "activity") return;
    const key = `${section ?? ""}:${activityId ?? ""}`;
    if (openedLink.current === key || history.expanded) return;
    openedLink.current = key;
    history.expand();
  }, [activityId, history, section]);

  useEffect(() => {
    if (!activityId || !history.expanded || history.load !== "ready") return;
    if (
      activityFocusStep(activityId, history.items, history.hasMore) === "load"
    ) {
      history.loadMore();
    }
  }, [activityId, history]);
}
