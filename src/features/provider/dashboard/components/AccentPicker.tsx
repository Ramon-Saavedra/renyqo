"use client";

import { Blend } from "lucide-react";
import { buttonClassWithSize } from "@/components/ui/button/Button";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { PopoverPanel } from "@/components/ui/popover/PopoverPanel";
import { dashboardCopy } from "../copy/dashboard";
import type { AccentId } from "../copy/dashboard";
import { AccentSwatches } from "./AccentSwatches";

interface AccentPickerProps {
  value: AccentId;
  onChange: (accent: AccentId) => void;
}

const TRIGGER_CLASS = buttonClassWithSize("primaryGhost", "icon-sm");
const PANEL_CLASS = "w-32 px-dashboard-parent-x py-dashboard-parent-y";

export function AccentPicker({ value, onChange }: AccentPickerProps) {
  const { accent } = dashboardCopy;

  return (
    <PopoverPanel
      ariaLabel={accent.label}
      align="right"
      panelClassName={PANEL_CLASS}
      trigger={({ triggerProps, triggerRef }) => (
        <button
          {...triggerProps}
          ref={triggerRef}
          className={TRIGGER_CLASS}
          title={accent.label}
        >
          <AppIcon icon={Blend} size={16} strokeWidth={1.8} decorative />
        </button>
      )}
    >
      <AccentSwatches
        value={value}
        ariaLabel={accent.ariaLabel}
        onChange={onChange}
      />
    </PopoverPanel>
  );
}
