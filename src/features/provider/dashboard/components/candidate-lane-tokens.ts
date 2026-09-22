export interface QueueTier {
  readonly max: number;
  readonly colorVar: string;
  readonly durationSeconds: number;
}

export const QUEUE_TIERS: readonly QueueTier[] = [
  { max: 9, colorVar: "--color-queue-1", durationSeconds: 6.4 },
  { max: 19, colorVar: "--color-queue-2", durationSeconds: 5.6 },
  { max: 29, colorVar: "--color-queue-3", durationSeconds: 4.8 },
  { max: 39, colorVar: "--color-queue-4", durationSeconds: 4.2 },
  { max: 49, colorVar: "--color-queue-5", durationSeconds: 3.6 },
  { max: Infinity, colorVar: "--color-queue-6", durationSeconds: 3.0 },
];

export function resolveQueueTier(waitingCount: number): {
  readonly tier: QueueTier;
  readonly index: number;
} {
  const index = QUEUE_TIERS.findIndex((entry) => waitingCount <= entry.max);
  const resolvedIndex = index === -1 ? QUEUE_TIERS.length - 1 : index;
  return { tier: QUEUE_TIERS[resolvedIndex]!, index: resolvedIndex };
}
