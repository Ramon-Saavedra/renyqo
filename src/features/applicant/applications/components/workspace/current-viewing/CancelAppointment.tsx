import { useState } from "react";
import { Button } from "@/components/ui/button/Button";
import { Textarea } from "@/components/ui/form/Textarea";
import { cancelApplicantAppointment } from "@/features/viewing-workflow/api/applicant-workflow";
import { allowedCapability } from "../../../model/viewing-capability";
import type { WorkflowCapability } from "@/lib/viewing-workflow/snapshot-schema";
import { currentViewingCopy as copy } from "./copy";
import type { useApplicantViewingCommands } from "./useApplicantViewingCommands";

export function CancelAppointment({
  applicationId,
  capabilities,
  commands,
}: {
  readonly applicationId: string;
  readonly capabilities: readonly WorkflowCapability[];
  readonly commands: ReturnType<typeof useApplicantViewingCommands>;
}) {
  const cancel = allowedCapability(capabilities, "CANCEL_APPOINTMENT");
  const appointmentId = cancel?.target.appointmentId ?? null;
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  if (!appointmentId) return null;
  const busy = commands.pending !== null;

  return open ? (
    <div className="flex flex-col gap-2.5 rounded-md border border-border-strong px-2.5 py-3.5 sm:px-3.5">
      <p className="text-lead font-medium text-foreground">
        {copy.cancelTitle}
      </p>
      <p className="text-body text-foreground-secondary">{copy.cancelText}</p>
      <label className="flex flex-col gap-1 text-caption font-medium text-foreground-secondary">
        {copy.cancelMessage}
        <Textarea
          rows={2}
          maxLength={500}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="danger"
          disabled={busy}
          onClick={() => {
            const trimmed = message.trim();
            void commands
              .run("cancel", (input) =>
                cancelApplicantAppointment(applicationId, appointmentId, {
                  ...input,
                  ...(trimmed ? { message: trimmed } : {}),
                }),
              )
              .then((status) => {
                if (status === "success") setOpen(false);
              });
          }}
        >
          {commands.pending === "cancel" ? copy.sending : copy.confirmCancel}
        </Button>
        <Button
          variant="ghost"
          size="md"
          disabled={busy}
          onClick={() => setOpen(false)}
        >
          {copy.back}
        </Button>
      </div>
    </div>
  ) : (
    <Button variant="outline" disabled={busy} onClick={() => setOpen(true)}>
      {copy.cancelAppointment}
    </Button>
  );
}
