import type { WorkflowTone } from "./components/StatusTag";

export type WorkflowSectionKey = "messages" | "documents" | "viewing";

export interface WorkflowSectionSummary {
  readonly key: WorkflowSectionKey;
  readonly label: string;
  readonly value: string;
  readonly state: string;
  readonly tone: WorkflowTone;
}

export const WORKFLOW_SECTION_ORDER: readonly WorkflowSectionKey[] = [
  "messages",
  "documents",
  "viewing",
];
