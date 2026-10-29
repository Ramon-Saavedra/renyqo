"use client";

import { useSyncExternalStore } from "react";

const listeners = new Set<() => void>();
let historyPatched = false;
let notifyQueued = false;

function notify(): void {
  if (notifyQueued) return;
  notifyQueued = true;
  // Next.js calls history.pushState from useInsertionEffect. Notifying
  // useSyncExternalStore there schedules a React update and throws.
  queueMicrotask(() => {
    notifyQueued = false;
    for (const listener of listeners) listener();
  });
}

function patchHistory(): void {
  if (historyPatched || typeof history === "undefined") return;
  historyPatched = true;
  const push = history.pushState.bind(history);
  const replace = history.replaceState.bind(history);
  history.pushState = (...args) => {
    push(...args);
    notify();
  };
  history.replaceState = (...args) => {
    replace(...args);
    notify();
  };
}

export function subscribeUrlSearch(onChange: () => void): () => void {
  patchHistory();
  listeners.add(onChange);
  window.addEventListener("popstate", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("popstate", onChange);
  };
}

function readSearch(): string {
  return window.location.search;
}

function readServerSearch(): string {
  return "";
}

export function useUrlSearch(): string {
  return useSyncExternalStore(subscribeUrlSearch, readSearch, readServerSearch);
}
