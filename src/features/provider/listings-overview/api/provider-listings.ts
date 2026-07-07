import { apiGet } from "@/lib/api/client";
import type {
  AttentionReason,
  ListingOverviewItem,
  ListingStatus,
} from "../types";

type ApiRecord = Record<string, unknown>;

const FALLBACK_DATE = "1970-01-01T00:00:00.000Z";

function isRecord(value: unknown): value is ApiRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(record: ApiRecord, keys: readonly string[]): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }
  return null;
}

function readNullableString(
  record: ApiRecord,
  keys: readonly string[],
): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string") return value;
    if (value === null) return null;
  }
  return null;
}

function readNumber(record: ApiRecord, keys: readonly string[]): number | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
}

function readBoolean(
  record: ApiRecord,
  keys: readonly string[],
): boolean | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "boolean") return value;
  }
  return null;
}

function normalizeStatus(value: string | null): ListingStatus {
  const normalized = value?.toLowerCase();
  if (normalized === "published" || normalized === "active") return "published";
  if (normalized === "draft") return "draft";
  if (normalized === "paused") return "paused";
  if (normalized === "rented") return "rented";
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

function buildDisplayAddress(record: ApiRecord): string {
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

function readRows(response: unknown): readonly unknown[] {
  if (Array.isArray(response)) return response;
  if (!isRecord(response)) return [];

  const candidates = [response.listings, response.data, response.items];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }
  return [];
}

function readCoverImageUrl(record: ApiRecord): string | null {
  const direct = readString(record, [
    "coverImageUrl",
    "coverUrl",
    "imageUrl",
    "thumbnailUrl",
  ]);
  if (direct) return direct;

  const coverImage = record.coverImage;
  if (isRecord(coverImage)) {
    const nested = readString(coverImage, [
      "url",
      "src",
      "imageUrl",
      "publicUrl",
      "fileUrl",
    ]);
    if (nested) return nested;
  }

  const images =
    record.photos ??
    record.images ??
    record.listingImages ??
    record.listing_images;
  if (!Array.isArray(images)) return null;

  const firstImage = images[0];
  if (typeof firstImage === "string" && firstImage.trim().length > 0) {
    return firstImage;
  }
  if (!isRecord(firstImage)) return null;

  return readString(firstImage, [
    "url",
    "src",
    "imageUrl",
    "publicUrl",
    "fileUrl",
  ]);
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

  return {
    id,
    title: readString(value, ["title"]) ?? "Unbenanntes Objekt",
    displayAddress: buildDisplayAddress(value),
    coverImageUrl: readCoverImageUrl(value),
    coldRent: readNumber(value, ["coldRent", "rent", "price"]) ?? 0,
    livingArea: readNumber(value, ["livingArea", "area"]) ?? 0,
    rooms: readNumber(value, ["rooms"]) ?? 0,
    applicationsTotal:
      readNumber(value, [
        "applicationsTotal",
        "applicationsCount",
        "applicationCount",
      ]) ?? 0,
    openQuestionsCount,
    status: normalizeStatus(readString(value, ["status"])),
    needsAttention,
    attentionReason,
    createdAt: readString(value, ["createdAt"]) ?? FALLBACK_DATE,
    updatedAt: readString(value, ["updatedAt"]) ?? FALLBACK_DATE,
    publishedAt: readNullableString(value, ["publishedAt"]),
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
  return readRows(response)
    .map(mapProviderListing)
    .filter(isListingOverviewItem);
}
