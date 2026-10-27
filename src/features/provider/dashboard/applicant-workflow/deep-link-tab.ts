import type { DeepLink } from "@/lib/navigation/deep-link";
import type { WorkflowTabKey } from "./components/WorkflowTabs";

export function workflowTabForDeepLink(
  link: Pick<DeepLink, "section" | "activityId">,
): WorkflowTabKey {
  if (link.activityId) return "overview";
  if (
    link.section === "messages" ||
    link.section === "documents" ||
    link.section === "viewing"
  ) {
    return link.section;
  }
  return "overview";
}
