export function parseListingNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  const parsed = Number(trimmed.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function isPositiveListingNumber(value: string): boolean {
  const parsed = parseListingNumber(value);
  return parsed !== undefined && parsed > 0;
}

export function isNonNegativeListingNumber(value: string): boolean {
  const parsed = parseListingNumber(value);
  return parsed !== undefined && parsed >= 0;
}

export function toNonNegativeInteger(value: string): number | null {
  const parsed = parseListingNumber(value);
  if (parsed === undefined || !Number.isInteger(parsed) || parsed < 0)
    return null;
  return parsed;
}

export function normalizeListingDate(value: string): string | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return undefined;

  const [, yearValue, monthValue, dayValue] = match;
  if (!yearValue || !monthValue || !dayValue) return undefined;

  const year = Number(yearValue);
  const month = Number(monthValue);
  const day = Number(dayValue);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return undefined;
  }

  return date.toISOString();
}

export function isValidListingDate(value: string): boolean {
  return normalizeListingDate(value) !== undefined;
}

/**
 * Returns `true` when the bedrooms-to-rooms relationship is valid.
 *
 * - If either value is empty or individually invalid the function returns
 *   `true` — the intent is to avoid double-reporting errors that are already
 *   surfaced by the individual validators.
 * - Bedrooms is parsed as a non-negative integer; rooms as a positive number
 *   (decimals allowed).
 * - Bedrooms must not exceed rooms when both values are present and valid.
 */
export function isBedroomRoomRelationshipValid(
  rooms: string,
  bedrooms: string,
): boolean {
  const roomsNum = parseListingNumber(rooms);
  const bedroomsNum = toNonNegativeInteger(bedrooms);

  // Only compare when both values are valid numbers.
  if (roomsNum === undefined || bedroomsNum === null) return true;

  return bedroomsNum <= roomsNum;
}
