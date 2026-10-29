import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiGet, apiPost } from "@/lib/api/client";
import { acceptApplicantProposal } from "./applicant-workflow";
import { ViewingWorkflowContractError } from "./transport";
import {
  closeProviderViewingWorkflow,
  getProviderProposalHistory,
  inviteToProviderViewing,
  recordProviderViewingOutcome,
} from "./provider-workflow";

vi.mock("@/lib/api/client", () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
}));

const APPLICATION = "application-1";
const KEY = "6b0f8c62-34a5-4d0e-9a4d-1b6d2b8e1a01";
const command = { requestKey: KEY, expectedWorkflowRevision: 2 };
const result = {
  applicationId: APPLICATION,
  workflowId: "workflow-1",
  workflowRevision: 3,
  proposalId: "proposal-1",
  appointmentId: null,
};

describe("viewing workflow clients", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("posts an applicant accept with only the command body", async () => {
    vi.mocked(apiPost).mockResolvedValue(result);
    await expect(
      acceptApplicantProposal(APPLICATION, "proposal-1", command),
    ).resolves.toEqual(result);
    expect(apiPost).toHaveBeenCalledWith(
      "/api/v1/applicant/applications/application-1/viewing-workflow/proposals/proposal-1/accept",
      command,
    );
  });

  it("does not send a command when the revision is stale on the client", async () => {
    await expect(
      inviteToProviderViewing(APPLICATION, {
        ...command,
        expectedWorkflowRevision: 1.5,
        startsAt: "2026-10-28T16:00:00.000Z",
        endsAt: "2026-10-28T16:30:00.000Z",
        timeZone: "Europe/Berlin",
      }),
    ).rejects.toBeInstanceOf(ViewingWorkflowContractError);
    expect(apiPost).not.toHaveBeenCalled();
  });

  it("posts provider close and outcome bodies unchanged", async () => {
    vi.mocked(apiPost).mockResolvedValue(result);
    const close = {
      ...command,
      reason: "PROVIDER_OPERATIONAL" as const,
      proposalId: null,
      appointmentId: "appointment-1",
    };
    await closeProviderViewingWorkflow(APPLICATION, "workflow-1", close);
    await recordProviderViewingOutcome(APPLICATION, "appointment-1", {
      ...command,
      outcome: "NO_SHOW",
      absenceSide: "BOTH",
    });
    expect(apiPost).toHaveBeenNthCalledWith(
      1,
      "/api/v1/provider/applications/application-1/viewing-workflow/workflow-1/close",
      close,
    );
    expect(apiPost).toHaveBeenNthCalledWith(
      2,
      "/api/v1/provider/applications/application-1/viewing-workflow/appointments/appointment-1/outcome",
      { ...command, outcome: "NO_SHOW", absenceSide: "BOTH" },
    );
  });

  it("requests proposal history with the round cursor", async () => {
    vi.mocked(apiGet).mockResolvedValue({
      asOf: "2026-10-26T08:00:00.000Z",
      applicationId: APPLICATION,
      workflowId: null,
      reconciliationRequired: true,
      items: [],
      pagination: { limit: 20, hasMore: false, nextBeforeRound: null },
    });
    await getProviderProposalHistory(APPLICATION);
    expect(apiGet).toHaveBeenCalledWith(
      "/api/v1/provider/applications/application-1/viewing-workflow/proposals?limit=20&beforeRound=0",
      undefined,
    );
  });
});
