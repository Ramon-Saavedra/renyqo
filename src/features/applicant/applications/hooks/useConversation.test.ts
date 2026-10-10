import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/client";
import {
  loadCompleteConversation,
  markConversationRead,
  sendConversationMessage,
  type LoadedConversation,
  type ConversationMessage,
} from "../api/conversation";
import { loadedConversation, message } from "../testing/fixtures";
import { useConversation } from "./useConversation";

vi.mock("../api/conversation", () => ({
  loadCompleteConversation: vi.fn(),
  markConversationRead: vi.fn(),
  sendConversationMessage: vi.fn(),
}));

function deferred<T>() {
  let resolve: (value: T) => void = () => undefined;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

const initial = message(1, "PROVIDER", "Frage");

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(markConversationRead).mockResolvedValue(1);
});

describe("conversation request ordering", () => {
  it("loads readable history independently of isOpen and blocks disallowed sending", async () => {
    vi.mocked(loadCompleteConversation).mockResolvedValue(
      loadedConversation([initial], {
        isOpen: false,
        canCurrentUserSend: false,
        expectedResponder: null,
      }),
    );
    const { result } = renderHook(() =>
      useConversation({
        applicationId: "application-test",
        snapshotKey: "one",
        isOpen: false,
        onSent: vi.fn(),
      }),
    );
    await waitFor(() => expect(result.current.load.status).toBe("ready"));
    expect(result.current.messages).toEqual([initial]);
    await act(async () => {
      expect(await result.current.send("Antwort")).toBe(false);
    });
    expect(sendConversationMessage).not.toHaveBeenCalled();
  });

  it("retains history during an open-to-closed refresh and an empty GET", async () => {
    const refresh = deferred<LoadedConversation>();
    vi.mocked(loadCompleteConversation)
      .mockResolvedValueOnce(loadedConversation([initial]))
      .mockReturnValueOnce(refresh.promise);
    const { result, rerender } = renderHook(
      ({ snapshotKey, isOpen }) =>
        useConversation({
          applicationId: "application-test",
          snapshotKey,
          isOpen,
          onSent: vi.fn(),
        }),
      { initialProps: { snapshotKey: "one", isOpen: true } },
    );
    await waitFor(() => expect(result.current.load.status).toBe("ready"));
    expect(result.current.messages).toEqual([initial]);
    rerender({ snapshotKey: "two", isOpen: false });
    expect(result.current.messages).toEqual([initial]);
    expect(result.current.capabilities).toBeNull();
    await act(async () => {
      expect(await result.current.send("Antwort")).toBe(false);
      refresh.resolve(
        loadedConversation([], {
          isOpen: false,
          canCurrentUserSend: false,
          expectedResponder: null,
        }),
      );
    });
    await waitFor(() => expect(result.current.load.status).toBe("ready"));
    expect(result.current.messages).toEqual([initial]);
    expect(sendConversationMessage).not.toHaveBeenCalled();
  });

  it("keeps a confirmed message when a later closed-history GET omits it", async () => {
    const sent = message(2, "APPLICANT", "Antwort");
    vi.mocked(loadCompleteConversation)
      .mockResolvedValueOnce(loadedConversation([initial]))
      .mockResolvedValueOnce(loadedConversation([initial, sent]))
      .mockResolvedValueOnce(
        loadedConversation([initial], {
          isOpen: false,
          canCurrentUserSend: false,
          expectedResponder: null,
        }),
      );
    vi.mocked(sendConversationMessage).mockResolvedValue(sent);
    const { result, rerender } = renderHook(
      ({ snapshotKey, isOpen }) =>
        useConversation({
          applicationId: "application-test",
          snapshotKey,
          isOpen,
          onSent: vi.fn(),
        }),
      { initialProps: { snapshotKey: "one", isOpen: true } },
    );
    await waitFor(() => expect(result.current.load.status).toBe("ready"));
    await act(async () => {
      expect(await result.current.send("Antwort")).toBe(true);
    });
    await waitFor(() => {
      expect(result.current.load.status).toBe("ready");
      expect(result.current.capabilities?.canCurrentUserSend).toBe(false);
    });
    rerender({ snapshotKey: "two", isOpen: false });
    await waitFor(() => expect(result.current.load.status).toBe("ready"));
    expect(result.current.messages).toEqual([initial, sent]);
  });

  it("retries unread messages when an older read request has not succeeded", async () => {
    let rejectRead: (reason: Error) => void = () => undefined;
    const olderRead = new Promise<number>((_resolve, reject) => {
      rejectRead = reject;
    });
    vi.mocked(markConversationRead).mockReturnValueOnce(olderRead);
    vi.mocked(loadCompleteConversation).mockResolvedValue(
      loadedConversation([initial]),
    );
    const { result, rerender } = renderHook(
      ({ snapshotKey }) =>
        useConversation({
          applicationId: "application-test",
          snapshotKey,
          isOpen: true,
          onSent: vi.fn(),
        }),
      { initialProps: { snapshotKey: "one" } },
    );
    await waitFor(() => expect(markConversationRead).toHaveBeenCalledTimes(1));
    rerender({ snapshotKey: "two" });
    await waitFor(() => expect(markConversationRead).toHaveBeenCalledTimes(2));
    await act(async () => rejectRead(new Error("Unavailable")));
    expect(result.current.readFailed).toBe(false);
    expect(result.current.load.status).toBe("ready");
  });
  it("keeps a successful POST when an earlier GET resolves before the workspace refresh", async () => {
    const older = deferred<LoadedConversation>();
    const fresh = deferred<LoadedConversation>();
    const post = deferred<ConversationMessage>();
    const onSent = vi.fn();
    vi.mocked(loadCompleteConversation)
      .mockResolvedValueOnce(loadedConversation([initial]))
      .mockReturnValueOnce(older.promise)
      .mockReturnValueOnce(fresh.promise);
    vi.mocked(sendConversationMessage).mockReturnValue(post.promise);
    const { result, rerender } = renderHook(
      ({ snapshotKey }) =>
        useConversation({
          applicationId: "application-test",
          snapshotKey,
          isOpen: true,
          onSent,
        }),
      { initialProps: { snapshotKey: "one" } },
    );
    await waitFor(() => expect(result.current.load.status).toBe("ready"));
    act(() => {
      void result.current.send("Antwort");
    });
    rerender({ snapshotKey: "two" });
    await waitFor(() =>
      expect(loadCompleteConversation).toHaveBeenCalledTimes(2),
    );
    const sent = message(2, "APPLICANT", "Antwort");
    await act(async () => {
      post.resolve(sent);
    });
    expect(result.current.messages).toContainEqual(sent);
    expect(onSent).toHaveBeenCalledOnce();
    await act(async () => {
      older.resolve(loadedConversation([initial]));
    });
    expect(result.current.messages).toContainEqual(sent);
    await act(async () => {
      fresh.resolve(loadedConversation([initial, sent]));
    });
    expect(result.current.capabilities?.canCurrentUserSend).toBe(false);
    expect(result.current.messages).toEqual([initial, sent]);
  });

  it("ignores an earlier generation and retries a failed load", async () => {
    const older = deferred<LoadedConversation>();
    vi.mocked(loadCompleteConversation)
      .mockReturnValueOnce(older.promise)
      .mockRejectedValueOnce(new ApiError(503, "internal"))
      .mockResolvedValueOnce(loadedConversation([initial]));
    const { result, rerender } = renderHook(
      ({ snapshotKey }) =>
        useConversation({
          applicationId: "application-test",
          snapshotKey,
          isOpen: true,
          onSent: vi.fn(),
        }),
      { initialProps: { snapshotKey: "one" } },
    );
    rerender({ snapshotKey: "two" });
    await waitFor(() => expect(result.current.load.status).toBe("error"));
    await act(async () => {
      older.resolve(loadedConversation([message(3, "PROVIDER", "Alt")]));
    });
    expect(result.current.messages).toEqual([]);
    act(() => result.current.retry());
    await waitFor(() => expect(result.current.load.status).toBe("ready"));
    expect(result.current.messages).toEqual([initial]);
  });

  it.each([409, 500])(
    "refreshes only actual state conflicts (%s)",
    async (status) => {
      const onSent = vi.fn();
      vi.mocked(loadCompleteConversation).mockResolvedValue(
        loadedConversation([initial]),
      );
      vi.mocked(sendConversationMessage).mockRejectedValue(
        new ApiError(status, "internal"),
      );
      const { result } = renderHook(() =>
        useConversation({
          applicationId: "application-test",
          snapshotKey: "one",
          isOpen: true,
          onSent,
        }),
      );
      await waitFor(() => expect(result.current.load.status).toBe("ready"));
      await act(async () => {
        expect(await result.current.send("Entwurf")).toBe(false);
      });
      expect(result.current.sendFailure).toBe(
        status === 409 ? "conflict" : "failed",
      );
      expect(onSent).toHaveBeenCalledTimes(status === 409 ? 1 : 0);
    },
  );
});
