const MAX_RECENT_EVENTS = 100;

const eventIds: string[] = [];
const seenEventIds = new Set<string>();

export function rememberEvent(eventId: string): boolean {
  if (seenEventIds.has(eventId)) return false;
  seenEventIds.add(eventId);
  eventIds.push(eventId);
  if (eventIds.length > MAX_RECENT_EVENTS) {
    const removed = eventIds.shift();
    if (removed !== undefined) seenEventIds.delete(removed);
  }
  return true;
}

export function clearRecentEvents(): void {
  eventIds.length = 0;
  seenEventIds.clear();
}

export function recentEventCount(): number {
  return eventIds.length;
}
