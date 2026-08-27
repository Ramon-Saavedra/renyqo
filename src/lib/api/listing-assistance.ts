import { apiPost, apiPostFormData } from "./client";
import type { ApiRequestOptions } from "./client";
import { z } from "zod";

const listingExtractionValuesSchema = z.object({
  city: z.string().optional(),
  zip: z.string().optional(),
  street: z.string().optional(),
  showExactAddress: z.boolean().optional(),
  objectType: z.enum(["APARTMENT", "HOUSE", "ROOM"]).optional(),
  livingArea: z.number().optional(),
  rooms: z.number().optional(),
  bedrooms: z.number().nullable().optional(),
  coldRent: z.number().optional(),
  additionalCosts: z.number().optional(),
  depositMonths: z.number().optional(),
  deposit: z.number().optional(),
  availableFrom: z.string().optional(),
  title: z.string().optional(),
  shortDescription: z.string().optional(),
  minimumHouseholdNetIncome: z.number().nullable().optional(),
  schufaRequired: z.boolean().optional(),
  incomeProofRequired: z.boolean().optional(),
  suitableForPeopleCount: z.number().nullable().optional(),
  petsPolicy: z.enum(["ALLOWED", "BY_ARRANGEMENT", "NOT_ALLOWED"]).optional(),
  smokingPolicy: z
    .enum(["ALLOWED", "BY_ARRANGEMENT", "NOT_ALLOWED"])
    .optional(),
  district: z.string().optional(),
});

const listingExtractionResultSchema = z.object({
  values: listingExtractionValuesSchema,
  requiredMissingFields: z.array(z.string()),
  recommendedMissingFields: z.array(z.string()),
  inconsistencies: z.array(
    z.object({ field: z.string(), message: z.string() }),
  ),
  warnings: z.array(z.string()),
});

export interface ListingExtractionIssue {
  readonly field: string;
  readonly message: string;
}

export type ListingExtractionValues = z.infer<
  typeof listingExtractionValuesSchema
>;

export type ListingExtractionResult = z.infer<
  typeof listingExtractionResultSchema
>;

const AI_EXTRACTIONS_BASE = "/api/v1/provider/listings/ai-extractions";
const FILE_FIELD = "file";

export async function extractListingFromText(
  text: string,
  options?: ApiRequestOptions,
): Promise<ListingExtractionResult> {
  return listingExtractionResultSchema.parse(
    await apiPost<unknown>(`${AI_EXTRACTIONS_BASE}/text`, { text }, options),
  );
}

export async function extractListingFromPdf(
  file: File,
  options?: ApiRequestOptions,
): Promise<ListingExtractionResult> {
  const formData = new FormData();
  formData.append(FILE_FIELD, file);
  return listingExtractionResultSchema.parse(
    await apiPostFormData<unknown>(
      `${AI_EXTRACTIONS_BASE}/pdf`,
      formData,
      options,
    ),
  );
}

export async function extractListingFromAudio(
  file: File,
  options?: ApiRequestOptions,
): Promise<ListingExtractionResult> {
  const formData = new FormData();
  formData.append(FILE_FIELD, file);
  return listingExtractionResultSchema.parse(
    await apiPostFormData<unknown>(
      `${AI_EXTRACTIONS_BASE}/audio`,
      formData,
      options,
    ),
  );
}
