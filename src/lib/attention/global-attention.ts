import {
  buildApplicationAttentionChips,
  filterGlobalMenuAttentionChips,
} from "./chips";
import type { AttentionChipModel } from "./chips";
import {
  attentionChipDeepLink,
  deepLinkHref,
  messageDeepLink,
} from "@/lib/navigation/deep-link";
import { attentionCopy } from "./copy";
import { applicationWorkspaceHref } from "./navigation";
import { hasApplicationAttentionSurface } from "./visibility";
import type { ApplicationAttentionListItem } from "./types";

export type GlobalAttentionRole = "applicant" | "provider";

export interface GlobalAttentionMenuChipRow {
  readonly id: string;
  readonly href: string;
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

    const chips = attentionMenuChips(buildApplicationAttentionChips(item));
    if (chips.length === 0) continue;

    const uploadRequestIds = item.documentIndicators
      .filter((indicator) => indicator.status === "UPLOAD_REQUIRED")
      .map((indicator) => indicator.requestId);
    let uploadIndex = 0;
    const rows = chips.map((chip) => {
      const requestId =
        chip.kind === "documentUpload"
          ? (uploadRequestIds[uploadIndex++] ?? null)
          : null;
      return {
        id: `${item.applicationId}:${chip.kind}:${chip.label}`,
        href: deepLinkHref(
          role,
          attentionChipDeepLink(item, chip.kind, requestId),
        ),
        chip,
      };
    });

    groups.push({
      applicationId: item.applicationId,
      listingId: item.listingId,
      href: rows[0]?.href ?? globalAttentionItemHref(item, role),
      listingTitle: resolveGlobalListingTitle(item.listingTitle),
      listingCity: item.listingCity?.trim() ? item.listingCity.trim() : null,
      chips: rows,
    });
  }

  return groups;
}

/** Topbar Aufmerksamkeit. Cards keep message chips from the shared builder. */
export function attentionMenuChips(
  chips: readonly AttentionChipModel[],
): readonly AttentionChipModel[] {
  return filterGlobalMenuAttentionChips(
    chips.filter((chip) => chip.kind !== "messages"),
  );
}

export function groupGlobalMessageItems(
  items: readonly ApplicationAttentionListItem[],
  role: GlobalAttentionRole,
): readonly GlobalAttentionMenuGroup[] {
  const groups: GlobalAttentionMenuGroup[] = [];

  for (const item of items) {
    if (item.actionableUnreadMessageCount <= 0) continue;

    const messageChip = buildApplicationAttentionChips(item).find(
      (chip) => chip.kind === "messages",
    );
    if (!messageChip) continue;

    const href = deepLinkHref(role, messageDeepLink(item));
    groups.push({
      applicationId: item.applicationId,
      listingId: item.listingId,
      href,
      listingTitle: resolveGlobalListingTitle(item.listingTitle),
      listingCity: item.listingCity?.trim() ? item.listingCity.trim() : null,
      chips: [
        {
          id: `${item.applicationId}:messages:${messageChip.label}`,
          href,
          chip: messageChip,
        },
      ],
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
