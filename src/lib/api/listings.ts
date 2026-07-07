import { apiPatch, apiPost, apiPostFormData } from "./client";

export type ObjectTypeBackend = "APARTMENT" | "HOUSE" | "ROOM";
export type PetPolicyBackend = "ALLOWED" | "BY_ARRANGEMENT" | "PREFER_NOT";
export type SmokingPolicyBackend = "ALLOWED" | "BY_ARRANGEMENT" | "PREFER_NOT";

export interface CreateListingPayload {
  readonly city: string;
  readonly zip: string;
  readonly street?: string | undefined;
  readonly showExactAddress: boolean;
  readonly objectType: ObjectTypeBackend;
  readonly livingArea: number;
  readonly rooms: number;
  readonly bedrooms: number | null;
  readonly coldRent: number;
  readonly additionalCosts?: number | undefined;
  readonly deposit?: number | undefined;
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

function appendCreateListingField(
  formData: FormData,
  key: string,
  value: boolean | number | string | null | undefined,
): void {
  if (value === undefined || value === null) return;
  formData.append(key, String(value));
}

function buildCreateListingFormData(
  payload: CreateListingPayload,
  file: File,
): FormData {
  const formData = new FormData();

  appendCreateListingField(formData, "city", payload.city);
  appendCreateListingField(formData, "zip", payload.zip);
  appendCreateListingField(formData, "street", payload.street);
  appendCreateListingField(
    formData,
    "showExactAddress",
    payload.showExactAddress,
  );
  appendCreateListingField(formData, "objectType", payload.objectType);
  appendCreateListingField(formData, "livingArea", payload.livingArea);
  appendCreateListingField(formData, "rooms", payload.rooms);
  appendCreateListingField(formData, "bedrooms", payload.bedrooms);
  appendCreateListingField(formData, "coldRent", payload.coldRent);
  appendCreateListingField(
    formData,
    "additionalCosts",
    payload.additionalCosts,
  );
  appendCreateListingField(formData, "deposit", payload.deposit);
  appendCreateListingField(formData, "availableFrom", payload.availableFrom);
  appendCreateListingField(formData, "title", payload.title);
  appendCreateListingField(
    formData,
    "shortDescription",
    payload.shortDescription,
  );
  appendCreateListingField(
    formData,
    "minimumHouseholdNetIncome",
    payload.minimumHouseholdNetIncome,
  );
  appendCreateListingField(formData, "schufaRequired", payload.schufaRequired);
  appendCreateListingField(
    formData,
    "incomeProofRequired",
    payload.incomeProofRequired,
  );
  appendCreateListingField(
    formData,
    "suitableForPeopleCount",
    payload.suitableForPeopleCount,
  );
  appendCreateListingField(formData, "petsPolicy", payload.petsPolicy);
  appendCreateListingField(formData, "smokingPolicy", payload.smokingPolicy);
  formData.append("file", file);

  return formData;
}

export async function createListingDraft(
  payload: CreateListingPayload,
  file?: File,
): Promise<CreatedListing> {
  if (file) {
    return apiPostFormData<CreatedListing>(
      "/api/v1/provider/listings",
      buildCreateListingFormData(payload, file),
    );
  }

  return apiPost<CreatedListing>("/api/v1/provider/listings", payload);
}

export async function publishListing(id: string): Promise<void> {
  return apiPatch<void>(`/api/v1/provider/listings/${id}/publish`);
}
