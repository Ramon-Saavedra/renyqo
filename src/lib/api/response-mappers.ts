// Shared defensive JSON → domain-object mappers.
// Import from here instead of duplicating per feature.
export type ApiRecord = Record<string, unknown>;

export function isRecord(value: unknown): value is ApiRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function readString(
  record: ApiRecord,
  keys: readonly string[],
): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }
  return null;
}

export function readNullableString(
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

export function readNumber(
  record: ApiRecord,
  keys: readonly string[],
): number | null {
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

export function readBoolean(
  record: ApiRecord,
  keys: readonly string[],
): boolean | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "boolean") return value;
  }
  return null;
}

/**
 * Reads items from common response envelope keys.
 * Accepts a raw array or an object with `items`, `listings`, or `data`.
 */
export function readItems(response: unknown): readonly unknown[] {
  if (Array.isArray(response)) return response;
  if (!isRecord(response)) return [];

  const candidates = [response.items, response.listings, response.data];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }
  return [];
}

/**
 * Defensively reads a cover image URL from common backend shapes.
 *
 * Checks (in order):
 * 1. Top-level string fields (coverImageUrl, coverUrl, imageUrl, thumbnailUrl).
 * 2. Nested `coverImage` object with `secureUrl`, `secure_url`, `url`, etc.
 * 3. Flat image arrays: `images`, `photos`, `listingImages`, `listing_images`.
 */
export function readCoverImageUrl(record: ApiRecord): string | null {
  // 1. Direct top-level string fields.
  const direct = readString(record, [
    "coverImageUrl",
    "coverUrl",
    "imageUrl",
    "thumbnailUrl",
  ]);
  if (direct) return direct;

  // 2. Nested coverImage object.
  const coverImage = record.coverImage;
  if (isRecord(coverImage)) {
    const nested = readString(coverImage, [
      "secureUrl",
      "secure_url",
      "url",
      "src",
      "imageUrl",
      "publicUrl",
      "fileUrl",
    ]);
    if (nested) return nested;
  }

  // 3. Flat image arrays.
  const images =
    record.images ??
    record.photos ??
    record.listingImages ??
    record.listing_images;
  if (!Array.isArray(images)) return null;

  const firstImage = images[0];
  if (typeof firstImage === "string" && firstImage.trim().length > 0) {
    return firstImage;
  }
  if (!isRecord(firstImage)) return null;

  return (
    readString(firstImage, [
      "secureUrl",
      "secure_url",
      "url",
      "src",
      "imageUrl",
      "publicUrl",
      "fileUrl",
    ]) ?? null
  );
}
