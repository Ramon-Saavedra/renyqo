"use client";

import { ArrowRight, UserRoundX } from "lucide-react";
import type { CSSProperties } from "react";
import { Avatar } from "@/components/ui/avatar/Avatar";
import { Button } from "@/components/ui/button/Button";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { RenyqoSkeleton } from "@/components/ui/loading/RenyqoSkeleton";
import { dashboardCopy } from "../copy/dashboard";
import "./CandidateLane.css";
import { AttentionIndicators } from "@/components/shared/attention/AttentionIndicators";
import { buildApplicationAttentionChips } from "@/lib/attention/chips";
import { hasApplicationAttentionSurface } from "@/lib/attention/visibility";
import { FlagChip } from "./FlagChip";
import { resolveQueueTier } from "./candidate-lane-tokens";
import type { Candidate, CandidateWarning } from "../types";

const WARNING_LABEL: Record<CandidateWarning, string> = {
  smoking_by_arrangement: "Rauchen klären",
  pets_by_arrangement: "Haustiere klären",
};

const GRID_CLASS =
  "grid grid-cols-2 items-stretch gap-3 @min-[640px]:grid-cols-3 @min-[1024px]:grid-cols-6";

const CARD_CLASS =
  "group relative flex min-w-0 flex-col overflow-hidden rounded-md border border-border/50 bg-background-muted hover:shadow-card";

const CELL_WRAPPER_CLASS = "row-span-2 grid min-w-0 grid-rows-subgrid gap-1.5";

/** Subgrid aligns notices and cards without fixed heights or clipped overflow. */
const ATTENTION_SLOT_CLASS = "flex min-w-0 flex-col justify-end gap-1";

function CandidateAttentionSlot({
  showAttention,
  attentionChips,
}: {
  showAttention: boolean;
  attentionChips: ReturnType<typeof buildApplicationAttentionChips>;
}) {
  return (
    <div
      data-rq-candidate-attention-slot=""
      className={ATTENTION_SLOT_CLASS}
      {...(showAttention
        ? { role: "status" as const }
        : { "aria-hidden": true })}
    >
      {showAttention ? (
        <AttentionIndicators
          chips={attentionChips}
          maxVisible={2}
          className="flex flex-col gap-1"
        />
      ) : null}
    </div>
  );
}

const PROFILE_BUTTON_CLASS =
  "block w-full flex-1 cursor-pointer px-card-x py-card-y text-left focus-visible:outline-none focus-visible:shadow-focus hover:bg-background-subtle";

const ACTION_ROW_CLASS =
  "flex items-center justify-between gap-1 border-t border-border bg-background-muted px-1.5 group-hover:bg-background-subtle";

export interface CandidateLaneProps {
  actives: readonly Candidate[];
  waitingCount: number;
  announceWaitingStatus?: boolean;
  capacity?: number;
  onOpenPreview: (candidate: Candidate) => void;
  onRejectCandidate?: ((candidate: Candidate) => void) | undefined;
  rejectingApplicationId?: string | null | undefined;
}

export function CandidateLane({
  actives,
  waitingCount,
  announceWaitingStatus = true,
  capacity = 5,
  onOpenPreview,
  onRejectCandidate,
  rejectingApplicationId = null,
}: CandidateLaneProps) {
  const { waitingQueue: waitingCopy } = dashboardCopy;
  const isFull = actives.length >= capacity;
  const hasQueue = isFull && waitingCount > 0;
  const { tier, index } = resolveQueueTier(waitingCount);
  const tierPosition = index + 1;
  const waitLabel = waitingCopy.badge(waitingCount);
  const waitingStatus = hasQueue ? waitLabel : waitingCopy.capacity(capacity);
  const ringColor = `var(${tier.colorVar})`;
  const ringInk = `color-mix(in srgb, ${ringColor} 68%, var(--color-foreground))`;
  const entries = actives.map((candidate) => ({
    candidate,
    attentionChips: hasApplicationAttentionSurface(candidate.attention)
      ? buildApplicationAttentionChips(candidate.attention)
      : [],
  }));

  return (
    <div>
      {announceWaitingStatus ? (
        <span
          role="status"
          aria-label={waitingStatus}
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        >
          {waitingStatus}
        </span>
      ) : null}

      <div className={GRID_CLASS}>
        {entries.map(({ candidate, attentionChips }) => {
          const warnings = candidate.warnings;
          const warningLabels = warnings.map(
            (warning) => WARNING_LABEL[warning],
          );
          const isRejecting = rejectingApplicationId === candidate.id;
          const showAttention = attentionChips.length > 0;

          return (
            <div key={candidate.id} className={CELL_WRAPPER_CLASS}>
              <CandidateAttentionSlot
                showAttention={showAttention}
                attentionChips={attentionChips}
              />
              <div
                data-rq-candidate-card=""
                className={`${CARD_CLASS} flex min-h-0 flex-1 flex-col`}
              >
                <button
                  type="button"
                  onClick={() => onOpenPreview(candidate)}
                  aria-label={dashboardCopy.candidates.previewAction(
                    candidate.name,
                    candidate.household,
                    warningLabels,
                  )}
                  className={PROFILE_BUTTON_CLASS}
                >
                  <Avatar
                    size="sm"
                    initials={candidate.initials}
                    label={candidate.name}
                  />
                  <span className="mt-3 block truncate text-body font-medium text-foreground">
                    {candidate.name}
                  </span>
                  <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-caption text-foreground-tertiary">
                    <span className="whitespace-nowrap">
                      {candidate.household}
                    </span>
                    {candidate.activeAtLabel ? (
                      <span className="flex items-center gap-1 whitespace-nowrap text-success">
                        <AppIcon
                          icon={ArrowRight}
                          size={11}
                          strokeWidth={1.8}
                          decorative
                        />
                        {candidate.activeAtLabel}
                      </span>
                    ) : null}
                  </span>
                </button>

                <div className={ACTION_ROW_CLASS}>
                  <span className="flex min-w-0 flex-1 items-center gap-2">
                    {warnings.includes("smoking_by_arrangement") ? (
                      <FlagChip warning="smoking_by_arrangement" />
                    ) : null}
                    {warnings.includes("pets_by_arrangement") ? (
                      <FlagChip warning="pets_by_arrangement" />
                    ) : null}
                  </span>
                  <span className="flex shrink-0 items-center gap-0.5">
                    {onRejectCandidate ? (
                      <Button
                        type="button"
                        variant="dangerGhost"
                        size="icon-md"
                        onClick={() => onRejectCandidate(candidate)}
                        disabled={isRejecting}
                        aria-busy={isRejecting}
                        aria-label={dashboardCopy.candidates.rejectAction(
                          candidate.name,
                        )}
                        title={dashboardCopy.candidates.rejectAction(
                          candidate.name,
                        )}
                      >
                        <AppIcon
                          icon={UserRoundX}
                          size={17}
                          strokeWidth={1.8}
                          decorative
                        />
                      </Button>
                    ) : null}
                  </span>
                </div>

                {isRejecting ? (
                  <div className="bg-background-subtle/95 absolute inset-0 flex items-center pl-4">
                    <RenyqoSkeleton
                      variant="text"
                      height={16}
                      className="w-28"
                    />
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}

        {hasQueue ? (
          <div className={CELL_WRAPPER_CLASS}>
            <CandidateAttentionSlot showAttention={false} attentionChips={[]} />
            <div
              data-rq-queue-indicator=""
              className={`${CARD_CLASS} flex min-h-0 flex-1 flex-col p-card-x py-card-y`}
              style={
                {
                  background: `color-mix(in srgb, ${ringColor} 13%, var(--color-background))`,
                  "--rq-queue-duration": `${tier.durationSeconds}s`,
                } as CSSProperties
              }
            >
              <span
                tabIndex={0}
                role="img"
                aria-label={waitingCopy.queueAria(waitingCount, tierPosition)}
                title={waitingCopy.queueTooltip(waitingCount)}
                className="flex flex-1 flex-col rounded-md focus-visible:outline-none focus-visible:shadow-focus"
              >
                <span className="rq-queue-drift relative block h-8 w-8">
                  <span
                    className="absolute inset-0 rounded-full border opacity-34"
                    style={{ borderColor: ringColor }}
                  />
                  <span
                    className="rq-queue-breath absolute -inset-1.5 rounded-full border"
                    style={{
                      borderColor: ringColor,
                    }}
                  />
                  <span
                    className="absolute inset-0 flex items-center justify-center font-mono text-caption font-medium"
                    style={{ color: ringInk }}
                  >
                    {waitingCopy.queueBadge(waitingCount)}
                  </span>
                </span>
                <span
                  className="mt-3 block text-body font-medium"
                  style={{ color: ringInk }}
                >
                  {waitLabel}
                </span>
                <span className="mt-2 flex gap-0.75">
                  {[1, 2, 3, 4, 5, 6].map((step) => (
                    <span
                      key={step}
                      className="h-0.75 w-2.75 rounded-full"
                      style={{
                        background:
                          step <= tierPosition
                            ? ringColor
                            : "var(--color-border)",
                      }}
                    />
                  ))}
                </span>
              </span>
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <span className="flex min-w-13 flex-1 items-center gap-0.75">
          {Array.from({ length: capacity }, (_, position) => (
            <span
              key={position}
              className={`h-0.5 flex-1 rounded-full ${
                position < actives.length ? "bg-primary" : "bg-border"
              }`}
            />
          ))}
        </span>
        <span className="font-mono text-meta uppercase tracking-wide text-foreground-tertiary whitespace-nowrap">
          {hasQueue
            ? waitingCopy.capacityWithQueue(capacity)
            : waitingCopy.capacity(capacity)}
        </span>
      </div>
    </div>
  );
}

export default CandidateLane;
