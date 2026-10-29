import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/client";
import {
  getApplicantActivityPage,
  type ActivityPage,
} from "../../api/activity";
import type { ActivityItem } from "../../api/activity-schema";
import type * as activityApi from "../../api/activity";
import type * as conversationApi from "../../api/conversation";
import type * as documentsApi from "../../api/documents";
import type { ViewingSnapshot } from "../../api/shared-schemas";
import {
  acceptViewing,
  declineViewing,
  getViewingDetail,
  requestAnotherViewingTime,
  submitViewingInterest,
} from "../../api/viewings";
import type * as viewingsApi from "../../api/viewings";
import {
  getApplicantWorkspace,
  type ApplicantWorkspace,
} from "../../api/workspace";
import type * as workspaceApi from "../../api/workspace";
import { formatCardSchedule } from "../../model/format-date";
import {
  APPLICATION_ID,
  createWorkspace,
  viewingSnapshot,
} from "../../testing/fixtures";
import { ApplicationWorkspace } from "./ApplicationWorkspace";

vi.mock("../../api/workspace", async (importOriginal) => ({
  ...(await importOriginal<typeof workspaceApi>()),
  getApplicantWorkspace: vi.fn(),
}));

vi.mock("@/features/viewing-workflow/api/applicant-workflow", () => ({
  getApplicantViewingWorkflow: vi.fn(() => new Promise(() => undefined)),
}));

vi.mock("../../api/conversation", async (importOriginal) => ({
  ...(await importOriginal<typeof conversationApi>()),
  loadCompleteConversation: vi.fn().mockResolvedValue({
    messages: [],
    capabilities: {
      hasMessages: true,
      canCurrentUserSend: false,
      applicantRepliesEnabled: false,
      canCurrentUserManageApplicantReplies: false,
      sendBlockReason: "LIFECYCLE_READ_ONLY",
    },
  }),
}));

vi.mock("../../api/documents", async (importOriginal) => ({
  ...(await importOriginal<typeof documentsApi>()),
  getDocumentRequestTimelines: vi.fn().mockResolvedValue(new Map()),
}));

vi.mock("../../api/viewings", async (importOriginal) => ({
  ...(await importOriginal<typeof viewingsApi>()),
  getViewingDetail: vi.fn(),
  acceptViewing: vi.fn(),
  declineViewing: vi.fn(),
  requestAnotherViewingTime: vi.fn(),
  submitViewingInterest: vi.fn(),
}));

vi.mock("../../api/activity", async (importOriginal) => ({
  ...(await importOriginal<typeof activityApi>()),
  getApplicantActivityPage: vi.fn(),
}));

const getWorkspace = vi.mocked(getApplicantWorkspace);

function proposedWorkspace(
  viewing: ViewingSnapshot = viewingSnapshot(),
  asOf?: string,
): ApplicantWorkspace {
  return createWorkspace(
    {
      attention: {
        pendingActions: [
          {
            type: "RESPOND_TO_VIEWING",
            source: "VIEWING",
            target: { viewingId: viewing.viewingId },
          },
        ],
      },
      viewingSummary: {
        current: viewing,
        latest: viewing,
        nextAction: viewing.nextAction,
      },
    },
    asOf,
  );
}

function completedWorkspace(): ApplicantWorkspace {
  const completed = viewingSnapshot({
    status: "COMPLETED",
    nextAction: "APPLICANT_CONFIRM_POST_VIEWING_INTEREST",
    effectiveOutcome: "COMPLETED",
    capabilities: {
      canAccept: false,
      canDecline: false,
      canRequestAnotherTime: false,
      canSubmitInterest: true,
    },
  });
  return createWorkspace({
    attention: {
      pendingActions: [
        {
          type: "CONFIRM_POST_VIEWING_INTEREST",
          source: "VIEWING",
          target: { viewingId: completed.viewingId },
        },
      ],
    },
    viewingSummary: {
      latest: completed,
      latestCompleted: completed,
      pendingInterest: completed,
      nextAction: "APPLICANT_CONFIRM_POST_VIEWING_INTEREST",
    },
  });
}

function viewingRegion() {
  return screen.findByRole("region", { name: "Besichtigung" });
}

beforeEach(() => {
  window.history.replaceState(
    window.history.state,
    "",
    "/applicant/applications/test",
  );
  vi.clearAllMocks();
  vi.mocked(getViewingDetail).mockResolvedValue({
    viewingId: "viewing-1",
    applicationId: APPLICATION_ID,
    providerNote: "Bitte bei „Verwaltung“ klingeln.",
    changeRequestMessage: null,
  });
  vi.mocked(acceptViewing).mockResolvedValue(undefined);
  vi.mocked(declineViewing).mockResolvedValue(undefined);
  vi.mocked(requestAnotherViewingTime).mockResolvedValue(undefined);
  vi.mocked(submitViewingInterest).mockResolvedValue(undefined);
});

describe("ApplicationWorkspace viewing", () => {
  it("keeps successful viewing controls blocked after a failed refresh and an identical accepted retry", async () => {
    const user = userEvent.setup();
    const workspace = proposedWorkspace();
    let finishRetry: (value: ApplicantWorkspace) => void = () => undefined;
    getWorkspace
      .mockResolvedValueOnce(workspace)
      .mockRejectedValueOnce(new ApiError(503, "internal"))
      .mockReturnValueOnce(
        new Promise((resolve) => {
          finishRetry = resolve;
        }),
      );
    render(<ApplicationWorkspace applicationId={APPLICATION_ID} />);
    const region = await viewingRegion();
    await user.click(
      within(region).getByRole("button", { name: "Termin annehmen" }),
    );
    await screen.findByText(/Der aktuelle Stand konnte nicht geladen werden/);
    expect(
      within(region).getByRole("button", { name: "Termin annehmen" }),
    ).toHaveProperty("disabled", true);
    expect(
      within(region).getByRole("button", { name: "Ablehnen" }),
    ).toHaveProperty("disabled", true);
    expect(
      within(region).getByRole("button", { name: "Andere Zeit anfragen" }),
    ).toHaveProperty("disabled", true);
    await user.click(
      within(region).getByRole("button", { name: "Termin annehmen" }),
    );
    expect(acceptViewing).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole("button", { name: "Erneut versuchen" }));
    expect(
      within(region).getByRole("button", { name: "Termin annehmen" }),
    ).toHaveProperty("disabled", true);
    await act(async () => {
      finishRetry(workspace);
    });
    await waitFor(() =>
      expect(
        within(region).getByRole("button", { name: "Termin annehmen" }),
      ).toHaveProperty("disabled", true),
    );
    expect(workspace.viewingSummary.current?.capabilities.canAccept).toBe(true);
  });

  it("shows the proposed viewing with the provider note", async () => {
    getWorkspace.mockResolvedValue(proposedWorkspace());

    render(<ApplicationWorkspace applicationId={APPLICATION_ID} />);
    const region = await viewingRegion();

    expect(within(region).getByText("Vorgeschlagen")).toBeTruthy();
    expect(
      within(region).getByText("Donnerstag, 8. Oktober 2026"),
    ).toBeTruthy();
    expect(within(region).getByText(/17:30 – 18:00 Uhr/)).toBeTruthy();
    expect(
      await within(region).findByText("Bitte bei „Verwaltung“ klingeln."),
    ).toBeTruthy();
  });

  it("accepts a viewing and refreshes the workspace", async () => {
    const user = userEvent.setup();
    getWorkspace
      .mockResolvedValueOnce(proposedWorkspace())
      .mockResolvedValueOnce(createWorkspace({}, "2026-10-04T09:25:00.000Z"));

    render(<ApplicationWorkspace applicationId={APPLICATION_ID} />);
    await user.click(
      within(await viewingRegion()).getByRole("button", {
        name: "Termin annehmen",
      }),
    );

    expect(acceptViewing).toHaveBeenCalledWith(APPLICATION_ID, "viewing-1");
    await waitFor(() => expect(getWorkspace).toHaveBeenCalledTimes(2));
  });

  it("declines only after an explicit confirmation", async () => {
    const user = userEvent.setup();
    getWorkspace.mockResolvedValue(proposedWorkspace());

    render(<ApplicationWorkspace applicationId={APPLICATION_ID} />);
    const region = await viewingRegion();
    await user.click(within(region).getByRole("button", { name: "Ablehnen" }));
    expect(declineViewing).not.toHaveBeenCalled();

    const group = within(region).getByRole("group", {
      name: "Termin ablehnen?",
    });
    await user.click(
      within(group).getByRole("button", { name: "Termin ablehnen" }),
    );

    expect(declineViewing).toHaveBeenCalledWith(APPLICATION_ID, "viewing-1");
  });

  it("requests another time with an optional message", async () => {
    const user = userEvent.setup();
    getWorkspace.mockResolvedValue(proposedWorkspace());

    render(<ApplicationWorkspace applicationId={APPLICATION_ID} />);
    const region = await viewingRegion();
    await user.click(
      within(region).getByRole("button", { name: "Andere Zeit anfragen" }),
    );
    await user.type(
      within(region).getByRole("textbox", {
        name: "Nachricht an den Anbieter (optional)",
      }),
      "Ab 18 Uhr",
    );
    await user.click(
      within(region).getByRole("button", { name: "Anfrage senden" }),
    );

    expect(requestAnotherViewingTime).toHaveBeenCalledWith(
      APPLICATION_ID,
      "viewing-1",
      "Ab 18 Uhr",
    );
  });

  it("only offers the actions the backend allows", async () => {
    getWorkspace.mockResolvedValue(
      proposedWorkspace(
        viewingSnapshot({
          status: "ACCEPTED",
          nextAction: "NONE",
          capabilities: {
            canAccept: false,
            canDecline: true,
            canRequestAnotherTime: false,
            canSubmitInterest: false,
          },
        }),
      ),
    );

    render(<ApplicationWorkspace applicationId={APPLICATION_ID} />);
    const region = await viewingRegion();

    expect(
      within(region).queryByRole("button", { name: "Termin annehmen" }),
    ).toBeNull();
    expect(
      within(region).queryByRole("button", { name: "Andere Zeit anfragen" }),
    ).toBeNull();
    expect(
      within(region).getByRole("button", { name: "Ablehnen" }),
    ).toBeTruthy();
  });

  it("shows a safe error when a viewing response fails", async () => {
    const user = userEvent.setup();
    getWorkspace.mockResolvedValue(proposedWorkspace());
    vi.mocked(acceptViewing).mockRejectedValue(new Error("409 VIEWING_STALE"));

    render(<ApplicationWorkspace applicationId={APPLICATION_ID} />);
    const region = await viewingRegion();
    await user.click(
      within(region).getByRole("button", { name: "Termin annehmen" }),
    );

    expect(
      await within(region).findByText(
        "Deine Rückmeldung konnte nicht gesendet werden. Bitte versuche es erneut.",
      ),
    ).toBeTruthy();
    expect(screen.queryByText(/VIEWING_STALE/)).toBeNull();
  });

  it("confirms post-viewing interest in two deliberate steps", async () => {
    const user = userEvent.setup();
    getWorkspace.mockResolvedValue(completedWorkspace());

    render(<ApplicationWorkspace applicationId={APPLICATION_ID} />);
    const panel = await screen.findByRole("region", {
      name: "Dein nächster Schritt",
    });
    const choices = within(panel).getByRole("group", {
      name: "Bist du weiterhin interessiert?",
    });
    await user.click(
      within(choices).getByRole("button", {
        name: "Ja, weiterhin interessiert",
      }),
    );
    expect(submitViewingInterest).not.toHaveBeenCalled();
    expect(
      within(panel).getByText("Deine Antwort: Ja, weiterhin interessiert"),
    ).toBeTruthy();

    await user.click(
      within(panel).getByRole("button", { name: "Antwort senden" }),
    );

    expect(submitViewingInterest).toHaveBeenCalledWith(
      APPLICATION_ID,
      "viewing-1",
      "STILL_INTERESTED",
    );
  });

  it("does not show the interest prompt without backend capability", async () => {
    const workspace = completedWorkspace();
    const completed = viewingSnapshot({
      status: "COMPLETED",
      capabilities: {
        canAccept: false,
        canDecline: false,
        canRequestAnotherTime: false,
        canSubmitInterest: false,
      },
    });
    getWorkspace.mockResolvedValue({
      ...workspace,
      viewingSummary: {
        ...workspace.viewingSummary,
        latest: completed,
        latestCompleted: completed,
        pendingInterest: completed,
      },
    });

    render(<ApplicationWorkspace applicationId={APPLICATION_ID} />);
    await screen.findByRole("region", { name: "Dein nächster Schritt" });

    expect(
      screen.queryByRole("button", { name: "Ja, weiterhin interessiert" }),
    ).toBeNull();
  });
});

function activity(id: string, type: ActivityItem["type"]): ActivityItem {
  return {
    id,
    type,
    actorType: "PROVIDER",
    occurredAt: "2026-09-29T08:12:00.000Z",
    payload: null,
  };
}

function activityPage(
  items: readonly ActivityItem[],
  nextCursor: string | null,
  totalCount: number,
): ActivityPage {
  return {
    asOf: "2026-10-04T09:20:00.000Z",
    items: [...items],
    pagination: { limit: 20, hasMore: nextCursor !== null, nextCursor },
    totalCount,
  };
}

describe("ApplicationWorkspace history", () => {
  const preview = [
    activity("a-5", "MESSAGE_SENT"),
    activity("a-4", "VIEWING_PROPOSED"),
    activity("a-3", "DOCUMENT_REQUESTED"),
    activity("a-2", "APPLICATION_PROMOTED_TO_ACTIVE"),
    activity("a-1", "APPLICATION_SUBMITTED"),
  ];

  it("keeps Verlauf collapsed on the latest activity", async () => {
    getWorkspace.mockResolvedValue(
      createWorkspace({ activityPreview: { items: preview, hasMore: false } }),
    );

    render(<ApplicationWorkspace applicationId={APPLICATION_ID} />);
    const region = await screen.findByRole("region", { name: "Verlauf" });
    const toggle = within(region).getByRole("button", {
      name: /Letzter Eintrag/,
    });

    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(toggle.textContent).toContain(
      "Letzter Eintrag: Nachricht vom Anbieter erhalten",
    );
    expect(toggle.textContent).toContain(
      formatCardSchedule("2026-09-29T08:12:00.000Z"),
    );
    expect(
      within(region).queryByText("In den aktiven Prozess aufgenommen"),
    ).toBeNull();
    expect(within(region).queryByText(/PROVIDER|APPLICANT|SYSTEM/)).toBeNull();
    expect(within(region).queryByText(/2026-09-29T/)).toBeNull();
    expect(region.querySelector(".overflow-y-auto")).toBeNull();
  });

  it("loads the full history with cursor pagination", async () => {
    const user = userEvent.setup();
    getWorkspace.mockResolvedValue(
      createWorkspace({ activityPreview: { items: preview, hasMore: true } }),
    );
    vi.mocked(getApplicantActivityPage)
      .mockResolvedValueOnce(
        activityPage(
          [...preview, activity("a-0", "CONVERSATION_OPENED")],
          "cursor-2",
          7,
        ),
      )
      .mockResolvedValueOnce(
        activityPage([activity("a-00", "DOCUMENT_REVIEWED")], null, 7),
      );

    render(<ApplicationWorkspace applicationId={APPLICATION_ID} />);
    const region = await screen.findByRole("region", { name: "Verlauf" });
    const toggle = within(region).getByRole("button", {
      name: /Letzter Eintrag/,
    });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    await user.click(toggle);

    expect(
      await within(region).findByText("Unterhaltung begonnen"),
    ).toBeTruthy();
    expect(
      within(region).getAllByText("29.09.2026 · 10:12").length,
    ).toBeGreaterThan(0);
    await user.click(
      within(region).getByRole("button", { name: "Weitere laden" }),
    );

    expect(await within(region).findByText("Unterlage geprüft")).toBeTruthy();
    expect(getApplicantActivityPage).toHaveBeenLastCalledWith(
      APPLICATION_ID,
      "cursor-2",
    );
    expect(
      within(region).queryByRole("button", {
        name: "Weitere laden",
      }),
    ).toBeNull();
    await user.click(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(within(region).queryByText("Unterlage geprüft")).toBeNull();
  });

  it("drops an activity page that belongs to an outdated workspace snapshot", async () => {
    const user = userEvent.setup();
    let resolveStale: (page: ActivityPage) => void = () => undefined;
    vi.mocked(getApplicantActivityPage)
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveStale = resolve;
        }),
      )
      .mockResolvedValueOnce(
        activityPage([activity("fresh", "VIEWING_ACCEPTED")], null, 1),
      );
    const workspace = proposedWorkspace(
      viewingSnapshot(),
      "2026-10-04T09:20:00.000Z",
    );
    getWorkspace
      .mockResolvedValueOnce({
        ...workspace,
        activityPreview: { items: preview, hasMore: true },
      })
      .mockResolvedValueOnce(
        createWorkspace(
          { activityPreview: { items: preview, hasMore: true } },
          "2026-10-04T09:40:00.000Z",
        ),
      );

    render(<ApplicationWorkspace applicationId={APPLICATION_ID} />);
    const region = await screen.findByRole("region", { name: "Verlauf" });
    await user.click(
      within(region).getByRole("button", { name: /Letzter Eintrag/ }),
    );
    await user.click(
      within(await viewingRegion()).getByRole("button", {
        name: "Termin annehmen",
      }),
    );

    expect(
      await within(region).findByText("Besichtigung angenommen"),
    ).toBeTruthy();
    await act(async () => {
      resolveStale(
        activityPage([activity("stale", "VIEWING_DECLINED")], null, 1),
      );
    });

    expect(within(region).queryByText("Besichtigung abgelehnt")).toBeNull();
    expect(within(region).getByText("Besichtigung angenommen")).toBeTruthy();
    expect(
      within(region)
        .getByRole("button", { name: /Letzter Eintrag/ })
        .getAttribute("aria-expanded"),
    ).toBe("true");
    expect(
      within(region).queryByRole("button", { name: "Termin annehmen" }),
    ).toBeNull();
  });

  it("opens an empty Verlauf without inventing entries", async () => {
    const user = userEvent.setup();
    getWorkspace.mockResolvedValue(createWorkspace());
    vi.mocked(getApplicantActivityPage).mockResolvedValue(
      activityPage([], null, 0),
    );

    render(<ApplicationWorkspace applicationId={APPLICATION_ID} />);
    const region = await screen.findByRole("region", { name: "Verlauf" });
    const toggle = within(region).getByRole("button", { name: /Verlauf/ });

    expect(toggle.textContent).toContain("Keine Einträge");
    expect(within(region).queryByText("Noch keine Einträge.")).toBeNull();
    await user.click(toggle);
    expect(within(region).getByText("Noch keine Einträge.")).toBeTruthy();
    expect(within(region).queryByRole("listitem")).toBeNull();
  });

  it("auto-expands and pages until a linked activity is shown", async () => {
    window.history.replaceState(
      window.history.state,
      "",
      `/applicant/applications/${APPLICATION_ID}?section=activity&activityId=a-00`,
    );
    getWorkspace.mockResolvedValue(
      createWorkspace({ activityPreview: { items: preview, hasMore: true } }),
    );
    vi.mocked(getApplicantActivityPage)
      .mockResolvedValueOnce(activityPage(preview, "cursor-2", 7))
      .mockResolvedValueOnce(
        activityPage([activity("a-00", "DOCUMENT_REVIEWED")], null, 7),
      );

    render(<ApplicationWorkspace applicationId={APPLICATION_ID} />);
    const region = await screen.findByRole("region", { name: "Verlauf" });
    const row = await within(region).findByText("Unterlage geprüft");

    expect(
      within(region)
        .getByRole("button", { name: /Letzter Eintrag/ })
        .getAttribute("aria-expanded"),
    ).toBe("true");
    expect(row.closest("li")?.getAttribute("data-activity-id")).toBe("a-00");
    await waitFor(() => {
      expect(row.closest("li")?.className).toContain("ring-primary");
    });
    expect(getApplicantActivityPage).toHaveBeenLastCalledWith(
      APPLICATION_ID,
      "cursor-2",
    );
  });

  it("leaves Verlauf open when the linked activity is not in the loaded pages", async () => {
    window.history.replaceState(
      window.history.state,
      "",
      `/applicant/applications/${APPLICATION_ID}?section=activity&activityId=missing`,
    );
    getWorkspace.mockResolvedValue(
      createWorkspace({ activityPreview: { items: preview, hasMore: true } }),
    );
    vi.mocked(getApplicantActivityPage).mockResolvedValue(
      activityPage(preview, null, preview.length),
    );

    render(<ApplicationWorkspace applicationId={APPLICATION_ID} />);
    const region = await screen.findByRole("region", { name: "Verlauf" });

    await waitFor(() => {
      expect(within(region).getAllByRole("listitem").length).toBeGreaterThan(0);
    });
    expect(
      within(region)
        .getByRole("button", { name: /Letzter Eintrag/ })
        .getAttribute("aria-expanded"),
    ).toBe("true");
    expect(within(region).queryByText("missing")).toBeNull();
    expect(
      within(region).queryByRole("button", { name: "Weitere laden" }),
    ).toBeNull();
  });
});

describe("viewing detail recovery", () => {
  it("distinguishes a failed detail load and allows retry", async () => {
    const user = userEvent.setup();
    getWorkspace.mockResolvedValue(proposedWorkspace());
    vi.mocked(getViewingDetail).mockRejectedValueOnce(
      new Error("internal detail"),
    );
    render(<ApplicationWorkspace applicationId={APPLICATION_ID} />);
    const region = await viewingRegion();
    await within(region).findByText(
      "Die zusätzlichen Termindetails konnten nicht geladen werden.",
    );
    expect(screen.queryByText("internal detail")).toBeNull();
    await user.click(
      within(region).getByRole("button", { name: "Erneut versuchen" }),
    );
    await waitFor(() =>
      expect(
        within(region).queryByText(
          "Die zusätzlichen Termindetails konnten nicht geladen werden.",
        ),
      ).toBeNull(),
    );
    expect(getViewingDetail).toHaveBeenCalledTimes(2);
    expect(getWorkspace).toHaveBeenCalledOnce();
  });
});
