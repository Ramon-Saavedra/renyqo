import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getActivityPage } from "../api/activity";
import {
  getConversationHistory,
  markConversationRead,
  sendConversationMessage,
} from "../api/conversation";
import type * as conversationApi from "../api/conversation";
import {
  cancelDocumentRequest,
  createDocumentRequests,
} from "../api/documents";
import { proposeViewing } from "../api/viewings";
import { selectApplicationForRental } from "../api/select-tenant";
import {
  getApplicantWorkspace,
  type ApplicantWorkspace,
} from "../api/workspace";
import type * as workspaceApi from "../api/workspace";
import { createApplicantWorkspace } from "../testing/workspace-fixture";
import type { WorkflowListingContext } from "../workflow-model";
import { useWorkflowSession, WorkflowSession } from "../workflow-session";
import { ActivitySection } from "./ActivitySection";
import { ApplicantWorkflowModal } from "./ApplicantWorkflowModal";

vi.mock("../api/workspace", async (importOriginal) => {
  const actual = await importOriginal<typeof workspaceApi>();
  return {
    ...actual,
    getApplicantWorkspace: vi.fn(),
  };
});

vi.mock("../api/conversation", async (importOriginal) => {
  const actual = await importOriginal<typeof conversationApi>();
  return {
    ...actual,
    getConversationHistory: vi.fn().mockResolvedValue({
      applicationId: "application-1",
      conversationId: null,
      openedAt: null,
      isOpen: false,
      canCurrentUserSend: false,
      expectedResponder: null,
      unreadCount: 0,
      lastMessage: null,
      messages: [],
      hasMore: false,
      nextAfterSequence: null,
    }),
    sendConversationMessage: vi.fn(),
    markConversationRead: vi.fn(),
  };
});

vi.mock("../api/select-tenant", () => ({
  selectApplicationForRental: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../api/activity", () => ({
  getActivityPage: vi.fn(),
}));

vi.mock("../api/viewings", () => ({
  proposeViewing: vi.fn(),
  rescheduleViewing: vi.fn(),
  cancelViewing: vi.fn(),
  completeViewing: vi.fn(),
  markViewingNoShow: vi.fn(),
}));

vi.mock("../api/documents", () => ({
  listDocumentRequests: vi.fn().mockResolvedValue([]),
  cancelDocumentRequest: vi.fn(),
  createDocumentRequests: vi.fn(),
  openDocumentContent: vi.fn(),
  requestDocumentReplacement: vi.fn(),
  reviewDocument: vi.fn(),
}));

const listing: WorkflowListingContext = {
  id: "object-1",
  title: "2-Zimmer-Wohnung in Berlin-Mitte",
  city: "Berlin-Mitte",
  coldRent: 900,
  status: "published",
  rooms: "2",
  livingArea: 60,
};

function mockViewport(compact: boolean) {
  vi.spyOn(window, "matchMedia").mockImplementation((query) => ({
    matches: compact,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

async function renderModal(
  introduction: string | null = "Wir suchen langfristig eine ruhige Wohnung.",
  activeAt: string | null = "2026-09-27T08:00:00.000Z",
) {
  vi.mocked(getApplicantWorkspace).mockResolvedValue(
    createApplicantWorkspace(
      "application-1",
      "Maria Schneider",
      introduction,
      activeAt,
    ),
  );
  vi.mocked(getConversationHistory).mockResolvedValue({
    applicationId: "application-1",
    conversationId: null,
    openedAt: null,
    isOpen: false,
    canCurrentUserSend: false,
    expectedResponder: null,
    unreadCount: 0,
    lastMessage: null,
    messages: [],
    hasMore: false,
    nextAfterSequence: null,
  });
  const onClose = vi.fn();
  const onReject = vi.fn();
  render(
    <ApplicantWorkflowModal
      applicationId="application-1"
      listing={listing}
      onClose={onClose}
      onReject={onReject}
    />,
  );
  await screen.findByRole("dialog", { name: "Maria Schneider" });
  return { onClose, onReject };
}

function overviewSummaryName(label: string) {
  if (label === "Nachrichten") {
    return "Nachrichten Keine ungelesenen Offen öffnen";
  }
  if (label === "Unterlagen") {
    return "Unterlagen Keine Unterlagen Keine neue Anforderung öffnen";
  }
  return "Besichtigung Kein Termin Kein Vorschlag möglich öffnen";
}

function isDisabled(element: HTMLElement) {
  return (
    (element instanceof HTMLButtonElement ||
      element instanceof HTMLInputElement ||
      element instanceof HTMLTextAreaElement) &&
    element.disabled
  );
}

afterEach(() => {
  vi.restoreAllMocks();
  document.body.style.overflow = "";
});

describe("ApplicantWorkflowModal on wide viewports", () => {
  it("renders a labelled modal dialog with the compact applicant identity", async () => {
    await renderModal();

    const dialog = screen.getByRole("dialog", { name: "Maria Schneider" });
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    const descriptionId = dialog.getAttribute("aria-describedby");
    expect(descriptionId).not.toBeNull();
    expect(document.getElementById(descriptionId ?? "")?.textContent).toBe(
      "Wir suchen langfristig eine ruhige Wohnung.",
    );
    expect(screen.getByText("Aktiv")).not.toBeNull();
    expect(
      screen.getByText("2 Personen · aktiv seit 27.09.2026"),
    ).not.toBeNull();
    expect(screen.getByText("2-Zimmer-Wohnung in Berlin-Mitte")).not.toBeNull();
    expect(screen.getByText("2 Zimmer · 60 m²")).not.toBeNull();
    expect(screen.queryByText("Neu")).toBeNull();
    expect(screen.queryByRole("button", { name: "Mehr anzeigen" })).toBeNull();
  });

  it("omits the description link and active-since fact when data is missing", async () => {
    await renderModal(null, null);

    const dialog = screen.getByRole("dialog", { name: "Maria Schneider" });
    expect(dialog.getAttribute("aria-describedby")).toBeNull();
    expect(screen.getByText("2 Personen")).not.toBeNull();
    expect(screen.queryByText(/aktiv seit/)).toBeNull();
    expect(screen.queryByText("Bewerbung aktiv geworden")).toBeNull();
  });

  it("shows the workspace next step without an unavailable checkmark", async () => {
    await renderModal();

    const nextStep = screen.getByRole("region", { name: "Nächster Schritt" });
    const title = within(nextStep).getByText(
      "Aktuell ist nichts von dir zu tun.",
    );
    expect(within(nextStep).getByText("Keine offene Aktion")).not.toBeNull();
    expect(title.parentElement?.className).toContain("flex-col");
    expect(within(nextStep).queryByText("Nichts zu erledigen")).toBeNull();
    expect(nextStep.querySelector(".lucide-check")).toBeNull();
    expect(screen.queryByText("Noch nicht verfügbar")).toBeNull();
  });

  it("renders the connected workflow sections from an empty workspace", async () => {
    await renderModal();

    expect(screen.getByRole("region", { name: "Nachrichten" })).not.toBeNull();
    expect(screen.getByRole("region", { name: "Unterlagen" })).not.toBeNull();
    expect(screen.getByRole("region", { name: "Besichtigung" })).not.toBeNull();
    expect(screen.getByRole("region", { name: "Verlauf" })).not.toBeNull();
    expect(await screen.findByText("Noch keine Nachrichten.")).not.toBeNull();
    expect(screen.getByText("Keine Unterlagen angefordert.")).not.toBeNull();
    expect(screen.getByText("Kein Termin vorgeschlagen.")).not.toBeNull();
    expect(
      screen
        .getByRole("button", { name: "Verlauf" })
        .getAttribute("aria-expanded"),
    ).toBe("false");
    expect(screen.queryByText("Noch kein Verlauf.")).toBeNull();
  });

  it("keeps send and tenant selection disabled until the workspace allows them", async () => {
    await renderModal();

    expect(
      isDisabled(
        screen.getByRole("textbox", { name: "Nachricht an Maria Schneider" }),
      ),
    ).toBe(true);
    expect(isDisabled(screen.getByRole("button", { name: "Senden" }))).toBe(
      true,
    );
    expect(
      isDisabled(screen.getByRole("button", { name: "Als Mieter auswählen" })),
    ).toBe(true);
    expect(screen.queryByRole("checkbox")).toBeNull();
  });

  it("sends one message when the submit control is activated twice", async () => {
    const user = userEvent.setup();
    const workspace = createApplicantWorkspace();
    vi.mocked(getApplicantWorkspace).mockResolvedValue({
      ...workspace,
      conversationSummary: {
        ...workspace.conversationSummary,
        isOpen: true,
        canCurrentUserSend: true,
        expectedResponder: "PROVIDER",
      },
    });
    vi.mocked(getConversationHistory).mockResolvedValue({
      applicationId: "application-1",
      conversationId: null,
      openedAt: null,
      isOpen: true,
      canCurrentUserSend: true,
      expectedResponder: "PROVIDER",
      unreadCount: 0,
      lastMessage: null,
      messages: [],
      hasMore: false,
      nextAfterSequence: null,
    });
    let releaseSend: (() => void) | undefined;
    vi.mocked(sendConversationMessage).mockImplementation(
      () =>
        new Promise((resolve) => {
          releaseSend = () =>
            resolve({
              id: "message-1",
              sequence: 1,
              senderType: "PROVIDER",
              body: "Hallo",
              createdAt: "2026-10-04T11:55:33.790Z",
              readAt: null,
            });
        }),
    );
    render(
      <ApplicantWorkflowModal
        applicationId="application-1"
        listing={listing}
        onClose={vi.fn()}
        onReject={vi.fn()}
      />,
    );
    await screen.findByRole("dialog", { name: "Maria Schneider" });
    await user.type(
      screen.getByRole("textbox", { name: "Nachricht an Maria Schneider" }),
      "Hallo",
    );
    const send = screen.getByRole("button", { name: "Senden" });
    fireEvent.click(send);
    fireEvent.click(send);

    expect(sendConversationMessage).toHaveBeenCalledTimes(1);
    releaseSend?.();
  });

  it("keeps the message draft and shows an error when sending fails", async () => {
    const user = userEvent.setup();
    const workspace = createApplicantWorkspace();
    vi.mocked(getApplicantWorkspace).mockResolvedValue({
      ...workspace,
      conversationSummary: {
        ...workspace.conversationSummary,
        isOpen: true,
        canCurrentUserSend: true,
        expectedResponder: "PROVIDER",
      },
    });
    vi.mocked(sendConversationMessage).mockRejectedValue(new Error("failed"));
    render(
      <ApplicantWorkflowModal
        applicationId="application-1"
        listing={listing}
        onClose={vi.fn()}
        onReject={vi.fn()}
      />,
    );
    const composer = await screen.findByRole("textbox", {
      name: "Nachricht an Maria Schneider",
    });
    await user.type(composer, "Hallo");
    await user.click(screen.getByRole("button", { name: "Senden" }));
    expect(
      await screen.findByText(
        "Die Nachricht konnte nicht gesendet werden. Bitte versuche es erneut.",
      ),
    ).not.toBeNull();
    expect((composer as HTMLTextAreaElement).value).toBe("Hallo");
  });

  it("keeps the document selection when the request fails", async () => {
    mockViewport(false);
    const user = userEvent.setup();
    const workspace = createApplicantWorkspace();
    vi.mocked(getApplicantWorkspace).mockResolvedValue({
      ...workspace,
      documentsSummary: {
        ...workspace.documentsSummary,
        canRequestDocuments: true,
      },
    });
    vi.mocked(createDocumentRequests).mockRejectedValue(new Error("failed"));
    render(
      <ApplicantWorkflowModal
        applicationId="application-1"
        listing={listing}
        onClose={vi.fn()}
        onReject={vi.fn()}
      />,
    );
    await user.click(
      await screen.findByRole("button", { name: "Unterlagen anfordern" }),
    );
    const option = screen.getByRole("checkbox", { name: "SCHUFA-Auskunft" });
    await user.click(option);
    const submit = screen
      .getAllByRole("button", { name: "Unterlagen anfordern" })
      .find(
        (element) =>
          element !==
          screen.getAllByRole("button", { name: "Unterlagen anfordern" })[0],
      );
    if (!submit) throw new Error("Missing document request button");
    await user.click(submit);
    expect(
      await screen.findByText(
        "Die Unterlagen konnten nicht angefordert werden. Bitte versuche es erneut.",
      ),
    ).not.toBeNull();
    expect((option as HTMLInputElement).checked).toBe(true);
  });

  it("sends one viewing proposal when the action is activated twice", async () => {
    mockViewport(false);
    const workspace = createApplicantWorkspace();
    vi.mocked(getApplicantWorkspace).mockResolvedValue({
      ...workspace,
      viewingSummary: { ...workspace.viewingSummary, canPropose: true },
    });
    vi.mocked(proposeViewing).mockImplementation(
      () => new Promise(() => undefined),
    );
    render(
      <ApplicantWorkflowModal
        applicationId="application-1"
        listing={listing}
        onClose={vi.fn()}
        onReject={vi.fn()}
      />,
    );
    const date = await screen.findByLabelText("Datum wählen");
    const time = screen.getByLabelText("Uhrzeit wählen");
    fireEvent.change(date, { target: { value: "2026-11-04" } });
    fireEvent.change(time, { target: { value: "18:00" } });
    const propose = screen.getByRole("button", { name: "Termin vorschlagen" });
    fireEvent.click(propose);
    fireEvent.click(propose);
    expect(proposeViewing).toHaveBeenCalledTimes(1);
  });

  it("keeps the viewing form when the proposal fails", async () => {
    mockViewport(false);
    const user = userEvent.setup();
    const workspace = createApplicantWorkspace();
    vi.mocked(getApplicantWorkspace).mockResolvedValue({
      ...workspace,
      viewingSummary: { ...workspace.viewingSummary, canPropose: true },
    });
    vi.mocked(proposeViewing).mockRejectedValue(new Error("failed"));
    render(
      <ApplicantWorkflowModal
        applicationId="application-1"
        listing={listing}
        onClose={vi.fn()}
        onReject={vi.fn()}
      />,
    );
    const date = await screen.findByLabelText("Datum wählen");
    const time = screen.getByLabelText("Uhrzeit wählen");
    fireEvent.change(date, { target: { value: "2026-11-04" } });
    fireEvent.change(time, { target: { value: "18:00" } });
    await user.click(
      screen.getByRole("button", { name: "Termin vorschlagen" }),
    );
    expect(
      await screen.findByText(
        "Der Termin konnte nicht vorgeschlagen werden. Bitte versuche es erneut.",
      ),
    ).not.toBeNull();
    expect((date as HTMLInputElement).value).toBe("2026-11-04");
    expect((time as HTMLInputElement).value).toBe("18:00");
  });

  it("reuses one viewing request key until the proposal changes", async () => {
    mockViewport(false);
    const user = userEvent.setup();
    const workspace = createApplicantWorkspace();
    vi.mocked(getApplicantWorkspace).mockResolvedValue({
      ...workspace,
      viewingSummary: { ...workspace.viewingSummary, canPropose: true },
    });
    vi.mocked(proposeViewing).mockReset();
    vi.mocked(proposeViewing).mockRejectedValue(new Error("failed"));
    render(
      <ApplicantWorkflowModal
        applicationId="application-1"
        listing={listing}
        onClose={vi.fn()}
        onReject={vi.fn()}
      />,
    );
    const time = await screen.findByLabelText("Uhrzeit wählen");
    fireEvent.change(screen.getByLabelText("Datum wählen"), {
      target: { value: "2026-11-04" },
    });
    fireEvent.change(time, { target: { value: "18:00" } });
    const propose = screen.getByRole("button", { name: "Termin vorschlagen" });
    await user.click(propose);
    expect(
      await screen.findByText(
        "Der Termin konnte nicht vorgeschlagen werden. Bitte versuche es erneut.",
      ),
    ).not.toBeNull();
    await user.click(propose);
    await screen.findByText(
      "Der Termin konnte nicht vorgeschlagen werden. Bitte versuche es erneut.",
    );
    expect(proposeViewing).toHaveBeenCalledTimes(2);
    const firstKey = vi.mocked(proposeViewing).mock.calls[0]?.[2];
    expect(vi.mocked(proposeViewing).mock.calls[1]?.[1]).toEqual(
      vi.mocked(proposeViewing).mock.calls[0]?.[1],
    );
    expect(vi.mocked(proposeViewing).mock.calls[1]?.[2]).toBe(firstKey);
    fireEvent.change(time, { target: { value: "18:30" } });
    await user.click(propose);
    await screen.findByText(
      "Der Termin konnte nicht vorgeschlagen werden. Bitte versuche es erneut.",
    );
    expect(proposeViewing).toHaveBeenCalledTimes(3);
    expect(vi.mocked(proposeViewing).mock.calls[2]?.[1]).toEqual({
      date: "2026-11-04",
      time: "18:30",
    });
    expect(vi.mocked(proposeViewing).mock.calls[2]?.[2]).not.toBe(firstKey);
  });

  it("loads later conversation pages and marks the latest unread message", async () => {
    mockViewport(false);
    const first = {
      id: "message-1",
      sequence: 1,
      senderType: "APPLICANT" as const,
      body: "Erste Nachricht",
      createdAt: "2026-10-04T11:00:00.000Z",
      readAt: null,
    };
    const second = {
      ...first,
      id: "message-2",
      sequence: 2,
      body: "Zweite Nachricht",
      createdAt: "2026-10-04T11:05:00.000Z",
    };
    vi.mocked(getApplicantWorkspace).mockResolvedValue(
      createApplicantWorkspace(),
    );
    vi.mocked(getConversationHistory)
      .mockResolvedValueOnce({
        applicationId: "application-1",
        conversationId: "conversation-1",
        openedAt: "2026-10-04T11:00:00.000Z",
        isOpen: true,
        canCurrentUserSend: true,
        expectedResponder: "PROVIDER",
        unreadCount: 2,
        lastMessage: first,
        messages: [first],
        hasMore: true,
        nextAfterSequence: 1,
      })
      .mockResolvedValueOnce({
        applicationId: "application-1",
        conversationId: "conversation-1",
        openedAt: "2026-10-04T11:00:00.000Z",
        isOpen: true,
        canCurrentUserSend: true,
        expectedResponder: "PROVIDER",
        unreadCount: 2,
        lastMessage: second,
        messages: [second],
        hasMore: false,
        nextAfterSequence: null,
      });
    render(
      <ApplicantWorkflowModal
        applicationId="application-1"
        listing={listing}
        onClose={vi.fn()}
        onReject={vi.fn()}
      />,
    );
    expect(await screen.findByText("Zweite Nachricht")).not.toBeNull();
    expect(screen.getByText("Erste Nachricht")).not.toBeNull();
    await waitFor(() => {
      expect(markConversationRead).toHaveBeenCalledWith("application-1", 2);
    });
  });

  it("asks for confirmation once before selecting the tenant", async () => {
    const user = userEvent.setup();
    const workspace = createApplicantWorkspace();
    vi.mocked(getApplicantWorkspace).mockResolvedValue({
      ...workspace,
      capabilities: { ...workspace.capabilities, canSelectForRental: true },
    });
    let releaseSelect: (() => void) | undefined;
    vi.mocked(selectApplicationForRental).mockImplementation(
      () =>
        new Promise((resolve) => {
          releaseSelect = () => resolve();
        }),
    );
    render(
      <ApplicantWorkflowModal
        applicationId="application-1"
        listing={listing}
        onClose={vi.fn()}
        onReject={vi.fn()}
      />,
    );
    await screen.findByRole("dialog", { name: "Maria Schneider" });
    const select = screen.getByRole("button", { name: "Als Mieter auswählen" });
    expect(isDisabled(select)).toBe(false);
    await user.click(select);
    const confirm = screen.getByRole("button", { name: "Auswählen" });
    fireEvent.click(confirm);
    fireEvent.click(confirm);

    expect(selectApplicationForRental).toHaveBeenCalledTimes(1);
    expect(selectApplicationForRental).toHaveBeenCalledWith(
      "object-1",
      "application-1",
    );
    releaseSelect?.();
  });

  it("does not invent an activity entry when the preview is empty", async () => {
    await renderModal();

    const activity = screen.getByRole("region", { name: "Verlauf" });
    expect(within(activity).queryByRole("listitem")).toBeNull();
    expect(within(activity).queryByText("Noch kein Verlauf.")).toBeNull();
    fireEvent.click(within(activity).getByRole("button", { name: "Verlauf" }));
    expect(within(activity).getByText("Noch kein Verlauf.")).not.toBeNull();
  });

  it("forwards the reject action to the existing rejection flow", async () => {
    const user = userEvent.setup();
    const { onReject } = await renderModal();

    await user.click(
      screen.getByRole("button", { name: "Bewerbung ablehnen" }),
    );

    expect(onReject).toHaveBeenCalledTimes(1);
  });

  it("focuses the close button and closes with it", async () => {
    const user = userEvent.setup();
    const { onClose } = await renderModal();

    const closeButton = screen.getByRole("button", { name: "Schließen" });
    expect(document.activeElement).toBe(closeButton);
    await user.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes on Escape and locks page scrolling while open", async () => {
    const user = userEvent.setup();
    const { onClose } = await renderModal();

    expect(document.body.style.overflow).toBe("hidden");
    await user.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("keeps keyboard focus inside the dialog", async () => {
    const user = userEvent.setup();
    await renderModal();

    await user.tab({ shift: true });

    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Bewerbung ablehnen" }),
    );
    await user.tab();
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Schließen" }),
    );
  });
});

describe("ApplicantWorkflowModal on compact viewports", () => {
  it("expands the complete introduction with accessible keyboard controls", async () => {
    const user = userEvent.setup();
    mockViewport(true);
    const introduction =
      "Wir suchen eine ruhige Wohnung. ".repeat(40) + "Ende der Vorstellung.";
    await renderModal(introduction);
    const toggle = screen.getByRole("button", { name: "Mehr anzeigen" });
    const text = document.getElementById(
      toggle.getAttribute("aria-controls") ?? "",
    );
    expect(text?.textContent).toBe(introduction);
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(text?.tabIndex).toBe(-1);
    toggle.focus();
    await user.keyboard("{Enter}");
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(toggle.textContent).toBe("Weniger anzeigen");
    expect(text?.getAttribute("aria-label")).toBeNull();
    expect(text?.textContent).toBe(introduction);
    expect(document.activeElement).toBe(toggle);
    expect(text?.tabIndex).toBe(0);
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(text);
    await user.tab();
    await user.keyboard(" ");
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(text?.tabIndex).toBe(-1);
    expect(document.activeElement).toBe(toggle);
    expect(
      screen
        .getByRole("tab", { name: "Übersicht" })
        .getAttribute("aria-selected"),
    ).toBe("true");
  });

  it("omits introduction controls when the introduction is absent", async () => {
    mockViewport(true);
    await renderModal(null);
    expect(screen.queryByRole("button", { name: "Mehr anzeigen" })).toBeNull();
  });

  it.each([
    ["Nachrichten", "Chat"],
    ["Unterlagen", "Unterlagen"],
    ["Besichtigung", "Termin"],
  ])(
    "moves focus from the %s summary to its selected tab",
    async (label, tabName) => {
      const user = userEvent.setup();
      mockViewport(true);
      await renderModal();
      const summaryButton = screen.getByRole("button", {
        name: overviewSummaryName(label),
      });
      summaryButton.focus();
      await user.keyboard("{Enter}");
      const tab = screen.getByRole("tab", { name: tabName });
      const panel = screen.getByRole("tabpanel");
      expect(document.activeElement).toBe(tab);
      expect(tab.getAttribute("aria-selected")).toBe("true");
      expect(tab.getAttribute("aria-controls")).toBe(panel.id);
      expect(panel.getAttribute("aria-labelledby")).toBe(tab.id);
      expect(summaryButton.closest("[hidden]")).not.toBeNull();
      await user.tab();
      expect(document.activeElement).toBe(panel);
      await user.tab();
      expect(document.activeElement).toBe(
        screen.getByRole("button", { name: "Schließen" }),
      );
      await user.tab({ shift: true });
      expect(document.activeElement).toBe(panel);
    },
  );

  it("wraps focus in the overview without including inactive panels", async () => {
    const user = userEvent.setup();
    mockViewport(true);
    await renderModal();
    const close = screen.getByRole("button", { name: "Schließen" });
    const reject = screen.getByRole("button", { name: "Bewerbung ablehnen" });
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(reject);
    await user.tab();
    expect(document.activeElement).toBe(close);
  });

  it("renders the mobile tabs with the overview selected", async () => {
    mockViewport(true);
    await renderModal();

    const tabs = screen.getAllByRole("tab");
    expect(tabs.map((tab) => tab.textContent)).toEqual([
      "Übersicht",
      "Chat",
      "Unterlagen",
      "Termin",
    ]);
    expect(tabs[0]!.getAttribute("aria-selected")).toBe("true");
    expect(
      within(screen.getByRole("tabpanel")).getByRole("button", {
        name: "Bewerbung ablehnen",
      }),
    ).not.toBeNull();
  });

  it("moves between tabs with the arrow keys", async () => {
    const user = userEvent.setup();
    mockViewport(true);
    await renderModal();

    screen.getByRole("tab", { name: "Übersicht" }).focus();
    await user.keyboard("{ArrowRight}");

    const chatTab = screen.getByRole("tab", { name: "Chat" });
    expect(chatTab.getAttribute("aria-selected")).toBe("true");
    expect(document.activeElement).toBe(chatTab);
    expect(
      within(screen.getByRole("tabpanel")).getByText("Keine ungelesenen"),
    ).not.toBeNull();
    expect(
      isDisabled(
        screen.getByRole("textbox", { name: "Nachricht an Maria Schneider" }),
      ),
    ).toBe(true);
    expect(isDisabled(screen.getByRole("button", { name: "Senden" }))).toBe(
      true,
    );
  });

  it("opens a section tab from the overview summary", async () => {
    const user = userEvent.setup();
    mockViewport(true);
    await renderModal();

    await user.click(
      screen.getByRole("button", { name: overviewSummaryName("Unterlagen") }),
    );

    expect(
      screen
        .getByRole("tab", { name: "Unterlagen" })
        .getAttribute("aria-selected"),
    ).toBe("true");
    expect(
      isDisabled(screen.getByRole("button", { name: "Unterlagen anfordern" })),
    ).toBe(true);
  });

  it("keeps the reject action reachable on the overview", async () => {
    const user = userEvent.setup();
    mockViewport(true);
    const { onReject } = await renderModal();
    const dialog = screen.getByRole("dialog", { name: "Maria Schneider" });
    const scroller = dialog.querySelector(":scope > .overflow-y-auto");
    const reject = screen.getByRole("button", { name: "Bewerbung ablehnen" });

    expect(scroller).not.toBeNull();
    expect(scroller?.contains(reject)).toBe(true);
    expect(
      scroller?.contains(
        screen.getByRole("heading", { name: "Maria Schneider" }),
      ),
    ).toBe(true);
    expect(
      scroller?.contains(screen.getByRole("button", { name: "Schließen" })),
    ).toBe(false);

    await user.click(reject);

    expect(onReject).toHaveBeenCalledTimes(1);
  });
});

function pendingIdentityWorkspace(flags: {
  readonly canCancel: boolean;
  readonly canRequestReplacement: boolean;
}) {
  const workspace = createApplicantWorkspace();
  return {
    ...workspace,
    documentsSummary: {
      ...workspace.documentsSummary,
      canRequestDocuments: true,
      currentRequests: [
        {
          requestId: "request-1",
          type: "IDENTITY_DOCUMENT",
          customLabel: null,
          status: "UPLOAD_REQUIRED" as const,
          documentId: null,
          canDownload: false,
          canReview: false,
          canCancel: flags.canCancel,
          canRequestReplacement: flags.canRequestReplacement,
        },
      ],
    },
  };
}

describe("document request cancellation", () => {
  beforeEach(() => {
    mockViewport(false);
  });

  it("shows removal only when the workspace allows it and hides replacement for a pending upload", async () => {
    vi.mocked(getApplicantWorkspace).mockResolvedValue(
      pendingIdentityWorkspace({
        canCancel: true,
        canRequestReplacement: false,
      }),
    );
    render(
      <ApplicantWorkflowModal
        applicationId="application-1"
        listing={listing}
        onClose={vi.fn()}
        onReject={vi.fn()}
      />,
    );
    expect(
      await screen.findByRole("button", {
        name: "Anfrage entfernen: Personalausweis",
      }),
    ).not.toBeNull();
    expect(
      screen.queryByRole("button", { name: "Ersatz anfordern" }),
    ).toBeNull();
    const action = screen.getByRole("button", {
      name: "Anfrage entfernen: Personalausweis",
    });
    expect(action.querySelector("svg")).not.toBeNull();
    expect(action.textContent).toBe("");
    expect(action.className).toContain("h-7");
    expect(action.className).toContain("w-7");
    const user = userEvent.setup();
    await user.hover(action);
    expect((await screen.findByRole("tooltip")).textContent).toBe(
      "Anfrage entfernen",
    );
  });

  it("hides cancellation when canCancel is false", async () => {
    vi.mocked(getApplicantWorkspace).mockResolvedValue(
      pendingIdentityWorkspace({
        canCancel: false,
        canRequestReplacement: false,
      }),
    );
    render(
      <ApplicantWorkflowModal
        applicationId="application-1"
        listing={listing}
        onClose={vi.fn()}
        onReject={vi.fn()}
      />,
    );
    await screen.findByText("Personalausweis");
    expect(
      screen.queryByRole("button", { name: /Anfrage entfernen/ }),
    ).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Ersatz anfordern" }),
    ).toBeNull();
  });

  it("confirms once, refreshes the workspace, and keeps the row when cancellation fails", async () => {
    const user = userEvent.setup();
    const pending = pendingIdentityWorkspace({
      canCancel: true,
      canRequestReplacement: false,
    });
    const cleared = createApplicantWorkspace();
    vi.mocked(getApplicantWorkspace)
      .mockResolvedValueOnce(pending)
      .mockResolvedValue({
        ...cleared,
        documentsSummary: {
          ...cleared.documentsSummary,
          canRequestDocuments: true,
        },
      });
    let release: (() => void) | undefined;
    vi.mocked(cancelDocumentRequest).mockImplementation(
      () =>
        new Promise((resolve) => {
          release = () => resolve();
        }),
    );
    render(
      <ApplicantWorkflowModal
        applicationId="application-1"
        listing={listing}
        onClose={vi.fn()}
        onReject={vi.fn()}
      />,
    );
    await user.click(
      await screen.findByRole("button", {
        name: "Anfrage entfernen: Personalausweis",
      }),
    );
    const confirm = screen.getByRole("button", {
      name: (accessibleName) => accessibleName === "Anfrage entfernen",
    });
    fireEvent.click(confirm);
    fireEvent.click(confirm);
    expect(cancelDocumentRequest).toHaveBeenCalledTimes(1);
    expect(cancelDocumentRequest).toHaveBeenCalledWith(
      "application-1",
      "request-1",
    );
    expect(screen.getByText("Personalausweis")).not.toBeNull();
    release?.();
    await waitFor(() => {
      expect(screen.queryByText("Personalausweis")).toBeNull();
    });
    expect(
      vi.mocked(getApplicantWorkspace).mock.calls.length,
    ).toBeGreaterThanOrEqual(2);
    await waitFor(() => {
      expect(document.activeElement?.getAttribute("tabindex")).toBe("-1");
    });
  });

  it("keeps the request visible when cancellation fails", async () => {
    const user = userEvent.setup();
    vi.mocked(getApplicantWorkspace).mockResolvedValue(
      pendingIdentityWorkspace({
        canCancel: true,
        canRequestReplacement: true,
      }),
    );
    vi.mocked(cancelDocumentRequest).mockRejectedValue(new Error("failed"));
    render(
      <ApplicantWorkflowModal
        applicationId="application-1"
        listing={listing}
        onClose={vi.fn()}
        onReject={vi.fn()}
      />,
    );
    await user.click(
      await screen.findByRole("button", {
        name: "Anfrage entfernen: Personalausweis",
      }),
    );
    const confirm = screen.getByRole("button", {
      name: (accessibleName) => accessibleName === "Anfrage entfernen",
    });
    await user.click(confirm);
    expect(
      await screen.findByText("Die Anfrage konnte nicht entfernt werden."),
    ).not.toBeNull();
    expect(screen.getByText("Personalausweis")).not.toBeNull();
    expect(
      screen.getByRole("button", { name: "Ersatz anfordern" }),
    ).not.toBeNull();
  });

  it("names the confirmation close control separately from the remove action", async () => {
    const user = userEvent.setup();
    vi.mocked(cancelDocumentRequest).mockClear();
    vi.mocked(getApplicantWorkspace).mockResolvedValue(
      pendingIdentityWorkspace({
        canCancel: true,
        canRequestReplacement: false,
      }),
    );
    render(
      <ApplicantWorkflowModal
        applicationId="application-1"
        listing={listing}
        onClose={vi.fn()}
        onReject={vi.fn()}
      />,
    );
    await user.click(
      await screen.findByRole("button", {
        name: "Anfrage entfernen: Personalausweis",
      }),
    );
    const dialog = screen.getByRole("dialog", { name: "Anfrage entfernen?" });
    const close = within(dialog).getByRole("button", {
      name: "Dialog schließen",
    });
    const remove = within(dialog).getByRole("button", {
      name: (accessibleName) => accessibleName === "Anfrage entfernen",
    });
    expect(remove.textContent).toBe("Entfernen");
    expect(remove.className).toContain("bg-primary");
    expect(close.getAttribute("aria-label")).toBe("Dialog schließen");
    expect(document.activeElement).toBe(close);
    await user.tab();
    expect(document.activeElement).toBe(remove);
    await user.keyboard("{Escape}");
    expect(
      screen.queryByRole("dialog", { name: "Anfrage entfernen?" }),
    ).toBeNull();
    expect(
      screen.getByRole("dialog", { name: "Maria Schneider" }),
    ).not.toBeNull();
    expect(cancelDocumentRequest).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", {
        name: "Anfrage entfernen: Personalausweis",
      }),
    ).not.toBeNull();
  });

  it("highlights a selected document option without hiding the checkbox", async () => {
    const user = userEvent.setup();
    const workspace = createApplicantWorkspace();
    vi.mocked(getApplicantWorkspace).mockResolvedValue({
      ...workspace,
      documentsSummary: {
        ...workspace.documentsSummary,
        canRequestDocuments: true,
      },
    });
    render(
      <ApplicantWorkflowModal
        applicationId="application-1"
        listing={listing}
        onClose={vi.fn()}
        onReject={vi.fn()}
      />,
    );
    await screen.findByRole("dialog", { name: "Maria Schneider" });
    await user.click(
      screen.getByRole("button", { name: "Unterlagen anfordern" }),
    );
    const option = screen.getByRole("checkbox", { name: "SCHUFA-Auskunft" });
    expect(option.closest("label")?.className).toContain("bg-primary/10");
    const income = screen.getByRole("checkbox", { name: "Einkommensnachweis" });
    expect(income.closest("label")?.className).toContain("bg-success/10");
    const identity = screen.getByRole("checkbox", { name: "Personalausweis" });
    expect(identity.closest("label")?.className).toContain(
      "bg-exit-provider-discarded-bg/50",
    );
    const insurance = screen.getByRole("checkbox", {
      name: "Privathaftpflichtversicherung",
    });
    expect(insurance.closest("label")?.className).toContain("bg-warning/10");
    const other = screen.getByRole("checkbox", { name: "Sonstiges" });
    expect(other.closest("label")?.className).toContain("bg-queue-4/10");
    await user.click(option);
    expect(option.closest("label")?.className).toContain("bg-primary/20");
    expect(option.closest("label")?.className).toContain("border-primary");
    expect((option as HTMLInputElement).checked).toBe(true);
  });
});

describe("activity list collapse", () => {
  beforeEach(() => {
    mockViewport(false);
  });

  it("returns to the short preview with Weniger anzeigen", async () => {
    const user = userEvent.setup();
    const workspace = createApplicantWorkspace();
    vi.mocked(getApplicantWorkspace).mockResolvedValue({
      ...workspace,
      activityPreview: {
        hasMore: true,
        items: [
          {
            id: "activity-1",
            type: "DOCUMENT_REQUESTED",
            actorType: "PROVIDER",
            occurredAt: "2026-10-04T11:58:44.072Z",
            payload: { documentType: "SCHUFA", requestId: "request-1" },
          },
        ],
      },
    });
    vi.mocked(getActivityPage).mockResolvedValue({
      asOf: "2026-10-04T12:00:00.000Z",
      items: [
        {
          id: "activity-1",
          type: "DOCUMENT_REQUESTED",
          actorType: "PROVIDER",
          occurredAt: "2026-10-04T11:58:44.072Z",
          payload: { documentType: "SCHUFA", requestId: "request-1" },
        },
        {
          id: "activity-2",
          type: "APPLICATION_SUBMITTED",
          actorType: "APPLICANT",
          occurredAt: "2026-10-04T11:00:00.000Z",
          payload: null,
        },
      ],
      pagination: { hasMore: false, limit: 20, nextCursor: null },
      totalCount: 2,
    });
    render(
      <ApplicantWorkflowModal
        applicationId="application-1"
        listing={listing}
        onClose={vi.fn()}
        onReject={vi.fn()}
      />,
    );
    const activity = await screen.findByRole("region", { name: "Verlauf" });
    await user.click(within(activity).getByRole("button", { name: "Verlauf" }));
    await user.click(
      within(activity).getByRole("button", { name: "Alle anzeigen" }),
    );
    expect(
      await within(activity).findByText(
        "Maria Schneider · Bewerbung eingereicht",
      ),
    ).not.toBeNull();
    await user.click(
      within(activity).getByRole("button", { name: "Weniger anzeigen" }),
    );
    expect(
      within(activity).queryByText("Maria Schneider · Bewerbung eingereicht"),
    ).toBeNull();
    expect(
      within(activity).getByText("Du · SCHUFA-Auskunft angefordert"),
    ).not.toBeNull();
    expect(
      within(activity).getByRole("button", { name: "Weitere anzeigen" }),
    ).not.toBeNull();
  });

  it("reloads the open activity list when the workspace changes", async () => {
    const user = userEvent.setup();
    const workspace = {
      ...createApplicantWorkspace(),
      activityPreview: {
        hasMore: true,
        items: [
          {
            id: "activity-1",
            type: "DOCUMENT_REQUESTED" as const,
            actorType: "PROVIDER" as const,
            occurredAt: "2026-10-04T11:58:44.072Z",
            payload: {
              documentType: "SCHUFA" as const,
              requestId: "request-1",
            },
          },
        ],
      },
    };
    const page = {
      asOf: "2026-10-04T12:00:00.000Z",
      items: workspace.activityPreview.items,
      pagination: { hasMore: false, limit: 20, nextCursor: null },
      totalCount: 1,
    };
    const refreshed = {
      ...page,
      asOf: "2026-10-04T12:30:00.000Z",
      items: [
        {
          id: "activity-2",
          type: "MESSAGE_SENT" as const,
          actorType: "PROVIDER" as const,
          occurredAt: "2026-10-04T12:20:00.000Z",
          payload: null,
        },
        ...page.items,
      ],
      totalCount: 2,
    };
    let activityLoads = 0;
    vi.mocked(getActivityPage).mockImplementation(async () => {
      activityLoads += 1;
      return activityLoads === 1 ? page : refreshed;
    });
    const { rerender } = render(<ActivityHarness workspace={workspace} />);
    const activity = await screen.findByRole("region", { name: "Verlauf" });
    await user.click(within(activity).getByRole("button", { name: "Verlauf" }));
    await user.click(
      within(activity).getByRole("button", { name: "Alle anzeigen" }),
    );
    expect(
      await within(activity).findByText("Du · SCHUFA-Auskunft angefordert"),
    ).not.toBeNull();
    rerender(
      <ActivityHarness
        workspace={{ ...workspace, asOf: "2026-10-04T12:30:00.000Z" }}
      />,
    );
    expect(
      await within(activity).findByText("Du · Nachricht gesendet"),
    ).not.toBeNull();
    expect(getActivityPage.mock.calls.length).toBeGreaterThanOrEqual(2);
  });
});

function ActivityFromSession() {
  const session = useWorkflowSession();
  return <ActivitySection model={session.model} />;
}

function ActivityHarness({
  workspace,
}: {
  readonly workspace: ApplicantWorkspace;
}) {
  return (
    <WorkflowSession
      workspace={workspace}
      listing={listing}
      reloadWorkspace={() => undefined}
    >
      <ActivityFromSession />
    </WorkflowSession>
  );
}
