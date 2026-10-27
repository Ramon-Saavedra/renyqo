"use client";

import { useViewingCommands } from "@/features/viewing-workflow/present/use-viewing-commands";

export type { ViewingCommandStatus } from "@/features/viewing-workflow/present/use-viewing-commands";

export function useApplicantViewingCommands(
  applicationId: string,
  workflowRevision: number,
  onChanged: () => void,
) {
  return useViewingCommands(
    applicationId,
    "applicant",
    workflowRevision,
    onChanged,
  );
}
