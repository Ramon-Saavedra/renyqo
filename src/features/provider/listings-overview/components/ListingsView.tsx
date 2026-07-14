"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { useRouter } from "next/navigation";
import { AppTopbar } from "@/components/layout/app-topbar/AppTopbar";
import { ApiError } from "@/lib/api/client";
import {
  archiveProviderListing,
  getProviderListings,
  moveProviderListingToDraft,
  publishProviderListing,
} from "../api/provider-listings";
import type {
  ListingOverviewItem,
  RowAction,
  SortKey,
  StatusCounts,
  StatusFilterKey,
} from "../types";
import { ListingRow } from "./ListingRow";
import { ListingsEmptyState } from "./ListingsEmptyState";
import { ListingsLoadingSkeleton } from "./ListingsLoadingSkeleton";
import { ListingsHero } from "./ListingsHero";
import { ListingsToolbar } from "./ListingsToolbar";
import { ListingsTopbarActions } from "./ListingsTopbarActions";
import { ListingsTrustLine } from "./ListingsTrustLine";
import { ListSummary } from "./ListSummary";
import { StatusFilter } from "./StatusFilter";

interface ListingsViewProps {
  initialListings?: readonly ListingOverviewItem[];
  now?: Date;
}

type FetchStatus = "idle" | "loading" | "error";
type ActionStatus = "publishing" | "drafting" | "archiving";

function buildCounts(listings: readonly ListingOverviewItem[]): StatusCounts {
  return {
    alle: listings.length,
    published: listings.filter((l) => l.status === "published").length,
    draft: listings.filter((l) => l.status === "draft").length,
    paused: listings.filter((l) => l.status === "paused").length,
    archived: listings.filter((l) => l.status === "archived").length,
    attention: listings.filter((l) => l.needsAttention).length,
  };
}

function matchesStatus(
  listing: ListingOverviewItem,
  filter: StatusFilterKey,
): boolean {
  if (filter === "alle") return true;
  if (filter === "attention") return listing.needsAttention;
  return listing.status === filter;
}

function matchesSearch(listing: ListingOverviewItem, q: string): boolean {
  if (!q) return true;
  const needle = q.toLowerCase();
  return (
    listing.title.toLowerCase().includes(needle) ||
    listing.displayAddress.toLowerCase().includes(needle)
  );
}

const ACTIVITY_TICK_MS = 60_000;

function subscribeActivityClock(onTick: () => void): () => void {
  const id = setInterval(onTick, ACTIVITY_TICK_MS);
  return () => clearInterval(id);
}
const getActivityTick = (): number => Math.floor(Date.now() / ACTIVITY_TICK_MS);
const getServerActivityTick = (): number => 0;

const SORTERS: Record<
  SortKey,
  (a: ListingOverviewItem, b: ListingOverviewItem) => number
> = {
  updated: (a, b) =>
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  created: (a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  applications: (a, b) => b.applicationsTotal - a.applicationsTotal,
};

export function ListingsView({ initialListings, now }: ListingsViewProps) {
  const router = useRouter();
  const [listings, setListings] = useState<readonly ListingOverviewItem[]>(
    initialListings ?? [],
  );
  const [fetchStatus, setFetchStatus] = useState<FetchStatus>(
    initialListings ? "idle" : "loading",
  );
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionStatusById, setActionStatusById] = useState<
    Readonly<Record<string, ActionStatus>>
  >({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilterKey>("alle");
  const [sort, setSort] = useState<SortKey>("updated");
  const activityTick = useSyncExternalStore(
    subscribeActivityClock,
    getActivityTick,
    getServerActivityTick,
  );
  const renderNow = useMemo<Date | null>(
    () => now ?? (activityTick > 0 ? new Date() : null),
    [now, activityTick],
  );

  useEffect(() => {
    if (initialListings) return;

    let active = true;

    async function loadListings() {
      setFetchStatus("loading");
      setFetchError(null);
      try {
        const data = await getProviderListings();
        if (!active) return;
        setListings(data);
        setFetchStatus("idle");
      } catch (err) {
        if (!active) return;
        setFetchError(
          err instanceof ApiError && err.status === 0
            ? "Netzwerkfehler — bitte versuche es erneut"
            : "Mietobjekte konnten nicht geladen werden",
        );
        setFetchStatus("error");
      }
    }

    void loadListings();

    return () => {
      active = false;
    };
  }, [initialListings]);

  const counts = useMemo(() => buildCounts(listings), [listings]);

  const filtered = useMemo(() => {
    const base = listings.filter(
      (l) => matchesStatus(l, statusFilter) && matchesSearch(l, search),
    );
    return [...base].sort(SORTERS[sort]);
  }, [listings, statusFilter, search, sort]);

  const handleAction = useCallback<
    (action: RowAction, listing: ListingOverviewItem) => Promise<void>
  >(
    async (action, listing) => {
      if (action === "details") {
        router.push(`/provider/listings/${listing.id}`);
        return;
      }
      if (action === "edit") return;

      const nextStatus =
        action === "publish"
          ? "published"
          : action === "draft"
            ? "draft"
            : "archived";
      const pendingStatus =
        action === "publish"
          ? "publishing"
          : action === "draft"
            ? "drafting"
            : "archiving";

      setActionError(null);
      setActionStatusById((current) => ({
        ...current,
        [listing.id]: pendingStatus,
      }));

      try {
        if (action === "publish") {
          await publishProviderListing(listing.id);
        } else if (action === "draft") {
          await moveProviderListingToDraft(listing.id);
        } else {
          await archiveProviderListing(listing.id);
        }

        setListings((current) =>
          current.map((item) =>
            item.id === listing.id
              ? {
                  ...item,
                  status: nextStatus,
                  updatedAt: new Date().toISOString(),
                  needsAttention:
                    nextStatus === "archived" ? false : item.needsAttention,
                  attentionReason:
                    nextStatus === "archived" ? null : item.attentionReason,
                }
              : item,
          ),
        );
      } catch (err) {
        setActionError(
          err instanceof ApiError && err.status === 0
            ? "Netzwerkfehler — Aktion konnte nicht ausgeführt werden"
            : "Aktion konnte nicht ausgeführt werden",
        );
      } finally {
        setActionStatusById((current) => {
          const next = { ...current };
          delete next[listing.id];
          return next;
        });
      }
    },
    [router],
  );

  const resetFilters = useCallback(() => {
    setStatusFilter("alle");
    setSearch("");
  }, []);

  const hasArchive = listings.some(
    (l) => l.status === "paused" || l.status === "archived",
  );

  const emptyVariant: "fresh" | "archived-only" | "filtered" | null = (() => {
    if (filtered.length > 0) return null;
    if (listings.length === 0) return "fresh";
    if (statusFilter !== "alle" && search.length === 0 && hasArchive) {
      return "archived-only";
    }
    return "filtered";
  })();

  return (
    <>
      <AppTopbar className="mb-section">
        <ListingsTopbarActions />
      </AppTopbar>

      <div className="px-gutter">
        <ListingsHero />
        <ListingsTrustLine />

        <div className="mb-4 flex">
          <ListingsToolbar value={search} onChange={setSearch} />
        </div>

        <StatusFilter
          value={statusFilter}
          onChange={setStatusFilter}
          counts={counts}
          className="mb-5"
        />

        <ListSummary
          total={listings.length}
          shown={filtered.length}
          sort={sort}
          onSortChange={setSort}
        />

        {actionError ? (
          <div className="mb-4 rounded-md border border-border bg-background px-4 py-3 text-caption text-foreground-secondary">
            {actionError}
          </div>
        ) : null}

        {fetchStatus === "loading" ? (
          <ListingsLoadingSkeleton />
        ) : fetchStatus === "error" ? (
          <div className="rounded-md border border-border bg-background px-6 py-10 text-caption text-foreground-secondary">
            {fetchError}
          </div>
        ) : emptyVariant ? (
          <ListingsEmptyState
            variant={emptyVariant}
            onShowAll={() => setStatusFilter("alle")}
            onResetFilters={resetFilters}
          />
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((listing) => (
              <ListingRow
                key={listing.id}
                listing={listing}
                onAction={handleAction}
                actionStatus={actionStatusById[listing.id]}
                now={renderNow}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
