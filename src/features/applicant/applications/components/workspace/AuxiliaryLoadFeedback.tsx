import { Button } from "@/components/ui/button/Button";
import type { AuxiliaryLoad } from "../../hooks/useAuxiliaryLoad";

export function AuxiliaryLoadFeedback({
  resource,
  loadingLabel,
  errorLabel,
  retryLabel,
}: {
  readonly resource: AuxiliaryLoad<unknown>;
  readonly loadingLabel: string;
  readonly errorLabel: string;
  readonly retryLabel: string;
}) {
  if (resource.state.status === "loading")
    return (
      <p role="status" className="text-caption text-foreground-secondary">
        {loadingLabel}
      </p>
    );
  if (resource.state.status !== "error") return null;
  return (
    <div role="alert" className="flex flex-wrap items-center gap-2">
      <p className="text-caption text-warning">{errorLabel}</p>
      <Button variant="ghost" size="md" onClick={resource.retry}>
        {retryLabel}
      </Button>
    </div>
  );
}
