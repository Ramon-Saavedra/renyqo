import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { applyToListing } from "../api/listing-application";
import { useListingApplication } from "./useListingApplication";

vi.mock("../api/listing-application", () => ({ applyToListing: vi.fn() }));

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
    vi.mocked(applyToListing).mockReturnValue(new Promise((resolve) => {
      resolveRequest = () => resolve(response);
    }));
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
