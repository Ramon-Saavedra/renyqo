import { inspectLoadedSequences } from "./sequence";

export interface ConversationPage<T> {
  readonly messages: readonly T[];
  readonly hasMore: boolean;
  readonly nextAfterSequence: number | null;
}

export interface CatchUpResult<T> {
  readonly messages: readonly T[];
  readonly reloadedFromStart: boolean;
}

interface SequencedId {
  readonly id: string;
  readonly sequence: number;
}

function throwIfAborted(signal: AbortSignal): void {
  if (!signal.aborted) return;
  const error = new Error("Aborted");
  error.name = "AbortError";
  throw error;
}

function sortBySequence<T extends SequencedId>(messages: readonly T[]): T[] {
  return [...messages].sort((left, right) => left.sequence - right.sequence);
}

export async function catchUpMessages<T extends SequencedId>(
  loaded: readonly T[],
  loadFromStart: (signal: AbortSignal) => Promise<readonly T[]>,
  loadPage: (
    afterSequence: number,
    signal: AbortSignal,
  ) => Promise<ConversationPage<T>>,
  signal: AbortSignal,
): Promise<CatchUpResult<T>> {
  throwIfAborted(signal);
  const cursor = inspectLoadedSequences(loaded);
  if (cursor.kind !== "contiguous") {
    const messages = await loadFromStart(signal);
    throwIfAborted(signal);
    return {
      messages: sortBySequence(messages),
      reloadedFromStart: cursor.kind === "hole",
    };
  }

  const merged = new Map(loaded.map((message) => [message.id, message]));
  let afterSequence = cursor.through;
  for (;;) {
    throwIfAborted(signal);
    const page = await loadPage(afterSequence, signal);
    throwIfAborted(signal);
    for (const message of page.messages) merged.set(message.id, message);
    if (!page.hasMore) break;
    if (
      page.nextAfterSequence === null ||
      page.nextAfterSequence <= afterSequence
    ) {
      const messages = await loadFromStart(signal);
      throwIfAborted(signal);
      return { messages: sortBySequence(messages), reloadedFromStart: true };
    }
    afterSequence = page.nextAfterSequence;
  }

  const messages = sortBySequence([...merged.values()]);
  if (inspectLoadedSequences(messages).kind === "hole") {
    const replaced = await loadFromStart(signal);
    throwIfAborted(signal);
    return { messages: sortBySequence(replaced), reloadedFromStart: true };
  }
  return { messages, reloadedFromStart: false };
}
