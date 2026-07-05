import { apiPatch, apiPost } from "./client";

export type ObjectTypeBackend = "APARTMENT" | "HOUSE" | "ROOM";
export type PetPolicyBackend = "ALLOWED" | "BY_ARRANGEMENT" | "PREFER_NOT";
export type SmokingPolicyBackend = "ALLOWED" | "BY_ARRANGEMENT";

export interface CreateListingPayload {
  readonly address: string;
  readonly showExactAddress: boolean;
  readonly objectType: ObjectTypeBackend;
  readonly livingArea: number;
  readonly rooms: number;
  readonly bedrooms: number | null;
  readonly coldRent: number;
  readonly availableFrom: string;
  readonly title: string;
  readonly shortDescription: string;
  readonly minimumHouseholdNetIncome: number | null;
  readonly schufaRequired: boolean;
  readonly incomeProofRequired: boolean;
  readonly suitableForPeopleCount: number | null;
  readonly petsPolicy: PetPolicyBackend;
  readonly smokingPolicy: SmokingPolicyBackend;
}

export interface CreatedListing {
  readonly id: string;
}

export async function createListingDraft(
  payload: CreateListingPayload,
): Promise<CreatedListing> {
  return apiPost<CreatedListing>("/api/v1/provider/listings", payload);
}

export async function publishListing(id: string): Promise<void> {
  return apiPatch<void>(`/api/v1/provider/listings/${id}/publish`);
}
