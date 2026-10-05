import { useRef, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils/cn";
import { applicantWorkflowCopy } from "../copy";
import type { WorkflowSectionKey } from "../workflow-model";

export type WorkflowTabKey = "overview" | WorkflowSectionKey;

export const WORKFLOW_TAB_ORDER: readonly WorkflowTabKey[] = [
  "overview",
  "messages",
  "documents",
  "viewing",
];

interface WorkflowTabsProps {
  readonly idPrefix: string;
  readonly activeTab: WorkflowTabKey;
  readonly onSelect: (tab: WorkflowTabKey) => void;
}

export function tabId(idPrefix: string, tab: WorkflowTabKey) {
  return `${idPrefix}-tab-${tab}`;
}

export function panelId(idPrefix: string, tab: WorkflowTabKey) {
  return `${idPrefix}-panel-${tab}`;
}

function nextTabIndex(key: string, current: number): number | null {
  const last = WORKFLOW_TAB_ORDER.length - 1;
  switch (key) {
    case "ArrowRight":
      return current === last ? 0 : current + 1;
    case "ArrowLeft":
      return current === 0 ? last : current - 1;
    case "Home":
      return 0;
    case "End":
      return last;
    default:
      return null;
  }
}

export function WorkflowTabs({
  idPrefix,
  activeTab,
  onSelect,
}: WorkflowTabsProps) {
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const current = WORKFLOW_TAB_ORDER.indexOf(activeTab);
    const next = nextTabIndex(event.key, current);
    if (next === null) return;
    event.preventDefault();
    onSelect(WORKFLOW_TAB_ORDER[next]!);
    tabRefs.current[next]?.focus();
  }

  return (
    <div
      role="tablist"
      aria-label={applicantWorkflowCopy.tabs.label}
      onKeyDown={handleKeyDown}
      className="flex border-y border-border bg-background-muted"
    >
      {WORKFLOW_TAB_ORDER.map((tab, index) => {
        const selected = tab === activeTab;
        return (
          <button
            key={tab}
            ref={(element) => {
              tabRefs.current[index] = element;
            }}
            id={tabId(idPrefix, tab)}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={panelId(idPrefix, tab)}
            tabIndex={selected ? 0 : -1}
            onClick={() => onSelect(tab)}
            className={cn(
              "flex h-11.5 min-w-0 flex-1 cursor-pointer items-center justify-center border-b-2 px-1 text-caption font-medium focus-visible:shadow-focus focus-visible:outline-none",
              selected
                ? "border-primary text-foreground"
                : "border-transparent text-foreground-secondary hover:text-foreground",
            )}
          >
            <span className="truncate">{applicantWorkflowCopy.tabs[tab]}</span>
          </button>
        );
      })}
    </div>
  );
}
