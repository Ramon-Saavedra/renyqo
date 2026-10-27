import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAttentionAggregate } from "../api/get-attention-aggregate";
import {
  emptyApplicationAttentionSummary,
  emptyAttentionTotals,
} from "../fixtures";
import {
  clearGlobalAttention,
  useGlobalAttention,
} from "./use-global-attention";

vi.mock("../api/get-attention-aggregate", () => ({
  getAttentionAggregate: vi.fn(),
}));

describe("useGlobalAttention", () => {
  beforeEach(() => {
    clearGlobalAttention();
    vi.mocked(getAttentionAggregate).mockReset();
  });

  it("keeps loaded notices after a pagination failure and permits retry", async () => {
    const item = {
      ...emptyApplicationAttentionSummary(),
      applicationId: "app-1",
      listingId: "listing-1",
      listingTitle: "Nordhorn",
      listingCity: "Nordhorn",
      actionableUnreadMessageCount: 1,
    };
    const page = {
      asOf: "2026-10-19T00:00:00.000Z",
      totals: {
        ...emptyAttentionTotals(),
        actionableUnreadMessageCount: 5,
      },
      listings: [],
      items: [item],
      pagination: { limit: 20, offset: 0, hasMore: true, totalApplications: 2 },
    };
    vi.mocked(getAttentionAggregate)
      .mockResolvedValueOnce(page)
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce({
        ...page,
        items: [{ ...item, applicationId: "app-2" }],
        pagination: { ...page.pagination, offset: 20, hasMore: false },
      });
    const { result, unmount } = renderHook(() =>
      useGlobalAttention("applicant"),
    );
    await waitFor(() => expect(result.current.messageGroups).toHaveLength(1));
    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.loadMoreError).toBe(true));
    expect(result.current.messageGroups).toHaveLength(1);
    expect(result.current.attentionGroups).toHaveLength(0);
    expect(result.current.messageCount).toBe(5);
    expect(result.current.attentionCount).toBe(0);
    expect(result.current.error).toBe(false);
    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.messageGroups).toHaveLength(2));
    act(() => clearGlobalAttention());
    expect(result.current.messageGroups).toHaveLength(0);
    expect(result.current.messageCount).toBe(0);
    unmount();
  });
  it.each(["applicant", "provider"] as const)(
    "loads actionable groups and subsequent pages for %s",
    async (role) => {
      const item = (id: string) => ({
        ...emptyApplicationAttentionSummary(),
        applicationId: id,
        listingId: "listing-1",
        listingTitle: "Zimmer in Nordhorn",
        listingCity: "Nordhorn",
        actionableUnreadMessageCount: 3,
      });
      const page = {
        asOf: "2026-10-19T00:00:00.000Z",
        totals: { ...emptyAttentionTotals(), actionableUnreadMessageCount: 63 },
        listings: [],
        items: Array.from({ length: 20 }, (_, i) => item(`app-${i}`)),
        pagination: {
          offset: 0,
          limit: 20,
          totalApplications: 21,
          hasMore: true,
        },
      };
      vi.mocked(getAttentionAggregate)
        .mockResolvedValueOnce(page)
        .mockResolvedValueOnce({
          ...page,
          items: [item("app-20")],
          pagination: { ...page.pagination, offset: 20, hasMore: false },
        });

      const { result, unmount } = renderHook(() => useGlobalAttention(role));
      await waitFor(() =>
        expect(result.current.messageGroups).toHaveLength(20),
      );
      expect(getAttentionAggregate).toHaveBeenCalledWith(role, {
        filter: "actionable",
        limit: 20,
        offset: 0,
      });
      expect(result.current.messageCount).toBe(63);
      expect(result.current.attentionCount).toBe(0);
      expect(result.current.attentionGroups).toHaveLength(0);
      expect(result.current.hasMore).toBe(true);
      act(() => result.current.loadMore());
      await waitFor(() =>
        expect(result.current.messageGroups).toHaveLength(21),
      );
      expect(result.current.messageCount).toBe(63);
      expect(getAttentionAggregate).toHaveBeenLastCalledWith(role, {
        filter: "actionable",
        limit: 20,
        offset: 20,
      });
      expect(result.current.hasMore).toBe(false);
      unmount();
    },
  );

  it("reads badge totals from the aggregate and ignores message-only applications", async () => {
    vi.mocked(getAttentionAggregate).mockResolvedValue({
      asOf: "2026-10-19T00:00:00.000Z",
      totals: {
        ...emptyAttentionTotals(),
        applicationsWithPendingActions: 2,
        actionableUnreadMessageCount: 4,
      },
      listings: [],
      items: [
        {
          ...emptyApplicationAttentionSummary(),
          applicationId: "messages-only",
          listingId: "listing-1",
          listingTitle: "Nur Nachricht",
          listingCity: null,
          actionableUnreadMessageCount: 1,
        },
        {
          ...emptyApplicationAttentionSummary(),
          applicationId: "action-only",
          listingId: "listing-2",
          listingTitle: "Nur Aktion",
          listingCity: null,
          pendingActionCount: 1,
          hasPendingAction: true,
          categories: {
            documentUploadCount: 0,
            documentReviewCount: 0,
            viewingActionCount: 1,
          },
        },
        {
          ...emptyApplicationAttentionSummary(),
          applicationId: "mixed",
          listingId: "listing-3",
          listingTitle: "Beides",
          listingCity: null,
          pendingActionCount: 1,
          hasPendingAction: true,
          actionableUnreadMessageCount: 1,
        },
      ],
      pagination: {
        offset: 0,
        limit: 20,
        totalApplications: 8,
        hasMore: false,
      },
    });

    const { result, unmount } = renderHook(() =>
      useGlobalAttention("applicant"),
    );
    await waitFor(() => expect(result.current.attentionGroups).toHaveLength(2));
    expect(result.current.attentionCount).toBe(2);
    expect(result.current.messageCount).toBe(4);
    expect(
      result.current.attentionGroups.flatMap((group) =>
        group.chips.map((row) => row.chip.kind),
      ),
    ).toEqual(["viewing", "pending"]);
    expect(
      result.current.messageGroups.map((group) => group.applicationId),
    ).toEqual(["messages-only", "mixed"]);
    unmount();
  });
});
