import type { ReactNode } from "react";
import { Check } from "lucide-react";
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

function buildRequirements(listing: ListingDetail): Requirement[] {
  const rows: Requirement[] = [];

  if (listing.schufaRequired !== null) {
    rows.push({
      label: requirements.schufa,
      value: requiredValue(listing.schufaRequired),
    });
  }
  if (listing.incomeProofRequired !== null) {
    rows.push({
      label: requirements.incomeProof,
      value: requiredValue(listing.incomeProofRequired),
    });
  }
  if (listing.minimumHouseholdNetIncome !== null) {
    rows.push({
      label: requirements.minimumIncome,
      value: formatEUR(listing.minimumHouseholdNetIncome),
    });
  }
  if (listing.suitableForPeopleCount !== null) {
    rows.push({
      label: requirements.peopleCount,
      value: requirements.peopleCountValue(listing.suitableForPeopleCount),
    });
  }
  if (listing.petsPolicy !== null) {
    rows.push({
      label: requirements.pets,
      value: PET_POLICY_LABEL[listing.petsPolicy],
    });
  }
  if (listing.smokingPolicy !== null) {
    rows.push({
      label: requirements.smoking,
      value: SMOKING_POLICY_LABEL[listing.smokingPolicy],
    });
  }

  return rows;
}

export function RequirementsCard({
  listing,
  className,
}: RequirementsCardProps) {
  const rows = buildRequirements(listing);
  if (rows.length === 0) return null;

  return (
    <DetailCard title={requirements.title} className={className}>
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
