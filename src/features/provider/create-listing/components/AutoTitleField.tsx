import { Input } from "@/components/ui/form/Input";
import { createListingCopy } from "../copy/create-listing";

interface AutoTitleFieldProps {
  autoTitle: string;
  isAutoPlaceholder: boolean;
  override: string;
  onOverrideChange: (value: string) => void;
}

const AUTO_BASE =
  "flex flex-col gap-1 rounded-md border border-dashed border-border-strong bg-background-subtle px-4 py-3.5 transition-opacity";
const AUTO_OVERRIDDEN = "opacity-50";

const KO_BASE =
  "flex items-center gap-2 font-mono text-meta uppercase text-foreground-tertiary";
const PIP_BASE = "h-1.25 w-1.25 rounded-full";

const GEN_BASE = "font-display text-brand font-medium text-foreground";
const GEN_PLACEHOLDER = "text-foreground-tertiary italic";
const GEN_OVERRIDDEN = "line-through decoration-foreground-tertiary";

const OVERRIDE_BASE =
  "mb-0 flex flex-col gap-2 rounded-md border bg-background px-4 py-3.5 transition-colors";
const OVERRIDE_ACTIVE = "border-primary-soft bg-primary-tint";
const OVERRIDE_IDLE = "border-border";

const OVERRIDE_LABEL_BASE = "font-mono text-meta uppercase";
const OVERRIDE_LABEL_ACTIVE = "text-primary";
const OVERRIDE_LABEL_IDLE = "text-foreground-tertiary";

export function AutoTitleField({
  autoTitle,
  isAutoPlaceholder,
  override,
  onOverrideChange,
}: AutoTitleFieldProps) {
  const copy = createListingCopy.objektdaten.fields.title;
  const overrideTrimmed = override.trim();
  const hasOverride = overrideTrimmed.length > 0;

  const autoClass = `${AUTO_BASE} ${hasOverride ? AUTO_OVERRIDDEN : ""}`.trim();
  const pipClass = `${PIP_BASE} ${hasOverride ? "bg-foreground-tertiary" : "bg-primary"}`;
  const genClass = [
    GEN_BASE,
    isAutoPlaceholder ? GEN_PLACEHOLDER : "",
    hasOverride ? GEN_OVERRIDDEN : "",
  ]
    .filter(Boolean)
    .join(" ");

  const overrideClass = `${OVERRIDE_BASE} ${hasOverride ? OVERRIDE_ACTIVE : OVERRIDE_IDLE}`;
  const overrideLabelClass = `${OVERRIDE_LABEL_BASE} ${hasOverride ? OVERRIDE_LABEL_ACTIVE : OVERRIDE_LABEL_IDLE}`;

  return (
    <div className="flex flex-col gap-3">
      <div className={autoClass}>
        <div className={KO_BASE}>
          <span aria-hidden="true" className={pipClass} />
          <span>
            {hasOverride ? copy.autoKickerOverridden : copy.autoKickerActive}
          </span>
        </div>
        <div className={genClass}>{autoTitle || copy.autoPlaceholder}</div>
      </div>
      <div className={overrideClass}>
        <div className={overrideLabelClass}>
          {hasOverride ? copy.overrideLabelActive : copy.overrideLabelIdle}
        </div>
        <Input
          value={override}
          onChange={(e) => onOverrideChange(e.target.value)}
          placeholder={copy.overridePlaceholder}
        />
        <p className="text-caption text-foreground-tertiary">
          {copy.overrideHint}
        </p>
      </div>
    </div>
  );
}
