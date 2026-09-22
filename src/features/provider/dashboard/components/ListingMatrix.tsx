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
import { Home, Maximize2, X } from "lucide-react";
import { Button } from "@/components/ui/button/Button";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import {
  formatArea,
  formatEUR,
} from "@/features/provider/listings-overview/utils/format";
import { dashboardCopy, OBJECT_STATUS_SHORT_LABEL } from "../copy/dashboard";
import { MAX_ACTIVE_APPLICATIONS } from "../types";
import type { DashboardObject, DashboardObjectStatus } from "../types";

interface ListingMatrixProps {
  objects: readonly DashboardObject[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const STATUS_DOT_CLASS: Record<DashboardObjectStatus, string> = {
  published: "bg-success",
  draft: "bg-foreground-tertiary",
  paused: "bg-warning",
  archived: "bg-border-strong",
};

const DIMMED_STATUS: readonly DashboardObjectStatus[] = ["draft", "archived"];

const GRID_CLASS =
  "scrollbar-slim flex flex-nowrap items-start gap-x-3 gap-y-4 overflow-x-scroll px-1 pt-2 pb-1";

const CELL_WIDTH_CLASS = "w-22 shrink-0 @min-[640px]:w-24";

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

function ListingThumb({ object }: { object: DashboardObject }) {
  const dimmed = DIMMED_STATUS.includes(object.status);
  return (
    <span
      className={`relative block h-16 w-full overflow-hidden rounded-md bg-media-placeholder ${dimmed ? "opacity-60" : ""}`}
    >
      {object.coverImageUrl ? (
        <Image
          src={object.coverImageUrl}
          alt=""
          aria-hidden="true"
          fill
          sizes="96px"
          className="object-cover"
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-foreground-tertiary">
          <AppIcon icon={Home} size={18} strokeWidth={1.5} decorative />
        </span>
      )}
    </span>
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
  const metaLine = `${formatEUR(object.coldRent)} · ${formatArea(object.livingArea)} · ${object.rooms} · ${object.activeApplicationsCount}/${MAX_ACTIVE_APPLICATIONS} aktiv`;
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
  selectedId,
  onSelect,
}: ListingMatrixProps) {
  const copy = dashboardCopy.matrix;
  const [openId, setOpenId] = useState<string | null>(null);
  const [orderIds, setOrderIds] = useState<readonly string[]>(() =>
    objects.map((object) => object.id),
  );
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const lastDragOverIdRef = useRef<string | null>(null);
  const suppressClickAfterDragRef = useRef(false);
  const openObject = objects.find((object) => object.id === openId) ?? null;
  const popoverRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const isCompactViewport = useIsCompactViewport();
  const [popoverPosition, setPopoverPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

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

  const orderedObjects = useMemo(() => {
    const byId = new Map(objects.map((object) => [object.id, object]));
    const objectIds = objects.map((object) => object.id);
    const objectIdSet = new Set(objectIds);
    const kept = orderIds.filter((id) => objectIdSet.has(id));
    const keptSet = new Set(kept);
    const added = objectIds.filter((id) => !keptSet.has(id));
    return [...kept, ...added]
      .map((id) => byId.get(id))
      .filter((object): object is DashboardObject => object !== undefined);
  }, [orderIds, objects]);

  function handleDragStart(event: DragEvent<HTMLDivElement>, id: string) {
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
    setOrderIds((current) => {
      const knownIds = new Set(current);
      const currentWithObjects = [
        ...current,
        ...objects.map((object) => object.id).filter((id) => !knownIds.has(id)),
      ];
      const from = currentWithObjects.indexOf(draggedId);
      const to = currentWithObjects.indexOf(overId);
      if (from === -1 || to === -1 || from === to) return current;
      const next = [...currentWithObjects];
      next.splice(from, 1);
      next.splice(to, 0, draggedId);
      return next;
    });
  }

  function handleDragEnd() {
    setDraggedId(null);
    lastDragOverIdRef.current = null;
    suppressClickAfterDragRef.current = true;
    window.setTimeout(() => {
      suppressClickAfterDragRef.current = false;
    }, 0);
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
    <div className={GRID_CLASS}>
      {orderedObjects.map((object) => {
        const selected = object.id === selectedId;
        const isOpen = object.id === openId;
        const status = OBJECT_STATUS_SHORT_LABEL[object.status];
        const popoverId = `listing-preview-${object.id}`;

        return (
          <div
            key={object.id}
            data-listing-cell={object.id}
            draggable
            onDragStart={(event) => handleDragStart(event, object.id)}
            onDragOver={(event) => handleDragOver(event, object.id)}
            onDrop={(event) => {
              event.preventDefault();
              if (draggedId) handleDragEnd();
            }}
            onDragEnd={handleDragEnd}
            className={`group relative cursor-grab active:cursor-grabbing ${CELL_WIDTH_CLASS} ${draggedId === object.id ? "opacity-40" : ""}`}
          >
            <button
              type="button"
              onClick={() => handleSelect(object.id)}
              aria-pressed={selected}
              aria-label={copy.cellAria(
                object.title,
                status,
                object.activeApplicationsCount,
                selected,
              )}
              className="block w-full cursor-pointer rounded-md text-left focus-visible:outline-none focus-visible:shadow-focus"
            >
              <span
                className={`block rounded-md ${selected ? "ring-2 ring-primary" : "ring-1 ring-border"}`}
              >
                <ListingThumb object={object} />
              </span>
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
            </button>

            <Button
              type="button"
              variant="ghost"
              size="icon-md"
              aria-haspopup="dialog"
              aria-expanded={isOpen}
              aria-controls={isOpen ? popoverId : undefined}
              aria-label={copy.previewAction(object.title)}
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
              className={`absolute -top-1.5 -right-1.5 opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100 ${isOpen ? "opacity-100" : ""}`}
            >
              <AppIcon
                icon={Maximize2}
                size={13}
                strokeWidth={2.2}
                decorative
              />
            </Button>
          </div>
        );
      })}

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
                  : { top: popoverPosition?.top, left: popoverPosition?.left }
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
  );
}
