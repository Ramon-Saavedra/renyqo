import type { Ref } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Check,
  CircleAlert,
  CircleCheck,
  Download,
  FileText,
  LoaderCircle,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button/Button";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { cn } from "@/lib/utils/cn";
import {
  DOCUMENT_UPLOAD_ACCEPT,
  type DocumentRequestTimeline,
} from "../../api/documents";
import type { ApplicationStatus } from "../../api/shared-schemas";
import type { WorkspaceDocumentRequest } from "../../api/workspace";
import { applicationsCopy } from "../../copy";
import type { DocumentTransfers } from "../../hooks/useDocumentTransfers";
import { documentIcon, documentLabel } from "../../model/document-labels";
import { formatDate, formatDateTime } from "../../model/format-date";
import type { Tone } from "../../model/tone";
import { ToneBadge } from "../ToneBadge";
import { WorkspaceSection } from "../WorkspaceSection";
import type { AuxiliaryLoad } from "../../hooks/useAuxiliaryLoad";
import { AuxiliaryLoadFeedback } from "./AuxiliaryLoadFeedback";

const copy = applicationsCopy.documents;

const STATE: Record<
  WorkspaceDocumentRequest["status"],
  { readonly icon: LucideIcon; readonly tone: Tone }
> = {
  UPLOAD_REQUIRED: { icon: CircleAlert, tone: "warning" },
  PROCESSING: { icon: LoaderCircle, tone: "neutral" },
  RECEIVED: { icon: Check, tone: "primary" },
  REVIEWED: { icon: CircleCheck, tone: "success" },
};

function documentSubline(
  request: WorkspaceDocumentRequest,
  timeline: DocumentRequestTimeline | undefined,
): string {
  switch (request.status) {
    case "UPLOAD_REQUIRED":
      return timeline
        ? copy.requestedAt(formatDate(timeline.requestedAt))
        : copy.requested;
    case "PROCESSING":
      return timeline?.uploadedAt
        ? copy.processingAt(formatDateTime(timeline.uploadedAt))
        : copy.processing;
    case "RECEIVED":
      return timeline?.uploadedAt
        ? copy.uploadedAt(formatDate(timeline.uploadedAt))
        : copy.uploaded;
    case "REVIEWED":
      return timeline?.reviewedAt
        ? copy.reviewedAt(formatDate(timeline.reviewedAt))
        : copy.reviewed;
  }
}

function progressLabel(requests: readonly WorkspaceDocumentRequest[]): string {
  const done = requests.filter(
    (request) => request.status !== "UPLOAD_REQUIRED",
  ).length;
  if (done < requests.length) return copy.progress(done, requests.length);
  return requests.every((request) => request.status === "REVIEWED")
    ? copy.allReviewed
    : copy.allUploaded;
}

const UPLOAD_ERROR = copy.uploadErrors;

function DocumentRow({
  request,
  timeline,
  transfers,
}: {
  readonly request: WorkspaceDocumentRequest;
  readonly timeline: DocumentRequestTimeline | undefined;
  readonly transfers: DocumentTransfers;
}) {
  const label = documentLabel(request.type, request.customLabel);
  const state = STATE[request.status];
  const required = request.status === "UPLOAD_REQUIRED";
  const uploading = transfers.uploadingId === request.requestId;
  const failure =
    transfers.uploadFailure?.requestId === request.requestId
      ? transfers.uploadFailure.reason
      : null;
  const documentId = request.canDownload ? request.documentId : null;
  const downloading =
    documentId !== null && transfers.downloadingId === documentId;

  return (
    <li className="flex flex-col items-start gap-3 border-t border-border px-3.5 sm:px-5 py-3 first:border-t-0 sm:flex-row">
      <span
        aria-hidden="true"
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-sm",
          required
            ? "bg-warning/10 text-warning"
            : "bg-background-subtle text-foreground-secondary",
        )}
      >
        <AppIcon icon={documentIcon(request.type)} size={17} decorative />
      </span>
      <div className="flex w-full min-w-0 flex-1 flex-col gap-2.5">
        <div className="flex flex-col items-start gap-2 sm:flex-row sm:flex-wrap sm:justify-between sm:gap-x-3 sm:gap-y-1.5">
          <div className="min-w-0 sm:flex-1 sm:basis-36">
            <p className="text-lead font-medium wrap-break-word text-foreground">
              {label}
            </p>
            <p className="mt-px text-caption text-foreground-secondary">
              {documentSubline(request, timeline)}
            </p>
          </div>
          <ToneBadge
            tone={state.tone}
            icon={state.icon}
            label={copy.states[request.status]}
          />
        </div>
        {request.canUpload ? (
          <div className="flex flex-col items-start gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3">
            <Button
              variant="primary"
              aria-label={copy.uploadLabel(label)}
              disabled={
                transfers.uploadingId !== null ||
                transfers.isUploadBlocked(request.requestId)
              }
              onClick={() => transfers.openPicker(request.requestId)}
            >
              <AppIcon icon={Upload} size={15} strokeWidth={2} decorative />
              {uploading ? copy.uploading : copy.upload}
            </Button>
            <span className="text-caption text-foreground-tertiary">
              {copy.allowedTypes}
            </span>
          </div>
        ) : null}
        {documentId ? (
          <Button
            variant="ghost"
            size="sm"
            className="min-h-11 self-start sm:min-h-8"
            aria-label={copy.downloadLabel(label)}
            disabled={transfers.downloadingId !== null}
            onClick={() => transfers.download(documentId)}
          >
            <AppIcon icon={Download} size={14} decorative />
            {downloading ? copy.downloading : copy.download}
          </Button>
        ) : null}
        {failure ? (
          <p role="alert" className="text-caption text-warning">
            {UPLOAD_ERROR[failure]}
          </p>
        ) : null}
        {documentId && transfers.downloadFailedId === documentId ? (
          <p role="alert" className="text-caption text-warning">
            {copy.downloadError}
          </p>
        ) : null}
      </div>
    </li>
  );
}

interface DocumentsSectionProps {
  readonly requests: readonly WorkspaceDocumentRequest[];
  readonly timelines: AuxiliaryLoad<
    ReadonlyMap<string, DocumentRequestTimeline>
  >;
  readonly status: ApplicationStatus;
  readonly transfers: DocumentTransfers;
  readonly bindFileInput: (element: HTMLInputElement | null) => void;
  readonly highlighted: boolean;
  readonly sectionRef: Ref<HTMLElement>;
  readonly className?: string | undefined;
}

export function DocumentsSection({
  requests,
  timelines,
  status,
  transfers,
  bindFileInput,
  highlighted,
  sectionRef,
  className,
}: DocumentsSectionProps) {
  const hasRequests = requests.length > 0;

  return (
    <WorkspaceSection
      icon={FileText}
      title={copy.title}
      highlighted={highlighted}
      sectionRef={sectionRef}
      className={className}
      aside={
        hasRequests ? (
          <span className="text-caption text-foreground-tertiary">
            {progressLabel(requests)}
          </span>
        ) : null
      }
    >
      {hasRequests ? (
        <>
          <p className="px-3.5 sm:px-5 pt-3 text-body text-foreground-secondary">
            {status === "ACTIVE" ? copy.introActive : copy.introClosed}
          </p>
          <ul className="pt-1.5 pb-2">
            {requests.map((request) => (
              <DocumentRow
                key={request.requestId}
                request={request}
                timeline={
                  timelines.state.status === "ready"
                    ? timelines.state.data.get(request.requestId)
                    : undefined
                }
                transfers={transfers}
              />
            ))}
          </ul>
          {timelines.state.status === "loading" ||
          timelines.state.status === "error" ? (
            <div className="px-parent-x pb-parent-y">
              <AuxiliaryLoadFeedback
                resource={timelines}
                loadingLabel={copy.detailsLoading}
                errorLabel={copy.detailsError}
                retryLabel={copy.retryDetails}
              />
            </div>
          ) : null}
          <input
            ref={bindFileInput}
            type="file"
            accept={DOCUMENT_UPLOAD_ACCEPT}
            tabIndex={-1}
            aria-hidden="true"
            className="hidden"
            onChange={transfers.onFileSelected}
          />
        </>
      ) : (
        <div className="flex items-start gap-3 px-3.5 sm:px-5 pt-4.5 pb-5">
          <AppIcon
            icon={FileText}
            size={18}
            className="mt-0.5 text-foreground-tertiary"
            decorative
          />
          <div>
            <p className="text-lead font-medium text-foreground">
              {copy.emptyTitle}
            </p>
            <p className="mt-0.5 text-body text-foreground-secondary">
              {status === "WAITING" ? copy.emptyWaiting : copy.emptyText}
            </p>
          </div>
        </div>
      )}
    </WorkspaceSection>
  );
}
