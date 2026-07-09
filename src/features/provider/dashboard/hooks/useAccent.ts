import { useSyncExternalStore } from "react";
import {
  ACCENT_STORAGE_KEY,
  DEFAULT_ACCENT,
  isAccentId,
} from "../copy/dashboard";
import type { AccentId } from "../copy/dashboard";

const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function getSnapshot(): AccentId {
  const stored = window.localStorage.getItem(ACCENT_STORAGE_KEY);
  return isAccentId(stored) ? stored : DEFAULT_ACCENT;
}

function getServerSnapshot(): AccentId {
  return DEFAULT_ACCENT;
}

export function setStoredAccent(accent: AccentId) {
  window.localStorage.setItem(ACCENT_STORAGE_KEY, accent);
  emit();
}

export function useAccent(): AccentId {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
