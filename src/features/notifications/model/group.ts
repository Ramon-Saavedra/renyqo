import type { NotificationItem } from "../api/schema";

export interface NotificationApplicationGroup {
  readonly applicationId: string;
  readonly items: readonly NotificationItem[];
}

export interface NotificationListingGroup {
  readonly listingId: string;
  readonly label: string;
  readonly applications: readonly NotificationApplicationGroup[];
}

const NEUTRAL_LISTING_LABEL = "Inserat";

export function groupNotifications(
  items: readonly NotificationItem[],
  listingLabels: ReadonlyMap<string, string> = new Map(),
): readonly NotificationListingGroup[] {
  const listings: NotificationListingGroup[] = [];
  for (const item of items) {
    const listingId = item.target.listingId;
    const applicationId = item.target.applicationId;
    const listingIndex = listings.findIndex(
      (group) => group.listingId === listingId,
    );
    const listing = listings[listingIndex];
    const applications = listing ? [...listing.applications] : [];
    const applicationIndex = applications.findIndex(
      (group) => group.applicationId === applicationId,
    );
    const application = applications[applicationIndex];
    const nextApplication: NotificationApplicationGroup = {
      applicationId,
      items: [...(application?.items ?? []), item],
    };
    if (applicationIndex === -1) applications.push(nextApplication);
    else applications[applicationIndex] = nextApplication;
    const nextListing: NotificationListingGroup = {
      listingId,
      label:
        listing?.label ?? listingLabels.get(listingId) ?? NEUTRAL_LISTING_LABEL,
      applications,
    };
    if (listingIndex === -1) listings.push(nextListing);
    else listings[listingIndex] = nextListing;
  }
  return listings;
}
