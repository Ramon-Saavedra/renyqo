import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button/Button";
import { ConfirmationModal } from "@/components/ui/confirmation-modal/ConfirmationModal";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { cn } from "@/lib/utils/cn";
import { applicantWorkflowCopy } from "../copy";
import {
  DOCUMENT_TYPE_LABEL,
  availableDocumentTypes,
  isActiveCustomLabel,
  normalizeCustomLabel,
  type DocumentRequestType,
} from "../document-labels";
import type { DocumentRequestInput } from "../api/documents";
import { useOptionalWorkflowSession } from "../workflow-session";
import type { ApplicantWorkflowModel } from "../workflow-model";
import { WorkflowSection } from "./WorkflowSection";

const copy = applicantWorkflowCopy.documents;

const DOCUMENT_OPTION_TONE: Record<
  DocumentRequestType,
  { readonly idle: string; readonly selected: string }
> = {
  SCHUFA: {
    idle: "border-primary/25 bg-primary/10 hover:border-primary/45 hover:bg-primary/15 dark:border-primary/45 dark:bg-primary/25 dark:hover:bg-primary/35",
    selected: "border-primary bg-primary/20 dark:bg-primary/40",
  },
  INCOME_PROOF: {
    idle: "border-success/30 bg-success/10 hover:border-success/50 hover:bg-success/15 dark:bg-success/20 dark:hover:bg-success/30",
    selected: "border-success bg-success/20 dark:bg-success/35",
  },
  IDENTITY_DOCUMENT: {
    idle: "border-exit-provider-discarded-fg/30 bg-exit-provider-discarded-bg/50 hover:border-exit-provider-discarded-fg/50 hover:bg-exit-provider-discarded-bg/65 dark:border-exit-provider-discarded-fg/45 dark:bg-exit-provider-discarded-fg/15 dark:hover:bg-exit-provider-discarded-fg/25",
    selected:
      "border-exit-provider-discarded-fg bg-exit-provider-discarded-bg dark:bg-exit-provider-discarded-fg/30",
  },
  LIABILITY_INSURANCE: {
    idle: "border-warning/30 bg-warning/10 hover:border-warning/50 hover:bg-warning/15 dark:bg-warning/20 dark:hover:bg-warning/30",
    selected: "border-warning bg-warning/20 dark:bg-warning/35",
  },
  OTHER: {
    idle: "border-queue-4/30 bg-queue-4/10 hover:border-queue-4/50 hover:bg-queue-4/15 dark:bg-queue-4/22 dark:hover:bg-queue-4/32",
    selected: "border-queue-4 bg-queue-4/20 dark:bg-queue-4/40",
  },
};

function CancelRequestButton({
  label,
  onClick,
}: {
  readonly label: string;
  readonly onClick: () => void;
}) {
  const tooltipId = useId();
  const triggerRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  useLayoutEffect(() => {
    if (!open) return;
    const update = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPosition({ top: rect.bottom + 4, left: rect.right });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open]);

  const tooltip =
    open && position
      ? createPortal(
          <span
            id={tooltipId}
            role="tooltip"
            className="pointer-events-none fixed z-50 -translate-x-full rounded-sm border border-border-strong bg-background px-2 py-1 text-caption whitespace-nowrap text-foreground"
            style={{ top: position.top, left: position.left }}
          >
            {copy.cancel}
          </span>,
          document.body,
        )
      : null;

  return (
    <>
      <span
        ref={triggerRef}
        className="shrink-0"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        <Button
          type="button"
          variant="dangerGhost"
          size="icon-xs"
          className="group focus-visible:bg-danger/10"
          aria-label={`${copy.cancel}: ${label}`}
          aria-describedby={open && position ? tooltipId : undefined}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={(event) => {
            if (event.key === "Escape") setOpen(false);
          }}
          onClick={onClick}
        >
          <span className="text-danger/70 group-hover:text-danger group-focus-visible:text-danger">
            <AppIcon icon={X} size={14} strokeWidth={1.75} decorative />
          </span>
        </Button>
      </span>
      {tooltip}
    </>
  );
}

function DocumentRows({
  model,
  sectionRef,
}: {
  readonly model: ApplicantWorkflowModel;
  readonly sectionRef: RefObject<HTMLDivElement | null>;
}) {
  const session = useOptionalWorkflowSession();
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pendingFocus = useRef(false);
  const confirming = model.documents.find(
    (document) => document.requestId === confirmId,
  );

  useEffect(() => {
    if (!pendingFocus.current) return;
    if (confirming) return;
    pendingFocus.current = false;
    sectionRef.current?.focus();
  }, [confirming, model.documents, sectionRef]);

  if (model.documents.length === 0) {
    return (
      <p className="text-caption text-foreground-secondary">{copy.empty}</p>
    );
  }
  return (
    <>
      <ul className="flex flex-col gap-2">
        {model.documents.map((document) => (
          <li
            key={document.requestId}
            className="flex items-start gap-2 text-caption"
          >
            <span className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="font-medium text-foreground">
                {document.label}
              </span>
              <span className="text-foreground-secondary">
                {document.statusLabel}
              </span>
              {session &&
              ((document.canDownload && document.documentId) ||
                (document.canReview && document.documentId) ||
                document.canRequestReplacement) ? (
            <span className="mt-0.5 flex flex-wrap gap-2">
              {session && document.canDownload && document.documentId ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={session.acting}
                  onClick={() => {
                    const documentId = document.documentId;
                    if (documentId) void session.openDocument(documentId);
                  }}
                >
                  {copy.open}
                </Button>
              ) : null}
              {session && document.canReview && document.documentId ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={session.acting}
                  onClick={() => {
                    const documentId = document.documentId;
                    if (documentId) void session.review(documentId);
                  }}
                >
                  {copy.review}
                </Button>
              ) : null}
              {session && document.canRequestReplacement ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={session.acting}
                  onClick={() => void session.replaceRequest(document.requestId)}
                >
                  {copy.replace}
                </Button>
              ) : null}
              </span>
            ) : null}
            </span>
            {session && document.canCancel ? (
              <CancelRequestButton
                label={document.label}
                onClick={() => {
                  setError(null);
                  setConfirmId(document.requestId);
                }}
              />
            ) : null}
          </li>
        ))}
      </ul>
      <ConfirmationModal
        open={confirming !== undefined}
        title={copy.cancelTitle}
        text={confirming ? copy.cancelText(confirming.label) : ""}
        primaryLabel={copy.cancelConfirm}
        primaryAriaLabel={copy.cancel}
        primaryPendingLabel={copy.cancelPending}
        primaryPending={session?.cancelling ?? false}
        secondaryLabel={copy.cancelDismiss}
        closeLabel={copy.cancelClose}
        error={error}
        icon={X}
        focusFallbackRef={sectionRef}
        onPrimary={() => {
          if (!session || !confirming) return;
          void session.cancelRequest(confirming.requestId).then((result) => {
            if (result === "busy") return;
            if (result === "failed") {
              setError(copy.cancelError);
              return;
            }
            pendingFocus.current = true;
            setConfirmId(null);
          });
        }}
        onSecondary={() => {
          if (session?.cancelling) return;
          setConfirmId(null);
        }}
        onClose={() => {
          if (session?.cancelling) return;
          setConfirmId(null);
        }}
      />
    </>
  );
}

function RequestControl({
  model,
}: {
  readonly model: ApplicantWorkflowModel;
}) {
  const session = useOptionalWorkflowSession();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [otherLabel, setOtherLabel] = useState("");
  const [labelIssue, setLabelIssue] = useState<"invalid" | "duplicate" | null>(
    null,
  );
  const [pending, setPending] = useState(false);
  const unavailableTypes = model.documents
    .filter((document) => document.type !== "OTHER")
    .map((document) => document.type)
    .join("\n");
  const offeredTypes = availableDocumentTypes(model.documents);
  const [trackedUnavailable, setTrackedUnavailable] = useState(unavailableTypes);
  if (unavailableTypes !== trackedUnavailable) {
    setTrackedUnavailable(unavailableTypes);
    const blocked = new Set(unavailableTypes.split("\n").filter(Boolean));
    setSelected((current) => {
      const next = new Set([...current].filter((type) => !blocked.has(type)));
      return next.size === current.size ? current : next;
    });
  }

  if (!session || !model.canRequestDocuments) return null;

  function toggle(type: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
    setLabelIssue(null);
  }

  async function submit() {
    if (pending || selected.size === 0) return;
    const inputs: DocumentRequestInput[] = [];
    for (const type of offeredTypes) {
      if (!selected.has(type)) continue;
      if (type === "OTHER") {
        const customLabel = normalizeCustomLabel(otherLabel);
        if (!customLabel) {
          setLabelIssue("invalid");
          return;
        }
        if (isActiveCustomLabel(model.documents, customLabel)) {
          setLabelIssue("duplicate");
          return;
        }
        inputs.push({ type: "OTHER", customLabel });
      } else {
        inputs.push({ type });
      }
    }
    if (inputs.length === 0 || !session) return;
    setPending(true);
    const result = await session.requestDocuments(inputs);
    setPending(false);
    if (result !== "done") return;
    setOpen(false);
    setSelected(new Set());
    setOtherLabel("");
    setLabelIssue(null);
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="self-start"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        {model.documents.length === 0 ? copy.request : copy.requestMore}
      </Button>
      {open ? (
        <fieldset className="flex flex-col gap-2">
          <legend className="text-caption text-foreground-secondary">
            {copy.typesLabel}
          </legend>
          {offeredTypes.map((type) => {
            const checked = selected.has(type);
            const tone = DOCUMENT_OPTION_TONE[type];
            return (
              <label
                key={type}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-md border px-2.5 py-1.5 text-caption text-foreground has-[:focus-visible]:shadow-focus",
                  checked ? tone.selected : tone.idle,
                )}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(type)}
                  className="focus-visible:shadow-focus focus-visible:outline-none"
                />
                {DOCUMENT_TYPE_LABEL[type]}
              </label>
            );
          })}
          {selected.has("OTHER") ? (
            <label className="flex flex-col gap-1 text-caption text-foreground">
              {copy.otherLabel}
              <input
                type="text"
                value={otherLabel}
                maxLength={100}
                onChange={(event) => {
                  setOtherLabel(event.target.value);
                  setLabelIssue(null);
                }}
                className="h-8.5 rounded-md border border-border-strong bg-input px-2.5 text-caption"
              />
            </label>
          ) : null}
          {labelIssue ? (
            <p role="alert" className="text-caption text-foreground-secondary">
              {labelIssue === "duplicate" ? copy.otherDuplicate : copy.otherInvalid}
            </p>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="self-start"
            disabled={pending || session.acting || selected.size === 0}
            onClick={() => void submit()}
          >
            {pending ? copy.requestPending : copy.request}
          </Button>
        </fieldset>
      ) : null}
    </div>
  );
}

function DocumentsBody({
  model,
}: {
  readonly model: ApplicantWorkflowModel;
}) {
  const session = useOptionalWorkflowSession();
  const sectionRef = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={sectionRef}
      tabIndex={-1}
      className="flex flex-col gap-2.5 outline-none focus-visible:shadow-focus"
    >
      <DocumentRows model={model} sectionRef={sectionRef} />
      {session?.actionArea === "documents" && session.actionError ? (
        <p role="alert" className="text-caption text-foreground-secondary">
          {session.actionError}
        </p>
      ) : null}
      <RequestControl model={model} />
    </div>
  );
}

export function DocumentsSection({
  model,
}: {
  readonly model: ApplicantWorkflowModel;
}) {
  return (
    <WorkflowSection
      icon={FileText}
      title={copy.title}
      aside={
        <span className="text-caption text-foreground-secondary">
          {model.summaries.documents.value}
        </span>
      }
    >
      <div className="px-3.5 py-3">
        <DocumentsBody model={model} />
      </div>
    </WorkflowSection>
  );
}

export function DocumentsPanel({
  model,
}: {
  readonly model: ApplicantWorkflowModel;
}) {
  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex justify-between text-caption text-foreground-secondary">
        <span>{copy.title}</span>
        <span>{model.summaries.documents.value}</span>
      </div>
      <DocumentsBody model={model} />
    </div>
  );
}
