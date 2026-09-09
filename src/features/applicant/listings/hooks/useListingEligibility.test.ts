import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getListingEligibility } from "../api/listing-eligibility";
import { useListingEligibility } from "./useListingEligibility";

vi.mock("../api/listing-eligibility", () => ({
  getListingEligibility: vi.fn(),
}));

const eligibility = vi.mocked(getListingEligibility);

const result = {
  canApply: true,
  reasons: [],
  warnings: [],
  evaluatedAt: "2026-08-23T10:00:00.000Z",
};

describe("useListingEligibility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    eligibility.mockResolvedValue(result);
  });

  it("does not fetch when disabled", async () => {
    const { result: hook } = renderHook(() =>
      useListingEligibility("listing-1", false),
    );

    expect(hook.current.status).toBe("idle");
    expect(hook.current.eligibility).toBeNull();
    await waitFor(() => {
      expect(eligibility).not.toHaveBeenCalled();
    });
  });

  it("fetches when enabled", async () => {
    const { result: hook } = renderHook(() =>
      useListingEligibility("listing-1", true),
    );

    await waitFor(() => {
      expect(hook.current.status).toBe("loaded");
    });
    expect(eligibility).toHaveBeenCalledWith(
      "listing-1",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(hook.current.eligibility).toEqual(result);
  });

  it("fetches after becoming enabled", async () => {
    const { result: hook, rerender } = renderHook(
      ({ enabled }) => useListingEligibility("listing-1", enabled),
      { initialProps: { enabled: false } },
    );

    expect(eligibility).not.toHaveBeenCalled();
    rerender({ enabled: true });

    await waitFor(() => {
      expect(hook.current.status).toBe("loaded");
    });
    expect(eligibility).toHaveBeenCalledTimes(1);
  });
});
