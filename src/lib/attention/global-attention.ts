import {
  buildApplicationAttentionChips,
  filterGlobalMenuAttentionChips,
} from "./chips";
import type { AttentionChipModel } from "./chips";
import { attentionCopy } from "./copy";
import { applicationWorkspaceHref } from "./navigation";
import { hasApplicationAttentionSurface } from "./visibility";
import type { ApplicationAttentionListItem } from "./types";

export type GlobalAttentionRole = "applicant" | "provider";

export interface GlobalAttentionMenuChipRow {
  readonly id: string;
  readonly chip: AttentionChipModel;
}

export interface GlobalAttentionMenuGroup {
  readonly applicationId: string;
  readonly listingId: string;
  readonly href: string;
  readonly listingTitle: string;
  readonly listingCity: string | null;
  readonly chips: readonly GlobalAttentionMenuChipRow[];
}

export function resolveGlobalListingTitle(listingTitle: string | null): string {
  const trimmed = listingTitle?.trim();
  return trimmed && trimmed.length > 0
    ? trimmed
    : attentionCopy.listingTitleFallback;
}

export function groupGlobalAttentionItems(
  items: readonly ApplicationAttentionListItem[],
  role: GlobalAttentionRole,
): readonly GlobalAttentionMenuGroup[] {
  const groups: GlobalAttentionMenuGroup[] = [];

  for (const item of items) {
    if (!hasApplicationAttentionSurface(item)) continue;

    const chips = filterGlobalMenuAttentionChips(
      buildApplicationAttentionChips(item),
    );
    if (chips.length === 0) continue;

    groups.push({
      applicationId: item.applicationId,
      listingId: item.listingId,
      href: globalAttentionItemHref(item, role),
      listingTitle: resolveGlobalListingTitle(item.listingTitle),
      listingCity: item.listingCity?.trim() ? item.listingCity.trim() : null,
      chips: chips.map((chip) => ({
        id: `${item.applicationId}:${chip.kind}:${chip.label}`,
        chip,
      })),
    });
  }

  return groups;
}

export function globalAttentionItemHref(
  item: Pick<ApplicationAttentionListItem, "applicationId" | "listingId">,
  role: GlobalAttentionRole,
): string {
  if (role === "applicant") {
    return applicationWorkspaceHref(item.applicationId);
  }
  return providerAttentionDashboardHref(item.listingId);
}

export function providerAttentionDashboardHref(listingId: string): string {
  return `/provider/dashboard?listingId=${encodeURIComponent(listingId)}`;
}
