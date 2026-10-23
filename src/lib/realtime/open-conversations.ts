type CatchUp = () => void;

const openConversations = new Map<string, Set<CatchUp>>();

export function registerOpenConversation(
  applicationId: string,
  catchUp: CatchUp,
): () => void {
  const existing = openConversations.get(applicationId);
  const listeners = existing ?? new Set<CatchUp>();
  if (!existing) openConversations.set(applicationId, listeners);
  listeners.add(catchUp);
  return () => {
    listeners.delete(catchUp);
    if (listeners.size === 0) openConversations.delete(applicationId);
  };
}

export function catchUpOpenConversation(applicationId: string): void {
  const listeners = openConversations.get(applicationId);
  if (!listeners) return;
  for (const catchUp of listeners) catchUp();
}

export function catchUpAllOpenConversations(): void {
  for (const listeners of openConversations.values()) {
    for (const catchUp of listeners) catchUp();
  }
}

export function openConversationCount(): number {
  let count = 0;
  for (const listeners of openConversations.values()) count += listeners.size;
  return count;
}
