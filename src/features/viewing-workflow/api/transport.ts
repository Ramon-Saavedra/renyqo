import type { ZodType } from "zod";
import { apiGet, apiPost, type ApiRequestOptions } from "@/lib/api/client";
import { workflowCommandResultSchema } from "@/lib/viewing-workflow/command-schema";
import type { WorkflowCommandResult } from "@/lib/viewing-workflow/command-schema";

export class ViewingWorkflowContractError extends Error {
  constructor(message = "Invalid viewing workflow contract") {
    super(message);
    this.name = "ViewingWorkflowContractError";
  }
}

export function workflowPath(
  side: "applicant" | "provider",
  applicationId: string,
): string {
  return `/api/v1/${side}/applications/${encodeURIComponent(applicationId)}/viewing-workflow`;
}

export async function readWorkflow<T>(
  path: string,
  schema: ZodType<T>,
  options?: ApiRequestOptions,
): Promise<T> {
  const response = await apiGet<unknown>(path, options);
  const parsed = schema.safeParse(response);
  if (!parsed.success) throw new ViewingWorkflowContractError();
  return parsed.data;
}

export async function postWorkflowCommand(
  path: string,
  bodySchema: ZodType,
  body: unknown,
): Promise<WorkflowCommandResult> {
  const parsedBody = bodySchema.safeParse(body);
  if (!parsedBody.success) {
    throw new ViewingWorkflowContractError("Invalid viewing workflow command");
  }
  const response = await apiPost<unknown>(path, parsedBody.data);
  const parsed = workflowCommandResultSchema.safeParse(response);
  if (!parsed.success) throw new ViewingWorkflowContractError();
  return parsed.data;
}
