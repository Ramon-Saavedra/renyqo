import { describe, expect, it } from "vitest";
import { attentionTargetSchema } from "@/lib/attention/schemas";
import { activityItemSchema } from "@/features/applicant/applications/api/activity-schema";
import { viewingSummarySchema } from "@/features/applicant/applications/api/shared-schemas";
import { parseApplicantWorkspace } from "@/features/provider/dashboard/applicant-workflow/api/workspace";
import { considerationSummarySchema } from "./consideration-schema";

const AT = "2026-10-26T08:00:00.000Z";

const legacyViewing = {
  viewingId: "viewing-1",
  status: "PROPOSED",
  startsAt: AT,
  endsAt: "2026-10-26T08:30:00.000Z",
  timeZone: "Europe/Berlin",
  effectiveOutcome: null,
  postViewingInterest: null,
  nextAction: "APPLICANT_RESPOND_TO_VIEWING",
  capabilities: {
    canAccept: true,
    canDecline: true,
    canRequestAnotherTime: true,
    canSubmitInterest: false,
  },
};

describe("legacy viewing compatibility", () => {
  it("still parses a legacy summary", () => {
    expect(
      viewingSummarySchema.parse({
        current: legacyViewing,
        latest: legacyViewing,
        latestCompleted: null,
        pendingInterest: null,
        changeRequested: null,
        canPropose: false,
        nextAction: "APPLICANT_RESPOND_TO_VIEWING",
      }).current?.status,
    ).toBe("PROPOSED");
  });

  it("accepts outcome-pending status, consideration next action, and extra projection fields", () => {
    const parsed = viewingSummarySchema.parse({
      current: { ...legacyViewing, status: "OUTCOME_PENDING" },
      latest: null,
      latestCompleted: null,
      pendingInterest: null,
      changeRequested: null,
      canPropose: false,
      nextAction: "PROVIDER_DECIDE_CONSIDERATION",
      mode: "CURRENT",
      workflowRevision: 3,
    });
    expect(parsed.current?.status).toBe("OUTCOME_PENDING");
    expect(parsed.nextAction).toBe("PROVIDER_DECIDE_CONSIDERATION");
    expect("mode" in parsed).toBe(false);
  });

  it("accepts new activity types", () => {
    expect(
      activityItemSchema.parse({
        id: "activity-1",
        type: "VIEWING_PROPOSAL_EXPIRED",
        actorType: "SYSTEM",
        occurredAt: AT,
        payload: null,
      }).type,
    ).toBe("VIEWING_PROPOSAL_EXPIRED");
  });

  it("keeps a structured viewing target on attention", () => {
    const target = attentionTargetSchema.parse({
      applicationId: "application-1",
      listingId: "listing-1",
      section: "VIEWING",
      viewingId: "viewing-1",
      workflowTarget: {
        applicationId: "application-1",
        workflowId: "workflow-1",
        proposalId: "proposal-1",
        appointmentId: null,
        section: "VIEWING",
        action: "RESPOND_TO_PROPOSAL",
      },
    });
    expect(target.workflowTarget?.proposalId).toBe("proposal-1");
  });

  it("keeps provider consideration and the new attention action", () => {
    const workspace = parseApplicantWorkspace(
      {
        application: {
          id: "application-1",
          status: "ACTIVE",
          submittedAt: AT,
          activeAt: AT,
          rejectedAt: null,
          withdrawnAt: null,
          publicReason: null,
        },
        applicant: { name: "Ada", peopleCount: 1, introduction: null },
        capabilities: {
          canReject: true,
          canRestore: false,
          canSelectForRental: false,
        },
        asOf: AT,
        attention: {
          pendingActions: [
            {
              type: "DECIDE_VIEWING_CONSIDERATION",
              source: "VIEWING",
              target: { viewingId: "viewing-1" },
            },
          ],
          pendingActionCount: 1,
          hasPendingAction: true,
          actionableUnreadMessageCount: 0,
          historicalUnreadMessageCount: 0,
          conversation: {
            canCurrentUserSend: true,
            applicantRepliesEnabled: true,
            canCurrentUserManageApplicantReplies: true,
            sendBlockReason: null,
            hasMessages: false,
          },
        },
        conversationSummary: {
          canCurrentUserSend: true,
          applicantRepliesEnabled: true,
          canCurrentUserManageApplicantReplies: true,
          sendBlockReason: null,
          hasMessages: false,
        },
        documentsSummary: {
          canRequestDocuments: false,
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
          canPropose: false,
          changeRequested: null,
          current: null,
          latest: null,
          latestCompleted: null,
          nextAction: "PROVIDER_DECIDE_CONSIDERATION",
          pendingInterest: null,
        },
        activityPreview: {
          hasMore: false,
          items: [
            {
              id: "activity-1",
              type: "VIEWING_CONSIDERATION_CHANGED",
              actorType: "PROVIDER",
              occurredAt: AT,
              payload: null,
            },
          ],
        },
        consideration: {
          position: "9007199254740993",
          revision: 2,
          applicantNoShow: null,
        },
      },
      "application-1",
    );
    expect(workspace.attention.pendingActions[0]?.type).toBe(
      "DECIDE_VIEWING_CONSIDERATION",
    );
    expect(workspace.consideration?.position).toBe("9007199254740993");
    expect(typeof workspace.consideration?.position).toBe("string");
  });

  it("does not coerce a no-show marker into a number", () => {
    const parsed = considerationSummarySchema.parse({
      position: null,
      revision: 1,
      applicantNoShow: {
        code: "APPLICANT_NO_SHOW",
        appointmentId: "appointment-1",
        recordedAt: AT,
        startsAt: AT,
        endsAt: null,
        timeZone: "Europe/Berlin",
      },
    });
    expect(parsed.applicantNoShow?.code).toBe("APPLICANT_NO_SHOW");
    expect(parsed.position).toBeNull();
  });
});
