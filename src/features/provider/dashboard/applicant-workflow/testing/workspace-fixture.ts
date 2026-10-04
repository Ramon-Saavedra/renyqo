import type { ApplicantWorkspace } from "../api/workspace";

const AT = "2026-09-27T08:00:00.000Z";

export function createApplicantWorkspace(
  applicationId = "application-1",
  name = "Maria Schneider",
  introduction: string | null = "Wir suchen langfristig eine ruhige Wohnung.",
  activeAt: string | null = AT,
): ApplicantWorkspace {
  return {
    application: {
      id: applicationId,
      status: "ACTIVE",
      submittedAt: AT,
      activeAt,
      rejectedAt: null,
      withdrawnAt: null,
      publicReason: null,
    },
    applicant: {
      name,
      peopleCount: 2,
      introduction,
    },
    capabilities: {
      canReject: true,
      canSelectForRental: false,
      canRestore: false,
    },
    asOf: AT,
    attention: {
      pendingActions: [],
      pendingActionCount: 0,
      hasPendingAction: false,
      actionableUnreadMessageCount: 0,
      historicalUnreadMessageCount: 0,
      conversation: {
        expectedResponder: "PROVIDER",
        isOpen: true,
        isReadOnly: false,
      },
    },
    conversationSummary: {
      expectedResponder: "PROVIDER",
      isOpen: true,
      isReadOnly: false,
      canCurrentUserSend: false,
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
      current: null,
      latest: null,
      latestCompleted: null,
      pendingInterest: null,
      changeRequested: null,
      canPropose: false,
      nextAction: "NONE",
    },
    activityPreview: {
      items: [],
      hasMore: false,
    },
  };
}
