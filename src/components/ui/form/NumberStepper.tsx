interface NumberStepperProps {
  value: number | null;
  onChange: (value: number | null) => void;
  min?: number;
  max?: number;
  allowNull?: boolean;
  nullLabel?: string;
  ariaLabel?: string;
}

const GROUP_CLASS =
  "flex h-11 items-center overflow-hidden rounded-md border border-border-strong bg-input";
const BTN_CLASS =
  "grid h-full w-10.5 cursor-pointer place-items-center bg-transparent text-lg text-foreground-secondary transition-colors hover:bg-background-muted hover:text-foreground disabled:cursor-not-allowed disabled:bg-transparent disabled:text-foreground-tertiary";
const VAL_CLASS =
  "flex-1 text-center font-mono text-action tabular-nums text-foreground";

export function NumberStepper({
  value,
  onChange,
  min = 0,
  max = 20,
  allowNull = false,
  nullLabel = "—",
  ariaLabel,
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
  const valClass = isNull ? `${VAL_CLASS} text-foreground-tertiary` : VAL_CLASS;

  return (
    <div className={GROUP_CLASS} role="group" aria-label={ariaLabel}>
      <button
        type="button"
        onClick={dec}
        disabled={decDisabled}
        aria-label="Wert verringern"
        className={BTN_CLASS}
      >
        −
      </button>
      <span className={valClass}>{display}</span>
      <button
        type="button"
        onClick={inc}
        disabled={incDisabled}
        aria-label="Wert erhöhen"
        className={BTN_CLASS}
      >
        +
      </button>
    </div>
  );
}
