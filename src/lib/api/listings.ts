import { apiPatch, apiPost, apiPostFormData } from "./client";

export type ObjectTypeBackend = "APARTMENT" | "HOUSE" | "ROOM";
export type PetPolicyBackend = "ALLOWED" | "BY_ARRANGEMENT" | "PREFER_NOT";
export type SmokingPolicyBackend =
  | "ALLOWED"
  | "BY_ARRANGEMENT"
  | "NON_SMOKERS_PREFERRED";

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
  appendCreateListingField(formData, "depositMonths", payload.depositMonths);
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

export async function uploadListingImage(
  id: string,
  file: File,
): Promise<CreatedListing> {
  const formData = new FormData();
  formData.append("file", file);

  return apiPostFormData<CreatedListing>(
    `/api/v1/provider/listings/${id}/images`,
    formData,
  );
}

export async function publishListing(id: string): Promise<void> {
  return apiPatch<void>(`/api/v1/provider/listings/${id}/publish`);
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
): Promise<void> {
  return apiPatch<void>(`/api/v1/provider/listings/${id}`, payload);
}
