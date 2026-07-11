import { Plus } from "lucide-react";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { dashboardCopy } from "../copy/dashboard";
import { MAX_ACTIVE_APPLICATIONS } from "../types";
import type { Candidate, DashboardObject } from "../types";
import { CandidateCard } from "./CandidateCard";

interface CandidatesSectionProps {
  object: DashboardObject | null;
  candidates: readonly Candidate[];
}

const HEAD_CLASS =
  "mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between";
const TITLE_CLASS = "font-display text-heading-md font-medium text-foreground";
const LEAD_CLASS = "mt-1.5 max-w-md text-caption text-foreground-tertiary";
const COUNTER_CLASS =
  "font-mono text-caption uppercase text-foreground-tertiary";
const COUNTER_STRONG_CLASS = "font-medium text-foreground";

const GRID_CLASS =
  "grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5";
const EMPTY_CLASS =
  "flex min-h-55 flex-col items-center justify-center gap-2.5 rounded-md border border-dashed border-border-strong px-4 text-center text-caption text-foreground-tertiary";

const DRAFT_CLASS =
  "rounded-md border border-dashed border-border-strong bg-background-subtle px-6 py-12 text-center text-caption text-foreground-secondary";

function renderEmptySlots(count: number) {
  return Array.from({ length: count }).map((_, index) => (
    <div key={`empty-${index}`} className={EMPTY_CLASS}>
      <AppIcon
        icon={Plus}
        size={20}
        strokeWidth={1.4}
        decorative
        className="text-foreground-tertiary"
      />
      <span>{dashboardCopy.candidates.emptySlot}</span>
    </div>
  ));
}

export function CandidatesSection({
  object,
  candidates,
}: CandidatesSectionProps) {
  const { candidates: copy } = dashboardCopy;

  if (object?.status === "draft") {
    return (
      <section id="bewerbungen">
        <div className={HEAD_CLASS}>
          <div>
            <h3 className={TITLE_CLASS}>{copy.title}</h3>
            <p className={LEAD_CLASS}>{copy.lead}</p>
          </div>
        </div>
        <p className={DRAFT_CLASS}>{copy.draftEmpty}</p>
      </section>
    );
  }

  const shown = object ? candidates.slice(0, MAX_ACTIVE_APPLICATIONS) : [];
  const emptySlots = Math.max(0, MAX_ACTIVE_APPLICATIONS - shown.length);

  return (
    <section id="bewerbungen">
      <div className={HEAD_CLASS}>
        <div>
          <h3 className={TITLE_CLASS}>{copy.title}</h3>
          <p className={LEAD_CLASS}>{copy.lead}</p>
        </div>
        <span className={COUNTER_CLASS}>
          <strong className={COUNTER_STRONG_CLASS}>{shown.length}</strong>{" "}
          {copy.counterSuffix}
        </span>
      </div>

      <div className={GRID_CLASS}>
        {shown.map((candidate) => (
          <CandidateCard key={candidate.id} candidate={candidate} />
        ))}
        {renderEmptySlots(emptySlots)}
      </div>
    </section>
  );
}
