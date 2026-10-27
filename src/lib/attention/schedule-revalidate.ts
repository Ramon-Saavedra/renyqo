/** One deadline timer. Expiry calls refetch and does not change domain state. */
export function scheduleRevalidate(
  nextRevalidateAt: string | null,
  refetch: () => void,
): () => void {
  if (!nextRevalidateAt) return () => undefined;
  const target = Date.parse(nextRevalidateAt);
  if (Number.isNaN(target)) return () => undefined;
  const delay = target - Date.now();
  if (delay <= 0) {
    refetch();
    return () => undefined;
  }
  const timer = window.setTimeout(refetch, delay);
  return () => window.clearTimeout(timer);
}
