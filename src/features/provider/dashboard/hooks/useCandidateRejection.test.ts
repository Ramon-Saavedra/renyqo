import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { rejectProviderApplication } from "../api/provider-application-rejection";
import { useCandidateRejection } from "./useCandidateRejection";

vi.mock("../api/provider-application-rejection", () => ({
  rejectProviderApplication: vi.fn(),
}));

describe("useCandidateRejection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reports success after the backend accepts the rejection", async () => {
    vi.mocked(rejectProviderApplication).mockResolvedValue();
    const { result } = renderHook(() => useCandidateRejection());

    await act(async () => {
      await expect(
        result.current.rejectCandidate("application-1"),
      ).resolves.toBe(true);
    });

    expect(result.current.state).toEqual({ status: "idle" });
  });

  it("keeps an explicit error state when the request fails", async () => {
    vi.mocked(rejectProviderApplication).mockRejectedValue(new Error("failed"));
    const { result } = renderHook(() => useCandidateRejection());

    await act(async () => {
      await expect(
        result.current.rejectCandidate("application-1"),
      ).resolves.toBe(false);
    });

    expect(result.current.state).toEqual({
      status: "error",
      applicationId: "application-1",
    });
  });

  it("prevents concurrent submissions", async () => {
    let resolveRequest: (() => void) | undefined;
    vi.mocked(rejectProviderApplication).mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveRequest = resolve;
        }),
    );
    const { result } = renderHook(() => useCandidateRejection());

    let firstRequest: Promise<boolean> | undefined;
    await act(async () => {
      firstRequest = result.current.rejectCandidate("application-1");
      await expect(
        result.current.rejectCandidate("application-1"),
      ).resolves.toBe(false);
    });

    expect(rejectProviderApplication).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveRequest?.();
      await firstRequest;
    });
  });
});
