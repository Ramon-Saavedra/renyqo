"use client";

import { ChevronLeft, Home } from "lucide-react";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { siteConfig } from "@/config/site";
import { dashboardCopy } from "../copy/dashboard";
import type { DashboardObject } from "../types";
import { DashboardSearch } from "./DashboardSearch";
import { ObjectSidebarItem } from "./ObjectSidebarItem";

interface ObjectSidebarProps {
  objects: readonly DashboardObject[];
  totalCount: number;
  selectedId: string | null;
  search: string;
  onSearchChange: (value: string) => void;
  onSelect: (id: string) => void;
  onCollapse: () => void;
}

const ASIDE_CLASS =
  "hidden bg-background lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-72 lg:shrink-0 lg:flex-col lg:border-r lg:border-border";

const HEAD_CLASS =
  "flex items-center justify-between border-b border-border px-5 py-4";
const HEAD_TITLE_CLASS =
  "font-mono text-meta uppercase text-foreground-tertiary";
const COLLAPSE_CLASS =
  "inline-flex cursor-pointer items-center gap-1.5 rounded-sm px-1.5 py-1 font-mono text-meta uppercase text-foreground-tertiary hover:bg-background-subtle hover:text-foreground focus-visible:outline-none focus-visible:shadow-focus";

const SEARCH_WRAP_CLASS = "px-4 pt-3.5 pb-1";

const LIST_CLASS =
  "flex flex-1 flex-col gap-2 overflow-hidden px-3 pt-3 pb-4 lg:min-h-0";
const SLOT_CLASS =
  "flex min-h-0 flex-1 flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border bg-background-subtle px-3 text-center text-caption text-foreground-secondary";
const SLOT_LOGO_CLASS =
  "inline-flex h-6.5 w-6.5 items-center justify-center rounded-sm bg-primary-soft text-primary";
const SIDEBAR_OBJECT_SLOTS = 5;

export function ObjectSidebar({
  objects,
  totalCount,
  selectedId,
  search,
  onSearchChange,
  onSelect,
  onCollapse,
}: ObjectSidebarProps) {
  const { sidebar } = dashboardCopy;
  const visibleObjects = objects.slice(0, SIDEBAR_OBJECT_SLOTS);
  const emptySlots = Math.max(0, SIDEBAR_OBJECT_SLOTS - visibleObjects.length);

  return (
    <aside className={ASIDE_CLASS}>
      <div className={HEAD_CLASS}>
        <span className={HEAD_TITLE_CLASS}>
          {sidebar.heading} · {totalCount}
        </span>
        <button type="button" onClick={onCollapse} className={COLLAPSE_CLASS}>
          <AppIcon icon={ChevronLeft} size={12} strokeWidth={1.8} decorative />
          {sidebar.collapse}
        </button>
      </div>

      <div className={SEARCH_WRAP_CLASS}>
        <DashboardSearch
          dense
          value={search}
          onChange={onSearchChange}
          placeholder={sidebar.searchPlaceholder}
          ariaLabel={sidebar.searchAria}
          clearLabel={sidebar.searchClear}
        />
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
