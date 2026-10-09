import type { ApplicantApplicationCard } from "../api/overview";
import type {
  ConversationMessage,
  ConversationPage,
} from "../api/conversation";
import type { ViewingSnapshot } from "../api/shared-schemas";
import type { ApplicantWorkspace } from "../api/workspace";

export const APPLICATION_ID = "6b0f8c62-34a5-4d0e-9a4d-1b6d2b8e1a01";
export const AS_OF = "2026-10-04T09:20:00.000Z";

export function viewingSnapshot(
  overrides: Partial<ViewingSnapshot> = {},
): ViewingSnapshot {
  return {
    viewingId: "viewing-1",
    status: "PROPOSED",
    startsAt: "2026-10-08T15:30:00.000Z",
    endsAt: "2026-10-08T16:00:00.000Z",
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
    ...overrides,
  };
}

type WorkspaceOverrides = {
  readonly [K in Exclude<keyof ApplicantWorkspace, "asOf">]?: Partial<
    ApplicantWorkspace[K]
  >;
};

export function createWorkspace(
  overrides: WorkspaceOverrides = {},
  asOf: string = AS_OF,
): ApplicantWorkspace {
  const base: ApplicantWorkspace = {
    asOf,
    listing: {
      id: "listing-1",
      title: "Helle 3-Zimmer-Wohnung mit Balkon",
      city: "Leipzig-Südvorstadt",
      coldRent: 1180,
      status: "PUBLISHED",
      imageUrl: null,
    },
    application: {
      id: APPLICATION_ID,
      status: "ACTIVE",
      submittedAt: "2026-09-12T18:47:00.000Z",
      activeAt: "2026-09-18T09:30:00.000Z",
      rejectedAt: null,
      withdrawnAt: null,
      publicReason: null,
    },
    attention: {
      pendingActions: [],
      pendingActionCount: 0,
      hasPendingAction: false,
      actionableUnreadMessageCount: 0,
      historicalUnreadMessageCount: 0,
      conversation: {
        isOpen: false,
        isReadOnly: false,
        expectedResponder: "PROVIDER",
      },
    },
    conversationSummary: {
      isOpen: false,
      isReadOnly: false,
      expectedResponder: "PROVIDER",
      canCurrentUserSend: false,
    },
    documentsSummary: {
      counts: {
        requestedCount: 0,
        uploadRequiredCount: 0,
        reviewRequiredCount: 0,
        processingCount: 0,
        reviewedCount: 0,
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
    activityPreview: { items: [], hasMore: false },
    capabilities: { canWithdraw: true },
  };
  return {
    ...base,
    listing: { ...base.listing, ...overrides.listing },
    application: { ...base.application, ...overrides.application },
    attention: { ...base.attention, ...overrides.attention },
    conversationSummary: {
      ...base.conversationSummary,
      ...overrides.conversationSummary,
    },
    documentsSummary: {
      ...base.documentsSummary,
      ...overrides.documentsSummary,
    },
    viewingSummary: { ...base.viewingSummary, ...overrides.viewingSummary },
    activityPreview: { ...base.activityPreview, ...overrides.activityPreview },
    capabilities: { ...base.capabilities, ...overrides.capabilities },
  };
}

export function message(
  sequence: number,
  senderType: ConversationMessage["senderType"],
  body: string,
  readAt: string | null = null,
): ConversationMessage {
  return {
    id: `message-${sequence}`,
    sequence,
    senderType,
    body,
    createdAt: `2026-10-0${Math.min(sequence, 4)}T08:00:00.000Z`,
    readAt,
  };
}

export function conversationPage(
  messages: readonly ConversationMessage[],
  overrides: Partial<ConversationPage> = {},
): ConversationPage {
  return {
    applicationId: APPLICATION_ID,
    isOpen: true,
    canCurrentUserSend: true,
    expectedResponder: "APPLICANT",
    unreadCount: 0,
    messages: [...messages],
    hasMore: false,
    nextAfterSequence: null,
    ...overrides,
  };
}

export function loadedConversation(
  messages: readonly ConversationMessage[],
  overrides: Partial<ConversationPage> = {},
) {
  const last = messages.at(-1);
  const page = conversationPage(messages, {
    canCurrentUserSend: last?.senderType === "PROVIDER",
    expectedResponder: last
      ? last.senderType === "PROVIDER"
        ? "APPLICANT"
        : "PROVIDER"
      : null,
    ...overrides,
  });
  return {
    messages: page.messages,
    capabilities: {
      isOpen: page.isOpen,
      canCurrentUserSend: page.canCurrentUserSend,
      expectedResponder: page.expectedResponder,
    },
  };
}

export function overviewCard(
  overrides: Partial<ApplicantApplicationCard> & {
    readonly applicationId: string;
  },
): ApplicantApplicationCard {
  return {
    status: "ACTIVE",
    submittedAt: "2026-09-12T18:47:00.000Z",
    activeAt: "2026-09-18T09:30:00.000Z",
    listing: {
      id: `listing-${overrides.applicationId}`,
      title: "Helle 3-Zimmer-Wohnung mit Balkon",
      city: "Leipzig-Südvorstadt",
      coldRent: 1180,
      status: "PUBLISHED",
      imageUrl: null,
    },
    attention: {
      pendingActionCount: 0,
      actionableUnreadMessageCount: 0,
      hasPendingAction: false,
    },
    conversation: {
      isOpen: false,
      isReadOnly: false,
      expectedResponder: "PROVIDER",
      canCurrentUserSend: false,
    },
    documents: {
      requestedCount: 0,
      uploadRequiredCount: 0,
      reviewRequiredCount: 0,
      processingCount: 0,
      reviewedCount: 0,
    },
    viewing: {
      current: null,
      latest: null,
      latestCompleted: null,
      pendingInterest: null,
      changeRequested: null,
      canPropose: false,
      nextAction: "NONE",
    },
    ...overrides,
  };
}
