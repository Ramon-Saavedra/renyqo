import { AlertCircle } from "lucide-react";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { dashboardCopy } from "../copy/dashboard";
import type { Candidate, CandidateWarning } from "../types";

const CARD_CLASS =
  "flex min-h-16 min-w-0 flex-col justify-center gap-1 rounded-md border border-border bg-background px-3 py-2";
const ROW_CLASS = "flex items-center gap-3";
const AVATAR_CLASS =
  "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-success-surface-border bg-success-surface/15 font-display text-caption font-semibold text-success-vivid";
const COPY_CLASS = "flex h-9 min-w-0 flex-1 flex-col justify-center gap-0.5";
const NAME_CLASS = "truncate text-caption font-medium text-foreground";
const META_CLASS = "truncate text-caption text-foreground-secondary";
const WARNINGS_CLASS = "flex flex-wrap gap-x-2 gap-y-1";
const WARNING_CLASS =
  "inline-flex items-center gap-1 text-caption text-foreground-secondary";
const WARNING_ICON_CLASS = "text-warning";

const warningLabels = dashboardCopy.candidates.warningLabels;

export function CandidateCard({
  candidate,
}: {
  readonly candidate: Candidate;
}) {
  return (
    <article className={CARD_CLASS}>
      <div className={ROW_CLASS}>
        <span aria-hidden="true" className={AVATAR_CLASS}>
          {candidate.initials}
        </span>
        <span className={COPY_CLASS}>
          <span className={NAME_CLASS}>{candidate.name}</span>
          <span className={META_CLASS}>{candidate.household}</span>
        </span>
      </div>
      {candidate.warnings.length > 0 && (
        <ul className={WARNINGS_CLASS}>
          {candidate.warnings.map((warning: CandidateWarning) => (
            <li key={warning} className={WARNING_CLASS}>
              <AppIcon
                icon={AlertCircle}
                size={12}
                strokeWidth={1.8}
                decorative
                className={WARNING_ICON_CLASS}
              />
              <span>{warningLabels[warning]}</span>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
