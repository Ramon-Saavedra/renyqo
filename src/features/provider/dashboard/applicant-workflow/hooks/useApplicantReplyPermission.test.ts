import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { setApplicantReplies } from "../api/conversation";
import { useApplicantReplyPermission } from "./useApplicantReplyPermission";
vi.mock("../api/conversation", () => ({ setApplicantReplies: vi.fn() }));
const setReplies = vi.mocked(setApplicantReplies);
const capabilities = {
  applicantRepliesEnabled: true,
  canCurrentUserSend: true,
  canCurrentUserManageApplicantReplies: true,
  sendBlockReason: null,
};
beforeEach(() => vi.clearAllMocks());
describe("applicant reply permission requests", () => {
  it("sends desired states repeatedly and refreshes authoritative capabilities", async () => {
    setReplies.mockResolvedValue(capabilities);
    const refresh = vi.fn();
    const { result } = renderHook(() =>
      useApplicantReplyPermission("application", refresh),
    );
    for (const enabled of [true, false, true, false])
      await act(async () => {
        await result.current.setEnabled(enabled);
      });
    expect(setReplies.mock.calls).toEqual([
      ["application", true],
      ["application", false],
      ["application", true],
      ["application", false],
    ]);
    expect(refresh).toHaveBeenCalledTimes(4);
    expect(result.current.error).toBeNull();
  });
  it("prevents duplicate in-flight submissions without claiming success", async () => {
    let finish!: (value: typeof capabilities) => void;
    setReplies.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    const refresh = vi.fn();
    const { result } = renderHook(() =>
      useApplicantReplyPermission("application", refresh),
    );
    act(() => {
      void result.current.setEnabled(true);
      void result.current.setEnabled(false);
    });
    expect(result.current.pending).toBe(true);
    expect(setReplies).toHaveBeenCalledTimes(1);
    expect(refresh).not.toHaveBeenCalled();
    await act(async () => {
      finish(capabilities);
    });
    expect(result.current.pending).toBe(false);
    expect(refresh).toHaveBeenCalledOnce();
  });
  it("reports failures and refreshes stale capabilities", async () => {
    setReplies.mockRejectedValue(new Error("conflict"));
    const refresh = vi.fn();
    const { result } = renderHook(() =>
      useApplicantReplyPermission("application", refresh),
    );
    await act(async () => {
      await result.current.setEnabled(false);
    });
    expect(result.current.error).toContain("nicht aktualisiert");
    expect(refresh).toHaveBeenCalledOnce();
  });
  it("ignores responses from a previous application", async () => {
    let finish!: (value: typeof capabilities) => void;
    setReplies
      .mockReturnValueOnce(
        new Promise((resolve) => {
          finish = resolve;
        }),
      )
      .mockResolvedValue(capabilities);
    const refresh = vi.fn();
    const { result, rerender } = renderHook(
      ({ id }) => useApplicantReplyPermission(id, refresh),
      { initialProps: { id: "old" } },
    );
    act(() => {
      void result.current.setEnabled(true);
    });
    rerender({ id: "new" });
    expect(result.current.pending).toBe(false);
    await act(async () => {
      await result.current.setEnabled(false);
    });
    await act(async () => {
      finish(capabilities);
    });
    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
    expect(setReplies).toHaveBeenLastCalledWith("new", false);
  });
});
