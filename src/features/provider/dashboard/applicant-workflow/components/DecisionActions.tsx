import { useId, useState } from "react";
import { Button } from "@/components/ui/button/Button";
import { ConfirmationModal } from "@/components/ui/confirmation-modal/ConfirmationModal";
import { applicantWorkflowCopy } from "../copy";
import { useOptionalWorkflowSession } from "../workflow-session";

const copy = applicantWorkflowCopy.decision;

interface DecisionActionsProps {
  readonly onReject: () => void;
  readonly canReject: boolean;
  readonly canSelectForRental: boolean;
}

function TenantSelection({
  canSelectForRental,
  fullWidth,
}: {
  readonly canSelectForRental: boolean;
  readonly fullWidth: boolean;
}) {
  const session = useOptionalWorkflowSession();
  const hintId = useId();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pending = session?.selecting ?? false;

  async function confirm() {
    if (!session) return;
    const selected = await session.confirmSelectTenant();
    if (selected === "done") {
      setOpen(false);
      return;
    }
    if (selected === "failed") setError(copy.selectError);
  }

  return (
    <>
      {canSelectForRental ? null : (
        <p
          id={hintId}
          className={
            fullWidth
              ? "text-caption text-foreground-secondary"
              : "max-w-sm text-right text-caption text-pretty text-foreground-secondary"
          }
        >
          {copy.selectUnavailable}
        </p>
      )}
      <Button
        type="button"
        variant="outline"
        size={fullWidth ? "md" : "sm"}
        disabled={!canSelectForRental || !session || pending}
        aria-describedby={canSelectForRental ? undefined : hintId}
        className={fullWidth ? "w-full justify-center" : undefined}
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
      >
        {copy.selectTenant}
      </Button>
      <ConfirmationModal
        open={open}
        title={copy.selectTitle}
        text={copy.selectText}
        primaryLabel={copy.selectConfirm}
        primaryPendingLabel={copy.selectPending}
        primaryPending={pending}
        secondaryLabel={copy.selectCancel}
        onPrimary={() => void confirm()}
        onSecondary={() => {
          if (pending) return;
          setOpen(false);
        }}
        onClose={() => {
          if (pending) return;
          setOpen(false);
        }}
        closeLabel={copy.selectCancel}
        error={error}
      />
    </>
  );
}

export function DecisionBar({
  onReject,
  canReject,
  canSelectForRental,
}: DecisionActionsProps) {
  return (
    <div className="flex flex-wrap items-center gap-3.5 border-t border-border bg-background-muted px-5 py-3">
      <Button
        type="button"
        variant="danger"
        size="sm"
        onClick={onReject}
        disabled={!canReject}
      >
        {copy.reject}
      </Button>
      <span className="flex-1" />
      <TenantSelection
        canSelectForRental={canSelectForRental}
        fullWidth={false}
      />
    </div>
  );
}

export function DecisionPanel({
  onReject,
  canReject,
  canSelectForRental,
}: DecisionActionsProps) {
  const headingId = useId();

  return (
    <section
      aria-labelledby={headingId}
      className="flex flex-col gap-2 border-t border-border pt-3.5"
    >
      <h3
        id={headingId}
        className="font-display text-caption font-semibold text-foreground"
      >
        {copy.title}
      </h3>
      <TenantSelection canSelectForRental={canSelectForRental} fullWidth />
      <span aria-hidden="true" className="my-1.5 h-px bg-border" />
      <Button
        type="button"
        variant="danger"
        onClick={onReject}
        disabled={!canReject}
        className="w-full justify-center"
      >
        {copy.reject}
      </Button>
    </section>
  );
}
