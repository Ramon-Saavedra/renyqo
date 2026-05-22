import { cn } from "@/lib/utils/cn";
import { STATUS_META } from "../copy/listings";
import type { ListingStatus } from "../types";

interface StatusPillProps {
  status: ListingStatus;
  className?: string;
}

const BASE_CLASS =
  "inline-flex h-5.5 items-center gap-1.5 rounded-full px-2.25 font-mono text-meta font-medium uppercase whitespace-nowrap";

export function StatusPill({ status, className }: StatusPillProps) {
  const meta = STATUS_META[status];
  return (
    <span className={cn(BASE_CLASS, meta.pillClass, className)}>
      <span aria-hidden="true" className="h-1 w-1 rounded-full bg-current" />
      {meta.label}
    </span>
  );
}
