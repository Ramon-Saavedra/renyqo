import type {
  ListingImage,
  ObjectTypeBackend,
  SmokingPolicyBackend,
} from "@/lib/api/listings";

export type ProfileMatchResult =
  | "match"
  | "no-match"
  | "incomplete"
  | "unknown";

export type ApplicantPetPolicy = "ALLOWED" | "BY_ARRANGEMENT" | "NOT_ALLOWED";

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

export interface PublicListingDetail {
  readonly id: string;
  readonly title: string | null;
  readonly location: string | null;
  readonly matchesProfile: ProfileMatchResult;
  readonly street: string | null;
  readonly zip: string | null;
  readonly city: string | null;
  readonly district: string | null;
  readonly objectType: ObjectTypeBackend | null;
  readonly livingArea: number | null;
  readonly rooms: number | null;
  readonly bedrooms: number | null;
  readonly coldRent: number | null;
  readonly additionalCosts: number | null;
  readonly deposit: number | null;
  readonly depositMonths: number | null;
  readonly availableFrom: string | null;
  readonly shortDescription: string | null;
  readonly publishedAt: string | null;
  readonly isNew: boolean;
  readonly images: readonly ListingImage[];

  readonly minimumHouseholdNetIncome: number | null;
  readonly schufaRequired: boolean;
  readonly incomeProofRequired: boolean;
  readonly suitableForPeopleCount: number | null;
  readonly petsPolicy: ApplicantPetPolicy | null;
  readonly smokingPolicy: SmokingPolicyBackend | null;
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
