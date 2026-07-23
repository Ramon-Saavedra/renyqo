import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import {
  PET_POLICY_LABEL,
  SMOKING_POLICY_LABEL,
  listingDetailCopy,
} from "../copy/listing-detail";
import type { ListingDetail } from "../types";
import { formatEUR } from "../utils/format";
import { DetailCard } from "./DetailCard";

interface RequirementsCardProps {
  listing: ListingDetail;
  className?: string;
}

interface Requirement {
  readonly label: string;
  readonly value: ReactNode;
}

const LIST_CLASS = "grid list-none grid-cols-1 gap-x-5 gap-y-3 sm:grid-cols-2";
const ITEM_CLASS =
  "flex items-center justify-between gap-3 border-b border-border pb-3 text-caption";
const KEY_CLASS = "text-foreground-tertiary";
const VALUE_CLASS =
  "inline-flex items-center gap-1.5 text-right font-medium text-foreground";

const { requirements } = listingDetailCopy;

function requiredValue(required: boolean): ReactNode {
  if (!required) return requirements.notRequired;
  return (
    <>
      <AppIcon
        icon={Check}
        size={12}
        strokeWidth={2}
        decorative
        className="text-primary"
      />
      {requirements.required}
    </>
  );
}

function nullableRequiredValue(required: boolean | null): ReactNode {
  return required === null ? requirements.empty : requiredValue(required);
}

function buildRequirements(listing: ListingDetail): Requirement[] {
  return [
    {
      label: requirements.minimumIncome,
      value:
        listing.minimumHouseholdNetIncome === null
          ? requirements.empty
          : formatEUR(listing.minimumHouseholdNetIncome),
    },
    {
      label: requirements.schufa,
      value: nullableRequiredValue(listing.schufaRequired),
    },
    {
      label: requirements.incomeProof,
      value: nullableRequiredValue(listing.incomeProofRequired),
    },
    {
      label: requirements.peopleCount,
      value:
        listing.suitableForPeopleCount === null
          ? requirements.empty
          : requirements.peopleCountValue(listing.suitableForPeopleCount),
    },
    {
      label: requirements.pets,
      value:
        listing.petsPolicy === null
          ? requirements.empty
          : PET_POLICY_LABEL[listing.petsPolicy],
    },
    {
      label: requirements.smoking,
      value:
        listing.smokingPolicy === null
          ? requirements.empty
          : SMOKING_POLICY_LABEL[listing.smokingPolicy],
    },
  ];
}

export function RequirementsCard({
  listing,
  className,
}: RequirementsCardProps) {
  const rows = buildRequirements(listing);

  return (
    <DetailCard
      title={requirements.title}
      className={cn("bg-background-subtle", className)}
    >
      <ul className={LIST_CLASS}>
        {rows.map((row) => (
          <li key={row.label} className={ITEM_CLASS}>
            <span className={KEY_CLASS}>{row.label}</span>
            <span className={VALUE_CLASS}>{row.value}</span>
          </li>
        ))}
      </ul>
    </DetailCard>
  );
}
