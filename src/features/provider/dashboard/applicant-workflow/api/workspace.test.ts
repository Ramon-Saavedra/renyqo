import { describe, expect, it } from "vitest";
import { parseApplicantWorkspace } from "./workspace";
import applicantReplyWorkspace from "../testing/applicant-reply-workspace.json";

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
  it("accepts the real workspace structure after an applicant reply", () => {
    const workspace = parseApplicantWorkspace(
      applicantReplyWorkspace,
      applicantReplyWorkspace.application.id,
    );

    expect(workspace.attention.pendingActions).toEqual([
      { type: "RESPOND_TO_MESSAGE", source: "CONVERSATION" },
    ]);
    expect(workspace.conversationSummary).toEqual({
      isOpen: true,
      isReadOnly: false,
      expectedResponder: "PROVIDER",
      canCurrentUserSend: true,
    });
    expect(workspace.documentsSummary.currentRequests).toHaveLength(3);
    expect(workspace.viewingSummary.current?.postViewingInterest).toBeNull();
    expect(workspace.activityPreview.items).toHaveLength(5);
  });

  it("preserves document and viewing action targets", () => {
    const pendingActions = [
      {
        type: "REVIEW_DOCUMENT",
        source: "DOCUMENT",
        target: { requestId: "request-1", documentId: "document-1" },
      },
      ...[
        "RESPOND_TO_VIEWING_CHANGE_REQUEST",
        "CLOSE_UNANSWERED_VIEWING",
        "RECORD_VIEWING_OUTCOME",
      ].map((type) => ({
        type,
        source: "VIEWING",
        target: { viewingId: "viewing-1" },
      })),
    ];
    const workspace = parseApplicantWorkspace(
      {
        ...applicantReplyWorkspace,
        attention: { ...applicantReplyWorkspace.attention, pendingActions },
      },
      applicantReplyWorkspace.application.id,
    );

    expect(workspace.attention.pendingActions).toEqual(pendingActions);
  });

  it.each([
    ["RESPOND_TO_MESSAGE"],
    [{ type: "RESPOND_TO_MESSAGE", source: "DOCUMENT" }],
    [
      {
        type: "REVIEW_DOCUMENT",
        source: "DOCUMENT",
        target: { requestId: "r" },
      },
    ],
    [
      {
        type: "RECORD_VIEWING_OUTCOME",
        source: "VIEWING",
        target: { viewingId: "" },
      },
    ],
    [{ type: "UNKNOWN", source: "CONVERSATION" }],
  ])("rejects malformed pending action %j", (action) => {
    expect(() =>
      parseApplicantWorkspace(
        {
          ...applicantReplyWorkspace,
          attention: {
            ...applicantReplyWorkspace.attention,
            pendingActions: [action],
          },
        },
        applicantReplyWorkspace.application.id,
      ),
    ).toThrow("Invalid applicant workspace response");
  });

  it.each(["STILL_INTERESTED", "NOT_INTERESTED"])(
    "preserves structured post-viewing interest %s in every summary slot",
    (interest) => {
      const postViewingInterest = { interest, respondedAt: AT };
      const viewing = {
        ...applicantReplyWorkspace.viewingSummary.current,
        status: "COMPLETED",
        effectiveOutcome: "COMPLETED",
        postViewingInterest,
      };
      const workspace = parseApplicantWorkspace(
        {
          ...applicantReplyWorkspace,
          viewingSummary: {
            ...applicantReplyWorkspace.viewingSummary,
            current: viewing,
            latest: viewing,
            latestCompleted: viewing,
            pendingInterest: viewing,
            changeRequested: viewing,
          },
        },
        applicantReplyWorkspace.application.id,
      );

      for (const key of [
        "current",
        "latest",
        "latestCompleted",
        "pendingInterest",
        "changeRequested",
      ] as const) {
        expect(workspace.viewingSummary[key]?.postViewingInterest).toEqual(
          postViewingInterest,
        );
      }
    },
  );

  it.each([
    "STILL_INTERESTED",
    { interest: "UNKNOWN", respondedAt: AT },
    { interest: "STILL_INTERESTED" },
    { interest: "STILL_INTERESTED", respondedAt: "invalid" },
  ])("rejects malformed post-viewing interest %j", (postViewingInterest) => {
    expect(() =>
      parseApplicantWorkspace(
        {
          ...applicantReplyWorkspace,
          viewingSummary: {
            ...applicantReplyWorkspace.viewingSummary,
            current: {
              ...applicantReplyWorkspace.viewingSummary.current,
              postViewingInterest,
            },
          },
        },
        applicantReplyWorkspace.application.id,
      ),
    ).toThrow("Invalid applicant workspace response");
  });

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
