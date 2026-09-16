import { ROOM_OPTIONS } from "../copy/listings";
import type { ListingFilters, SortKey } from "../types";
import { parseFilterInteger } from "./filter-value";

export const LISTINGS_SEARCH_PATH = "/listings";
export const LISTINGS_SEARCH_SESSION_KEY = "renyqo.listingsSearch";
export const LISTINGS_SEARCH_QUERY_MAX_LENGTH = 100;

export function clampListingsSearchQuery(value: string): string {
  return value.slice(0, LISTINGS_SEARCH_QUERY_MAX_LENGTH);
}

export function normalizeListingsSearchQuery(value: string): string {
  return clampListingsSearchQuery(value.trim());
}

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const ALLOWED_MIN_ROOMS = new Set(
  ROOM_OPTIONS.map((option) => option.value).filter(
    (value): value is number => value !== null,
  ),
);
const SORT_KEYS: readonly SortKey[] = [
  "newest",
  "price-asc",
  "price-desc",
  "area-desc",
];

export interface ListingsSearchState {
  readonly filters: ListingFilters;
  readonly sort: SortKey;
}

export interface SearchParamsReader {
  get(name: string): string | null;
}

function parsePositiveInteger(value: string | null): number | null {
  if (value === null) return null;
  return parseFilterInteger(value);
}

function parseMinRooms(value: string | null): number | null {
  const parsed = parsePositiveInteger(value);
  if (parsed === null || !ALLOWED_MIN_ROOMS.has(parsed)) return null;
  return parsed;
}

function parseOnlyMatching(value: string | null): boolean {
  return value === "1" || value === "true";
}

function isSortKey(value: string): value is SortKey {
  return SORT_KEYS.some((key) => key === value);
}

function parseSort(value: string | null): SortKey {
  if (value !== null && isSortKey(value)) {
    return value;
  }
  return "newest";
}

function parseAvailableFrom(value: string | null): string | null {
  if (value === null) return null;
  const match = DATE_ONLY_PATTERN.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return value;
}

export function parseListingsSearchParams(
  searchParams: SearchParamsReader,
): ListingsSearchState {
  return {
    filters: {
      query: normalizeListingsSearchQuery(searchParams.get("query") ?? ""),
      maxColdRent: parsePositiveInteger(searchParams.get("maxRent")),
      minRooms: parseMinRooms(searchParams.get("minRooms")),
      minLivingArea: parsePositiveInteger(searchParams.get("minLivingArea")),
      availableFrom: parseAvailableFrom(searchParams.get("availableBy")),
      onlyMatching: parseOnlyMatching(searchParams.get("onlyMatching")),
    },
    sort: parseSort(searchParams.get("sort")),
  };
}

export function serializeListingsSearchQuery(
  filters: ListingFilters,
  sort: SortKey,
): string {
  const params = new URLSearchParams();
  const query = normalizeListingsSearchQuery(filters.query);
  if (query.length > 0) params.set("query", query);
  if (filters.maxColdRent !== null) {
    params.set("maxRent", String(filters.maxColdRent));
  }
  if (filters.minRooms !== null) {
    params.set("minRooms", String(filters.minRooms));
  }
  if (filters.minLivingArea !== null) {
    params.set("minLivingArea", String(filters.minLivingArea));
  }
  if (filters.availableFrom !== null) {
    params.set("availableBy", filters.availableFrom);
  }
  if (filters.onlyMatching) params.set("onlyMatching", "1");
  if (sort !== "newest") params.set("sort", sort);
  return params.toString();
}

export function listingsSearchHref(
  filters: ListingFilters,
  sort: SortKey,
  pathname = LISTINGS_SEARCH_PATH,
): string {
  const query = serializeListingsSearchQuery(filters, sort);
  return query.length > 0 ? `${pathname}?${query}` : pathname;
}

const listingsSearchListeners = new Set<() => void>();

function notifyListingsSearchChange(): void {
  for (const listener of listingsSearchListeners) listener();
}

export function subscribeListingsSearchBackHref(
  listener: () => void,
): () => void {
  listingsSearchListeners.add(listener);
  return () => {
    listingsSearchListeners.delete(listener);
  };
}

export function getServerListingsSearchBackHref(): string {
  return LISTINGS_SEARCH_PATH;
}

export function clearListingsSearchSession(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(LISTINGS_SEARCH_SESSION_KEY);
    notifyListingsSearchChange();
  } catch {}
}

export function persistListingsSearchQuery(query: string): void {
  if (typeof window === "undefined") return;
  try {
    if (query.length === 0) {
      clearListingsSearchSession();
      return;
    }
    window.sessionStorage.setItem(LISTINGS_SEARCH_SESSION_KEY, query);
    notifyListingsSearchChange();
  } catch {}
}

export function listingsSearchBackHref(): string {
  if (typeof window === "undefined") return LISTINGS_SEARCH_PATH;
  try {
    const stored = window.sessionStorage.getItem(LISTINGS_SEARCH_SESSION_KEY);
    if (stored === null || stored.length === 0) return LISTINGS_SEARCH_PATH;
    const parsed = parseListingsSearchParams(new URLSearchParams(stored));
    return listingsSearchHref(parsed.filters, parsed.sort);
  } catch {
    return LISTINGS_SEARCH_PATH;
  }
}
