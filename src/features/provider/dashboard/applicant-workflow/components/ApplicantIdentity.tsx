import { useState } from "react";
import { Avatar } from "@/components/ui/avatar/Avatar";
import { cn } from "@/lib/utils/cn";
import { applicantWorkflowCopy } from "../copy";
import type { WorkflowApplicant } from "../workflow-model";
import { StatusTag } from "./StatusTag";

type Density = "comfortable" | "compact";

interface ApplicantIdentityProps {
  readonly applicant: WorkflowApplicant;
  readonly titleId: string;
  readonly descriptionId: string;
  readonly density: Density;
}

export function ApplicantIdentity({
  applicant,
  titleId,
  descriptionId,
  density,
}: ApplicantIdentityProps) {
  const [introductionExpanded, setIntroductionExpanded] = useState(false);
  const compact = density === "compact";
  const facts = [
    applicant.household,
    applicant.activeSinceLabel
      ? applicantWorkflowCopy.activeSince(applicant.activeSinceLabel)
      : null,
  ].filter((fact): fact is string => fact !== null);

  return (
    <div className={cn("flex items-start", compact ? "gap-3" : "gap-3.5")}>
      <Avatar
        size={compact ? "sm" : "md"}
        initials={applicant.initials}
        label={applicant.name}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-0.75">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <h2
            id={titleId}
            className={cn(
              "min-w-0 font-display font-semibold break-words text-foreground",
              compact ? "text-lead" : "text-heading-md",
            )}
          >
            {applicant.name}
          </h2>
          <StatusTag
            tone="primary"
            label={applicantWorkflowCopy.statusActive}
          />
          {compact ? null : (
            <span className="text-caption text-foreground-secondary">
              {facts.join(" · ")}
            </span>
          )}
        </div>
        {compact ? (
          <span className="text-caption text-foreground-secondary">
            {facts.join(" · ")}
          </span>
        ) : null}
        {applicant.introduction ? (
          <>
            <p
              id={descriptionId}
              tabIndex={compact && introductionExpanded ? 0 : undefined}
              className={cn(
                "mt-0.5 max-w-3xl text-caption text-pretty break-words text-foreground-secondary",
                compact &&
                  (introductionExpanded
                    ? "max-h-24 overflow-y-auto whitespace-pre-wrap focus-visible:shadow-focus focus-visible:outline-none"
                    : "line-clamp-2"),
              )}
            >
              {applicant.introduction}
            </p>
            {compact ? (
              <button
                type="button"
                aria-expanded={introductionExpanded}
                aria-controls={descriptionId}
                onClick={() => setIntroductionExpanded((expanded) => !expanded)}
                className="self-start cursor-pointer text-caption font-medium text-primary underline underline-offset-2 focus-visible:shadow-focus focus-visible:outline-none"
              >
                {introductionExpanded
                  ? applicantWorkflowCopy.collapseIntroduction
                  : applicantWorkflowCopy.expandIntroduction}
              </button>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
