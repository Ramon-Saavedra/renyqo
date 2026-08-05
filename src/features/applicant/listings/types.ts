export type SortKey = "newest" | "price-asc" | "price-desc" | "area-desc";

export type FilterKey = "coldRent" | "rooms" | "livingArea" | "availableFrom";

export interface PublicListing {
  readonly id: string;
  readonly title: string;
  readonly location: string;
  readonly rooms: number;
  readonly livingArea: number;
  readonly availableFrom: string | null;
  readonly coldRent: number;
  readonly serviceCharge: number;
  readonly matchesProfile: boolean | null;
  readonly isNew: boolean;
  readonly coverImageUrl: string | null;
  readonly publishedAt: string;
}

export interface ListingFilters {
  readonly query: string;
  readonly maxColdRent: number | null;
  readonly minRooms: number | null;
  readonly minLivingArea: number | null;
  readonly availableFrom: string | null;
  readonly onlyMatching: boolean;
}

export const EMPTY_FILTERS: ListingFilters = {
  query: "",
  maxColdRent: null,
  minRooms: null,
  minLivingArea: null,
  availableFrom: null,
  onlyMatching: false,
};

export interface PublicListingsParams {
  readonly query?: string | undefined;
  readonly maxRent?: number | null | undefined;
  readonly minRooms?: number | null | undefined;
  readonly minLivingArea?: number | null | undefined;
  readonly availableBy?: string | undefined;
  readonly onlyMatching?: boolean | undefined;
  readonly sort?: SortKey | undefined;
  readonly cursor?: string | undefined;
  readonly limit?: number | undefined;
}

export interface PublicListingsResponse {
  readonly listings: readonly PublicListing[];
  readonly total: number;
  readonly nextCursor: string | null;
}
