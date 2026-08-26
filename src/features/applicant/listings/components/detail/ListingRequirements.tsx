import { SMOKING_POLICY_LABEL } from "@/lib/api/listings";
import { cn } from "@/lib/utils/cn";
import { listingDetailCopy } from "../../copy/listing-detail";
import type { ApplicantPetPolicy, PublicListingDetail } from "../../types";
import { formatEUR } from "../../utils/format";
import { DetailSectionHeading } from "./DetailSectionHeading";

interface ListingRequirementsProps {
  listing: PublicListingDetail;
  className?: string;
}

type RequirementTone = "neutral" | "required" | "denied";

interface Requirement {
  readonly label: string;
  readonly value: string;
  readonly tone: RequirementTone;
}

const ROW_CLASS =
  "flex items-center justify-between gap-4 border-b border-border py-2.5 text-caption last:border-b-0";

const LABEL_CLASS = "text-foreground-secondary";

const TONE_CLASS: Record<RequirementTone, string> = {
  neutral: "text-foreground",
  required: "text-success",
  denied: "text-foreground-tertiary",
};

const PET_POLICY_LABEL: Record<ApplicantPetPolicy, string> = {
  ALLOWED: "Erlaubt",
  BY_ARRANGEMENT: "Auf Anfrage",
  NOT_ALLOWED: "Nicht erlaubt",
};

const EMPTY_CLASS = "text-caption text-foreground-tertiary";

const { requirements } = listingDetailCopy;

function requiredRow(label: string, required: boolean): Requirement {
  return {
    label,
    value: required ? requirements.required : requirements.notRequired,
    tone: required ? "required" : "denied",
  };
}

function buildRequirements(listing: PublicListingDetail): Requirement[] {
  const rows: Requirement[] = [];

  if (listing.minimumHouseholdNetIncome !== null) {
    rows.push({
      label: requirements.minimumIncome,
      value: formatEUR(listing.minimumHouseholdNetIncome),
      tone: "neutral",
    });
  }

  rows.push(requiredRow(requirements.schufa, listing.schufaRequired));
  rows.push(requiredRow(requirements.incomeProof, listing.incomeProofRequired));

  if (listing.suitableForPeopleCount !== null) {
    rows.push({
      label: requirements.householdSize,
      value: requirements.householdSizeValue(listing.suitableForPeopleCount),
      tone: "neutral",
    });
  }

  if (listing.petsPolicy !== null) {
    rows.push({
      label: requirements.pets,
      value: PET_POLICY_LABEL[listing.petsPolicy],
      tone: listing.petsPolicy === "NOT_ALLOWED" ? "denied" : "neutral",
    });
  }

  if (listing.smokingPolicy !== null) {
    rows.push({
      label: requirements.smoking,
      value: SMOKING_POLICY_LABEL[listing.smokingPolicy],
      tone: listing.smokingPolicy === "NOT_ALLOWED" ? "denied" : "neutral",
    });
  }

  return rows;
}

export function ListingRequirements({
  listing,
  className,
}: ListingRequirementsProps) {
  const rows = buildRequirements(listing);

  return (
    <section className={className}>
      <DetailSectionHeading>{requirements.title}</DetailSectionHeading>

      {rows.length === 0 ? (
        <p className={EMPTY_CLASS}>{requirements.empty}</p>
      ) : (
        <dl>
          {rows.map((row) => (
            <div key={row.label} className={ROW_CLASS}>
              <dt className={LABEL_CLASS}>{row.label}</dt>
              <dd className={cn("font-medium", TONE_CLASS[row.tone])}>
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
