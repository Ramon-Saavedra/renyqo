import type { GlobalAttentionRole } from "@/lib/attention/global-attention";
import { deepLinkHref, notificationDeepLink } from "@/lib/navigation/deep-link";
import type { NotificationItem } from "../api/schema";

export function notificationHref(
  role: GlobalAttentionRole,
  target: NotificationItem["target"],
): string {
  return deepLinkHref(role, notificationDeepLink(target));
}
