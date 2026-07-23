import type {
  ListingImage,
  ObjectTypeBackend,
  PetPolicyBackend,
  SmokingPolicyBackend,
} from "@/lib/api/listings";
import type { ListingStatus } from "../listings-overview/types";

export type { ListingStatus } from "../listings-overview/types";
export type { ListingImage } from "@/lib/api/listings";

export interface ListingDetail {
  readonly id: string;
  readonly title: string;
  readonly status: ListingStatus;
  readonly objectType: ObjectTypeBackend | null;

  readonly street: string | null;
  readonly zip: string | null;
  readonly city: string | null;
  readonly showExactAddress: boolean | null;
  readonly headerAddress: string;

  readonly coldRent: number | null;
  readonly additionalCosts: number | null;
  readonly deposit: number | null;
  readonly depositMonths: number | null;
  readonly livingArea: number | null;
  readonly rooms: number | null;
  readonly bedrooms: number | null;
  readonly availableFrom: string | null;

  readonly shortDescription: string | null;

  readonly schufaRequired: boolean | null;
  readonly incomeProofRequired: boolean | null;
  readonly minimumHouseholdNetIncome: number | null;
  readonly suitableForPeopleCount: number | null;
  readonly petsPolicy: PetPolicyBackend | null;
  readonly smokingPolicy: SmokingPolicyBackend | null;

  readonly images: readonly ListingImage[];

  readonly createdAt: string | null;
  readonly updatedAt: string | null;
  readonly publishedAt: string | null;
}

export type DetailAction = "publish" | "draft" | "archive";
