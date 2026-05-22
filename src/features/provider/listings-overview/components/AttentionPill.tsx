import { AlertCircle } from "lucide-react";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import type { AttentionReason } from "../types";

type NonNullAttentionReason = Exclude<AttentionReason, null>;

interface AttentionPillProps {
  reason: NonNullAttentionReason;
}

const REASON_LABELS: Record<NonNullAttentionReason, string> = {
  open_questions: "Rückfragen offen",
  manual_review: "Manuelle Prüfung",
  missing_data: "Daten unvollständig",
};

const WRAPPER_CLASS =
  "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-warning/15 text-warning";

export function AttentionPill({ reason }: AttentionPillProps) {
  const label = REASON_LABELS[reason];
  return (
    <span role="img" aria-label={label} title={label} className={WRAPPER_CLASS}>
      <AppIcon icon={AlertCircle} size={12} strokeWidth={1.8} decorative />
    </span>
  );
}
