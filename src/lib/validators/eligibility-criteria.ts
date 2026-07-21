/**
 * Optional eligibility criteria of a listing share one normalization contract
 * across the creation and the editing form:
 *
 * - `undefined` — not configured. The property must be omitted from a create
 *   payload, and means "deliberately cleared" when editing.
 * - `null` — invalid input. Submission must be blocked; never send it.
 * - `number` — a configured value, including the meaningful edge values `0`
 *   (income) and `1` (people count).
 *
 * Returning a distinct marker for invalid input is what keeps an unparseable
 * entry from silently collapsing into `0` or into an accidental clear.
 */
export type OptionalCriterion = number | undefined | null;

export function parseMinimumHouseholdNetIncome(
  value: string,
): OptionalCriterion {
  const trimmed = value.trim();
  if (trimmed.length === 0) return undefined;

  const parsed = Number(trimmed.replace(",", "."));
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
}

export function parseSuitableForPeopleCount(
  value: number | null,
): OptionalCriterion {
  if (value === null) return undefined;
  if (!Number.isInteger(value) || value < 1) return null;
  return value;
}

export function isConfiguredCriterion(
  value: OptionalCriterion,
): value is number {
  return typeof value === "number";
}
