import { describe, expect, it } from "vitest";
import { parseDomainEvent } from "./event-schema";

const occurredAt = "2026-10-22T08:00:00.000Z";

function messageEvent(patch: Record<string, unknown> = {}) {
  return {
    eventId: "event-1",
    type: "conversation.message.created",
    schemaVersion: 1,
    occurredAt,
    applicationId: "application-1",
    conversationId: "conversation-1",
    payload: {
      messageId: "message-1",
      messageSequence: 4,
    },
    ...patch,
  };
}

describe("parseDomainEvent", () => {
  it("accepts the three supported events", () => {
    expect(parseDomainEvent(messageEvent())?.type).toBe(
      "conversation.message.created",
    );
    expect(
      parseDomainEvent({
        ...messageEvent(),
        eventId: "event-2",
        type: "conversation.reply-permission.changed",
        payload: { enabled: false },
      })?.type,
    ).toBe("conversation.reply-permission.changed");
    const read = parseDomainEvent({
      ...messageEvent(),
      eventId: "event-3",
      type: "conversation.read.advanced",
      payload: {
        readerSide: "APPLICANT",
        throughSequence: 4,
        markedCount: 2,
      },
    });
    expect(read?.type).toBe("conversation.read.advanced");
  });

  it("rejects unsupported versions, types, and malformed payloads", () => {
    expect(parseDomainEvent(messageEvent({ schemaVersion: 2 }))).toBeNull();
    expect(
      parseDomainEvent(messageEvent({ type: "conversation.deleted" })),
    ).toBeNull();
    expect(parseDomainEvent(messageEvent({ extra: true }))).toBeNull();
    expect(
      parseDomainEvent(
        messageEvent({
          payload: { messageId: "message-1", messageSequence: 4, extra: true },
        }),
      ),
    ).toBeNull();
    expect(
      parseDomainEvent(messageEvent({ occurredAt: "2026-10-22T08:00:00" })),
    ).toBeNull();
    expect(parseDomainEvent(null)).toBeNull();
    expect(parseDomainEvent("event")).toBeNull();
  });
});
