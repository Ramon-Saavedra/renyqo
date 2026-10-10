import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/client";
import { withdrawListingApplication } from "@/features/applicant/listings/api/listing-withdrawal";
import { loadCompleteConversation } from "../../api/conversation";
import type * as conversationApi from "../../api/conversation";
import type * as documentsApi from "../../api/documents";
import { ApplicantApplicationNotFoundError } from "../../api/errors";
import type * as viewingsApi from "../../api/viewings";
import {
  getApplicantWorkspace,
  type ApplicantWorkspace,
} from "../../api/workspace";
import type * as workspaceApi from "../../api/workspace";
import {
  APPLICATION_ID,
  AS_OF,
  createWorkspace,
  viewingSnapshot,
} from "../../testing/fixtures";
import { ApplicationWorkspace } from "./ApplicationWorkspace";

vi.mock("../../api/workspace", async (importOriginal) => ({
  ...(await importOriginal<typeof workspaceApi>()),
  getApplicantWorkspace: vi.fn(),
}));

vi.mock("../../api/conversation", async (importOriginal) => ({
  ...(await importOriginal<typeof conversationApi>()),
  loadCompleteConversation: vi.fn().mockResolvedValue({
    messages: [],
    capabilities: {
      isOpen: false,
      canCurrentUserSend: false,
      expectedResponder: null,
    },
  }),
  sendConversationMessage: vi.fn(),
  markConversationRead: vi.fn(),
}));

vi.mock("../../api/documents", async (importOriginal) => ({
  ...(await importOriginal<typeof documentsApi>()),
  getDocumentRequestTimelines: vi.fn().mockResolvedValue(new Map()),
  uploadRequestedDocument: vi.fn(),
  downloadDocumentContent: vi.fn(),
}));

vi.mock("../../api/viewings", async (importOriginal) => ({
  ...(await importOriginal<typeof viewingsApi>()),
  getViewingDetail: vi.fn().mockRejectedValue(new Error("not needed")),
  acceptViewing: vi.fn(),
  declineViewing: vi.fn(),
  requestAnotherViewingTime: vi.fn(),
  submitViewingInterest: vi.fn(),
}));

vi.mock("../../api/activity", () => ({
  getApplicantActivityPage: vi.fn(),
}));

vi.mock("@/features/applicant/listings/api/listing-withdrawal", () => ({
  withdrawListingApplication: vi.fn(),
}));

const getWorkspace = vi.mocked(getApplicantWorkspace);

function renderWorkspace(workspace: ApplicantWorkspace) {
  getWorkspace.mockResolvedValue(workspace);
  return render(<ApplicationWorkspace applicationId={APPLICATION_ID} />);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ApplicationWorkspace states", () => {
  it("renders the WAITING state without process actions or fake review language", async () => {
    renderWorkspace(
      createWorkspace({
        application: { status: "WAITING", activeAt: null },
        conversationSummary: { isOpen: false, isReadOnly: true },
      }),
    );

    expect(
      await screen.findByRole("heading", {
        name: "Du bist auf der Warteliste",
      }),
    ).toBeTruthy();
    expect(screen.queryByText("Dein nächster Schritt")).toBeNull();
    expect(screen.queryByText(/prüft deine Bewerbung/)).toBeNull();
    expect(
      await screen.findByText(
        "Während du auf der Warteliste stehst, ist keine Unterhaltung möglich.",
      ),
    ).toBeTruthy();
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.queryByRole("button", { name: /hochladen/ })).toBeNull();
    expect(screen.getByText("Jederzeit zurückziehbar")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Bewerbung zurückziehen" }),
    ).toBeTruthy();
    expect(loadCompleteConversation).toHaveBeenCalledOnce();
  });

  it("hides withdrawal when the backend does not allow it", async () => {
    renderWorkspace(
      createWorkspace({
        application: { status: "WAITING", activeAt: null },
        capabilities: { canWithdraw: false },
      }),
    );

    await screen.findByRole("heading", { name: "Du bist auf der Warteliste" });
    expect(screen.queryByText("Jederzeit zurückziehbar")).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Bewerbung zurückziehen" }),
    ).toBeNull();
  });

  it("drives the ACTIVE next step from backend pending actions in backend order", async () => {
    renderWorkspace(
      createWorkspace({
        attention: {
          pendingActions: [
            {
              type: "UPLOAD_REQUESTED_DOCUMENT",
              source: "DOCUMENT",
              target: { requestId: "request-2" },
            },
            {
              type: "RESPOND_TO_VIEWING",
              source: "VIEWING",
              target: { viewingId: "viewing-1" },
            },
          ],
          pendingActionCount: 2,
          hasPendingAction: true,
        },
        documentsSummary: {
          currentRequests: [
            {
              requestId: "request-2",
              type: "INCOME_PROOF",
              customLabel: null,
              status: "UPLOAD_REQUIRED",
              documentId: null,
              canDownload: false,
              canUpload: true,
            },
          ],
        },
        viewingSummary: {
          current: viewingSnapshot(),
          latest: viewingSnapshot(),
          nextAction: "APPLICANT_RESPOND_TO_VIEWING",
        },
      }),
    );

    const panel = await screen.findByRole("region", {
      name: "Dein nächster Schritt",
    });
    expect(
      within(panel).getByText("Einkommensnachweis hochladen"),
    ).toBeTruthy();
    expect(within(panel).getByText("2 offene Schritte")).toBeTruthy();
    expect(within(panel).getByText("Ebenfalls offen")).toBeTruthy();
    expect(
      within(panel).getByRole("button", { name: /Besichtigung bestätigen/ }),
    ).toBeTruthy();
  });

  it("gives every interactive control an accessible name", async () => {
    vi.mocked(loadCompleteConversation).mockResolvedValueOnce({
      messages: [],
      capabilities: {
        isOpen: true,
        canCurrentUserSend: true,
        expectedResponder: "APPLICANT",
      },
    });
    renderWorkspace(
      createWorkspace({
        attention: {
          pendingActions: [
            { type: "RESPOND_TO_MESSAGE", source: "CONVERSATION" },
            {
              type: "RESPOND_TO_VIEWING",
              source: "VIEWING",
              target: { viewingId: "viewing-1" },
            },
          ],
        },
        conversationSummary: { isOpen: true, canCurrentUserSend: true },
        viewingSummary: {
          current: viewingSnapshot(),
          latest: viewingSnapshot(),
        },
      }),
    );

    await screen.findByRole("region", { name: "Dein nächster Schritt" });
    await screen.findByRole("textbox", { name: "Antwort an den Anbieter" });
    const controls = [
      ...screen.getAllByRole("button"),
      ...screen.getAllByRole("link"),
      ...screen.getAllByRole("textbox"),
    ];
    for (const control of controls) {
      const name =
        control.getAttribute("aria-label") ??
        (control.id
          ? document.querySelector(`label[for="${control.id}"]`)?.textContent
          : null) ??
        control.textContent;
      expect(name?.trim()).toBeTruthy();
    }
    for (const control of screen.getAllByRole("link")) {
      expect(within(control).queryAllByRole("button")).toHaveLength(0);
    }
  });

  it("shows a calm state when ACTIVE has no pending action", async () => {
    renderWorkspace(createWorkspace());

    expect(
      await screen.findByRole("heading", { name: "Keine offene Aktion" }),
    ).toBeTruthy();
    expect(screen.getByText("Aktuell ist nichts von dir zu tun.")).toBeTruthy();
  });

  it("renders ACCEPTED as read-only without invented contract steps", async () => {
    renderWorkspace(
      createWorkspace({
        application: { status: "ACCEPTED" },
        conversationSummary: { isOpen: true, isReadOnly: true },
        capabilities: { canWithdraw: false },
      }),
    );

    expect(
      await screen.findByRole("heading", {
        name: "Der Anbieter hat sich für dich entschieden",
      }),
    ).toBeTruthy();
    expect(screen.queryByText(/Vertrag/)).toBeNull();
    expect(screen.queryByText("Dein nächster Schritt")).toBeNull();
    expect(
      await screen.findByText("Diese Unterhaltung ist abgeschlossen."),
    ).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: "Bewerbung zurückziehen" }),
    ).toBeNull();
  });

  it("renders REJECTED with the safe public reason only", async () => {
    renderWorkspace(
      createWorkspace({
        application: {
          status: "REJECTED",
          rejectedAt: "2026-09-12T08:05:00.000Z",
          publicReason: "LISTING_RENTED",
        },
        conversationSummary: { isReadOnly: true },
        capabilities: { canWithdraw: false },
      }),
    );

    expect(
      await screen.findByRole("heading", { name: "Absage für diese Wohnung" }),
    ).toBeTruthy();
    expect(screen.getByText("Die Wohnung ist bereits vermietet.")).toBeTruthy();
    expect(screen.getByText("Absage am")).toBeTruthy();
    expect(
      screen.getByRole("link", { name: /Weitere Wohnungen finden/ }),
    ).toBeTruthy();
  });

  it("renders WITHDRAWN as read-only history", async () => {
    renderWorkspace(
      createWorkspace({
        application: {
          status: "WITHDRAWN",
          withdrawnAt: "2026-08-22T18:15:00.000Z",
        },
        conversationSummary: { isReadOnly: true },
        capabilities: { canWithdraw: false },
      }),
    );

    expect(
      await screen.findByRole("heading", { name: "Bewerbung zurückgezogen" }),
    ).toBeTruthy();
    expect(screen.getByText(/am 22\.08\.2026 zurückgezogen/)).toBeTruthy();
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("shows a not-found state with a way back", async () => {
    getWorkspace.mockRejectedValue(new ApplicantApplicationNotFoundError());
    render(<ApplicationWorkspace applicationId={APPLICATION_ID} />);

    expect(await screen.findByText("Bewerbung nicht gefunden")).toBeTruthy();
    expect(
      within(screen.getByRole("alert"))
        .getByRole("link", { name: "Meine Bewerbungen" })
        .getAttribute("href"),
    ).toBe("/applicant/applications");
  });
});

describe("ApplicationWorkspace withdrawal", () => {
  it.each(["failed", "cancelled", "discarded"] as const)(
    "keeps withdrawal blocked after a %s refresh until a later snapshot is accepted",
    async (outcome) => {
      const user = userEvent.setup();
      let resolveRefresh: (workspace: ApplicantWorkspace) => void = () =>
        undefined;
      let rejectRefresh: (error: Error) => void = () => undefined;
      getWorkspace
        .mockResolvedValueOnce(createWorkspace())
        .mockReturnValueOnce(
          new Promise((resolve, reject) => {
            resolveRefresh = resolve;
            rejectRefresh = reject;
          }),
        )
        .mockResolvedValueOnce(createWorkspace());
      vi.mocked(withdrawListingApplication).mockResolvedValue({
        id: APPLICATION_ID,
        listingId: "listing-1",
        status: "WITHDRAWN",
        rejectedAt: null,
        publicReason: null,
        createdAt: AS_OF,
        updatedAt: AS_OF,
      });
      render(<ApplicationWorkspace applicationId={APPLICATION_ID} />);
      const trigger = await screen.findByRole("button", {
        name: "Bewerbung zurückziehen",
      });
      await user.click(trigger);
      await user.click(
        within(screen.getByRole("dialog")).getByRole("button", {
          name: "Bewerbung zurückziehen",
        }),
      );
      await waitFor(() => expect(getWorkspace).toHaveBeenCalledTimes(2));
      expect(trigger.hasAttribute("disabled")).toBe(true);
      await user.click(trigger);
      expect(screen.queryByRole("dialog")).toBeNull();
      await act(async () => {
        if (outcome === "discarded")
          resolveRefresh(createWorkspace({}, "2020-01-01T00:00:00.000Z"));
        else
          rejectRefresh(
            outcome === "cancelled"
              ? new ApiError(0, "cancelled", "cancelled")
              : new Error("refresh failed"),
          );
      });
      expect(trigger.hasAttribute("disabled")).toBe(true);
      expect(withdrawListingApplication).toHaveBeenCalledOnce();
      if (outcome === "cancelled") {
        act(() => window.dispatchEvent(new Event("focus")));
      } else {
        await user.click(
          screen.getByRole("button", { name: "Erneut versuchen" }),
        );
      }
      await waitFor(() => expect(trigger.hasAttribute("disabled")).toBe(false));
      await user.click(trigger);
      await user.click(
        within(screen.getByRole("dialog")).getByText("Abbrechen"),
      );
      await user.click(trigger);
      await user.click(
        within(screen.getByRole("dialog")).getByRole("button", {
          name: "Bewerbung zurückziehen",
        }),
      );
      await waitFor(() =>
        expect(withdrawListingApplication).toHaveBeenCalledTimes(2),
      );
    },
  );
  it("confirms, withdraws and refreshes the workspace", async () => {
    const user = userEvent.setup();
    getWorkspace.mockResolvedValueOnce(createWorkspace()).mockResolvedValueOnce(
      createWorkspace(
        {
          application: {
            status: "WITHDRAWN",
            withdrawnAt: "2026-10-04T09:25:00.000Z",
          },
          conversationSummary: { isReadOnly: true },
          capabilities: { canWithdraw: false },
        },
        "2026-10-04T09:25:00.000Z",
      ),
    );
    vi.mocked(withdrawListingApplication).mockResolvedValue({
      id: APPLICATION_ID,
      listingId: "listing-1",
      status: "WITHDRAWN",
      rejectedAt: null,
      publicReason: null,
      createdAt: AS_OF,
      updatedAt: AS_OF,
    });
    render(<ApplicationWorkspace applicationId={APPLICATION_ID} />);

    await user.click(
      await screen.findByRole("button", { name: "Bewerbung zurückziehen" }),
    );
    const dialog = screen.getByRole("dialog", {
      name: "Bewerbung zurückziehen?",
    });
    expect(withdrawListingApplication).not.toHaveBeenCalled();

    await user.click(
      within(dialog).getByRole("button", { name: "Bewerbung zurückziehen" }),
    );

    expect(withdrawListingApplication).toHaveBeenCalledWith(APPLICATION_ID);
    expect(
      await screen.findByRole("heading", { name: "Bewerbung zurückgezogen" }),
    ).toBeTruthy();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(getWorkspace).toHaveBeenCalledTimes(2);
  });

  it("keeps the dialog open with a safe message when withdrawal fails", async () => {
    const user = userEvent.setup();
    renderWorkspace(createWorkspace());
    vi.mocked(withdrawListingApplication).mockRejectedValue(
      new Error("internal stack trace"),
    );

    await user.click(
      await screen.findByRole("button", { name: "Bewerbung zurückziehen" }),
    );
    const dialog = screen.getByRole("dialog");
    await user.click(
      within(dialog).getByRole("button", { name: "Bewerbung zurückziehen" }),
    );

    expect(
      await within(dialog).findByText(
        "Deine Bewerbung konnte nicht zurückgezogen werden. Bitte versuche es erneut.",
      ),
    ).toBeTruthy();
    expect(screen.queryByText("internal stack trace")).toBeNull();
    vi.mocked(withdrawListingApplication).mockResolvedValue({
      id: APPLICATION_ID,
      listingId: "listing-1",
      status: "WITHDRAWN",
      rejectedAt: null,
      publicReason: null,
      createdAt: AS_OF,
      updatedAt: AS_OF,
    });
    await user.click(
      within(dialog).getByRole("button", { name: "Bewerbung zurückziehen" }),
    );
    await waitFor(() =>
      expect(withdrawListingApplication).toHaveBeenCalledTimes(2),
    );
  });
});

describe("ApplicationWorkspace snapshots", () => {
  it("keeps the newest snapshot when a refresh returns older data", async () => {
    let resolveRefresh: (workspace: ApplicantWorkspace) => void = () =>
      undefined;
    getWorkspace
      .mockResolvedValueOnce(
        createWorkspace(
          { application: { status: "WAITING", activeAt: null } },
          "2026-10-04T09:30:00.000Z",
        ),
      )
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveRefresh = resolve;
        }),
      );
    const user = userEvent.setup();
    vi.mocked(withdrawListingApplication).mockResolvedValue({
      id: APPLICATION_ID,
      listingId: "listing-1",
      status: "WITHDRAWN",
      rejectedAt: null,
      publicReason: null,
      createdAt: AS_OF,
      updatedAt: AS_OF,
    });
    render(<ApplicationWorkspace applicationId={APPLICATION_ID} />);

    await user.click(
      await screen.findByRole("button", { name: "Bewerbung zurückziehen" }),
    );
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Bewerbung zurückziehen",
      }),
    );
    await waitFor(() => expect(getWorkspace).toHaveBeenCalledTimes(2));

    await act(async () => {
      resolveRefresh(createWorkspace({}, "2026-10-04T09:00:00.000Z"));
    });

    expect(
      screen.getByRole("heading", { name: "Du bist auf der Warteliste" }),
    ).toBeTruthy();
    expect(
      screen.queryByRole("heading", { name: "Keine offene Aktion" }),
    ).toBeNull();
  });
});
