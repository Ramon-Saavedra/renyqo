import { describe, expect, it } from "vitest";
import { parseApplicantWorkspace } from "./workspace";

const AT = "2026-08-31T14:01:36.290Z";

function emptyWorkspace(applicationId: string) {
  return {
    application: {
      id: applicationId,
      status: "ACTIVE",
      submittedAt: AT,
      activeAt: AT,
      rejectedAt: null,
      withdrawnAt: null,
      publicReason: null,
    },
    applicant: {
      name: "Applicant",
      peopleCount: 1,
      introduction: null,
    },
    capabilities: {
      canReject: true,
      canRestore: false,
      canSelectForRental: true,
      canWithdraw: false,
    },
    asOf: AT,
    attention: {
      applicationId,
      asOf: AT,
      pendingActions: [],
      pendingActionCount: 0,
      hasPendingAction: false,
      actionableUnreadMessageCount: 0,
      historicalUnreadMessageCount: 0,
      conversation: {
        expectedResponder: "PROVIDER",
        isOpen: false,
        isReadOnly: false,
      },
    },
    conversationSummary: {
      canCurrentUserSend: true,
      expectedResponder: "PROVIDER",
      isOpen: false,
      isReadOnly: false,
    },
    documentsSummary: {
      canRequestDocuments: true,
      counts: {
        processingCount: 0,
        requestedCount: 0,
        reviewRequiredCount: 0,
        reviewedCount: 0,
        uploadRequiredCount: 0,
      },
      currentRequests: [],
    },
    viewingSummary: {
      canPropose: true,
      changeRequested: null,
      current: null,
      latest: null,
      latestCompleted: null,
      nextAction: "NONE",
      pendingInterest: null,
    },
    activityPreview: {
      hasMore: false,
      items: [],
    },
  };
}

describe("parseApplicantWorkspace", () => {
  it("accepts a closed workspace with empty documents, viewings, and activity", () => {
    const workspace = parseApplicantWorkspace(
      emptyWorkspace("application-1"),
      "application-1",
    );

    expect(workspace.conversationSummary.canCurrentUserSend).toBe(true);
    expect(workspace.attention.conversation.isOpen).toBe(false);
    expect(workspace.documentsSummary.currentRequests).toEqual([]);
    expect(workspace.viewingSummary.nextAction).toBe("NONE");
    expect(workspace.viewingSummary.current).toBeNull();
    expect(workspace.activityPreview.items).toEqual([]);
    expect(workspace.capabilities.canSelectForRental).toBe(true);
  });

  it("rejects a payload that puts send capability on the attention conversation", () => {
    const payload = emptyWorkspace("application-1");
    const stale = {
      ...payload,
      conversationSummary: undefined,
      attention: {
        ...payload.attention,
        conversation: {
          ...payload.attention.conversation,
          canCurrentUserSend: true,
        },
      },
      activityPreview: {
        hasMore: false,
        entries: [],
      },
    };

    expect(() => parseApplicantWorkspace(stale, "application-1")).toThrow(
      "Invalid applicant workspace response",
    );
  });
});
