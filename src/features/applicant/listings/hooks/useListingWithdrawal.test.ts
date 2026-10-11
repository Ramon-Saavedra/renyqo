import { subscribeListingApplicationData } from "../utils/listing-data-invalidation";
import { useLayoutEffect } from "react";
import type { WithdrawnListingApplication } from "../api/listing-withdrawal";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { withdrawListingApplication } from "../api/listing-withdrawal";
import { useListingWithdrawal } from "./useListingWithdrawal";

vi.mock("../api/listing-withdrawal", () => ({
  withdrawListingApplication: vi.fn(),
}));

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
    vi.mocked(withdrawListingApplication).mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = () => resolve(response);
      }),
    );
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

function pendingResponse<T>() {
  let resolve: (value: T) => void = () => {
    throw new Error("Uninitialized response");
  };
  let reject: (reason: unknown) => void = () => {
    throw new Error("Uninitialized response");
  };
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

describe("useListingWithdrawal request identity", () => {
  it.each(["success", "error"] as const)(
    "ignores stale %s without blocking a new request during commit",
    async (outcome) => {
      vi.mocked(withdrawListingApplication).mockReset();
      const oldResponse = pendingResponse<WithdrawnListingApplication>();
      const newResponse = pendingResponse<WithdrawnListingApplication>();
      const response: WithdrawnListingApplication = {
        id: "old",
        listingId: "listing",
        status: "WITHDRAWN",
        rejectedAt: null,
        publicReason: null,
        createdAt: "2026-10-10T00:00:00Z",
        updatedAt: "2026-10-10T00:00:00Z",
      };
      vi.mocked(withdrawListingApplication)
        .mockReturnValueOnce(oldResponse.promise)
        .mockReturnValueOnce(newResponse.promise);
      const listener = vi.fn();
      const unsubscribe = subscribeListingApplicationData(listener);
      let newRequest: Promise<boolean> | undefined;
      const { result, rerender } = renderHook(
        ({ id }) => {
          const hook = useListingWithdrawal(id);
          useLayoutEffect(() => {
            if (id === "new" && newRequest === undefined)
              newRequest = hook.withdraw();
          }, [id, hook]);
          return hook;
        },
        { initialProps: { id: "old" } },
      );
      let oldRequest: Promise<boolean> | undefined;
      act(() => {
        oldRequest = result.current.withdraw();
      });
      act(() => rerender({ id: "new" }));
      expect(withdrawListingApplication).toHaveBeenCalledTimes(2);
      await act(async () => {
        if (outcome === "success") oldResponse.resolve(response);
        else oldResponse.reject(new Error("old request failed"));
        expect(await oldRequest).toBe(false);
      });
      expect(result.current.state.status).toBe("submitting");
      expect(listener).not.toHaveBeenCalled();
      await act(async () => {
        await result.current.withdraw();
      });
      expect(withdrawListingApplication).toHaveBeenCalledTimes(2);
      await act(async () => {
        newResponse.resolve({ ...response, id: "new" });
        await newRequest;
      });
      expect(result.current.state.status).toBe("success");
      unsubscribe();
    },
  );
  it.each(["success", "error"] as const)(
    "ignores %s after unmount",
    async (outcome) => {
      vi.mocked(withdrawListingApplication).mockReset();
      const response = pendingResponse<WithdrawnListingApplication>();
      vi.mocked(withdrawListingApplication).mockReturnValueOnce(
        response.promise,
      );
      const listener = vi.fn();
      const unsubscribe = subscribeListingApplicationData(listener);
      const { result, unmount } = renderHook(() => useListingWithdrawal("old"));
      let request: Promise<boolean> | undefined;
      act(() => {
        request = result.current.withdraw();
      });
      unmount();
      await act(async () => {
        if (outcome === "success")
          response.resolve({
            id: "old",
            listingId: "listing",
            status: "WITHDRAWN",
            rejectedAt: null,
            publicReason: null,
            createdAt: "2026-10-10T00:00:00Z",
            updatedAt: "2026-10-10T00:00:00Z",
          });
        else response.reject(new Error("unmounted request failed"));
        expect(await request).toBe(false);
      });
      expect(listener).not.toHaveBeenCalled();
      unsubscribe();
    },
  );
});
