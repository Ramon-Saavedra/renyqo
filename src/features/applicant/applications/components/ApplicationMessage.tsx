import type { ReactNode } from "react";
import { FileText } from "lucide-react";
import { AppIcon } from "@/components/ui/icon/AppIcon";

export function ApplicationMessage({
  title,
  text,
  action,
}: {
  readonly title: string;
  readonly text?: string;
  readonly action: ReactNode;
}) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-md border border-border bg-background-muted p-5">
      <span className="flex h-10 w-10 items-center justify-center rounded-md bg-background-subtle text-foreground-secondary">
        <AppIcon icon={FileText} size={18} decorative />
      </span>
      <div className="flex flex-col gap-1">
        <p className="font-display text-lead font-semibold text-foreground">
          {title}
        </p>
        {text ? (
          <p className="max-w-prose text-body text-foreground-secondary">
            {text}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
