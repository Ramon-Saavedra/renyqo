import { describe, expect, it } from "vitest";
import {
  hasApplicationAttentionSurface,
  hasListingAttentionSurface,
  matchesProviderAttentionFilter,
} from "./visibility";
import type { ApplicationAttentionSummary, AttentionTotals } from "./types";

const emptyCategories = {
  documentUploadCount: 0,
  documentReviewCount: 0,
  viewingActionCount: 0,
};

const baseSummary = (): ApplicationAttentionSummary => ({
  pendingActionCount: 0,
  hasPendingAction: false,
  actionableUnreadMessageCount: 0,
  categories: emptyCategories,
  targets: [],
  documentIndicators: [],
  nextRevalidateAt: null,
});

const baseTotals = (): AttentionTotals => ({
  applicationsWithPendingActions: 0,
  totalPendingActions: 0,
  actionableUnreadMessageCount: 0,
  categories: emptyCategories,
  nextRevalidateAt: null,
});

describe("matchesProviderAttentionFilter", () => {
  it("matches when totalPendingActions is positive", () => {
    expect(
      matchesProviderAttentionFilter({
        ...baseTotals(),
        totalPendingActions: 2,
      }),
    ).toBe(true);
  });

  it("matches when actionableUnreadMessageCount is positive", () => {
    expect(
      matchesProviderAttentionFilter({
        ...baseTotals(),
        actionableUnreadMessageCount: 1,
      }),
    ).toBe(true);
  });

  it("does not match on category counts alone", () => {
    expect(
      matchesProviderAttentionFilter({
        ...baseTotals(),
        categories: {
          documentUploadCount: 1,
          documentReviewCount: 0,
          viewingActionCount: 0,
        },
      }),
    ).toBe(false);
  });
});

describe("hasApplicationAttentionSurface", () => {
  it("uses backend hasPendingAction and counts", () => {
    expect(
      hasApplicationAttentionSurface({
        ...baseSummary(),
        hasPendingAction: true,
        pendingActionCount: 1,
      }),
    ).toBe(true);
    expect(
      hasApplicationAttentionSurface({
        ...baseSummary(),
        actionableUnreadMessageCount: 1,
      }),
    ).toBe(true);
  });

  it("treats UPLOAD_REQUIRED documentIndicators as a surface", () => {
    expect(
      hasApplicationAttentionSurface({
        ...baseSummary(),
        documentIndicators: [
          {
            requestId: "req-1",
            type: "SCHUFA",
            customLabel: null,
            status: "UPLOAD_REQUIRED",
          },
        ],
      }),
    ).toBe(true);
  });
});

describe("hasListingAttentionSurface", () => {
  it("includes provider filter semantics and category totals", () => {
    expect(
      hasListingAttentionSurface({
        ...baseTotals(),
        actionableUnreadMessageCount: 1,
      }),
    ).toBe(true);
    expect(
      hasListingAttentionSurface({
        ...baseTotals(),
        categories: {
          documentUploadCount: 0,
          documentReviewCount: 1,
          viewingActionCount: 0,
        },
      }),
    ).toBe(true);
  });
});
