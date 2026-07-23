import { cn } from "@/lib/utils/cn";
import { listingDetailCopy } from "../copy/listing-detail";
import { DetailCard } from "./DetailCard";

interface DescriptionCardProps {
  description: string | null;
  className?: string;
}

const TEXT_CLASS =
  "text-caption leading-relaxed text-foreground-secondary whitespace-pre-line";

export function DescriptionCard({
  description,
  className,
}: DescriptionCardProps) {
  if (!description) return null;

  return (
    <DetailCard
      title={listingDetailCopy.description.title}
      className={cn("bg-background-subtle", className)}
    >
      <p className={TEXT_CLASS}>{description}</p>
    </DetailCard>
  );
}
