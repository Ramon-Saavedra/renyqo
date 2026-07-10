import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Check } from "lucide-react";
import { buttonClass, type ButtonVariant } from "@/components/ui/button/Button";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { cn } from "@/lib/utils/cn";

interface LoadingButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
> {
  variant?: ButtonVariant;
  /** Show the processing state (label swap + alignment dots + glint). */
  loading?: boolean;
  /** Label shown while loading (already localized). */
  loadingLabel?: string;
  /** Show the success state (check + success label). */
  success?: boolean;
  /** Label shown on success (already localized). */
  successLabel?: string;
  children: ReactNode;
}

type ButtonState = "idle" | "loading" | "success";

const CELL_CLASS = "col-start-1 row-start-1 flex items-center justify-center";

const SUCCESS_CLASS: Record<ButtonVariant, string> = {
  primary: "border-success bg-success text-primary-foreground",
  ghost: "border border-success text-success",
};

/**
 * Button with the Renyqo processing states — no spinner. While `loading`, the
 * label is replaced by `loadingLabel` and the alignment dots, a faint glint
 * sweeps across, and the control is disabled. On `success` a check settles in.
 * All three states are stacked in the same grid cell so the width never jumps;
 * inactive cells are `aria-hidden` so the accessible name stays stable.
 */
export function LoadingButton({
  variant = "primary",
  loading = false,
  loadingLabel,
  success = false,
  successLabel,
  className,
  type = "button",
  disabled,
  children,
  ...rest
}: LoadingButtonProps) {
  const isGhost = variant === "ghost";
  const state: ButtonState = loading ? "loading" : success ? "success" : "idle";

  return (
    <button
      type={type}
      disabled={disabled ?? loading}
      aria-busy={loading}
      className={buttonClass(
        variant,
        cn(
          "loading-btn justify-center",
          isGhost && "is-ghost",
          loading && "is-loading",
          success && SUCCESS_CLASS[variant],
          className,
        ),
      )}
      {...rest}
    >
      <span className="grid">
        <span
          className={cn(CELL_CLASS, "gap-2", state !== "idle" && "invisible")}
          aria-hidden={state !== "idle"}
        >
          {children}
        </span>
        <span
          className={cn(
            CELL_CLASS,
            "gap-2.5",
            state !== "loading" && "invisible",
          )}
          aria-hidden={state !== "loading"}
        >
          {loadingLabel}
          <span
            className={cn("align-dots", !isGhost && "align-dots-current")}
            aria-hidden="true"
          >
            <i />
            <i />
            <i />
          </span>
        </span>
        <span
          className={cn(
            CELL_CLASS,
            "gap-2",
            state !== "success" && "invisible",
          )}
          aria-hidden={state !== "success"}
        >
          <AppIcon
            icon={Check}
            size={14}
            strokeWidth={2}
            decorative
            className={success ? "rq-check" : ""}
          />
          {successLabel}
        </span>
      </span>
    </button>
  );
}

export type { LoadingButtonProps };
