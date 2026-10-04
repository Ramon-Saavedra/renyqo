import { beforeEach, describe, expect, it, vi } from "vitest";
import type * as ApiClient from "@/lib/api/client";
import { apiGet, apiPatch, apiPost } from "@/lib/api/client";
import {
  getConversationHistory,
  markConversationRead,
  sendConversationMessage,
} from "./conversation";

vi.mock("@/lib/api/client", async (importOriginal) => {
  const actual = await importOriginal<typeof ApiClient>();
  return {
    ...actual,
    apiGet: vi.fn(),
    apiPost: vi.fn(),
    apiPatch: vi.fn(),
  };
});

const AT = "2026-10-04T11:55:33.790Z";

function history(messages: unknown[]) {
  return {
    applicationId: "application-1",
    conversationId: "conversation-1",
    openedAt: AT,
    isOpen: true,
    canCurrentUserSend: false,
    expectedResponder: "APPLICANT",
    unreadCount: 0,
    lastMessage: messages[0] ?? null,
    messages,
    hasMore: false,
    nextAfterSequence: null,
  };
}

const message = {
  id: "message-1",
  sequence: 1,
  senderType: "PROVIDER",
  body: "Hallo",
  createdAt: AT,
  readAt: null,
};

describe("conversation contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("accepts an empty history", async () => {
    vi.mocked(apiGet).mockResolvedValue(history([]));

    const parsed = await getConversationHistory("application-1");

    expect(parsed.messages).toEqual([]);
    expect(parsed.expectedResponder).toBe("APPLICANT");
  });

  it("accepts the live message shape with senderType", async () => {
    vi.mocked(apiGet).mockResolvedValue(history([message]));

    const parsed = await getConversationHistory("application-1");

    expect(parsed.messages[0]?.senderType).toBe("PROVIDER");
    expect(parsed.messages[0]?.readAt).toBeNull();
  });

  it("rejects a history that uses actorType instead of senderType", async () => {
    vi.mocked(apiGet).mockResolvedValue(
      history([{ ...message, senderType: undefined, actorType: "PROVIDER" }]),
    );

    await expect(getConversationHistory("application-1")).rejects.toThrow(
      "Invalid applicant workspace response",
    );
  });

  it("parses the send response and the mark-read count", async () => {
    vi.mocked(apiPost).mockResolvedValue(message);
    vi.mocked(apiPatch).mockResolvedValue({ markedCount: 1 });

    await expect(sendConversationMessage("application-1", "Hallo")).resolves.toMatchObject({
      id: "message-1",
    });
    await expect(markConversationRead("application-1", 1)).resolves.toBe(1);
  });
});
