"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button/Button";
import { Textarea } from "@/components/ui/form/Textarea";
import { closeProviderViewingWorkflow } from "@/features/viewing-workflow/api/provider-workflow";
import { allowedCapability } from "@/features/applicant/applications/model/viewing-capability";
import type { useViewingCommands } from "@/features/viewing-workflow/present/use-viewing-commands";
import type { WorkflowCloseInput } from "@/lib/viewing-workflow/command-schema";
import type { WorkflowCapability } from "@/lib/viewing-workflow/snapshot-schema";
import { providerViewingCopy as copy } from "./copy";

type Commands = ReturnType<typeof useViewingCommands>;
type ProviderCloseReason = WorkflowCloseInput["reason"];

const REASONS = [
  "PROVIDER_ILLNESS",
  "PROVIDER_OPERATIONAL",
  "PROPERTY_UNAVAILABLE",
  "OTHER",
] as const satisfies readonly ProviderCloseReason[];

export function ProviderCloseFlow({
  applicationId,
  workflowId,
  capabilities,
  commands,
}: {
  readonly applicationId: string;
  readonly workflowId: string | null;
  readonly capabilities: readonly WorkflowCapability[];
  readonly commands: Commands;
}) {
  const close = allowedCapability(capabilities, "CLOSE_FLOW");
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ProviderCloseReason | null>(null);
  const [message, setMessage] = useState("");
  if (!close || !workflowId) return null;
  const busy = commands.pending !== null;

  if (!open) {
    return (
      <Button
        variant="dangerGhost"
        size="sm"
        disabled={busy}
        onClick={() => setOpen(true)}
      >
        {copy.close}
      </Button>
    );
  }

  const submit = () => {
    if (!reason) return;
    const trimmed = message.trim();
    void commands.run("close", (input) =>
      closeProviderViewingWorkflow(applicationId, workflowId, {
        ...input,
        reason,
        proposalId: close.target.proposalId,
        appointmentId: close.target.appointmentId,
        ...(trimmed ? { message: trimmed } : {}),
      }),
    );
  };

  return (
    <div className="flex flex-col gap-2 rounded-md border border-border px-2.5 py-3.5 sm:px-3.5">
      <p className="text-lead font-medium text-foreground">{copy.closeTitle}</p>
      <p className="text-body text-foreground-secondary">{copy.closeText}</p>
      <div
        className="flex flex-col gap-1.5"
        role="group"
        aria-label={copy.closeReasonLabel}
      >
        {REASONS.map((item) => (
          <Button
            key={item}
            variant={reason === item ? "primary" : "outline"}
            size="sm"
            disabled={busy}
            onClick={() => setReason(item)}
          >
            {copy.closeReasons[item]}
          </Button>
        ))}
      </div>
      <Textarea
        rows={2}
        maxLength={500}
        value={message}
        aria-label={copy.optionalMessage}
        onChange={(event) => setMessage(event.target.value)}
      />
      <div className="flex flex-wrap gap-2">
        <Button
          variant="ghost"
          size="sm"
          disabled={busy}
          onClick={() => setOpen(false)}
        >
          {copy.back}
        </Button>
        <Button
          variant="danger"
          size="sm"
          disabled={busy || reason === null}
          onClick={submit}
        >
          {commands.pending === "close" ? copy.sending : copy.confirmClose}
        </Button>
      </div>
    </div>
  );
}
