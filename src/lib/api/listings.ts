import type { ApiRequestOptions } from "@/lib/api/client";
import {
  apiDeleteVoid,
  apiPatch,
  apiPatchVoid,
  apiPost,
  apiPostFormData,
} from "./client";

export type ObjectTypeBackend = "APARTMENT" | "HOUSE" | "ROOM";

export function normalizeObjectType(
  value: string | null,
): ObjectTypeBackend | null {
  switch (value?.toUpperCase()) {
    case "APARTMENT":
      return "APARTMENT";
    case "HOUSE":
      return "HOUSE";
    case "ROOM":
      return "ROOM";
    default:
      return null;
  }
}

export const OBJECT_TYPE_LABEL: Record<ObjectTypeBackend, string> = {
  APARTMENT: "Wohnung",
  HOUSE: "Haus",
  ROOM: "Zimmer",
};

export type PetPolicyBackend = "ALLOWED" | "BY_ARRANGEMENT" | "NOT_ALLOWED";
export type SmokingPolicyBackend = "ALLOWED" | "BY_ARRANGEMENT" | "NOT_ALLOWED";

export const SMOKING_POLICY_LABEL: Record<SmokingPolicyBackend, string> = {
  ALLOWED: "Erlaubt",
  BY_ARRANGEMENT: "Auf Anfrage",
  NOT_ALLOWED: "Nicht erlaubt",
};

export interface CreateListingPayload {
  readonly city?: string | undefined;
  readonly zip?: string | undefined;
  readonly street?: string | undefined;
  readonly showExactAddress?: boolean | undefined;
  readonly objectType?: ObjectTypeBackend | undefined;
  readonly livingArea?: number | undefined;
  readonly rooms?: number | undefined;
  readonly bedrooms?: number | null | undefined;
  readonly coldRent?: number | undefined;
  readonly additionalCosts?: number | undefined;
  readonly depositMonths?: number | undefined;
  readonly deposit?: number | undefined;
  readonly availableFrom?: string | undefined;
  readonly title?: string | undefined;
  readonly shortDescription?: string | undefined;
  readonly minimumHouseholdNetIncome?: number | null | undefined;
  readonly schufaRequired?: boolean | undefined;
  readonly incomeProofRequired?: boolean | undefined;
  readonly suitableForPeopleCount?: number | null | undefined;
  readonly petsPolicy?: PetPolicyBackend | undefined;
  readonly smokingPolicy?: SmokingPolicyBackend | undefined;
}

export interface ListingImage {
  readonly id: string;
  readonly secureUrl: string;
  readonly position: number;
  readonly isCover: boolean;
}

export interface CreatedListing {
  readonly id: string;
}

export async function createListingDraft(
  payload: CreateListingPayload & { readonly commandId: string },
  providerOptions?: ApiRequestOptions,
): Promise<CreatedListing> {
  return apiPost<CreatedListing>(
    "/api/v1/provider/listings",
    payload,
    providerOptions,
  );
}

export async function uploadListingImage(
  id: string,
  file: File,
  providerOptions?: ApiRequestOptions,
): Promise<ListingImage> {
  const formData = new FormData();
  formData.append("file", file);

  return apiPostFormData<ListingImage>(
    `/api/v1/provider/listings/${id}/images`,
    formData,
    providerOptions,
  );
}

export async function deleteListingImage(
  id: string,
  imageId: string,
  providerOptions?: ApiRequestOptions,
): Promise<void> {
  return apiDeleteVoid(
    `/api/v1/provider/listings/${id}/images/${imageId}`,
    providerOptions,
  );
}

export async function reorderListingImages(
  listingId: string,
  imageIds: readonly string[],
  providerOptions?: ApiRequestOptions,
): Promise<void> {
  return apiPatch<void>(
    `/api/v1/provider/listings/${listingId}/images/order`,
    {
      imageIds,
    },
    providerOptions,
  );
}

export async function publishListing(
  id: string,
  providerOptions?: ApiRequestOptions,
): Promise<void> {
  return apiPatchVoid(
    `/api/v1/provider/listings/${id}/publish`,
    providerOptions,
  );
}

export type UpdateListingPayload = Partial<{
  title: string;
  objectType: ObjectTypeBackend;
  street: string;
  zip: string;
  city: string;
  showExactAddress: boolean;
  coldRent: number;
  additionalCosts: number;
  deposit: number;
  depositMonths: number;
  livingArea: number;
  rooms: number;
  bedrooms: number | null;
  availableFrom: string;
  shortDescription: string;
  minimumHouseholdNetIncome: number | null;
  suitableForPeopleCount: number | null;
  schufaRequired: boolean;
  incomeProofRequired: boolean;
  petsPolicy: PetPolicyBackend;
  smokingPolicy: SmokingPolicyBackend;
}>;

export async function updateListing(
  id: string,
  payload: UpdateListingPayload,
  providerOptions?: ApiRequestOptions,
): Promise<void> {
  return apiPatch<void>(
    `/api/v1/provider/listings/${id}`,
    payload,
    providerOptions,
  );
}
