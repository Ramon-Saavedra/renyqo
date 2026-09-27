import { ArrowUpDown } from "lucide-react";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { buttonClassWithSize } from "@/components/ui/button/Button";
import { dashboardCopy } from "../copy/dashboard";
import type { DashboardObject } from "../types";

interface ListingPositionControlProps {
  object: DashboardObject;
  pending: boolean;
  open: boolean;
  dialogId: string;
  onToggle: (trigger: HTMLElement) => void;
}

export function ListingPositionControl({
  object,
  pending,
  open,
  dialogId,
  onToggle,
}: ListingPositionControlProps) {
  return (
    <button
      type="button"
      disabled={pending}
      aria-label={`Position von ${object.title} ändern`}
      title={dashboardCopy.matrix.positionHandleTitle}
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-controls={open ? dialogId : undefined}
      onClick={(event) => onToggle(event.currentTarget)}
      className={buttonClassWithSize("ghost", "icon-2xs", "shrink-0")}
    >
      <AppIcon icon={ArrowUpDown} size={14} strokeWidth={1.8} decorative />
    </button>
  );
}
