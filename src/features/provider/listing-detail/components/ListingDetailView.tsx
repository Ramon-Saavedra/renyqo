"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Pencil } from "lucide-react";
import { AppTopbar } from "@/components/layout/app-topbar/AppTopbar";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { ApiError } from "@/lib/api/client";
import { buttonClass } from "@/components/ui/button/Button";
import { cn } from "@/lib/utils/cn";
import { ConfirmationModal } from "@/components/ui/confirmation-modal/ConfirmationModal";
import { ListingsTopbarActions } from "../../listings-overview/components/ListingsTopbarActions";
import {
  archiveProviderListing,
  getProviderListing,
  moveProviderListingToDraft,
  publishProviderListing,
} from "../api/provider-listing-detail";
import { listingDetailCopy } from "../copy/listing-detail";
import { listingEditCopy } from "../edit/copy";
import { STICKY_HEAD_CLASS } from "../sticky-head";
import { ListingEditView } from "../edit/components/ListingEditView";
import type { DetailAction, ListingDetail } from "../types";
import { AddressCard } from "./AddressCard";
import { DescriptionCard } from "./DescriptionCard";
import { AccountMenu } from "@/features/provider/user-menu/components/AccountMenu";
import { DetailActionButton } from "./DetailActionButton";
import { DetailErrorState } from "./DetailErrorState";
import { DetailHead, buildActions } from "./DetailHead";
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
  "mb-4.5 inline-flex items-center gap-1.5 cursor-pointer text-caption font-medium text-foreground-tertiary transition-colors hover:text-foreground";
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
  const router = useRouter();
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [fetchStatus, setFetchStatus] = useState<FetchStatus>("loading");
  const [pendingAction, setPendingAction] = useState<DetailAction | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditDirty, setIsEditDirty] = useState(false);
  const [pendingLeave, setPendingLeave] = useState(false);

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

  const handleEditDirtyChange = useCallback(
    (dirty: boolean) => setIsEditDirty(dirty),
    [],
  );

  const enterEditMode = useCallback(() => {
    setActionError(null);
    setIsEditing(true);
  }, []);

  const handleEditSaved = useCallback((updated: ListingDetail) => {
    setListing(updated);
    setIsEditing(false);
    setIsEditDirty(false);
  }, []);

  const exitEditMode = useCallback(() => {
    setIsEditing(false);
    setIsEditDirty(false);
  }, []);

  const handleBackClick = useCallback(() => {
    if (isEditDirty) {
      setPendingLeave(true);
    } else {
      router.push(listingDetailCopy.backHref);
    }
  }, [isEditDirty, router]);

  const confirmLeave = useCallback(() => {
    setPendingLeave(false);
    setIsEditing(false);
    setIsEditDirty(false);
    router.push(listingDetailCopy.backHref);
  }, [router]);

  const cancelLeave = useCallback(() => setPendingLeave(false), []);

  const handleLogoClick = useCallback(
    (e: React.MouseEvent) => {
      if (isEditDirty) {
        e.preventDefault();
        setPendingLeave(true);
      }
    },
    [isEditDirty],
  );

  return (
    <>
      <AppTopbar
        logoHref="/provider/dashboard"
        className="mb-6"
        {...(isEditing && isEditDirty ? { onLogoClick: handleLogoClick } : {})}
      >
        <ListingsTopbarActions
          {...(isEditing && isEditDirty
            ? { onBackClick: () => setPendingLeave(true) }
            : {})}
        />
        <AccountMenu />
      </AppTopbar>

      <div className={BODY_CLASS}>
        {isEditing ? (
          <button
            type="button"
            onClick={handleBackClick}
            className={BACK_LINK_CLASS}
          >
            <AppIcon
              icon={ChevronLeft}
              size={13}
              strokeWidth={1.8}
              decorative
            />
            {listingDetailCopy.backLabel}
          </button>
        ) : (
          <Link href={listingDetailCopy.backHref} className={BACK_LINK_CLASS}>
            <AppIcon
              icon={ChevronLeft}
              size={13}
              strokeWidth={1.8}
              decorative
            />
            {listingDetailCopy.backLabel}
          </Link>
        )}

        {fetchStatus === "loading" ? (
          <DetailLoadingSkeleton />
        ) : fetchStatus === "error" || !listing ? (
          <DetailErrorState onRetry={retry} />
        ) : isEditing ? (
          <ListingEditView
            listing={listing}
            onCancel={exitEditMode}
            onSaved={handleEditSaved}
            onDirtyChange={handleEditDirtyChange}
          />
        ) : (
          <>
            <DetailHead listing={listing} />

            <div className={STICKY_HEAD_CLASS}>
              <div className="flex flex-wrap items-center justify-end gap-2 max-sm:w-full">
                <button
                  type="button"
                  onClick={enterEditMode}
                  disabled={pendingAction !== null}
                  aria-label={listingEditCopy.edit}
                  className={cn(
                    buttonClass("secondary"),
                    "justify-center gap-2 max-md:h-auto max-md:min-h-14 max-md:min-w-16 max-md:flex-col max-md:gap-1 max-md:px-2 max-md:py-1.5 md:min-w-42",
                  )}
                >
                  <AppIcon
                    icon={Pencil}
                    size={16}
                    strokeWidth={1.7}
                    decorative
                  />
                  <span className="font-mono text-meta font-medium tracking-normal leading-none md:hidden">
                    {listingEditCopy.editShort}
                  </span>
                  <span className="hidden md:inline">
                    {listingEditCopy.edit}
                  </span>
                </button>
                {buildActions(listing).map((config) => (
                  <DetailActionButton
                    key={config.action}
                    icon={config.icon}
                    label={config.label}
                    shortLabel={config.shortLabel}
                    loadingLabel={config.loadingLabel}
                    pending={pendingAction === config.action}
                    disabled={pendingAction !== null}
                    onClick={() => handleAction(config.action)}
                  />
                ))}
              </div>

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

      <ConfirmationModal
        open={pendingLeave}
        title="Änderungen verwerfen?"
        text="Du hast ungespeicherte Änderungen. Wenn du die Seite verlässt, gehen diese Änderungen verloren."
        primaryLabel="Weiter bearbeiten"
        secondaryLabel="Ohne Speichern verlassen"
        onPrimary={cancelLeave}
        onSecondary={confirmLeave}
      />
    </>
  );
}
