import { z } from "zod";
import { ViewingWorkflowContractError } from "./transport";

const limitSchema = z.number().int().min(1).max(100);
const beforeRoundSchema = z.number().int().min(0).max(2_147_483_646);

export interface ProposalHistoryQuery {
  readonly limit?: number;
  readonly beforeRound?: number;
}

export function proposalHistorySearch(
  query: ProposalHistoryQuery = {},
): string {
  const limit = limitSchema.safeParse(query.limit ?? 20);
  const beforeRound = beforeRoundSchema.safeParse(query.beforeRound ?? 0);
  if (!limit.success || !beforeRound.success) {
    throw new ViewingWorkflowContractError("Invalid proposal history query");
  }
  const params = new URLSearchParams({
    limit: String(limit.data),
    beforeRound: String(beforeRound.data),
  });
  return params.toString();
}
