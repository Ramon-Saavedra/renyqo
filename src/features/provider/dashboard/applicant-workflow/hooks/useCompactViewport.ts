"use client";

import { useSyncExternalStore } from "react";

const COMPACT_VIEWPORT_QUERY = "(max-width: 639px)";

function subscribe(onChange: () => void) {
  const media = window.matchMedia(COMPACT_VIEWPORT_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function getSnapshot() {
  return window.matchMedia(COMPACT_VIEWPORT_QUERY).matches;
}

function getServerSnapshot() {
  return false;
}

export function useCompactViewport(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
