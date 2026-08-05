import { EMPTY_FILTERS } from "../types";
import type { ListingFilters } from "../types";

export function countActiveFilters(filters: ListingFilters): number {
  let count = 0;
  if (filters.maxColdRent !== null) count += 1;
  if (filters.minRooms !== null) count += 1;
  if (filters.minLivingArea !== null) count += 1;
  if (filters.availableFrom !== null) count += 1;
  if (filters.onlyMatching) count += 1;
  return count;
}

export function hasActiveFilters(filters: ListingFilters): boolean {
  return countActiveFilters(filters) > 0 || filters.query.trim().length > 0;
}

export { EMPTY_FILTERS };
