import type { WorkflowCapability } from "@/lib/viewing-workflow/snapshot-schema";

export function allowedCapability(
  capabilities: readonly WorkflowCapability[],
  action: WorkflowCapability["action"],
): WorkflowCapability | null {
  const match = capabilities.find((capability) => capability.action === action);
  if (!match?.allowed) return null;
  return match;
}
