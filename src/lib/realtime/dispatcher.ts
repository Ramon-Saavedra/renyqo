import { parseDomainEvent } from "./event-schema";
import { rememberEvent } from "./recent-events";

export interface DomainEventPorts {
  readonly message: (applicationId: string) => void;
  readonly summary: (applicationId: string) => void;
  readonly viewing: (applicationId: string, listingId: string) => void;
  readonly lifecycle: (applicationId: string, listingId: string) => void;
  readonly listing: (listingId: string) => void;
  readonly notifications: (userId: string) => void;
}

export function dispatchDomainEvent(
  input: unknown,
  ports: DomainEventPorts,
): void {
  const event = parseDomainEvent(input);
  if (!event || !rememberEvent(event.eventId)) return;

  switch (event.type) {
    case "conversation.message.created":
      ports.message(event.applicationId);
      return;
    case "conversation.reply-permission.changed":
    case "conversation.read.advanced":
      ports.summary(event.applicationId);
      return;
    case "application.viewing.changed":
      ports.viewing(event.applicationId, event.payload.listingId);
      return;
    case "application.lifecycle.changed":
      ports.lifecycle(event.applicationId, event.payload.listingId);
      return;
    case "listing.applications.changed":
      ports.listing(event.listingId);
      return;
    case "notifications.changed":
      ports.notifications(event.userId);
      return;
    default: {
      const unsupported: never = event;
      void unsupported;
    }
  }
}
