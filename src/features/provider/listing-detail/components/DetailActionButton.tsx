import { cn } from "@/lib/utils/cn";

interface DetailActionButtonProps {
  label: string;
  loadingLabel: string;
  pending: boolean;
  disabled?: boolean;
  onClick: () => void;
}

const BASE_CLASS =
  "loading-btn inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-md border border-border-strong bg-transparent px-4.5 text-action font-medium text-foreground-secondary transition-colors hover:border-foreground-tertiary hover:bg-background-subtle hover:text-foreground focus-visible:outline-none focus-visible:shadow-focus disabled:cursor-not-allowed disabled:opacity-50 max-sm:flex-1";

export function DetailActionButton({
  label,
  loadingLabel,
  pending,
  disabled = false,
  onClick,
}: DetailActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || pending}
      aria-busy={pending}
      className={cn(
        BASE_CLASS,
        pending && "is-loading is-ghost cursor-progress",
      )}
    >
      <span className="grid">
        <span
          className={cn(
            "col-start-1 row-start-1 flex items-center justify-center",
            pending && "invisible",
          )}
          aria-hidden={pending}
        >
          {label}
        </span>
        <span
          className={cn(
            "col-start-1 row-start-1 flex items-center justify-center gap-2.5",
            !pending && "invisible",
          )}
          aria-hidden={!pending}
        >
          {loadingLabel}
          <span className="align-dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        </span>
      </span>
    </button>
  );
}
