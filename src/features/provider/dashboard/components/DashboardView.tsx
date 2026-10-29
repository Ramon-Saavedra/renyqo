"use client";

import {
  useEffect,
  useCallback,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell/PageShell";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { dashboardPrimaryClass } from "../dashboard-button";
import { FormAlert } from "@/components/ui/form/FormAlert";
import { getProviderDashboardObjects } from "../api/provider-dashboard";
import { moveProviderListingToPosition } from "@/features/provider/listings-overview/api/provider-listings";
import { dashboardCopy } from "../copy/dashboard";
import {
  getServerSelectedObjectId,
  getServerUrlSelectedListingId,
  getStoredSelectedObjectId,
  getUrlSelectedListingId,
  selectDashboardListing,
  setStoredSelectedObjectId,
  subscribeSelectedListing,
  subscribeSelectedObject,
} from "../selected-object-storage";
import { useExitedApplications } from "../hooks/useExitedApplications";
import { toListingApplicantPreview } from "../hooks/useListingApplicantNames";
import { useSelectedListingApplications } from "../hooks/useSelectedListingApplications";
import {
  TabRefreshProvider,
  useTabRefreshRevision,
} from "../hooks/TabRefreshProvider";
import { setStoredAccent, useAccent } from "../hooks/useAccent";
import type { DashboardObject } from "../types";
import { AccentPicker } from "./AccentPicker";
import { providerWorkspaceHrefFromDashboardSearch } from "@/lib/navigation/deep-link";
import { useUrlSearch } from "@/lib/navigation/url-search";
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

function useStoredSelectedObjectId() {
  return useSyncExternalStore(
    subscribeSelectedObject,
    getStoredSelectedObjectId,
    getServerSelectedObjectId,
  );
}

function useUrlSelectedListingId() {
  return useSyncExternalStore(
    subscribeSelectedListing,
    getUrlSelectedListingId,
    getServerUrlSelectedListingId,
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
  const objectsRequestGenerationRef = useRef(0);
  const [loadedObjects, setLoadedObjects] = useState<
    readonly DashboardObject[]
  >([]);
  const [refreshedObjects, setRefreshedObjects] = useState<
    readonly DashboardObject[] | null
  >(null);
  const [isLoading, setIsLoading] = useState(shouldLoadObjects);
  const [loadError, setLoadError] = useState(false);
  const objects = refreshedObjects ?? initialObjects ?? loadedObjects;
  const [search, setSearch] = useState("");
  const storedId = useStoredSelectedObjectId();
  const urlListingId = useUrlSelectedListingId();
  const router = useRouter();
  const locationSearch = useUrlSearch();
  const legacyWorkspaceHref = useMemo(
    () => providerWorkspaceHrefFromDashboardSearch(locationSearch),
    [locationSearch],
  );
  const accent = useAccent();

  useEffect(() => {
    if (legacyWorkspaceHref) router.replace(legacyWorkspaceHref);
  }, [legacyWorkspaceHref, router]);

  const beginObjectsRequest = useCallback(() => {
    objectsRequestGenerationRef.current += 1;
    return objectsRequestGenerationRef.current;
  }, []);

  const handleReorder = useCallback(
    async (listingId: string, position: number) => {
      await moveProviderListingToPosition(listingId, position);
      const generation = beginObjectsRequest();
      try {
        const nextObjects = await getProviderDashboardObjects();
        if (generation !== objectsRequestGenerationRef.current) {
          return undefined;
        }
        if (initialObjects === undefined) {
          hasLoadedObjectsRef.current = true;
          setLoadedObjects(nextObjects);
          setLoadError(false);
          setIsLoading(false);
        } else {
          setRefreshedObjects(nextObjects);
        }
      } catch {
        if (generation !== objectsRequestGenerationRef.current) {
          return undefined;
        }
        return "refresh-failed" as const;
      }
      return undefined;
    },
    [beginObjectsRequest, initialObjects],
  );

  useEffect(() => {
    if (!shouldLoadObjects) return;

    let active = true;
    const generation = beginObjectsRequest();
    const isRefresh = hasLoadedObjectsRef.current;
    const isCurrent = () =>
      active && generation === objectsRequestGenerationRef.current;

    getProviderDashboardObjects()
      .then((nextObjects) => {
        if (!isCurrent()) return;
        hasLoadedObjectsRef.current = true;
        setLoadedObjects(nextObjects);
        setLoadError(false);
      })
      .catch(() => {
        if (!isCurrent()) return;
        if (!isRefresh) setLoadedObjects([]);
        setLoadError(true);
      })
      .finally(() => {
        if (!isCurrent()) return;
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [beginObjectsRequest, refreshRevision, shouldLoadObjects]);

  const orderedObjects = useMemo(
    () =>
      [...objects].sort(
        (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
      ),
    [objects],
  );
  const matrixObjects = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return orderedObjects;
    return orderedObjects.filter(
      (object) =>
        object.title.toLowerCase().includes(needle) ||
        object.fullTitle.toLowerCase().includes(needle) ||
        object.address.toLowerCase().includes(needle) ||
        object.district.toLowerCase().includes(needle),
    );
  }, [orderedObjects, search]);

  const selected = useMemo(() => {
    if (isLoading || orderedObjects.length === 0) return null;
    if (urlListingId) {
      const fromUrl = orderedObjects.find(
        (object) => object.id === urlListingId,
      );
      if (fromUrl) return fromUrl;
    }
    if (storedId) {
      const fromStorage = orderedObjects.find(
        (object) => object.id === storedId,
      );
      if (fromStorage) return fromStorage;
    }
    return orderedObjects[0] ?? null;
  }, [isLoading, orderedObjects, storedId, urlListingId]);

  useEffect(() => {
    if (isLoading || !urlListingId) return;
    if (!orderedObjects.some((object) => object.id === urlListingId)) return;
    if (getStoredSelectedObjectId() === urlListingId) return;
    setStoredSelectedObjectId(urlListingId);
  }, [isLoading, orderedObjects, urlListingId]);
  const hasSearch = search.trim().length > 0;
  const shownSelected = useMemo(() => {
    if (!selected) return null;
    if (!hasSearch) return selected;
    if (matrixObjects.some((object) => object.id === selected.id)) {
      return selected;
    }
    return matrixObjects[0] ?? null;
  }, [hasSearch, matrixObjects, selected]);

  const {
    candidates: selectedCandidates,
    waitingCountState,
    isLoading: isApplicationsLoading,
    isRefreshing: isApplicationsRefreshing,
    hasError: hasApplicationsError,
  } = useSelectedListingApplications(
    shownSelected?.id ?? null,
    shownSelected?.status ?? null,
  );

  const {
    exits: recentExits,
    isLoading: isExitedApplicationsLoading,
    hasError: hasExitedApplicationsError,
    restorationState,
    restoreCandidate,
    resetRestoration,
  } = useExitedApplications(
    shownSelected?.id ?? null,
    shownSelected?.status ?? null,
  );
  const preloadedApplicants = useMemo(() => {
    if (!shownSelected || shownSelected.status === "draft") return null;
    if (hasApplicationsError) return null;
    if (isApplicationsLoading || isApplicationsRefreshing) {
      return {
        listingId: shownSelected.id,
        status: "loading" as const,
      };
    }
    return {
      listingId: shownSelected.id,
      status: "ready" as const,
      previews: selectedCandidates.map(toListingApplicantPreview),
    };
  }, [
    hasApplicationsError,
    isApplicationsLoading,
    isApplicationsRefreshing,
    selectedCandidates,
    shownSelected,
  ]);

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
          <div role="alert" className="px-gutter pt-21">
            <p className="font-mono text-meta font-medium uppercase tracking-wide text-danger">
              {dashboardCopy.fullError.eyebrow}
            </p>
            <h1 className="mt-3.5 text-heading-xl font-normal tracking-tight text-foreground">
              {dashboardCopy.fullError.title}
            </h1>
            <p className="mt-2.5 max-w-md text-body text-foreground-secondary">
              {dashboardCopy.fullError.body}
            </p>
            <button
              type="button"
              className={dashboardPrimaryClass("mt-6")}
              onClick={() => window.location.reload()}
            >
              {dashboardCopy.fullError.retry}
            </button>
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
          <div className="px-gutter pt-21">
            <h1 className="text-heading-xl font-normal tracking-tight text-foreground">
              {dashboardCopy.object.emptyTitle}
            </h1>
            <p className="mt-2.5 max-w-md text-body text-foreground-secondary">
              {dashboardCopy.object.emptyAddress}
            </p>
            <Link
              href={dashboardCopy.topbar.newListingHref}
              className={dashboardPrimaryClass("mt-6")}
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

        <div className="@container px-gutter pt-7 pb-16">
          <div className="mb-section flex flex-col gap-2 rounded-md border border-border bg-primary px-parent-x py-parent-y sm:flex-row sm:items-center">
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

          <div className="mb-section">
            <ListingMatrix
              objects={matrixObjects}
              orderObjects={objects}
              selectedId={shownSelected?.id ?? null}
              onSelect={selectDashboardListing}
              onReorder={handleReorder}
              preloadedApplicants={preloadedApplicants}
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

          {shownSelected ? <SelectedObjectCard object={shownSelected} /> : null}

          {shownSelected ? (
            <CandidatesSection
              object={shownSelected}
              candidates={selectedCandidates}
              waitingCountState={waitingCountState}
              isLoading={isApplicationsLoading}
              hasError={hasApplicationsError}
            />
          ) : null}

          {shownSelected && shownSelected.status !== "draft" ? (
            <RecentExitsRail
              key={shownSelected.id}
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
