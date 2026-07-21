"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { AppTopbar } from "@/components/layout/app-topbar/AppTopbar";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { ApiError } from "@/lib/api/client";
import { ListingsTopbarActions } from "../../listings-overview/components/ListingsTopbarActions";
import {
  archiveProviderListing,
  getProviderListing,
  moveProviderListingToDraft,
  publishProviderListing,
} from "../api/provider-listing-detail";
import { listingDetailCopy } from "../copy/listing-detail";
import { STICKY_HEAD_CLASS } from "../sticky-head";
import { ListingEditView } from "../edit/components/ListingEditView";
import type { DetailAction, ListingDetail } from "../types";
import { AddressCard } from "./AddressCard";
import { DescriptionCard } from "./DescriptionCard";
import { AccountMenu } from "@/features/provider/user-menu/components/AccountMenu";
import { DetailErrorState } from "./DetailErrorState";
import { DetailHead } from "./DetailHead";
import { DetailLoadingSkeleton } from "./DetailLoadingSkeleton";
import { FactsCard } from "./FactsCard";
import { Gallery } from "./Gallery";
import { RequirementsCard } from "./RequirementsCard";

interface ListingDetailViewProps {
  listingId: string;
}

type FetchStatus = "loading" | "loaded" | "error";

const BODY_CLASS = "px-gutter pt-7 pb-12";
const BACK_LINK_CLASS =
  "mb-4.5 inline-flex items-center gap-1.5 text-caption font-medium text-foreground-tertiary transition-colors hover:text-foreground";
const COLUMN_CONTAINER = "flex flex-col gap-5 lg:flex-row lg:items-start";
const LEFT_COLUMN = "contents lg:flex lg:w-3/5 lg:min-w-0 lg:flex-col lg:gap-5";
const RIGHT_COLUMN =
  "contents lg:flex lg:w-2/5 lg:min-w-0 lg:flex-col lg:gap-5";
const ACTION_ERROR_CLASS =
  "mt-4 rounded-md border border-border bg-background px-4 py-3 text-caption text-foreground-secondary";

const ACTION_HANDLERS: Record<DetailAction, (id: string) => Promise<void>> = {
  publish: publishProviderListing,
  draft: moveProviderListingToDraft,
  archive: archiveProviderListing,
};

const NEXT_STATUS: Record<DetailAction, ListingDetail["status"]> = {
  publish: "published",
  draft: "draft",
  archive: "archived",
};

export function ListingDetailView({ listingId }: ListingDetailViewProps) {
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [fetchStatus, setFetchStatus] = useState<FetchStatus>("loading");
  const [pendingAction, setPendingAction] = useState<DetailAction | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      setFetchStatus("loading");
      try {
        const data = await getProviderListing(listingId);
        if (!active) return;
        setListing(data);
        setFetchStatus("loaded");
      } catch {
        if (!active) return;
        setFetchStatus("error");
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [listingId, reloadKey]);

  const handleAction = useCallback(
    async (action: DetailAction) => {
      setActionError(null);
      setPendingAction(action);
      try {
        await ACTION_HANDLERS[action](listingId);
        setListing((current) =>
          current
            ? {
                ...current,
                status: NEXT_STATUS[action],
                updatedAt: new Date().toISOString(),
              }
            : current,
        );
      } catch (err) {
        setActionError(
          err instanceof ApiError && err.status === 0
            ? listingDetailCopy.error.network
            : listingDetailCopy.error.action,
        );
      } finally {
        setPendingAction(null);
      }
    },
    [listingId],
  );

  const retry = useCallback(() => setReloadKey((key) => key + 1), []);

  const enterEditMode = useCallback(() => {
    setActionError(null);
    setIsEditing(true);
  }, []);

  const handleEditSaved = useCallback((updated: ListingDetail) => {
    setListing(updated);
    setIsEditing(false);
  }, []);

  const exitEditMode = useCallback(() => setIsEditing(false), []);

  return (
    <>
      <AppTopbar logoHref="/provider/dashboard" className="mb-6">
        <ListingsTopbarActions />
        <AccountMenu />
      </AppTopbar>

      <div className={BODY_CLASS}>
        <Link href={listingDetailCopy.backHref} className={BACK_LINK_CLASS}>
          <AppIcon icon={ChevronLeft} size={13} strokeWidth={1.8} decorative />
          {listingDetailCopy.backLabel}
        </Link>

        {fetchStatus === "loading" ? (
          <DetailLoadingSkeleton />
        ) : fetchStatus === "error" || !listing ? (
          <DetailErrorState onRetry={retry} />
        ) : isEditing ? (
          <ListingEditView
            listing={listing}
            onCancel={exitEditMode}
            onSaved={handleEditSaved}
          />
        ) : (
          <>
            <div className={STICKY_HEAD_CLASS}>
              <DetailHead
                listing={listing}
                pendingAction={pendingAction}
                onAction={handleAction}
                onEdit={enterEditMode}
              />

              {actionError ? (
                <div className={ACTION_ERROR_CLASS} role="alert">
                  {actionError}
                </div>
              ) : null}
            </div>

            <div className={COLUMN_CONTAINER}>
              <div className={LEFT_COLUMN}>
                <Gallery
                  images={listing.images}
                  title={listing.title}
                  className="order-1 lg:order-0"
                />
                <DescriptionCard
                  description={listing.shortDescription}
                  className="order-3 lg:order-0"
                />
                <RequirementsCard
                  listing={listing}
                  className="order-4 lg:order-0"
                />
              </div>
              <div className={RIGHT_COLUMN}>
                <FactsCard listing={listing} className="order-2 lg:order-0" />
                <AddressCard listing={listing} className="order-5 lg:order-0" />
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
