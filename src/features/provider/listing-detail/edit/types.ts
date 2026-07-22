import type {
  ObjectTypeBackend,
  PetPolicyBackend,
  SmokingPolicyBackend,
} from "@/lib/api/listings";

/**
 * Editable projection of a {@link ListingDetail}. Numeric fields that are
 * edited through text inputs are kept as strings so the inputs stay
 * controlled; stepper-driven counts stay nullable numbers.
 */
export interface ListingEditForm {
  title: string;
  objectType: ObjectTypeBackend;

  street: string;
  zip: string;
  city: string;
  showExactAddress: boolean;

  coldRent: string;
  additionalCosts: string;
  deposit: string;
  depositMonths: number | null;
  livingArea: string;
  rooms: string;
  bedrooms: string;
  availableFrom: string;

  shortDescription: string;

  minimumHouseholdNetIncome: string;
  suitableForPeopleCount: number | null;
  schufaRequired: boolean;
  incomeProofRequired: boolean;
  petsPolicy: PetPolicyBackend | "";
  smokingPolicy: SmokingPolicyBackend | "";
}

export type EditFieldSetter = <K extends keyof ListingEditForm>(
  field: K,
  value: ListingEditForm[K],
) => void;

export type ListingEditErrorKey =
  | "title"
  | "coldRent"
  | "additionalCosts"
  | "deposit"
  | "depositMonths"
  | "livingArea"
  | "rooms"
  | "bedrooms"
  | "minimumHouseholdNetIncome"
  | "suitableForPeopleCount";

export type ListingEditErrors = Partial<Record<ListingEditErrorKey, string>>;
