import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/client";
import { reportListing } from "../api/listing-report";
import type * as listingReportApi from "../api/listing-report";
import { useListingReport } from "./useListingReport";

vi.mock("../api/listing-report", async (importOriginal) => {
  const actual = await importOriginal<typeof listingReportApi>();
  return {
    ...actual,
    reportListing: vi.fn(),
  };
});

const created = {
  id: "report-1",
  listingId: "listing-1",
  reason: "SCAM_OR_FRAUD" as const,
  createdAt: "2026-09-06T10:00:00.000Z",
};

describe("useListingReport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("prevents concurrent submissions", async () => {
    let resolveRequest: (() => void) | undefined;
    vi.mocked(reportListing).mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = () => resolve(created);
      }),
    );
    const { result } = renderHook(() => useListingReport("listing-1"));

    await act(async () => {
      void result.current.submit("SCAM_OR_FRAUD", "");
      void result.current.submit("SCAM_OR_FRAUD", "");
    });
    expect(reportListing).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveRequest?.();
    });
    expect(result.current.status).toBe("success");
  });

  it("maps a 409 duplicate to a controlled message", async () => {
    vi.mocked(reportListing).mockRejectedValue(new ApiError(409, "conflict"));
    const { result } = renderHook(() => useListingReport("listing-1"));

    await act(async () => {
      await result.current.submit("SCAM_OR_FRAUD", "");
    });

    expect(result.current.status).toBe("error");
    expect(result.current.error).toBe(
      "Du hast dieses Objekt bereits gemeldet.",
    );
  });

  it("maps a 429 rate limit to a controlled message", async () => {
    vi.mocked(reportListing).mockRejectedValue(
      new ApiError(429, "limited", "http", "LISTING_REPORT_RATE_LIMITED"),
    );
    const { result } = renderHook(() => useListingReport("listing-1"));

    await act(async () => {
      await result.current.submit("SCAM_OR_FRAUD", "");
    });

    expect(result.current.error).toBe(
      "Du hast zu viele Meldungen gesendet. Bitte versuche es später erneut.",
    );
  });

  it("does not call the API when OTHER has no detail", async () => {
    const { result } = renderHook(() => useListingReport("listing-1"));

    await act(async () => {
      await result.current.submit("OTHER", "  ");
    });

    expect(reportListing).not.toHaveBeenCalled();
    expect(result.current.validationCode).toBe("detail-required");
    expect(result.current.status).toBe("idle");
  });

  it("does not call the API when no reason is selected", async () => {
    const { result } = renderHook(() => useListingReport("listing-1"));

    await act(async () => {
      await result.current.submit(null, "");
    });

    expect(reportListing).not.toHaveBeenCalled();
    expect(result.current.validationCode).toBe("reason-required");
    expect(result.current.status).toBe("idle");
  });

  it("maps a 401 to a controlled auth message", async () => {
    vi.mocked(reportListing).mockRejectedValue(new ApiError(401, "auth"));
    const { result } = renderHook(() => useListingReport("listing-1"));

    await act(async () => {
      await result.current.submit("SCAM_OR_FRAUD", "");
    });

    expect(result.current.status).toBe("error");
    expect(result.current.error).toBe(
      "Bitte melde dich an, um ein Objekt zu melden.",
    );
  });

  it("maps any 429 to the rate-limit message", async () => {
    vi.mocked(reportListing).mockRejectedValue(new ApiError(429, "limited"));
    const { result } = renderHook(() => useListingReport("listing-1"));

    await act(async () => {
      await result.current.submit("SCAM_OR_FRAUD", "");
    });

    expect(result.current.error).toBe(
      "Du hast zu viele Meldungen gesendet. Bitte versuche es später erneut.",
    );
  });

  it("does not apply a report result after the listing id changes", async () => {
    let resolveRequest: ((value: typeof created) => void) | undefined;
    vi.mocked(reportListing).mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve;
      }),
    );
    const { result, rerender } = renderHook(
      ({ listingId }) => useListingReport(listingId),
      { initialProps: { listingId: "listing-1" } },
    );

    await act(async () => {
      void result.current.submit("SCAM_OR_FRAUD", "");
    });

    rerender({ listingId: "listing-2" });

    await act(async () => {
      resolveRequest?.(created);
    });

    expect(result.current.status).toBe("idle");
    expect(reportListing).toHaveBeenCalledWith("listing-1", {
      reason: "SCAM_OR_FRAUD",
    });
  });
});
