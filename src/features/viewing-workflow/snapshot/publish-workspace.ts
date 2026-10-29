import { viewingWorkflowProjectionSchema } from "@/lib/viewing-workflow/snapshot-schema";
import { publishViewingSnapshot, type ViewingSide } from "./owner";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function listingIdOf(workspace: Record<string, unknown>): string | null {
  const listing = workspace.listing;
  if (!isRecord(listing)) return null;
  return typeof listing.id === "string" ? listing.id : null;
}

/** Publish an embedded projection. A legacy summary that fails to parse is ignored. */
export function publishEmbeddedViewingProjection(
  applicationId: string,
  workspace: unknown,
  side: ViewingSide,
): void {
  if (!isRecord(workspace)) return;
  const parsed = viewingWorkflowProjectionSchema.safeParse(
    workspace.viewingSummary,
  );
  if (!parsed.success || parsed.data.applicationId !== applicationId) return;
  publishViewingSnapshot(parsed.data, {
    side,
    source: "workspace",
    listingId: listingIdOf(workspace),
    snapshot: null,
  });
}
