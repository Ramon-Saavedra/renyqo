import { cn } from "@/lib/utils/cn";
import { Input } from "@/components/ui/form/Input";
import { createListingCopy } from "../copy/create-listing";

interface AutoTitleFieldProps {
  override: string;
  onOverrideChange: (value: string) => void;
}

const OVERRIDE_BASE =
  "mb-0 flex flex-col gap-2 rounded-md border bg-background px-4 py-3.5 transition-colors";
const OVERRIDE_ACTIVE = "border-primary-soft bg-primary-tint";
const OVERRIDE_IDLE = "border-border";

const OVERRIDE_LABEL_BASE = "font-mono text-meta uppercase";
const OVERRIDE_LABEL_ACTIVE = "text-primary";
const OVERRIDE_LABEL_IDLE = "text-foreground-tertiary";

export function AutoTitleField({
  override,
  onOverrideChange,
}: AutoTitleFieldProps) {
  const copy = createListingCopy.objektdaten.fields.title;
  const hasOverride = override.trim().length > 0;

  const overrideClass = cn(
    OVERRIDE_BASE,
    hasOverride ? OVERRIDE_ACTIVE : OVERRIDE_IDLE,
  );
  const overrideLabelClass = cn(
    OVERRIDE_LABEL_BASE,
    hasOverride ? OVERRIDE_LABEL_ACTIVE : OVERRIDE_LABEL_IDLE,
  );

  return (
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
  );
}
