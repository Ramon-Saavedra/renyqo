"use client";

import { useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell/PageShell";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { dashboardCopy } from "../copy/dashboard";
import { MOCK_CANDIDATES, MOCK_OBJECTS } from "../data/mock";
import { setStoredAccent, useAccent } from "../hooks/useAccent";
import type { Candidate, DashboardObject } from "../types";
import { CandidatesSection } from "./CandidatesSection";
import { DashboardSearch } from "./DashboardSearch";
import { DashboardTopbar } from "./DashboardTopbar";
import { ObjectSelectorMobile } from "./ObjectSelectorMobile";
import { ObjectSidebar } from "./ObjectSidebar";
import { SelectedObjectCard } from "./SelectedObjectCard";
import { StatCards } from "./StatCards";

interface DashboardViewProps {
  objects?: readonly DashboardObject[];
  candidates?: readonly Candidate[];
}

const SHELL_CLASS = "flex flex-col lg:h-dvh lg:overflow-hidden lg:flex-row";
const MAIN_CLASS =
  "min-w-0 flex-1 lg:flex lg:h-dvh lg:min-h-0 lg:flex-col lg:overflow-hidden";
const CONTENT_CLASS =
  "px-3 pt-1 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:px-gutter";

const REOPEN_CLASS =
  "sticky top-0 z-10 hidden items-center gap-2 self-start border-r border-b border-border bg-background px-3.5 py-2 font-mono text-meta uppercase text-foreground-secondary transition-colors hover:bg-primary-tint hover:text-primary focus-visible:outline-none focus-visible:shadow-focus lg:inline-flex lg:rounded-br-md";

export function DashboardView({
  objects = MOCK_OBJECTS,
  candidates = MOCK_CANDIDATES,
}: DashboardViewProps) {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(
    objects[0]?.id ?? null,
  );
  const [collapsed, setCollapsed] = useState(false);
  const accent = useAccent();

  const filteredObjects = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return objects;
    return objects.filter(
      (o) =>
        o.title.toLowerCase().includes(needle) ||
        o.fullTitle.toLowerCase().includes(needle) ||
        o.address.toLowerCase().includes(needle) ||
        o.district.toLowerCase().includes(needle),
    );
  }, [objects, search]);

  const selected = useMemo(
    () => objects.find((o) => o.id === selectedId) ?? objects[0] ?? null,
    [objects, selectedId],
  );

  const selectedCandidates = useMemo(
    () =>
      selected ? candidates.filter((c) => c.objectId === selected.id) : [],
    [candidates, selected],
  );

  const publishedObjects = objects.filter(
    (o) => o.status === "published",
  ).length;
  const draftObjects = objects.filter((o) => o.status === "draft").length;

  return (
    <PageShell className="lg:pb-0">
      <div className={SHELL_CLASS} data-accent={accent}>
        {collapsed ? (
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            className={REOPEN_CLASS}
          >
            <AppIcon
              icon={ChevronRight}
              size={12}
              strokeWidth={1.8}
              decorative
            />
            {dashboardCopy.sidebar.reopen}
          </button>
        ) : (
          <ObjectSidebar
            objects={filteredObjects}
            totalCount={objects.length}
            selectedId={selected?.id ?? null}
            search={search}
            onSearchChange={setSearch}
            onSelect={setSelectedId}
            onCollapse={() => setCollapsed(true)}
          />
        )}

        <div className={MAIN_CLASS}>
          <DashboardTopbar accent={accent} onAccentChange={setStoredAccent} />

          <div className={CONTENT_CLASS}>
            <ObjectSelectorMobile
              objects={filteredObjects}
              totalCount={objects.length}
              selectedId={selected?.id ?? null}
              onSelect={setSelectedId}
            />

            <div className="mt-6 mb-5">
              <DashboardSearch
                value={search}
                onChange={setSearch}
                placeholder={dashboardCopy.topbar.searchPlaceholder}
                ariaLabel={dashboardCopy.topbar.searchAria}
                clearLabel={dashboardCopy.topbar.searchClear}
              />
            </div>

            <div className="mb-6">
              <StatCards
                totalObjects={objects.length}
                publishedObjects={publishedObjects}
                draftObjects={draftObjects}
                newApplications={3}
              />
            </div>

            {selected && (
              <>
                <SelectedObjectCard object={selected} />
                <CandidatesSection
                  object={selected}
                  candidates={selectedCandidates}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
