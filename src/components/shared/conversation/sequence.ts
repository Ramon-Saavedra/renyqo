export interface SequencedMessage {
  readonly sequence: number;
}

export type SequenceCursor =
  | { readonly kind: "empty" }
  | { readonly kind: "contiguous"; readonly through: number }
  | { readonly kind: "hole" };

export function inspectLoadedSequences(
  messages: readonly SequencedMessage[],
): SequenceCursor {
  if (messages.length === 0) return { kind: "empty" };

  const ordered = [...messages].sort(
    (left, right) => left.sequence - right.sequence,
  );
  let expected = 1;
  for (const message of ordered) {
    if (message.sequence !== expected) return { kind: "hole" };
    expected += 1;
  }

  const through = ordered[ordered.length - 1]?.sequence;
  if (through === undefined) return { kind: "empty" };
  return { kind: "contiguous", through };
}
