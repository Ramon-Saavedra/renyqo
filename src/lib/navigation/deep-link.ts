import type { AttentionChipKind } from "@/lib/attention/chips";
import type { AttentionTarget } from "@/lib/attention/types";
import type { ApplicationAttentionListItem } from "@/lib/attention/types";
import type { GlobalAttentionRole } from "@/lib/attention/global-attention";
import type { NotificationItem } from "@/features/notifications/api/schema";

export const DEEP_LINK_SECTIONS = [
  "messages",
  "documents",
  "viewing",
  "activity",
] as const;

export type DeepLinkSection = (typeof DEEP_LINK_SECTIONS)[number];

const SECTION_SET = new Set<string>(DEEP_LINK_SECTIONS);

export interface DeepLinkInput {
  readonly applicationId: string;
  readonly listingId?: string | null;
  readonly section?: DeepLinkSection | null;
  readonly requestId?: string | null;
  readonly documentId?: string | null;
  readonly viewingId?: string | null;
  readonly proposalId?: string | null;
  readonly appointmentId?: string | null;
  readonly activityId?: string | null;
}

export interface DeepLink {
  readonly listingId: string | null;
  readonly applicationId: string | null;
  readonly section: DeepLinkSection | null;
  readonly requestId: string | null;
  readonly documentId: string | null;
  readonly viewingId: string | null;
  readonly proposalId: string | null;
  readonly appointmentId: string | null;
  readonly activityId: string | null;
}

const FOCUS_KEYS = [
  "applicationId",
  "section",
  "requestId",
  "documentId",
  "viewingId",
  "proposalId",
  "appointmentId",
  "activityId",
] as const;

function present(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function assign(
  params: URLSearchParams,
  key: string,
  value: string | null | undefined,
): void {
  const next = present(value);
  if (next) params.set(key, next);
}

export function deepLinkHref(
  role: GlobalAttentionRole,
  input: DeepLinkInput,
): string {
  const params = new URLSearchParams();
  if (role === "provider") {
    assign(params, "listingId", input.listingId);
  }
  assign(params, "section", input.section);
  assign(params, "requestId", input.requestId);
  assign(params, "documentId", input.documentId);
  assign(params, "viewingId", input.viewingId);
  assign(params, "proposalId", input.proposalId);
  assign(params, "appointmentId", input.appointmentId);
  assign(params, "activityId", input.activityId);
  const query = params.toString();
  const path =
    role === "applicant"
      ? `/applicant/applications/${encodeURIComponent(input.applicationId)}`
      : `/provider/applications/${encodeURIComponent(input.applicationId)}`;
  return query ? `${path}?${query}` : path;
}

export function providerWorkspaceHrefFromDashboardSearch(
  search: string,
): string | null {
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search,
  );
  const applicationId = present(params.get("applicationId"));
  if (!applicationId) return null;
  params.delete("applicationId");
  const query = params.toString();
  const path = `/provider/applications/${encodeURIComponent(applicationId)}`;
  return query ? `${path}?${query}` : path;
}

export function dashboardReturnHref(listingId: string | null): string {
  if (!listingId) return "/provider/dashboard";
  return `/provider/dashboard?${new URLSearchParams({ listingId }).toString()}`;
}

function readValue(
  params: { get(name: string): string | null },
  key: string,
): string | null {
  return present(params.get(key));
}

export function readDeepLink(params: {
  get(name: string): string | null;
}): DeepLink {
  const section = readValue(params, "section");
  return {
    listingId: readValue(params, "listingId"),
    applicationId: readValue(params, "applicationId"),
    section:
      section && SECTION_SET.has(section) ? (section as DeepLinkSection) : null,
    requestId: readValue(params, "requestId"),
    documentId: readValue(params, "documentId"),
    viewingId: readValue(params, "viewingId"),
    proposalId: readValue(params, "proposalId"),
    appointmentId: readValue(params, "appointmentId"),
    activityId: readValue(params, "activityId"),
  };
}

export function listingSearchAfterClose(search: string): string {
  const listingId = present(new URLSearchParams(search).get("listingId"));
  if (!listingId) return "";
  return `?${new URLSearchParams({ listingId }).toString()}`;
}

export function closeProviderDeepLink(): void {
  const url = new URL(window.location.href);
  for (const key of FOCUS_KEYS) url.searchParams.delete(key);
  const next = `${url.pathname}${url.search}${url.hash}`;
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (next === current) return;
  window.history.replaceState(window.history.state, "", next);
}

function fromAttentionTarget(
  item: Pick<ApplicationAttentionListItem, "applicationId" | "listingId">,
  target: AttentionTarget,
): DeepLinkInput {
  return {
    applicationId: item.applicationId,
    listingId: item.listingId,
    section:
      target.section === "MESSAGES"
        ? "messages"
        : target.section === "DOCUMENTS"
          ? "documents"
          : "viewing",
    requestId: target.requestId ?? null,
    documentId: target.documentId ?? null,
    viewingId: target.viewingId ?? null,
    proposalId: target.workflowTarget?.proposalId ?? null,
    appointmentId: target.workflowTarget?.appointmentId ?? null,
  };
}

export function messageDeepLink(
  item: Pick<
    ApplicationAttentionListItem,
    "applicationId" | "listingId" | "targets"
  >,
): DeepLinkInput {
  const target = item.targets.find((entry) => entry.section === "MESSAGES");
  if (!target) {
    return {
      applicationId: item.applicationId,
      listingId: item.listingId,
      section: "messages",
    };
  }
  return fromAttentionTarget(item, target);
}

export function notificationDeepLink(
  target: NotificationItem["target"],
): DeepLinkInput {
  const viewing = target.section === "VIEWING";
  return {
    applicationId: target.applicationId,
    listingId: target.listingId,
    section: viewing ? "viewing" : "activity",
    activityId: target.activityId,
    proposalId: viewing ? target.proposalId : null,
    appointmentId: viewing ? target.appointmentId : null,
  };
}

function specificPendingTarget(
  targets: readonly AttentionTarget[],
): AttentionTarget | null {
  const actionable = targets.filter((target) => target.section !== "MESSAGES");
  return (
    actionable.find(
      (target) =>
        target.workflowTarget?.proposalId ||
        target.workflowTarget?.appointmentId,
    ) ??
    actionable.find((target) => target.requestId) ??
    actionable.find((target) => target.viewingId) ??
    actionable[0] ??
    null
  );
}

export function attentionChipDeepLink(
  item: ApplicationAttentionListItem,
  kind: AttentionChipKind,
  requestId?: string | null,
): DeepLinkInput {
  if (kind === "messages") return messageDeepLink(item);
  if (kind === "viewing") {
    const target = item.targets.find((entry) => entry.section === "VIEWING");
    if (!target) {
      return {
        applicationId: item.applicationId,
        listingId: item.listingId,
        section: "viewing",
      };
    }
    return fromAttentionTarget(item, target);
  }
  if (kind === "documentUpload" || kind === "documentReview") {
    const documents = item.targets.filter(
      (entry) => entry.section === "DOCUMENTS",
    );
    const target =
      documents.find((entry) => requestId && entry.requestId === requestId) ??
      documents[0];
    if (!target) {
      return {
        applicationId: item.applicationId,
        listingId: item.listingId,
        section: "documents",
        requestId: requestId ?? null,
      };
    }
    return fromAttentionTarget(item, target);
  }
  const pending = specificPendingTarget(item.targets);
  if (!pending) {
    return {
      applicationId: item.applicationId,
      listingId: item.listingId,
    };
  }
  return fromAttentionTarget(item, pending);
}

export function linkedWorkflowApplicationId(
  listingId: string,
  link: DeepLink,
): string | null {
  if (!link.applicationId) return null;
  if (link.listingId && link.listingId !== listingId) return null;
  return link.applicationId;
}

export type ActivityFocusStep = "found" | "load" | "stop";

export function activityFocusStep(
  activityId: string,
  items: readonly { readonly id: string }[],
  hasMore: boolean,
): ActivityFocusStep {
  if (items.some((item) => item.id === activityId)) return "found";
  return hasMore ? "load" : "stop";
}
