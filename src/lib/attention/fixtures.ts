import type { ApplicationAttentionSummary, AttentionTotals } from "./types";

export const emptyAttentionCategories = {
  documentUploadCount: 0,
  documentReviewCount: 0,
  viewingActionCount: 0,
};

export function emptyApplicationAttentionSummary(): ApplicationAttentionSummary {
  return {
    pendingActionCount: 0,
    hasPendingAction: false,
    actionableUnreadMessageCount: 0,
    categories: { ...emptyAttentionCategories },
    targets: [],
    documentIndicators: [],
    nextRevalidateAt: null,
  };
}

export function emptyAttentionTotals(): AttentionTotals {
  return {
    applicationsWithPendingActions: 0,
    totalPendingActions: 0,
    actionableUnreadMessageCount: 0,
    categories: { ...emptyAttentionCategories },
    nextRevalidateAt: null,
  };
}

export function attentionTotalsForFilterMatch(): AttentionTotals {
  return {
    ...emptyAttentionTotals(),
    totalPendingActions: 1,
    applicationsWithPendingActions: 1,
  };
}
