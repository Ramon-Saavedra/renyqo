import { applicantProfileCopy } from "../copy/applicant-profile";

const BOX_CLASS =
  "flex flex-col gap-1 rounded-md border border-dashed border-border-strong bg-background-muted px-4 py-3.5";
const KICKER_CLASS =
  "flex items-center gap-2 font-mono text-meta uppercase text-foreground-tertiary";
const PIP_CLASS = "h-1.25 w-1.25 rounded-full bg-primary";
const VALUE_CLASS = "font-display text-heading-md font-medium text-foreground";

interface HouseholdSizeBoxProps {
  value: string;
}

export function HouseholdSizeBox({ value }: HouseholdSizeBoxProps) {
  const copy = applicantProfileCopy.household.fields.householdSize;

  return (
    <div className={BOX_CLASS}>
      <div className={KICKER_CLASS}>
        <span aria-hidden="true" className={PIP_CLASS} />
        <span>{copy.kicker}</span>
      </div>
      <div className={VALUE_CLASS} aria-live="polite">
        {value}
      </div>
    </div>
  );
}
