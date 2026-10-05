export interface IdempotentAttempt {
  readonly signature: string;
  readonly key: string;
}

export function samePayloadAttempt(
  current: IdempotentAttempt | null,
  signature: string,
  createKey: () => string,
): IdempotentAttempt {
  if (current !== null && current.signature === signature) return current;
  return { signature, key: createKey() };
}

export function viewingAttemptSignature(
  viewingId: string | null,
  date: string,
  time: string,
): string {
  return `${viewingId ?? ""}\u0000${date}\u0000${time}`;
}
