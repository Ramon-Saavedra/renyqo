import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { restoreProviderApplication } from "../api/provider-application-restore";
import { useCandidateRestoration } from "./useCandidateRestoration";

vi.mock("../api/provider-application-restore", () => ({
  restoreProviderApplication: vi.fn(),
}));

describe("useCandidateRestoration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reports success after the backend accepts the restoration", async () => {
    vi.mocked(restoreProviderApplication).mockResolvedValue();
    const { result } = renderHook(() => useCandidateRestoration());

    await act(async () => {
      await expect(
        result.current.restoreCandidate("application-1"),
      ).resolves.toBe(true);
    });

    expect(result.current.state).toEqual({ status: "idle" });
  });

  it("keeps an explicit error state when the request fails", async () => {
    vi.mocked(restoreProviderApplication).mockRejectedValue(
      new Error("failed"),
    );
    const { result } = renderHook(() => useCandidateRestoration());

    await act(async () => {
      await expect(
        result.current.restoreCandidate("application-1"),
      ).resolves.toBe(false);
    });

    expect(result.current.state).toEqual({
      status: "error",
      applicationId: "application-1",
    });
  });

  it("prevents concurrent submissions", async () => {
    let resolveRequest: (() => void) | undefined;
    vi.mocked(restoreProviderApplication).mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveRequest = resolve;
        }),
    );
    const { result } = renderHook(() => useCandidateRestoration());

    let firstRequest: Promise<boolean> | undefined;
    await act(async () => {
      firstRequest = result.current.restoreCandidate("application-1");
      await expect(
        result.current.restoreCandidate("application-1"),
      ).resolves.toBe(false);
    });

    expect(restoreProviderApplication).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveRequest?.();
      await firstRequest;
    });
  });
});
