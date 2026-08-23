import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { withdrawListingApplication } from "../api/listing-withdrawal";
import { useListingWithdrawal } from "./useListingWithdrawal";

vi.mock("../api/listing-withdrawal", () => ({ withdrawListingApplication: vi.fn() }));

describe("useListingWithdrawal", () => {
  it("prevents concurrent withdrawals for the live application", async () => {
    const response = {
      id: "live-id",
      listingId: "listing",
      status: "WITHDRAWN" as const,
      rejectedAt: null,
      publicReason: null,
      createdAt: "2026-08-23T10:00:00.000Z",
      updatedAt: "2026-08-23T10:00:00.000Z",
    };
    let resolveRequest: (() => void) | undefined;
    vi.mocked(withdrawListingApplication).mockReturnValue(new Promise((resolve) => {
      resolveRequest = () => resolve(response);
    }));
    const { result } = renderHook(() => useListingWithdrawal("live-id"));

    await act(async () => {
      void result.current.withdraw();
      void result.current.withdraw();
    });
    expect(withdrawListingApplication).toHaveBeenCalledTimes(1);
    expect(withdrawListingApplication).toHaveBeenCalledWith("live-id");

    await act(async () => {
      resolveRequest?.();
    });
    expect(result.current.state.status).toBe("success");
  });
});
