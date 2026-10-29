import { afterEach, describe, expect, it, vi } from "vitest";
import { dispatchDomainEvent, type DomainEventPorts } from "./dispatcher";
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

function ports(): DomainEventPorts {
  return {
    message: vi.fn(),
    summary: vi.fn(),
    viewing: vi.fn(),
    lifecycle: vi.fn(),
    listing: vi.fn(),
    notifications: vi.fn(),
  };
}

describe("dispatchDomainEvent", () => {
  afterEach(() => {
    clearRecentEvents();
  });

  it("routes a message by application id and drops duplicate ids", () => {
    const handlers = ports();
    const event = envelope("conversation.message.created", {
      messageId: "message-1",
      messageSequence: 8,
    });

    dispatchDomainEvent(event, handlers);
    dispatchDomainEvent(event, handlers);

    expect(handlers.message).toHaveBeenCalledTimes(1);
    expect(handlers.message).toHaveBeenCalledWith("application-1");
    expect(handlers.summary).not.toHaveBeenCalled();
  });

  it("routes reply and read events to summary without payload values", () => {
    const handlers = ports();

    dispatchDomainEvent(
      envelope(
        "conversation.reply-permission.changed",
        { enabled: true },
        "event-2",
      ),
      handlers,
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
      handlers,
    );

    expect(handlers.message).not.toHaveBeenCalled();
    expect(handlers.summary).toHaveBeenNthCalledWith(1, "application-1");
    expect(handlers.summary).toHaveBeenNthCalledWith(2, "application-1");
  });

  it("routes domain events by their identifiers and ignores a repeated event id", () => {
    const handlers = ports();
    const viewing = {
      eventId: "event-viewing",
      type: "application.viewing.changed",
      schemaVersion: 1,
      occurredAt,
      applicationId: "application-1",
      payload: { listingId: "listing-1", workflowRevision: 3 },
    };

    dispatchDomainEvent(viewing, handlers);
    dispatchDomainEvent(viewing, handlers);
    dispatchDomainEvent(
      {
        eventId: "event-lifecycle",
        type: "application.lifecycle.changed",
        schemaVersion: 1,
        occurredAt,
        applicationId: "application-1",
        payload: { listingId: "listing-1" },
      },
      handlers,
    );
    dispatchDomainEvent(
      {
        eventId: "event-listing",
        type: "listing.applications.changed",
        schemaVersion: 1,
        occurredAt,
        listingId: "listing-1",
        payload: {},
      },
      handlers,
    );
    dispatchDomainEvent(
      {
        eventId: "event-notifications",
        type: "notifications.changed",
        schemaVersion: 1,
        occurredAt,
        userId: "user-1",
        payload: {},
      },
      handlers,
    );

    expect(handlers.viewing).toHaveBeenCalledTimes(1);
    expect(handlers.viewing).toHaveBeenCalledWith("application-1", "listing-1");
    expect(handlers.lifecycle).toHaveBeenCalledWith(
      "application-1",
      "listing-1",
    );
    expect(handlers.listing).toHaveBeenCalledWith("listing-1");
    expect(handlers.notifications).toHaveBeenCalledWith("user-1");
    expect(handlers.message).not.toHaveBeenCalled();
  });

  it("ignores malformed events", () => {
    const handlers = ports();
    expect(() =>
      dispatchDomainEvent({ type: "conversation.message.created" }, handlers),
    ).not.toThrow();
    expect(handlers.message).not.toHaveBeenCalled();
    expect(handlers.summary).not.toHaveBeenCalled();
  });
});
