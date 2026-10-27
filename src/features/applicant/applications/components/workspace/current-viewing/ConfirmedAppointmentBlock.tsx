import type { ViewingWorkflowProjection } from "@/lib/viewing-workflow/snapshot-schema";
import { AppointmentWhen } from "./AppointmentWhen";
import { currentViewingCopy as copy } from "./copy";

export function ConfirmedAppointmentBlock({
  appointment,
  replacementPending,
}: {
  readonly appointment: NonNullable<
    ViewingWorkflowProjection["confirmedAppointment"]
  >;
  readonly replacementPending: boolean;
}) {
  const cancelled =
    appointment.status === "CANCELLED" || appointment.cancellation !== null;
  return (
    <article
      data-appointment-id={appointment.appointmentId}
      data-proposal-id={appointment.proposalId}
      className={
        cancelled
          ? "flex flex-col gap-2 rounded-md border border-border bg-background-subtle px-3 py-3.5"
          : "flex flex-col gap-2 rounded-md border border-success/30 bg-success/10 px-3 py-3.5"
      }
    >
      <h3 className="text-caption font-semibold text-foreground">
        {cancelled ? copy.cancelled : copy.confirmed}
      </h3>
      <AppointmentWhen
        startsAt={appointment.startsAt}
        endsAt={appointment.endsAt}
        timeZone={appointment.timeZone}
      />
      {appointment.shortNotice ? (
        <p className="text-caption text-foreground-secondary">
          {copy.shortNotice}
        </p>
      ) : null}
      {replacementPending ? (
        <p className="text-body text-foreground">{copy.confirmedRemains}</p>
      ) : null}
      {appointment.cancellation?.message ? (
        <p className="text-body whitespace-pre-wrap text-foreground-secondary">
          {appointment.cancellation.message}
        </p>
      ) : null}
      {appointment.cancellation?.late ? (
        <p className="text-caption text-foreground-secondary">
          {copy.cancelledLate}
        </p>
      ) : null}
    </article>
  );
}
