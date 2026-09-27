import { User } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { PointerEvent as ReactPointerEvent, ReactNode } from "react";
import { createPortal } from "react-dom";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import {
  dashboardCopy,
  formatActiveApplicationsCount,
} from "../copy/dashboard";
import type {
  ListingApplicantNamesState,
  ListingApplicantPreview,
} from "../hooks/useListingApplicantNames";
import { MAX_ACTIVE_APPLICATIONS } from "../types";
import type { CandidateWarning } from "../types";

interface ListingApplicantSlotsProps {
  listingId: string;
  activeApplicationsCount: number;
  applicantsState: ListingApplicantNamesState;
  onInteraction: (listingId: string) => void;
}

const ACTIVE_ICON_CLASS = "text-success-vivid";
const INACTIVE_ICON_CLASS = "text-foreground-tertiary";
const VIEWPORT_MARGIN = 8;
const ANCHOR_GAP = 4;
const HOVER_CLOSE_DELAY_MS = 120;

const WARNING_LABEL: Record<CandidateWarning, string> = {
  smoking_by_arrangement: "Rauchen klären",
  pets_by_arrangement: "Haustiere klären",
};

const WARNING_ORDER: readonly CandidateWarning[] = [
  "smoking_by_arrangement",
  "pets_by_arrangement",
];

const CARD_CLASS =
  "fixed z-30 w-48 rounded-md border border-border bg-background p-2 shadow-card";

const INITIALS_CLASS =
  "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary-soft font-display text-caption font-semibold text-primary";

interface ApplicantPreviewController {
  openKey: string | null;
  open: (key: string) => void;
  close: (key: string) => void;
}

const ApplicantPreviewContext =
  createContext<ApplicantPreviewController | null>(null);

export function ListingApplicantPreviewProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const open = useCallback((key: string) => {
    setOpenKey(key);
  }, []);
  const close = useCallback((key: string) => {
    setOpenKey((current) => (current === key ? null : current));
  }, []);
  const value = useMemo(
    () => ({ openKey, open, close }),
    [openKey, open, close],
  );

  return (
    <ApplicantPreviewContext.Provider value={value}>
      {children}
    </ApplicantPreviewContext.Provider>
  );
}

function isHoverPointer(pointerType: string): boolean {
  return pointerType === "mouse" || pointerType === "pen";
}

function getSlotLabel(
  state: ListingApplicantNamesState,
  slotIndex: number,
): string {
  const name = state.previews[slotIndex]?.name;
  if (state.status === "loaded" && name) return name;
  if (state.status === "error") return "Name konnte nicht geladen werden";
  if (state.status === "loading") return "Name wird geladen";
  return "Bewerbername anzeigen";
}

function getSlotPreview(
  state: ListingApplicantNamesState,
  slotIndex: number,
): ListingApplicantPreview | null {
  if (state.status !== "loaded") return null;
  return state.previews[slotIndex] ?? null;
}

function ApplicantPreviewBody({
  label,
  preview,
}: {
  label: string;
  preview: ListingApplicantPreview | null;
}) {
  if (!preview) {
    return <p className="text-caption text-foreground">{label}</p>;
  }

  const warnings = WARNING_ORDER.filter((warning) =>
    preview.warnings.includes(warning),
  );
  const introduction = preview.introduction?.trim() ?? "";

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <span aria-hidden="true" className={INITIALS_CLASS}>
          {preview.initials}
        </span>
        <span className="min-w-0">
          {preview.name ? (
            <span className="block truncate text-caption font-medium text-foreground">
              {preview.name}
            </span>
          ) : null}
          <span
            className={
              preview.name
                ? "mt-0.5 block text-caption text-foreground-tertiary"
                : "block text-caption text-foreground-tertiary"
            }
          >
            {preview.household}
          </span>
        </span>
      </div>
      {warnings.length > 0 ? (
        <p className="flex flex-wrap gap-x-2 gap-y-0.5 text-caption text-warning">
          {warnings.map((warning) => (
            <span key={warning}>{WARNING_LABEL[warning]}</span>
          ))}
        </p>
      ) : null}
      {preview.activeAtLabel ? (
        <p className="text-caption text-success">
          {dashboardCopy.recentExits.activeSince} {preview.activeAtLabel}
        </p>
      ) : null}
      {introduction ? (
        <p className="line-clamp-2 text-caption text-foreground-secondary">
          {introduction}
        </p>
      ) : null}
    </div>
  );
}

function ApplicantSlot({
  listingId,
  slotIndex,
  applicantsState,
  onInteraction,
}: {
  listingId: string;
  slotIndex: number;
  applicantsState: ListingApplicantNamesState;
  onInteraction: (listingId: string) => void;
}) {
  const label = getSlotLabel(applicantsState, slotIndex);
  const preview = getSlotPreview(applicantsState, slotIndex);
  const tooltipId = useId();
  const slotKey = `${listingId}:${slotIndex}`;
  const previewContext = useContext(ApplicantPreviewContext);
  const triggerRef = useRef<HTMLSpanElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [localOpen, setLocalOpen] = useState(false);
  const isOpen = previewContext
    ? previewContext.openKey === slotKey
    : localOpen;
  const [position, setPosition] = useState<{
    left: number;
    top: number;
    maxWidth: number;
  } | null>(null);

  const clearCloseTimer = () => {
    if (closeTimerRef.current !== null) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const hide = useCallback(() => {
    if (closeTimerRef.current !== null) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setPosition(null);
    if (previewContext) previewContext.close(slotKey);
    else setLocalOpen(false);
  }, [previewContext, slotKey]);

  const show = useCallback(() => {
    if (closeTimerRef.current !== null) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    const alreadyOpen = previewContext
      ? previewContext.openKey === slotKey
      : localOpen;
    if (!alreadyOpen) setPosition(null);
    onInteraction(listingId);
    if (previewContext) previewContext.open(slotKey);
    else setLocalOpen(true);
  }, [listingId, localOpen, onInteraction, previewContext, slotKey]);

  const scheduleClose = () => {
    const trigger = triggerRef.current;
    if (
      trigger &&
      trigger === document.activeElement &&
      trigger.matches(":focus-visible")
    ) {
      return;
    }
    clearCloseTimer();
    closeTimerRef.current = setTimeout(hide, HOVER_CLOSE_DELAY_MS);
  };

  useLayoutEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      const trigger = triggerRef.current;
      const card = cardRef.current;
      if (!trigger || !card) return;
      const triggerRect = trigger.getBoundingClientRect();
      const maxWidth = Math.max(0, window.innerWidth - VIEWPORT_MARGIN * 2);
      const width = Math.min(card.offsetWidth, maxWidth);
      const height = card.offsetHeight;
      const maxLeft = Math.max(
        VIEWPORT_MARGIN,
        window.innerWidth - width - VIEWPORT_MARGIN,
      );
      const left = Math.min(
        Math.max(
          triggerRect.left + triggerRect.width / 2 - width / 2,
          VIEWPORT_MARGIN,
        ),
        maxLeft,
      );
      let top = triggerRect.bottom + ANCHOR_GAP;
      const maxTop = window.innerHeight - height - VIEWPORT_MARGIN;
      if (top > maxTop) {
        const above = triggerRect.top - height - ANCHOR_GAP;
        top =
          above >= VIEWPORT_MARGIN ? above : Math.max(VIEWPORT_MARGIN, maxTop);
      }
      setPosition((current) => {
        if (
          current &&
          current.left === left &&
          current.top === top &&
          current.maxWidth === maxWidth
        ) {
          return current;
        }
        return { left, top, maxWidth };
      });
    };

    const frame = requestAnimationFrame(updatePosition);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen, preview, label]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current !== null) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  const card =
    typeof document !== "undefined" && isOpen
      ? createPortal(
          <div
            ref={cardRef}
            id={tooltipId}
            role="tooltip"
            onMouseEnter={() => {
              if (closeTimerRef.current !== null) {
                clearTimeout(closeTimerRef.current);
                closeTimerRef.current = null;
              }
            }}
            onMouseLeave={scheduleClose}
            className={CARD_CLASS}
            style={{
              top: position?.top ?? 0,
              left: position?.left ?? 0,
              maxWidth:
                position?.maxWidth ??
                Math.max(0, window.innerWidth - VIEWPORT_MARGIN * 2),
              visibility: position ? "visible" : "hidden",
            }}
          >
            <ApplicantPreviewBody label={label} preview={preview} />
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <span
        ref={triggerRef}
        role="img"
        aria-label={label}
        tabIndex={0}
        aria-describedby={isOpen && position ? tooltipId : undefined}
        onPointerEnter={(event: ReactPointerEvent<HTMLSpanElement>) => {
          if (!isHoverPointer(event.pointerType)) return;
          show();
        }}
        onPointerLeave={(event: ReactPointerEvent<HTMLSpanElement>) => {
          if (!isHoverPointer(event.pointerType)) return;
          scheduleClose();
        }}
        onPointerDown={(event: ReactPointerEvent<HTMLSpanElement>) => {
          event.preventDefault();
        }}
        onFocus={show}
        onBlur={hide}
        onKeyDown={(event) => {
          if (event.key === "Escape") hide();
        }}
        className="relative flex h-4 w-4 shrink-0 cursor-default items-center justify-center text-foreground focus-visible:outline-none focus-visible:shadow-focus"
      >
        <span aria-hidden="true" className="absolute -inset-1" />
        <AppIcon
          icon={User}
          size={13}
          strokeWidth={1.5}
          decorative
          className={ACTIVE_ICON_CLASS}
        />
      </span>
      {card}
    </>
  );
}

export function ListingApplicantSlots({
  listingId,
  activeApplicationsCount,
  applicantsState,
  onInteraction,
}: ListingApplicantSlotsProps) {
  const activeSlots = Math.min(
    activeApplicationsCount,
    MAX_ACTIVE_APPLICATIONS,
  );

  return (
    <span
      aria-label={formatActiveApplicationsCount(activeSlots)}
      className="flex h-4 w-full min-w-0 items-center justify-between gap-0.5"
    >
      {Array.from({ length: MAX_ACTIVE_APPLICATIONS }).map((_, slotIndex) =>
        slotIndex < activeSlots ? (
          <ApplicantSlot
            key={slotIndex}
            listingId={listingId}
            slotIndex={slotIndex}
            applicantsState={applicantsState}
            onInteraction={onInteraction}
          />
        ) : (
          <span
            key={slotIndex}
            aria-hidden="true"
            className="flex h-4 w-4 shrink-0 items-center justify-center"
          >
            <AppIcon
              icon={User}
              size={13}
              strokeWidth={1.5}
              decorative
              className={INACTIVE_ICON_CLASS}
            />
          </span>
        ),
      )}
    </span>
  );
}
