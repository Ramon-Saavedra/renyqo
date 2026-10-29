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

  it("accepts application, listing, and notification events without a conversation id", () => {
    expect(
      parseDomainEvent({
        eventId: "event-viewing",
        type: "application.viewing.changed",
        schemaVersion: 1,
        occurredAt,
        applicationId: "application-1",
        payload: {
          listingId: "listing-1",
          workflowId: "workflow-1",
          workflowRevision: 4,
        },
      })?.type,
    ).toBe("application.viewing.changed");
    expect(
      parseDomainEvent({
        eventId: "event-lifecycle",
        type: "application.lifecycle.changed",
        schemaVersion: 1,
        occurredAt,
        applicationId: "application-1",
        payload: { listingId: "listing-1" },
      })?.type,
    ).toBe("application.lifecycle.changed");
    expect(
      parseDomainEvent({
        eventId: "event-listing",
        type: "listing.applications.changed",
        schemaVersion: 1,
        occurredAt,
        listingId: "listing-1",
        payload: {},
      })?.type,
    ).toBe("listing.applications.changed");
    expect(
      parseDomainEvent({
        eventId: "event-notifications",
        type: "notifications.changed",
        schemaVersion: 1,
        occurredAt,
        userId: "user-1",
        payload: {},
      })?.type,
    ).toBe("notifications.changed");
  });

  it("still requires conversationId on conversation events", () => {
    const { conversationId, ...withoutConversation } = messageEvent();
    expect(conversationId).toBe("conversation-1");
    expect(parseDomainEvent(withoutConversation)).toBeNull();
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
