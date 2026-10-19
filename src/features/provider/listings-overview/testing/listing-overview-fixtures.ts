import {
  emptyAttentionTotals,
  attentionTotalsForFilterMatch,
} from "@/lib/attention/fixtures";
import type { ListingOverviewItem } from "../types";

const FALLBACK_DATE = "1970-01-01T00:00:00.000Z";

export function createListingOverviewItem(
  overrides: Partial<ListingOverviewItem> = {},
): ListingOverviewItem {
  const attention = overrides.attention ?? emptyAttentionTotals();
  const needsAttention =
    overrides.needsAttention ??
    (attention.totalPendingActions > 0 ||
      attention.actionableUnreadMessageCount > 0);

  return {
    id: "listing-1",
    title: "Wohnung in Berlin",
    objectType: null,
    displayAddress: "Berlin",
    coverImageUrl: null,
    coldRent: 1200,
    deposit: 0,
    depositMonths: 0,
    livingArea: 70,
    rooms: 3,
    status: "published",
    activeApplicationsCount: 0,
    createdAt: FALLBACK_DATE,
    updatedAt: FALLBACK_DATE,
    publishedAt: null,
    availableFrom: null,
    ...overrides,
    attention,
    needsAttention,
  };
}

export function createListingNeedingAttention(
  overrides: Partial<ListingOverviewItem> = {},
): ListingOverviewItem {
  const attention = attentionTotalsForFilterMatch();
  return createListingOverviewItem({
    ...overrides,
    attention,
    needsAttention: true,
  });
}
