import { useId } from "react";
import { Button, type ButtonVariant } from "@/components/ui/button/Button";
import { applicantWorkflowCopy } from "../copy";

interface UnavailableActionProps {
  readonly label: string;
  readonly variant?: ButtonVariant;
}

export function UnavailableAction({
  label,
  variant = "outline",
}: UnavailableActionProps) {
  const hintId = useId();

  return (
    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
      <Button
        type="button"
        variant={variant}
        size="sm"
        disabled
        aria-describedby={hintId}
        className="whitespace-nowrap"
      >
        {label}
      </Button>
      <span id={hintId} className="text-caption text-foreground-tertiary">
        {applicantWorkflowCopy.unavailableHint}
      </span>
    </div>
  );
}
