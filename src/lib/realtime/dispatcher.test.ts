import { afterEach, describe, expect, it, vi } from "vitest";
import { dispatchDomainEvent } from "./dispatcher";
import { clearRecentEvents } from "./recent-events";

const occurredAt = "2026-10-22T08:00:00.000Z";

function envelope(type: string, payload: unknown, eventId = "event-1") {
  return {
    eventId,
    type,
    schemaVersion: 1,
    occurredAt,
    applicationId: "application-1",
    conversationId: "conversation-1",
    payload,
  };
}

describe("dispatchDomainEvent", () => {
  afterEach(() => {
    clearRecentEvents();
  });

  it("routes a message by application id and drops duplicate ids", () => {
    const message = vi.fn();
    const summary = vi.fn();
    const event = envelope("conversation.message.created", {
      messageId: "message-1",
      messageSequence: 8,
    });

    dispatchDomainEvent(event, { message, summary });
    dispatchDomainEvent(event, { message, summary });

    expect(message).toHaveBeenCalledTimes(1);
    expect(message).toHaveBeenCalledWith("application-1");
    expect(summary).not.toHaveBeenCalled();
  });

  it("routes reply and read events to summary without payload values", () => {
    const message = vi.fn();
    const summary = vi.fn();

    dispatchDomainEvent(
      envelope(
        "conversation.reply-permission.changed",
        { enabled: true },
        "event-2",
      ),
      { message, summary },
    );
    dispatchDomainEvent(
      envelope(
        "conversation.read.advanced",
        {
          readerSide: "PROVIDER",
          throughSequence: 3,
          markedCount: 9,
        },
        "event-3",
      ),
      { message, summary },
    );

    expect(message).not.toHaveBeenCalled();
    expect(summary).toHaveBeenNthCalledWith(1, "application-1");
    expect(summary).toHaveBeenNthCalledWith(2, "application-1");
  });

  it("ignores malformed events", () => {
    const message = vi.fn();
    const summary = vi.fn();
    expect(() =>
      dispatchDomainEvent(
        { type: "conversation.message.created" },
        {
          message,
          summary,
        },
      ),
    ).not.toThrow();
    expect(message).not.toHaveBeenCalled();
    expect(summary).not.toHaveBeenCalled();
  });
});
