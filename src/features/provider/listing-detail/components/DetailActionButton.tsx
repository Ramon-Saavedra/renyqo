import { buttonClass } from "@/components/ui/button/Button";
import { cn } from "@/lib/utils/cn";

interface DetailActionButtonProps {
  label: string;
  loadingLabel: string;
  pending: boolean;
  disabled?: boolean;
  onClick: () => void;
}

const BASE_CLASS = "loading-btn min-w-42 justify-center max-sm:flex-1";

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
        buttonClass("secondary"),
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
