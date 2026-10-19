import { apiGet } from "@/lib/api/client";
import { attentionAggregateResponseSchema } from "../schemas";
import type { AttentionAggregateResponse } from "../types";
import type { GlobalAttentionRole } from "../global-attention";

export class AttentionAggregateContractError extends Error {
  constructor() {
    super("Invalid attention aggregate response");
    this.name = "AttentionAggregateContractError";
  }
}

function attentionPath(role: GlobalAttentionRole): string {
  return role === "applicant"
    ? "/api/v1/applicant/attention"
    : "/api/v1/provider/attention";
}

export async function getAttentionAggregate(
  role: GlobalAttentionRole,
  options?: { limit?: number; offset?: number; filter?: "all" | "actionable" },
): Promise<AttentionAggregateResponse> {
  const params = new URLSearchParams();
  if (options?.filter !== undefined) {
    params.set("filter", options.filter);
  }
  if (options?.limit !== undefined) {
    params.set("limit", String(options.limit));
  }
  if (options?.offset !== undefined) {
    params.set("offset", String(options.offset));
  }
  const query = params.toString();
  const path = query ? `${attentionPath(role)}?${query}` : attentionPath(role);
  const response = await apiGet<unknown>(path);
  const parsed = attentionAggregateResponseSchema.safeParse(response);
  if (!parsed.success) {
    throw new AttentionAggregateContractError();
  }
  return parsed.data;
}
