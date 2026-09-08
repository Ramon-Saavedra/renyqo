"use client";

import { useEffect, useId, useRef, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button/Button";
import { FieldError } from "@/components/ui/form/FieldError";
import { FormField } from "@/components/ui/form/FormField";
import { Textarea } from "@/components/ui/form/Textarea";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import {
  LISTING_REPORT_DETAIL_MAX,
  LISTING_REPORT_REASONS,
  type ListingReportReason,
} from "../../api/listing-report";
import { listingDetailCopy } from "../../copy/listing-detail";

interface ListingReportDialogProps {
  open: boolean;
  pending: boolean;
  error: string | null;
  validationCode:
    | "detail-required"
    | "detail-too-long"
    | "reason-required"
    | null;
  onClose: () => void;
  onSubmit: (reason: ListingReportReason | null, detail: string) => void;
  onReasonSelected: () => void;
  onDetailEdited: (reason: ListingReportReason, detail: string) => void;
}

const OVERLAY_CLASS =
  "fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 px-gutter";
const PANEL_CLASS =
  "relative max-h-full min-h-0 w-full max-w-md overflow-y-auto rounded-md border border-border bg-background p-5 shadow-card scrollbar-slim";
const CLOSE_BUTTON_CLASS = "absolute right-3 top-3";
const TITLE_CLASS = "pr-8 text-title font-medium text-foreground";
const LEAD_CLASS = "mt-2 text-caption text-foreground-secondary";
const REASONS_CLASS = "mt-4 flex flex-col gap-1";
const REASON_CLASS =
  "flex cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 text-caption text-foreground hover:bg-background-muted";
const RADIO_WRAP_CLASS = "relative mt-0.5 inline-flex h-4 w-4 shrink-0";
const RADIO_CLASS =
  "peer absolute inset-0 h-4 w-4 cursor-pointer appearance-none rounded-full border border-border-strong bg-background hover:border-foreground-tertiary checked:border-primary checked:bg-primary focus-visible:outline-none focus-visible:shadow-focus disabled:cursor-not-allowed disabled:opacity-50";
const RADIO_MARK_CLASS =
  "pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 peer-checked:opacity-100";
const RADIO_DOT_CLASS = "h-1.5 w-1.5 rounded-full bg-primary-foreground";
const ACTIONS_CLASS = "mt-4 flex flex-wrap justify-end gap-2";
const ERROR_CLASS = "mt-3 text-caption text-danger";
const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const { report } = listingDetailCopy;

function getFocusableElements(dialog: HTMLElement): HTMLElement[] {
  return Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
}

function validationMessage(
  code: ListingReportDialogProps["validationCode"],
): string | null {
  if (code === "reason-required") return report.reasonRequired;
  if (code === "detail-required") return report.detailRequired;
  if (code === "detail-too-long") return report.detailTooLong;
  return null;
}

export function ListingReportDialog({
  open,
  pending,
  error,
  validationCode,
  onClose,
  onSubmit,
  onReasonSelected,
  onDetailEdited,
}: ListingReportDialogProps) {
  const titleId = useId();
  const leadId = useId();
  const reasonsName = useId();
  const reasonErrorId = useId();
  const detailId = useId();
  const detailErrorId = useId();
  const overlayRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const wasOpenRef = useRef(false);
  const [reason, setReason] = useState<ListingReportReason | null>(null);
  const [detail, setDetail] = useState("");

  useEffect(() => {
    if (open) {
      if (!wasOpenRef.current) {
        const activeElement = document.activeElement;
        restoreFocusRef.current =
          activeElement instanceof HTMLElement ? activeElement : null;
        wasOpenRef.current = true;
        setReason(null);
        setDetail("");
      }

      const dialog = dialogRef.current;
      const firstFocusable = dialog
        ? getFocusableElements(dialog)[0]
        : undefined;
      (firstFocusable ?? dialog)?.focus();
      return;
    }

    if (!wasOpenRef.current) return;
    const elementToRestore = restoreFocusRef.current;
    restoreFocusRef.current = null;
    wasOpenRef.current = false;
    if (elementToRestore?.isConnected) elementToRestore.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (!pending) onClose();
        return;
      }
      if (event.key !== "Tab") return;

      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusable = getFocusableElements(dialog);
      if (focusable.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      const activeElement = document.activeElement;

      if (event.shiftKey) {
        if (
          activeElement === first ||
          activeElement === dialog ||
          !dialog.contains(activeElement)
        ) {
          event.preventDefault();
          last.focus();
        }
      } else if (
        activeElement === last ||
        activeElement === dialog ||
        !dialog.contains(activeElement)
      ) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open, pending]);

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const root = overlayRef.current;
    if (!root) return undefined;

    const madeInert: HTMLElement[] = [];
    let current: HTMLElement = root;
    for (;;) {
      const parent = current.parentElement;
      if (parent === null) break;
      for (const child of Array.from(parent.children)) {
        if (child === current || !(child instanceof HTMLElement)) continue;
        if (child.hasAttribute("inert")) continue;
        child.setAttribute("inert", "");
        madeInert.push(child);
      }
      if (parent === document.body) break;
      current = parent;
    }

    return () => {
      for (const element of madeInert) {
        element.removeAttribute("inert");
      }
    };
  }, [open]);

  if (!open) return null;

  const showDetail = reason !== null;
  const detailRequired = reason === "OTHER";
  const fieldMessage = validationMessage(validationCode);
  const reasonInvalid = validationCode === "reason-required";
  const detailInvalid =
    validationCode === "detail-required" ||
    validationCode === "detail-too-long";

  return (
    <div
      ref={overlayRef}
      className={OVERLAY_CLASS}
      role="presentation"
      onClick={() => {
        if (!pending) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={leadId}
        tabIndex={-1}
        className={PANEL_CLASS}
        onClick={(event) => event.stopPropagation()}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className={CLOSE_BUTTON_CLASS}
          onClick={onClose}
          disabled={pending}
          aria-label={report.close}
        >
          <AppIcon icon={X} size={16} strokeWidth={1.7} decorative />
        </Button>

        <h2 id={titleId} className={TITLE_CLASS}>
          {report.title}
        </h2>
        <p id={leadId} className={LEAD_CLASS}>
          {report.lead}
        </p>

        <fieldset
          role="radiogroup"
          className={REASONS_CLASS}
          aria-required="true"
          aria-invalid={reasonInvalid || undefined}
          {...(reasonInvalid ? { "aria-errormessage": reasonErrorId } : {})}
        >
          <legend className="mb-1 text-caption font-medium text-foreground">
            {report.reasonsLabel}
          </legend>
          {LISTING_REPORT_REASONS.map((value) => {
            const reasonId = `${reasonsName}-${value}`;
            return (
              <label key={value} htmlFor={reasonId} className={REASON_CLASS}>
                <span className={RADIO_WRAP_CLASS}>
                  <input
                    id={reasonId}
                    type="radio"
                    name={reasonsName}
                    value={value}
                    checked={reason === value}
                    disabled={pending}
                    onChange={() => {
                      setReason(value);
                      onReasonSelected();
                      onDetailEdited(value, detail);
                    }}
                    className={RADIO_CLASS}
                  />
                  <span aria-hidden="true" className={RADIO_MARK_CLASS}>
                    <span className={RADIO_DOT_CLASS} />
                  </span>
                </span>
                <span>{report.reasons[value]}</span>
              </label>
            );
          })}
        </fieldset>

        {showDetail ? (
          <FormField
            className="mt-4"
            label={report.detailLabel}
            htmlFor={detailId}
            required={detailRequired}
            hint={
              detailRequired ? report.detailRequiredHint : report.detailHint
            }
          >
            <Textarea
              id={detailId}
              value={detail}
              maxLength={LISTING_REPORT_DETAIL_MAX}
              disabled={pending}
              aria-invalid={detailInvalid || undefined}
              {...(detailInvalid ? { "aria-errormessage": detailErrorId } : {})}
              onChange={(event) => {
                const nextDetail = event.target.value;
                setDetail(nextDetail);
                onDetailEdited(reason, nextDetail);
              }}
            />
            {detailInvalid && fieldMessage ? (
              <FieldError id={detailErrorId} message={fieldMessage} />
            ) : null}
          </FormField>
        ) : null}

        {reasonInvalid ? (
          <p id={reasonErrorId} role="alert" className={ERROR_CLASS}>
            {report.reasonRequired}
          </p>
        ) : null}
        {error ? (
          <p role="alert" className={ERROR_CLASS}>
            {error}
          </p>
        ) : null}

        <div className={ACTIONS_CLASS}>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={pending}
          >
            {report.cancel}
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={pending}
            onClick={() => onSubmit(reason, detail)}
          >
            {pending ? report.submitting : report.submit}
          </Button>
        </div>
      </div>
    </div>
  );
}
