import { SELECTED_OBJECT_STORAGE_KEY } from "./copy/dashboard";

const selectedObjectListeners = new Set<() => void>();

export function emitSelectedObjectChange(): void {
  for (const listener of selectedObjectListeners) listener();
}

export function subscribeSelectedObject(onChange: () => void): () => void {
  selectedObjectListeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    selectedObjectListeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function getStoredSelectedObjectId(): string | null {
  return window.localStorage.getItem(SELECTED_OBJECT_STORAGE_KEY);
}

export function getServerSelectedObjectId(): null {
  return null;
}

export function setStoredSelectedObjectId(id: string): void {
  window.localStorage.setItem(SELECTED_OBJECT_STORAGE_KEY, id);
  emitSelectedObjectChange();
}
