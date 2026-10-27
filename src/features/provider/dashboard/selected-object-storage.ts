import { subscribeUrlSearch } from "@/lib/navigation/url-search";
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

const LISTING_QUERY = "listingId";

export function getUrlSelectedListingId(): string | null {
  const listingId = new URLSearchParams(window.location.search).get(
    LISTING_QUERY,
  );
  return listingId && listingId.length > 0 ? listingId : null;
}

export function getServerUrlSelectedListingId(): null {
  return null;
}

export function subscribeSelectedListing(onChange: () => void): () => void {
  return subscribeUrlSearch(onChange);
}

export function selectDashboardListing(id: string): void {
  const url = new URL(window.location.href);
  if (url.searchParams.get(LISTING_QUERY) !== id) {
    url.searchParams.set(LISTING_QUERY, id);
    window.history.replaceState(window.history.state, "", url);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }
  setStoredSelectedObjectId(id);
}
