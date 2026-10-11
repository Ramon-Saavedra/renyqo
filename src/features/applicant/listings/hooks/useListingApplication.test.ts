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
