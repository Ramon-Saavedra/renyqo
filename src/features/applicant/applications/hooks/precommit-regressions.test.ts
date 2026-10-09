import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/client";
import { getApplicantWorkspace } from "../api/workspace";
import { createWorkspace } from "../testing/fixtures";
import { useApplicantWorkspace } from "./useApplicantWorkspace";
import { useAuxiliaryLoad } from "./useAuxiliaryLoad";
import {
  acceptViewing,
  declineViewing,
  requestAnotherViewingTime,
  submitViewingInterest,
} from "../api/viewings";
import { useViewingActions } from "./useViewingActions";

vi.mock("../api/workspace", () => ({ getApplicantWorkspace: vi.fn() }));
vi.mock("../api/viewings", () => ({
  acceptViewing: vi.fn(),
  declineViewing: vi.fn(),
  requestAnotherViewingTime: vi.fn(),
  submitViewingInterest: vi.fn(),
}));

beforeEach(() => vi.resetAllMocks());

describe("auxiliary data", () => {
  it("distinguishes loading, error, successful absence and retry", async () => {
    const load = vi
      .fn()
      .mockRejectedValueOnce(new ApiError(503, "internal"))
      .mockResolvedValueOnce(null);
    const { result } = renderHook(() =>
      useAuxiliaryLoad<null>("one", true, load),
    );
    expect(result.current.state.status).toBe("loading");
    await waitFor(() => expect(result.current.state.status).toBe("error"));
    act(() => result.current.retry());
    await waitFor(() =>
      expect(result.current.state).toEqual({ status: "ready", data: null }),
    );
    expect(load).toHaveBeenCalledTimes(2);
  });

  it("rejects late data from an older snapshot", async () => {
    let finish: (value: string) => void = () => undefined;
    const load = vi
      .fn()
      .mockReturnValueOnce(
        new Promise<string>((resolve) => {
          finish = resolve;
        }),
      )
      .mockResolvedValueOnce("new");
    const { result, rerender } = renderHook(
      ({ key }) => useAuxiliaryLoad<string>(key, true, load),
      { initialProps: { key: "old" } },
    );
    rerender({ key: "new" });
    await waitFor(() =>
      expect(result.current.state).toEqual({ status: "ready", data: "new" }),
    );
    await act(async () => finish("old"));
    expect(result.current.state).toEqual({ status: "ready", data: "new" });
  });
});

describe("focus revalidation", () => {
  it("retains ready data and coalesces simultaneous focus and visibility events", async () => {
    const workspace = createWorkspace();
    let finish: (value: typeof workspace) => void = () => undefined;
    vi.mocked(getApplicantWorkspace)
      .mockResolvedValueOnce(workspace)
      .mockReturnValueOnce(
        new Promise((resolve) => {
          finish = resolve;
        }),
      );
    const { result, unmount } = renderHook(() =>
      useApplicantWorkspace(workspace.application.id),
    );
    await waitFor(() => expect(result.current.state.status).toBe("ready"));
    act(() => {
      window.dispatchEvent(new Event("focus"));
      document.dispatchEvent(new Event("visibilitychange"));
      window.dispatchEvent(new Event("focus"));
    });
    await waitFor(() => expect(getApplicantWorkspace).toHaveBeenCalledTimes(2));
    expect(result.current.state.status).toBe("ready");
    await act(async () => finish(workspace));
    unmount();
    window.dispatchEvent(new Event("focus"));
    expect(getApplicantWorkspace).toHaveBeenCalledTimes(2);
  });
});

describe("viewing conflicts", () => {
  it.each([409, 500])(
    "refreshes and blocks only state conflicts (%s)",
    async (status) => {
      vi.mocked(acceptViewing).mockRejectedValue(
        new ApiError(status, "internal"),
      );
      const refresh = vi.fn(() => 3);
      const { result, rerender } = renderHook(
        ({ accepted }) =>
          useViewingActions("application-test", refresh, accepted),
        { initialProps: { accepted: 1 } },
      );
      await act(async () => {
        expect(await result.current.accept("viewing-test")).toBe(false);
      });
      expect(result.current.isBlocked("viewing-test")).toBe(status === 409);
      expect(refresh).toHaveBeenCalledTimes(status === 409 ? 1 : 0);
      rerender({ accepted: 2 });
      expect(result.current.isBlocked("viewing-test")).toBe(status === 409);
      rerender({ accepted: 3 });
      expect(result.current.isBlocked("viewing-test")).toBe(false);
    },
  );
});

describe("viewing synchronization", () => {
  it.each(["accept", "decline", "request", "interest"] as const)(
    "blocks repeated and contradictory actions after %s until its refresh is accepted",
    async (kind) => {
      vi.mocked(acceptViewing).mockResolvedValue(undefined);
      vi.mocked(declineViewing).mockResolvedValue(undefined);
      vi.mocked(requestAnotherViewingTime).mockResolvedValue(undefined);
      vi.mocked(submitViewingInterest).mockResolvedValue(undefined);
      const refresh = vi.fn(() => 3);
      const { result, rerender } = renderHook(
        ({ accepted }) =>
          useViewingActions("application-test", refresh, accepted),
        { initialProps: { accepted: 1 } },
      );
      await act(async () => {
        const actions = result.current;
        const done =
          kind === "accept"
            ? await actions.accept("one")
            : kind === "decline"
              ? await actions.decline("one")
              : kind === "request"
                ? await actions.requestAnotherTime("one", "My note")
                : await actions.submitInterest("one", "STILL_INTERESTED");
        expect(done).toBe(true);
        expect(await actions.accept("one")).toBe(false);
        expect(await actions.decline("one")).toBe(false);
        expect(await actions.requestAnotherTime("one", "Other note")).toBe(
          false,
        );
        expect(await actions.submitInterest("one", "NOT_INTERESTED")).toBe(
          false,
        );
      });
      expect(result.current.isBlocked("one")).toBe(true);
      expect(result.current.isBlocked("two")).toBe(false);
      await act(async () => {
        expect(await result.current.accept("two")).toBe(true);
      });
      rerender({ accepted: 2 });
      expect(result.current.isBlocked("one")).toBe(true);
      rerender({ accepted: 3 });
      expect(result.current.isBlocked("one")).toBe(false);
      await act(async () => {
        expect(await result.current.accept("one")).toBe(true);
      });
    },
  );

  it("allows retry after a normal mutation failure", async () => {
    vi.mocked(acceptViewing)
      .mockRejectedValueOnce(new ApiError(500, "internal"))
      .mockResolvedValueOnce(undefined);
    const refresh = vi.fn(() => 3);
    const { result } = renderHook(() =>
      useViewingActions("application-test", refresh, 1),
    );
    await act(async () => {
      expect(await result.current.accept("one")).toBe(false);
    });
    expect(result.current.isBlocked("one")).toBe(false);
    expect(refresh).not.toHaveBeenCalled();
    await act(async () => {
      expect(await result.current.accept("one")).toBe(true);
    });
    expect(acceptViewing).toHaveBeenCalledTimes(2);
  });

  it("keeps locks through obsolete, discarded and failed refreshes and releases on a valid retry", async () => {
    const workspace = createWorkspace();
    let finishOlder: (value: typeof workspace) => void = () => undefined;
    let finishStale: (value: typeof workspace) => void = () => undefined;
    vi.mocked(getApplicantWorkspace)
      .mockResolvedValueOnce(workspace)
      .mockReturnValueOnce(
        new Promise((resolve) => {
          finishOlder = resolve;
        }),
      )
      .mockReturnValueOnce(
        new Promise((resolve) => {
          finishStale = resolve;
        }),
      )
      .mockRejectedValueOnce(new ApiError(503, "internal"))
      .mockResolvedValueOnce(workspace);
    vi.mocked(acceptViewing).mockResolvedValue(undefined);
    const { result } = renderHook(() => {
      const workspaceController = useApplicantWorkspace(
        workspace.application.id,
      );
      const accepted =
        workspaceController.state.status === "ready"
          ? workspaceController.state.acceptedGeneration
          : 0;
      const actions = useViewingActions(
        workspace.application.id,
        workspaceController.refresh,
        accepted,
      );
      return { workspaceController, actions };
    });
    await waitFor(() =>
      expect(result.current.workspaceController.state.status).toBe("ready"),
    );
    act(() => {
      result.current.workspaceController.refresh();
    });
    await waitFor(() => expect(getApplicantWorkspace).toHaveBeenCalledTimes(2));
    await act(async () => {
      expect(await result.current.actions.accept("one")).toBe(true);
    });
    await waitFor(() => expect(getApplicantWorkspace).toHaveBeenCalledTimes(3));
    await act(async () => {
      finishOlder(createWorkspace({}, "2026-10-04T10:00:00.000Z"));
    });
    expect(result.current.actions.isBlocked("one")).toBe(true);
    await act(async () => {
      finishStale(createWorkspace({}, "2026-10-04T09:00:00.000Z"));
    });
    expect(result.current.actions.isBlocked("one")).toBe(true);
    expect(result.current.workspaceController.state).toMatchObject({
      refreshFailed: true,
    });
    act(() => {
      result.current.workspaceController.refresh();
    });
    await waitFor(() => expect(getApplicantWorkspace).toHaveBeenCalledTimes(4));
    await waitFor(() =>
      expect(result.current.workspaceController.state).toMatchObject({
        refreshFailed: true,
      }),
    );
    expect(result.current.actions.isBlocked("one")).toBe(true);
    act(() => {
      result.current.workspaceController.refresh();
    });
    await waitFor(() =>
      expect(result.current.actions.isBlocked("one")).toBe(false),
    );
    expect(result.current.workspaceController.state).toMatchObject({
      workspace,
      refreshFailed: false,
    });
  });
});
