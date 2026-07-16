import { type LucideIcon } from "lucide-react";
import { buttonClass } from "@/components/ui/button/Button";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { cn } from "@/lib/utils/cn";

interface DetailActionButtonProps {
  icon: LucideIcon;
  label: string;
  shortLabel: string;
  loadingLabel: string;
  pending: boolean;
  disabled?: boolean;
  onClick: () => void;
}

const BASE_CLASS =
  "loading-btn justify-center gap-2 max-md:h-auto max-md:min-h-14 max-md:min-w-16 max-md:flex-col max-md:gap-1 max-md:px-2 max-md:py-1.5 md:min-w-42";

const SHORT_LABEL_CLASS =
  "font-mono text-meta font-medium tracking-normal leading-none md:hidden";

export function DetailActionButton({
  icon,
  label,
  shortLabel,
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
      aria-label={pending ? loadingLabel : label}
      className={cn(
        buttonClass("secondary"),
        BASE_CLASS,
        pending && "is-loading is-ghost cursor-progress",
      )}
    >
      <AppIcon icon={icon} size={16} strokeWidth={1.7} decorative />
      <span className={SHORT_LABEL_CLASS}>{shortLabel}</span>
      <span className="hidden items-center gap-2.5 md:inline-flex">
        {pending ? (
          <>
            {loadingLabel}
            <span className="align-dots" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
          </>
        ) : (
          label
        )}
      </span>
    </button>
  );
}
