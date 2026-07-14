"use client";

import { ChevronLeft, Home } from "lucide-react";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { siteConfig } from "@/config/site";
import { dashboardCopy } from "../copy/dashboard";
import type { DashboardObject } from "../types";
import { ObjectSidebarItem } from "./ObjectSidebarItem";

interface ObjectSidebarProps {
  objects: readonly DashboardObject[];
  totalCount: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCollapse: () => void;
}

const ASIDE_CLASS =
  "hidden bg-background-subtle lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-72 lg:shrink-0 lg:flex-col lg:border-r lg:border-border";

const HEAD_CLASS = "flex items-start justify-between gap-3 px-5 py-4";
const HEAD_COPY_CLASS = "flex min-w-0 flex-col gap-1";
const HEAD_TITLE_CLASS =
  "min-w-0 truncate font-mono text-meta text-warning-vivid";
const HEAD_COUNT_CLASS = "font-mono text-meta text-warning-vivid";
const COLLAPSE_CLASS =
  "inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-sm text-foreground-tertiary hover:bg-background-subtle hover:text-foreground focus-visible:outline-none focus-visible:shadow-focus";

const LIST_CLASS =
  "flex flex-1 flex-col gap-2 overflow-hidden px-3 pt-0 pb-4 lg:min-h-0";
const SLOT_CLASS =
  "flex min-h-0 flex-1 flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border bg-background px-3 text-center text-caption text-foreground-secondary";
const SLOT_LOGO_CLASS =
  "inline-flex h-6.5 w-6.5 items-center justify-center rounded-sm bg-primary-soft text-primary";
const SIDEBAR_OBJECT_SLOTS = 5;

export function ObjectSidebar({
  objects,
  totalCount,
  selectedId,
  onSelect,
  onCollapse,
}: ObjectSidebarProps) {
  const { sidebar } = dashboardCopy;
  const visibleObjects = objects.slice(0, SIDEBAR_OBJECT_SLOTS);
  const emptySlots = Math.max(0, SIDEBAR_OBJECT_SLOTS - visibleObjects.length);

  return (
    <aside className={ASIDE_CLASS}>
      <div className={HEAD_CLASS}>
        <span className={HEAD_COPY_CLASS}>
          <span className={HEAD_TITLE_CLASS}>{sidebar.heading}</span>
          <span className={HEAD_COUNT_CLASS}>{totalCount}</span>
        </span>
        <button
          type="button"
          onClick={onCollapse}
          aria-label={sidebar.collapse}
          className={COLLAPSE_CLASS}
        >
          <AppIcon icon={ChevronLeft} size={12} strokeWidth={1.8} decorative />
        </button>
      </div>

      <ul className={LIST_CLASS}>
        {visibleObjects.map((object) => (
          <ObjectSidebarItem
            key={object.id}
            object={object}
            selected={object.id === selectedId}
            shareUrl={`${siteConfig.url}/objekt/${object.id}`}
            onSelect={onSelect}
          />
        ))}
        {Array.from({ length: emptySlots }).map((_, index) => (
          <li
            key={`empty-slot-${index}`}
            aria-hidden={objects.length > 0 || index > 0}
            className={SLOT_CLASS}
          >
            <span className={SLOT_LOGO_CLASS}>
              <AppIcon icon={Home} size={14} strokeWidth={2} decorative />
            </span>
            {objects.length === 0 && index === 0 ? (
              <span>{sidebar.empty}</span>
            ) : null}
          </li>
        ))}
      </ul>
    </aside>
  );
}
