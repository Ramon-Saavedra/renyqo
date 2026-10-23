import { parseDomainEvent } from "./event-schema";
import { rememberEvent } from "./recent-events";

export interface DomainEventPorts {
  readonly message: (applicationId: string) => void;
  readonly summary: (applicationId: string) => void;
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
    default: {
      const unsupported: never = event;
      void unsupported;
    }
  }
}
