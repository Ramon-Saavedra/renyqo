"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell/PageShell";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { Button } from "@/components/ui/button/Button";
import { FormAlert } from "@/components/ui/form/FormAlert";
import { getProviderDashboardObjects } from "../api/provider-dashboard";
import { dashboardCopy, SELECTED_OBJECT_STORAGE_KEY } from "../copy/dashboard";
import { useExitedApplications } from "../hooks/useExitedApplications";
import { useSelectedListingApplications } from "../hooks/useSelectedListingApplications";
import {
  TabRefreshProvider,
  useTabRefreshRevision,
} from "../hooks/TabRefreshProvider";
import { setStoredAccent, useAccent } from "../hooks/useAccent";
import type { DashboardObject } from "../types";
import { AccentPicker } from "./AccentPicker";
import { CandidatesSection } from "./CandidatesSection";
import { DashboardLoadingSkeleton } from "./DashboardLoadingSkeleton";
import { DashboardSearch } from "./DashboardSearch";
import { DashboardTopbar } from "./DashboardTopbar";
import { ListingMatrix } from "./ListingMatrix";
import { RecentExitsRail } from "./RecentExitsRail";
import { SelectedObjectCard } from "./SelectedObjectCard";

interface DashboardViewProps {
  objects?: readonly DashboardObject[];
}

interface DashboardViewContentProps {
  objects?: readonly DashboardObject[] | undefined;
}

function getStoredSelectedObjectId() {
  return window.localStorage.getItem(SELECTED_OBJECT_STORAGE_KEY);
}

function getServerSelectedObjectId() {
  return null;
}

const selectedObjectListeners = new Set<() => void>();

function emitSelectedObjectChange() {
  for (const listener of selectedObjectListeners) listener();
}

function subscribeSelectedObject(onChange: () => void) {
  selectedObjectListeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    selectedObjectListeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function setStoredSelectedObjectId(id: string) {
  window.localStorage.setItem(SELECTED_OBJECT_STORAGE_KEY, id);
  emitSelectedObjectChange();
}

function useStoredSelectedObjectId() {
  return useSyncExternalStore(
    subscribeSelectedObject,
    getStoredSelectedObjectId,
    getServerSelectedObjectId,
  );
}

export function DashboardView({ objects }: DashboardViewProps) {
  return (
    <TabRefreshProvider>
      <DashboardViewContent objects={objects} />
    </TabRefreshProvider>
  );
}

function DashboardViewContent({
  objects: initialObjects,
}: DashboardViewContentProps) {
  const shouldLoadObjects = initialObjects === undefined;
  const refreshRevision = useTabRefreshRevision();
  const hasLoadedObjectsRef = useRef(false);
  const [loadedObjects, setLoadedObjects] = useState<
    readonly DashboardObject[]
  >([]);
  const [isLoading, setIsLoading] = useState(shouldLoadObjects);
  const [loadError, setLoadError] = useState(false);
  const objects = initialObjects ?? loadedObjects;
  const [search, setSearch] = useState("");
  const selectedId = useStoredSelectedObjectId();
  const accent = useAccent();

  useEffect(() => {
    if (!shouldLoadObjects) return;

    let active = true;
    const isRefresh = hasLoadedObjectsRef.current;

    getProviderDashboardObjects()
      .then((nextObjects) => {
        if (!active) return;
        hasLoadedObjectsRef.current = true;
        setLoadedObjects(nextObjects);
        setLoadError(false);
      })
      .catch(() => {
        if (!active) return;
        if (!isRefresh) setLoadedObjects([]);
        setLoadError(true);
      })
      .finally(() => {
        if (!active) return;
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [refreshRevision, shouldLoadObjects]);

  const matrixObjects = useMemo(() => {
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

  const {
    candidates: selectedCandidates,
    waitingCountState,
    isLoading: isApplicationsLoading,
    hasError: hasApplicationsError,
  } = useSelectedListingApplications(
    selected?.id ?? null,
    selected?.status ?? null,
  );

  const {
    exits: recentExits,
    isLoading: isExitedApplicationsLoading,
    hasError: hasExitedApplicationsError,
    restorationState,
    restoreCandidate,
    resetRestoration,
  } = useExitedApplications(selected?.id ?? null, selected?.status ?? null);

  const publishedCount = objects.filter((o) => o.status === "published").length;
  const draftCount = objects.filter((o) => o.status === "draft").length;
  const activeApplications = objects.reduce(
    (total, object) => total + object.activeApplicationsCount,
    0,
  );

  if (isLoading) {
    return <DashboardLoadingSkeleton />;
  }

  if (loadError && objects.length === 0) {
    return (
      <PageShell className="lg:pb-0">
        <div data-accent={accent}>
          <DashboardTopbar />
          <div role="alert" className="px-3 pt-21 lg:px-gutter">
            <p className="font-mono text-meta font-medium uppercase tracking-wide text-danger">
              {dashboardCopy.fullError.eyebrow}
            </p>
            <h1 className="mt-3.5 text-heading-xl font-normal tracking-tight text-foreground">
              {dashboardCopy.fullError.title}
            </h1>
            <p className="mt-2.5 max-w-md text-body text-foreground-secondary">
              {dashboardCopy.fullError.body}
            </p>
            <Button
              type="button"
              className="mt-6"
              onClick={() => window.location.reload()}
            >
              {dashboardCopy.fullError.retry}
            </Button>
          </div>
        </div>
      </PageShell>
    );
  }

  if (objects.length === 0) {
    return (
      <PageShell className="lg:pb-0">
        <div data-accent={accent}>
          <DashboardTopbar />
          <div className="px-3 pt-21 lg:px-gutter">
            <h1 className="text-heading-xl font-normal tracking-tight text-foreground">
              {dashboardCopy.object.emptyTitle}
            </h1>
            <p className="mt-2.5 max-w-md text-body text-foreground-secondary">
              {dashboardCopy.object.emptyAddress}
            </p>
            <Link
              href={dashboardCopy.topbar.newListingHref}
              className="mt-6 inline-flex min-h-11 items-center rounded-md bg-primary px-4.5 text-action font-medium text-primary-foreground hover:bg-primary-hover"
            >
              {dashboardCopy.topbar.newListing}
            </Link>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell className="lg:pb-0">
      <div data-accent={accent}>
        <DashboardTopbar />

        <div className="@container px-3 pt-7 pb-16 lg:px-gutter">
          <div className="mb-6 flex flex-col gap-2 rounded-md border border-border bg-primary px-parent-x py-parent-y sm:flex-row sm:items-center">
            <div className="w-full sm:max-w-90 sm:min-w-45 sm:flex-1">
              <DashboardSearch
                value={search}
                onChange={setSearch}
                placeholder={dashboardCopy.topbar.searchPlaceholder}
                ariaLabel={dashboardCopy.topbar.searchAria}
                clearLabel={dashboardCopy.topbar.searchClear}
                dense
              />
            </div>
            <div className="flex w-full items-center justify-between gap-2 sm:ml-auto sm:w-auto sm:justify-end">
              <Link
                href={dashboardCopy.topbar.objectsHref}
                className="flex min-h-11 items-center gap-1.5 rounded-md px-2.5 text-action font-medium text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground"
              >
                {dashboardCopy.matrix.allObjects}
                <AppIcon
                  icon={ArrowUpRight}
                  size={14}
                  strokeWidth={2}
                  decorative
                />
              </Link>
              <AccentPicker value={accent} onChange={setStoredAccent} />
            </div>
          </div>

          {loadError ? (
            <FormAlert
              variant="error"
              message={dashboardCopy.error}
              className="mb-4"
            />
          ) : null}
          <div className="flex flex-wrap items-center gap-x-3.5 gap-y-2">
            <h2 className="font-mono text-meta font-medium uppercase tracking-wide text-foreground-tertiary">
              {dashboardCopy.matrix.heading}
            </h2>
            <span className="text-caption text-foreground-tertiary">
              {dashboardCopy.matrix.statsLine(
                objects.length,
                publishedCount,
                draftCount,
                activeApplications,
              )}
            </span>
          </div>

          <div className="mt-4">
            <ListingMatrix
              objects={matrixObjects}
              selectedId={selected?.id ?? null}
              onSelect={setStoredSelectedObjectId}
            />
            {matrixObjects.length === 0 ? (
              <p
                role="status"
                className="text-caption text-foreground-tertiary"
              >
                {dashboardCopy.matrix.noMatch(search)}
              </p>
            ) : null}
          </div>

          {selected ? <SelectedObjectCard object={selected} /> : null}

          <CandidatesSection
            object={selected}
            candidates={selectedCandidates}
            waitingCountState={waitingCountState}
            isLoading={isApplicationsLoading}
            hasError={hasApplicationsError}
          />

          {selected && selected.status !== "draft" ? (
            <RecentExitsRail
              key={selected.id}
              exits={recentExits}
              isLoading={isExitedApplicationsLoading}
              hasError={hasExitedApplicationsError}
              restorationState={restorationState}
              onRestore={restoreCandidate}
              onResetRestoration={resetRestoration}
            />
          ) : null}
        </div>
      </div>
    </PageShell>
  );
}
