import { apiGet, apiPatchVoid } from "@/lib/api/client";
import { normalizeObjectType } from "@/lib/api/listings";
import {
  isRecord,
  readBoolean,
  readCoverImageUrl,
  readItems,
  readNullableString,
  readNumber,
  readString,
} from "@/lib/api/response-mappers";
import type {
  AttentionReason,
  ListingOverviewItem,
  ListingStatus,
} from "../types";
import { parseActiveApplicationsCount } from "./parse-active-applications-count";

const FALLBACK_DATE = "1970-01-01T00:00:00.000Z";

function normalizeStatus(value: string | null): ListingStatus {
  const normalized = value?.toLowerCase();
  if (normalized === "published") return "published";
  if (normalized === "draft") return "draft";
  if (normalized === "paused") return "paused";
  if (normalized === "archived") return "archived";
  return "draft";
}

function normalizeAttentionReason(value: string | null): AttentionReason {
  if (
    value === "open_questions" ||
    value === "manual_review" ||
    value === "missing_data"
  ) {
    return value;
  }
  return null;
}

function buildDisplayAddress(record: Record<string, unknown>): string {
  const existing = readString(record, ["displayAddress", "address"]);
  if (existing) return existing;

  const street = readString(record, ["street"]);
  const zip = readString(record, ["zip", "postalCode"]);
  const city = readString(record, ["city"]);
  const district = readString(record, ["district", "neighborhood"]);
  const place = [city, district].filter(Boolean).join(", ");
  const zipPlace = [place, zip].filter(Boolean).join(" · ");

  return [street, zipPlace].filter(Boolean).join(" · ") || "Adresse offen";
}

function mapProviderListing(value: unknown): ListingOverviewItem | null {
  if (!isRecord(value)) return null;

  const id = readString(value, ["id"]);
  if (!id) return null;

  const openQuestionsCount =
    readNumber(value, [
      "openQuestionsCount",
      "openQuestions",
      "questionsOpen",
    ]) ?? 0;
  const needsAttention =
    readBoolean(value, ["needsAttention"]) ?? openQuestionsCount > 0;
  const attentionReason =
    normalizeAttentionReason(
      readNullableString(value, ["attentionReason", "attention_reason"]),
    ) ?? (needsAttention ? "open_questions" : null);

  const activeApplicationsCount = parseActiveApplicationsCount(
    value.activeApplicationsCount,
  );

  return {
    id,
    title: readString(value, ["title"]) ?? "Unbenanntes Objekt",
    objectType: normalizeObjectType(readString(value, ["objectType", "type"])),
    displayAddress: buildDisplayAddress(value),
    coverImageUrl: readCoverImageUrl(value),
    coldRent: readNumber(value, ["coldRent", "rent", "price"]) ?? 0,
    deposit: readNumber(value, ["deposit"]) ?? 0,
    depositMonths: readNumber(value, ["depositMonths"]) ?? 0,
    livingArea: readNumber(value, ["livingArea", "area"]) ?? 0,
    rooms: readNumber(value, ["rooms"]) ?? 0,
    activeApplicationsCount,
    openQuestionsCount,
    status: normalizeStatus(readString(value, ["status"])),
    needsAttention,
    attentionReason,
    createdAt: readString(value, ["createdAt"]) ?? FALLBACK_DATE,
    updatedAt: readString(value, ["updatedAt"]) ?? FALLBACK_DATE,
    publishedAt: readNullableString(value, ["publishedAt"]),
    availableFrom: readNullableString(value, [
      "availableFrom",
      "available_from",
      "moveInDate",
      "move_in_date",
    ]),
  };
}

function isListingOverviewItem(
  item: ListingOverviewItem | null,
): item is ListingOverviewItem {
  return item !== null;
}

export async function getProviderListings(): Promise<
  readonly ListingOverviewItem[]
> {
  const response = await apiGet<unknown>("/api/v1/provider/listings");
  return readItems(response)
    .map(mapProviderListing)
    .filter(isListingOverviewItem);
}

export async function publishProviderListing(id: string): Promise<void> {
  await apiPatchVoid(`/api/v1/provider/listings/${id}/publish`);
}

export async function moveProviderListingToDraft(id: string): Promise<void> {
  await apiPatchVoid(`/api/v1/provider/listings/${id}/draft`);
}

export async function archiveProviderListing(id: string): Promise<void> {
  await apiPatchVoid(`/api/v1/provider/listings/${id}/archive`);
}
