export function appendUnique<T>(
  current: readonly T[],
  next: readonly T[],
  key: (item: T) => string,
): readonly T[] {
  const seen = new Set(current.map(key));
  const added: T[] = [];
  for (const item of next) {
    const id = key(item);
    if (seen.has(id)) continue;
    seen.add(id);
    added.push(item);
  }
  return [...current, ...added];
}
