import type { ApplicationAttentionSummary, AttentionTotals } from "./types";

export function matchesProviderAttentionFilter(
  attention: AttentionTotals,
): boolean {
  return (
    attention.totalPendingActions > 0 ||
    attention.actionableUnreadMessageCount > 0
  );
}

export function hasApplicationAttentionSurface(
  attention: ApplicationAttentionSummary,
): boolean {
  if (attention.hasPendingAction) return true;
  if (attention.actionableUnreadMessageCount > 0) return true;
  if (
    attention.documentIndicators.some(
      (indicator) => indicator.status === "UPLOAD_REQUIRED",
    )
  ) {
    return true;
  }
  const { categories } = attention;
  return (
    categories.documentUploadCount > 0 ||
    categories.documentReviewCount > 0 ||
    categories.viewingActionCount > 0
  );
}

export function hasListingAttentionSurface(
  attention: AttentionTotals,
): boolean {
  if (matchesProviderAttentionFilter(attention)) return true;
  const { categories } = attention;
  return (
    categories.documentUploadCount > 0 ||
    categories.documentReviewCount > 0 ||
    categories.viewingActionCount > 0
  );
}
