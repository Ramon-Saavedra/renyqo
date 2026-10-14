"use client";

import { Blend } from "lucide-react";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { PopoverPanel } from "@/components/ui/popover/PopoverPanel";
import { dashboardCopy } from "../copy/dashboard";
import type { AccentId } from "../copy/dashboard";
import { AccentSwatches } from "./AccentSwatches";

interface AccentPickerProps {
  value: AccentId;
  onChange: (accent: AccentId) => void;
}

const TRIGGER_CLASS =
  "inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-md bg-transparent p-0 text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground focus-visible:outline-none focus-visible:shadow-focus";
const PANEL_CLASS = "w-32 px-parent-x py-parent-y";

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
          <AppIcon icon={Blend} size={17} strokeWidth={1.7} decorative />
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
