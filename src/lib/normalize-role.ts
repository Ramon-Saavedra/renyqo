/**
 * Normalizes a role string to lowercase "applicant" or "provider",
 * or returns null for any unrecognized value (including undefined).
 *
 * Importable from both client components and Edge/server middleware
 * without any React or browser-only dependencies.
 */
export function normalizeRole(
  value: string | undefined,
): "applicant" | "provider" | null {
  const normalized = value?.trim().toLowerCase();
  if (normalized === "applicant" || normalized === "provider") {
    return normalized;
  }
  return null;
}
