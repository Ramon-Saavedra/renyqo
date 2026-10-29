import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadCompleteConversation } from "../../api/conversation";
import type * as conversationApi from "../../api/conversation";
import type * as documentsApi from "../../api/documents";
import type * as viewingsApi from "../../api/viewings";
import { getApplicantWorkspace } from "../../api/workspace";
import type * as workspaceApi from "../../api/workspace";
import {
  APPLICATION_ID,
  createWorkspace,
  loadedConversation,
  message,
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
      hasMessages: false,
      canCurrentUserSend: false,
      applicantRepliesEnabled: false,
      canCurrentUserManageApplicantReplies: false,
      sendBlockReason: "LIFECYCLE_READ_ONLY",
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

function mockViewport(compact: boolean) {
  vi.spyOn(window, "matchMedia").mockImplementation((query: string) => ({
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

function renderWorkspace() {
  vi.mocked(getApplicantWorkspace).mockResolvedValue(createWorkspace());
  return render(<ApplicationWorkspace applicationId={APPLICATION_ID} />);
}

beforeEach(() => {
  vi.clearAllMocks();
  document.documentElement.style.overflow = "";
  window.history.replaceState(
    {},
    "",
    `/applicant/applications/${APPLICATION_ID}`,
  );
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  document.documentElement.style.overflow = "";
});

describe("ApplicationWorkspace mobile chat", () => {
  it("opens a dedicated chat from the Nachrichten entry and closes back to the workspace", async () => {
    const user = userEvent.setup();
    mockViewport(true);
    renderWorkspace();

    await screen.findByRole("region", { name: "Unterlagen" });
    expect(screen.queryByRole("button", { name: "Chat schließen" })).toBeNull();
    expect(
      screen.queryByRole("checkbox", { name: "Antworten erlauben" }),
    ).toBeNull();

    await user.click(
      screen.getByRole("button", { name: "Nachrichten öffnen" }),
    );

    const chat = screen.getByRole("region", { name: "Anbieter" });
    expect(chat.className).toContain("100dvh");
    expect(chat.className).toContain("top-app-topbar");
    expect(
      screen.getByRole("log", { name: "Nachrichtenverlauf mit dem Anbieter" })
        .className,
    ).toContain("scrollbar-slim");
    expect(screen.queryByRole("region", { name: "Unterlagen" })).toBeNull();
    expect(window.location.pathname).toBe(
      `/applicant/applications/${APPLICATION_ID}`,
    );

    await user.click(screen.getByRole("button", { name: "Chat schließen" }));

    expect(screen.queryByRole("button", { name: "Chat schließen" })).toBeNull();
    expect(screen.getByRole("region", { name: "Unterlagen" })).toBeInstanceOf(
      HTMLElement,
    );
    expect(
      screen.getByRole("button", { name: "Nachrichten öffnen" }),
    ).toBeInstanceOf(HTMLElement);
    expect(window.location.pathname).toBe(
      `/applicant/applications/${APPLICATION_ID}`,
    );
  });

  it("opens a messages deep link on the latest message and restores it after refresh", async () => {
    mockViewport(true);
    window.history.replaceState(
      {},
      "",
      `/applicant/applications/${APPLICATION_ID}?section=messages`,
    );
    let resolveLoad: (
      value: ReturnType<typeof loadedConversation>,
    ) => void = () => undefined;
    vi.mocked(loadCompleteConversation).mockReturnValue(
      new Promise((resolve) => {
        resolveLoad = resolve;
      }),
    );
    const view = renderWorkspace();

    const log = await screen.findByRole("log", {
      name: "Nachrichtenverlauf mit dem Anbieter",
    });
    Object.defineProperty(log, "scrollHeight", {
      configurable: true,
      value: 1000,
    });
    Object.defineProperty(log, "clientHeight", {
      configurable: true,
      value: 300,
    });
    resolveLoad(
      loadedConversation([
        message(1, "APPLICANT", "Erste Nachricht", "2026-10-01T08:01:00.000Z"),
        message(2, "PROVIDER", "Letzte Nachricht", "2026-10-01T09:01:00.000Z"),
      ]),
    );

    expect(await screen.findByText("Letzte Nachricht")).toBeInstanceOf(
      HTMLElement,
    );
    expect(log.scrollTop).toBe(1000);
    expect(
      screen.getByRole("textbox", { name: "Antwort an den Anbieter" }),
    ).toBeInstanceOf(HTMLElement);
    expect(
      screen.queryByRole("checkbox", { name: "Antworten erlauben" }),
    ).toBeNull();
    expect(screen.getAllByRole("log")).toHaveLength(1);
    expect(screen.queryByRole("region", { name: "Unterlagen" })).toBeNull();

    view.unmount();
    vi.mocked(loadCompleteConversation).mockResolvedValue(
      loadedConversation([
        message(2, "PROVIDER", "Letzte Nachricht", "2026-10-01T09:01:00.000Z"),
      ]),
    );
    renderWorkspace();
    expect(
      await screen.findByRole("button", { name: "Chat schließen" }),
    ).toBeInstanceOf(HTMLElement);
    expect(await screen.findByText("Letzte Nachricht")).toBeInstanceOf(
      HTMLElement,
    );
    expect(window.location.search).toContain("section=messages");
  });

  it("keeps the page chat on wide viewports", async () => {
    mockViewport(false);
    window.history.replaceState(
      {},
      "",
      `/applicant/applications/${APPLICATION_ID}?section=messages`,
    );
    renderWorkspace();

    const messages = await screen.findByRole("region", { name: "Nachrichten" });
    expect(messages.className).toContain("order-1");
    expect(messages.className).not.toContain("100dvh");
    expect(messages.querySelector(".h-96")).toBeInstanceOf(HTMLElement);
    expect(screen.queryByRole("button", { name: "Chat schließen" })).toBeNull();
    expect(screen.getByRole("region", { name: "Unterlagen" })).toBeInstanceOf(
      HTMLElement,
    );
  });
});
