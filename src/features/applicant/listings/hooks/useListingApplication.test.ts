import { useLayoutEffect } from "react";
import type { ListingApplication } from "../api/listing-application";
import type * as listingApplicationApi from "../api/listing-application";
import { ApiError } from "@/lib/api/client";
import { subscribeListingApplicationData } from "../utils/listing-data-invalidation";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { applyToListing } from "../api/listing-application";
import { useListingApplication } from "./useListingApplication";
vi.mock("../api/listing-application", async (importOriginal) => ({
  ...(await importOriginal<typeof listingApplicationApi>()),
  applyToListing: vi.fn(),
}));
describe("useListingApplication", () => {
  it("prevents concurrent submissions", async () => {
    const response = {
      id: "new",
      listingId: "listing",
      applicantId: "applicant",
      status: "ACTIVE" as const,
      rejectedAt: null,
      publicReason: null,
      createdAt: "2026-08-23T10:00:00.000Z",
      updatedAt: "2026-08-23T10:00:00.000Z",
    };
    let resolveRequest: (() => void) | undefined;
    vi.mocked(applyToListing).mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = () => resolve(response);
      }),
    );
    const { result } = renderHook(() => useListingApplication("listing"));
    await act(async () => {
      void result.current.submit();
      void result.current.submit();
    });
    expect(applyToListing).toHaveBeenCalledTimes(1);
    await act(async () => {
      resolveRequest?.();
    });
    expect(result.current.state.status).toBe("success");
  });
});
describe("submission conflict and refresh", () => {
  it.each([
    ["APPLICATION_REAPPLICATION_COOLDOWN", "nicht ausgewählt"],
    ["CURRENT_APPLICATION_EXISTS", "Du hast dich bereits"],
    ["APPLICATION_ACCEPTED", "angenommen"],
    ["LISTING_RENTED", "vermietet"],
    ["APPLICATION_HISTORY_REQUIRES_REVIEW", "derzeit nicht möglich"],
    [null, "Du hast dich bereits"],
    ["UNRECOGNIZED", "konnte nicht gesendet"],
  ])("handles 409 code %s and refreshes", async (code, message) => {
    const listener = vi.fn();
    const unsubscribe = subscribeListingApplicationData(listener);
    vi.mocked(applyToListing).mockRejectedValueOnce(
      new ApiError(409, "internal error", "http", code, {
        reapplyAvailableAt: "2026-11-01T00:00:00Z",
      }),
    );
    const { result } = renderHook(() => useListingApplication("listing"));
    await act(async () => {
      await result.current.submit();
    });
    expect(result.current.state).toMatchObject({
      status: "error",
      message: expect.stringContaining(message),
    });
    expect(listener).toHaveBeenCalledOnce();
    unsubscribe();
  });
  it("invalidates after successful apply", async () => {
    const listener = vi.fn();
    const unsubscribe = subscribeListingApplicationData(listener);
    vi.mocked(applyToListing).mockResolvedValueOnce({
      id: "fresh",
      listingId: "listing",
      applicantId: "applicant",
      status: "WAITING",
      rejectedAt: null,
      publicReason: null,
      createdAt: "2026-10-10T00:00:00Z",
      updatedAt: "2026-10-10T00:00:00Z",
    });
    const { result } = renderHook(() => useListingApplication("listing"));
    await act(async () => {
      await result.current.submit();
    });
    expect(listener).toHaveBeenCalledOnce();
    expect(result.current.state).toMatchObject({ status: "success" });
    unsubscribe();
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

describe("useListingApplication request identity", () => {
  it.each(["success", "error"] as const)(
    "ignores stale %s without blocking a new request during commit",
    async (outcome) => {
      vi.mocked(applyToListing).mockReset();
      const oldResponse = pendingResponse<ListingApplication>();
      const newResponse = pendingResponse<ListingApplication>();
      const response: ListingApplication = {
        id: "attempt",
        listingId: "old",
        applicantId: "applicant",
        status: "ACTIVE",
        rejectedAt: null,
        publicReason: null,
        createdAt: "2026-10-10T00:00:00Z",
        updatedAt: "2026-10-10T00:00:00Z",
      };
      vi.mocked(applyToListing)
        .mockReturnValueOnce(oldResponse.promise)
        .mockReturnValueOnce(newResponse.promise);
      const listener = vi.fn();
      const unsubscribe = subscribeListingApplicationData(listener);
      let newRequest: Promise<ListingApplication | undefined> | undefined;
      const { result, rerender } = renderHook(
        ({ id }) => {
          const hook = useListingApplication(id);
          useLayoutEffect(() => {
            if (id === "new" && newRequest === undefined)
              newRequest = hook.submit();
          }, [id, hook]);
          return hook;
        },
        { initialProps: { id: "old" } },
      );
      let oldRequest: Promise<ListingApplication | undefined> | undefined;
      act(() => {
        oldRequest = result.current.submit();
      });
      act(() => rerender({ id: "new" }));
      expect(applyToListing).toHaveBeenCalledTimes(2);
      await act(async () => {
        if (outcome === "success") oldResponse.resolve(response);
        else oldResponse.reject(new Error("old request failed"));
        expect(await oldRequest).toBe(undefined);
      });
      expect(result.current.state.status).toBe("submitting");
      expect(listener).not.toHaveBeenCalled();
      await act(async () => {
        await result.current.submit();
      });
      expect(applyToListing).toHaveBeenCalledTimes(2);
      await act(async () => {
        newResponse.resolve({ ...response, listingId: "new" });
        await newRequest;
      });
      expect(result.current.state.status).toBe("success");
      unsubscribe();
    },
  );
  it.each(["success", "error"] as const)(
    "ignores %s after unmount",
    async (outcome) => {
      vi.mocked(applyToListing).mockReset();
      const response = pendingResponse<ListingApplication>();
      vi.mocked(applyToListing).mockReturnValueOnce(response.promise);
      const listener = vi.fn();
      const unsubscribe = subscribeListingApplicationData(listener);
      const { result, unmount } = renderHook(() =>
        useListingApplication("old"),
      );
      let request: Promise<ListingApplication | undefined> | undefined;
      act(() => {
        request = result.current.submit();
      });
      unmount();
      await act(async () => {
        if (outcome === "success")
          response.resolve({
            id: "attempt",
            listingId: "old",
            applicantId: "applicant",
            status: "ACTIVE",
            rejectedAt: null,
            publicReason: null,
            createdAt: "2026-10-10T00:00:00Z",
            updatedAt: "2026-10-10T00:00:00Z",
          });
        else response.reject(new Error("unmounted request failed"));
        expect(await request).toBe(undefined);
      });
      expect(listener).not.toHaveBeenCalled();
      unsubscribe();
    },
  );
});
