"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { DragEvent } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { GripVertical, Home, Maximize2, X } from "lucide-react";
import { Button } from "@/components/ui/button/Button";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import {
  formatArea,
  formatEUR,
} from "@/features/provider/listings-overview/utils/format";
import { dashboardCopy, OBJECT_STATUS_SHORT_LABEL } from "../copy/dashboard";
import { useTabRefreshRevision } from "../hooks/TabRefreshProvider";
import { useListingApplicantNames } from "../hooks/useListingApplicantNames";
import type { ListingApplicantPreview } from "../hooks/useListingApplicantNames";
import { MAX_ACTIVE_APPLICATIONS } from "../types";
import type { DashboardObject, DashboardObjectStatus } from "../types";
import {
  ListingApplicantPreviewProvider,
  ListingApplicantSlots,
} from "./ListingApplicantSlots";
import { ListingPositionControl } from "./ListingPositionControl";
import { ListingPositionDialog } from "./ListingPositionDialog";

interface ListingMatrixProps {
  objects: readonly DashboardObject[];
  orderObjects?: readonly DashboardObject[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onReorder?: (
    listingId: string,
    position: number,
  ) => Promise<void | "refresh-failed">;
  preloadedApplicants?:
    | {
        readonly listingId: string;
        readonly status: "loading";
      }
    | {
        readonly listingId: string;
        readonly status: "ready";
        readonly previews: readonly ListingApplicantPreview[];
      }
    | null;
}

const STATUS_DOT_CLASS: Record<DashboardObjectStatus, string> = {
  published: "bg-success",
  draft: "bg-foreground-tertiary",
  paused: "bg-warning",
  archived: "bg-border-strong",
};

const DIMMED_STATUS: readonly DashboardObjectStatus[] = ["draft", "archived"];

const GRID_CLASS =
  "scrollbar-slim flex flex-nowrap items-start gap-x-3 gap-y-4 overflow-x-auto px-1 pt-2 pb-1";

const CELL_WIDTH_CLASS = "w-36 shrink-0";

function moveIdToPosition(
  ids: readonly string[],
  listingId: string,
  position: number,
): string[] {
  const next = ids.filter((id) => id !== listingId);
  const index = Math.min(Math.max(position, 1), next.length + 1) - 1;
  next.splice(index, 0, listingId);
  return next;
}

function focusEnabledListingControl(trigger: HTMLElement) {
  const cell = trigger.closest("[data-listing-cell]");
  if (!(cell instanceof HTMLElement)) return;
  const preview = Array.from(
    cell.querySelectorAll<HTMLButtonElement>("button"),
  ).find(
    (button) =>
      button !== trigger && button.getAttribute("aria-haspopup") === "dialog",
  );
  preview?.focus();
}

const PREVIEW_CLOSE_BUTTON_CLASS =
  "absolute top-2 right-2 z-10 inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-sm bg-background text-foreground-secondary shadow-card hover:text-foreground";

function useIsCompactViewport(): boolean {
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 639px)");
    const update = () => setIsCompact(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return isCompact;
}

function ListingThumb({
  object,
  selected,
  label,
  onSelect,
}: {
  object: DashboardObject;
  selected: boolean;
  label: string;
  onSelect: () => void;
}) {
  const dimmed = DIMMED_STATUS.includes(object.status);
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={label}
      className={`relative block h-16 w-full cursor-pointer overflow-hidden rounded-md bg-media-placeholder focus-visible:outline-none focus-visible:shadow-focus ${dimmed ? "opacity-60" : ""}`}
    >
      {object.coverImageUrl ? (
        <Image
          src={object.coverImageUrl}
          alt=""
          aria-hidden="true"
          fill
          sizes="96px"
          draggable={false}
          className="object-cover"
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-foreground-tertiary">
          <AppIcon icon={Home} size={18} strokeWidth={1.5} decorative />
        </span>
      )}
    </button>
  );
}

interface ListingPreviewProps {
  object: DashboardObject;
  selected: boolean;
  onSelect: (id: string) => void;
  onClose: () => void;
}

function ListingPreviewContent({
  object,
  selected,
  onSelect,
  onClose,
}: ListingPreviewProps) {
  const copy = dashboardCopy.matrix;
  const status = OBJECT_STATUS_SHORT_LABEL[object.status];
  const shownActive = Math.min(
    object.activeApplicationsCount,
    MAX_ACTIVE_APPLICATIONS,
  );
  const metaLine = `${formatEUR(object.coldRent)} · ${formatArea(object.livingArea)} · ${object.rooms} · ${shownActive}/${MAX_ACTIVE_APPLICATIONS} aktiv`;
  const href = `/provider/listings/${object.id}`;

  return (
    <>
      <span
        className={`relative block aspect-video overflow-hidden rounded-md bg-media-placeholder ${DIMMED_STATUS.includes(object.status) ? "opacity-60" : ""}`}
      >
        {object.coverImageUrl ? (
          <Image
            src={object.coverImageUrl}
            alt=""
            aria-hidden="true"
            fill
            sizes="290px"
            className="object-cover"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-foreground-tertiary">
            <AppIcon icon={Home} size={24} strokeWidth={1.4} decorative />
          </span>
        )}
        <button
          type="button"
          onClick={onClose}
          aria-label={dashboardCopy.preview.close}
          className={PREVIEW_CLOSE_BUTTON_CLASS}
        >
          <AppIcon icon={X} size={16} strokeWidth={1.8} decorative />
        </button>
      </span>
      <div className="px-card-x py-card-y">
        <span className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT_CLASS[object.status]}`}
          />
          <span className="font-mono text-meta font-medium uppercase tracking-wide text-foreground-tertiary">
            {status}
          </span>
        </span>
        <p className="mt-2 text-body font-medium text-foreground text-pretty">
          {object.fullTitle}
        </p>
        <p className="mt-1 text-caption text-foreground-tertiary">
          {object.address}
        </p>
        <p className="mt-2.5 font-mono text-caption text-foreground-tertiary">
          {metaLine}
        </p>
        <div className="mt-3.5 flex flex-wrap justify-end gap-2">
          {!selected ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onSelect(object.id);
                onClose();
              }}
            >
              {copy.selectAction}
            </Button>
          ) : null}
          <Link
            href={href}
            className="flex min-h-11 items-center px-3 text-action font-medium text-primary"
          >
            {copy.openListing}
          </Link>
        </div>
      </div>
    </>
  );
}

export function ListingMatrix({
  objects,
  orderObjects,
  selectedId,
  onSelect,
  onReorder = async () => undefined,
  preloadedApplicants = null,
}: ListingMatrixProps) {
  const copy = dashboardCopy.matrix;
  const [openId, setOpenId] = useState<string | null>(null);
  const [localOrder, setLocalOrder] = useState<{
    readonly signature: string;
    readonly ids: readonly string[];
  } | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const lastDragOverIdRef = useRef<string | null>(null);
  const suppressClickAfterDragRef = useRef(false);
  const reorderInFlightRef = useRef(false);
  const positionFocusRestoreRef = useRef<HTMLElement | null>(null);
  const committedOrderIdsRef = useRef<readonly string[] | null>(null);
  const dragOrderSnapshotRef = useRef<{
    readonly signature: string;
    readonly ids: readonly string[];
  } | null>(null);
  const dragPersistStartedRef = useRef(false);
  const refreshRevision = useTabRefreshRevision();
  const openObject = objects.find((object) => object.id === openId) ?? null;
  const popoverRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const isCompactViewport = useIsCompactViewport();
  const [popoverPosition, setPopoverPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [reorderPendingId, setReorderPendingId] = useState<string | null>(null);
  const [reorderError, setReorderError] = useState<string | null>(null);
  const [reorderAnnouncement, setReorderAnnouncement] = useState("");
  const [positionObjectId, setPositionObjectId] = useState<string | null>(null);
  const [positionTrigger, setPositionTrigger] = useState<HTMLElement | null>(
    null,
  );
  const {
    ensureLoaded,
    adoptLoaded,
    holdListing,
    releaseListing,
    invalidateLoaded,
    getState: getApplicantNamesState,
  } = useListingApplicantNames();
  const authorityObjects = orderObjects ?? objects;

  useEffect(() => {
    invalidateLoaded();
  }, [invalidateLoaded, refreshRevision]);

  useEffect(() => {
    if (!preloadedApplicants) return undefined;
    if (preloadedApplicants.status === "loading") {
      holdListing(preloadedApplicants.listingId);
      return () => releaseListing(preloadedApplicants.listingId);
    }
    adoptLoaded(preloadedApplicants.listingId, preloadedApplicants.previews);
    return undefined;
  }, [adoptLoaded, holdListing, preloadedApplicants, releaseListing]);

  const closePositionDialog = useCallback(
    (restoreFocus = true) => {
      setPositionObjectId(null);
      if (!restoreFocus || !positionTrigger) return;
      if (reorderInFlightRef.current) {
        positionFocusRestoreRef.current = positionTrigger;
        focusEnabledListingControl(positionTrigger);
        return;
      }
      positionTrigger.focus();
    },
    [positionTrigger],
  );

  useEffect(() => {
    if (reorderPendingId !== null) return;
    const target = positionFocusRestoreRef.current;
    if (!target) return;
    positionFocusRestoreRef.current = null;
    if (target.isConnected && !target.hasAttribute("disabled")) target.focus();
  }, [reorderPendingId]);

  const togglePositionDialog = useCallback(
    (id: string, trigger: HTMLElement) => {
      if (positionObjectId === id) {
        closePositionDialog();
        return;
      }
      setPositionObjectId(id);
      setPositionTrigger(trigger);
    },
    [closePositionDialog, positionObjectId],
  );

  const updatePopoverPosition = useCallback(() => {
    if (!openId || isCompactViewport) return;
    const cell = Array.from(
      document.querySelectorAll<HTMLElement>("[data-listing-cell]"),
    ).find((candidate) => candidate.dataset.listingCell === openId);
    if (!cell) return;
    const rect = cell.getBoundingClientRect();
    const viewportPadding = 16;
    const previewWidth = popoverRef.current?.offsetWidth ?? 290;
    const previewHeight = popoverRef.current?.offsetHeight ?? 0;
    const maxLeft = Math.max(
      viewportPadding,
      window.innerWidth - previewWidth - viewportPadding,
    );
    const preferredTop = rect.bottom + 8;
    const maxTop = Math.max(
      viewportPadding,
      window.innerHeight - previewHeight - viewportPadding,
    );
    const top =
      previewHeight > 0 && preferredTop > maxTop
        ? Math.max(viewportPadding, rect.top - previewHeight - 8)
        : Math.min(preferredTop, maxTop);
    setPopoverPosition({
      top,
      left: Math.min(Math.max(rect.left, viewportPadding), maxLeft),
    });
  }, [openId, isCompactViewport]);

  useLayoutEffect(() => {
    if (!openId || isCompactViewport) return undefined;
    const frame = requestAnimationFrame(updatePopoverPosition);
    return () => cancelAnimationFrame(frame);
  }, [isCompactViewport, openId, updatePopoverPosition]);

  useLayoutEffect(() => {
    if (!openId || isCompactViewport) return undefined;

    window.addEventListener("resize", updatePopoverPosition);
    window.addEventListener("scroll", updatePopoverPosition, true);
    return () => {
      window.removeEventListener("resize", updatePopoverPosition);
      window.removeEventListener("scroll", updatePopoverPosition, true);
    };
  }, [isCompactViewport, openId, updatePopoverPosition]);

  const serverOrderIds = useMemo(
    () =>
      [...authorityObjects]
        .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
        .map((object) => object.id),
    [authorityObjects],
  );
  const serverOrderSignature = useMemo(
    () =>
      authorityObjects
        .map((object) => `${object.id}:${object.displayOrder ?? ""}`)
        .join("|"),
    [authorityObjects],
  );
  useEffect(() => {
    committedOrderIdsRef.current = null;
  }, [serverOrderSignature]);
  const orderIds =
    localOrder?.signature === serverOrderSignature
      ? localOrder.ids
      : serverOrderIds;

  const orderedObjects = useMemo(() => {
    const byId = new Map(authorityObjects.map((object) => [object.id, object]));
    const objectIds = authorityObjects.map((object) => object.id);
    const objectIdSet = new Set(objectIds);
    const kept = orderIds.filter((id) => objectIdSet.has(id));
    const keptSet = new Set(kept);
    const added = objectIds.filter((id) => !keptSet.has(id));
    return [...kept, ...added]
      .map((id) => byId.get(id))
      .filter((object): object is DashboardObject => object !== undefined);
  }, [authorityObjects, orderIds]);
  const visibleIds = useMemo(
    () => new Set(objects.map((object) => object.id)),
    [objects],
  );
  const orderedVisibleObjects = useMemo(
    () => orderedObjects.filter((object) => visibleIds.has(object.id)),
    [orderedObjects, visibleIds],
  );

  const positionObject =
    orderedObjects.find((object) => object.id === positionObjectId) ?? null;

  function persistReorder(listingId: string, position: number): boolean {
    if (reorderInFlightRef.current) return false;
    const listing = authorityObjects.find((object) => object.id === listingId);
    const baselineIds = committedOrderIdsRef.current ?? serverOrderIds;
    const currentPosition = baselineIds.indexOf(listingId) + 1;
    if (!listing || currentPosition <= 0 || currentPosition === position) {
      return false;
    }

    const nextIds = moveIdToPosition(baselineIds, listingId, position);
    reorderInFlightRef.current = true;
    setReorderError(null);
    setReorderPendingId(listingId);
    setLocalOrder({ signature: serverOrderSignature, ids: nextIds });
    void (async () => {
      try {
        const outcome = await onReorder(listingId, position);
        if (outcome === "refresh-failed") {
          committedOrderIdsRef.current = nextIds;
          setReorderError(
            "Die Reihenfolge wurde gespeichert, aber die Übersicht konnte nicht aktualisiert werden. Bitte versuche es gleich erneut.",
          );
          return;
        }
        setReorderAnnouncement(
          `Objekt wurde auf Position ${position} verschoben.`,
        );
      } catch {
        committedOrderIdsRef.current = null;
        setReorderError(
          "Die Objekt-Reihenfolge konnte nicht gespeichert werden. Bitte versuche es erneut.",
        );
        setLocalOrder(null);
      } finally {
        reorderInFlightRef.current = false;
        setReorderPendingId(null);
      }
    })();
    return true;
  }

  function handleDragStart(event: DragEvent<HTMLElement>, id: string) {
    if (reorderInFlightRef.current) {
      event.preventDefault();
      return;
    }
    dragPersistStartedRef.current = false;
    dragOrderSnapshotRef.current =
      localOrder?.signature === serverOrderSignature
        ? { signature: localOrder.signature, ids: [...localOrder.ids] }
        : null;
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", id);
    lastDragOverIdRef.current = null;
    setDraggedId(id);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>, overId: string) {
    event.preventDefault();
    if (
      !draggedId ||
      draggedId === overId ||
      lastDragOverIdRef.current === overId
    )
      return;
    lastDragOverIdRef.current = overId;
    setLocalOrder((current) => {
      const currentIds =
        current?.signature === serverOrderSignature
          ? current.ids
          : serverOrderIds;
      const knownIds = new Set(currentIds);
      const currentWithObjects = [
        ...currentIds,
        ...authorityObjects
          .map((object) => object.id)
          .filter((id) => !knownIds.has(id)),
      ];
      const from = currentWithObjects.indexOf(draggedId);
      const to = currentWithObjects.indexOf(overId);
      if (from === -1 || to === -1 || from === to) return current;
      const next = [...currentWithObjects];
      next.splice(from, 1);
      next.splice(to, 0, draggedId);
      return { signature: serverOrderSignature, ids: next };
    });
  }

  function handleDragEnd() {
    setDraggedId(null);
    lastDragOverIdRef.current = null;
    suppressClickAfterDragRef.current = true;
    window.setTimeout(() => {
      suppressClickAfterDragRef.current = false;
    }, 0);
    if (!dragPersistStartedRef.current) {
      setLocalOrder(dragOrderSnapshotRef.current);
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (!draggedId) return;
    const listingId = draggedId;
    const position =
      orderedObjects.findIndex((object) => object.id === listingId) + 1;
    if (position > 0 && persistReorder(listingId, position)) {
      dragPersistStartedRef.current = true;
    }
    handleDragEnd();
  }

  function handleSelect(id: string) {
    if (suppressClickAfterDragRef.current) {
      suppressClickAfterDragRef.current = false;
      return;
    }
    onSelect(id);
  }

  useEffect(() => {
    if (!openObject) return undefined;
    restoreFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const frame = requestAnimationFrame(() => {
      popoverRef.current?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenId(null);
    };
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      const insideCell =
        target instanceof Element &&
        target.closest<HTMLElement>("[data-listing-cell]")?.dataset
          .listingCell === openObject.id;
      const insidePopover =
        target instanceof Node &&
        (popoverRef.current?.contains(target) ?? false);
      if (!insideCell && !insidePopover) setOpenId(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
      restoreFocusRef.current?.focus();
    };
  }, [openObject]);

  return (
    <div className="relative">
      {reorderError ? (
        <div role="alert" className="mb-2 text-caption text-danger">
          {reorderError}
        </div>
      ) : null}
      <div aria-live="polite" className="sr-only">
        {reorderAnnouncement}
      </div>
      <ListingApplicantPreviewProvider>
        <div className={GRID_CLASS}>
          {orderedVisibleObjects.map((object) => {
            const selected = object.id === selectedId;
            const isOpen = object.id === openId;
            const status = OBJECT_STATUS_SHORT_LABEL[object.status];
            const popoverId = `listing-preview-${object.id}`;
            const selectLabel = copy.cellAria(
              object.title,
              status,
              object.activeApplicationsCount,
              selected,
            );

            return (
              <div
                key={object.id}
                data-listing-cell={object.id}
                onDragStart={(event) => {
                  const target = event.target;
                  if (!(target instanceof Element)) return;
                  if (target.closest("button[draggable]")) return;
                  if (
                    target !== event.currentTarget &&
                    target.getAttribute("data-listing-cell") !== object.id
                  ) {
                    return;
                  }
                  handleDragStart(event, object.id);
                }}
                onDragOver={(event) => handleDragOver(event, object.id)}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
                className={`group relative flex items-start gap-1 rounded-md border px-2 py-1 ${CELL_WIDTH_CLASS} ${selected ? "border-transparent shadow-card" : "border-border"} ${draggedId === object.id ? "opacity-40" : ""}`}
              >
                <div className="min-w-0 flex-1">
                  <div className="mb-1">
                    <ListingThumb
                      object={object}
                      selected={selected}
                      label={selectLabel}
                      onSelect={() => handleSelect(object.id)}
                    />
                  </div>
                  <div>
                    <span
                      className={`mt-1.5 block truncate text-caption font-medium ${selected ? "text-foreground" : "text-foreground-secondary"}`}
                    >
                      {object.title}
                    </span>
                    <span className="mt-0.5 flex items-center gap-1">
                      <span
                        aria-hidden="true"
                        className={`h-1.25 w-1.25 shrink-0 rounded-full ${STATUS_DOT_CLASS[object.status]}`}
                      />
                      <span className="truncate font-mono text-meta text-foreground-tertiary">
                        {status}
                      </span>
                    </span>
                  </div>
                  <div className="mt-1">
                    <ListingApplicantSlots
                      listingId={object.id}
                      activeApplicationsCount={object.activeApplicationsCount}
                      applicantsState={getApplicantNamesState(object.id)}
                      onInteraction={
                        object.status === "draft"
                          ? () => undefined
                          : ensureLoaded
                      }
                    />
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-center gap-1">
                  <button
                    type="button"
                    draggable
                    disabled={reorderPendingId !== null}
                    aria-label={`Position von ${object.title} per Drag-and-drop ändern`}
                    title={copy.dragHandleTitle}
                    onDragStart={(event) => {
                      event.stopPropagation();
                      handleDragStart(event, object.id);
                    }}
                    className="inline-flex h-6 w-6 shrink-0 cursor-grab items-center justify-center rounded-sm bg-transparent p-0 text-foreground-secondary hover:bg-background-muted hover:text-foreground focus-visible:outline-none focus-visible:shadow-focus active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <AppIcon
                      icon={GripVertical}
                      size={14}
                      strokeWidth={1.8}
                      decorative
                    />
                  </button>
                  <ListingPositionControl
                    object={object}
                    pending={reorderPendingId !== null}
                    open={positionObjectId === object.id}
                    dialogId={`listing-position-${object.id}`}
                    onToggle={(trigger) =>
                      togglePositionDialog(object.id, trigger)
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-2xs"
                    aria-haspopup="dialog"
                    aria-expanded={isOpen}
                    aria-controls={isOpen ? popoverId : undefined}
                    aria-label={copy.previewAction(object.title)}
                    title={copy.previewHandleTitle}
                    onClick={(event) => {
                      if (suppressClickAfterDragRef.current) {
                        suppressClickAfterDragRef.current = false;
                        return;
                      }
                      if (!isCompactViewport) {
                        const cell = event.currentTarget.closest<HTMLElement>(
                          "[data-listing-cell]",
                        );
                        if (cell) {
                          const rect = cell.getBoundingClientRect();
                          setPopoverPosition({
                            top: rect.bottom + 8,
                            left: rect.left,
                          });
                        }
                      }
                      setOpenId((current) =>
                        current === object.id ? null : object.id,
                      );
                    }}
                    className="shrink-0"
                  >
                    <AppIcon
                      icon={Maximize2}
                      size={14}
                      strokeWidth={1.8}
                      decorative
                    />
                  </Button>
                </div>
              </div>
            );
          })}

          {positionObject ? (
            <ListingPositionDialog
              object={positionObject}
              objects={orderedObjects}
              pending={reorderPendingId !== null}
              trigger={positionTrigger}
              onClose={closePositionDialog}
              onMove={(position) =>
                void persistReorder(positionObject.id, position)
              }
            />
          ) : null}

          {openObject && (isCompactViewport || popoverPosition)
            ? createPortal(
                <div
                  ref={popoverRef}
                  id={`listing-preview-${openObject.id}`}
                  role="dialog"
                  aria-label={copy.previewAction(openObject.title)}
                  tabIndex={-1}
                  className={
                    isCompactViewport
                      ? "fixed top-1/2 left-1/2 z-30 max-h-[80dvh] w-72.5 max-w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-md border border-border bg-background shadow-card"
                      : "fixed z-30 w-72.5 overflow-hidden rounded-md border border-border bg-background shadow-card"
                  }
                  style={
                    isCompactViewport
                      ? undefined
                      : {
                          top: popoverPosition?.top,
                          left: popoverPosition?.left,
                        }
                  }
                >
                  <ListingPreviewContent
                    object={openObject}
                    selected={openObject.id === selectedId}
                    onSelect={onSelect}
                    onClose={() => setOpenId(null)}
                  />
                </div>,
                document.body,
              )
            : null}
        </div>
      </ListingApplicantPreviewProvider>
    </div>
  );
}
