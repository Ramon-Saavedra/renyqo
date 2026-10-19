"use client";

import Link from "next/link";
import {
  buildApplicationAttentionChips,
  filterGlobalMenuAttentionChips,
} from "@/lib/attention/chips";
import { listingAttentionHref } from "@/lib/attention/navigation";
import type { ApplicantListingAttention } from "@/lib/attention/types";
import { AttentionIconIndicators } from "./AttentionIconIndicators";

interface ApplicantListingAttentionLinkProps {
  readonly attention: ApplicantListingAttention | null;
  readonly className?: string;
}

const DEFAULT_CLASS =
  "pointer-events-auto inline-flex rounded-sm focus-visible:outline-none focus-visible:shadow-focus";

export function ApplicantListingAttentionLink({
  attention,
  className = DEFAULT_CLASS,
}: ApplicantListingAttentionLinkProps) {
  const href = listingAttentionHref(attention);
  if (!href || !attention) return null;

  const allChips = buildApplicationAttentionChips(attention);
  const chips = filterGlobalMenuAttentionChips(allChips);
  if (chips.length === 0) return null;

  const ariaLabel = allChips.map((chip) => chip.label).join(", ");

  return (
    <Link
      href={href}
      className={className}
      aria-label={ariaLabel}
      title={ariaLabel}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <AttentionIconIndicators chips={chips} />
    </Link>
  );
}
