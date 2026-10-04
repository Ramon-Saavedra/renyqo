import { useId } from "react";
import { Clock } from "lucide-react";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { cn } from "@/lib/utils/cn";
import { applicantWorkflowCopy } from "../copy";
import { WORKFLOW_SECTION_ORDER } from "../section-summary";
import type { ApplicantWorkflowModel, WorkflowNextStep } from "../workflow-model";
import { ToneDot } from "./StatusTag";

const copy = applicantWorkflowCopy.nextStep;

type Density = "comfortable" | "compact";

interface NextStepPanelProps {
  readonly nextStep: WorkflowNextStep;
  readonly summaries: ApplicantWorkflowModel["summaries"];
  readonly density: Density;
}

function SummaryStrip({
  summaries,
}: {
  readonly summaries: ApplicantWorkflowModel["summaries"];
}) {
  return (
    <div className="grid grid-cols-3 border-t border-border bg-background-muted">
      {WORKFLOW_SECTION_ORDER.map((key) => {
        const summary = summaries[key];
        return (
          <div
            key={key}
            className="flex min-w-0 flex-col gap-px border-r border-border px-3.5 py-2.25 last:border-r-0"
          >
            <span className="text-caption text-foreground-secondary">
              {summary.label}
            </span>
            <span className="truncate text-action font-medium text-foreground">
              {summary.value}
            </span>
            {summary.state ? (
              <span className="flex min-w-0 items-center gap-1.5 text-caption text-foreground-secondary">
                <ToneDot tone={summary.tone} />
                <span className="truncate">{summary.state}</span>
              </span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export function NextStepPanel({
  nextStep,
  summaries,
  density,
}: NextStepPanelProps) {
  const headingId = useId();
  const compact = density === "compact";

  return (
    <section
      aria-labelledby={headingId}
      className="overflow-hidden rounded-md border border-border"
    >
      <h3 id={headingId} className="sr-only">
        {copy.regionLabel}
      </h3>
      <div
        className={cn(
          "flex items-center bg-background-subtle",
          compact ? "gap-2.5 px-3 py-2.5" : "gap-3.5 px-3.5 py-3",
        )}
      >
        <span
          className={cn(
            "flex shrink-0 items-center justify-center rounded-md border border-border bg-background-muted text-foreground-secondary",
            compact ? "h-7.5 w-7.5" : "h-8.5 w-8.5",
          )}
        >
          <AppIcon
            icon={Clock}
            size={compact ? 14 : 16}
            strokeWidth={2}
            decorative
          />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-meta font-medium uppercase text-foreground-secondary">
            {nextStep.eyebrow}
          </span>
          <span className="font-display text-lead font-semibold text-foreground">
            {nextStep.title}
          </span>
          {nextStep.text ? (
            <span className="text-caption text-pretty text-foreground-secondary">
              {nextStep.text}
            </span>
          ) : null}
        </div>
      </div>
      {compact ? null : <SummaryStrip summaries={summaries} />}
    </section>
  );
}
