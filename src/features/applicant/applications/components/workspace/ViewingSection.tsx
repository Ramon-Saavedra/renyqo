import { useId, useState, type Ref } from "react";
import {
  Calendar,
  CalendarClock,
  Check,
  Info,
  Lock,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { Button } from "@/components/ui/button/Button";
import { Textarea } from "@/components/ui/form/Textarea";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { cn } from "@/lib/utils/cn";
import type {
  ApplicationStatus,
  ViewingSnapshot,
} from "../../api/shared-schemas";
import {
  VIEWING_CHANGE_MESSAGE_MAX_LENGTH,
  type ViewingDetail,
} from "../../api/viewings";
import { applicationsCopy } from "../../copy";
import type { ViewingActions } from "../../hooks/useViewingActions";
import {
  formatDateTime,
  formatDayOfMonth,
  formatLongDate,
  formatMonthShort,
  formatTime,
  formatTimeZoneName,
} from "../../model/format-date";
import { VIEWING_STATE, viewingStatusText } from "../../model/viewing";
import { ToneBadge } from "../ToneBadge";
import { WorkspaceSection } from "../WorkspaceSection";
import type { AuxiliaryLoad } from "../../hooks/useAuxiliaryLoad";
import { AuxiliaryLoadFeedback } from "./AuxiliaryLoadFeedback";

const copy = applicationsCopy.viewing;

type ResponseMode = "request" | "decline" | null;

function ViewingResponse({
  viewing,
  actions,
}: {
  readonly viewing: ViewingSnapshot;
  readonly actions: ViewingActions;
}) {
  const [mode, setMode] = useState<ResponseMode>(null);
  const [note, setNote] = useState("");
  const requestTitleId = useId();
  const requestFieldId = useId();
  const declineTitleId = useId();
  const { canAccept, canDecline, canRequestAnotherTime } = viewing.capabilities;
  const busy = actions.pending !== null || actions.isBlocked(viewing.viewingId);
  const failed =
    actions.failed === "accept" ||
    actions.failed === "decline" ||
    actions.failed === "request";

  if (!canAccept && !canDecline && !canRequestAnotherTime) return null;

  const close = () => {
    setMode(null);
    setNote("");
  };

  return (
    <div className="flex flex-col gap-2.5">
      {mode === null ? (
        <div className="flex flex-wrap gap-2">
          {canAccept ? (
            <Button
              variant="primary"
              disabled={busy}
              onClick={() => void actions.accept(viewing.viewingId)}
            >
              <AppIcon icon={Check} size={16} strokeWidth={2} decorative />
              {actions.pending === "accept" ? copy.pending : copy.accept}
            </Button>
          ) : null}
          {canRequestAnotherTime ? (
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => setMode("request")}
            >
              <AppIcon icon={CalendarClock} size={16} decorative />
              {copy.requestAnother}
            </Button>
          ) : null}
          {canDecline ? (
            <Button
              variant="dangerGhost"
              size="md"
              disabled={busy}
              onClick={() => setMode("decline")}
            >
              {copy.decline}
            </Button>
          ) : null}
        </div>
      ) : null}
      {mode === "request" ? (
        <div
          role="group"
          aria-labelledby={requestTitleId}
          className="flex flex-col gap-2.5 rounded-md border border-border-strong px-2.5 py-3.5 sm:px-3.5"
        >
          <div>
            <p
              id={requestTitleId}
              className="text-lead font-medium text-foreground"
            >
              {copy.requestTitle}
            </p>
            <p className="mt-0.5 text-body text-foreground-secondary">
              {copy.requestText}
            </p>
          </div>
          <label
            htmlFor={requestFieldId}
            className="text-caption font-medium text-foreground-secondary"
          >
            {copy.requestMessageLabel}
          </label>
          <Textarea
            id={requestFieldId}
            rows={2}
            value={note}
            maxLength={VIEWING_CHANGE_MESSAGE_MAX_LENGTH}
            placeholder={copy.requestPlaceholder}
            onChange={(event) => setNote(event.target.value)}
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-caption text-foreground-tertiary">
              {copy.characters(note.length, VIEWING_CHANGE_MESSAGE_MAX_LENGTH)}
            </span>
            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" size="md" disabled={busy} onClick={close}>
                {copy.cancel}
              </Button>
              <Button
                variant="primary"
                disabled={busy}
                onClick={() => {
                  void actions
                    .requestAnotherTime(viewing.viewingId, note)
                    .then((done) => {
                      if (done) close();
                    });
                }}
              >
                {actions.pending === "request"
                  ? copy.pending
                  : copy.sendRequest}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
      {mode === "decline" ? (
        <div
          role="group"
          aria-labelledby={declineTitleId}
          className="flex flex-col gap-2.5 rounded-md border border-border-strong px-2.5 py-3.5 sm:px-3.5"
        >
          <div>
            <p
              id={declineTitleId}
              className="text-lead font-medium text-foreground"
            >
              {copy.declineTitle}
            </p>
            <p className="mt-0.5 text-body text-foreground-secondary">
              {copy.declineText}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="danger"
              disabled={busy}
              onClick={() => {
                void actions.decline(viewing.viewingId).then((done) => {
                  if (done) close();
                });
              }}
            >
              {actions.pending === "decline"
                ? copy.pending
                : copy.confirmDecline}
            </Button>
            <Button variant="ghost" size="md" disabled={busy} onClick={close}>
              {copy.back}
            </Button>
          </div>
        </div>
      ) : null}
      {failed && !actions.conflict ? (
        <p role="alert" className="text-caption text-warning">
          {copy.actionError}
        </p>
      ) : null}
    </div>
  );
}

function ViewingDetails({
  viewing,
  detail,
  status,
  actions,
}: {
  readonly viewing: ViewingSnapshot;
  readonly detail: ViewingDetail | null;
  readonly status: ApplicationStatus;
  readonly actions: ViewingActions;
}) {
  const interest = viewing.postViewingInterest;
  const positive = interest?.interest === "STILL_INTERESTED";

  return (
    <div className="flex flex-col gap-4 px-3.5 sm:px-5 pt-4.5 pb-5">
      <div className="flex items-center gap-3.5">
        <div
          aria-hidden="true"
          className="w-14 shrink-0 overflow-hidden rounded-md border border-border bg-background-muted text-center"
        >
          <div className="bg-background-subtle py-0.5 text-meta font-semibold text-foreground-secondary">
            {formatMonthShort(viewing.startsAt, viewing.timeZone)}
          </div>
          <div className="pt-0.5 pb-1 font-display text-title font-semibold text-foreground">
            {formatDayOfMonth(viewing.startsAt, viewing.timeZone)}
          </div>
        </div>
        <div className="min-w-0">
          <p className="text-lead font-medium text-foreground">
            {formatLongDate(viewing.startsAt, viewing.timeZone)}
          </p>
          <p className="mt-0.5 text-body text-foreground-secondary">
            {copy.timeRange(
              formatTime(viewing.startsAt, viewing.timeZone),
              formatTime(viewing.endsAt, viewing.timeZone),
              formatTimeZoneName(viewing.startsAt, viewing.timeZone),
            )}
          </p>
        </div>
      </div>
      {detail?.providerNote ? (
        <div className="rounded-sm bg-background-subtle px-2.5 py-3 sm:px-3.5">
          <p className="mb-0.5 text-caption font-medium text-foreground-secondary">
            {copy.providerNote}
          </p>
          <p className="text-lead text-pretty whitespace-pre-wrap wrap-break-word text-foreground">
            {detail.providerNote}
          </p>
        </div>
      ) : null}
      <p className="flex items-start gap-2 text-body text-pretty text-foreground-secondary">
        <AppIcon icon={Info} size={15} className="mt-0.5" decorative />
        <span>{viewingStatusText(viewing, status)}</span>
      </p>
      {viewing.status === "CHANGE_REQUESTED" && detail?.changeRequestMessage ? (
        <div className="rounded-sm border border-border px-2.5 py-2.5 sm:px-3.5">
          <p className="mb-0.5 text-caption font-medium text-foreground-secondary">
            {copy.myNote}
          </p>
          <p className="text-lead whitespace-pre-wrap wrap-break-word text-foreground">
            {detail.changeRequestMessage}
          </p>
        </div>
      ) : null}
      {interest ? (
        <div
          className={cn(
            "flex items-start gap-2.5 rounded-sm border px-2.5 py-3 sm:px-3.5",
            positive
              ? "border-primary-soft bg-primary-tint"
              : "border-border bg-background-subtle",
          )}
        >
          <AppIcon
            icon={positive ? ThumbsUp : ThumbsDown}
            size={16}
            className={cn(
              "mt-0.5",
              positive ? "text-primary" : "text-foreground-secondary",
            )}
            decorative
          />
          <div className="min-w-0">
            <p className="text-caption text-foreground-secondary">
              {copy.interestLabel}
            </p>
            <p className="mt-px text-lead font-medium text-foreground">
              {copy.interest[interest.interest]}
            </p>
            <p className="mt-0.5 flex items-center gap-1 text-caption text-foreground-tertiary">
              <AppIcon icon={Lock} size={12} decorative />
              {copy.interestSent(formatDateTime(interest.respondedAt))}
            </p>
          </div>
        </div>
      ) : null}
      <ViewingResponse
        key={`${viewing.viewingId}:${viewing.status}`}
        viewing={viewing}
        actions={actions}
      />
    </div>
  );
}

interface ViewingSectionProps {
  readonly viewing: ViewingSnapshot | null;
  readonly detail: AuxiliaryLoad<ViewingDetail | null>;
  readonly status: ApplicationStatus;
  readonly actions: ViewingActions;
  readonly highlighted: boolean;
  readonly sectionRef: Ref<HTMLElement>;
  readonly className?: string | undefined;
}

export function ViewingSection({
  viewing,
  detail,
  status,
  actions,
  highlighted,
  sectionRef,
  className,
}: ViewingSectionProps) {
  const state = viewing ? VIEWING_STATE[viewing.status] : null;

  return (
    <WorkspaceSection
      icon={Calendar}
      title={copy.title}
      highlighted={highlighted}
      sectionRef={sectionRef}
      className={className}
      aside={
        state ? (
          <ToneBadge tone={state.tone} icon={state.icon} label={state.label} />
        ) : null
      }
    >
      {actions.conflict ? (
        <p
          role="alert"
          className="px-parent-x pt-parent-y text-caption text-warning"
        >
          {copy.conflict}
        </p>
      ) : null}
      {viewing ? (
        <>
          {detail.state.status === "loading" ||
          detail.state.status === "error" ? (
            <div className="px-parent-x pt-parent-y">
              <AuxiliaryLoadFeedback
                resource={detail}
                loadingLabel={copy.detailsLoading}
                errorLabel={copy.detailsError}
                retryLabel={copy.retryDetails}
              />
            </div>
          ) : null}
          <ViewingDetails
            viewing={viewing}
            detail={detail.state.status === "ready" ? detail.state.data : null}
            status={status}
            actions={actions}
          />
        </>
      ) : (
        <div className="flex items-start gap-3 px-3.5 sm:px-5 pt-4.5 pb-5">
          <AppIcon
            icon={Calendar}
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
