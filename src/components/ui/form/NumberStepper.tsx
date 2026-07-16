import { SAVED_FIELD_CLASS } from "./saved-field";
import { cn } from "@/lib/utils/cn";

interface NumberStepperProps {
  value: number | null;
  onChange: (value: number | null) => void;
  min?: number;
  max?: number;
  allowNull?: boolean;
  nullLabel?: string;
  ariaLabel?: string;
  saved?: boolean;
}

const GROUP_CLASS =
  "flex h-11 items-center overflow-hidden rounded-md border border-border-strong bg-input";
const BTN_CLASS =
  "grid h-full w-10.5 cursor-pointer place-items-center bg-transparent text-lg transition-colors hover:bg-background-muted disabled:cursor-not-allowed disabled:bg-transparent";
const BTN_COLOR_CLASS =
  "text-foreground-secondary hover:text-foreground disabled:text-foreground-tertiary";
const VAL_CLASS = "flex-1 text-center font-mono text-action tabular-nums";

export function NumberStepper({
  value,
  onChange,
  min = 0,
  max = 20,
  allowNull = false,
  nullLabel = "—",
  ariaLabel,
  saved = false,
}: NumberStepperProps) {
  const isNull = value === null;
  const decDisabled = isNull || (value <= min && !allowNull);
  const incDisabled = !isNull && value >= max;

  const dec = () => {
    if (isNull) return;
    if (value <= min) {
      if (allowNull) onChange(null);
      return;
    }
    onChange(value - 1);
  };
  const inc = () => {
    if (isNull) {
      onChange(min);
      return;
    }
    if (value < max) onChange(value + 1);
  };

  const display = isNull ? nullLabel : value;
  const btnClass = cn(BTN_CLASS, !saved && BTN_COLOR_CLASS);
  const valClass = cn(
    VAL_CLASS,
    !saved && (isNull ? "text-foreground-tertiary" : "text-foreground"),
  );

  return (
    <div
      className={cn(GROUP_CLASS, saved && SAVED_FIELD_CLASS)}
      role="group"
      aria-label={ariaLabel}
    >
      <button
        type="button"
        onClick={dec}
        disabled={decDisabled}
        aria-label="Wert verringern"
        className={btnClass}
      >
        −
      </button>
      <span className={valClass}>{display}</span>
      <button
        type="button"
        onClick={inc}
        disabled={incDisabled}
        aria-label="Wert erhöhen"
        className={btnClass}
      >
        +
      </button>
    </div>
  );
}
